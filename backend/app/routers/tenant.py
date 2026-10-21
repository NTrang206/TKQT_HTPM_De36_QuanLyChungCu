from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tenant import Tenant
from app.models.contract import Contract
from app.models.roommate import Roommate
from app.models.maintenance_request import MaintenanceRequest
from app.models.user import User
from app.schemas.tenant import (
    TenantCreate,
    TenantUpdate,
    TenantResponse,
    TenantSummaryResponse
)
from app.dependencies.auth import require_roles, get_current_user
from app.services.debt_service import recalculate_debt

from app.models.role import Role
from app.utils.security import hash_password

router = APIRouter(
    prefix="/tenants",
    tags=["Tenants"]
)


def sync_users_and_tenants(db: Session) -> None:
    """
    Đồng bộ 2 chiều giữa bảng users (vai trò TENANT) và bảng tenants:
    1. Mọi tài khoản User có role TENANT đều phải có hồ sơ trong bảng tenants.
    2. Mọi hồ sơ Tenant đều được liên kết tài khoản User (role TENANT) để đăng nhập Portal.
    """
    tenant_role = db.query(Role).filter(Role.role_code == "TENANT").first()
    if not tenant_role:
        return

    changed = False

    # Chiều 1: User (TENANT) -> Tenant
    tenant_users = db.query(User).filter(User.role_id == tenant_role.id).all()
    for u in tenant_users:
        linked_tenant = db.query(Tenant).filter(Tenant.user_id == u.id).first()
        if not linked_tenant:
            # Tìm theo email, sđt hoặc họ tên
            linked_tenant = (
                db.query(Tenant)
                .filter(
                    (Tenant.user_id.is_(None))
                    & (
                        (Tenant.email == u.email)
                        | (Tenant.phone == u.phone)
                        | (Tenant.full_name == u.full_name)
                    )
                )
                .first()
            )
            if linked_tenant:
                linked_tenant.user_id = u.id
                if not linked_tenant.email and u.email:
                    linked_tenant.email = u.email
                if not linked_tenant.phone and u.phone:
                    linked_tenant.phone = u.phone
                changed = True
            else:
                # Tạo hồ sơ Tenant mới cho tài khoản User này
                auto_cccd = f"079206{u.id:06d}"
                while db.query(Tenant).filter(Tenant.citizen_id == auto_cccd).first():
                    auto_cccd = str(int(auto_cccd) + 1).zfill(12)
                new_t = Tenant(
                    full_name=u.full_name or u.username,
                    citizen_id=auto_cccd,
                    phone=u.phone or f"0900{u.id:06d}",
                    email=u.email or f"{u.username}@dwell.vn",
                    hometown="TP.HCM",
                    is_bad_debt=False,
                    user_id=u.id,
                )
                db.add(new_t)
                db.flush()
                changed = True
        else:
            # Đồng bộ thông tin email / full_name giữa User và Tenant
            if u.email and not linked_tenant.email:
                linked_tenant.email = u.email
                changed = True
            elif linked_tenant.email and not u.email:
                u.email = linked_tenant.email
                changed = True

    # Chiều 2: Tenant -> User (TENANT)
    unlinked_tenants = db.query(Tenant).filter(Tenant.user_id.is_(None)).all()
    for t in unlinked_tenants:
        base_uname = (
            t.email.split("@")[0].lower().replace(".", "_")
            if t.email and "@" in t.email
            else f"tenant_{t.id}"
        )
        uname = base_uname
        suffix = 1
        while db.query(User).filter(User.username == uname).first():
            uname = f"{base_uname}_{suffix}"
            suffix += 1

        email_val = t.email if t.email else f"{uname}@dwell.vn"
        if db.query(User).filter(User.email == email_val).first():
            email_val = f"{uname}_{t.id}@dwell.vn"

        if not t.email:
            t.email = email_val

        new_u = User(
            role_id=tenant_role.id,
            username=uname,
            password_hash=hash_password("tenant123"),
            full_name=t.full_name,
            email=email_val,
            phone=t.phone,
            is_active=True,
        )
        db.add(new_u)
        db.flush()
        t.user_id = new_u.id
        changed = True

    if changed:
        db.commit()


def _serialize_tenant(t: Tenant) -> TenantResponse:
    item = {
        "id": t.id,
        "full_name": t.full_name,
        "citizen_id": t.citizen_id,
        "phone": t.phone,
        "email": t.email or (t.user.email if t.user else None),
        "hometown": t.hometown,
        "is_bad_debt": t.is_bad_debt,
        "user_id": t.user_id,
        "username": t.user.username if t.user else None,
        "current_apartment_id": t.current_apartment_id,
        "current_room_number": t.current_room_number,
        "building_name": t.building_name,
        "roommates": [
            {
                "id": rm.id,
                "tenant_id": rm.tenant_id,
                "apartment_id": rm.apartment_id,
                "full_name": rm.full_name,
                "citizen_id": rm.citizen_id,
                "phone": rm.phone,
                "relationship": rm.relationship,
                "is_registered_temp": True,
            }
            for rm in t.roommates
        ],
        "emergency_contacts": [
            {
                "id": ec.id,
                "tenant_id": ec.tenant_id,
                "full_name": ec.full_name,
                "phone": ec.phone,
                "relationship": ec.relationship,
            }
            for ec in t.emergency_contacts
        ],
        "created_at": t.created_at,
    }
    return TenantResponse(**item)


