"""
myproject_backend.hardware.ai_engine.head_pose
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Phase 3 — Head-Pose & Movement Estimator (IMPLEMENTED)

Algorithm
---------
1.  MediaPipe Face Mesh detects 468 facial landmarks in the crop.
2.  Six stable solvePnP anchor points (nose tip, chin, eye corners, mouth
    corners) are matched to their 3-D reference coordinates.
3.  ``cv2.solvePnP`` estimates rotation vector → converted to Euler angles.
4.  Thresholds on yaw and pitch produce ``looking_away`` alerts.
5.  Euler-angle delta between the **current** and **previous** frame for the
    same zone produces ``head_movement`` alerts (requires ``prev_angles``).

Alert dict schema
-----------------
{
    "type":        "looking_away" | "head_movement",
    "severity":    "medium"       | "low",
    "confidence":  0.0–1.0,
    "yaw":         <float degrees>,
    "pitch":       <float degrees>,
    "roll":        <float degrees>,
    "detector":    "head_pose"
}

No-face case
------------
When MediaPipe finds no landmarks, the method returns an empty list.
The ``FaceDetector`` handles the ``no_face`` alert separately.

Fallback
--------
When MediaPipe is not installed (local dev without GPU deps), the module
degrades gracefully: ``HeadPoseEstimator.load()`` logs a warning and
``estimate()`` always returns [].
"""

from __future__ import annotations

import logging
import math
import os
from typing import Any, Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Thresholds ─────────────────────────────────────────────────────────────────
YAW_THRESHOLD:      float = float(os.getenv("HEAD_YAW_THRESHOLD",   "30.0"))  # degrees
PITCH_THRESHOLD:    float = float(os.getenv("HEAD_PITCH_THRESHOLD",  "20.0"))  # degrees
MOVEMENT_THRESHOLD: float = float(os.getenv("HEAD_MOVE_THRESHOLD",   "15.0"))  # Δ degrees

# ── 3-D model points (generic face in mm, OpenCV convention) ───────────────────
# Indices correspond to specific MediaPipe Face Mesh landmark IDs below.
_MODEL_POINTS = np.array([
    [0.0,    0.0,    0.0],     # Nose tip          LM 1
    [0.0,   -330.0, -65.0],    # Chin              LM 152
    [-225.0,  170.0, -135.0],  # Left eye corner   LM 33
    [225.0,   170.0, -135.0],  # Right eye corner  LM 263
    [-150.0, -150.0, -125.0],  # Left mouth corner LM 61
    [150.0,  -150.0, -125.0],  # Right mouth corner LM 291
], dtype=np.float64)

# Corresponding MediaPipe Face Mesh landmark indices
_LM_INDICES = [1, 152, 33, 263, 61, 291]


def _rotation_vector_to_euler(rvec: np.ndarray) -> tuple[float, float, float]:
    """Convert an OpenCV rotation vector to (pitch, yaw, roll) in degrees."""
    rmat, _ = cv2.Rodrigues(rvec)
    # Decompose using solvePnP convention → R_x, R_y, R_z
    sy = math.sqrt(rmat[0, 0] ** 2 + rmat[1, 0] ** 2)
    singular = sy < 1e-6

    if not singular:
        pitch = math.atan2( rmat[2, 1], rmat[2, 2])
        yaw   = math.atan2(-rmat[2, 0], sy)
        roll  = math.atan2( rmat[1, 0], rmat[0, 0])
    else:
        pitch = math.atan2(-rmat[1, 2], rmat[1, 1])
        yaw   = math.atan2(-rmat[2, 0], sy)
        roll  = 0.0

    return (
        math.degrees(pitch),
        math.degrees(yaw),
        math.degrees(roll),
    )


