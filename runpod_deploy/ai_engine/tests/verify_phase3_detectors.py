# """
# verify_phase3_detectors.py
# ──────────────────────────
# Phase 3 local smoke-test — AI Detector Integration.

# What it checks
# --------------
# 1.  PhoneDetector imports and loads (YOLOv8n weights).
# 2.  PhoneDetector.detect() runs on a synthetic blank crop with no crash.
# 3.  FaceDetector imports and loads (YOLO-face or Haar fallback).
# 4.  FaceDetector.detect() returns ``no_face`` alert on a blank frame.
# 5.  HeadPoseEstimator imports and loads (MediaPipe or graceful skip).
# 6.  HeadPoseEstimator.estimate() returns [] or looking_away on a synthetic frame.
# 7.  Full process_frame() pipeline returns per-zone dicts with an "alerts" list.
# 8.  AIDetector.load_models() and AIDetector.run() work end-to-end.
# 9.  Alert dict schema is valid for Django ai_detection POST.

# Run from the project root (examguard-ai/):
#     python Backend/hardware/ai_engine/tests/verify_phase3_detectors.py

# Expected output (success):
#     ✅  PhoneDetector loaded
#     ✅  PhoneDetector.detect() on blank — no crash, 0 alerts (expected)
#     ✅  FaceDetector loaded  (backend: haar | yolo)
#     ✅  FaceDetector.detect() → no_face on blank frame
#     ✅  HeadPoseEstimator loaded  (mediapipe available: True|False)
#     ✅  HeadPoseEstimator.estimate() — no crash
#     ✅  process_frame() returns list of zone dicts
#     ✅  every result has required keys
#     ✅  alerts list is present and is a list
#     ✅  AIDetector.load_models() succeeded
#     ✅  AIDetector.run() returned results
#     ✅  alert schema valid for Django POST
#     ─────────────────────────────────────────────────────
#     🎉  Phase 3 verification PASSED. Detectors are ready.
#     ─────────────────────────────────────────────────────
# """

# from __future__ import annotations

# import sys
# import os
# import traceback

# # ── Path setup ────────────────────────────────────────────────────────────────
# _SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
# _PROJECT_ROOT = os.path.abspath(os.path.join(_SCRIPT_DIR, "..", "..", "..", ".."))
# _BACKEND_ROOT = os.path.join(_PROJECT_ROOT, "Backend")

# for _p in (_PROJECT_ROOT, _BACKEND_ROOT):
#     if _p not in sys.path:
#         sys.path.insert(0, _p)

# import numpy as np
# import cv2

# PASS = "✅"
# FAIL = "❌"
# all_ok = True

# def check(label: str, condition: bool, detail: str = "") -> None:
#     global all_ok
#     icon = PASS if condition else FAIL
#     msg  = f"{icon}  {label}"
#     if detail:
#         msg += f"  ({detail})"
#     print(msg)
#     if not condition:
#         all_ok = False

# # ── Synthetic test assets ─────────────────────────────────────────────────────
# # A plausible exam-desk crop: 640×640, random pixels
# _BLANK = np.zeros((640, 640, 3), dtype=np.uint8)

# # A face-like crop: draw skin-tone filled oval in the centre
# _FACE_CROP = np.full((640, 640, 3), fill_value=(180, 140, 110), dtype=np.uint8)
# cv2.ellipse(_FACE_CROP, (320, 300), (160, 200), 0, 0, 360, (200, 160, 130), -1)
# # Draw eyes and mouth to help landmark detection
# cv2.circle(_FACE_CROP, (260, 240), 20, (50, 40, 35),  -1)   # left eye
# cv2.circle(_FACE_CROP, (380, 240), 20, (50, 40, 35),  -1)   # right eye
# cv2.ellipse(_FACE_CROP, (320, 380), (60, 25),  0, 0, 180, (120, 60, 60), -1)   # mouth

# def _b64(frame: np.ndarray) -> str:
#     from hardware.ai_engine.zone_processor import encode_frame
#     return encode_frame(frame, quality=85)

# _ZONE = {
#     "id": 1, "student_code": "T001", "student_name": "Test Student",
#     "x1": 0, "y1": 0, "x2": 640, "y2": 640,
# }

# # ─────────────────────────────────────────────────────────────────────────────
# # 1. PhoneDetector
# # ─────────────────────────────────────────────────────────────────────────────
# print("\n── PhoneDetector ──────────────────────────────────────")
# try:
#     from hardware.ai_engine.phone_detector import PhoneDetector, get_phone_detector
#     pd = PhoneDetector()
#     pd.load()
#     check("PhoneDetector loaded", pd._loaded)
# except Exception as exc:
#     check("PhoneDetector loaded", False, str(exc))
#     traceback.print_exc()

# try:
#     alerts = pd.detect(_BLANK)
#     check(
#         "PhoneDetector.detect() on blank — no crash, 0 alerts",
#         isinstance(alerts, list) and len(alerts) == 0,
#         f"got {len(alerts)} alert(s)",
#     )
# except Exception as exc:
#     check("PhoneDetector.detect() on blank", False, str(exc))
#     traceback.print_exc()

# # ─────────────────────────────────────────────────────────────────────────────
# # 2. FaceDetector
# # ─────────────────────────────────────────────────────────────────────────────
# print("\n── FaceDetector ───────────────────────────────────────")
# try:
#     from hardware.ai_engine.face_detector import FaceDetector
#     fd = FaceDetector()
#     fd.load()
#     check("FaceDetector loaded", fd._loaded, f"backend: {fd._backend.value}")
# except Exception as exc:
#     check("FaceDetector loaded", False, str(exc))
#     traceback.print_exc()

