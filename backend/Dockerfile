# ==============================================================================
# Multi-stage Dockerfile cho Backend FastAPI Quản lý Chung cư
# Áp dụng Hardening: Non-root user (UID 1001), Minimal image, No root access
# ==============================================================================

# STAGE 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# STAGE 2: Runner
FROM python:3.11-slim AS runner

WORKDIR /app

# Cài đặt thư viện runtime cần thiết cho PostgreSQL client
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Hardening Lớp 1: Tạo non-root user và group riêng biệt
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/bash -m appuser

# Sao chép các package đã cài từ builder vào thư mục user
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Sao chép mã nguồn ứng dụng và phân quyền cho appuser
COPY --chown=appuser:appgroup . /app

# Chuyển quyền thực thi sang non-root user
USER appuser

EXPOSE 8000

# Healthcheck nội bộ container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/healthz || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
