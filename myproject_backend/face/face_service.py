import cv2
import numpy as np

_app = None


def _get_app():
    global _app
    if _app is None:
        from insightface.app import FaceAnalysis
        _app = FaceAnalysis(name="buffalo_l")
        _app.prepare(ctx_id=-1, det_size=(640, 640))  # غير ctx_id=0 لو عندك GPU
    return _app


def _read_image(image_path: str):
    """اقرأ الصورة بـ OpenCV."""
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Cannot read image: {image_path}")
    return img


def get_embedding(image_path: str) -> list:
    """
    استخرج الـ Face Embedding من صورة.
    بيرجع list من 512 رقم.
    بيعمل Exception لو مفيش وش في الصورة.
    """
    img   = _read_image(image_path)
    faces = _get_app().get(img)

    if not faces:
        raise ValueError("No face detected in the image.")

    # خد أكبر وش في الصورة (في حالة وجود أكتر من وش)
    face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    return face.normed_embedding.tolist()


def compare_embeddings(emb1: list, emb2: list) -> float:
    """
    احسب Cosine Similarity بين embedding اتنين.
    النتيجة من 0 لـ 1 — كلما زاد كلما زاد التشابه.
    فوق 0.4 = نفس الشخص على الأرجح مع buffalo_l.
    """
    v1 = np.array(emb1)
    v2 = np.array(emb2)
    return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))