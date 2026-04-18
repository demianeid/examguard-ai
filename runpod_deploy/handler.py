"""
handler.py — ExamGuard AI RunPod Serverless Entry Point
=======================================================
Docker WORKDIR: /app
Package layout:
    /app/handler.py         ← this file
    /app/ai_engine/         ← inference package
    /app/ai_engine/models/  ← yolov8n.pt + yolov10n-face.pt (baked at build time)

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
            "alerts": [
                {
                    "type":       "mobile_phone",
                    "severity":   "high",
                    "confidence": 0.87,
                    "detector":   "phone_detector"
                }
            ]
        }
    ],
    "exam_id":    42,
    "session_id": 7,
    "elapsed_ms": 142.3
}
"""

from __future__ import annotations

import logging
import os
import time

import runpod

# ── Clean import: ai_engine is at /app/ai_engine in the Docker container ──────
from ai_engine.detector import AIDetector
from ai_engine.zone_processor import process_frame

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("examguard.handler")

# ── Warm-up: load all models once at container startup ────────────────────────
# RunPod keeps the container alive between invocations (warm pool).
# Loading here ensures zero cold-start inference latency.
logger.info("=== ExamGuard Worker starting — loading models ===")
_ai = AIDetector()
_ai.load_models(
    phone_model_path="ai_engine/models/yolov8n.pt",
    face_model_path="ai_engine/models/yolov10n-face.pt",
)
logger.info("=== Models loaded. Status: %s ===", _ai.status)


# ── Payload validation ────────────────────────────────────────────────────────

def _validate(payload: dict) -> tuple[str, list, int, int]:
    """
    Extract and type-check required fields from the RunPod input dict.

    Returns: frame_b64, zones, exam_id, session_id
    Raises:  ValueError on missing/invalid fields.
    """
    frame_b64 = payload.get("frame")
    if not isinstance(frame_b64, str) or not frame_b64.strip():
        raise ValueError("'frame' must be a non-empty base64 string.")

    zones = payload.get("zones", [])
    if not isinstance(zones, list):
        raise ValueError("'zones' must be a JSON array.")
    if len(zones) == 0:
        raise ValueError("'zones' is empty — nothing to process.")

    try:
        exam_id    = int(payload.get("exam_id",    0))
        session_id = int(payload.get("session_id", 0))
    except (TypeError, ValueError) as exc:
        raise ValueError(f"'exam_id'/'session_id' must be integers: {exc}") from exc

    return frame_b64, zones, exam_id, session_id


# ── Handler ───────────────────────────────────────────────────────────────────

def handler(event: dict) -> dict:
    """
    RunPod serverless handler — invoked once per frame dispatch.

    Stateless: all GPU model state lives in the module-level ``_ai``
    singleton loaded at startup. This function only routes and times.
    """
    t0 = time.perf_counter()

    try:
        payload = event.get("input") or {}

        frame_b64, zones, exam_id, session_id = _validate(payload)

        logger.info(
            "handler() | exam=%s  session=%s  zones=%d",
            exam_id, session_id, len(zones),
        )

        # Full inference pipeline: decode → crop → detect → return alerts
        results = process_frame(frame_b64, zones)

        elapsed_ms = (time.perf_counter() - t0) * 1000
        alert_count = sum(len(r.get("alerts", [])) for r in results)

        logger.info(
            "handler() done | %d zone(s)  %d alert(s)  %.1f ms",
            len(results), alert_count, elapsed_ms,
        )

        return {
            "results":    results,
            "exam_id":    exam_id,
            "session_id": session_id,
            "elapsed_ms": round(elapsed_ms, 1),
        }

    except ValueError as exc:
        logger.warning("Invalid payload: %s", exc)
        return {"error": f"Invalid payload: {exc}"}

    except Exception as exc:          # noqa: BLE001
        logger.exception("Unhandled exception in handler: %s", exc)
        return {"error": str(exc)}


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logger.info("Starting ExamGuard RunPod serverless worker ...")
    runpod.serverless.start({"handler": handler})
