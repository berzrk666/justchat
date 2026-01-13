# syntax=docker/dockerfile:1

FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app/src

WORKDIR /app

# -----------------------------
# Dependencies stage
# -----------------------------
FROM base AS dependencies

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    python3-dev \
    libpq-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# -----------------------------
# Development stage
# -----------------------------
FROM dependencies AS development

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "chat_server.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# -----------------------------
# Production stage
# -----------------------------
FROM base AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=dependencies /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

COPY src/ ./src/

# Production command (no reload, multiple workers)
CMD ["uvicorn", "chat_server.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
