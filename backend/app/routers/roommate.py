from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.roommate import Roommate
from app.models.tenant import Tenant
from app.models.apartment import Apartment
from app.models.user import User
from app.models.contract import Contract
from app.models.apartment import Apartment

from app.schemas.roommate import (
    RoommateCreate,
    RoommateUpdate,
    RoommateResponse
)

from app.dependencies.auth import require_roles


router = APIRouter(
    prefix="/roommates",
    tags=["Roommates"]
)


# =========================
# THÊM NGƯỜI Ở CÙNG
# =========================
@router.post(
    "",
    response_model=RoommateResponse
)
def create_roommate(
    data: RoommateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "STAFF"
        )
    )
):

    # 1. Kiểm tra Tenant
    tenant = db.query(Tenant).filter(
        Tenant.id == data.tenant_id
    ).first()

    if tenant is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khách thuê"
        )

    # 2. Kiểm tra Apartment
    apartment = db.query(Apartment).filter(
        Apartment.id == data.apartment_id
    ).first()

    if apartment is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy căn hộ"
        )

    # 3. Kiểm tra Tenant có hợp đồng ACTIVE
    # tại đúng căn hộ này không
    active_contract = db.query(Contract).filter(
        Contract.tenant_id == data.tenant_id,
        Contract.apartment_id == data.apartment_id,
        Contract.status == "ACTIVE"
    ).first()

    if active_contract is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Khách thuê không có hợp đồng ACTIVE "
                "tại căn hộ này"
            )
        )

    # 4. Đếm số roommate hiện tại
    roommate_count = db.query(Roommate).filter(
        Roommate.apartment_id == data.apartment_id
    ).count()

    # Tenant đại diện cũng được tính là 1 người
    current_occupants = 1 + roommate_count

    # 5. Kiểm tra giới hạn số người
    if current_occupants >= apartment.max_occupants:
        raise HTTPException(
            status_code=400,
            detail="Căn hộ đã đạt số người ở tối đa"
        )

    # 6. Tạo Roommate
    roommate = Roommate(
        tenant_id=data.tenant_id,
        apartment_id=data.apartment_id,
        full_name=data.full_name,
        citizen_id=data.citizen_id,
        phone=data.phone,
        relationship=data.relationship
    )

    try:
        db.add(roommate)
        db.commit()
        db.refresh(roommate)
        return roommate
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi thêm người ở cùng: {str(e)}"
        )


# =========================
# DANH SÁCH NGƯỜI Ở CÙNG CỦA TÔI (TENANT PORTAL)
# =========================
@router.get(
    "/my",
    response_model=list[RoommateResponse]
)
def get_my_roommates(
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

    return db.query(Roommate).filter(
        Roommate.tenant_id == tenant.id
    ).all()


# =========================
# DANH SÁCH NGƯỜI Ở CÙNG
# CỦA MỘT KHÁCH THUÊ
# =========================
@router.get(
    "/tenant/{tenant_id}",
    response_model=list[RoommateResponse]
)
def get_roommates_by_tenant(
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

    roommates = db.query(Roommate).filter(
        Roommate.tenant_id == tenant_id
    ).all()

    return roommates


# =========================
# XEM CHI TIẾT
# =========================
@router.get(
    "/{roommate_id}",
    response_model=RoommateResponse
)
def get_roommate(
    roommate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "STAFF",
            "ACCOUNTANT"
        )
    )
):

    roommate = db.query(Roommate).filter(
        Roommate.id == roommate_id
    ).first()

    if roommate is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người ở cùng"
        )

    return roommate


# =========================
# CẬP NHẬT
# =========================
@router.put(
    "/{roommate_id}",
    response_model=RoommateResponse
)
def update_roommate(
    roommate_id: int,
    data: RoommateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "STAFF")
    )
):

    roommate = db.query(Roommate).filter(
        Roommate.id == roommate_id
    ).first()

    if roommate is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người ở cùng"
        )

    tenant = db.query(Tenant).filter(
        Tenant.id == data.tenant_id
    ).first()

    if tenant is None:
        raise HTTPException(
            status_code=404,
            detail="Khách thuê không tồn tại"
        )

    apartment = db.query(Apartment).filter(
        Apartment.id == data.apartment_id
    ).first()

    if apartment is None:
        raise HTTPException(
            status_code=404,
            detail="Căn hộ không tồn tại"
        )

    roommate.tenant_id = data.tenant_id
    roommate.apartment_id = data.apartment_id
    roommate.full_name = data.full_name
    roommate.citizen_id = data.citizen_id
    roommate.phone = data.phone
    roommate.relationship = data.relationship

    try:
        db.commit()
        db.refresh(roommate)
        return roommate
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật người ở cùng: {str(e)}")


# =========================
# XÓA
# =========================
@router.delete("/{roommate_id}")
def delete_roommate(
    roommate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    roommate = db.query(Roommate).filter(
        Roommate.id == roommate_id
    ).first()

    if roommate is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người ở cùng"
        )

    try:
        db.delete(roommate)
        db.commit()
        return {
            "message": "Xóa người ở cùng thành công"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa người ở cùng: {str(e)}")