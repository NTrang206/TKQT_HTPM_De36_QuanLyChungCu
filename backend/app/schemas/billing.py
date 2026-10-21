from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal


class MonthlyBillingRequest(BaseModel):
    billing_month: int = Field(..., ge=1, le=12, description="Tháng tính tiền (1-12)")
    billing_year: int = Field(..., ge=2024, le=2050, description="Năm tính tiền")
    due_day: Optional[int] = Field(default=10, ge=1, le=28, description="Hạn nộp tiền ngày mấy trong tháng")
    default_service_fee: Optional[Decimal] = Field(default=Decimal("150000"), ge=0, description="Phí dịch vụ mặc định (VNĐ)")


class MonthlyBillingResponse(BaseModel):
    billing_month: int
    billing_year: int
    total_active_contracts: int
    created_receivables_count: int
    skipped_existing_count: int
    total_billed_amount: Decimal
    message: str


class VietQRDataResponse(BaseModel):
    receivable_id: int
    bank_id: str
    account_no: str
    account_name: str
    amount: Decimal
    transfer_content: str
    qr_quick_url: str
