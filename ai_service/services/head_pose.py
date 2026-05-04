"""
head_pose.py – lightweight, low-latency head-pose service.

Key design decisions
────────────────────
• Uses mediapipe.tasks.vision.FaceLandmarker (compatible with mediapipe 0.10.30+).
  The legacy mp.solutions API was removed in these versions.
• A single FaceLandmarker instance is reused for the lifetime of the process
  (no per-call model construction overhead).
• Frame-skipping: `analyze_frame` only runs inference every
  `FRAME_INTERVAL` calls; in-between calls return the cached result.
• Stateful debouncing via `HeadPoseTracker`: an alert is emitted only
  on the *transition* from "looking forward" → "looking away", not on
  every frame while the violation persists.
• Thresholds are intentionally a bit relaxed to reduce false positives
  from natural head movement.
"""

import os
import mediapipe as mp
from mediapipe.tasks.python import vision as mp_vision
from mediapipe.tasks.python.core import base_options as mp_base

# ── Model path ────────────────────────────────────────────────────────────────
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "models",
    "face_landmarker.task",
)
_MODEL_PATH = os.path.abspath(_MODEL_PATH)

# ── Singleton FaceLandmarker (created once, reused forever) ──────────────────
_base_options = mp_base.BaseOptions(model_asset_path=_MODEL_PATH)
_options = mp_vision.FaceLandmarkerOptions(
    base_options=_base_options,
    output_face_blendshapes=False,
    output_facial_transformation_matrixes=False,
    num_faces=3,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    running_mode=mp_vision.RunningMode.IMAGE,
)
_face_landmarker = mp_vision.FaceLandmarker.create_from_options(_options)

# ── Tunable constants ──────────────────────────────────────────────────────────
HORIZONTAL_THRESHOLD = 0.35   # ratio – increased from 0.18 for less strictness
VERTICAL_THRESHOLD   = 0.25   # ratio – increased from 0.15 for less strictness
CONFIRM_FRAMES       = 2      # consecutive suspicious frames (2 × 400ms ≈ 800ms at WS rate)
NO_FACE_CRITICAL_FRAMES = 5   # 5 frames ≈ 2 seconds
FRAME_INTERVAL       = 3      # run inference only every N frames


# ── Pure geometry helper ───────────────────────────────────────────────────────
def get_head_pose(landmarks, w: int, h: int) -> tuple[float, float]:
    """Return (h_ratio, v_ratio) in the range roughly [-0.5, +0.5].

    Works with both the new NormalizedLandmark objects (from FaceLandmarker)
    which expose .x / .y attributes in [0, 1].
    """
    nose       = landmarks[1]
    chin       = landmarks[152]
    forehead   = landmarks[10]
    left_face  = landmarks[234]
    right_face = landmarks[454]

    nose_x    = nose.x * w
    center_x  = (left_face.x + right_face.x) / 2 * w
    face_width = abs(right_face.x - left_face.x) * w

    nose_y     = nose.y * h
    center_y   = (forehead.y + chin.y) / 2 * h
    face_height = abs(chin.y - forehead.y) * h

    h_ratio = (nose_x - center_x) / (face_width  + 1e-6)
    v_ratio = (nose_y - center_y) / (face_height + 1e-6)

    return h_ratio, v_ratio


def _run_inference(rgb_frame):
    """Run FaceLandmarker inference on an RGB numpy array.

    Returns a list of face landmark lists (one per face), or an empty list.
    Each face landmark list is a list of NormalizedLandmark with .x/.y/.z.
    """
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_frame,
    )
    detection_result = _face_landmarker.detect(mp_image)
    return detection_result.face_landmarks  # list[list[NormalizedLandmark]]


# ── Stateless single-frame analyser (for API / one-shot usage) ────────────────
_frame_counter  = 0
_cached_result: dict | None = None


def analyze_frame(rgb_frame) -> dict:
    """
    Analyse *rgb_frame* and return a result dict.

    Runs FaceLandmarker inference only every ``FRAME_INTERVAL`` frames;
    otherwise returns the previous result unchanged (cheap path).
    """
    global _frame_counter, _cached_result

    _frame_counter += 1
    if _cached_result is not None and (_frame_counter % FRAME_INTERVAL != 0):
        return _cached_result

    h, w = rgb_frame.shape[:2]
    all_face_landmarks = _run_inference(rgb_frame)

    if not all_face_landmarks:
        _cached_result = {
            "face_detected": False,
            "multiple_faces": False,
            "h_ratio":       0.0,
            "v_ratio":       0.0,
            "direction":     "NO FACE",
            "suspicious":    True,
        }
        return _cached_result

    multiple_faces = len(all_face_landmarks) > 1

    lm = all_face_landmarks[0]
    h_ratio, v_ratio = get_head_pose(lm, w, h)

    suspicious = False
    direction  = ""

    if multiple_faces:
        suspicious = True
        direction  = "MULTIPLE FACES DETECTED"
    else:
        if h_ratio > HORIZONTAL_THRESHOLD:
            suspicious = True
            direction  = "LOOKING RIGHT"
        elif h_ratio < -HORIZONTAL_THRESHOLD:
            suspicious = True
            direction  = "LOOKING LEFT"

        if v_ratio > VERTICAL_THRESHOLD:
            suspicious = True
            direction  = "LOOKING DOWN" if not direction else direction + " + DOWN"

    _cached_result = {
        "face_detected": True,
        "multiple_faces": multiple_faces,
        "h_ratio":       round(h_ratio, 4),
        "v_ratio":       round(v_ratio, 4),
        "direction":     direction,
        "suspicious":    suspicious,
    }
    return _cached_result


