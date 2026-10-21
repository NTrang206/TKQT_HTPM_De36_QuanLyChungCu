import random
import string
from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.contract import Contract
from app.models.apartment import Apartment
from app.models.tenant import Tenant
from app.models.deposit import Deposit
from app.models.booking import Booking
from app.schemas.contract import (
    ContractCreate,
    ContractRenewRequest,
    BookingToContractRequest
)


def generate_contract_code(db: Session) -> str:
    while True:
        random_suffix = "".join(
            random.choices(string.digits, k=6)
        )
        code = f"HD-{random_suffix}"
        exists = db.query(Contract).filter(
            Contract.contract_code == code
        ).first()
        if not exists:
            return code


def has_schedule_conflict(
    apartment_id: int,
    start_date: date,
    end_date: date,
    db: Session,
    exclude_contract_id: Optional[int] = None
) -> bool:
    query = db.query(Contract).filter(
        Contract.apartment_id == apartment_id,
        Contract.status.in_(["ACTIVE", "DRAFT"]),
        Contract.start_date <= end_date,
        Contract.end_date >= start_date
    )
    if exclude_contract_id:
        query = query.filter(Contract.id != exclude_contract_id)
    return query.first() is not None


def create_contract(
    data: ContractCreate,
    created_by: int,
    db: Session
) -> Contract:
    if data.end_date <= data.start_date:
        raise HTTPException(
            status_code=400,
            detail="Ngày kết thúc hợp đồng phải sau ngày bắt đầu"
        )
    if data.rental_price <= Decimal("0"):
        raise HTTPException(
            status_code=400,
            detail="Giá thuê phải lớn hơn 0"
        )
    if data.deposit_amount < Decimal("0"):
        raise HTTPException(
            status_code=400,
            detail="Tiền đặt cọc không được âm"
        )

    apt = db.query(Apartment).filter(Apartment.id == data.apartment_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Không tìm thấy căn hộ")

    tenant = db.query(Tenant).filter(Tenant.id == data.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin khách thuê")

    if has_schedule_conflict(data.apartment_id, data.start_date, data.end_date, db):
        raise HTTPException(
            status_code=400,
            detail="Căn hộ này đã có hợp đồng hiệu lực hoặc dự thảo trong khoảng thời gian đã chọn"
        )

    contract_code = generate_contract_code(db)

    contract = Contract(
        contract_code=contract_code,
        apartment_id=data.apartment_id,
        tenant_id=data.tenant_id,
        start_date=data.start_date,
        end_date=data.end_date,
        rental_price=data.rental_price,
        deposit_amount=data.deposit_amount,
        status="DRAFT",
        created_by=created_by
    )

    try:
        db.add(contract)
        db.flush()

        deposit = Deposit(
            contract_id=contract.id,
            amount=data.deposit_amount,
            status="PENDING",
            refund_amount=0,
            deduction_amount=0
        )
        db.add(deposit)
        db.commit()
        db.refresh(contract)
        return contract
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi cơ sở dữ liệu khi tạo hợp đồng: {str(e)}"
        )


def activate_contract(
    contract_id: int,
    approved_by: int,
    db: Session
) -> Contract:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    if contract.status != "DRAFT":
        raise HTTPException(
            status_code=400,
            detail=f"Chỉ có thể duyệt hợp đồng đang ở trạng thái DRAFT. Trạng thái hiện tại: {contract.status}"
        )

    deposit = db.query(Deposit).filter(Deposit.contract_id == contract.id).first()
    if not deposit or deposit.status != "HELD":
        raise HTTPException(
            status_code=400,
            detail="Tiền cọc của hợp đồng chưa được thu (cần trạng thái HELD trước khi kích hoạt)"
        )

    apt = db.query(Apartment).filter(Apartment.id == contract.apartment_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Không tìm thấy căn hộ của hợp đồng")

    try:
        contract.status = "ACTIVE"
        contract.approved_by = approved_by
        apt.status = "OCCUPIED"

        db.commit()
        db.refresh(contract)
        return contract
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi kích hoạt hợp đồng: {str(e)}"
        )


def renew_contract(
    contract_id: int,
    data: ContractRenewRequest,
    created_by: int,
    db: Session
) -> Contract:
    old_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not old_contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng cũ")

    if old_contract.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="Chỉ hợp đồng đang ACTIVE mới có thể gia hạn"
        )

    if data.new_end_date <= data.new_start_date:
        raise HTTPException(
            status_code=400,
            detail="Ngày kết thúc mới phải sau ngày bắt đầu mới"
        )

    if has_schedule_conflict(
        old_contract.apartment_id,
        data.new_start_date,
        data.new_end_date,
        db,
        exclude_contract_id=old_contract.id
    ):
        raise HTTPException(
            status_code=400,
            detail="Khoảng thời gian gia hạn bị trùng với hợp đồng khác"
        )

    new_code = generate_contract_code(db)
    new_contract = Contract(
        contract_code=new_code,
        apartment_id=old_contract.apartment_id,
        tenant_id=old_contract.tenant_id,
        start_date=data.new_start_date,
        end_date=data.new_end_date,
        rental_price=data.rental_price,
        deposit_amount=data.deposit_amount,
        status="ACTIVE",
        created_by=created_by,
        approved_by=created_by
    )

    try:
        old_contract.status = "EXPIRED"
        db.add(new_contract)
        db.flush()

        new_deposit = Deposit(
            contract_id=new_contract.id,
            amount=data.deposit_amount,
            status="HELD",
            refund_amount=0,
            deduction_amount=0,
            handled_by=created_by
        )
        db.add(new_deposit)
        db.commit()
        db.refresh(new_contract)
        return new_contract
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi gia hạn hợp đồng: {str(e)}"
        )


def terminate_contract(
    contract_id: int,
    needs_maintenance: bool,
    db: Session
) -> Contract:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    if contract.status not in ["ACTIVE", "EXPIRED"]:
        raise HTTPException(
            status_code=400,
            detail="Chỉ có thể thanh lý hợp đồng đang ACTIVE hoặc EXPIRED"
        )

    apt = db.query(Apartment).filter(Apartment.id == contract.apartment_id).first()
    try:
        contract.status = "TERMINATED"
        if apt:
            apt.status = "MAINTENANCE" if needs_maintenance else "AVAILABLE"

        db.commit()
        db.refresh(contract)
        return contract
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi chấm dứt hợp đồng: {str(e)}"
        )


def create_contract_from_booking(
    booking_id: int,
    data: BookingToContractRequest,
    created_by: int,
    db: Session
) -> Contract:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn đặt phòng")

    if booking.status in ["CONVERTED", "CANCELLED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Đơn đặt phòng đang ở trạng thái {booking.status}, không thể chuyển hợp đồng"
        )

    tenant = db.query(Tenant).filter(Tenant.citizen_id == data.citizen_id).first()
    if not tenant:
        tenant = Tenant(
            full_name=booking.customer_name,
            citizen_id=data.citizen_id,
            phone=booking.customer_phone,
            email=booking.customer_email,
            hometown=data.hometown
        )
        db.add(tenant)
        db.flush()

    create_data = ContractCreate(
        apartment_id=booking.apartment_id,
        tenant_id=tenant.id,
        start_date=data.start_date,
        end_date=data.end_date,
        rental_price=data.rental_price,
        deposit_amount=data.deposit_amount
    )
    contract = create_contract(create_data, created_by, db)
    booking.status = "CONVERTED"
    contract.booking_id = booking.id
    db.commit()
    db.refresh(contract)
    return contract
