"""
myproject_backend.hardware.ai_engine.detector
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Phase 3 — Top-level AIDetector orchestrator (IMPLEMENTED)

This class is the single entry point the RunPod handler uses to:
  1. Load all model singletons once at container startup.
  2. Expose a ``run()`` method that mirrors ``process_frame()`` but gives
     callers an object-oriented handle with load / unload lifecycle control.

Typical usage in handler.py (Phase 4 will do this automatically):
    from hardware.ai_engine.detector import AIDetector
    detector = AIDetector()
    detector.load_models()                      # called at startup

    # In handler():
    results = detector.run(frame_b64, zones)
"""

from __future__ import annotations

import logging
import os
from typing import Any

_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
_DEFAULT_PHONE_MODEL = os.path.join(_MODELS_DIR, "yolov8n.pt")
_DEFAULT_FACE_MODEL  = os.path.join(_MODELS_DIR, "yolov10n-face.pt")

logger = logging.getLogger(__name__)


class AIDetector:
    """
    Top-level inference orchestrator.

    Instantiated once when the RunPod worker starts; kept alive across
    invocations so GPU-resident model weights are reused.
    """

    def __init__(self) -> None:
        self._phone_detector  = None
        self._face_detector   = None
        self._head_pose       = None
        self._loaded          = False

    # ── Lifecycle ──────────────────────────────────────────────────────────────

    def load_models(
        self,
        phone_model_path: str = _DEFAULT_PHONE_MODEL,
        face_model_path:  str = _DEFAULT_FACE_MODEL,
    ) -> None:
        """
        Load all sub-detector singletons into memory.

        Safe to call multiple times — skipped on subsequent calls.
        Logs a warning (but does NOT raise) if a model fails to load, so
        the worker keeps running with reduced detection capabilities.

        Parameters
        ----------
        phone_model_path : Path to YOLOv8n weights for phone/paper detection.
        face_model_path  : Path to YOLOv8-face weights.
        """
        if self._loaded:
            logger.debug("AIDetector already loaded — skipping.")
            return

        errors: list[str] = []

        # Phone / paper detector
        try:
            from .phone_detector import PhoneDetector
            self._phone_detector = PhoneDetector(model_path=phone_model_path)
            self._phone_detector.load()
            logger.info("✅ PhoneDetector loaded.")
        except Exception as exc:         # noqa: BLE001
            errors.append(f"PhoneDetector: {exc}")
            logger.error("❌ PhoneDetector failed to load: %s", exc)

        # Face detector (auto-falls back to Haar if face model absent)
        try:
            from .face_detector import FaceDetector
            self._face_detector = FaceDetector(model_path=face_model_path)
            self._face_detector.load()
            logger.info("✅ FaceDetector loaded.")
        except Exception as exc:         # noqa: BLE001
            errors.append(f"FaceDetector: {exc}")
            logger.error("❌ FaceDetector failed to load: %s", exc)

        # Head-pose estimator (gracefully degrades if mediapipe absent)
        try:
            from .head_pose import HeadPoseEstimator
            self._head_pose = HeadPoseEstimator()
            self._head_pose.load()
            logger.info("✅ HeadPoseEstimator loaded.")
        except Exception as exc:         # noqa: BLE001
            errors.append(f"HeadPoseEstimator: {exc}")
            logger.error("❌ HeadPoseEstimator failed to load: %s", exc)
        
        self._loaded = True
        if errors:
            logger.warning("AIDetector loaded with %d error(s): %s", len(errors), errors)
        else:
            logger.info("AIDetector: all models loaded successfully.")

    def unload_models(self) -> None:
        """Release all model weights from GPU/CPU memory."""
        for attr, name in [
            ("_phone_detector", "PhoneDetector"),
            ("_face_detector",  "FaceDetector"),
            ("_head_pose",      "HeadPoseEstimator"),
        ]:
            obj = getattr(self, attr, None)
            if obj is not None and hasattr(obj, "unload"):
                obj.unload()
                logger.info("%s unloaded.", name)
        self._loaded = False

    # ── Public run API ─────────────────────────────────────────────────────────

    def run(
        self,
        frame_b64: str,
        zones:     list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Full inference pipeline: decode → crop → detect → return alerts.
        """
        if not self._loaded:
            logger.warning("AIDetector.run() called before load_models() — auto-loading.")
            self.load_models()

        from .zone_processor import process_frame
        return process_frame(frame_b64, zones)

    # ── Status ─────────────────────────────────────────────────────────────────

    @property
    def status(self) -> dict[str, bool]:
        """Returns a dict summarising which sub-detectors are loaded."""
        return {
            "phone_detector":  self._phone_detector is not None,
            "face_detector":   self._face_detector  is not None,
            "head_pose":       self._head_pose       is not None,
            "fully_loaded":    self._loaded,
        }
