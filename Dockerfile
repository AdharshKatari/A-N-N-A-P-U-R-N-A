# Stage 1: Build virtual python environment dependencies cleanly
FROM python:3.11-slim AS builder

WORKDIR /app

# Install native Linux compilation dependencies required for PostGIS connectors & ONNX Runtimes
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Instantiate isolated virtual env layer
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .

# Install packages with compiler optimization flags cached
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Final ultra-lightweight execution container footprint
FROM python:3.11-slim AS runner

WORKDIR /app

# Install runtime spatial libraries for PostGIS/GeoTIFF ingestion operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Pull calibrated python dependencies safely from builder stage
COPY --from=builder /opt/venv /opt/venv
COPY . .

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Execute high-performance Uvicorn ASGI workers to handle massive mobile requests
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
