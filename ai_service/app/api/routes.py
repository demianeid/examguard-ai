import cv2
import json
import numpy as np
import base64
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from typing import Dict, List

from ai_service.services import yolo_detector
from ai_service.services.head_pose import HeadPoseTracker
from ai_service.services.audio_detector import AudioDetector
from ai_service.schemas.schema import AnalysisResult, Detection, ErrorMessage, AudioResult

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
        """Broadcasts a base64-encoded JPEG to all instructors watching this exam."""
        if exam_id not in self.instructor_rooms or not self.instructor_rooms[exam_id]:
            return

        b64_frame = base64.b64encode(frame_bytes).decode('utf-8')
        payload = {
            "type": "frame",
            "student_id": student_id,
            "frame": b64_frame,
        }
        dead: list = []
        for ws in list(self.instructor_rooms.get(exam_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_instructor(ws, exam_id)

    async def broadcast_alert(self, exam_id: str, student_id: str, alert: dict):
        """Pushes a real-time violation alert to all instructors watching this exam."""
        if exam_id not in self.instructor_rooms or not self.instructor_rooms[exam_id]:
            return
        payload = {"type": "alert", "student_id": student_id, **alert}
        dead: list = []
        for ws in list(self.instructor_rooms.get(exam_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_instructor(ws, exam_id)

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
async def analyze_stream(
    websocket: WebSocket,
    exam_id: str,
    student_id: str,
    live: str = "1",
    behavior_detection: str = "1",
    object_detection: str = "1",
    multi_face: str = "1",
):
    """
    WebSocket endpoint.

    Client sends:  raw JPEG bytes  (one frame per message)
    Server sends:  JSON AnalysisResult

    Query params:
      live               "1" (default) — relay annotated frames to instructor room
                         "0"           — AI analysis only, no live relay
      behavior_detection "1" (default) — run head-pose / face analysis
                         "0"           — skip head-pose model entirely
      object_detection   "1" (default) — run YOLO object detection
                         "0"           — skip YOLO model entirely
      multi_face         "1" (default) — flag multiple-face alerts
                         "0"           — ignore multiple-face detections

    HeadPoseTracker is instantiated **per connection** so each student
    has independent debouncing state.
    """
    await websocket.accept()

    do_live_relay       = (live               == "1")
    do_behavior         = (behavior_detection  == "1")
    do_object           = (object_detection    == "1")
    do_multi_face       = (multi_face          == "1")

    print(
        f"WebSocket connected  exam={exam_id} student={student_id}  "
        f"live={live} behavior={do_behavior} object={do_object} multi_face={do_multi_face}"
    )

    # ── Neutral/disabled results used when a model is turned off ────────────
    _HEAD_DISABLED = {
        "face_detected": True, "multiple_faces": False,
        "h_ratio": 0.0, "v_ratio": 0.0, "direction": "FORWARD",
        "suspicious": False, "should_alert": False,
        "is_violating": False, "is_critical_no_face": False,
    }
    _YOLO_DISABLED = {
        "detections": [], "suspicious": False,
        "annotated_frame": None,
        "should_alert": False, "alert_cleared": False, "is_violating": False,
    }

    # One tracker per student connection – gives independent debounce state.
    tracker      = HeadPoseTracker(frame_interval=1) if do_behavior else None
    yolo_tracker = yolo_detector.YoloTracker(frame_interval=1) if do_object else None

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

            bgr = cv2.resize(bgr, (640, 480))
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

            loop = asyncio.get_running_loop()

            # ── 3. Head-pose tracker (skipped if behavior_detection=0) ───
            if do_behavior:
                head = await loop.run_in_executor(None, tracker.update, rgb)
                # If multiple-face detection is disabled, strip that signal
                if not do_multi_face and head.get("multiple_faces"):
                    head = dict(head)
                    head["multiple_faces"] = False
                    # Recalculate suspicious without multiple-faces contribution
                    # (head_pose still checks look-away independently)
            else:
                head = dict(_HEAD_DISABLED)

            # ── 4. YOLO object detector (skipped if object_detection=0) ─
            if do_object:
                yolo = await loop.run_in_executor(None, yolo_tracker.update, bgr)
            else:
                yolo = dict(_YOLO_DISABLED)

            # ── 5. Draw head pose on the annotated frame and broadcast ────
            yolo_frame = yolo.get("annotated_frame")
            annotated = yolo_frame if yolo_frame is not None else bgr
            direction_text = head.get("direction") or "FORWARD"
            text_color = (0, 0, 255) if head.get("suspicious") else (0, 220, 90)  # BGR

            (tw, th), _ = cv2.getTextSize(direction_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(annotated, (8, 10), (12 + tw, 20 + th), (0, 0, 0), -1)
            cv2.putText(annotated, direction_text, (10, 15 + th), cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_color, 2)

            _, buffer = cv2.imencode('.jpg', annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if do_live_relay:
                await manager.broadcast_frame(exam_id, student_id, buffer.tobytes())

            # ── 6. Build combined verdict ────────────────────────────────
            new_violation  = head.get("should_alert", False) or yolo.get("should_alert", False)
            cheating_state = head.get("is_violating", False) or yolo.get("is_violating", False)

            is_critical_no_face = head.get("is_critical_no_face", False)
            if is_critical_no_face and do_behavior:
                new_violation = True
                cheating_state = True
                reasons = ["CRITICAL: Face missing > 2s"]
            else:
                reasons: list[str] = []
                if head["suspicious"]:
                    direction = head["direction"] or "NO FACE"
                    if head.get("multiple_faces") and do_multi_face:
                        reasons.append("MULTIPLE FACES DETECTED")
                    else:
                        reasons.append("Looking away" if "LOOKING" in direction else direction)
                if yolo["suspicious"] and head["face_detected"] and do_object:
                    labels = [d["label"] for d in yolo["detections"]]
                    reasons.append("OBJECT: " + ", ".join(labels))

            cheating_reason = " | ".join(reasons) if reasons else None

            result = AnalysisResult(
                face_detected       = head["face_detected"],
                multiple_faces      = head.get("multiple_faces", False),
                h_ratio             = head["h_ratio"],
                v_ratio             = head["v_ratio"],
                head_direction      = head["direction"],
                head_suspicious     = head["suspicious"],
                detections          = [Detection(**d) for d in yolo["detections"]],
                yolo_suspicious     = yolo["suspicious"],
                cheating_detected   = cheating_state,
                new_violation       = new_violation,
                is_critical_no_face = is_critical_no_face,
                cheating_reason     = cheating_reason,
            )

            # ── 7. Send JSON result back to student frontend ──────────────
            await websocket.send_text(result.model_dump_json())

            # ── 8. Push real-time alert to instructor WS room ─────────────
            if new_violation or cheating_state:
                await manager.broadcast_alert(exam_id, student_id, {
                    "cheating_reason":  cheating_reason,
                    "head_direction":   head["direction"],
                    "head_suspicious":  head["suspicious"],
                    "yolo_suspicious":  yolo["suspicious"],
                    "yolo_labels":      [d["label"] for d in yolo["detections"]],
                    "h_ratio":          head["h_ratio"],
                    "v_ratio":          head["v_ratio"],
                    "new_violation":    new_violation,
                })

    except WebSocketDisconnect:
        print(f"WebSocket disconnected  exam={exam_id} student={student_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_text(ErrorMessage(error=str(e)).model_dump_json())
        except Exception:
            pass


@router.websocket("/ws/audio/{exam_id}/{student_id}")
async def audio_stream(
    websocket: WebSocket,
    exam_id: str,
    student_id: str,
    audio_detection: str = "1",
):
    """
    Audio anomaly detection WebSocket endpoint.

    Client sends:  raw binary Float32LE PCM at 16 kHz mono
                   (each message = one 0.5 s window = 8 000 × 4 bytes)
    Server sends:  JSON AudioResult

    Query params:
      audio_detection  "1" (default) — run AudioDetector model
                       "0"           — skip audio analysis entirely (returns clean)
    """
    await websocket.accept()
    do_audio = (audio_detection == "1")
    print(f"[Audio] WebSocket connected  exam={exam_id} student={student_id}  audio_detection={do_audio}")

    detector = AudioDetector() if do_audio else None
    loop = asyncio.get_running_loop()

    try:
        while True:
            raw = await websocket.receive_bytes()

            if not do_audio:
                # Return a clean/disabled result without running any model
                result = AudioResult(
                    suspicious=False,
                    should_alert=False,
                    db_level=-96.0,
                    event_type="disabled",
                    reason=None,
                )
                await websocket.send_text(result.model_dump_json())
                continue

            # Decode Float32LE PCM
            pcm = np.frombuffer(raw, dtype=np.float32).copy()

            # Run detector off the event loop thread
            audio = await loop.run_in_executor(None, detector.update, pcm)

            result = AudioResult(
                suspicious=audio["suspicious"],
                should_alert=audio["should_alert"],
                db_level=audio["db_level"],
                event_type=audio["event_type"],
                reason=audio["reason"],
            )

            await websocket.send_text(result.model_dump_json())

            # Broadcast audio alert to instructor WS room
            if audio["should_alert"]:
                await manager.broadcast_alert(exam_id, student_id, {
                    "type":          "audio_alert",
                    "event_type":    audio["event_type"],
                    "db_level":      audio["db_level"],
                    "reason":        audio["reason"],
                    "new_violation": True,
                })

    except WebSocketDisconnect:
        print(f"[Audio] WebSocket disconnected  exam={exam_id} student={student_id}")
    except Exception as e:
        print(f"[Audio] WebSocket error: {e}")
        try:
            await websocket.send_text(ErrorMessage(error=str(e)).model_dump_json())
        except Exception:
            pass
