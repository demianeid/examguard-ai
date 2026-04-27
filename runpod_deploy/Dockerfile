# ─────────────────────────────────────────────────────────────────────────────
# ExamGuard AI — RunPod Serverless Worker
# Build context : runpod_deploy/          (repo root subdirectory)
# Target env    : CUDA 11.8 · Python 3.10 · Ubuntu 22.04
#
# Included AI pipelines
# ─────────────────────
# 1. YOLO proctoring  — phone/paper detection + face count + head pose
# 2. InsightFace      — ArcFace embeddings for student face registration
# 3. CLIP (ViT-B/32)  — zero-shot ID-card image validation
# ─────────────────────────────────────────────────────────────────────────────
FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-devel

# Suppress interactive prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

# ── System deps ───────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0       \
    libgl1-mesa-glx    \
    libsm6             \
    libxext6           \
    libxrender-dev     \
    wget               \
    unzip              \
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

# ── Model weights — baked into image at build time ────────────────────────────
# ── 1. YOLOv8n (phone / paper detection — COCO pretrained) ───────────────────
RUN python - <<'EOF'
from ultralytics import YOLO
import shutil, os
YOLO("yolov8n.pt")          # downloads to cwd via ultralytics hub
os.makedirs("ai_engine/models", exist_ok=True)
for src in ["yolov8n.pt"]:
    if os.path.isfile(src):
        shutil.copy(src, f"ai_engine/models/{src}")
        print(f"Copied {src} -> ai_engine/models/{src}")
EOF

# ── 2. YOLOv10n-face (face counting during live exam) ────────────────────────
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

# ── 3. InsightFace buffalo_l (ArcFace embeddings) ─────────────────────────────
# insightface's python downloader frequently fails or times out in CI.
# We download and extract the model manually to bypass this issue.
RUN mkdir -p ~/.insightface/models/buffalo_l && \
    wget -qO buffalo_l.zip "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" && \
    unzip -q buffalo_l.zip -d ~/.insightface/models/buffalo_l && \
    rm buffalo_l.zip && \
    echo "buffalo_l downloaded and extracted successfully."

# ── 4. CLIP ViT-B/32 (ID-card zero-shot classifier) ─────────────────────────
# Hugging Face Transformers caches models to ~/.cache/huggingface/
# Pre-downloading here avoids any network call during worker warm-up.
RUN python - <<'EOF'
from transformers import CLIPModel, CLIPProcessor
print("Pre-downloading CLIP openai/clip-vit-base-patch32 ...")
CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
print("CLIP downloaded and cached successfully.")
EOF

# ── Environment defaults (override at RunPod endpoint level) ──────────────────
ENV DJANGO_API_URL=""
ENV DJANGO_API_TOKEN=""
ENV RUNPOD_ENDPOINT=""
ENV ALERT_CONFIDENCE_THRESHOLD="0.45"
ENV HEAD_YAW_THRESHOLD="30"
ENV HEAD_PITCH_THRESHOLD="20"
ENV HEAD_MOVE_THRESHOLD="15"
ENV CLIP_ID_THRESHOLD="0.30"
ENV FACE_VERIFY_THRESHOLD="0.35"

# ── Start the serverless worker ───────────────────────────────────────────────
CMD ["python3", "-u", "handler.py"]
