import cv2
import asyncio
import websockets
import json

# Alert message for each label your model detects
ALERTS = {
    "book":        "📚 ALERT: Book detected",
    "earphone":    "🎧 ALERT: Earphone detected",
    "headphones":  "🎧 ALERT: Headphones detected",
    "laptop":      "💻 ALERT: Laptop detected",
    "phone":       "📱 ALERT: Phone detected",
    "smart watch": "⌚ ALERT: Smart watch detected",
}

def print_result(result):
    print("\n" + "=" * 45)

    # ── Head pose status ─────────────────────────────
    if not result["face_detected"]:
        print("  ⚠️  NO FACE DETECTED")
    elif result["head_suspicious"]:
        print(f"  👀 HEAD: {result['head_direction']}")
    else:
        print("  ✅ HEAD: Looking forward")

    # ── Object detections ────────────────────────────
    if result["detections"]:
        for d in result["detections"]:
            label      = d["label"]
            confidence = d["confidence"]
            alert      = ALERTS.get(label, f"ALERT: {label}")
            print(f"  {alert}  ({int(confidence * 100)}% confidence)")
    else:
        print("  ✅ OBJECTS: None detected")

    # ── Final verdict ────────────────────────────────
    print("-" * 45)
    if result["cheating_detected"]:
        print(f"  🚨 CHEATING DETECTED: {result['cheating_reason']}")
    else:
        print("  ✅ STATUS: OK")

    print("=" * 45)


async def run():
    uri = "ws://localhost:8000/ws/analyze"
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Cannot open webcam")
        return

    print("Connecting to ai_service...")

    async with websockets.connect(uri) as ws:
        print("Connected! Press ESC to stop.\n")

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.resize(frame, (640, 480))

            # Send frame to server
            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            await ws.send(buffer.tobytes())

            # Get result
            raw    = await ws.recv()
            result = json.loads(raw)

            # Print clean result
            print_result(result)

            # Draw on frame
            color = (0, 0, 255) if result["cheating_detected"] else (0, 255, 0)
            text  = result["cheating_reason"] or "OK"
            cv2.putText(frame, text, (20, 40),
                        cv2.FONT_HERSHEY_DUPLEX, 0.7, color, 2)
            cv2.imshow("ExamGuard Test", frame)

            if cv2.waitKey(1) == 27:
                break

            await asyncio.sleep(0.2)

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    asyncio.run(run())