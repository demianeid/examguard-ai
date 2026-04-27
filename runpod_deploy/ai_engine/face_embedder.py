"""
ai_engine.face_embedder
~~~~~~~~~~~~~~~~~~~~~~~
InsightFace ArcFace embedding + OpenAI CLIP ID-card checker for the
ExamGuard RunPod GPU worker.

Two distinct tasks handled here
--------------------------------
1. FaceEmbedder  — extracts a 512-dim ArcFace embedding from a face photo
                   using InsightFace ``buffalo_l``.  Supports cosine-
                   similarity comparison.

2. IDCardChecker — uses OpenAI CLIP zero-shot classification to decide
                   whether a submitted image is a valid Egyptian National
                   ID card (not a selfie / random photo).

Both classes follow the same load() / unload() lifecycle as the rest of
``ai_engine`` so ``AIDetector`` can manage them uniformly.

Handler actions that use this module
-------------------------------------
  "get_embedding"  →  FaceEmbedder.get_embedding(image_b64) → list[float]
  "verify_face"    →  FaceEmbedder.compare(emb1, emb2)      → float
  "check_id_card"  →  IDCardChecker.is_id_card(image_b64)   → bool
"""

from __future__ import annotations

import base64
import logging
import os
import tempfile
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────────
# InsightFace stores downloaded models under ~/.insightface/models/
# At Docker build time the Dockerfile pre-populates that directory.
_INSIGHTFACE_ROOT = os.getenv("INSIGHTFACE_ROOT", os.path.expanduser("~/.insightface"))

# CLIP labels used for ID-card zero-shot classification
_CLIP_LABELS = [
    "Egyptian national ID card with Arabic text",
    "identity card document with photo and text",
    "a selfie photo",
    "a random image",
    "a landscape photo",
]
_CLIP_ID_SCORE_THRESHOLD = float(os.getenv("CLIP_ID_THRESHOLD", "0.30"))

# Face-verification cosine-similarity threshold
DEFAULT_VERIFY_THRESHOLD = float(os.getenv("FACE_VERIFY_THRESHOLD", "0.35"))


# ── Helpers ────────────────────────────────────────────────────────────────────

def _b64_to_bgr(image_b64: str) -> np.ndarray:
    """
    Decode a base64 JPEG/PNG string to a BGR numpy array.

    Raises ValueError if the bytes cannot be decoded as an image.
    """
    try:
        raw = base64.b64decode(image_b64)
    except Exception as exc:
        raise ValueError(f"Image is not valid base64: {exc}") from exc

    arr   = np.frombuffer(raw, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if frame is None:
        raise ValueError("cv2.imdecode returned None — not a valid JPEG/PNG.")
    return frame


def _bgr_to_tempfile(bgr: np.ndarray, suffix: str = ".jpg") -> str:
    """Write a BGR array to a temp file and return its path."""
    ok, buf = cv2.imencode(suffix, bgr)
    if not ok:
        raise RuntimeError("cv2.imencode failed — cannot write temp image.")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(buf.tobytes())
    tmp.close()
    return tmp.name


# ── FaceEmbedder ───────────────────────────────────────────────────────────────

class FaceEmbedder:
    """
    Extracts 512-dim ArcFace embeddings using InsightFace ``buffalo_l``.

    Designed as a long-lived singleton: load once at container startup,
    reuse across all RunPod invocations.

    Usage
    -----
    embedder = FaceEmbedder()
    embedder.load()

    embedding = embedder.get_embedding(image_b64)   # raises ValueError if no face
    similarity = FaceEmbedder.compare(emb1, emb2)   # cosine similarity 0–1
    """

    def __init__(self) -> None:
        self._app    = None
        self._loaded = False

    # ── Lifecycle ──────────────────────────────────────────────────────────────

    def load(self) -> None:
        """
        Load InsightFace buffalo_l model into memory.

        Safe to call multiple times — skipped if already loaded.
        Uses ctx_id=0 (first GPU) in the RunPod environment; falls back
        gracefully to CPU (ctx_id=-1) if no CUDA device is present.
        """
        if self._loaded:
            logger.debug("FaceEmbedder already loaded — skipping.")
            return

        try:
            from insightface.app import FaceAnalysis

            ctx_id = 0 if self._has_gpu() else -1
            logger.info("FaceEmbedder: loading buffalo_l on ctx_id=%d ...", ctx_id)

            self._app = FaceAnalysis(
                name="buffalo_l",
                root=_INSIGHTFACE_ROOT,
            )
            self._app.prepare(ctx_id=ctx_id, det_size=(640, 640))
            self._loaded = True
            logger.info("✅ FaceEmbedder (InsightFace buffalo_l) loaded.")

        except Exception as exc:
            logger.error("❌ FaceEmbedder failed to load: %s", exc)
            raise

    def unload(self) -> None:
        """Release InsightFace model from GPU/CPU memory."""
        self._app    = None
        self._loaded = False
        logger.info("FaceEmbedder unloaded.")

    # ── Inference ──────────────────────────────────────────────────────────────

    def get_embedding(self, image_b64: str) -> list[float]:
        """
        Extract a 512-dim ArcFace embedding from a base64-encoded image.

        Parameters
        ----------
        image_b64 : Base64 JPEG/PNG string of the face photo.

        Returns
        -------
        List of 512 floats (unit-normed ArcFace embedding).

        Raises
        ------
        ValueError
            If the image cannot be decoded or no face is found.
        """
        if not self._loaded:
            self.load()

        bgr   = _b64_to_bgr(image_b64)
        faces = self._app.get(bgr)

        if not faces:
            raise ValueError("No face detected in the image.")

        # Pick the largest face (most prominent person in shot)
        best = max(
            faces,
            key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
        )
        return best.normed_embedding.tolist()

    # ── Static utility ─────────────────────────────────────────────────────────

    @staticmethod
    def compare(emb1: list[float], emb2: list[float]) -> float:
        """
        Compute cosine similarity between two ArcFace embeddings.

        Returns a float in [0, 1].  Scores above ``DEFAULT_VERIFY_THRESHOLD``
        (0.35) indicate the same person with ``buffalo_l``.
        """
        v1 = np.array(emb1, dtype=np.float32)
        v2 = np.array(emb2, dtype=np.float32)
        return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-10))

    # ── Private ────────────────────────────────────────────────────────────────

    @staticmethod
    def _has_gpu() -> bool:
        try:
            import torch
            return torch.cuda.is_available()
        except ImportError:
            return False


