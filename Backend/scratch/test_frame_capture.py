"""
test_frame_capture.py
======================
يلتقط فريم من الـ webcam ويحفظه كصورة عشان تشوف بعينك
إيه اللي بيتبعت فعلاً لـ RunPod.

Usage (NO Django needed):
  python scratch\test_frame_capture.py

الصورة بتتحفظ في: scratch/captured_frame.jpg
"""

from __future__ import annotations

import base64
import os
import sys

import cv2
import numpy as np

# ── Capture one frame ──────────────────────────────────────────────────────────
STREAM = 0   # webcam index

print("⏳ Opening webcam...")
cap = cv2.VideoCapture(STREAM, cv2.CAP_DSHOW)

if not cap.isOpened():
    print("❌ مش قادر يفتح الكاميرا!")
    sys.exit(1)

# Read several frames to let camera warm up properly
frame = None
for i in range(10):
    ret, frame = cap.read()

cap.release()

if not ret or frame is None:
    print("❌ مش قادر يقرأ فريم!")
    sys.exit(1)

h, w = frame.shape[:2]
print(f"✅ Frame captured: {w}x{h} pixels")

# ── Try to query zones from DB directly ───────────────────────────────────────
zones = []
try:
    import psycopg2

    # Read .env manually
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    env = {}
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()

    conn = psycopg2.connect(
        dbname=env.get("DB_NAME", "examguard_db"),
        user=env.get("DB_USER", "postgres"),
        password=env.get("DB_PASSWORD", ""),
        host=env.get("DB_HOST", "localhost"),
        port=env.get("DB_PORT", "5432"),
    )
    cur = conn.cursor()
    cur.execute("""
        SELECT id, student_code, x1, y1, x2, y2, camera_id
        FROM H_student_zones
        ORDER BY id
        LIMIT 20
    """)
    for row in cur.fetchall():
        zones.append({
            "id": row[0], "student_code": row[1],
            "x1": row[2], "y1": row[3],
            "x2": row[4], "y2": row[5],
            "camera_id": row[6],
        })
    conn.close()
    print(f"\n📐 Zones in DB: {len(zones)}")

except ImportError:
    print("\n⚠️  psycopg2 مش موجود — هيتم رسم zone افتراضي بس")
    zones = []
except Exception as exc:
    print(f"\n⚠️  DB Error: {exc}")
    zones = []

# ── Draw zones on frame ────────────────────────────────────────────────────────
if zones:
    for z in zones:
        x1, y1, x2, y2 = z["x1"], z["y1"], z["x2"], z["y2"]
        valid = (0 <= x1 < x2 <= w) and (0 <= y1 < y2 <= h)
        color  = (0, 255, 0) if valid else (0, 0, 255)
        status = "OK" if valid else "OUT-OF-BOUNDS"
        print(f"  Zone {z['id']}: ({x1},{y1})→({x2},{y2}) cam={z['camera_id']} → {status}")
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
        label = f"Zone {z['id']} ({status})"
        cv2.putText(frame, label, (x1, max(y1 - 8, 15)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
else:
    # Draw a full-frame test zone
    cv2.rectangle(frame, (10, 10), (w - 10, h - 10), (255, 165, 0), 3)
    cv2.putText(frame, "No zones found — full frame test zone",
                (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 165, 0), 2)
    print("  ℹ️  No zones — drawing full-frame test zone")

# ── Save ───────────────────────────────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(__file__), "captured_frame.jpg")
cv2.imwrite(out_path, frame)

size_kb = os.path.getsize(out_path) / 1024
print(f"\n📸 Saved to: {out_path}")
print(f"   Frame size: {size_kb:.1f} KB")
print("\n👆 افتح الصورة دي وشوف:")
print("   ✅ Zone خضراء = الـ coords صح وداخل الصورة")
print("   ❌ Zone حمراء = الـ coords غلط أو خارج الصورة")
print("   🟡 Zone برتقالية = مفيش zones في الداتا بيز")

