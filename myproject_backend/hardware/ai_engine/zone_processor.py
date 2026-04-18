"""
myproject_backend.hardware.ai_engine.zone_processor
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Phase 3 — Zone Cropping + AI Inference Pipeline (IMPLEMENTED)

Responsibilities
----------------
1.  Decode a base64-encoded camera frame into a BGR numpy array.
2.  For every StudentZone dict received from the RunPod handler:
      a. Validate and clamp the (x1, y1, x2, y2) rectangle against
         the actual frame dimensions.
      b. Crop the zone from the full frame.
      c. Resize the crop to a model-ready shape (default 640 × 640).
      d. Build a ``ZoneCrop`` result object ready for Phase 3 detectors.
3.  Return one ``ZoneCrop`` per zone, **preserving zone order**.

Input payload schema (from runpod_worker.handler)
-------------------------------------------------
{
    "frame":  "<base64-encoded JPEG or PNG>",
    "zones":  [
        {
            "id":           <int>,          # StudentZone.id
            "student_code": "<str>",        # e.g. "S001"
            "student_name": "<str>",        # optional
            "x1": <int>, "y1": <int>,       # top-left  (source-image pixels)
            "x2": <int>, "y2": <int>        # bottom-right
        },
        ...
    ]
}

Output — list of ZoneCrop dataclass instances
---------------------------------------------
Each ZoneCrop has:
    .zone_id        int
    .student_code   str
    .student_name   str
    .original_crop  np.ndarray  BGR, raw cropped pixels (for snapshot saving)
    .model_input    np.ndarray  BGR, resized to MODEL_INPUT_SIZE
    .scale_x        float       x-scale factor (for mapping detections back)
    .scale_y        float       y-scale factor
    .frame_w        int         original frame width
    .frame_h        int         original frame height
    .roi            dict        {"x1":…, "y1":…, "x2":…, "y2":…} clamped coords
    .is_valid       bool        False if crop was empty / degenerate

Integration note
----------------
Phase 3 detectors receive ``ZoneCrop.model_input`` directly.
Alert bounding boxes returned by detectors are already mapped back to
source-image space using ``ZoneCrop.scale_x`` / ``ZoneCrop.scale_y``
+ ``ZoneCrop.roi`` offset by each detector's ``detect()`` method.
"""

from __future__ import annotations

import base64
import logging
from dataclasses import dataclass, field
from typing import Any

import cv2
import numpy as np

# ── Lazy detector imports (singletons loaded once at worker startup) ───────────
# Imported here as module-level callables so they can be patched in tests.
def _get_phone_detector():
    from hardware.ai_engine.phone_detector import get_phone_detector
    return get_phone_detector()

def _get_face_detector():
    from hardware.ai_engine.face_detector import get_face_detector
    return get_face_detector()

def _get_head_pose_estimator():
    from hardware.ai_engine.head_pose import get_head_pose_estimator
    return get_head_pose_estimator()

# Cache references after first use (avoids repeated singleton look-ups)
_phone_det  = None
_face_det   = None
_head_pose  = None


def _ensure_detectors_loaded() -> None:
    """Load all detector singletons once and cache module-level references."""
    global _phone_det, _face_det, _head_pose
    if _phone_det is None:
        _phone_det = _get_phone_detector()
    if _face_det is None:
        _face_det  = _get_face_detector()
    if _head_pose is None:
        _head_pose = _get_head_pose_estimator()

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────
# Default size fed into YOLO and MediaPipe models.
# Phase 3 detectors can override this per-call.
MODEL_INPUT_SIZE: tuple[int, int] = (640, 640)   # (width, height)

# Minimum valid dimension for a crop (pixels).
# Zones smaller than this are flagged as invalid and skipped by detectors.
MIN_CROP_DIM: int = 20


# ── Data Transfer Object ───────────────────────────────────────────────────────

