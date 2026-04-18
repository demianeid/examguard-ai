"""
myproject_backend.hardware.ai_engine.phone_detector
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Phase 3 — YOLOv8 Phone & Paper Detector (IMPLEMENTED)

Detects exam cheating artefacts inside a cropped StudentZone image:

  COCO class 67  →  "cell phone"     →  Alert type: ``mobile_phone``  (severity: high)
  COCO class 73  →  "book"           →  Alert type: ``external_paper`` (severity: medium)
  COCO class 74  →  "clock" (proxy)  →  skipped (irrelevant)

Alert dict schema (appended to ZoneCrop.alerts by zone_processor)
------------------------------------------------------------------
{
    "type":        "mobile_phone" | "external_paper",
    "severity":    "high" | "medium",
    "confidence":  0.0–1.0,
    "bbox":        [x1, y1, x2, y2],   ← in model-input space (640×640)
    "bbox_source": [x1, y1, x2, y2],   ← mapped back to source-image space
    "detector":    "phone_detector"
}

Singleton pattern
-----------------
``get_phone_detector()`` returns a module-level singleton loaded once at
container startup.  Call ``PhoneDetector.load()`` explicitly in your worker
init code (or let the singleton auto-load on first ``detect()`` call).
"""

from __future__ import annotations

import logging
import os
from typing import Any, Optional

import numpy as np

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────────
DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "models", "yolov8n.pt"
)
DEFAULT_CONF       = float(os.getenv("ALERT_CONFIDENCE_THRESHOLD", "0.45"))
DEFAULT_IOU        = 0.45   # NMS IoU threshold
IMGSZ              = 640    # inference size (must match MODEL_INPUT_SIZE)

# COCO class IDs → alert types
_VIOLATION_CLASSES: dict[int, dict[str, str]] = {
    67: {"type": "mobile_phone",    "severity": "high"},
    73: {"type": "external_paper",  "severity": "medium"},
    76: {"type": "external_paper",  "severity": "medium"},  # scissors (extra proxy)
}


class PhoneDetector:
    """
    Wraps Ultralytics YOLO for mobile-phone and external-paper detection.

    Parameters
    ----------
    model_path : Path to ``yolov8n.pt`` weights.  Falls back to auto-download
                 from Ultralytics hub if the file is not found locally.
    conf       : Minimum detection confidence (default 0.45).
    iou        : NMS IoU threshold (default 0.45).
    """

    def __init__(
        self,
        model_path: str  = DEFAULT_MODEL_PATH,
        conf:       float = DEFAULT_CONF,
        iou:        float = DEFAULT_IOU,
    ) -> None:
        self.model_path = model_path
        self.conf       = conf
        self.iou        = iou
        self._model     = None        # ultralytics.YOLO instance
        self._loaded    = False

    # ── Loading ────────────────────────────────────────────────────────────────

    def load(self) -> None:
        """
        Load YOLO weights into memory.

        Safe to call multiple times — skipped if already loaded.
        Called automatically by ``detect()`` on first use.
        """
        if self._loaded:
            return

        from ultralytics import YOLO  # import here so tests can mock it

        # Resolve path: use local weights if present, else let ultralytics download
        weights = self.model_path if os.path.isfile(self.model_path) else "yolov8n.pt"
        logger.info("PhoneDetector loading weights: %s", weights)
        self._model  = YOLO(weights)
        self._loaded = True
        logger.info("PhoneDetector ready.")

    # ── Inference ──────────────────────────────────────────────────────────────

    def detect(
        self,
        frame_bgr:   np.ndarray,
        scale_x:     float = 1.0,
        scale_y:     float = 1.0,
        roi_offset_x: int  = 0,
        roi_offset_y: int  = 0,
    ) -> list[dict[str, Any]]:
        """
        Run YOLO object detection on a cropped zone frame.

        Parameters
        ----------
        frame_bgr      : BGR numpy array — typically ``ZoneCrop.model_input``
                         (already resized to 640×640).
        scale_x        : ``ZoneCrop.scale_x`` — maps detection x coords back
                         to ``original_crop`` space.
        scale_y        : ``ZoneCrop.scale_y`` — same for y.
        roi_offset_x   : ``ZoneCrop.roi["x1"]`` — adds source-frame x offset.
        roi_offset_y   : ``ZoneCrop.roi["y1"]`` — adds source-frame y offset.

        Returns
        -------
        List of alert dicts (empty if nothing found or confidence too low).
        """
        if not self._loaded:
            self.load()

        if frame_bgr is None or frame_bgr.size == 0:
            logger.warning("PhoneDetector received an empty frame — skipped.")
            return []

        # Run inference (verbose=False suppresses ultralytics console spam)
        results = self._model.predict(
            source=frame_bgr,
            conf=self.conf,
            iou=self.iou,
            imgsz=IMGSZ,
            verbose=False,
            classes=list(_VIOLATION_CLASSES.keys()),
        )

        alerts: list[dict[str, Any]] = []

        for result in results:
            if result.boxes is None:
                continue
            for box in result.boxes:
                cls_id     = int(box.cls[0])
                confidence = float(box.conf[0])
                info       = _VIOLATION_CLASSES.get(cls_id)
                if info is None:
                    continue

                # Coords in model-input (640×640) space
                x1m, y1m, x2m, y2m = (int(v) for v in box.xyxy[0].tolist())

                # Map back to source-image space using scale + ROI offset
                x1s = int(x1m * scale_x) + roi_offset_x
                y1s = int(y1m * scale_y) + roi_offset_y
                x2s = int(x2m * scale_x) + roi_offset_x
                y2s = int(y2m * scale_y) + roi_offset_y

                alert = {
                    "type":        info["type"],
                    "severity":    info["severity"],
                    "confidence":  round(confidence, 4),
                    "bbox":        [x1m, y1m, x2m, y2m],       # model space
                    "bbox_source": [x1s, y1s, x2s, y2s],       # source-image space
                    "detector":    "phone_detector",
                }
                alerts.append(alert)
                logger.info(
                    "Alert: %s  conf=%.2f  bbox_source=%s",
                    info["type"], confidence, [x1s, y1s, x2s, y2s],
                )

        return alerts

    # ── Convenience ────────────────────────────────────────────────────────────

    def unload(self) -> None:
        """Release model from memory (useful for memory-constrained workers)."""
        self._model  = None
        self._loaded = False
        logger.info("PhoneDetector unloaded.")


# ── Module-level singleton ─────────────────────────────────────────────────────
_singleton: Optional[PhoneDetector] = None


def get_phone_detector(
    model_path: str   = DEFAULT_MODEL_PATH,
    conf:       float = DEFAULT_CONF,
) -> PhoneDetector:
    """
    Return the module-level ``PhoneDetector`` singleton.

    The first call creates and loads the detector; subsequent calls return
    the cached instance (model stays in GPU memory between invocations).
    """
    global _singleton
    if _singleton is None:
        _singleton = PhoneDetector(model_path=model_path, conf=conf)
        _singleton.load()
    return _singleton
