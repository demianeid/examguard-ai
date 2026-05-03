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

# ── Tunable constants ──────────────────────────────────────────────────────────
FRAME_INTERVAL = 3      # run inference only every N frames
CONFIRM_FRAMES = 1      # consecutive suspicious frames to confirm an alert

class YoloTracker:
    def __init__(self, frame_interval: int = FRAME_INTERVAL):
        self.frame_interval = frame_interval
        self._frame_counter = 0
        self._cached_result = None
        self._suspicious_count = 0
        self._is_violating = False

    def update(self, bgr_frame: np.ndarray, conf: float = 0.5) -> dict:
        self._frame_counter += 1
        
        # Frame-skipping: reuse cached result
        if self._frame_counter % self.frame_interval != 0 and self._cached_result is not None:
            result = self._cached_result
        else:
            result = analyze_frame(bgr_frame, conf)
            self._cached_result = result

        suspicious = result["suspicious"]
        should_alert = False
        alert_cleared = False

        if suspicious:
            self._suspicious_count += 1
            if self._suspicious_count >= CONFIRM_FRAMES and not self._is_violating:
                self._is_violating = True
                should_alert = True
        else:
            if self._is_violating:
                alert_cleared = True
            self._is_violating = False
            self._suspicious_count = 0

        # Inject state tracking into the returned dictionary
        final_result = dict(result)
        final_result["should_alert"] = should_alert
        final_result["alert_cleared"] = alert_cleared
        final_result["is_violating"] = self._is_violating
        return final_result


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
        
        # Custom confidence thresholds per class to balance detection vs false positives
        label_lower = label.lower()
        if label_lower == "phone" and confidence < 0.60:
            continue
        elif label_lower in ["earphone", "headphones", "headphone"] and confidence < 0.75:
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