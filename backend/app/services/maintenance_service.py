from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.maintenance_request import MaintenanceRequest
from app.models.apartment import Apartment
from app.models.contract import Contract
from app.models.tenant import Tenant
from app.schemas.maintenance_request import (
    MaintenanceCreate,
    AssignStaffRequest,
    CompleteMaintenanceRequest
)


def create_maintenance_request(
    data: MaintenanceCreate,
    tenant_id: Optional[int],
    db: Session
) -> MaintenanceRequest:
    apt = db.query(Apartment).filter(Apartment.id == data.apartment_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Không tìm thấy căn hộ")

    req = MaintenanceRequest(
        apartment_id=data.apartment_id,
        reporter_name=data.reporter_name,
        phone=data.phone,
        issue_description=data.issue_description,
        priority=data.priority,
        status="PENDING",
        repair_cost=Decimal("0"),
        tenant_id=tenant_id or data.tenant_id,
        image_url=data.image_url
    )

    try:
        db.add(req)
        db.commit()
        db.refresh(req)
        return req
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi gửi yêu cầu bảo trì: {str(e)}"
        )


def assign_maintenance_staff(
    request_id: int,
    data: AssignStaffRequest,
    db: Session
) -> MaintenanceRequest:
    req = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == request_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu bảo trì")

    if req.status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể phân công yêu cầu đã ở trạng thái {req.status}"
        )

    try:
        req.assigned_staff_id = data.staff_id
        req.status = "PROCESSING"

        # Nếu sự cố khẩn cấp (HIGH, URGENT), tạm khóa căn hộ sang MAINTENANCE
        if req.priority in ["HIGH", "URGENT"]:
            apt = db.query(Apartment).filter(Apartment.id == req.apartment_id).first()
            if apt and apt.status != "OCCUPIED":
                apt.status = "MAINTENANCE"

        db.commit()
        db.refresh(req)
        return req
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi phân công nhân viên sửa chữa: {str(e)}"
        )


def complete_maintenance(
    request_id: int,
    data: CompleteMaintenanceRequest,
    db: Session
) -> MaintenanceRequest:
    req = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == request_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu bảo trì")

    if req.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Yêu cầu bảo trì này đã hoàn tất trước đó")

    try:
        req.status = "COMPLETED"
        req.repair_cost = data.repair_cost
        req.resolved_at = datetime.now()

        # Mở khóa phòng lại nếu đang MAINTENANCE
        apt = db.query(Apartment).filter(Apartment.id == req.apartment_id).first()
        if apt and apt.status == "MAINTENANCE":
            active_contract = db.query(Contract).filter(
                Contract.apartment_id == apt.id,
                Contract.status == "ACTIVE"
            ).first()
            apt.status = "OCCUPIED" if active_contract else "AVAILABLE"

        db.commit()
        db.refresh(req)
        return req
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi nghiệm thu hoàn tất bảo trì: {str(e)}"
        )
