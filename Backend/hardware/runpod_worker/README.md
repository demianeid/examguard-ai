# ExamGuard AI — RunPod Worker

## Overview

This package is the **RunPod serverless entry point** for the ExamGuard GPU inference engine.

| File | Purpose |
|---|---|
| `handler.py` | RunPod entry point — `runpod.serverless.start()` |
| `Dockerfile` | GPU container (CUDA 11.8 + Python 3.10) |
| `requirements.txt` | Python deps for the GPU environment |

## Local Testing (no GPU needed)

```bash
# 1. Install CPU-only ultralytics to verify model loading
pip install ultralytics opencv-python-headless

# 2. Run the verification script from the project root
python Backend/hardware/ai_engine/tests/verify_model_loading.py
```

## Docker Build & Push (for RunPod)

```bash
# From the runpod_worker/ directory:
docker build -t examguard-ai-worker:latest .

# Tag and push to Docker Hub (replace with your registry):
docker tag examguard-ai-worker:latest yourdockerhub/examguard-ai-worker:latest
docker push yourdockerhub/examguard-ai-worker:latest
```

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DJANGO_API_URL` | Base URL of the Django backend | `https://your-backend.com/api` |
| `DJANGO_API_TOKEN` | Service auth token | `Token abc123...` |
| `ALERT_CONFIDENCE_THRESHOLD` | Min confidence for an alert | `0.6` |
| `FRAME_SAMPLE_RATE` | Frames per second to process | `2` |

## Data Flow

```
Django frame_dispatcher
    │  POST {frame, zones, exam_id, session_id}
    ▼
RunPod handler.py
    │  process_frame(frame_b64, zones)
    ▼
ai_engine/zone_processor.py
    │  crop ROI → phone_detector, face_detector, head_pose
    ▼
[{zone_id, student_code, alerts: [...]}]
    │
    ▼
Django ai_detection/views.py  →  Alert model  →  ViolationLog
```
