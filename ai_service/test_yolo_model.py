import cv2
import sys
import os

# Add the parent directory to the path so we can import the module correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.yolo_detector import YoloTracker, FRAME_INTERVAL, CONFIRM_FRAMES

def main():
    print("Initializing webcam...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open the webcam. Please ensure it's connected and not used by another application.")
        return

    print("Webcam successfully opened. Press 'q' to quit.")
    print(f"Frame interval : every {FRAME_INTERVAL} frames")
    print(f"Confirm frames : {CONFIRM_FRAMES} consecutive frames to confirm event")

    tracker = YoloTracker()
    alert_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame from webcam.")
            break

        # Process the frame through the YOLO tracker (with debouncing)
        info = tracker.update(frame, conf=0.5)
        
        # ── Terminal feedback ─────────────────────────────────────────────────
        if info.get("should_alert"):
            alert_count += 1
            labels = ", ".join([d["label"] for d in info.get("detections", [])])
            print(f"[ALERT #{alert_count}] OBJECT DETECTED: {labels}")

        if info.get("alert_cleared"):
            print("[CLEAR] No objects detected.")

        # ── On-screen overlay ─────────────────────────────────────────────────
        annotated_frame = info["annotated_frame"]
        color = (0, 0, 255) if info.get("is_violating") else (0, 200, 0)
        
        cv2.putText(
            annotated_frame,
            f"alerts: {alert_count}",
            (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 1,
        )

        # Show the frame in an OpenCV window
        cv2.imshow("ExamGuard YOLO Test (Press 'q' to quit)", annotated_frame)

        # Break the loop if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("Exiting...")
            break

    # Clean up
    cap.release()
    cv2.destroyAllWindows()
    print(f"\nDone. Total alerts fired: {alert_count}")

if __name__ == "__main__":
    main()
