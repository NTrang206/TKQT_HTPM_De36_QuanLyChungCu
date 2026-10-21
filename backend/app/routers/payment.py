from datetime import datetime
from uuid import uuid4
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tenant import Tenant
from app.models.payment import Payment
from app.models.receivable import Receivable
from app.models.contract import Contract
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.dependencies.auth import require_roles, get_current_user
from app.services.debt_service import recalculate_debt

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

VALID_PAYMENT_METHODS = [
    "CASH",
    "BANK_TRANSFER",
    "MOMO",
    "VNPAY",
    "DEPOSIT_OFFSET"
]


def generate_cash_transaction_code() -> str:
    today = datetime.now().strftime("%Y%m%d")
    random_code = uuid4().hex[:6].upper()
    return f"PT-{today}-{random_code}"


@router.post("", response_model=PaymentResponse)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    receivable = db.query(Receivable).filter(
        Receivable.id == data.receivable_id
    ).first()

    if not receivable:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoản phải thu")

    if receivable.status == "PAID":
        raise HTTPException(status_code=400, detail="Khoản phải thu này đã được thanh toán đủ")

    if data.amount <= Decimal("0"):
        raise HTTPException(status_code=400, detail="Số tiền thanh toán phải lớn hơn 0")

    remaining_due = receivable.total_amount - receivable.paid_amount
    if data.amount > remaining_due:
        raise HTTPException(
            status_code=400,
            detail=f"Số tiền nộp ({data.amount:,.0f}) vượt quá số nợ còn lại ({remaining_due:,.0f} VNĐ)"
        )

    if data.payment_method not in VALID_PAYMENT_METHODS:
        raise HTTPException(status_code=400, detail="Phương thức thanh toán không hợp lệ")

    transaction_code = data.transaction_code
    if data.payment_method in ["BANK_TRANSFER", "MOMO", "VNPAY"]:
        if not transaction_code:
            raise HTTPException(
                status_code=400,
                detail="Thanh toán chuyển khoản/ví điện tử bắt buộc phải có mã giao dịch ngân hàng"
            )
    else:
        if not transaction_code:
            transaction_code = generate_cash_transaction_code()

    existing_transaction = db.query(Payment).filter(
        Payment.transaction_code == transaction_code
    ).first()
    if existing_transaction:
        raise HTTPException(status_code=400, detail="Mã giao dịch này đã tồn tại trong hệ thống")

    payment = Payment(
        receivable_id=data.receivable_id,
        amount=data.amount,
        payment_method=data.payment_method,
        transaction_code=transaction_code,
        note=data.note,
        handled_by=current_user.id
    )

    try:
        db.add(payment)
        receivable.paid_amount = receivable.paid_amount + data.amount

        # Cập nhật chuẩn SRS: PARTIALLY_PAID thay vì PARTIAL
        if receivable.total_amount - receivable.paid_amount == Decimal("0"):
            receivable.status = "PAID"
        else:
            receivable.status = "PARTIALLY_PAID"

        db.commit()
        db.refresh(payment)

        # Đồng bộ sổ nợ cư dân
        contract = db.query(Contract).filter(Contract.id == receivable.contract_id).first()
        if contract:
            recalculate_debt(contract.tenant_id, db)

        return payment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu giao dịch thanh toán: {str(e)}")


@router.get("", response_model=List[PaymentResponse])
def get_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT", "STAFF"))
):
    return db.query(Payment).order_by(Payment.id.desc()).all()


@router.get("/my", response_model=List[PaymentResponse])
def get_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TENANT"))
):
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ khách thuê")

    return (
        db.query(Payment)
        .join(Receivable, Payment.receivable_id == Receivable.id)
        .join(Contract, Receivable.contract_id == Contract.id)
        .filter(Contract.tenant_id == tenant.id)
        .order_by(Payment.id.desc())
        .all()
    )


@router.get("/{payment_id}/receipt")
def export_receipt(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch thanh toán")

    receivable = db.query(Receivable).filter(Receivable.id == payment.receivable_id).first()
    contract = db.query(Contract).filter(Contract.id == receivable.contract_id).first() if receivable else None

    # IDOR Check: TENANT chỉ được xem biên lai của mình
    if current_user.role.role_code == "TENANT":
        tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not tenant or not contract or contract.tenant_id != tenant.id:
            raise HTTPException(status_code=403, detail="Không có quyền xem biên lai của cư dân khác")

    receipt = (
        f"----------------------------------------\n"
        f"       PHIẾU THU TIỀN CĂN HỘ DWELL      \n"
        f"----------------------------------------\n"
        f"Mã phiếu thu: #{payment.id}\n"
        f"Mã hợp đồng: {contract.contract_code if contract else 'N/A'}\n"
        f"Khoản thu: #{payment.receivable_id} (Kỳ {receivable.billing_month}/{receivable.billing_year})\n"
        f"Số tiền đã nộp: {payment.amount:,.0f} VNĐ\n"
        f"Phương thức: {payment.payment_method}\n"
        f"Mã giao dịch: {payment.transaction_code or 'Không có'}\n"
        f"Ngày thanh toán: {payment.payment_date.strftime('%d/%m/%Y %H:%M:%S')}\n"
        f"Ghi chú: {payment.note or 'Không có'}\n"
        f"----------------------------------------"
    )

    return {"receipt": receipt, "payment_id": payment.id}