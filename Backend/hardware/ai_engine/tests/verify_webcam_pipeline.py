"""
verify_webcam_pipeline.py
─────────────────────────
Phase 1-3 live test using your webcam.

Captures 30 seconds from your webcam, runs the full detection pipeline
(phone, face count, head-pose), draws alert overlays, and saves the
annotated result to webcam_annotated.mp4.

Usage
-----
    python Backend/hardware/ai_engine/tests/verify_webcam_pipeline.py

Optional flags
--------------
    --duration  Recording duration in seconds (default: 30)
    --fps       Detection FPS (default: 2 -- matches RTSP reader)
    --camera    Camera index (default: 0 -- your main webcam)
    --output    Output file path (default: webcam_annotated.mp4)
"""

from __future__ import annotations

import argparse
import base64
import os
import sys
import time

import cv2
import numpy as np

# ── Webcam-tuned thresholds ───────────────────────────────────────────────────
# solvePnP at close webcam distances produces larger angle values than a
# ceiling-mounted exam camera. Raise thresholds so only obvious head-turns fire.
os.environ.setdefault("HEAD_YAW_THRESHOLD",   "45")   # default 30 → raise to 45
os.environ.setdefault("HEAD_PITCH_THRESHOLD", "35")   # default 20 → raise to 35
os.environ.setdefault("HEAD_MOVE_THRESHOLD",  "20")   # default 15 → raise to 20

# ── Path setup ────────────────────────────────────────────────────────────────
_SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_SCRIPT_DIR, "..", "..", "..", ".."))
_BACKEND_ROOT = os.path.join(_PROJECT_ROOT, "Backend")

for _p in (_PROJECT_ROOT, _BACKEND_ROOT):
    if _p not in sys.path:
        sys.path.insert(0, _p)

# ── Alert styling ─────────────────────────────────────────────────────────────
ALERT_COLOURS = {
    "mobile_phone":    (0,   0,   255),
    "external_paper":  (0,  165,  255),
    "no_face":         (255,  0,   0),
    "multiple_faces":  (255,  0,  200),
    "looking_away":    (0,  200,  255),
    "head_movement":   (0,  255,  255),
}


def _encode(frame: np.ndarray) -> str:
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buf.tobytes()).decode()


def _get_bbox(bbox_val) -> tuple[int,int,int,int] | None:
    """Return (x1,y1,x2,y2) from either a list or dict bbox format."""
    if bbox_val is None:
        return None
    if isinstance(bbox_val, (list, tuple)) and len(bbox_val) >= 4:
        return int(bbox_val[0]), int(bbox_val[1]), int(bbox_val[2]), int(bbox_val[3])
    if isinstance(bbox_val, dict):
        return (int(bbox_val.get("x1",0)), int(bbox_val.get("y1",0)),
                int(bbox_val.get("x2",0)), int(bbox_val.get("y2",0)))
    return None


