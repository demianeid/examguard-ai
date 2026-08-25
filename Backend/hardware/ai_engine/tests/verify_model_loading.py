"""
verify_model_loading.py
───────────────────────
Phase 1 local smoke-test for ExamGuard AI Engine.

Purpose
-------
Verify that:
  1. ultralytics is correctly installed.
  2. YOLOv8n weights can be loaded (downloads automatically on first run).
  3. A forward pass on a blank test image succeeds without errors.
  4. The ai_engine package is importable from the project root.

Run from the project root (examguard-ai/):
    python Backend/hardware/ai_engine/tests/verify_model_loading.py

Expected output (success):
    ✅ ultralytics imported successfully  (version X.Y.Z)
    ⬇️  Loading yolov8n.pt ...
    ✅ YOLOv8n loaded successfully
    🖼️  Running inference on blank 640×640 test image ...
    ✅ Inference passed — 0 detections on blank image (expected)
    📦 Importing ai_engine package stubs ...
    ✅ zone_processor imported
    ✅ detector imported
    ✅ phone_detector imported
    ✅ face_detector imported
    ✅ head_pose imported
    ─────────────────────────────────────────────────────
    🎉  Phase 1 verification PASSED. Environment is ready.
    ─────────────────────────────────────────────────────
"""

from __future__ import annotations

import sys
import os

# ── Make the project root importable ─────────────────────────────────────────
# Assumes script is run from:  examguard-ai/
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
BACKEND_ROOT = os.path.join(PROJECT_ROOT, "Backend")

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

# ─────────────────────────────────────────────────────────────────────────────
# 1. Check ultralytics
# ─────────────────────────────────────────────────────────────────────────────
try:
    import ultralytics
    print(f"✅ ultralytics imported successfully  (version {ultralytics.__version__})")
except ImportError as exc:
    print("❌ ultralytics not found.")
    print("   Run:  pip install ultralytics")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# 2. Load YOLOv8n weights
# ─────────────────────────────────────────────────────────────────────────────
from ultralytics import YOLO  # noqa: E402

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "models", "yolov8n.pt"
)

print("⬇️  Loading yolov8n.pt ...")
try:
    model = YOLO(MODEL_PATH if os.path.exists(MODEL_PATH) else "yolov8n.pt")
    print("✅ YOLOv8n loaded successfully")
except Exception as exc:
    print(f"❌ Failed to load YOLOv8n: {exc}")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# 3. Forward pass on a synthetic blank image
# ─────────────────────────────────────────────────────────────────────────────
import numpy as np  # noqa: E402

print("🖼️  Running inference on blank 640×640 test image ...")
try:
    blank = np.zeros((640, 640, 3), dtype=np.uint8)
    results = model(blank, verbose=False)
    n_det = sum(len(r.boxes) for r in results)
    print(f"✅ Inference passed — {n_det} detections on blank image (expected)")
except Exception as exc:
    print(f"❌ Inference failed: {exc}")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# 4. Import ai_engine package stubs
# ─────────────────────────────────────────────────────────────────────────────
print("📦 Importing ai_engine package stubs ...")

_stubs = [
    ("hardware.ai_engine.zone_processor", "zone_processor"),
    ("hardware.ai_engine.detector",       "detector"),
    ("hardware.ai_engine.phone_detector", "phone_detector"),
    ("hardware.ai_engine.face_detector",  "face_detector"),
    ("hardware.ai_engine.head_pose",      "head_pose"),
]

all_ok = True
for module_path, label in _stubs:
    try:
        import importlib
        importlib.import_module(module_path)
        print(f"✅ {label} imported")
    except ImportError as exc:
        print(f"❌ {label} import failed: {exc}")
        all_ok = False

# ─────────────────────────────────────────────────────────────────────────────
# Result
# ─────────────────────────────────────────────────────────────────────────────
print("─" * 53)
if all_ok:
    print("🎉  Phase 1 verification PASSED. Environment is ready.")
else:
    print("⚠️   Phase 1 verification completed WITH ERRORS (see above).")
print("─" * 53)