class HeadPoseEstimator:
    """
    Estimates yaw / pitch / roll from a cropped zone image using MediaPipe
    Face Mesh and OpenCV solvePnP.

    Parameters
    ----------
    min_detection_confidence : MediaPipe face detection min confidence.
    min_tracking_confidence  : MediaPipe landmark tracking min confidence.
    """

    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence:  float = 0.5,
    ) -> None:
        self.min_detection_confidence = min_detection_confidence
        self.min_tracking_confidence  = min_tracking_confidence
        self._face_mesh = None
        self._mp_loaded = False
        self._available = True    # set to False when MediaPipe is absent

    # ── Loading ────────────────────────────────────────────────────────────────

    def load(self) -> None:
        """Initialise MediaPipe Face Mesh. Gracefully degrades if unavailable."""
        if self._mp_loaded:
            return
        try:
            import mediapipe as mp   # noqa: PLC0415

            # mediapipe < 0.10  — legacy solutions API
            if hasattr(mp, "solutions") and hasattr(mp.solutions, "face_mesh"):
                self._face_mesh = mp.solutions.face_mesh.FaceMesh(
                    static_image_mode=True,
                    max_num_faces=1,
                    refine_landmarks=False,
                    min_detection_confidence=self.min_detection_confidence,
                    min_tracking_confidence=self.min_tracking_confidence,
                )
                self._available = True
                logger.info("HeadPoseEstimator: MediaPipe Face Mesh loaded (legacy API).")
            else:
                # mediapipe >= 0.10 removed mp.solutions.
                # The new Tasks API requires a downloaded .task model bundle
                # which is not available here — disable gracefully.
                self._available = False
                logger.warning(
                    "HeadPoseEstimator: installed mediapipe version (%s) does not "
                    "expose mp.solutions.face_mesh (removed in 0.10+). "
                    "looking_away detection is disabled. "
                    "Downgrade with: pip install 'mediapipe<0.10' to enable it.",
                    getattr(mp, "__version__", "unknown"),
                )
        except (ImportError, AttributeError, Exception) as exc:
            self._available = False
            logger.warning(
                "HeadPoseEstimator: could not load MediaPipe (%s). "
                "looking_away detection is disabled.", exc
            )
        self._mp_loaded = True

    # ── Inference ──────────────────────────────────────────────────────────────

    def estimate(
        self,
        frame_bgr:   np.ndarray,
        prev_angles: Optional[tuple[float, float, float]] = None,
    ) -> list[dict[str, Any]]:
        """
        Estimate head pose from a cropped zone frame.

        Parameters
        ----------
        frame_bgr   : BGR numpy array — typically ``ZoneCrop.model_input``.
        prev_angles : (pitch, yaw, roll) from the previous frame for the same
                      zone.  Pass ``None`` to skip ``head_movement`` detection.

        Returns
        -------
        List of alert dicts (empty if pose is normal and no movement spike).
        """
        if not self._mp_loaded:
            self.load()

        if not self._available:
            return []   # graceful degradation

        if frame_bgr is None or frame_bgr.size == 0:
            return []

        h, w = frame_bgr.shape[:2]

        # MediaPipe expects RGB
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

        mp_result = self._face_mesh.process(frame_rgb)

        if not mp_result.multi_face_landmarks:
            # No face found — face_detector already handles no_face alert
            return []

        landmarks = mp_result.multi_face_landmarks[0]

        # Extract the 6 anchor 2-D points
        image_points = np.array([
            [landmarks.landmark[idx].x * w,
             landmarks.landmark[idx].y * h]
            for idx in _LM_INDICES
        ], dtype=np.float64)

        # Build a simple camera matrix (pinhole model, principal point centred)
        focal_length = w
        cam_matrix   = np.array([
            [focal_length, 0,            w / 2],
            [0,            focal_length, h / 2],
            [0,            0,            1    ],
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

        success, rvec, _tvec = cv2.solvePnP(
            _MODEL_POINTS, image_points,
            cam_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )

        if not success:
            logger.debug("HeadPoseEstimator: solvePnP did not converge.")
            return []

        pitch, yaw, roll = _rotation_vector_to_euler(rvec)

        logger.debug(
            "HeadPose: pitch=%.1f°  yaw=%.1f°  roll=%.1f°", pitch, yaw, roll
        )

        alerts: list[dict[str, Any]] = []

        # ── looking_away check ─────────────────────────────────────────────────
        if abs(yaw) > YAW_THRESHOLD or abs(pitch) > PITCH_THRESHOLD:
            # Confidence scales with how far past the threshold the angle is
            yaw_excess   = max(0.0, abs(yaw)   - YAW_THRESHOLD)
            pitch_excess = max(0.0, abs(pitch) - PITCH_THRESHOLD)
            excess       = max(yaw_excess, pitch_excess)
            confidence   = min(1.0, 0.60 + excess / 90.0)

            alerts.append({
                "type":       "looking_away",
                "severity":   "medium",
                "confidence": round(confidence, 4),
                "yaw":        round(yaw,   2),
                "pitch":      round(pitch, 2),
                "roll":       round(roll,  2),
                "detector":   "head_pose",
            })
            logger.info(
                "Alert: looking_away  yaw=%.1f°  pitch=%.1f°  conf=%.2f",
                yaw, pitch, confidence,
            )

        # ── head_movement check (requires previous angles) ─────────────────────
        if prev_angles is not None:
            prev_pitch, prev_yaw, prev_roll = prev_angles
            delta = math.sqrt(
                (pitch - prev_pitch) ** 2 +
                (yaw   - prev_yaw)   ** 2 +
                (roll  - prev_roll)  ** 2
            )
            if delta > MOVEMENT_THRESHOLD:
                confidence = min(1.0, 0.55 + delta / 90.0)
                alerts.append({
                    "type":       "head_movement",
                    "severity":   "low",
                    "confidence": round(confidence, 4),
                    "yaw":        round(yaw,   2),
                    "pitch":      round(pitch, 2),
                    "roll":       round(roll,  2),
                    "delta_deg":  round(delta, 2),
                    "detector":   "head_pose",
                })
                logger.info(
                    "Alert: head_movement  Δ=%.1f°  conf=%.2f", delta, confidence
                )

        return alerts

    def current_angles(
        self,
        frame_bgr: np.ndarray,
    ) -> Optional[tuple[float, float, float]]:
        """
        Return (pitch, yaw, roll) without generating alerts.

        Used by the dispatcher to cache angles between frames for
        ``head_movement`` detection.
        """
        if not self._mp_loaded:
            self.load()
        if not self._available or frame_bgr is None:
            return None

        h, w = frame_bgr.shape[:2]
        frame_rgb  = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_result  = self._face_mesh.process(frame_rgb)
        if not mp_result.multi_face_landmarks:
            return None

        landmarks    = mp_result.multi_face_landmarks[0]
        image_points = np.array([
            [landmarks.landmark[idx].x * w,
             landmarks.landmark[idx].y * h]
            for idx in _LM_INDICES
        ], dtype=np.float64)

        focal_length = w
        cam_matrix   = np.array([
            [focal_length, 0,            w / 2],
            [0,            focal_length, h / 2],
            [0,            0,            1    ],
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

        ok, rvec, _ = cv2.solvePnP(
            _MODEL_POINTS, image_points,
            cam_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )
        if not ok:
            return None
        return _rotation_vector_to_euler(rvec)   # (pitch, yaw, roll)

    def unload(self) -> None:
        """Release MediaPipe resources."""
        if self._face_mesh is not None:
            self._face_mesh.close()
            self._face_mesh = None
        self._mp_loaded = False
        logger.info("HeadPoseEstimator unloaded.")


# ── Singleton ──────────────────────────────────────────────────────────────────
_singleton: Optional[HeadPoseEstimator] = None


def get_head_pose_estimator() -> HeadPoseEstimator:
    """Return the module-level ``HeadPoseEstimator`` singleton."""
    global _singleton
    if _singleton is None:
        _singleton = HeadPoseEstimator()
        _singleton.load()
    return _singleton
