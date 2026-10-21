from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from decimal import Decimal


class ReceiveDepositRequest(BaseModel):
    amount: Decimal


class SettleDepositRequest(BaseModel):
    deduction_amount: Decimal = Decimal("0")
    deduction_reason: str | None = None


class DepositResponse(BaseModel):
    id: int
    contract_id: int

    amount: Decimal
    paid_date: date | None

    status: str

    refund_amount: Decimal
    deduction_amount: Decimal
    deduction_reason: str | None

    handled_by: int | None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class DepositSettlementPreviewRequest(BaseModel):
    deduction_amount: Decimal = Decimal("0")


class DepositSettlementDetailResponse(BaseModel):
    contract_id: int
    deposit_amount: Decimal
    damage_deduction: Decimal
    debt_deduction: Decimal
    actual_refund: Decimal
    remaining_unpaid_debt: Decimal
    status: str
    message: str