from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from decimal import Decimal


class ReceivableCreate(BaseModel):
    contract_id: int
    billing_month: int
    billing_year: int
    service_amount: Decimal = Decimal("0")


class ReceivableResponse(BaseModel):
    id: int

    contract_id: int
    apartment_id: int

    tenant_id: int | None = None
    room_number: str | None = None
    building_name: str | None = None
    tenant_name: str | None = None
    tenant_phone: str | None = None

    billing_month: int
    billing_year: int

    room_amount: Decimal
    service_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal

    status: str
    due_date: date

    vietqr_url: str | None = None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )