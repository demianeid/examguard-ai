"""
test_head_pose.py – live webcam test for the head-pose service.

Demonstrates:
  • Frame-rate throttling (inference runs every FRAME_INTERVAL frames).
  • One alert per look-away event  (HeadPoseTracker debouncing).
  • One "cleared" message when gaze returns to forward.

Press  q  to quit.
"""

import sys
import os

# Make sure the project root is on the path so `ai_service` is importable.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import cv2
from ai_service.services.head_pose import HeadPoseTracker, FRAME_INTERVAL, CONFIRM_FRAMES

# ── Config ─────────────────────────────────────────────────────────────────────
CAM_INDEX = 0


def main() -> None:
    print("Initialising webcam…")
    cap = cv2.VideoCapture(CAM_INDEX)
    if not cap.isOpened():
        print("ERROR: cannot open webcam.")
        sys.exit(1)

    print(f"Webcam open.  Press  q  to quit.")
    print(f"Frame interval : every {FRAME_INTERVAL} frames")
    print(f"Confirm frames : {CONFIRM_FRAMES} consecutive frames to confirm event")

    tracker = HeadPoseTracker()
    alert_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("ERROR: failed to read frame.")
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        info = tracker.update(rgb)

        # ── Terminal feedback ─────────────────────────────────────────────────
        if info["should_alert"]:
            alert_count += 1
            direction = info.get("direction", "UNKNOWN")
            h = info.get("h_ratio", 0.0)
            v = info.get("v_ratio", 0.0)
            print(
                f"[ALERT #{alert_count}] {direction:<20} "
                f"| h_ratio: {h:+.3f}  v_ratio: {v:+.3f}"
            )

        if info.get("alert_cleared"):
            print("[CLEAR] Gaze returned to forward.")

        # ── On-screen overlay ─────────────────────────────────────────────────
        direction = info.get("direction", "")
        color     = (0, 0, 255) if info.get("suspicious") else (0, 200, 0)
        label     = direction if direction else "FORWARD"

        cv2.putText(frame, label, (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)
        cv2.putText(
            frame,
            f"h={info.get('h_ratio',0):+.3f}  v={info.get('v_ratio',0):+.3f}",
            (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 1,
        )
        cv2.putText(
            frame,
            f"alerts: {alert_count}",
            (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 1,
        )

        cv2.imshow("Head Pose Test", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"\nDone. Total alerts fired: {alert_count}")


if __name__ == "__main__":
    main()
