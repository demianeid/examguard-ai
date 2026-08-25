"""
myproject_backend.hardware.frame_dispatcher.dispatcher
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Phase 2 — Frame Dispatcher (Pipeline skeleton IMPLEMENTED)

Responsibilities
----------------
1.  For each active ``StreamSession`` / ``Camera`` pair, open an RTSP
    stream via ``RtspReader``.
2.  At the configured sample rate, grab the latest frame and encode it
    to base64 JPEG.
3.  Load ``StudentZone`` ROI coords for the active exam + camera from
    the Django API (or directly from the DB when running in-process).
4.  POST the payload ``{frame, zones, exam_id, session_id}`` to the
    RunPod endpoint.
5.  Parse the response and POST each alert to Django's
    ``/api/alerts/`` endpoint.

This module is the **Celery task wrapper** for Phase 5.  In Phase 2 the
``dispatch_once()`` function can be called directly for local testing.

Environment variables (loaded from .env or Django settings)
------------------------------------------------------------
RUNPOD_ENDPOINT             https://api.runpod.ai/v2/<ENDPOINT_ID>/runsync
DJANGO_API_URL              https://your-backend.com/api
DJANGO_API_TOKEN            Token <service_token>
ALERT_CONFIDENCE_THRESHOLD  0.6  (floats below this are dropped)
FRAME_JPEG_QUALITY          85   (1–100, lower = faster)
FRAME_SAMPLE_RATE           2    (fps)
"""

from __future__ import annotations

import logging
import io
import os
import time
from typing import Any, Optional

import numpy as np
import requests
from django.conf import settings
from hardware.ai_engine.zone_processor import encode_frame, crop_zones
from .rtsp_reader import RtspReader, RtspReaderError

logger = logging.getLogger(__name__)

# ── Config (overridden by env vars or Django settings) ────────────────────────
RUNPOD_ENDPOINT:            str   = getattr(settings, "RUNPOD_ENDPOINT", os.getenv("RUNPOD_ENDPOINT", ""))
DJANGO_API_URL:             str   = getattr(settings, "DJANGO_API_URL", os.getenv("DJANGO_API_URL", "http://localhost:8000/api"))
DJANGO_API_TOKEN:           str   = getattr(settings, "DJANGO_API_TOKEN", os.getenv("DJANGO_API_TOKEN", ""))
ALERT_CONFIDENCE_THRESHOLD: float = float(getattr(settings, "ALERT_CONFIDENCE_THRESHOLD", os.getenv("ALERT_CONFIDENCE_THRESHOLD", "0.6")))
FRAME_JPEG_QUALITY:         int   = int(getattr(settings, "FRAME_JPEG_QUALITY", os.getenv("FRAME_JPEG_QUALITY", "85")))
FRAME_SAMPLE_RATE:          float = float(getattr(settings, "FRAME_SAMPLE_RATE", os.getenv("FRAME_SAMPLE_RATE", "2")))

# Alert types to suppress at the dispatcher level (comma-separated env var).
# Use this to block noisy false-positive alert types without redeploying RunPod.
# Example: SUPPRESSED_ALERT_TYPES=no_face,head_movement
_suppressed_env = os.getenv("SUPPRESSED_ALERT_TYPES", "")
SUPPRESSED_ALERT_TYPES: set = {t.strip() for t in _suppressed_env.split(",") if t.strip()}

# Timeout for RunPod /runsync calls (seconds)
RUNPOD_REQUEST_TIMEOUT: int = 120

# ── Local AI Fallback (Singleton) ───────────────────────────────────────────
_LOCAL_FACE_CASCADE = None

def _get_local_face_cascade():
    global _LOCAL_FACE_CASCADE
    if _LOCAL_FACE_CASCADE is None:
        try:
            import cv2
            path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            _LOCAL_FACE_CASCADE = cv2.CascadeClassifier(path)
            if _LOCAL_FACE_CASCADE.empty():
                logger.warning("Local Haar cascade is empty at %s", path)
        except Exception as exc:
            logger.error("Failed to load local face cascade: %s", exc)
    return _LOCAL_FACE_CASCADE

