"""
myproject_backend.hardware.ai_engine.face_detector
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Phase 3 — Face Count Detector (IMPLEMENTED)

Strategy
--------
Primary  : YOLOv8-face weights (``yolov8n-face.pt`` from Ultralytics hub).
           Accurate, GPU-accelerated, consistent with the rest of the pipeline.
Fallback : OpenCV Haar Cascade ``haarcascade_frontalface_default.xml``.
           Always available (bundled with OpenCV), CPU-only, no extra download.

The fallback activates automatically when the YOLOv8-face file is not found
so local development always works without GPU model weights.

Alert dict schema
-----------------
{
    "type":        "no_face" | "multiple_faces",
    "severity":    "high"    | "medium",
    "confidence":  0.0–1.0,
    "face_count":  <int>,
    "faces":       [{"bbox": [x1,y1,x2,y2], "confidence": …}, ...],
    "detector":    "face_detector"
}

Rules
-----
- face_count == 0  →  ``no_face``        severity=high
- face_count == 1  →  no alert (student is present and alone)
- face_count >= 2  →  ``multiple_faces`` severity=medium
"""

from __future__ import annotations

import logging
import os
from enum import Enum
from typing import Any, Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────────
DEFAULT_YOLO_FACE_PATH = os.path.join(
    os.path.dirname(__file__), "models", "yolov10n-face.pt"
)
DEFAULT_CONF  = float(os.getenv("ALERT_CONFIDENCE_THRESHOLD", "0.45"))
DEFAULT_IOU   = 0.45
IMGSZ         = 640

# OpenCV Haar Cascade (bundled with OpenCV — no separate download)
_HAAR_CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"


class _Backend(str, Enum):
    YOLO = "yolo"
    HAAR = "haar"


