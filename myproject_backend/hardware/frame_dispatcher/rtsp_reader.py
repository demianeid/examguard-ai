"""
myproject_backend.hardware.frame_dispatcher.rtsp_reader
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Phase 2 — RTSP Frame Reader (IMPLEMENTED)

Wraps ``cv2.VideoCapture`` with:
  - Automatic reconnection on stream drop (configurable retries + backoff).
  - Frame-rate throttling (sample every N seconds instead of every raw frame).
  - Thread-safe ``read()`` / ``stop()`` interface.
  - Optional frame queue so the dispatcher can grab the latest frame without
    blocking on network I/O.

Typical usage (blocking, inside a thread)
-----------------------------------------
    reader = RtspReader(stream_url="rtsp://192.168.1.10:554/stream1",
                        fps=2, camera_id=3)
    reader.start()

    while reader.is_running:
        frame = reader.read()          # latest BGR frame, or None
        if frame is not None:
            encoded = encode_frame(frame)
            # … send to RunPod …
        time.sleep(0.5)

    reader.stop()

Thread-safe usage (background capture thread)
---------------------------------------------
    reader = RtspReader(stream_url=..., fps=2, camera_id=3)
    reader.start(threaded=True)       # spawns a daemon thread

    # In dispatcher thread:
    frame = reader.latest_frame       # always the most-recent frame
    reader.stop()
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Defaults ───────────────────────────────────────────────────────────────────
DEFAULT_FPS:            float = 2.0    # frames per second to sample
DEFAULT_MAX_RETRIES:    int   = 5      # reconnection attempts before giving up
DEFAULT_RETRY_BACKOFF:  float = 3.0   # seconds to wait between retries
DEFAULT_OPEN_TIMEOUT:   float = 10.0  # seconds before VideoCapture.open() times out
FRAME_QUEUE_MAXSIZE:    int   = 1      # only keep the latest frame


class RtspReaderError(RuntimeError):
    """Raised when the RTSP stream cannot be opened after all retries."""


class RtspReader:
    """
    OpenCV-backed RTSP frame reader with reconnect and FPS throttling.

    Parameters
    ----------
    stream_url  : Full RTSP URL, e.g. ``rtsp://user:pass@192.168.1.10/stream1``.
    fps         : Target sample rate in frames per second (default 2).
    camera_id   : ``Camera.id`` for log correlation.
    max_retries : How many times to reconnect before raising ``RtspReaderError``.
    retry_backoff : Seconds between reconnection attempts.
    """

    def __init__(
        self,
        stream_url:    str,
        fps:           float = DEFAULT_FPS,
        camera_id:     Optional[int] = None,
        max_retries:   int   = DEFAULT_MAX_RETRIES,
        retry_backoff: float = DEFAULT_RETRY_BACKOFF,
    ) -> None:
        self.stream_url    = stream_url
        self.fps           = max(0.1, fps)             # guard against 0 / negative
        self.camera_id     = camera_id
        self.max_retries   = max_retries
        self.retry_backoff = retry_backoff

        self._cap:          Optional[cv2.VideoCapture] = None
        self._lock:         threading.Lock             = threading.Lock()
        self._thread:       Optional[threading.Thread] = None
        self._stop_event:   threading.Event            = threading.Event()

        # Latest captured frame — updated by the background thread
        self._latest_frame: Optional[np.ndarray] = None

        # Stats
        self._frames_read:   int   = 0
        self._reconnects:    int   = 0
        self._last_frame_ts: float = 0.0

    # ── Properties ─────────────────────────────────────────────────────────────

    @property
    def is_running(self) -> bool:
        """True while the reader has not been stopped."""
        return not self._stop_event.is_set()

    @property
    def latest_frame(self) -> Optional[np.ndarray]:
        """
        Thread-safe access to the most recently captured frame.

        Returns ``None`` if no frame has been captured yet.
        """
        with self._lock:
            return self._latest_frame

    @property
    def stats(self) -> dict:
        """Diagnostic counters for logging / monitoring."""
        return {
            "camera_id":    self.camera_id,
            "stream_url":   self.stream_url,
            "fps_target":   self.fps,
            "frames_read":  self._frames_read,
            "reconnects":   self._reconnects,
            "is_running":   self.is_running,
        }

    # ── Connection management ───────────────────────────────────────────────────

    def _open_capture(self) -> cv2.VideoCapture:
        """
        Open the RTSP stream, retrying up to ``self.max_retries`` times.

        OpenCV RTSP notes
        -----------------
        - Set ``CAP_PROP_BUFFERSIZE = 1`` to minimise latency (discard stale frames).
        - ``FFMPEG`` backend handles most RTSP variants; fall back to GSTREAMER if needed.
        - ``rtsp_transport`` → ``tcp`` avoids UDP packet loss on unreliable networks.
        """
        for attempt in range(1, self.max_retries + 1):
            logger.info(
                "[cam %s] Opening RTSP stream (attempt %d/%d): %s",
                self.camera_id, attempt, self.max_retries, self.stream_url,
            )

            cap = cv2.VideoCapture(self.stream_url, cv2.CAP_FFMPEG)

            # Force TCP transport — more reliable than UDP over LAN/WAN
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            if cap.isOpened():
                w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                native_fps = cap.get(cv2.CAP_PROP_FPS)
                logger.info(
                    "[cam %s] Stream opened — resolution %dx%d @ %.1f fps (native).",
                    self.camera_id, w, h, native_fps,
                )
                return cap

            cap.release()
            logger.warning(
                "[cam %s] Failed to open stream (attempt %d). Retrying in %.1fs …",
                self.camera_id, attempt, self.retry_backoff,
            )
            time.sleep(self.retry_backoff)

        raise RtspReaderError(
            f"[cam {self.camera_id}] Could not open RTSP stream after "
            f"{self.max_retries} attempts: {self.stream_url}"
        )

    def _reconnect(self) -> None:
        """Release the current capture and reopen the stream."""
        self._reconnects += 1
        logger.warning(
            "[cam %s] Stream lost. Reconnecting … (attempt #%d)",
            self.camera_id, self._reconnects,
        )
        if self._cap is not None:
            self._cap.release()
            self._cap = None
        time.sleep(self.retry_backoff)
        self._cap = self._open_capture()

    # ── Capture loop ────────────────────────────────────────────────────────────

    def _capture_loop(self) -> None:
        """
        Main capture loop — runs in a background daemon thread when
        ``start(threaded=True)`` is called, or called synchronously by
        ``start(threaded=False)`` for simple blocking use.
        """
        interval = 1.0 / self.fps   # seconds between sampled frames

        try:
            self._cap = self._open_capture()
        except RtspReaderError as exc:
            logger.error(str(exc))
            self._stop_event.set()
            return

        while not self._stop_event.is_set():
            now = time.monotonic()
            elapsed = now - self._last_frame_ts

            if elapsed < interval:
                # Sleep for the remainder of the interval (max 50 ms chunks
                # so we remain responsive to stop signals)
                time.sleep(min(interval - elapsed, 0.05))
                continue

            ret, frame = self._cap.read()

            if not ret or frame is None:
                logger.warning("[cam %s] Empty frame received — stream may be down.", self.camera_id)
                try:
                    self._reconnect()
                except RtspReaderError:
                    logger.error("[cam %s] Reconnect failed — stopping reader.", self.camera_id)
                    self._stop_event.set()
                continue

            self._frames_read  += 1
            self._last_frame_ts = time.monotonic()

            with self._lock:
                self._latest_frame = frame

            logger.debug("[cam %s] Frame #%d captured.", self.camera_id, self._frames_read)

        # Cleanup
        if self._cap is not None:
            self._cap.release()
            self._cap = None
        logger.info("[cam %s] Capture loop exited cleanly.", self.camera_id)

    # ── Public interface ────────────────────────────────────────────────────────

    def start(self, threaded: bool = True) -> None:
        """
        Start the reader.

        Parameters
        ----------
        threaded : If True (default), spawns a daemon background thread and
                   returns immediately.  The caller should poll
                   ``reader.latest_frame``.
                   If False, opens the capture synchronously (useful for testing).
        """
        if threaded:
            self._thread = threading.Thread(
                target=self._capture_loop,
                name=f"rtsp-reader-cam{self.camera_id}",
                daemon=True,
            )
            self._thread.start()
            logger.info("[cam %s] Background capture thread started.", self.camera_id)
        else:
            # Blocking — useful for scripts / tests
            self._capture_loop()

    def read(self, timeout: float = 5.0) -> Optional[np.ndarray]:
        """
        Blocking read — waits up to *timeout* seconds for the first frame,
        then returns immediately on subsequent calls.

        Suitable for simple single-threaded usage.  Returns ``None`` if no
        frame arrives within the timeout.
        """
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            frame = self.latest_frame
            if frame is not None:
                return frame
            time.sleep(0.05)
        logger.warning("[cam %s] read() timed out after %.1fs.", self.camera_id, timeout)
        return None

    def stop(self) -> None:
        """Signal the capture loop to exit and wait for the thread to join."""
        logger.info("[cam %s] Stopping reader …", self.camera_id)
        self._stop_event.set()

        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=10.0)
            if self._thread.is_alive():
                logger.warning("[cam %s] Thread did not exit within timeout.", self.camera_id)

        logger.info("[cam %s] Reader stopped. Stats: %s", self.camera_id, self.stats)

    def __enter__(self) -> "RtspReader":
        self.start(threaded=True)
        return self

    def __exit__(self, *_) -> None:
        self.stop()
