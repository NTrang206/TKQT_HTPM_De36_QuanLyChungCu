from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.maintenance_request import MaintenanceRequest
from app.models.tenant import Tenant
from app.models.apartment import Apartment
from app.models.contract import Contract
from app.models.user import User
from app.schemas.maintenance_request import (
    MaintenanceCreate,
    TenantMaintenanceCreate,
    AssignStaffRequest,
    CompleteMaintenanceRequest,
    MaintenanceResponse
)
from app.dependencies.auth import require_roles, get_current_user
from app.services.maintenance_service import (
    create_maintenance_request as create_maintenance_service,
    assign_maintenance_staff as assign_maintenance_service,
    complete_maintenance as complete_maintenance_service
)

router = APIRouter(
    prefix="/maintenance-requests",
    tags=["Maintenance Requests"]
)


@router.post("", response_model=MaintenanceResponse)
def create_maintenance_request(
    data: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    return create_maintenance_service(data, data.tenant_id, db)


@router.post("/my", response_model=MaintenanceResponse)
def create_my_maintenance_request(
    data: TenantMaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TENANT"))
):
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ khách thuê")

    # Kiểm tra căn hộ này có thuộc hợp đồng ACTIVE của cư dân không
    active_contract = db.query(Contract).filter(
        Contract.tenant_id == tenant.id,
        Contract.apartment_id == data.apartment_id,
        Contract.status == "ACTIVE"
    ).first()
    if not active_contract:
        raise HTTPException(
            status_code=403,
            detail="Bạn chỉ có thể gửi báo hỏng cho căn hộ đang có hợp đồng thuê hiệu lực của mình"
        )

    create_data = MaintenanceCreate(
        apartment_id=data.apartment_id,
        reporter_name=tenant.full_name,
        phone=tenant.phone,
        issue_description=data.issue_description,
        priority=data.priority,
        image_url=data.image_url,
        tenant_id=tenant.id
    )
    return create_maintenance_service(create_data, tenant.id, db)


@router.get("", response_model=List[MaintenanceResponse])
def get_maintenance_requests(
    status: Optional[str] = Query(None, description="Lọc theo trạng thái"),
    priority: Optional[str] = Query(None, description="Lọc theo mức độ ưu tiên"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT", "TENANT"))
):
    query = db.query(MaintenanceRequest)
    if current_user.role and current_user.role.role_code == "TENANT":
        tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not tenant:
            return []
        query = query.filter(MaintenanceRequest.tenant_id == tenant.id)
    if status:
        query = query.filter(MaintenanceRequest.status == status)
    if priority:
        query = query.filter(MaintenanceRequest.priority == priority)
    return query.order_by(MaintenanceRequest.id.desc()).all()


@router.get("/my", response_model=List[MaintenanceResponse])
def get_my_maintenance_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TENANT"))
):
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ khách thuê")

    return db.query(MaintenanceRequest).filter(
        MaintenanceRequest.tenant_id == tenant.id
    ).order_by(MaintenanceRequest.id.desc()).all()


@router.get("/{request_id}", response_model=MaintenanceResponse)
def get_maintenance_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == request_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu bảo trì")

    # IDOR Check: Cư dân chỉ được xem ticket do mình gửi
    if current_user.role.role_code == "TENANT":
        tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not tenant or req.tenant_id != tenant.id:
            raise HTTPException(status_code=403, detail="Không có quyền xem yêu cầu bảo trì của cư dân khác")

    return req


@router.patch("/{request_id}/assign", response_model=MaintenanceResponse)
def assign_staff(
    request_id: int,
    data: AssignStaffRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    return assign_maintenance_service(request_id, data, db)


@router.patch("/{request_id}/complete", response_model=MaintenanceResponse)
def complete_request(
    request_id: int,
    data: CompleteMaintenanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    return complete_maintenance_service(request_id, data, db)