@dataclass
class ZoneCrop:
    """Represents one ready-to-infer StudentZone crop produced by ``process_frame``."""

    zone_id:       int
    student_code:  str
    student_name:  str

    # Raw crop in source-image pixel space — used for alert snapshots
    original_crop: np.ndarray

    # Resized crop for model inference — same dtype/channels as original_crop
    model_input:   np.ndarray

    # Scale factors: model_input → original_crop coordinate space
    scale_x: float
    scale_y: float

    # Full-frame dimensions (used for context / logging)
    frame_w: int
    frame_h: int

    # Clamped ROI coords in source-image space
    roi: dict[str, int]   # {"x1", "y1", "x2", "y2"}

    # False when the zone rect was degenerate (zero-area, out-of-bounds, etc.)
    is_valid: bool = True

    # Placeholder list — Phase 3 detectors append dicts here
    alerts: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Serialise to the JSON-response schema expected by handler.py."""
        return {
            "zone_id":      self.zone_id,
            "student_code": self.student_code,
            "student_name": self.student_name,
            "roi":          self.roi,
            "is_valid":     self.is_valid,
            "alerts":       self.alerts,
        }


# ── Internal helpers ───────────────────────────────────────────────────────────

def _decode_frame(frame_b64: str) -> np.ndarray:
    """
    Decode a base64 image string (JPEG or PNG) to a BGR numpy array.

    Raises
    ------
    ValueError
        If the byte stream cannot be decoded as an image.
    """
    try:
        raw = base64.b64decode(frame_b64)
    except Exception as exc:
        raise ValueError(f"Frame is not valid base64: {exc}") from exc

    arr = np.frombuffer(raw, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if frame is None:
        raise ValueError(
            "cv2.imdecode returned None — frame bytes are not a valid JPEG/PNG."
        )

    return frame  # shape: (H, W, 3), dtype: uint8, channel order: BGR


def _clamp_roi(
    x1: int, y1: int, x2: int, y2: int,
    frame_w: int, frame_h: int,
) -> tuple[int, int, int, int]:
    """
    Clamp ROI coordinates to the frame boundary.

    Returns the clamped (x1, y1, x2, y2).  Ensures x1 < x2, y1 < y2
    after clamping so callers can always use them for slicing.
    """
    x1 = max(0, min(x1, frame_w - 1))
    y1 = max(0, min(y1, frame_h - 1))
    x2 = max(0, min(x2, frame_w))
    y2 = max(0, min(y2, frame_h))
    return x1, y1, x2, y2


def _is_valid_crop(x1: int, y1: int, x2: int, y2: int) -> bool:
    """Return True only if the rectangle has meaningful area."""
    return (x2 - x1) >= MIN_CROP_DIM and (y2 - y1) >= MIN_CROP_DIM


def _resize_for_model(
    crop: np.ndarray,
    target_size: tuple[int, int] = MODEL_INPUT_SIZE,
) -> tuple[np.ndarray, float, float]:
    """
    Resize *crop* to *target_size* (width, height) using ``INTER_LINEAR``.

    Returns
    -------
    resized : np.ndarray
        The resized crop, dtype uint8, BGR.
    scale_x : float
        Horizontal scale applied  (crop_width  / target_width)
    scale_y : float
        Vertical scale applied    (crop_height / target_height)
    """
    crop_h, crop_w = crop.shape[:2]
    target_w, target_h = target_size

    resized = cv2.resize(crop, (target_w, target_h), interpolation=cv2.INTER_LINEAR)

    # Scale factors let Phase 3 map model-coordinate detections back to
    # source-image space:  src_x = det_x * scale_x + roi["x1"]
    scale_x = crop_w / target_w
    scale_y = crop_h / target_h

    return resized, scale_x, scale_y


def _build_zone_crop(
    frame: np.ndarray,
    zone: dict[str, Any],
    target_size: tuple[int, int] = MODEL_INPUT_SIZE,
) -> ZoneCrop:
    """
    Build a single ``ZoneCrop`` from a full camera *frame* and a zone dict.

    Steps
    -----
    1.  Parse & cast ROI coords.
    2.  Clamp to frame boundaries.
    3.  Validate minimum dimensions.
    4.  NumPy-slice the crop (zero-copy view when possible).
    5.  Resize for model input.
    6.  Return ZoneCrop with all metadata.
    """
    frame_h, frame_w = frame.shape[:2]

    zone_id      = int(zone.get("id", 0))
    student_code = str(zone.get("student_code", ""))
    student_name = str(zone.get("student_name", ""))

    # Parse coords — accept both int and float sources
    try:
        x1 = int(zone["x1"])
        y1 = int(zone["y1"])
        x2 = int(zone["x2"])
        y2 = int(zone["y2"])
    except (KeyError, TypeError, ValueError) as exc:
        logger.warning(
            "Zone %s (%s) has invalid ROI coords: %s — skipping.",
            zone_id, student_code, exc,
        )
        dummy = np.zeros((MIN_CROP_DIM, MIN_CROP_DIM, 3), dtype=np.uint8)
        return ZoneCrop(
            zone_id=zone_id, student_code=student_code, student_name=student_name,
            original_crop=dummy, model_input=dummy,
            scale_x=1.0, scale_y=1.0,
            frame_w=frame_w, frame_h=frame_h,
            roi={"x1": 0, "y1": 0, "x2": 0, "y2": 0},
            is_valid=False,
        )

    # Normalise: ensure x1 < x2, y1 < y2 regardless of drawing direction
    x1, x2 = min(x1, x2), max(x1, x2)
    y1, y2 = min(y1, y2), max(y1, y2)

    x1, y1, x2, y2 = _clamp_roi(x1, y1, x2, y2, frame_w, frame_h)

    roi = {"x1": x1, "y1": y1, "x2": x2, "y2": y2}

    if not _is_valid_crop(x1, y1, x2, y2):
        logger.warning(
            "Zone %s (%s) crop %s is too small after clamping — marking invalid.",
            zone_id, student_code, roi,
        )
        dummy = np.zeros((MIN_CROP_DIM, MIN_CROP_DIM, 3), dtype=np.uint8)
        return ZoneCrop(
            zone_id=zone_id, student_code=student_code, student_name=student_name,
            original_crop=dummy, model_input=dummy,
            scale_x=1.0, scale_y=1.0,
            frame_w=frame_w, frame_h=frame_h,
            roi=roi, is_valid=False,
        )

    # Crop — NumPy slice is a zero-copy view; .copy() makes it safe to cache
    original_crop = frame[y1:y2, x1:x2].copy()

    model_input, scale_x, scale_y = _resize_for_model(original_crop, target_size)

    logger.debug(
        "Zone %s (%s) | ROI %s | crop %dx%d → model %dx%d | scales (%.3f, %.3f)",
        zone_id, student_code, roi,
        original_crop.shape[1], original_crop.shape[0],
        model_input.shape[1],   model_input.shape[0],
        scale_x, scale_y,
    )

    return ZoneCrop(
        zone_id=zone_id, student_code=student_code, student_name=student_name,
        original_crop=original_crop, model_input=model_input,
        scale_x=scale_x, scale_y=scale_y,
        frame_w=frame_w, frame_h=frame_h,
        roi=roi, is_valid=True,
    )


# ── Public API ─────────────────────────────────────────────────────────────────

def decode_frame(frame_b64: str) -> np.ndarray:
    """
    Public helper: decode a base64 camera frame.

    Used by ``frame_dispatcher.dispatcher`` to decode RTSP frames before
    sending them to RunPod, and by unit tests to prepare synthetic frames.
    """
    return _decode_frame(frame_b64)


def encode_frame(frame: np.ndarray, quality: int = 85) -> str:
    """
    Encode a BGR numpy array to a base64 JPEG string.

    Used by ``frame_dispatcher.dispatcher`` to serialise RTSP frames for
    POSTing to the RunPod endpoint.

    Parameters
    ----------
    frame   : BGR numpy array from OpenCV.
    quality : JPEG quality 1–100 (lower = smaller payload, faster transfer).
    """
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise RuntimeError("cv2.imencode failed — cannot encode frame to JPEG.")
    return base64.b64encode(buf.tobytes()).decode("utf-8")


def crop_zones(
    frame: np.ndarray,
    zones: list[dict[str, Any]],
    target_size: tuple[int, int] = MODEL_INPUT_SIZE,
) -> list[ZoneCrop]:
    """
    Crop all *zones* from *frame* and return a list of ``ZoneCrop`` objects.

    This is the lower-level API used when the caller already holds a decoded
    numpy frame (e.g. ``rtsp_reader`` path inside the RunPod container).

    Parameters
    ----------
    frame       : BGR numpy array (H, W, 3).
    zones       : List of zone dicts with keys id, student_code, x1, y1, x2, y2.
    target_size : (width, height) to resize crops to for model inference.

    Returns
    -------
    List of ``ZoneCrop`` objects in the same order as *zones*.
    """
    if frame is None or frame.size == 0:
        logger.error("crop_zones() received an empty frame — returning no crops.")
        return []

    results: list[ZoneCrop] = []
    for zone in zones:
        results.append(_build_zone_crop(frame, zone, target_size))

    valid_count = sum(1 for z in results if z.is_valid)
    logger.info(
        "crop_zones() processed %d zone(s): %d valid, %d invalid.",
        len(zones), valid_count, len(zones) - valid_count,
    )
    return results


def process_frame(
    frame_b64: str,
    zones: list[dict[str, Any]],
    target_size: tuple[int, int] = MODEL_INPUT_SIZE,
) -> list[dict[str, Any]]:
    """
    Top-level entry point called by ``runpod_worker.handler``.

    Decodes *frame_b64*, crops all *zones*, and returns a list of result
    dicts.  Phase 3 will attach detector output to ``ZoneCrop.alerts``
    **before** calling ``.to_dict()``; the current implementation returns
    empty alert lists as a wired-up (but inference-free) pipeline.

    Parameters
    ----------
    frame_b64   : Base64-encoded JPEG/PNG string.
    zones       : List of StudentZone dicts from the RunPod payload.
    target_size : Resize target forwarded to ``crop_zones``.

    Returns
    -------
    List of dicts ready to be JSON-serialised and returned by the handler.
    """
    logger.info("process_frame() | zones=%d", len(zones))

    # 1. Decode
    try:
        frame = _decode_frame(frame_b64)
    except ValueError as exc:
        logger.error("Frame decode error: %s", exc)
        return [
            {
                "zone_id":      z.get("id"),
                "student_code": z.get("student_code", ""),
                "student_name": z.get("student_name", ""),
                "roi":          {},
                "is_valid":     False,
                "alerts":       [],
                "error":        str(exc),
            }
            for z in zones
        ]

    # 2. Crop all zones
    zone_crops = crop_zones(frame, zones, target_size)

    # 3. Run AI detectors on each valid crop
    _ensure_detectors_loaded()

    for zc in zone_crops:
        if not zc.is_valid:
            continue

        # Shared kwargs — map model-space bboxes back to source-image space
        det_kwargs = dict(
            scale_x      = zc.scale_x,
            scale_y      = zc.scale_y,
            roi_offset_x = zc.roi["x1"],
            roi_offset_y = zc.roi["y1"],
        )

        # 3a. Phone / paper detection (YOLOv8n)
        try:
            zc.alerts += _phone_det.detect(zc.model_input, **det_kwargs)
        except Exception as exc:          # noqa: BLE001
            logger.error("PhoneDetector error (zone %s): %s", zc.zone_id, exc)

        # 3b. Face count (YOLO-face / Haar fallback)
        try:
            zc.alerts += _face_det.detect(zc.model_input, **det_kwargs)
        except Exception as exc:          # noqa: BLE001
            logger.error("FaceDetector error (zone %s): %s", zc.zone_id, exc)

        # 3c. Head pose (MediaPipe solvePnP)
        try:
            zc.alerts += _head_pose.estimate(zc.model_input)
        except Exception as exc:          # noqa: BLE001
            logger.error("HeadPoseEstimator error (zone %s): %s", zc.zone_id, exc)

        if zc.alerts:
            logger.info(
                "Zone %s (%s) → %d alert(s): %s",
                zc.zone_id, zc.student_code,
                len(zc.alerts),
                [a["type"] for a in zc.alerts],
            )

    # 4. Serialise
    return [zc.to_dict() for zc in zone_crops]