# try:
#     alerts = fd.detect(_BLANK)
#     # Blank frame has no face → expect exactly one no_face alert
#     is_no_face = (
#         len(alerts) == 1
#         and alerts[0]["type"] == "no_face"
#         and alerts[0]["severity"] == "high"
#     )
#     check(
#         "FaceDetector.detect() → no_face on blank frame",
#         is_no_face,
#         f"alerts={[a['type'] for a in alerts]}",
#     )
# except Exception as exc:
#     check("FaceDetector.detect() on blank", False, str(exc))
#     traceback.print_exc()

# # ─────────────────────────────────────────────────────────────────────────────
# # 3. HeadPoseEstimator
# # ─────────────────────────────────────────────────────────────────────────────
# print("\n── HeadPoseEstimator ──────────────────────────────────")
# try:
#     from hardware.ai_engine.head_pose import HeadPoseEstimator
#     hp = HeadPoseEstimator()
#     hp.load()
#     check(
#         "HeadPoseEstimator loaded",
#         hp._mp_loaded,
#         f"mediapipe available: {hp._available}",
#     )
# except Exception as exc:
#     check("HeadPoseEstimator loaded", False, str(exc))
#     traceback.print_exc()

# try:
#     alerts = hp.estimate(_BLANK)
#     # Blank frame → no landmarks → expects [] regardless of backend
#     check(
#         "HeadPoseEstimator.estimate() on blank — no crash, returns list",
#         isinstance(alerts, list),
#         f"got {len(alerts)} alert(s)",
#     )
# except Exception as exc:
#     check("HeadPoseEstimator.estimate() on blank", False, str(exc))
#     traceback.print_exc()

# # ─────────────────────────────────────────────────────────────────────────────
# # 4. Full process_frame() pipeline (one zone, blank crop)
# # ─────────────────────────────────────────────────────────────────────────────
# print("\n── process_frame() pipeline ───────────────────────────")
# try:
#     from hardware.ai_engine.zone_processor import process_frame
#     frame_b64 = _b64(np.zeros((640, 640, 3), dtype=np.uint8))
#     results   = process_frame(frame_b64, [_ZONE])

#     check("process_frame() returns a list", isinstance(results, list))
#     check("process_frame() returns 1 result for 1 zone", len(results) == 1)

#     r = results[0]
#     required = {"zone_id", "student_code", "student_name", "roi", "is_valid", "alerts"}
#     check("all required keys present", required.issubset(r.keys()),
#           f"missing: {required - r.keys()}")
#     check("alerts is a list", isinstance(r["alerts"], list))
#     check("is_valid=True for full-frame zone", r["is_valid"] is True)

# except Exception as exc:
#     check("process_frame() pipeline", False, str(exc))
#     traceback.print_exc()

# # ─────────────────────────────────────────────────────────────────────────────
# # 5. AIDetector (top-level orchestrator)
# # ─────────────────────────────────────────────────────────────────────────────
# print("\n── AIDetector ─────────────────────────────────────────")
# try:
#     from hardware.ai_engine.detector import AIDetector
#     ai  = AIDetector()
#     ai.load_models()
#     check("AIDetector.load_models() succeeded", ai._loaded, str(ai.status))
# except Exception as exc:
#     check("AIDetector.load_models()", False, str(exc))
#     traceback.print_exc()

# try:
#     frame_b64 = _b64(np.zeros((640, 640, 3), dtype=np.uint8))
#     results   = ai.run(frame_b64, [_ZONE])
#     check("AIDetector.run() returned results", isinstance(results, list) and len(results) == 1)
# except Exception as exc:
#     check("AIDetector.run()", False, str(exc))
#     traceback.print_exc()

# # ─────────────────────────────────────────────────────────────────────────────
# # 6. Alert schema validation (for Django ai_detection POST)
# # ─────────────────────────────────────────────────────────────────────────────
# print("\n── Alert schema (Django POST compatibility) ───────────")
# REQUIRED_ALERT_KEYS = {"type", "severity", "confidence", "detector"}
# VALID_TYPES = {
#     "mobile_phone", "external_paper",
#     "no_face", "multiple_faces",
#     "looking_away", "head_movement",
# }
# VALID_SEVERITIES = {"high", "medium", "low"}

# try:
#     # Force a no_face alert via face_detector on a blank frame
#     sample_alerts = fd.detect(_BLANK)
#     alert = sample_alerts[0] if sample_alerts else {}

#     keys_ok     = REQUIRED_ALERT_KEYS.issubset(alert.keys()) if alert else True
#     type_ok     = alert.get("type")     in VALID_TYPES      if alert else True
#     severity_ok = alert.get("severity") in VALID_SEVERITIES  if alert else True
#     conf_ok     = isinstance(alert.get("confidence"), float)  if alert else True

#     check("alert has required keys", keys_ok,
#           f"missing: {REQUIRED_ALERT_KEYS - alert.keys()}")
#     check("alert type is a known Django Alert.TYPE_CHOICES value", type_ok,
#           str(alert.get("type")))
#     check("alert severity is valid", severity_ok,
#           str(alert.get("severity")))
#     check("alert confidence is float", conf_ok,
#           str(type(alert.get("confidence"))))

# except Exception as exc:
#     check("Alert schema validation", False, str(exc))
#     traceback.print_exc()

# # ─────────────────────────────────────────────────────────────────────────────
# # Result
# # ─────────────────────────────────────────────────────────────────────────────
# print("\n" + "─" * 53)
# if all_ok:
#     print("🎉  Phase 3 verification PASSED. Detectors are ready.")
# else:
#     print("⚠️   Phase 3 verification completed WITH ERRORS (see above).")
#     sys.exit(1)
# print("─" * 53)
