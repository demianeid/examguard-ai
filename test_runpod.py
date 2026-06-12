"""
ExamGuard — Live Camera Monitor
================================
Opens a live camera window and continuously analyzes frames with the RunPod
proctoring AI. Alerts are printed to the terminal in real time.

Usage:
    cd examguard-ai
    venv\\Scripts\\python.exe test_runpod.py

    # With IP Webcam app:
    venv\\Scripts\\python.exe test_runpod.py --stream "http://192.168.1.4:8080/video"

Controls:
    Q  — quit
"""

import sys
import os
import time
import base64
import argparse
import threading
import requests
import cv2
import numpy as np

# Force UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# ─── Load .env ────────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    for candidate in [
        os.path.join(os.path.dirname(__file__), ".env"),
        os.path.join(os.path.dirname(__file__), "myproject_backend", ".env"),
    ]:
        if os.path.exists(candidate):
            load_dotenv(candidate)
            break
except ImportError:
    pass

RUNPOD_ENDPOINT = os.getenv("RUNPOD_ENDPOINT", "")
RUNPOD_API_KEY  = os.getenv("RUNPOD_API_KEY",  "")

# ─── ANSI colors ──────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"

SEVERITY_COLOR = {"high": RED, "medium": YELLOW, "low": CYAN}
ALERT_ICON     = {
    "mobile_phone":   "📱",
    "multiple_faces": "👥",
    "no_face":        "🚫",
    "looking_away":   "👀",
    "external_paper": "📄",
    "voice_detected": "🎙️",
    "head_movement":  "🔄",
}
ALERT_LABEL = {
    "mobile_phone":   "Mobile Phone Detected",
    "multiple_faces": "Multiple Faces Detected",
    "no_face":        "No Face Detected",
    "looking_away":   "Looking Away",
    "external_paper": "External Paper Detected",
    "voice_detected": "Voice Detected",
    "head_movement":  "Excessive Head Movement",
}

# ─── Globals shared between threads ──────────────────────────────────────────
latest_frame      = None          # most-recent BGR frame from camera
latest_alerts     = []            # list of (type, severity, confidence) from last cycle
frame_lock        = threading.Lock()
inference_running = False          # True while waiting for RunPod response


# ─── RunPod call (runs in background thread) ──────────────────────────────────

def send_to_runpod(frame: np.ndarray):
    global latest_alerts, inference_running
    inference_running = True

    h, w = frame.shape[:2]
    zones = [{
        "id": 1,
        "student_name": "Live Test",
        "student_code": "LIVE-001",
        "seat_number":  "Seat 1",
        "x1": 0, "y1": 0, "x2": w, "y2": h,
    }]

    # Encode to JPEG base64
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if not ok:
        inference_running = False
        return
    frame_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

    payload = {
        "input": {
            "action":     "proctor",
            "frame":      frame_b64,
            "zones":      zones,
            "exam_id":    999,
            "session_id": 999,
        }
    }
    headers = {
        "Authorization": f"Bearer {RUNPOD_API_KEY}",
        "Content-Type":  "application/json",
    }

    try:
        t0   = time.perf_counter()
        resp = requests.post(RUNPOD_ENDPOINT, json=payload, headers=headers, timeout=30)
        elapsed = time.perf_counter() - t0
        resp.raise_for_status()
        data    = resp.json()
        results = data.get("output", {}).get("results", [])

        new_alerts = []
        for zone in results:
            for alert in zone.get("alerts", []):
                new_alerts.append({
                    "type":       alert.get("type", "unknown"),
                    "severity":   alert.get("severity", "medium"),
                    "confidence": float(alert.get("confidence", 1.0)),
                    "zone_id":    zone.get("zone_id", 1),
                })

        latest_alerts = new_alerts
        ts = time.strftime("%H:%M:%S")

        if new_alerts:
            print(f"\n{DIM}{ts}{RESET}  ── Alerts ─────────────────────────────")
            for a in new_alerts:
                color  = SEVERITY_COLOR.get(a["severity"], RESET)
                icon   = ALERT_ICON.get(a["type"], "⚠️")
                label  = ALERT_LABEL.get(a["type"], a["type"])
                sev    = a["severity"].upper()
                conf   = a["confidence"]
                print(f"  {icon}  {color}{BOLD}[{sev}]{RESET}  {label}  {DIM}({conf:.0%}){RESET}")
        else:
            print(f"{DIM}{ts}  ✔  No violations  ({elapsed:.2f}s){RESET}", end="\r")

    except requests.Timeout:
        print(f"\n{YELLOW}  ⏱  RunPod timed out — retrying next cycle{RESET}")
    except Exception as e:
        print(f"\n{RED}  ✘  RunPod error: {e}{RESET}")

    inference_running = False


