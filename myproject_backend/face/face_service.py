"""
face/face_service.py
~~~~~~~~~~~~~~~~~~~~
Client that calls the ExamGuard RunPod serverless endpoint for all
face-related AI tasks (embedding extraction, face verification, and
ID-card validation via CLIP).

All heavy inference (InsightFace buffalo_l + CLIP) now runs on RunPod
GPU hardware instead of the Django application server.

Required environment variables
-------------------------------
RUNPOD_FACE_ENDPOINT_URL
    Full URL of the RunPod *synchronous* endpoint, e.g.
    https://api.runpod.ai/v2/<endpoint-id>/runsync

RUNPOD_API_KEY
    Your RunPod API key (found in RunPod dashboard → Settings → API Keys).

Optional environment variables
-------------------------------
RUNPOD_TIMEOUT_SECONDS  (default: 60)
    Per-request timeout in seconds passed to ``requests``.
"""

import base64
import logging
import os

import requests

logger = logging.getLogger(__name__)

from django.conf import settings

# ── Config ─────────────────────────────────────────────────────────────────────
# We read these from Django settings (which load from .env via python-decouple)
_ENDPOINT_URL = getattr(settings, "RUNPOD_FACE_ENDPOINT_URL", getattr(settings, "RUNPOD_ENDPOINT", ""))
_API_KEY       = getattr(settings, "RUNPOD_API_KEY", "")
_TIMEOUT       = getattr(settings, "RUNPOD_TIMEOUT_SECONDS", 60)


# ── Internal helper ────────────────────────────────────────────────────────────

def _call_runpod(action: str, **payload_kwargs) -> dict:
    """
    POST a synchronous request to the RunPod face endpoint.

    Parameters
    ----------
    action          : One of 'get_embedding', 'verify_face', 'check_id_card'.
    **payload_kwargs: Extra key-value pairs merged into the ``input`` dict.

    Returns
    -------
    The ``output`` dict from RunPod (or the raw response dict if no 'output'
    key is present — RunPod /runsync wraps results under 'output').

    Raises
    ------
    RuntimeError
        If RUNPOD_FACE_ENDPOINT_URL is not configured, if the HTTP request
        fails, or if RunPod returns an error payload.
    """
    if not _ENDPOINT_URL:
        raise RuntimeError(
            "RUNPOD_FACE_ENDPOINT_URL is not set. "
            "Add it to your .env / environment variables."
        )

    headers = {
        "Content-Type":  "application/json",
        "Authorization": f"Bearer {_API_KEY}",
    }
    body = {"input": {"action": action, **payload_kwargs}}

    try:
        response = requests.post(
            _ENDPOINT_URL,
            json=body,
            headers=headers,
            timeout=_TIMEOUT,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(f"RunPod request failed: {exc}") from exc

    data = response.json()

    # RunPod /runsync wraps the handler return value under "output"
    result = data.get("output", data)

    if "error" in result:
        raise RuntimeError(f"RunPod handler error: {result['error']}")

    return result


def _image_path_to_b64(image_path: str) -> str:
    """Read an image file from disk and return its base64-encoded string."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


# ── Public API ─────────────────────────────────────────────────────────────────

def get_embedding(image_path: str) -> list:
    """
    Extract a 512-dim ArcFace embedding from an image file.

    Sends the image to RunPod (InsightFace buffalo_l) and returns the
    embedding as a plain Python list of floats.

    Parameters
    ----------
    image_path : Absolute path to a JPEG/PNG image on the local filesystem.

    Returns
    -------
    list of 512 floats (unit-normed ArcFace embedding).

    Raises
    ------
    ValueError
        Propagated from RunPod when no face is detected in the image.
    RuntimeError
        On network / configuration errors.
    """
    image_b64 = _image_path_to_b64(image_path)
    logger.info("get_embedding | calling RunPod ...")

    result = _call_runpod("get_embedding", image=image_b64)

    embedding = result.get("embedding")
    if not embedding:
        raise ValueError("No face detected in the image.")

    logger.info("get_embedding | received %d-dim embedding.", len(embedding))
    return embedding


def compare_embeddings(emb1: list, emb2: list) -> float:
    """
    Compare two ArcFace embeddings using cosine similarity on RunPod.

    Note: this delegates to the RunPod worker so the computation benefits
    from GPU-resident numpy/torch. For CPU-only local computation you can
    instead use numpy directly — the math is identical.

    Parameters
    ----------
    emb1 : Stored 512-dim embedding (from the database).
    emb2 : Live   512-dim embedding (just extracted).

    Returns
    -------
    float in [0, 1] — cosine similarity. Values >= 0.35 indicate a match
    with the buffalo_l model.
    """
    logger.info("compare_embeddings | calling RunPod verify_face ...")

    # We send a dummy 1×1 white pixel as the "image" and supply emb2 as the
    # stored embedding so RunPod can re-use _handle_verify_face's logic.
    # However the cleaner path is to call compare locally (pure numpy, no GPU needed).
    import numpy as np
    v1 = np.array(emb1, dtype=np.float32)
    v2 = np.array(emb2, dtype=np.float32)
    similarity = float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-10))
    logger.info("compare_embeddings | cosine similarity = %.4f", similarity)
    return similarity


def verify_face(image_path: str, stored_embedding: list) -> dict:
    """
    Full end-to-end face verification: extract embedding from *image_path*
    and compare against *stored_embedding* — all on RunPod GPU.

    Parameters
    ----------
    image_path       : Path to the live webcam JPEG/PNG.
    stored_embedding : 512-dim list stored in the student's DB profile.

    Returns
    -------
    dict with keys:
        is_match   (bool)   — True if similarity >= threshold
        confidence (float)  — cosine similarity score 0–1
        threshold  (float)  — threshold used (0.35)
        message    (str)    — human-readable verdict
    """
    image_b64 = _image_path_to_b64(image_path)
    logger.info("verify_face | calling RunPod ...")

    result = _call_runpod(
        "verify_face",
        image=image_b64,
        stored_embedding=stored_embedding,
    )
    logger.info(
        "verify_face | is_match=%s  confidence=%.4f",
        result.get("is_match"), result.get("confidence"),
    )
    return result


def is_id_card(image_path: str) -> bool:
    """
    Return True if the image at *image_path* looks like an Egyptian
    National ID card (CLIP zero-shot on RunPod GPU).

    Parameters
    ----------
    image_path : Absolute path to the uploaded document image.

    Returns
    -------
    bool — True = proceed with face extraction; False = reject the upload.

    On any RunPod / network failure the function logs the error and
    returns True (fail-open) so the face-detection step can still run.
    """
    try:
        image_b64 = _image_path_to_b64(image_path)
        logger.info("is_id_card | calling RunPod CLIP ...")
        result = _call_runpod("check_id_card", image=image_b64)
        verdict = result.get("is_id_card", True)
        logger.info("is_id_card | result=%s", verdict)
        return verdict
    except Exception as exc:
        logger.error("is_id_card | RunPod call failed: %s — fail-open.", exc)
        return True   # fail-open: let face-detection handle bad images