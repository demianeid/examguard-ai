"""
handler.py — ExamGuard AI RunPod Serverless Entry Point
=======================================================
Docker WORKDIR: /app
Package layout:
    /app/handler.py              ← this file
    /app/ai_engine/              ← inference package
    /app/ai_engine/models/       ← yolov8n.pt + yolov10n-face.pt  (baked at build)

Multi-action event schema
-------------------------
All requests share the same top-level wrapper:
{
    "input": {
        "action": "<action_name>",   ← required (see actions below)
        ... action-specific fields ...
    }
}

─────────────────────────────────────────────────────────────────────────────────
ACTION: "proctor"   (live-exam frame analysis — original pipeline)
─────────────────────────────────────────────────────────────────────────────────
{
    "input": {
        "action":     "proctor",
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
Response:
{
    "results":    [...],
    "exam_id":    42,
    "session_id": 7,
    "elapsed_ms": 142.3
}

─────────────────────────────────────────────────────────────────────────────────
ACTION: "get_embedding"   (InsightFace ArcFace — student registration)
─────────────────────────────────────────────────────────────────────────────────
{
    "input": {
        "action": "get_embedding",
        "image":  "<base64-encoded JPEG/PNG>"   ← face photo or ID-card crop
    }
}
Response:
{
    "embedding": [0.023, -0.011, ...],   ← 512 floats, unit-normed
    "elapsed_ms": 38.2
}
Error (no face):  {"error": "No face detected in the image."}

─────────────────────────────────────────────────────────────────────────────────
ACTION: "verify_face"   (compare live photo vs stored embedding)
─────────────────────────────────────────────────────────────────────────────────
{
    "input": {
        "action":           "verify_face",
        "image":            "<base64-encoded JPEG/PNG>",   ← live webcam frame
        "stored_embedding": [0.023, -0.011, ...]           ← 512 floats from DB
    }
}
Response:
{
    "is_match":   true,
    "confidence": 0.7321,
    "threshold":  0.35,
    "message":    "Identity verified ✓",
    "elapsed_ms": 45.1
}

─────────────────────────────────────────────────────────────────────────────────
ACTION: "check_id_card"   (CLIP zero-shot — validate uploaded document)
─────────────────────────────────────────────────────────────────────────────────
{
    "input": {
        "action": "check_id_card",
        "image":  "<base64-encoded JPEG/PNG>"   ← document photo
    }
}
Response:
{
    "is_id_card": true,
    "elapsed_ms": 61.8
}
"""

from __future__ import annotations

import logging
import os
import time

import runpod

# ── AI engine imports ─────────────────────────────────────────────────────────
from ai_engine.detector      import AIDetector
from ai_engine.zone_processor import process_frame
from ai_engine.face_embedder  import (
    FaceEmbedder,
    IDCardChecker,
    get_face_embedder,
    get_id_card_checker,
    DEFAULT_VERIFY_THRESHOLD,
)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("examguard.handler")

# ── Action constants ──────────────────────────────────────────────────────────
ACTION_PROCTOR       = "proctor"
ACTION_GET_EMBEDDING = "get_embedding"
ACTION_VERIFY_FACE   = "verify_face"
ACTION_CHECK_ID_CARD = "check_id_card"

KNOWN_ACTIONS = {ACTION_PROCTOR, ACTION_GET_EMBEDDING, ACTION_VERIFY_FACE, ACTION_CHECK_ID_CARD}

# ── Warm-up: load all models once at container startup ────────────────────────
# RunPod keeps the container alive between invocations (warm pool).
# Loading here ensures zero cold-start inference latency.
logger.info("=== ExamGuard Worker starting — loading models ===")

# 1. YOLO proctoring pipeline (phone + face count + head pose)
_ai = AIDetector()
_ai.load_models(
    phone_model_path="ai_engine/models/yolov8n.pt",
    face_model_path="ai_engine/models/yolov10n-face.pt",
)
logger.info("=== YOLO models loaded. Status: %s ===", _ai.status)

# 2. InsightFace buffalo_l (ArcFace embeddings)
_embedder = get_face_embedder()
logger.info("=== InsightFace buffalo_l loaded ===")

# 3. CLIP (ID-card checker)
_checker = get_id_card_checker()
logger.info("=== CLIP IDCardChecker loaded ===")

logger.info("=== All models ready. Worker accepting requests. ===")


# ── Payload validators ────────────────────────────────────────────────────────

def _validate_proctor(payload: dict) -> tuple[str, list, int, int]:
    """
    Validate the 'proctor' action payload.

    Returns: frame_b64, zones, exam_id, session_id
    Raises:  ValueError on missing / invalid fields.
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


def _validate_image(payload: dict) -> str:
    """
    Validate that payload contains a non-empty 'image' base64 string.

    Used by get_embedding, verify_face, and check_id_card.
    """
    image_b64 = payload.get("image")
    if not isinstance(image_b64, str) or not image_b64.strip():
        raise ValueError("'image' must be a non-empty base64 JPEG/PNG string.")
    return image_b64


def _validate_stored_embedding(payload: dict) -> list[float]:
    """
    Validate that payload contains a 'stored_embedding' list of floats.
    """
    emb = payload.get("stored_embedding")
    if not isinstance(emb, list) or len(emb) == 0:
        raise ValueError("'stored_embedding' must be a non-empty list of floats.")
    return [float(x) for x in emb]


# ── Action handlers ───────────────────────────────────────────────────────────

def _handle_proctor(payload: dict) -> dict:
    """
    Live-exam frame analysis.
    Decodes the frame, crops student zones, runs YOLO + head-pose detectors.
    """
    t0 = time.perf_counter()

    frame_b64, zones, exam_id, session_id = _validate_proctor(payload)

    logger.info(
        "proctor | exam=%s  session=%s  zones=%d",
        exam_id, session_id, len(zones),
    )

    results    = process_frame(frame_b64, zones)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    alert_count = sum(len(r.get("alerts", [])) for r in results)

    logger.info(
        "proctor done | %d zone(s)  %d alert(s)  %.1f ms",
        len(results), alert_count, elapsed_ms,
    )

    return {
        "results":    results,
        "exam_id":    exam_id,
        "session_id": session_id,
        "elapsed_ms": round(elapsed_ms, 1),
    }


def _handle_get_embedding(payload: dict) -> dict:
    """
    Extract a 512-dim ArcFace embedding from the supplied image.
    Used during student registration to encode the face on the ID card.
    """
    t0        = time.perf_counter()
    image_b64 = _validate_image(payload)

    logger.info("get_embedding | processing image ...")
    embedding  = _embedder.get_embedding(image_b64)   # raises ValueError if no face
    elapsed_ms = (time.perf_counter() - t0) * 1000

    logger.info("get_embedding done | %.1f ms", elapsed_ms)
    return {
        "embedding":  embedding,
        "elapsed_ms": round(elapsed_ms, 1),
    }


def _handle_verify_face(payload: dict) -> dict:
    """
    Compare a live webcam frame against a stored ArcFace embedding.
    Returns is_match, confidence score, and threshold used.
    """
    t0               = time.perf_counter()
    image_b64        = _validate_image(payload)
    stored_embedding = _validate_stored_embedding(payload)

    logger.info("verify_face | extracting live embedding ...")
    live_embedding = _embedder.get_embedding(image_b64)   # raises ValueError if no face

    similarity = FaceEmbedder.compare(stored_embedding, live_embedding)
    is_match   = similarity >= DEFAULT_VERIFY_THRESHOLD
    elapsed_ms = (time.perf_counter() - t0) * 1000

    logger.info(
        "verify_face done | confidence=%.4f  is_match=%s  %.1f ms",
        similarity, is_match, elapsed_ms,
    )
    return {
        "is_match":   is_match,
        "confidence": round(similarity, 4),
        "threshold":  DEFAULT_VERIFY_THRESHOLD,
        "message":    "Identity verified ✓" if is_match else "Face does not match ✗",
        "elapsed_ms": round(elapsed_ms, 1),
    }


def _handle_check_id_card(payload: dict) -> dict:
    """
    Run CLIP zero-shot classification to decide whether the supplied image
    is an Egyptian National ID card.
    """
    t0        = time.perf_counter()
    image_b64 = _validate_image(payload)

    logger.info("check_id_card | running CLIP ...")
    result     = _checker.is_id_card(image_b64)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    logger.info("check_id_card done | is_id_card=%s  %.1f ms", result, elapsed_ms)
    return {
        "is_id_card": result,
        "elapsed_ms": round(elapsed_ms, 1),
    }


# ── Router ────────────────────────────────────────────────────────────────────

_ACTION_DISPATCH = {
    ACTION_PROCTOR:       _handle_proctor,
    ACTION_GET_EMBEDDING: _handle_get_embedding,
    ACTION_VERIFY_FACE:   _handle_verify_face,
    ACTION_CHECK_ID_CARD: _handle_check_id_card,
}


# ── Main handler ──────────────────────────────────────────────────────────────

def handler(event: dict) -> dict:
    """
    RunPod serverless handler — invoked once per request.

    Routes to the appropriate action handler based on ``input.action``.
    All GPU model state lives in module-level singletons (loaded at startup).
    This function only routes, validates, and times each request.
    """
    try:
        payload = event.get("input") or {}
        action  = payload.get("action", ACTION_PROCTOR)   # default: proctor (back-compat)

        if action not in KNOWN_ACTIONS:
            return {
                "error": (
                    f"Unknown action '{action}'. "
                    f"Valid actions: {sorted(KNOWN_ACTIONS)}"
                )
            }

        logger.info("handler() | action=%s", action)
        return _ACTION_DISPATCH[action](payload)

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
