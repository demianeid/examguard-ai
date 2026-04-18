"""
verify_phase2_pipeline.py
─────────────────────────
Phase 2 local smoke-test — Zone Cropping Pipeline.

What it checks
--------------
1.  encode_frame() / decode_frame() round-trip (no RTSP needed).
2.  crop_zones() correctly slices ROI rectangles from a synthetic frame.
3.  Degenerate zones (out-of-bounds, zero-area, missing keys) are handled
    gracefully without exceptions.
4.  process_frame() returns the full JSON-serialisable response dict.
5.  RtspReader can be instantiated (no live stream — just import test).
6.  dispatcher.py imports cleanly.

Run from the project root (examguard-ai/):
    python myproject_backend/hardware/ai_engine/tests/verify_phase2_pipeline.py

Expected output (success):
    ✅  encode_frame / decode_frame round-trip
    ✅  crop_zones — 3 valid crops produced
    ✅  degenerate zone handled (is_valid=False, no exception)
    ✅  process_frame() returned 4 results
    ✅  all ZoneCrop.to_dict() fields present
    ✅  RtspReader imported and instantiated
    ✅  dispatcher module imported
    ─────────────────────────────────────────────────────
    🎉  Phase 2 verification PASSED. Pipeline is ready.
    ─────────────────────────────────────────────────────
"""

from __future__ import annotations

import sys
import os

# ── Ensure project root is importable ────────────────────────────────────────
_SCRIPT_DIR    = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT  = os.path.abspath(os.path.join(_SCRIPT_DIR, "..", "..", "..", ".."))
_BACKEND_ROOT  = os.path.join(_PROJECT_ROOT, "myproject_backend")

for p in (_PROJECT_ROOT, _BACKEND_ROOT):
    if p not in sys.path:
        sys.path.insert(0, p)

import traceback

import cv2
import numpy as np

PASS = "✅"
FAIL = "❌"
all_ok = True


def check(label: str, condition: bool, detail: str = "") -> None:
    global all_ok
    icon = PASS if condition else FAIL
    print(f"{icon}  {label}" + (f" — {detail}" if detail else ""))
    if not condition:
        all_ok = False


# ─────────────────────────────────────────────────────────────────────────────
# 1. Import zone_processor
# ─────────────────────────────────────────────────────────────────────────────
try:
    from hardware.ai_engine.zone_processor import (
        encode_frame,
        decode_frame,
        crop_zones,
        process_frame,
        ZoneCrop,
        MODEL_INPUT_SIZE,
        MIN_CROP_DIM,
    )
    check("zone_processor imported", True)
except ImportError as exc:
    check("zone_processor imported", False, str(exc))
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# 2. Build a synthetic test frame (1280 × 720 colour gradient)
# ─────────────────────────────────────────────────────────────────────────────
H, W = 720, 1280
frame = np.zeros((H, W, 3), dtype=np.uint8)
# Blue gradient left-to-right
frame[:, :, 0] = np.linspace(0, 255, W, dtype=np.uint8)
# Green gradient top-to-bottom
frame[:, :, 1] = np.linspace(0, 255, H, dtype=np.uint8).reshape(H, 1)
# Draw three bright coloured rectangles — stand-ins for student desk areas
cv2.rectangle(frame, (50,  50),  (350, 350), (0,   0,   255), -1)   # zone 1 red
cv2.rectangle(frame, (450, 50),  (750, 350), (0,   255, 0),   -1)   # zone 2 green
cv2.rectangle(frame, (850, 50),  (1150, 350),(255, 0,   0),   -1)   # zone 3 blue

# ─────────────────────────────────────────────────────────────────────────────
# 3. encode / decode round-trip
# ─────────────────────────────────────────────────────────────────────────────
try:
    b64 = encode_frame(frame, quality=90)
    decoded = decode_frame(b64)
    shape_ok = decoded.shape == frame.shape
    check("encode_frame / decode_frame round-trip", shape_ok,
          f"shape {decoded.shape} == {frame.shape}")
except Exception as exc:
    check("encode_frame / decode_frame round-trip", False, str(exc))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 4. crop_zones — three good zones
# ─────────────────────────────────────────────────────────────────────────────
good_zones = [
    {"id": 1, "student_code": "S001", "student_name": "Alice",
     "x1": 50,  "y1": 50,  "x2": 350, "y2": 350},
    {"id": 2, "student_code": "S002", "student_name": "Bob",
     "x1": 450, "y1": 50,  "x2": 750, "y2": 350},
    {"id": 3, "student_code": "S003", "student_name": "Carol",
     "x1": 850, "y1": 50,  "x2": 1150,"y2": 350},
]

