from pydantic import (
    BaseModel,
    ConfigDict
)

from datetime import datetime
from decimal import Decimal


# =========================================================
# ADMIN / STAFF TẠO PHIẾU
# =========================================================
class MaintenanceCreate(BaseModel):
    apartment_id: int

    reporter_name: str
    phone: str

    issue_description: str

    priority: str = "MEDIUM"

    image_url: str | None = None

    tenant_id: int | None = None


# =========================================================
# TENANT TỰ GỬI PHIẾU
#
# Không cho Frontend gửi tenant_id.
# Backend tự lấy tenant_id từ JWT.
# =========================================================
class TenantMaintenanceCreate(BaseModel):
    apartment_id: int

    issue_description: str

    priority: str = "MEDIUM"

    image_url: str | None = None


# =========================================================
# PHÂN CÔNG NHÂN VIÊN
# =========================================================
class AssignStaffRequest(BaseModel):
    staff_id: int


# =========================================================
# NGHIỆM THU / HOÀN THÀNH
# =========================================================
class CompleteMaintenanceRequest(BaseModel):
    repair_cost: Decimal

    is_pass: bool = True


# =========================================================
# RESPONSE
# =========================================================
class MaintenanceResponse(BaseModel):
    id: int

    apartment_id: int

    reporter_name: str
    phone: str

    issue_description: str

    priority: str
    status: str

    repair_cost: Decimal

    assigned_staff_id: int | None

    created_at: datetime
    resolved_at: datetime | None

    image_url: str | None

    tenant_id: int | None

    room_number: str | None = None
    building_name: str | None = None
    assigned_staff_name: str | None = None
    assigned_staff_phone: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )