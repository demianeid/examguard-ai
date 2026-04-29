import os
import cv2
import numpy as np
from ultralytics import YOLO

# ── Load model once at import time ──────────────────────────────────────────
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "best.pt")
_model: YOLO | None = None


def _get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO(_MODEL_PATH)
    return _model


def analyze_frame(bgr_frame: np.ndarray, conf: float = 0.5) -> dict:
    """
    Run YOLO on a BGR frame (numpy array).

    Returns a dict:
        {
            "detections": [
                {
                    "label": str,
                    "confidence": float,
                    "bbox": [x1, y1, x2, y2]
                },
                ...
            ],
            "suspicious": bool,     # True if any object detected
            "annotated_frame": np.ndarray  # BGR frame with boxes drawn
        }
    """
    model   = _get_model()
    results = model(bgr_frame, conf=conf, verbose=False)
    result  = results[0]

    detections = []
    for box in result.boxes:
        cls_id     = int(box.cls[0])
        label      = model.names[cls_id]
        confidence = float(box.conf[0])
        
        # Increased confidence threshold for specific classes to reduce false positives
        if label.lower() in ["earphone", "phone"] and confidence < 0.75:
            continue
            
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

        detections.append({
            "label":      label,
            "confidence": round(confidence, 3),
            "bbox":       [x1, y1, x2, y2],
        })

    # Draw boxes only for the detections that passed our filter
    annotated = bgr_frame.copy()
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        label_text = f"{det['label']} {det['confidence']:.2f}"
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 220, 90), 2)
        (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(annotated, (x1, y1 - th - 8), (x1 + tw + 6, y1), (0, 220, 90), -1)
        cv2.putText(annotated, label_text, (x1 + 3, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

    return {
        "detections":      detections,
        "suspicious":      len(detections) > 0,
        "annotated_frame": annotated,   # numpy BGR array with only filtered boxes
    }