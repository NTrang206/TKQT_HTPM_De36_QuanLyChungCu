from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.amenity import Amenity
from app.models.apartment import Apartment
from app.models.user import User

from app.schemas.amenity import (
    AmenityCreate,
    AmenityUpdate,
    AmenityResponse
)

from app.dependencies.auth import require_roles


router = APIRouter(
    prefix="/amenities",
    tags=["Amenities"]
)


VALID_CONDITIONS = [
    "GOOD",
    "DAMAGED",
    "REPAIRED"
]


# =========================
# THÊM TIỆN ÍCH
# =========================
@router.post(
    "",
    response_model=AmenityResponse
)
def create_amenity(
    data: AmenityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "STAFF")
    )
):

    # Kiểm tra căn hộ tồn tại
    apartment = db.query(Apartment).filter(
        Apartment.id == data.apartment_id
    ).first()

    if apartment is None:
        raise HTTPException(
            status_code=404,
            detail="Căn hộ không tồn tại"
        )

    # Kiểm tra trạng thái thiết bị
    if data.condition_status not in VALID_CONDITIONS:
        raise HTTPException(
            status_code=400,
            detail="Tình trạng thiết bị không hợp lệ"
        )

    # Kiểm tra trùng serial number
    if data.serial_number:
        existing = db.query(Amenity).filter(
            Amenity.serial_number == data.serial_number
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Thiết bị với số serial này đã tồn tại"
            )

    # Tạo tiện ích
    amenity = Amenity(
        apartment_id=data.apartment_id,
        name=data.name,
        brand=data.brand,
        serial_number=data.serial_number,
        condition_status=data.condition_status
    )

    db.add(amenity)
    db.commit()
    db.refresh(amenity)

    return amenity


# =========================
# LẤY TIỆN ÍCH THEO CĂN HỘ
# =========================
@router.get(
    "/apartment/{apartment_id}",
    response_model=list[AmenityResponse]
)
def get_amenities_by_apartment(
    apartment_id: int,
    db: Session = Depends(get_db)
):

    apartment = db.query(Apartment).filter(
        Apartment.id == apartment_id
    ).first()

    if apartment is None:
        raise HTTPException(
            status_code=404,
            detail="Căn hộ không tồn tại"
        )

    amenities = db.query(Amenity).filter(
        Amenity.apartment_id == apartment_id
    ).all()

    return amenities


# =========================
# XEM CHI TIẾT TIỆN ÍCH
# =========================
@router.get(
    "/{amenity_id}",
    response_model=AmenityResponse
)
def get_amenity(
    amenity_id: int,
    db: Session = Depends(get_db)
):

    amenity = db.query(Amenity).filter(
        Amenity.id == amenity_id
    ).first()

    if amenity is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tiện ích"
        )

    return amenity


# =========================
# CẬP NHẬT TIỆN ÍCH
# =========================
@router.put(
    "/{amenity_id}",
    response_model=AmenityResponse
)
def update_amenity(
    amenity_id: int,
    data: AmenityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "STAFF")
    )
):

    amenity = db.query(Amenity).filter(
        Amenity.id == amenity_id
    ).first()

    if amenity is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tiện ích"
        )

    # Kiểm tra căn hộ
    apartment = db.query(Apartment).filter(
        Apartment.id == data.apartment_id
    ).first()

    if apartment is None:
        raise HTTPException(
            status_code=404,
            detail="Căn hộ không tồn tại"
        )

    # Kiểm tra trạng thái
    if data.condition_status not in VALID_CONDITIONS:
        raise HTTPException(
            status_code=400,
            detail="Tình trạng thiết bị không hợp lệ"
        )

    # Kiểm tra serial bị trùng với thiết bị khác
    if data.serial_number:
        duplicate = db.query(Amenity).filter(
            Amenity.serial_number == data.serial_number,
            Amenity.id != amenity_id
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=400,
                detail="Thiết bị với số serial này đã tồn tại"
            )

    amenity.apartment_id = data.apartment_id
    amenity.name = data.name
    amenity.brand = data.brand
    amenity.serial_number = data.serial_number
    amenity.condition_status = data.condition_status

    db.commit()
    db.refresh(amenity)

    return amenity


# =========================
# CẬP NHẬT TÌNH TRẠNG THIẾT BỊ
# =========================
@router.patch(
    "/{amenity_id}/condition",
    response_model=AmenityResponse
)
def update_condition(
    amenity_id: int,
    condition_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "STAFF")
    )
):

    amenity = db.query(Amenity).filter(
        Amenity.id == amenity_id
    ).first()

    if amenity is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tiện ích"
        )

    if condition_status not in VALID_CONDITIONS:
        raise HTTPException(
            status_code=400,
            detail="Tình trạng thiết bị không hợp lệ"
        )

    amenity.condition_status = condition_status

    db.commit()
    db.refresh(amenity)

    return amenity


# =========================
# XÓA TIỆN ÍCH
# =========================
@router.delete("/{amenity_id}")
def delete_amenity(
    amenity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    amenity = db.query(Amenity).filter(
        Amenity.id == amenity_id
    ).first()

    if amenity is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tiện ích"
        )

    db.delete(amenity)
    db.commit()

    return {
        "message": "Xóa tiện ích thành công"
    }