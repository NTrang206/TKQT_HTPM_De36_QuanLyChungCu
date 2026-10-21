import urllib.parse
from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.contract import Contract
from app.models.receivable import Receivable
from app.services.debt_service import recalculate_debt
from app.core.config import settings
from app.schemas.billing import MonthlyBillingResponse, VietQRDataResponse


def generate_monthly_receivables(
    month: int,
    year: int,
    due_day: int = 10,
    default_service_fee: Decimal = Decimal("150000"),
    db: Session = None
) -> MonthlyBillingResponse:
    """
    Billing Engine quét tất cả hợp đồng ACTIVE và tự động sinh hóa đơn tiền phòng/dịch vụ định kỳ.
    Đồng bộ công nợ debt_ledger tự động (FR-16).
    """
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Tháng phải từ 1 đến 12")
    if due_day < 1 or due_day > 28:
        due_day = 10

    active_contracts = db.query(Contract).filter(
        Contract.status == "ACTIVE"
    ).all()

    created_count = 0
    skipped_count = 0
    total_billed = Decimal("0")
    due_date = date(year, month, due_day)

    try:
        for contract in active_contracts:
            # Kiểm tra xem khoản thu tháng này đã sinh chưa
            existing = db.query(Receivable).filter(
                Receivable.contract_id == contract.id,
                Receivable.billing_month == month,
                Receivable.billing_year == year
            ).first()

            if existing:
                skipped_count += 1
                continue

            room_amount = Decimal(str(contract.rental_price))
            service_amount = default_service_fee
            total_amount = room_amount + service_amount

            rec = Receivable(
                contract_id=contract.id,
                apartment_id=contract.apartment_id,
                billing_month=month,
                billing_year=year,
                room_amount=room_amount,
                service_amount=service_amount,
                total_amount=total_amount,
                paid_amount=Decimal("0"),
                status="UNPAID",
                due_date=due_date
            )
            db.add(rec)
            db.flush()

            # Đồng bộ ngay vào sổ nợ của cư dân
            recalculate_debt(contract.tenant_id, db)

            created_count += 1
            total_billed += total_amount

        db.commit()

        return MonthlyBillingResponse(
            billing_month=month,
            billing_year=year,
            total_active_contracts=len(active_contracts),
            created_receivables_count=created_count,
            skipped_existing_count=skipped_count,
            total_billed_amount=total_billed,
            message=(
                f"Đã chạy Billing Engine tháng {month}/{year}: Tạo mới {created_count} hóa đơn "
                f"({total_billed:,.0f} VNĐ), Bỏ qua {skipped_count} căn đã có hóa đơn."
            )
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi thực hiện quét sinh hóa đơn tự động: {str(e)}"
        )


def generate_vietqr_data(
    receivable_id: int,
    db: Session
) -> VietQRDataResponse:
    """
    Sinh mã và URL VietQR Napas247 động gắn kèm thông tin số tiền và nội dung chuyển khoản (FR-33).
    """
    rec = db.query(Receivable).filter(Receivable.id == receivable_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoản thu")

    contract = db.query(Contract).filter(Contract.id == rec.contract_id).first()
    contract_code = contract.contract_code if contract else f"HD{rec.contract_id}"

    remaining_amount = rec.total_amount - rec.paid_amount
    if remaining_amount <= Decimal("0"):
        amount_to_pay = Decimal("0")
    else:
        amount_to_pay = remaining_amount

    # Cú pháp nội dung: THANH TOAN TIEN PHONG {MA_HD} THANG {M} {Y}
    transfer_content = f"DWELL TT {contract_code} T{rec.billing_month} {rec.billing_year}"
    encoded_content = urllib.parse.quote(transfer_content)
    encoded_account_name = urllib.parse.quote(settings.VIETQR_ACCOUNT_NAME)

    qr_url = (
        f"https://img.vietqr.io/image/{settings.VIETQR_BANK_ID}-{settings.VIETQR_ACCOUNT_NO}-compact2.png"
        f"?amount={int(amount_to_pay)}&addInfo={encoded_content}&accountName={encoded_account_name}"
    )

    return VietQRDataResponse(
        receivable_id=rec.id,
        bank_id=settings.VIETQR_BANK_ID,
        account_no=settings.VIETQR_ACCOUNT_NO,
        account_name=settings.VIETQR_ACCOUNT_NAME,
        amount=amount_to_pay,
        transfer_content=transfer_content,
        qr_quick_url=qr_url
    )
