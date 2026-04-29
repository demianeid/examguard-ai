import cv2
import json
import numpy as np
import base64
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

from ai_service.services import yolo_detector
from ai_service.services.head_pose import HeadPoseTracker
from ai_service.schemas.schema import AnalysisResult, Detection, ErrorMessage

router = APIRouter()

# ── Connection Manager for Live Video Relay ──────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # Maps exam_id (str) to a list of instructor WebSockets
        self.instructor_rooms: Dict[str, List[WebSocket]] = {}

    async def connect_instructor(self, websocket: WebSocket, exam_id: str):
        await websocket.accept()
        if exam_id not in self.instructor_rooms:
            self.instructor_rooms[exam_id] = []
        self.instructor_rooms[exam_id].append(websocket)
        print(f"Instructor connected to exam {exam_id}. Total: {len(self.instructor_rooms[exam_id])}")

    def disconnect_instructor(self, websocket: WebSocket, exam_id: str):
        if exam_id in self.instructor_rooms and websocket in self.instructor_rooms[exam_id]:
            self.instructor_rooms[exam_id].remove(websocket)
            if not self.instructor_rooms[exam_id]:
                del self.instructor_rooms[exam_id]
            print(f"Instructor disconnected from exam {exam_id}")

    async def broadcast_frame(self, exam_id: str, student_id: str, frame_bytes: bytes):
        """Broadcasts a base64 encoded JPEG to all instructors watching this exam."""
        if exam_id not in self.instructor_rooms or not self.instructor_rooms[exam_id]:
            return
        
        b64_frame = base64.b64encode(frame_bytes).decode('utf-8')
        payload = {
            "type": "frame",
            "student_id": student_id,
            "frame": b64_frame
        }
        
        for ws in self.instructor_rooms[exam_id]:
            try:
                await ws.send_json(payload)
            except Exception:
                pass  # Ignore dead sockets, they will be cleaned up on next disconnect

manager = ConnectionManager()


@router.get("/")
def home():
    return {"message": "AI Service is running"}


@router.websocket("/ws/instructor/{exam_id}")
async def instructor_stream(websocket: WebSocket, exam_id: str):
    """
    WebSocket endpoint for Instructors.
    Receives JSON payloads containing frames from students in this exam.
    """
    await manager.connect_instructor(websocket, exam_id)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect_instructor(websocket, exam_id)


@router.websocket("/ws/analyze/{exam_id}/{student_id}")
async def analyze_stream(websocket: WebSocket, exam_id: str, student_id: str):
    """
    WebSocket endpoint.

    Client sends:  raw JPEG bytes  (one frame per message)
    Server sends:  JSON AnalysisResult

    HeadPoseTracker is instantiated **per connection** so each student
    has independent debouncing state.  head_suspicious is True only on
    the first frame of a new looking-away event (edge-triggered).
    """
    await websocket.accept()
    print(f"WebSocket connected  exam={exam_id} student={student_id}")

    # One tracker per student connection – gives independent debounce state
    tracker = HeadPoseTracker()

    try:
        while True:
            # ── 1. Receive frame bytes from React frontend ───────────────
            data = await websocket.receive_bytes()

            # Broadcast the raw JPEG directly to instructors in this exam room
            await manager.broadcast_frame(exam_id, student_id, data)

            # ── 2. Decode JPEG → numpy BGR ───────────────────────────────
            np_arr = np.frombuffer(data, dtype=np.uint8)
            bgr    = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if bgr is None:
                await websocket.send_text(
                    ErrorMessage(error="Could not decode frame").model_dump_json()
                )
                continue

            bgr = cv2.resize(bgr, (640, 480))
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

            # ── 3. Run head-pose tracker (frame-skipping + debouncing) ───
            head = tracker.update(rgb)

            # ── 4. Run YOLO object detector ──────────────────────────────
            yolo = yolo_detector.analyze_frame(bgr)

            # ── 5. Build combined verdict ────────────────────────────────
            # head_suspicious is True only on the transition into a new
            # looking-away event, preventing repeated identical alerts.
            head_alert = head["should_alert"]
            cheating   = head_alert or yolo["suspicious"]

            reasons = []
            if head_alert:
                reasons.append(head["direction"] or "NO FACE")
            if yolo["suspicious"]:
                labels = [d["label"] for d in yolo["detections"]]
                reasons.append("OBJECT: " + ", ".join(labels))

            result = AnalysisResult(
                face_detected     = head["face_detected"],
                h_ratio           = head["h_ratio"],
                v_ratio           = head["v_ratio"],
                head_direction    = head["direction"],
                head_suspicious   = head_alert,        # edge-triggered
                detections        = [Detection(**d) for d in yolo["detections"]],
                yolo_suspicious   = yolo["suspicious"],
                cheating_detected = cheating,
                cheating_reason   = " | ".join(reasons) if reasons else None,
            )

            # ── 6. Send JSON result back to frontend ─────────────────────
            await websocket.send_text(result.model_dump_json())

    except WebSocketDisconnect:
        print(f"WebSocket disconnected  exam={exam_id} student={student_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_text(ErrorMessage(error=str(e)).model_dump_json())
        except Exception:
            pass