# ── Helpers ───────────────────────────────────────────────────────────────────

def _auth_headers() -> dict[str, str]:
    """Build Django API auth headers."""
    return {
        "Authorization": f"Token {DJANGO_API_TOKEN}",
        "Content-Type":  "application/json",
    }


def _fetch_zones(exam_id: int, camera_id: int) -> list[dict[str, Any]]:
    """
    Fetch ``StudentZone`` records for *exam_id* + *camera_id* from Django API.

    Returns a list of zone dicts shaped:
        [{"id": …, "student_code": …, "student_name": …,
          "x1": …, "y1": …, "x2": …, "y2": …}, …]

    Falls back to an empty list on error so the dispatcher can continue
    (alerts will just not be generated for that cycle).
    """
    try:
        from hardware.offline_monitoring.models import StudentZone
        zones_qs = StudentZone.objects.filter(hall__offline_exams__id=exam_id, camera_id=camera_id)
        zones = [
            {
                "id":           z.id,
                "student_name": z.dynamic_student_name,
                "student_code": z.student_code,
                "seat_number":  z.dynamic_seat_number,
                "x1": z.x1,
                "y1": z.y1,
                "x2": z.x2,
                "y2": z.y2,
            } for z in zones_qs
        ]
        logger.info(
            "Fetched %d zone(s) for exam=%s camera=%s. Coords: %s",
            len(zones), exam_id, camera_id,
            [(z["student_code"], z["x1"], z["y1"], z["x2"], z["y2"]) for z in zones],
        )
        return zones
    except Exception as exc:
        logger.error("Failed to fetch zones locally (exam=%s, cam=%s): %s", exam_id, camera_id, exc)
        return []


def _run_local_inference(frame: np.ndarray, zones: list[dict]) -> Optional[dict]:
    """
    Passes raw frame and zones to the local AI pipeline, bypassing RunPod entirely.
    """
    try:
        from hardware.ai_engine.zone_processor import process_frame
        results = process_frame(frame_b64=None, zones=zones, frame_raw=frame)
        print(f"🔥 LOCAL AI RESULTS: {results}")
        return {"status": "ok", "output": {"results": results}}
    except Exception as exc:
        logger.error("Local inference failed: %s", exc)
        return None


