from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.emergency_contact import EmergencyContact
from app.models.tenant import Tenant
from app.models.user import User

from app.schemas.emergency_contact import (
    EmergencyContactCreate,
    EmergencyContactUpdate,
    EmergencyContactResponse
)

from app.dependencies.auth import require_roles


router = APIRouter(
    prefix="/emergency-contacts",
    tags=["Emergency Contacts"]
)


# =========================
# THÊM LIÊN HỆ KHẨN CẤP
# =========================
@router.post(
    "",
    response_model=EmergencyContactResponse
)
def create_emergency_contact(
    data: EmergencyContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "STAFF")
    )
):

    tenant = db.query(Tenant).filter(
        Tenant.id == data.tenant_id
    ).first()

    if tenant is None:
        raise HTTPException(
            status_code=404,
            detail="Khách thuê không tồn tại"
        )

    contact = EmergencyContact(
        tenant_id=data.tenant_id,
        full_name=data.full_name,
        phone=data.phone,
        relationship=data.relationship
    )

    try:
        db.add(contact)
        db.commit()
        db.refresh(contact)
        return contact
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi thêm liên hệ khẩn cấp: {str(e)}")


# =========================
# LIÊN HỆ KHẨN CẤP CỦA TÔI (TENANT PORTAL)
# =========================
@router.get(
    "/my",
    response_model=list[EmergencyContactResponse]
)
def get_my_emergency_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("TENANT")
    )
):
    tenant = db.query(Tenant).filter(
        Tenant.user_id == current_user.id
    ).first()

    if tenant is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hồ sơ cư dân"
        )

    return db.query(EmergencyContact).filter(
        EmergencyContact.tenant_id == tenant.id
    ).all()


# =========================
# DANH SÁCH THEO KHÁCH THUÊ
# =========================
@router.get(
    "/tenant/{tenant_id}",
    response_model=list[EmergencyContactResponse]
)
def get_contacts_by_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "STAFF",
            "ACCOUNTANT"
        )
    )
):

    tenant = db.query(Tenant).filter(
        Tenant.id == tenant_id
    ).first()

    if tenant is None:
        raise HTTPException(
            status_code=404,
            detail="Khách thuê không tồn tại"
        )

    contacts = db.query(EmergencyContact).filter(
        EmergencyContact.tenant_id == tenant_id
    ).all()

    return contacts


# =========================
# XEM CHI TIẾT
# =========================
@router.get(
    "/{contact_id}",
    response_model=EmergencyContactResponse
)
def get_emergency_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "STAFF",
            "ACCOUNTANT"
        )
    )
):

    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id
    ).first()

    if contact is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người liên hệ"
        )

    return contact


# =========================
# CẬP NHẬT
# =========================
@router.put(
    "/{contact_id}",
    response_model=EmergencyContactResponse
)
def update_emergency_contact(
    contact_id: int,
    data: EmergencyContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "STAFF")
    )
):

    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id
    ).first()

    if contact is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người liên hệ"
        )

    contact.full_name = data.full_name
    contact.phone = data.phone
    contact.relationship = data.relationship

    try:
        db.commit()
        db.refresh(contact)
        return contact
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật liên hệ khẩn cấp: {str(e)}")


# =========================
# XÓA
# =========================
@router.delete("/{contact_id}")
def delete_emergency_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id
    ).first()

    if contact is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người liên hệ"
        )

    try:
        db.delete(contact)
        db.commit()
        return {
            "message": "Xóa người liên hệ khẩn cấp thành công"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa người liên hệ: {str(e)}")