# ── IDCardChecker ──────────────────────────────────────────────────────────────

class IDCardChecker:
    """
    Zero-shot image classifier that decides whether an image looks like
    an Egyptian National ID card using OpenAI CLIP (ViT-B/32).

    Loads ``openai/clip-vit-base-patch32`` from Hugging Face Transformers.
    The model is baked into the Docker image at build time to avoid cold-
    start downloads.

    Usage
    -----
    checker = IDCardChecker()
    checker.load()
    valid = checker.is_id_card(image_b64)   # True → proceed, False → reject
    """

    def __init__(self) -> None:
        self._model     = None
        self._processor = None
        self._loaded    = False

    # ── Lifecycle ──────────────────────────────────────────────────────────────

    def load(self) -> None:
        """
        Load CLIP model and processor. Safe to call multiple times.

        Uses GPU if available; falls back to CPU automatically.
        """
        if self._loaded:
            logger.debug("IDCardChecker already loaded — skipping.")
            return

        try:
            from transformers import CLIPModel, CLIPProcessor

            logger.info("IDCardChecker: loading CLIP (openai/clip-vit-base-patch32) ...")
            self._model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            self._processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

            # Move to GPU if available
            try:
                import torch
                if torch.cuda.is_available():
                    self._model = self._model.cuda()
                    logger.info("IDCardChecker: CLIP moved to CUDA.")
            except ImportError:
                pass

            self._model.eval()
            self._loaded = True
            logger.info("✅ IDCardChecker (CLIP) loaded.")

        except Exception as exc:
            logger.error("❌ IDCardChecker failed to load: %s", exc)
            raise

    def unload(self) -> None:
        """Release CLIP model from memory."""
        self._model     = None
        self._processor = None
        self._loaded    = False
        logger.info("IDCardChecker unloaded.")

    # ── Inference ──────────────────────────────────────────────────────────────

    def is_id_card(self, image_b64: str) -> bool:
        """
        Return True if the image resembles an Egyptian National ID card.

        Uses the first two CLIP labels (ID card variants) as the positive
        class.  A combined probability > CLIP_ID_SCORE_THRESHOLD (default 0.30)
        is considered a valid ID card.

        On any CLIP failure the method logs the error and returns True
        (fail-open — let the face-detection step handle bad images).

        Parameters
        ----------
        image_b64 : Base64 JPEG/PNG of the document image.

        Returns
        -------
        True if appears to be an ID card; False otherwise.
        """
        if not self._loaded:
            self.load()

        try:
            import torch
            from PIL import Image

            bgr   = _b64_to_bgr(image_b64)
            rgb   = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(rgb)

            inputs = self._processor(
                text=_CLIP_LABELS,
                images=image,
                return_tensors="pt",
                padding=True,
            )

            # Move inputs to same device as model
            device = next(self._model.parameters()).device
            inputs = {k: v.to(device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self._model(**inputs)

            probs    = outputs.logits_per_image.softmax(dim=1)[0].cpu()
            id_score = probs[0].item() + probs[1].item()

            score_map = {_CLIP_LABELS[i]: round(probs[i].item(), 3) for i in range(len(_CLIP_LABELS))}
            logger.info("IDCardChecker CLIP scores: %s", score_map)

            return id_score > _CLIP_ID_SCORE_THRESHOLD

        except Exception as exc:
            logger.error("IDCardChecker CLIP check failed: %s — fail-open.", exc)
            return True   # fail-open so face-detection can still reject bad images


# ── Module-level singletons ────────────────────────────────────────────────────
_embedder_singleton: Optional[FaceEmbedder]   = None
_checker_singleton:  Optional[IDCardChecker]  = None


def get_face_embedder() -> FaceEmbedder:
    """Return the module-level FaceEmbedder singleton (auto-loads on first call)."""
    global _embedder_singleton
    if _embedder_singleton is None:
        _embedder_singleton = FaceEmbedder()
        _embedder_singleton.load()
    return _embedder_singleton


def get_id_card_checker() -> IDCardChecker:
    """Return the module-level IDCardChecker singleton (auto-loads on first call)."""
    global _checker_singleton
    if _checker_singleton is None:
        _checker_singleton = IDCardChecker()
        _checker_singleton.load()
    return _checker_singleton
