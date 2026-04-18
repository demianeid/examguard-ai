"""
myproject_backend.hardware.runpod_worker.handler
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
RunPod serverless entry point for ExamGuard AI.

Invocation flow
---------------
1. RunPod calls ``handler(event)`` with the JSON payload sent by the
   Django frame_dispatcher.
2. ``handler`` validates the payload and delegates to
   ``ai_engine.zone_processor.process_frame()``.
3. The per-zone result list is returned to RunPod and echoed back to
   the dispatcher via the /runsync response.

Event schema (sent by frame_dispatcher.dispatcher)
--------------------------------------------------
{
    "input": {
        "frame":      "<base64-encoded JPEG>",
        "zones":      [
            {"id": 1, "student_code": "S001", "student_name": "Alice",
             "x1": 100, "y1": 50, "x2": 300, "y2": 250},
            ...
        ],
        "exam_id":    42,
        "session_id": 7
    }
}

Response schema
---------------
{
    "results": [
        {
            "zone_id":      1,
            "student_code": "S001",
            "student_name": "Alice",
            "roi":          {"x1": 100, "y1": 50, "x2": 300, "y2": 250},
            "is_valid":     true,
            "alerts":       []          ← populated by detectors in Phase 3
        },
        ...
    ]
}

Phase status
------------
Phase 2 — Zone cropping pipeline ACTIVE.
  ✅ Frame decode
  ✅ ROI clamp + crop per StudentZone
  ✅ Resize to model-input resolution (640×640)
  ✅ Structured per-zone result returned
  ⏳ Alert populations — Phase 3 (model inference)
"""

from __future__ import annotations

import logging
import os
import sys
import time

# ── Path setup (Docker WORKDIR = /app; ai_engine lives at /app/ai_engine) ─────
# When built via Dockerfile, COPY ../ai_engine ./ai_engine places the package
# at /app/ai_engine, so `import ai_engine` resolves naturally.
# For local dev we add the hardware/ parent to sys.path so the same import works.
_HERE = os.path.dirname(os.path.abspath(__file__))
_HARDWARE_DIR = os.path.abspath(os.path.join(_HERE, ".."))
_BACKEND_DIR  = os.path.abspath(os.path.join(_HERE, "..", "..", ".."))

for _p in (_HARDWARE_DIR, _BACKEND_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import runpod

from hardware.ai_engine.zone_processor import process_frame  # type: ignore[import]

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("examguard.handler")


# ── Payload validation ─────────────────────────────────────────────────────────

def _validate_payload(payload: dict) -> tuple[str, list, int, int]:
    """
    Extract and type-check required fields from the RunPod input payload.

    Returns
    -------
    frame_b64, zones, exam_id, session_id

    Raises
    ------
    ValueError   if a required field is missing or has the wrong type.
    """
    frame_b64 = payload.get("frame")
    if not isinstance(frame_b64, str) or not frame_b64:
        raise ValueError("'frame' must be a non-empty base64 string.")

    zones = payload.get("zones", [])
    if not isinstance(zones, list):
        raise ValueError("'zones' must be a list.")

    try:
        exam_id    = int(payload.get("exam_id", 0))
        session_id = int(payload.get("session_id", 0))
    except (TypeError, ValueError) as exc:
        raise ValueError(f"'exam_id' and 'session_id' must be integers: {exc}") from exc

    return frame_b64, zones, exam_id, session_id


# ── Handler ────────────────────────────────────────────────────────────────────

def handler(event: dict) -> dict:
    """
    RunPod serverless handler — called once per frame-dispatch cycle.

    The function is stateless: all model state lives in module-level
    singletons loaded in Phase 3. Here we purely route the payload and
    return the results.
    """
    t0 = time.perf_counter()

    try:
        payload = event.get("input") or {}

        # Validate
        frame_b64, zones, exam_id, session_id = _validate_payload(payload)

        logger.info(
            "handler() | exam=%s  session=%s  zones=%d",
            exam_id, session_id, len(zones),
        )

        # Delegate to zone-cropping pipeline (Phase 2) and, from Phase 3
        # onwards, to the AI detectors wired inside process_frame().
        results = process_frame(frame_b64, zones)

        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.info(
            "handler() → %d result(s)  |  %.1f ms",
            len(results), elapsed_ms,
        )

        return {
            "results":    results,
            "exam_id":    exam_id,
            "session_id": session_id,
            "elapsed_ms": round(elapsed_ms, 1),
        }

    except ValueError as exc:
        logger.error("Invalid payload: %s", exc)
        return {"error": f"Invalid payload: {exc}"}

    except Exception as exc:          # noqa: BLE001
        logger.exception("Unhandled exception in handler: %s", exc)
        return {"error": str(exc)}


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logger.info("Starting ExamGuard RunPod worker …")
    runpod.serverless.start({"handler": handler})
