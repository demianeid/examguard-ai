# ─────────────────────────────────────────────────────────────────────────────
# ExamGuard AI — RunPod Serverless Worker
# Build context : runpod_deploy/          (repo root subdirectory)
# Target env    : CUDA 11.8 · Python 3.10 · Ubuntu 20.04
# ─────────────────────────────────────────────────────────────────────────────
FROM runpod/pytorch:2.1.1-py3.10-cuda11.8.0-devel-ubuntu22.04

# Suppress interactive prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

# ── System deps ───────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0       \
    libgl1-mesa-glx    \
    libsm6             \
    libxext6           \
    libxrender-dev     \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Python dependencies ───────────────────────────────────────────────────────
# Copy requirements first so Docker layer-cache skips re-install on code changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Application code ──────────────────────────────────────────────────────────
# ai_engine package (inference logic)
COPY ai_engine/ ./ai_engine/

# RunPod entry point
COPY handler.py .

# ── Model weights (downloaded at build time — baked into the image) ───────────
# yolov8n.pt  : phone / paper detection
# yolov10n-face.pt : face counting (from akanametov/yolo-face)
RUN python - <<'EOF'
from ultralytics import YOLO
YOLO("yolov8n.pt")          # downloads to cwd, then ultralytics caches it
import shutil, os
# Move weight to models/ so ai_engine can find it by default path
os.makedirs("ai_engine/models", exist_ok=True)
for src in ["yolov8n.pt"]:
    if os.path.isfile(src):
        shutil.copy(src, f"ai_engine/models/{src}")
        print(f"Copied {src} -> ai_engine/models/{src}")
EOF

# yolov10n-face.pt — community model, downloaded via direct URL
RUN python - <<'EOF'
import urllib.request, os
url  = "https://github.com/akanametov/yolo-face/releases/download/1.0.0/yolov10n-face.pt"
dest = "ai_engine/models/yolov10n-face.pt"
os.makedirs("ai_engine/models", exist_ok=True)
print(f"Downloading {url} ...")
urllib.request.urlretrieve(url, dest)
size = os.path.getsize(dest) / 1024 / 1024
print(f"Done -- {size:.1f} MB saved to {dest}")
EOF

# ── Environment defaults (override at RunPod endpoint level) ──────────────────
ENV DJANGO_API_URL=""
ENV DJANGO_API_TOKEN=""
ENV RUNPOD_ENDPOINT=""
ENV ALERT_CONFIDENCE_THRESHOLD="0.45"
ENV HEAD_YAW_THRESHOLD="30"
ENV HEAD_PITCH_THRESHOLD="20"
ENV HEAD_MOVE_THRESHOLD="15"

# ── Start the serverless worker ───────────────────────────────────────────────
CMD ["python3", "-u", "handler.py"]