def _draw(frame: np.ndarray, results: list[dict]) -> np.ndarray:
    out = frame.copy()
    h, w = out.shape[:2]

    for result in results:
        if not result.get("is_valid"):
            continue
        roi    = result.get("roi", {})
        x1, y1 = roi.get("x1", 0), roi.get("y1", 0)
        x2, y2 = roi.get("x2", w), roi.get("y2", h)
        alerts = result.get("alerts", [])

        # Zone border — green if clean, red if alerts
        border_col = (0, 255, 0) if not alerts else (0, 60, 255)
        cv2.rectangle(out, (x1, y1), (x2, y2), border_col, 2)

        for i, a in enumerate(alerts):
            atype  = a.get("type", "?")
            sev    = a.get("severity", "medium")
            conf   = a.get("confidence", 0.0)
            colour = ALERT_COLOURS.get(atype, (200, 200, 200))

            # Bounding box (if detector returned one)
            bbox = _get_bbox(a.get("bbox_source") or a.get("bbox"))
            if bbox:
                x1b, y1b, x2b, y2b = bbox
                cv2.rectangle(out, (x1b, y1b), (x2b, y2b), colour, 2)

            # Alert text
            text  = f"[{sev.upper()}] {atype}  {conf:.0%}"
            y_pos = y2 - 12 - i * 28
            if y_pos < y1 + 20:
                break
            (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
            cv2.rectangle(out, (x1+4, y_pos-th-4), (x1+tw+10, y_pos+4), (20,20,20), -1)
            cv2.putText(out, text, (x1+7, y_pos),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, colour, 1, cv2.LINE_AA)

    return out


def run(camera: int, duration: int, fps_sample: float, output: str) -> None:

    # ── Load models ───────────────────────────────────────────────────────────
    print("\nLoading AI detectors (takes ~5s) ...")
    from hardware.ai_engine.detector import AIDetector
    from hardware.ai_engine.zone_processor import process_frame

    ai = AIDetector()
    ai.load_models()
    print(f"Ready: {ai.status}\n")

    # ── Open webcam ───────────────────────────────────────────────────────────
    cap = cv2.VideoCapture(camera, cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap = cv2.VideoCapture(camera)          # fallback without CAP_DSHOW
    if not cap.isOpened():
        print(f"ERROR: Cannot open camera {camera}. Is your webcam connected?")
        sys.exit(1)

    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)  or 640)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480)
    native_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    print(f"Webcam   : camera index {camera}")
    print(f"Size     : {width}x{height}  |  {native_fps:.0f} FPS native")
    print(f"Recording: {duration}s at {fps_sample} detection FPS")
    print(f"Output   : {output}")
    print()
    print(">>> Press Q to stop early.")
    print()

    # ── Video writer ──────────────────────────────────────────────────────────
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(output, fourcc, fps_sample, (width, height))

    # Full-frame zone
    zone = {
        "id": 1, "student_code": "S001",
        "student_name": "Live Test",
        "x1": 0, "y1": 0, "x2": width, "y2": height,
    }

    interval      = 1.0 / fps_sample      # seconds between detections
    last_detect   = 0.0
    last_results: list[dict] = []
    total_alerts  = 0
    alert_counts: dict[str, int] = {k: 0 for k in ALERT_COLOURS}
    t_start = time.monotonic()

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Webcam read failed.")
            break

        now     = time.monotonic()
        elapsed = now - t_start

        if elapsed >= duration:
            break

        # Run detection at fps_sample rate
        if now - last_detect >= interval:
            last_detect = now
            b64         = _encode(frame)
            last_results = process_frame(b64, [zone])

            for r in last_results:
                for a in r.get("alerts", []):
                    total_alerts += 1
                    atype = a.get("type", "unknown")
                    alert_counts[atype] = alert_counts.get(atype, 0) + 1
                    print(f"  t={elapsed:5.1f}s | [{a.get('severity','?').upper()}] "
                          f"{atype}  conf={a.get('confidence',0):.0%}")

            # Write annotated frame to output video
            annotated = _draw(frame, last_results)
            writer.write(annotated)

        # ── Live preview (all frames, overlaid with latest detection result) ──
        preview = _draw(frame, last_results)

        # Timer overlay
        remaining = duration - elapsed
        cv2.putText(preview,
                    f"Recording: {remaining:.0f}s remaining  |  Press Q to stop",
                    (12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 180), 1, cv2.LINE_AA)

        cv2.imshow("ExamGuard Webcam Test — Phase 1-3", preview)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            print("\nStopped early by user.")
            break

    # ── Cleanup ───────────────────────────────────────────────────────────────
    cap.release()
    writer.release()
    cv2.destroyAllWindows()

    actual_duration = time.monotonic() - t_start

    # ── Summary ───────────────────────────────────────────────────────────────
    print()
    print("=" * 52)
    print(" TEST COMPLETE")
    print("=" * 52)
    print(f"  Duration       : {actual_duration:.1f}s")
    print(f"  Total alerts   : {total_alerts}")
    print()
    if total_alerts:
        print("  Alert breakdown:")
        for atype, count in alert_counts.items():
            if count > 0:
                bar = chr(9608) * min(count, 25)
                print(f"    {atype:<20} {count:3d}  {bar}")
    else:
        print("  No alerts detected — student behaviour looks clean!")
    print()
    print(f"  Saved to: {os.path.abspath(output)}")
    print("=" * 52)


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="ExamGuard webcam pipeline test")
    ap.add_argument("--duration", type=int,   default=30,  help="Recording seconds (default: 30)")
    ap.add_argument("--fps",      type=float, default=2.0, help="Detection FPS (default: 2)")
    ap.add_argument("--camera",   type=int,   default=0,   help="Camera index (default: 0)")
    ap.add_argument("--output",   default="webcam_annotated.mp4",
                    help="Output video path (default: webcam_annotated.mp4)")
    args = ap.parse_args()

    run(
        camera=args.camera,
        duration=args.duration,
        fps_sample=args.fps,
        output=args.output,
    )