def _post_alerts(
    results:    list[dict],
    session_id: int,
    exam_id:    Optional[int] = None,
    ws_push_fn: Optional[Any] = None,
    frame:      Optional[Any] = None,   # raw numpy BGR frame for snapshot
) -> list[dict]:
    """
    For each alert in *results*, POST to Django's ``/api/alerts/`` endpoint.

    Filters out alerts below ``ALERT_CONFIDENCE_THRESHOLD``.

    If *ws_push_fn* is provided it is called with (exam_id, alert_payload)
    for every successfully created alert, allowing the Celery task to push
    the alert to the WebSocket channel layer in real time.

    Returns a list of the payloads that were successfully posted.
    """
    posted = []

    # Import locally to avoid circular imports if any
    from hardware.ai_detection.models import Alert
    from hardware.ai_detection.serializers import AlertSerializer

    for zone_result in results:
        zone_id = zone_result.get("zone_id")
        zone_alerts = zone_result.get("alerts", [])
        
        # 🔥 DEBUG LOG: Print what RunPod actually saw for this zone!
        if zone_alerts:
            logger.info("🔥 [RAW RUNPOD ALERTS for zone %s]: %s", zone_id, zone_alerts)
        else:
            logger.info("🔥 [RAW RUNPOD ALERTS for zone %s]: No alerts returned by AI.", zone_id)

        for alert in zone_alerts:
            alert_type = alert.get("type", "")
            confidence  = float(alert.get("confidence", 1.0))

            # Skip suppressed alert types (configurable via SUPPRESSED_ALERT_TYPES env var)
            if alert_type in SUPPRESSED_ALERT_TYPES:
                logger.debug("Alert type '%s' suppressed by SUPPRESSED_ALERT_TYPES — skipped.", alert_type)
                continue

            if confidence < ALERT_CONFIDENCE_THRESHOLD:
                logger.debug(
                    "Alert %s confidence %.2f below threshold — skipped.",
                    alert_type, confidence,
                )
                continue

            try:
                import cv2
                from django.core.files.base import ContentFile

                # Build snapshot: crop the zone ROI from the frame
                snapshot_file = None
                roi = zone_result.get("roi")
                if frame is not None and roi:
                    try:
                        x1, y1, x2, y2 = int(roi["x1"]), int(roi["y1"]), int(roi["x2"]), int(roi["y2"])
                        h, w = frame.shape[:2]
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(w, x2), min(h, y2)
                        if x2 > x1 and y2 > y1:
                            crop = frame[y1:y2, x1:x2]
                            _, buf = cv2.imencode(".jpg", crop, [cv2.IMWRITE_JPEG_QUALITY, 75])
                            snapshot_file = ContentFile(buf.tobytes(), name=f"snap_zone{zone_id}_{alert_type}.jpg")
                    except Exception as snap_exc:
                        logger.warning("Snapshot crop failed for zone %s: %s", zone_id, snap_exc)

                # 1. Save directly to DB via ORM
                alert_obj = Alert.objects.create(
                    session_id=session_id,
                    zone_id=zone_id,
                    alert_type=alert.get("type"),
                    severity=alert.get("severity", "medium")
                )

                # Attach snapshot separately (ImageField save)
                if snapshot_file:
                    alert_obj.snapshot.save(snapshot_file.name, snapshot_file, save=True)
                
                # 2. Serialize so the payload structure matches what the frontend expects
                serializer = AlertSerializer(alert_obj)
                created = dict(serializer.data)
                
                # We inject confidence into the dictionary because it's not a DB field, 
                # but the frontend might want it for UI display.
                created["confidence"] = confidence

                logger.info(
                    "Alert saved to DB: zone=%s type=%s conf=%.2f",
                    zone_id, alert.get("type"), confidence,
                )
                posted.append(created)

                # Push to WebSocket in real time
                if ws_push_fn and exam_id is not None:
                    ws_push_fn(exam_id, created)

            except Exception as exc:
                logger.error("Failed to save alert to DB for zone %s: %s", zone_id, exc)

    return posted


_ACTIVE_READERS = {}

def get_or_create_reader(stream_url: str, camera_id: int, fps: float) -> RtspReader:
    global _ACTIVE_READERS
    if camera_id not in _ACTIVE_READERS:
        logger.info("Creating new persistent RtspReader for camera %s", camera_id)
        reader = RtspReader(stream_url=stream_url, fps=fps, camera_id=camera_id)
        reader.start(threaded=True)
        _ACTIVE_READERS[camera_id] = reader
    elif _ACTIVE_READERS[camera_id].stream_url != stream_url:
        logger.info("Stream URL changed for camera %s. Recreating reader.", camera_id)
        _ACTIVE_READERS[camera_id].stop()
        reader = RtspReader(stream_url=stream_url, fps=fps, camera_id=camera_id)
        reader.start(threaded=True)
        _ACTIVE_READERS[camera_id] = reader

    return _ACTIVE_READERS[camera_id]

# ── Core dispatch function ────────────────────────────────────────────────────