try:
    crops = crop_zones(frame, good_zones)
    all_valid = all(c.is_valid for c in crops)
    check(
        f"crop_zones — {len(crops)} valid crops produced",
        len(crops) == 3 and all_valid,
        f"valid={[c.is_valid for c in crops]}",
    )

    # Verify model_input shape matches MODEL_INPUT_SIZE
    expected_shape = (MODEL_INPUT_SIZE[1], MODEL_INPUT_SIZE[0], 3)
    shapes_ok = all(c.model_input.shape == expected_shape for c in crops)
    check(
        f"model_input shape is {MODEL_INPUT_SIZE[0]}×{MODEL_INPUT_SIZE[1]}",
        shapes_ok,
        f"shapes={[c.model_input.shape for c in crops]}",
    )

    # Verify scale factors are > 0
    scales_ok = all(c.scale_x > 0 and c.scale_y > 0 for c in crops)
    check("scale factors are positive", scales_ok)

    # Verify roi coords match input
    roi_ok = crops[0].roi == {"x1": 50, "y1": 50, "x2": 350, "y2": 350}
    check("roi coords preserved correctly", roi_ok, str(crops[0].roi))

except Exception as exc:
    check("crop_zones — good zones", False, str(exc))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 5. Degenerate zones — should be graceful (is_valid=False, no crash)
# ─────────────────────────────────────────────────────────────────────────────
degenerate_zones = [
    # Zero-area zone
    {"id": 10, "student_code": "D001", "x1": 100, "y1": 100, "x2": 100, "y2": 100},
    # Entirely out of bounds
    {"id": 11, "student_code": "D002", "x1": 9000, "y1": 9000, "x2": 9500, "y2": 9500},
    # Missing coord keys
    {"id": 12, "student_code": "D003"},
    # Swapped coords (x1 > x2) — should be normalised, then checked
    {"id": 13, "student_code": "D004", "x1": 300, "y1": 300, "x2": 50, "y2": 50},
]

try:
    deg_crops = crop_zones(frame, degenerate_zones)
    no_exception = True
    none_valid   = all(not c.is_valid for c in deg_crops[:3])   # first 3 are genuinely bad
    check("degenerate zones produce no exception", no_exception)
    check(
        "degenerate zones marked is_valid=False",
        none_valid,
        f"valid flags = {[c.is_valid for c in deg_crops]}",
    )
except Exception as exc:
    check("degenerate zones handled gracefully", False, str(exc))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 6. process_frame() — full public API round-trip
# ─────────────────────────────────────────────────────────────────────────────
try:
    b64 = encode_frame(frame, quality=85)
    all_zones = good_zones + [degenerate_zones[0]]
    results = process_frame(b64, all_zones)

    count_ok = len(results) == len(all_zones)
    check(f"process_frame() returned {len(results)} results", count_ok)

    required_keys = {"zone_id", "student_code", "student_name", "roi", "is_valid", "alerts"}
    keys_ok = all(required_keys.issubset(r.keys()) for r in results)
    check("all ZoneCrop.to_dict() fields present", keys_ok,
          f"missing in first result: {required_keys - results[0].keys()}")

    alerts_ok = all(isinstance(r["alerts"], list) for r in results)
    check("alerts field is a list in every result", alerts_ok)

except Exception as exc:
    check("process_frame() full round-trip", False, str(exc))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 7. RtspReader import + instantiation (no live stream)
# ─────────────────────────────────────────────────────────────────────────────
try:
    from hardware.frame_dispatcher.rtsp_reader import RtspReader, RtspReaderError
    reader = RtspReader(stream_url="rtsp://127.0.0.1/test", fps=2, camera_id=99)
    check("RtspReader imported and instantiated", True, f"interval={1/reader.fps:.2f}s")
    check("RtspReader.is_running is True before stop()", reader.is_running)
except Exception as exc:
    check("RtspReader imported and instantiated", False, str(exc))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 8. dispatcher.py import
# ─────────────────────────────────────────────────────────────────────────────
try:
    from hardware.frame_dispatcher import dispatcher   # noqa: F401
    check("dispatcher module imported", True)
except Exception as exc:
    check("dispatcher module imported", False, str(exc))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# Result
# ─────────────────────────────────────────────────────────────────────────────
print("─" * 53)
if all_ok:
    print("🎉  Phase 2 verification PASSED. Pipeline is ready.")
else:
    print("⚠️   Phase 2 verification completed WITH ERRORS (see above).")
    sys.exit(1)
print("─" * 53)
