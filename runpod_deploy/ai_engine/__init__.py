# ai_engine — ExamGuard RunPod GPU Worker inference package
#
# Modules
# -------
# detector        — AIDetector orchestrator (loads all sub-detectors)
# zone_processor  — Frame decode → crop → run detectors → return alerts
# face_detector   — YOLO-face / Haar: face count during live exam (no_face / multiple_faces)
# phone_detector  — YOLOv8n: mobile phone & external-paper detection
# head_pose       — MediaPipe: head orientation alerts (looking away)
# face_embedder   — InsightFace buffalo_l (ArcFace) + CLIP: registration & ID-card check
