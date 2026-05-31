# ─────────────────────────────────────────────────────────────
# backend/Dockerfile
# Python 3.12 + FastAPI + uvicorn with hot reload
# ─────────────────────────────────────────────────────────────

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source (overridden by volume mount in dev)
COPY . .

# Create storage directory for PDFs
RUN mkdir -p /app/storage

# Run uvicorn with hot reload
# Host 0.0.0.0 required so container port is accessible
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
