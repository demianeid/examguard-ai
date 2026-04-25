import cv2
import json
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ai_service.services import head_pose, yolo_detector
from ai_service.schemas.schema import AnalysisResult, Detection, ErrorMessage

router = APIRouter()


@router.get("/")
def home():
    return {"message": "AI Service is running"}


@router.websocket("/ws/analyze")
async def analyze_stream(websocket: WebSocket):
    """
    WebSocket endpoint.

    Client sends:  raw JPEG bytes  (one frame per message)
    Server sends:  JSON AnalysisResult
    """
    await websocket.accept()
    print("WebSocket connected")

    try:
        while True:
            # ── 1. Receive frame bytes from React frontend ───────────────
            data = await websocket.receive_bytes()

            # ── 2. Decode JPEG → numpy BGR ───────────────────────────────
            np_arr = np.frombuffer(data, dtype=np.uint8)
            bgr    = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if bgr is None:
                await websocket.send_text(
                    ErrorMessage(error="Could not decode frame").model_dump_json()
                )
                continue

            bgr    = cv2.resize(bgr, (640, 480))
            rgb    = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

            # ── 3. Run both models ───────────────────────────────────────
            head  = head_pose.analyze_frame(rgb)
            yolo  = yolo_detector.analyze_frame(bgr)

            # ── 4. Build combined verdict ────────────────────────────────
            cheating = head["suspicious"] or yolo["suspicious"]

            reasons = []
            if head["suspicious"]:
                reasons.append(head["direction"] or "NO FACE")
            if yolo["suspicious"]:
                labels = [d["label"] for d in yolo["detections"]]
                reasons.append("OBJECT: " + ", ".join(labels))

            result = AnalysisResult(
                face_detected    = head["face_detected"],
                h_ratio          = head["h_ratio"],
                v_ratio          = head["v_ratio"],
                head_direction   = head["direction"],
                head_suspicious  = head["suspicious"],
                detections       = [Detection(**d) for d in yolo["detections"]],
                yolo_suspicious  = yolo["suspicious"],
                cheating_detected = cheating,
                cheating_reason  = " | ".join(reasons) if reasons else None,
            )

            # ── 5. Send JSON result back to frontend ─────────────────────
            await websocket.send_text(result.model_dump_json())

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_text(ErrorMessage(error=str(e)).model_dump_json())
        except Exception:
            pass
