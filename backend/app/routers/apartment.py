from typing import Optional, List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.apartment import (
    ApartmentCreate,
    ApartmentUpdate,
    ApartmentResponse
)
from app.dependencies.auth import require_roles
from app.services.apartment_service import (
    get_apartments as get_apartments_service,
    get_apartment_by_id,
    create_apartment as create_apartment_service,
    update_apartment as update_apartment_service
)

router = APIRouter(
    prefix="/apartments",
    tags=["Apartments"]
)


@router.post("", response_model=ApartmentResponse)
def create_apartment(
    data: ApartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    return create_apartment_service(data, db)


@router.get("", response_model=List[ApartmentResponse])
def get_apartments(
    building_id: Optional[int] = Query(None, description="Lọc theo mã tòa nhà"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái phòng"),
    min_price: Optional[Decimal] = Query(None, description="Giá thuê tối thiểu"),
    max_price: Optional[Decimal] = Query(None, description="Giá thuê tối đa"),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách căn hộ kèm bộ lọc linh hoạt (FR-04, FR-30).
    Phục vụ cả khách xem phòng online và ban quản lý.
    """
    return get_apartments_service(
        db=db,
        building_id=building_id,
        status=status,
        min_price=min_price,
        max_price=max_price
    )


@router.get("/{apartment_id}", response_model=ApartmentResponse)
def get_apartment(
    apartment_id: int,
    db: Session = Depends(get_db)
):
    return get_apartment_by_id(apartment_id, db)


@router.put("/{apartment_id}", response_model=ApartmentResponse)
def update_apartment(
    apartment_id: int,
    data: ApartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    return update_apartment_service(apartment_id, data, db)


@router.delete("/{apartment_id}")
def delete_apartment(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    apt = get_apartment_by_id(apartment_id, db)
    try:
        db.delete(apt)
        db.commit()
        return {"message": "Xóa căn hộ thành công"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa căn hộ: {str(e)}")