"""
test_head_pose_live.py
──────────────────────
A simple live test specifically for the HeadPoseEstimator.
It opens your webcam and prints/displays whether you are looking left or right 
based on the new logic.

Usage:
    python Backend/hardware/ai_engine/tests/test_head_pose_live.py
"""

import os
import sys

import time
import cv2
import numpy as np

# Adjust paths to allow importing from the backend
_SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_SCRIPT_DIR, "..", "..", "..", ".."))
_BACKEND_ROOT = os.path.join(_PROJECT_ROOT, "Backend")

for _p in (_PROJECT_ROOT, _BACKEND_ROOT):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from hardware.ai_engine.head_pose import get_head_pose_estimator

import argparse

def main():
    parser = argparse.ArgumentParser(description="Live Head Pose Test")
    parser.add_argument("--stream", type=str, default="0", help="Camera index or IP camera stream URL (e.g. http://192.168.0.144:8080/video)")
    args = parser.parse_args()

    estimator = get_head_pose_estimator()
    estimator.load()

    if not estimator._available:
        print("MediaPipe is not available. Cannot run head pose estimation.")
        sys.exit(1)

    stream_source = int(args.stream) if args.stream.isdigit() else args.stream

    # Only use CAP_DSHOW for local integer webcams on Windows
    if isinstance(stream_source, int):
        cap = cv2.VideoCapture(stream_source, cv2.CAP_DSHOW)
        if not cap.isOpened():
            cap = cv2.VideoCapture(stream_source)
    else:
        # For IP cameras (RTSP/HTTP), use default backend
        print(f"Connecting to IP camera: {stream_source}...")
        cap = cv2.VideoCapture(stream_source)
    
    if not cap.isOpened():
        print(f"Could not open stream: {stream_source}. Make sure it's connected and the URL is correct.")
        sys.exit(1)

    print("\n" + "="*50)
    print("Live Head Pose Test Started.")
    print("Look away left or right to trigger the alerts.")
    print("Press 'q' to quit.")
    print("="*50 + "\n")
    
    # We pass a fake zone ID to track the previous angles for this specific user
    zone_id = 999 

    last_process_time = 0.0
    process_interval = 2.0
    
    last_alerts = []
    last_angles = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Flip horizontally for a mirror effect (easier to test)
        frame = cv2.flip(frame, 1)
        
        now = time.time()
        if now - last_process_time >= process_interval:
            last_process_time = now
            # 1. Generate alerts
            last_alerts = estimator.estimate(frame, zone_id=zone_id)
            # 3. Always show current raw angles for debugging
            last_angles = estimator.current_angles(frame)
            
            for alert in last_alerts:
                atype = alert.get("type", "unknown")
                yaw = alert.get("yaw", 0)
                conf = alert.get("confidence", 0)
                print(f"[{time.strftime('%H:%M:%S')}] Alert fired: {atype} (yaw={yaw:.1f}) conf={conf:.2f}")
        
        # 2. Display alert results on screen
        for alert in last_alerts:
            atype = alert.get("type", "unknown")
            conf = alert.get("confidence", 0)
            yaw = alert.get("yaw", 0)
            delta = alert.get("delta_deg", 0)
            
            color = (0, 255, 255) # Yellow by default
            if atype == "looking_away":
                color = (0, 165, 255) # Orange
                
            text = f"{atype} (yaw={yaw:.1f}) conf={conf:.2f}"
            cv2.putText(frame, text, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2, cv2.LINE_AA)

        if last_angles:
            pitch, yaw, roll = last_angles
            cv2.putText(frame, f"Pitch: {pitch:.1f} | Yaw: {yaw:.1f} | Roll: {roll:.1f}", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)

        cv2.imshow("Head Pose Live Test", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    estimator.unload()
    print("Test finished.")

if __name__ == "__main__":
    main()
