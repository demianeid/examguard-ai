"""
test_runpod_models.py
======================
اختبار مباشر لكل الموديلات على سيرفر RunPod
بدون أي Django أو Celery — بيبعت Payload مباشرة للـ RunPod Endpoint.

Results:
  ✅  الموديل شغال ومكتشف
  ⚠️  الموديل مش مكتشف حاجة (مش بالضرورة غلط)
  ❌  خطأ في الاتصال أو الموديل

Usage:
  python scratch/test_runpod_models.py
"""

from __future__ import annotations

import base64
import json
import os
import sys
import time

import cv2
import numpy as np
import requests

# ── Load config from .env ──────────────────────────────────────────────────────
_env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
if os.path.exists(_env_path):
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

RUNPOD_ENDPOINT = os.environ.get("RUNPOD_ENDPOINT", "")
RUNPOD_API_KEY  = os.environ.get("RUNPOD_API_KEY",  "")

if not RUNPOD_ENDPOINT or not RUNPOD_API_KEY:
    print("❌ RUNPOD_ENDPOINT أو RUNPOD_API_KEY مش موجودين في ملف .env")
    sys.exit(1)

# ── Helper: Create a synthetic test frame ─────────────────────────────────────

def make_test_frame(scenario: str = "phone") -> np.ndarray:
    """
    ينشئ صورة تجريبية للتيست:
      - 'phone'  : خلفية زرقاء + مستطيل أسود يمثل موبايل
      - 'face'   : خلفية رمادية فاتحة (بدون وجه حقيقي — للاختبار فقط)
      - 'clean'  : صورة فارغة
    """
    frame = np.ones((480, 640, 3), dtype=np.uint8)

    if scenario == "phone":
        # خلفية زرقاء
        frame[:] = (180, 120, 60)
        # مستطيل داكن في المنتصف يشبه موبايل
        cv2.rectangle(frame, (270, 150), (370, 330), (30, 30, 30), -1)
        cv2.rectangle(frame, (270, 150), (370, 330), (200, 200, 200), 2)
        cv2.putText(frame, "PHONE", (285, 245), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    elif scenario == "face":
        # خلفية فاتحة
        frame[:] = (220, 210, 200)
        # وجه مبسط
        cv2.circle(frame, (320, 240), 80, (200, 170, 140), -1)
        cv2.circle(frame, (295, 215), 12, (60, 40, 30), -1)  # عين
        cv2.circle(frame, (345, 215), 12, (60, 40, 30), -1)  # عين
        cv2.ellipse(frame, (320, 260), (30, 15), 0, 0, 180, (100, 60, 60), 2)  # فم
    elif scenario == "webcam":
        # Capture a real frame from the webcam
        print("  📷 امسك موبايلك قدام الكاميرا دلوقتي! (هيتصور بعد 3 ثواني...)")
        import time; time.sleep(3)
        cap2 = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        real_frame = None
        if cap2.isOpened():
            for _ in range(10):   # warm-up
                ret2, real_frame = cap2.read()
            cap2.release()
        if real_frame is not None:
            print("  ✅ تم التقاط فريم حقيقي من الـ webcam!")
            return real_frame
        else:
            print("  ⚠️  الكاميرا فشلت — هيتم استخدام صورة فارغة")
    else:
        frame[:] = (240, 240, 240)

    return frame


def encode_frame(frame: np.ndarray) -> str:
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buf).decode("utf-8")


# ── Test zone definition ───────────────────────────────────────────────────────
TEST_ZONE = {
    "id":           1,
    "student_code": "TEST-001",
    "student_name": "Test Student",
    "x1": 50,  "y1": 50,
    "x2": 590, "y2": 430,
}

# ── Send to RunPod ─────────────────────────────────────────────────────────────

def send_to_runpod(frame_b64: str, exam_id: int = 999, session_id: int = 999) -> dict | None:
    payload = {
        "input": {
            "frame":      frame_b64,
            "zones":      [TEST_ZONE],
            "exam_id":    exam_id,
            "session_id": session_id,
        }
    }
    headers = {
        "Authorization": f"Bearer {RUNPOD_API_KEY}",
        "Content-Type":  "application/json",
    }
    try:
        resp = requests.post(RUNPOD_ENDPOINT, json=payload, headers=headers, timeout=120)
        resp.raise_for_status()
        return resp.json()
    except requests.Timeout:
        print("  ❌ Timeout! السيرفر مش راد في 120 ثانية.")
    except requests.RequestException as exc:
        print(f"  ❌ Request Error: {exc}")
    return None


# ── Pretty-print results ───────────────────────────────────────────────────────

def print_result(title: str, result: dict | None) -> None:
    print(f"\n{'='*60}")
    print(f"  📋 {title}")
    print(f"{'='*60}")

    if result is None:
        print("  ❌ لا يوجد استجابة من RunPod")
        return

    # Check for error
    if "error" in result:
        print(f"  ❌ RunPod Error: {result['error']}")
        return

    output = result.get("output", result)  # handle both runsync and run formats

    elapsed = output.get("elapsed_ms", "N/A")
    print(f"  ⏱  Elapsed     : {elapsed} ms")

    zone_results = output.get("results", [])
    if not zone_results:
        print("  ⚠️  No zone results returned")
        return

    for zr in zone_results:
        is_valid = zr.get("is_valid", False)
        alerts   = zr.get("alerts", [])
        roi      = zr.get("roi", {})

        print(f"\n  Zone  : {zr.get('zone_id')} | {zr.get('student_code')}")
        print(f"  ROI   : {roi}")
        print(f"  Valid : {'✅' if is_valid else '❌'}")

        if alerts:
            print(f"  Alerts ({len(alerts)}):")
            for a in alerts:
                sev  = a.get("severity", "?").upper()
                typ  = a.get("type", "?")
                conf = a.get("confidence", 0)
                det  = a.get("detector", "?")
                print(f"    🚨 [{sev}] {typ}  conf={conf:.0%}  detector={det}")
        else:
            print("  ✅ No alerts (clean frame)")

    print()


# ── Main test runner ───────────────────────────────────────────────────────────

def run_tests():
    print("\n" + "="*60)
    print("  🧪 ExamGuard RunPod Model Health Check")
    print(f"  Endpoint: {RUNPOD_ENDPOINT[:60]}...")
    print("="*60)

    scenarios = [
        ("📵 Phone Detection Test (synthetic)",   "phone"),
        ("😐 Face Detection Test (synthetic)",    "face"),
        ("🟢 Clean Frame Baseline",               "clean"),
        ("📸 REAL Webcam Frame Test",             "webcam"),
    ]

    for title, scenario in scenarios:
        print(f"\n⏳ Sending '{scenario}' frame to RunPod...")
        frame = make_test_frame(scenario)
        frame_b64 = encode_frame(frame)

        t0 = time.perf_counter()
        result = send_to_runpod(frame_b64)
        elapsed = (time.perf_counter() - t0) * 1000

        print(f"  Round-trip time: {elapsed:.0f} ms")
        print_result(title, result)

        # Small delay between requests
        time.sleep(1)

    print("\n" + "="*60)
    print("  ✅ Test Complete!")
    print("="*60 + "\n")


if __name__ == "__main__":
    run_tests()
