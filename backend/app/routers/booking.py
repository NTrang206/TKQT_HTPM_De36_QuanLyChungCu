from typing import List, Optional
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.booking import Booking
from app.models.apartment import Apartment
from app.models.user import User
from app.schemas.booking import (
    BookingCreate,
    BookingResponse
)
from app.dependencies.auth import require_roles

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)

VALID_BOOKING_STATUSES = [
    "PENDING",
    "CONFIRMED",
    "CANCELLED",
    "CONVERTED"
]


def generate_booking_code(db: Session) -> str:
    while True:
        month = datetime.now().strftime("%Y%m")
        random_code = uuid4().hex[:4].upper()
        booking_code = f"BK-{month}-{random_code}"
        existing = db.query(Booking).filter(
            Booking.booking_code == booking_code
        ).first()
        if existing is None:
            return booking_code


@router.post("", response_model=BookingResponse)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db)
):
    apartment = db.query(Apartment).filter(
        Apartment.id == data.apartment_id
    ).first()

    if apartment is None:
        raise HTTPException(status_code=404, detail="Căn hộ không tồn tại")

    if apartment.status != "AVAILABLE":
        raise HTTPException(status_code=400, detail="Căn hộ hiện không còn trống để đặt")

    booking_code = generate_booking_code(db)

    booking = Booking(
        booking_code=booking_code,
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        customer_email=data.customer_email,
        apartment_id=data.apartment_id,
        check_in_date=data.check_in_date,
        deposit_amount=data.deposit_amount,
        status="PENDING",
        notes=data.notes
    )

    try:
        db.add(booking)
        apartment.status = "RESERVED"
        db.commit()
        db.refresh(booking)
        return booking
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo đơn giữ chỗ: {str(e)}")


@router.get("/lookup", response_model=List[BookingResponse])
def lookup_booking(
    code: Optional[str] = Query(None, description="Mã đặt phòng (VD: BK-202609-ABCD)"),
    phone: Optional[str] = Query(None, description="Số điện thoại khách hàng"),
    db: Session = Depends(get_db)
):
    """
    [UC011 / FR-31] Tra cứu công khai tiến độ xử lý đơn đặt phòng cho khách hàng.
    """
    if not code and not phone:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng cung cấp mã đặt phòng (code) hoặc số điện thoại (phone) để tra cứu"
        )
    query = db.query(Booking)
    if code:
        query = query.filter(Booking.booking_code == code.strip())
    if phone:
        query = query.filter(Booking.customer_phone == phone.strip())

    results = query.order_by(Booking.id.desc()).all()
    if not results:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn đặt phòng phù hợp")
    return results


@router.get("", response_model=List[BookingResponse])
def get_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    return db.query(Booking).order_by(Booking.id.desc()).all()


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy Booking")
    return booking


@router.patch("/{booking_id}/confirm", response_model=BookingResponse)
def confirm_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy Booking")

    if booking.status != "PENDING":
        raise HTTPException(status_code=400, detail="Booking không ở trạng thái chờ xác nhận")

    try:
        booking.status = "CONFIRMED"
        db.commit()
        db.refresh(booking)
        return booking
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi xác nhận Booking: {str(e)}")


@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy Booking")

    if booking.status == "CONVERTED":
        raise HTTPException(status_code=400, detail="Booking đã chuyển thành hợp đồng, không thể hủy")

    if booking.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Booking đã được hủy trước đó")

    try:
        apartment = db.query(Apartment).filter(Apartment.id == booking.apartment_id).first()
        booking.status = "CANCELLED"
        if apartment and apartment.status == "RESERVED":
            apartment.status = "AVAILABLE"

        db.commit()
        db.refresh(booking)
        return booking
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi hủy Booking: {str(e)}")