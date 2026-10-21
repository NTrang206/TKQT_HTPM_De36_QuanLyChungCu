from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.billing import MonthlyBillingRequest, MonthlyBillingResponse, VietQRDataResponse
from app.dependencies.auth import require_roles
from app.services.billing_service import generate_monthly_receivables, generate_vietqr_data

router = APIRouter(
    prefix="/billing",
    tags=["Billing Engine"]
)


@router.post("/generate-monthly", response_model=MonthlyBillingResponse)
def run_monthly_billing(
    data: MonthlyBillingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    """
    [FR-16] Billing Engine: Quét toàn bộ hợp đồng ACTIVE và tự động sinh hóa đơn tiền phòng
    và dịch vụ định kỳ cho cả tòa nhà, đồng thời cập nhật sổ công nợ.
    """
    return generate_monthly_receivables(
        month=data.billing_month,
        year=data.billing_year,
        due_day=data.due_day or 10,
        default_service_fee=data.default_service_fee,
        db=db
    )


@router.get("/vietqr/{receivable_id}", response_model=VietQRDataResponse)
def get_vietqr(
    receivable_id: int,
    db: Session = Depends(get_db)
):
    """
    [FR-33] Sinh mã thanh toán nhanh VietQR Napas247 động gắn kèm số tiền và nội dung chuyển khoản.
    """
    return generate_vietqr_data(receivable_id, db)
