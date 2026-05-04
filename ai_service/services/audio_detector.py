"""
Audio Anomaly Detector — ExamGuard AI Service
==============================================
Receives raw PCM Float32 chunks (16 kHz mono) from the browser via WebSocket.
Computes RMS energy (dBFS) and zero-crossing rate to detect:
  - loud_noise:       sudden loud environment noise
  - speech_detected:  human speech pattern (low ZCR + sustained energy)
  - clean:            no anomaly

Debounce logic mirrors HeadPoseTracker:
  - CONFIRM_FRAMES consecutive loud windows → fires should_alert once (edge-trigger)
  - COOLDOWN_SECONDS silence before next alert can fire
"""

import numpy as np
import time

# ── Detection thresholds ────────────────────────────────────────────────────
SAMPLE_RATE: int   = 16_000          # 16 kHz expected from browser AudioWorklet
WINDOW_SIZE: int   = 8_000           # 0.5 s window

LOUD_THRESHOLD_DB: float  = -35.0   # dBFS — above this = loud event
SPEECH_ZCR_MAX: float     = 0.15    # zero-crossing rate heuristic for speech
CONFIRM_FRAMES: int        = 2       # consecutive loud windows before alert fires
COOLDOWN_SECONDS: float    = 5.0    # minimum seconds between alerts


class AudioDetector:
    """Stateful per-student audio anomaly detector."""

    def __init__(self) -> None:
        self._loud_streak: int   = 0
        self._last_alert_ts: float = 0.0

    # ── Public API ───────────────────────────────────────────────────────────
    def update(self, pcm: np.ndarray) -> dict:
        """
        Process one PCM chunk.

        Parameters
        ----------
        pcm : np.ndarray  dtype=float32, shape=(N,)
            Mono audio samples normalised to [-1.0, 1.0].

        Returns
        -------
        dict with keys:
            suspicious   bool
            should_alert bool  (edge-triggered, respects cooldown)
            db_level     float (dBFS, ≤0)
            event_type   str   ('loud_noise' | 'speech_detected' | 'clean')
            reason       str | None
        """
        if pcm is None or len(pcm) == 0:
            return self._clean()

        # ── 1. RMS → dBFS ────────────────────────────────────────────────
        rms = float(np.sqrt(np.mean(pcm.astype(np.float64) ** 2)))
        if rms < 1e-10:
            db_level = -96.0
        else:
            db_level = float(20.0 * np.log10(rms))

        # ── 2. Zero-crossing rate ─────────────────────────────────────────
        zcr = float(np.mean(np.abs(np.diff(np.sign(pcm)))) / 2)

        # ── 3. Classify ───────────────────────────────────────────────────
        is_loud = db_level >= LOUD_THRESHOLD_DB

        if is_loud:
            self._loud_streak += 1
        else:
            self._loud_streak = 0

        suspicious = is_loud
        event_type = "clean"
        reason: str | None = None

        if is_loud:
            if zcr <= SPEECH_ZCR_MAX:
                event_type = "speech_detected"
                reason = f"Speech detected ({db_level:.1f} dBFS)"
            else:
                event_type = "loud_noise"
                reason = f"Loud noise ({db_level:.1f} dBFS)"

        # ── 4. Edge-trigger with cooldown ─────────────────────────────────
        now = time.monotonic()
        cooldown_ok = (now - self._last_alert_ts) >= COOLDOWN_SECONDS
        should_alert = (
            suspicious
            and self._loud_streak >= CONFIRM_FRAMES
            and cooldown_ok
        )

        if should_alert:
            self._last_alert_ts = now

        return {
            "suspicious":   suspicious,
            "should_alert": should_alert,
            "db_level":     round(db_level, 2),
            "event_type":   event_type,
            "reason":       reason,
        }

    # ── Helpers ──────────────────────────────────────────────────────────────
    @staticmethod
    def _clean() -> dict:
        return {
            "suspicious":   False,
            "should_alert": False,
            "db_level":     -96.0,
            "event_type":   "clean",
            "reason":       None,
        }
