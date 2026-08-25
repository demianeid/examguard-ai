# hardware/runpod_worker/Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# ExamGuard AI — GPU Inference Worker for RunPod Serverless
#
# Base:   CUDA 11.8 + cuDNN 8 + Ubuntu 20.04
# Python: 3.10  (installed from deadsnakes PPA for clean version control)
# ─────────────────────────────────────────────────────────────────────────────

FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu20.04

# ── Environment ───────────────────────────────────────────────────────────────
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    TZ=UTC

WORKDIR /app

# ── System dependencies ───────────────────────────────────────────────────────
# libgl1 + libglib2.0-0  : required by OpenCV headless
# software-properties-common : needed to add deadsnakes PPA for Python 3.10
RUN apt-get update && apt-get install -y --no-install-recommends \
        software-properties-common \
        curl \
        libgl1 \
        libglib2.0-0 \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update && apt-get install -y --no-install-recommends \
        python3.10 \
        python3.10-distutils \
    && curl -sS https://bootstrap.pypa.io/get-pip.py | python3.10 \
    && rm -rf /var/lib/apt/lists/*

# Ensure `python3` and `pip` resolve to 3.10
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1 \
    && python3 --version

# ── Python dependencies ───────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Application code ──────────────────────────────────────────────────────────
# Copy ai_engine package and the handler entry point
COPY ../ai_engine ./ai_engine
COPY . .

# ── Model weights (downloaded at build time so cold-starts stay warm) ─────────
# The YOLO() call will download yolov8n.pt from Ultralytics hub if not present.
# In production, pre-bake the weights into the image via:
#   COPY models/yolov8n.pt    ./models/yolov8n.pt
#   COPY models/yolov8-face.pt ./models/yolov8-face.pt
RUN python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')" \
    && echo "✅ yolov8n.pt downloaded successfully."

# ── RunPod entry point ────────────────────────────────────────────────────────
CMD ["python3", "handler.py"]