@router.post("", response_model=TenantResponse)
def create_tenant(
    data: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    existing = db.query(Tenant).filter(Tenant.citizen_id == data.citizen_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Số CMND/CCCD đã tồn tại trên hệ thống")

    tenant = Tenant(
        full_name=data.full_name,
        citizen_id=data.citizen_id,
        phone=data.phone,
        email=data.email,
        hometown=data.hometown,
        is_bad_debt=False
    )
    try:
        db.add(tenant)
        db.commit()
        sync_users_and_tenants(db)
        db.refresh(tenant)
        return _serialize_tenant(tenant)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi thêm khách thuê: {str(e)}")


@router.get("", response_model=List[TenantResponse])
def get_tenants(
    search: Optional[str] = Query(None, description="Tìm theo tên, cccd, sđt, email hoặc tài khoản"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT", "TENANT"))
):
    sync_users_and_tenants(db)

    if current_user.role and current_user.role.role_code == "TENANT":
        my_tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        return [_serialize_tenant(my_tenant)] if my_tenant else []

    query = db.query(Tenant).outerjoin(User, Tenant.user_id == User.id)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Tenant.full_name.ilike(s)) |
            (Tenant.citizen_id.ilike(s)) |
            (Tenant.phone.ilike(s)) |
            (Tenant.email.ilike(s)) |
            (User.username.ilike(s))
        )
    tenants = query.order_by(Tenant.id.asc()).all()
    return [_serialize_tenant(t) for t in tenants]


@router.get("/me", response_model=TenantResponse)
def get_my_tenant_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TENANT"))
):
    sync_users_and_tenants(db)
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ khách thuê")
    return _serialize_tenant(tenant)


@router.get("/{tenant_id}/summary", response_model=TenantSummaryResponse)
def get_tenant_summary(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    [FR-10] Tổng hợp toàn diện hồ sơ cư dân: Hợp đồng đã/đang thuê, người ở cùng,
    công nợ hiện tại và lịch sử bảo trì trên một view duy nhất.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách thuê")

    # IDOR Check
    if current_user.role.role_code == "TENANT":
        my_tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not my_tenant or my_tenant.id != tenant.id:
            raise HTTPException(status_code=403, detail="Không có quyền truy cập hồ sơ của cư dân khác")

    ledger = recalculate_debt(tenant.id, db)
    contracts = db.query(Contract).filter(Contract.tenant_id == tenant.id).all()
    roommates_count = db.query(Roommate).filter(Roommate.tenant_id == tenant.id).count()
    maintenance_count = db.query(MaintenanceRequest).filter(MaintenanceRequest.tenant_id == tenant.id).count()

    active_contracts_info = [
        {
            "id": c.id,
            "contract_code": c.contract_code,
            "apartment_id": c.apartment_id,
            "status": c.status,
            "rental_price": float(c.rental_price),
            "start_date": str(c.start_date),
            "end_date": str(c.end_date)
        }
        for c in contracts if c.status == "ACTIVE"
    ]

    return TenantSummaryResponse(
        id=tenant.id,
        full_name=tenant.full_name,
        citizen_id=tenant.citizen_id,
        phone=tenant.phone,
        email=tenant.email,
        hometown=tenant.hometown,
        is_bad_debt=tenant.is_bad_debt,
        current_debt=Decimal(str(ledger.current_debt)),
        total_paid=Decimal(str(ledger.total_paid)),
        contracts_count=len(contracts),
        active_contracts=active_contracts_info,
        roommates_count=roommates_count,
        maintenance_requests_count=maintenance_count
    )


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách thuê")
    return tenant


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: int,
    data: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách thuê")

    duplicate = db.query(Tenant).filter(
        Tenant.citizen_id == data.citizen_id,
        Tenant.id != tenant_id
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Số CMND/CCCD đã thuộc về khách thuê khác")

    tenant.full_name = data.full_name
    tenant.citizen_id = data.citizen_id
    tenant.phone = data.phone
    tenant.email = data.email
    tenant.hometown = data.hometown
    tenant.is_bad_debt = data.is_bad_debt

    try:
        db.commit()
        db.refresh(tenant)
        return tenant
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật khách thuê: {str(e)}")


@router.delete("/{tenant_id}")
def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách thuê")

    try:
        db.delete(tenant)
        db.commit()
        return {"message": "Xóa khách thuê thành công"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa khách thuê: {str(e)}")
