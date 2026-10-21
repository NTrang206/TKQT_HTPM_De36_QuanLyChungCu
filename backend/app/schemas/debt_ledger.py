from pydantic import (
    BaseModel,
    ConfigDict
)

from datetime import datetime
from decimal import Decimal


class DebtLedgerResponse(BaseModel):
    id: int
    tenant_id: int

    tenant_name: str | None = None
    tenant_phone: str | None = None

    total_receivable: Decimal
    total_paid: Decimal
    current_debt: Decimal

    last_updated: datetime

    model_config = ConfigDict(
        from_attributes=True
    )