from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.apartment import Apartment
from app.models.building import Building
from app.schemas.apartment import ApartmentCreate, ApartmentUpdate


def get_apartments(
    db: Session,
    building_id: Optional[int] = None,
    status: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None
) -> List[Apartment]:
    query = db.query(Apartment)
    if building_id is not None:
        query = query.filter(Apartment.building_id == building_id)
    if status:
        query = query.filter(Apartment.status == status)
    if min_price is not None:
        query = query.filter(Apartment.price >= min_price)
    if max_price is not None:
        query = query.filter(Apartment.price <= max_price)
    return query.all()


def get_apartment_by_id(apartment_id: int, db: Session) -> Apartment:
    apt = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Không tìm thấy căn hộ")
    return apt


def create_apartment(data: ApartmentCreate, db: Session) -> Apartment:
    building = db.query(Building).filter(Building.id == data.building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Không tìm thấy tòa nhà")

    exists = db.query(Apartment).filter(
        Apartment.building_id == data.building_id,
        Apartment.room_number == data.room_number
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Số phòng này đã tồn tại trong tòa nhà")

    apt = Apartment(
        building_id=data.building_id,
        room_number=data.room_number,
        floor=data.floor,
        area_sqm=data.area_sqm,
        price=data.price,
        max_occupants=data.max_occupants,
        status=data.status
    )
    try:
        db.add(apt)
        building.total_apartments = (building.total_apartments or 0) + 1
        db.commit()
        db.refresh(apt)
        return apt
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi thêm căn hộ: {str(e)}")


def update_apartment(apartment_id: int, data: ApartmentUpdate, db: Session) -> Apartment:
    apt = get_apartment_by_id(apartment_id, db)
    apt.building_id = data.building_id
    apt.room_number = data.room_number
    apt.floor = data.floor
    apt.area_sqm = data.area_sqm
    apt.price = data.price
    apt.max_occupants = data.max_occupants
    apt.status = data.status
    try:
        db.commit()
        db.refresh(apt)
        return apt
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật căn hộ: {str(e)}")