class FaceDetector:
    """
    Counts human faces in a StudentZone crop.

    Falls back to OpenCV Haar Cascade when YOLOv8-face weights are absent,
    ensuring the pipeline always works in local development.

    Parameters
    ----------
    model_path : Path to ``yolov8n-face.pt``.
    conf       : Detection confidence threshold.
    iou        : NMS IoU threshold (YOLO only).
    """

    def __init__(
        self,
        model_path: str   = DEFAULT_YOLO_FACE_PATH,
        conf:       float = DEFAULT_CONF,
        iou:        float = DEFAULT_IOU,
    ) -> None:
        self.model_path = model_path
        self.conf       = conf
        self.iou        = iou
        self._model     = None
        self._backend   = _Backend.YOLO
        self._loaded    = False

    # ── Loading ────────────────────────────────────────────────────────────────

    def load(self) -> None:
        """Load the face detection backend. Safe to call multiple times."""
        if self._loaded:
            return

        if os.path.isfile(self.model_path):
            self._load_yolo(self.model_path)
        else:
            # Try to load yolov10n-face.pt by name (may auto-resolve if on PATH)
            try:
                self._load_yolo("yolov10n-face.pt")
            except Exception as exc:
                logger.warning(
                    "YOLOv10-face unavailable (%s). Falling back to OpenCV Haar Cascade.", exc
                )
                self._load_haar()

        self._loaded = True

    def _load_yolo(self, weights: str) -> None:
        from ultralytics import YOLO
        logger.info("FaceDetector loading YOLO-face weights: %s", weights)
        self._model   = YOLO(weights)
        self._backend = _Backend.YOLO
        logger.info("FaceDetector backend: YOLO-face.")

    def _load_haar(self) -> None:
        logger.info("FaceDetector loading Haar Cascade: %s", _HAAR_CASCADE_PATH)
        self._model   = cv2.CascadeClassifier(_HAAR_CASCADE_PATH)
        self._backend = _Backend.HAAR
        if self._model.empty():
            raise RuntimeError("Haar Cascade failed to load — OpenCV installation may be broken.")
        logger.info("FaceDetector backend: OpenCV Haar Cascade (CPU fallback).")

    # ── Inference ──────────────────────────────────────────────────────────────

    def detect(
        self,
        frame_bgr:    np.ndarray,
        scale_x:      float = 1.0,
        scale_y:      float = 1.0,
        roi_offset_x: int   = 0,
        roi_offset_y: int   = 0,
    ) -> list[dict[str, Any]]:
        """
        Detect faces and emit ``no_face`` / ``multiple_faces`` alerts.

        Parameters mirror ``PhoneDetector.detect()`` for a uniform interface.
        Returns an empty list when exactly one face is detected (normal state).
        """
        if not self._loaded:
            self.load()

        if frame_bgr is None or frame_bgr.size == 0:
            logger.warning("FaceDetector received an empty frame — returning no_face.")
            return [self._no_face_alert(face_count=0, faces=[])]

        if self._backend == _Backend.YOLO:
            faces = self._detect_yolo(frame_bgr, scale_x, scale_y, roi_offset_x, roi_offset_y)
        else:
            faces = self._detect_haar(frame_bgr, scale_x, scale_y, roi_offset_x, roi_offset_y)

        return self._make_alerts(faces)

    def _detect_yolo(
        self,
        frame_bgr:    np.ndarray,
        scale_x:      float,
        scale_y:      float,
        roi_offset_x: int,
        roi_offset_y: int,
    ) -> list[dict]:
        """Run YOLOv8-face inference and return a list of face dicts."""
        results = self._model.predict(
            source=frame_bgr,
            conf=self.conf,
            iou=self.iou,
            imgsz=IMGSZ,
            verbose=False,
        )
        faces = []
        for result in results:
            if result.boxes is None:
                continue
            for box in result.boxes:
                x1m, y1m, x2m, y2m = (int(v) for v in box.xyxy[0].tolist())
                confidence = float(box.conf[0])
                faces.append({
                    "bbox": [x1m, y1m, x2m, y2m],
                    "bbox_source": [
                        int(x1m * scale_x) + roi_offset_x,
                        int(y1m * scale_y) + roi_offset_y,
                        int(x2m * scale_x) + roi_offset_x,
                        int(y2m * scale_y) + roi_offset_y,
                    ],
                    "confidence": round(confidence, 4),
                })
        return faces

    def _detect_haar(
        self,
        frame_bgr:    np.ndarray,
        scale_x:      float,
        scale_y:      float,
        roi_offset_x: int,
        roi_offset_y: int,
    ) -> list[dict]:
        """Run Haar Cascade detection and return a list of face dicts."""
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)   # improve contrast for dim images

        detections = self._model.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
        )

        faces = []
        if len(detections) == 0:
            return faces

        for (x, y, w, h) in detections:
            faces.append({
                "bbox": [x, y, x + w, y + h],
                "bbox_source": [
                    int(x * scale_x) + roi_offset_x,
                    int(y * scale_y) + roi_offset_y,
                    int((x + w) * scale_x) + roi_offset_x,
                    int((y + h) * scale_y) + roi_offset_y,
                ],
                "confidence": 0.75,   # Haar cascades don't produce confidence scores
            })
        return faces

    # ── Alert builders ─────────────────────────────────────────────────────────

    @staticmethod
    def _no_face_alert(face_count: int, faces: list) -> dict:
        return {
            "type":       "no_face",
            "severity":   "high",
            "confidence": 1.0,
            "face_count": face_count,
            "faces":      faces,
            "detector":   "face_detector",
        }

    @staticmethod
    def _multiple_faces_alert(face_count: int, faces: list) -> dict:
        # Confidence is scaled by how many extra faces appear — more faces = more certain
        conf = min(1.0, 0.7 + (face_count - 2) * 0.1)
        return {
            "type":       "multiple_faces",
            "severity":   "medium",
            "confidence": round(conf, 4),
            "face_count": face_count,
            "faces":      faces,
            "detector":   "face_detector",
        }

    def _make_alerts(self, faces: list[dict]) -> list[dict]:
        n = len(faces)
        if n == 0:
            logger.debug("FaceDetector → 0 faces detected (returning no_face alert).")
            # Confidence must be 1.0 so the dispatcher doesn't filter it out!
            return [self._format_alert("no_face", 1.0, 0, [])]
        if n == 1:
            logger.debug("FaceDetector → clean (1 face detected).")
            return []   # normal — one student
        # n >= 2
        logger.info("FaceDetector → multiple_faces (%d faces).", n)
        return [self._multiple_faces_alert(face_count=n, faces=faces)]


# ── Singleton ──────────────────────────────────────────────────────────────────
_singleton: Optional[FaceDetector] = None


def get_face_detector(
    model_path: str   = DEFAULT_YOLO_FACE_PATH,
    conf:       float = DEFAULT_CONF,
) -> FaceDetector:
    """Return the module-level ``FaceDetector`` singleton (auto-loads on first call)."""
    global _singleton
    if _singleton is None:
        _singleton = FaceDetector(model_path=model_path, conf=conf)
        _singleton.load()
    return _singleton
