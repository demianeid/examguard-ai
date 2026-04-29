"""
head_pose.py – lightweight, low-latency head-pose service.

Key design decisions
────────────────────
• A single FaceMesh instance is reused for the lifetime of the process
  (no per-call model construction overhead).
• Frame-skipping: `analyze_frame` only runs inference every
  `FRAME_INTERVAL` calls; in-between calls return the cached result.
• Stateful debouncing via `HeadPoseTracker`: an alert is emitted only
  on the *transition* from "looking forward" → "looking away", not on
  every frame while the violation persists.
• Thresholds are intentionally a bit relaxed to reduce false positives
  from natural head movement.
"""

import mediapipe as mp

# ── Singleton FaceMesh (created once, reused forever) ─────────────────────────
_face_mesh = mp.solutions.face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

# ── Tunable constants ──────────────────────────────────────────────────────────
HORIZONTAL_THRESHOLD = 0.35   # ratio – increased from 0.18 for less strictness
VERTICAL_THRESHOLD   = 0.25   # ratio – increased from 0.15 for less strictness
CONFIRM_FRAMES       = 6      # consecutive suspicious frames – increased from 3
FRAME_INTERVAL       = 3      # run inference only every N frames


# ── Pure geometry helper ───────────────────────────────────────────────────────
def get_head_pose(landmarks, w: int, h: int) -> tuple[float, float]:
    """Return (h_ratio, v_ratio) in the range roughly [-0.5, +0.5]."""
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


# ── Stateless single-frame analyser (for API / one-shot usage) ────────────────
_frame_counter  = 0
_cached_result: dict | None = None


def analyze_frame(rgb_frame) -> dict:
    """
    Analyse *rgb_frame* and return a result dict.

    Runs FaceMesh inference only every ``FRAME_INTERVAL`` frames;
    otherwise returns the previous result unchanged (cheap path).
    """
    global _frame_counter, _cached_result

    _frame_counter += 1
    if _cached_result is not None and (_frame_counter % FRAME_INTERVAL != 0):
        return _cached_result

    h, w = rgb_frame.shape[:2]
    result = _face_mesh.process(rgb_frame)

    if not result.multi_face_landmarks:
        _cached_result = {
            "face_detected": False,
            "h_ratio":       0.0,
            "v_ratio":       0.0,
            "direction":     "NO FACE",
            "suspicious":    True,
        }
        return _cached_result

    lm = result.multi_face_landmarks[0].landmark
    h_ratio, v_ratio = get_head_pose(lm, w, h)

    suspicious = False
    direction  = ""

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
        result = _face_mesh.process(rgb_frame)

        if not result.multi_face_landmarks:
            base = {
                "face_detected": False,
                "h_ratio":       0.0,
                "v_ratio":       0.0,
                "direction":     "NO FACE",
                "suspicious":    True,
            }
        else:
            lm = result.multi_face_landmarks[0].landmark
            h_ratio, v_ratio = get_head_pose(lm, w, h)

            suspicious = False
            direction  = ""

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

        if confirmed_suspicious and not self._currently_away:
            self._currently_away = True
            should_alert = True          # ← fires ONCE per looking-away event

        if confirmed_ok and self._currently_away:
            self._currently_away = False
            alert_cleared = True         # ← fires ONCE when gaze returns

        self._cached = base
        return {**base, "should_alert": should_alert, "alert_cleared": alert_cleared}