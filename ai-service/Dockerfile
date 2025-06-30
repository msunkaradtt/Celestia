# FILE: ai-service/Dockerfile

# Use the NVIDIA CUDA development image
FROM nvidia/cuda:11.8.0-devel-ubuntu22.04

# Set up environment
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3.9 \
    python3-pip \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Install PyTorch first
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install the rest of the requirements
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# The command to start the RunPod handler script
CMD ["python3", "main.py"]