import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.database import engine, Base, SessionLocal
# Nạp tất cả 17 models để Base metadata tạo bảng đầy đủ
from app.models import (
    Role,
    User,
    Building,
    Apartment,
    Amenity,
    Tenant,
    Roommate,
    EmergencyContact,
    Booking,
    Contract,
    Deposit,
    Receivable,
    Payment,
    DebtLedger,
    SystemAlert,
    MaintenanceRequest,
    DocumentChunk
)
from app.routers.api_v1 import api_v1_router
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.building import router as building_router
from app.routers.apartment import router as apartment_router
from app.routers.amenity import router as amenity_router
from app.routers.tenant import router as tenant_router
from app.routers.roommate import router as roommate_router
from app.routers.emergency_contact import router as emergency_contact_router
from app.routers.booking import router as booking_router
from app.routers.contract import router as contract_router
from app.routers.deposit import router as deposit_router
from app.routers.receivable import router as receivable_router
from app.routers.payment import router as payment_router
from app.routers.debt_ledger import router as debt_ledger_router
from app.routers.user import router as user_router
from app.routers.system_alert import router as system_alert_router
from app.routers.dashboard import router as dashboard_router
from app.routers.maintenance_request import router as maintenance_request_router
from app.routers.ai import router as ai_router
from app.routers.billing import router as billing_router
from app.seed_full_data import seed_all

logger = logging.getLogger("uvicorn.error")

# Tạo tất cả 17 bảng trong CSDL
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi tạo và đồng bộ dữ liệu mẫu khi khởi động app
    try:
        seed_all()

        # Tự động quét cảnh báo hệ thống ban đầu
        from app.tasks.cron_jobs import run_daily_alert_scan
        run_daily_alert_scan()

        logger.info("Khởi tạo CSDL, Roles, Admin, Tri thức RAG và Quét cảnh báo thành công!")
    except Exception as e:
        logger.warning(f"Lỗi khởi tạo seed hoặc quét cảnh báo ban đầu: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Hệ sinh thái API Quản lý Vận hành Thuê Căn hộ Dwell tích hợp Trợ lý Trí tuệ Nhân tạo GenAI",
    lifespan=lifespan
)

# Cấu hình CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ==============================================================================
# XỬ LÝ LỖI TOÀN CỤC & CHUẨN HÓA JSON RESPONSE ENVELOPE (Section III - 3.4)
# ==============================================================================
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": exc.detail
            }
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Lỗi máy chủ chưa bắt được: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": 500,
                "message": f"Lỗi nội bộ hệ thống: {str(exc)}"
            }
        }
    )


# 1. Mount API Version 1 (Chuẩn RESTful API v1)
app.include_router(api_v1_router)

# 2. Mount root routers để tương thích ngược 100% với các client gọi không prefix v1
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(building_router)
app.include_router(apartment_router)
app.include_router(amenity_router)
app.include_router(tenant_router)
app.include_router(roommate_router)
app.include_router(emergency_contact_router)
app.include_router(booking_router)
app.include_router(contract_router)
app.include_router(deposit_router)
app.include_router(receivable_router)
app.include_router(payment_router)
app.include_router(debt_ledger_router)
app.include_router(user_router)
app.include_router(system_alert_router)
app.include_router(dashboard_router)
app.include_router(maintenance_request_router)
app.include_router(ai_router)
app.include_router(billing_router)

# ==============================================================================
# PROMETHEUS METRICS & STRUCTURED LOGGING FOR LOKI
# ==============================================================================
try:
    from prometheus_fastapi_instrumentator import Instrumentator
    Instrumentator().instrument(app).expose(app, endpoint="/metrics")
    logger.info("Prometheus Instrumentator initialized at /metrics")
except Exception as prom_err:
    logger.warning(f"Prometheus Instrumentator warning: {prom_err}")

import json
import time
from datetime import datetime, timezone

@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    
    # Bỏ qua log spam của healthcheck và metrics
    if request.url.path not in ["/metrics", "/healthz"]:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "client_ip": request.client.host if request.client else "unknown"
        }
        logger.info(f"AUDIT_LOG: {json.dumps(log_entry)}")
    return response


@app.get("/")
def home():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "api_v1": "/api/v1",
        "docs": "/docs",
        "metrics": "/metrics"
    }


@app.get("/healthz")
def healthz():
    return {"status": "healthy"}


@app.get("/test-db")
def test_database():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {
            "status": "success",
            "message": "Kết nối cơ sở dữ liệu PostgreSQL thành công!",
            "result": result.scalar()
        }