def dispatch_once(
    stream_url: str,
    exam_id:    int,
    camera_id:  int,
    session_id: int,
    fps:        float = FRAME_SAMPLE_RATE,
    ws_push_fn: Optional[Any] = None,
) -> bool:
    """
    Capture **one** frame from *stream_url*, run zone inference on RunPod,
    and post any alerts to Django.

    Parameters
    ----------
    ws_push_fn : Optional callable(exam_id, alert_payload) — when provided,
                 each created alert is immediately pushed to the WebSocket
                 channel group for real-time delivery to the frontend.

    Returns True if the full cycle succeeded (frame captured + RunPod call
    returned), False otherwise.
    """
    logger.info(
        "dispatch_once | exam=%s cam=%s session=%s stream=%s",
        exam_id, camera_id, session_id, stream_url,
    )

    # 1. Capture frame using a persistent reader
    reader = get_or_create_reader(stream_url, camera_id, fps)
    
    # Do a non-blocking wait to get a frame
    frame = reader.latest_frame
    if frame is None:
        # Give it a short moment if it just started
        frame = reader.read(timeout=2.0)
        
    if frame is None:
        logger.error("No frame received from stream within timeout.")
        return False

    # 🔥 DEBUG: Save the exact frame being sent to RunPod to disk!
    import cv2
    from django.conf import settings
    scratch_dir = os.path.join(settings.BASE_DIR, "scratch")
    if not os.path.exists(scratch_dir):
        os.makedirs(scratch_dir, exist_ok=True)
        
    debug_path = os.path.join(scratch_dir, f"camera_{camera_id}_latest.jpg")
    try:
        cv2.imwrite(debug_path, frame)
    except Exception as exc:
        logger.warning("Failed to save debug frame: %s", exc)

    # 2. Fetch zone coords from Django
    zones = _fetch_zones(exam_id, camera_id)
    if not zones:
        logger.warning("No zones found for exam=%s cam=%s — nothing to infer.", exam_id, camera_id)
        return True  # not an error; exam may just have no zones yet

    # 3. Run Local AI Inference
    t_start = time.perf_counter()
    response = _run_local_inference(frame, zones)
    
    t_elapsed = (time.perf_counter() - t_start) * 1000
    logger.info("Local inference completed in %.1f ms", t_elapsed)

    if response is None or response.get("status") == "FAILED":
        logger.error("Local inference failed.")
        return False

    output = response.get("output", {})
    results = output.get("results", [])
    logger.info("Local AI returned %d zone result(s).", len(results))

    _post_alerts(results, session_id, exam_id=exam_id, ws_push_fn=ws_push_fn, frame=frame)
    return True


def dispatch_loop(
    stream_url: str,
    exam_id:    int,
    camera_id:  int,
    session_id: int,
    fps:        float = FRAME_SAMPLE_RATE,
) -> None:
    """
    Continuously dispatch frames until interrupted.

    Intended as the body of a long-running Celery task or a background thread.
    Call ``dispatch_loop()`` from the Celery worker; it will run until the
    exam ends or the process is killed.

    Phase 5 wraps this in a Celery Beat scheduled task.
    """
    interval = 1.0 / fps
    logger.info(
        "dispatch_loop started | exam=%s cam=%s fps=%.1f stream=%s",
        exam_id, camera_id, fps, stream_url,
    )

    reader = RtspReader(stream_url=stream_url, fps=fps, camera_id=camera_id)
    try:
        reader.start(threaded=True)

        zones = _fetch_zones(exam_id, camera_id)
        if not zones:
            logger.warning("No zones configured. Loop will continue checking.")

        last_dispatch = 0.0

        while True:
            now = time.monotonic()
            if now - last_dispatch < interval:
                time.sleep(0.05)
                continue

            frame = reader.latest_frame
            if frame is None:
                logger.debug("No frame yet — waiting …")
                time.sleep(0.1)
                continue

            # Refresh zones periodically (every ~10 s)
            if now - last_dispatch > 10.0:
                zones = _fetch_zones(exam_id, camera_id)

            response = _run_local_inference(frame, zones)
            if response:
                results = response.get("output", {}).get("results", [])
                _post_alerts(results, session_id, frame=frame)

            last_dispatch = time.monotonic()

    except KeyboardInterrupt:
        logger.info("dispatch_loop interrupted by user.")
    finally:
        reader.stop()
        logger.info("dispatch_loop exited | stats: %s", reader.stats)