# ─── Overlay helpers ──────────────────────────────────────────────────────────

def draw_overlay(frame: np.ndarray, alerts: list, running: bool) -> np.ndarray:
    out = frame.copy()
    h, w = out.shape[:2]

    # Status pill (top-left)
    if running:
        label = "Analyzing..."
        color = (200, 150, 0)
    elif alerts:
        label = f"{len(alerts)} ALERT(S)"
        color = (0, 0, 220)
    else:
        label = "OK - No violations"
        color = (0, 180, 0)

    cv2.rectangle(out, (8, 8), (260, 36), (20, 20, 20), -1)
    cv2.putText(out, label, (14, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, color, 2)

    # Alert badges (bottom)
    y = h - 12
    for a in reversed(alerts):
        sev   = a["severity"]
        atype = ALERT_LABEL.get(a["type"], a["type"])
        text  = f"{sev.upper()}: {atype}"
        clr   = {"high": (0,0,200), "medium": (0,140,220), "low": (200,200,0)}.get(sev, (200,200,200))
        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(out, (8, y - th - 6), (14 + tw, y + 4), (20, 20, 20), -1)
        cv2.putText(out, text, (12, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, clr, 1)
        y -= th + 14

    # Controls hint
    cv2.putText(out, "Q = quit", (w - 90, h - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (160, 160, 160), 1)
    return out


# ─── Main loop ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="ExamGuard Live Camera Monitor")
    parser.add_argument("--stream",    default="0",
                        help="Camera index (0) or URL (default: 0)")
    parser.add_argument("--interval",  type=float, default=2.0,
                        help="Seconds between RunPod inference calls (default: 2)")
    args = parser.parse_args()

    # Validate config
    if not RUNPOD_ENDPOINT or not RUNPOD_API_KEY:
        print(f"{RED}✘  RUNPOD_ENDPOINT or RUNPOD_API_KEY not set in .env{RESET}")
        sys.exit(1)

    # Open camera
    source = int(args.stream) if str(args.stream).strip().isdigit() else args.stream
    cap = cv2.VideoCapture(source, cv2.CAP_DSHOW) if isinstance(source, int) else cv2.VideoCapture(source)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not cap.isOpened():
        print(f"{RED}✘  Cannot open camera: {args.stream}{RESET}")
        sys.exit(1)

    print(f"\n{BOLD}{GREEN}ExamGuard Live Monitor{RESET}")
    print(f"  Camera:   {args.stream}")
    print(f"  Endpoint: {RUNPOD_ENDPOINT}")
    print(f"  Interval: every {args.interval}s")
    print(f"\n{DIM}Press Q in the camera window to quit.{RESET}\n")

    last_send = 0.0

    while True:
        ok, frame = cap.read()
        if not ok:
            print(f"{YELLOW}⚠  Frame read failed — retrying...{RESET}", end="\r")
            time.sleep(0.1)
            continue

        now = time.time()

        # Send frame to RunPod every `interval` seconds, in a background thread
        if not inference_running and (now - last_send) >= args.interval:
            last_send = now
            t = threading.Thread(target=send_to_runpod, args=(frame.copy(),), daemon=True)
            t.start()

        # Draw overlay and show window
        display = draw_overlay(frame, latest_alerts, inference_running)
        cv2.imshow("ExamGuard — Live Monitor  (Q to quit)", display)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q") or key == 27:  # Q or Esc
            break

    cap.release()
    cv2.destroyAllWindows()
    print(f"\n{GREEN}✔  Monitor stopped.{RESET}\n")


if __name__ == "__main__":
    main()
