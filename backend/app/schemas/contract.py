from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from decimal import Decimal


# ==========================================
# LẬP HỢP ĐỒNG TRỰC TIẾP
# Không cần Booking
# ==========================================
class ContractCreate(BaseModel):
    apartment_id: int
    tenant_id: int

    start_date: date
    end_date: date

    rental_price: Decimal
    deposit_amount: Decimal


# ==========================================
# CHUYỂN BOOKING THÀNH CONTRACT
# ==========================================
class BookingToContractRequest(BaseModel):
    citizen_id: str
    hometown: str | None = None

    start_date: date
    end_date: date

    rental_price: Decimal
    deposit_amount: Decimal


# ==========================================
# RESPONSE
# ==========================================
class ContractResponse(BaseModel):
    id: int
    contract_code: str

    apartment_id: int
    tenant_id: int

    tenant_name: str | None = None
    tenant_phone: str | None = None
    tenant_citizen_id: str | None = None
    tenant_email: str | None = None
    room_number: str | None = None
    building_name: str | None = None

    start_date: date
    end_date: date

    rental_price: Decimal
    deposit_amount: Decimal

    status: str

    created_by: int
    approved_by: int | None

    booking_id: int | None

    ai_summary: str | None = None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
class ContractRenewRequest(BaseModel):
    new_start_date: date
    new_end_date: date

    rental_price: Decimal
    deposit_amount: Decimal


class TerminateContractRequest(BaseModel):
    needs_maintenance: bool = False