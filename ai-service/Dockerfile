# FILE: ai-service/Dockerfile

FROM pytorch/pytorch:2.3.1-cuda12.1-cudnn8-runtime

# Set the working directory
WORKDIR /app

# Install dependencies including redis-tools for redis-cli
RUN apt-get update && apt-get install -y --no-install-recommends \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create a startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'python3 /app/shutdown_monitor.py &' >> /app/start.sh && \
    echo 'uvicorn main:app --host "0.0.0.0" --port 8000' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose the port the app runs on
EXPOSE 8000

# Set the default command to run the startup script
CMD ["/app/start.sh"]