# ── Stateful tracker – use this for live proctoring sessions ──────────────────
class HeadPoseTracker:
    """
    Wraps ``analyze_frame`` with:

    * Frame-rate throttling  – inference runs every ``frame_interval`` calls.
    * Consecutive-frame confirmation – a violation must persist for
      ``confirm_frames`` frames before it is accepted (reduces jitter).
    * Edge-triggered alerting – ``should_alert`` is True only on the
      *first* frame of a new violation, not while it continues.

    Usage::

        tracker = HeadPoseTracker()
        while True:
            frame = grab_bgr_frame()
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            info  = tracker.update(rgb)
            if info["should_alert"]:
                send_alert(info["direction"])
    """

    def __init__(
        self,
        frame_interval: int = FRAME_INTERVAL,
        confirm_frames: int = CONFIRM_FRAMES,
    ):
        self.frame_interval  = frame_interval
        self.confirm_frames  = confirm_frames

        self._call_count      = 0
        self._cached: dict | None = None

        # consecutive suspicious / ok counters
        self._suspicious_run  = 0
        self._ok_run          = 0

        # debounce state
        self._currently_away  = False   # True while a violation is active

    def update(self, rgb_frame) -> dict:
        """
        Process one frame and return an enriched result dict that includes:

        ``should_alert`` (bool)
            True only on the transition into a new looking-away event.
        ``alert_cleared`` (bool)
            True on the transition back to looking forward.
        """
        self._call_count += 1

        # ── Frame skipping ────────────────────────────────────────────────────
        if self._cached is not None and (self._call_count % self.frame_interval != 0):
            return {**self._cached, "should_alert": False, "alert_cleared": False}

        # ── Run inference ─────────────────────────────────────────────────────
        h, w = rgb_frame.shape[:2]
        all_face_landmarks = _run_inference(rgb_frame)

        if not all_face_landmarks:
            base = {
                "face_detected": False,
                "multiple_faces": False,
                "h_ratio":       0.0,
                "v_ratio":       0.0,
                "direction":     "NO FACE",
                "suspicious":    True,
            }
        else:
            multiple_faces = len(all_face_landmarks) > 1

            lm = all_face_landmarks[0]
            h_ratio, v_ratio = get_head_pose(lm, w, h)

            suspicious = False
            direction  = ""

            if multiple_faces:
                suspicious = True
                direction  = "MULTIPLE FACES DETECTED"
            else:
                if h_ratio > HORIZONTAL_THRESHOLD:
                    suspicious = True
                    direction  = "LOOKING RIGHT"
                elif h_ratio < -HORIZONTAL_THRESHOLD:
                    suspicious = True
                    direction  = "LOOKING LEFT"

                if v_ratio > VERTICAL_THRESHOLD:
                    suspicious = True
                    direction  = "LOOKING DOWN" if not direction else direction + " + DOWN"

            base = {
                "face_detected": True,
                "multiple_faces": multiple_faces,
                "h_ratio":       round(h_ratio, 4),
                "v_ratio":       round(v_ratio, 4),
                "direction":     direction,
                "suspicious":    suspicious,
            }

        # ── Consecutive-frame confirmation ────────────────────────────────────
        if base["suspicious"]:
            self._suspicious_run += 1
            self._ok_run          = 0
        else:
            self._ok_run          += 1
            self._suspicious_run   = 0

        confirmed_suspicious = self._suspicious_run >= self.confirm_frames
        confirmed_ok         = self._ok_run         >= self.confirm_frames

        # ── Edge-triggered debounce ───────────────────────────────────────────
        should_alert   = False
        alert_cleared  = False
        is_critical_no_face = False

        if confirmed_suspicious and not self._currently_away:
            self._currently_away = True
            should_alert = True          # ← fires ONCE per looking-away event

        # Trigger a SECOND alert if the face is missing for > 2 seconds
        if not base["face_detected"] and self._suspicious_run == NO_FACE_CRITICAL_FRAMES:
            should_alert = True
            is_critical_no_face = True

        if confirmed_ok and self._currently_away:
            self._currently_away = False
            alert_cleared = True         # ← fires ONCE when gaze returns

        self._cached = base
        return {**base, "should_alert": should_alert, "alert_cleared": alert_cleared, "is_critical_no_face": is_critical_no_face}