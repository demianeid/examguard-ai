from pydantic import BaseModel
from typing import List, Optional


class Detection(BaseModel):
    label:      str
    confidence: float
    bbox:       List[int]          # [x1, y1, x2, y2]


class AnalysisResult(BaseModel):
    # ── Head-pose ────────────────────────────────────────
    face_detected:  bool
    h_ratio:        float
    v_ratio:        float
    head_direction: str            # e.g. "LOOKING LEFT + DOWN"
    head_suspicious: bool

    # ── YOLO ─────────────────────────────────────────────
    detections:      List[Detection]
    yolo_suspicious: bool

    # ── Combined verdict ─────────────────────────────────
    cheating_detected: bool
    new_violation: bool = False
    cheating_reason:   Optional[str] = None  # human-readable reason


class ErrorMessage(BaseModel):
    error: str
