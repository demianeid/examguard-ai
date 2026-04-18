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
import os
import time
from typing import Any, Optional

import requests

from myproject_backend.hardware.ai_engine.zone_processor import encode_frame, crop_zones
from myproject_backend.hardware.frame_dispatcher.rtsp_reader import RtspReader, RtspReaderError

logger = logging.getLogger(__name__)

# ── Config (overridden by env vars or Django settings) ────────────────────────
RUNPOD_ENDPOINT:            str   = os.getenv("RUNPOD_ENDPOINT", "")
DJANGO_API_URL:             str   = os.getenv("DJANGO_API_URL", "http://localhost:8000/api")
DJANGO_API_TOKEN:           str   = os.getenv("DJANGO_API_TOKEN", "")
ALERT_CONFIDENCE_THRESHOLD: float = float(os.getenv("ALERT_CONFIDENCE_THRESHOLD", "0.6"))
FRAME_JPEG_QUALITY:         int   = int(os.getenv("FRAME_JPEG_QUALITY", "85"))
FRAME_SAMPLE_RATE:          float = float(os.getenv("FRAME_SAMPLE_RATE", "2"))

# Timeout for RunPod /runsync calls (seconds)
RUNPOD_REQUEST_TIMEOUT: int = 30

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
    url = f"{DJANGO_API_URL}/student-zones/"
    params = {"exam": exam_id, "camera": camera_id}

    try:
        resp = requests.get(url, params=params, headers=_auth_headers(), timeout=5)
        resp.raise_for_status()
        data = resp.json()
        # DRF paginated list → unwrap results key if present
        zones = data.get("results", data) if isinstance(data, dict) else data
        logger.debug("Fetched %d zone(s) for exam=%s camera=%s.", len(zones), exam_id, camera_id)
        return zones
    except requests.RequestException as exc:
        logger.error("Failed to fetch zones (exam=%s, cam=%s): %s", exam_id, camera_id, exc)
        return []


def _post_to_runpod(
    frame_b64: str,
    zones:      list[dict],
    exam_id:    int,
    session_id: int,
) -> Optional[dict]:
    """
    POST a frame + zones to the RunPod /runsync endpoint.

    Returns the parsed JSON response dict, or None on failure.

    RunPod /runsync blocks until inference is done (max ~30 s).
    Switch to /run + polling for very heavy models in Phase 4.
    """
    if not RUNPOD_ENDPOINT:
        logger.error("RUNPOD_ENDPOINT is not configured. Set it in .env.")
        return None

    payload = {
        "input": {
            "frame":      frame_b64,
            "zones":      zones,
            "exam_id":    exam_id,
            "session_id": session_id,
        }
    }

    try:
        resp = requests.post(
            RUNPOD_ENDPOINT,
            json=payload,
            timeout=RUNPOD_REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.Timeout:
        logger.error("RunPod request timed out after %ds.", RUNPOD_REQUEST_TIMEOUT)
    except requests.RequestException as exc:
        logger.error("RunPod request failed: %s", exc)
    return None


def _post_alerts(results: list[dict], session_id: int) -> None:
    """
    For each alert in *results*, POST to Django's ``/api/alerts/`` endpoint.

    Filters out alerts below ``ALERT_CONFIDENCE_THRESHOLD``.
    """
    url = f"{DJANGO_API_URL}/alerts/"

    for zone_result in results:
        zone_id = zone_result.get("zone_id")
        for alert in zone_result.get("alerts", []):
            confidence = float(alert.get("confidence", 1.0))
            if confidence < ALERT_CONFIDENCE_THRESHOLD:
                logger.debug(
                    "Alert %s confidence %.2f below threshold — skipped.",
                    alert.get("type"), confidence,
                )
                continue

            payload = {
                "session":    session_id,
                "zone":       zone_id,
                "alert_type": alert.get("type"),
                "severity":   alert.get("severity", "medium"),
                "confidence": confidence,
                # snapshot (base64 crop) will be attached in Phase 3
            }
            try:
                resp = requests.post(url, json=payload, headers=_auth_headers(), timeout=5)
                resp.raise_for_status()
                logger.info(
                    "Alert posted: zone=%s type=%s confidence=%.2f",
                    zone_id, alert.get("type"), confidence,
                )
            except requests.RequestException as exc:
                logger.error("Failed to post alert for zone %s: %s", zone_id, exc)


# ── Core dispatch function ────────────────────────────────────────────────────

def dispatch_once(
    stream_url: str,
    exam_id:    int,
    camera_id:  int,
    session_id: int,
    fps:        float = FRAME_SAMPLE_RATE,
) -> bool:
    """
    Capture **one** frame from *stream_url*, run zone inference on RunPod,
    and post any alerts to Django.

    Returns True if the full cycle succeeded (frame captured + RunPod call
    returned), False otherwise.

    Use this function in:
    - Local integration tests (call directly from a script).
    - The Celery Beat task (Phase 5) which calls it in a loop.
    """
    logger.info(
        "dispatch_once | exam=%s cam=%s session=%s stream=%s",
        exam_id, camera_id, session_id, stream_url,
    )

    # 1. Capture frame
    reader = RtspReader(stream_url=stream_url, fps=fps, camera_id=camera_id)
    try:
        reader.start(threaded=True)
        frame = reader.read(timeout=10.0)
    except RtspReaderError as exc:
        logger.error("Could not open stream: %s", exc)
        reader.stop()
        return False
    finally:
        reader.stop()

    if frame is None:
        logger.error("No frame received from stream within timeout.")
        return False

    # 2. Encode frame to base64 JPEG
    try:
        frame_b64 = encode_frame(frame, quality=FRAME_JPEG_QUALITY)
    except RuntimeError as exc:
        logger.error("Frame encoding failed: %s", exc)
        return False

    # 3. Fetch zone coords from Django
    zones = _fetch_zones(exam_id, camera_id)
    if not zones:
        logger.warning("No zones found for exam=%s cam=%s — nothing to infer.", exam_id, camera_id)
        return True  # not an error; exam may just have no zones yet

    # 4. Send to RunPod
    response = _post_to_runpod(frame_b64, zones, exam_id, session_id)
    if response is None:
        return False

    # 5. Parse RunPod response and post alerts to Django
    results = response.get("output", {}).get("results", [])
    logger.info("RunPod returned %d zone result(s).", len(results))

    _post_alerts(results, session_id)
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

            try:
                frame_b64 = encode_frame(frame, quality=FRAME_JPEG_QUALITY)
            except RuntimeError as exc:
                logger.error("Encode error: %s", exc)
                last_dispatch = time.monotonic()
                continue

            response = _post_to_runpod(frame_b64, zones, exam_id, session_id)
            if response:
                results = response.get("output", {}).get("results", [])
                _post_alerts(results, session_id)

            last_dispatch = time.monotonic()

    except KeyboardInterrupt:
        logger.info("dispatch_loop interrupted by user.")
    finally:
        reader.stop()
        logger.info("dispatch_loop exited | stats: %s", reader.stats)
