from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.contract import Contract
from app.models.apartment import Apartment
from app.models.deposit import Deposit
from app.models.receivable import Receivable
from app.models.payment import Payment
from app.services.debt_service import recalculate_debt
from app.schemas.deposit import (
    ReceiveDepositRequest,
    SettleDepositRequest,
    DepositSettlementPreviewRequest,
    DepositSettlementDetailResponse
)


def receive_deposit(
    contract_id: int,
    data: ReceiveDepositRequest,
    handled_by: int,
    db: Session
) -> Deposit:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    deposit = db.query(Deposit).filter(Deposit.contract_id == contract_id).first()
    if not deposit:
        deposit = Deposit(
            contract_id=contract_id,
            amount=data.amount,
            status="PENDING",
            refund_amount=0,
            deduction_amount=0
        )
        db.add(deposit)
        db.flush()

    if deposit.status == "HELD":
        raise HTTPException(
            status_code=400,
            detail="Tiền cọc của hợp đồng này đã được thu trước đó"
        )

    if data.amount != deposit.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Số tiền nộp ({data.amount}) phải đúng bằng tiền cọc hợp đồng ({deposit.amount})"
        )

    try:
        deposit.status = "HELD"
        deposit.paid_date = date.today()
        deposit.handled_by = handled_by
        db.commit()
        db.refresh(deposit)
        return deposit
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi ghi nhận thu cọc: {str(e)}"
        )


def preview_deposit_settlement(
    contract_id: int,
    data: DepositSettlementPreviewRequest,
    db: Session
) -> dict:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    deposit = db.query(Deposit).filter(Deposit.contract_id == contract_id).first()
    if not deposit:
        raise HTTPException(status_code=404, detail="Không tìm thấy tiền cọc")

    if deposit.status != "HELD":
        raise HTTPException(
            status_code=400,
            detail="Tiền cọc không ở trạng thái HELD (chưa thu hoặc đã thanh lý)"
        )

    if data.deduction_amount < Decimal("0"):
        raise HTTPException(status_code=400, detail="Tiền khấu trừ không hợp lệ")

    if data.deduction_amount > deposit.amount:
        raise HTTPException(
            status_code=400,
            detail="Tiền khấu trừ hư hại vượt quá tổng tiền cọc"
        )

    ledger = recalculate_debt(contract.tenant_id, db)
    current_debt = Decimal(str(ledger.current_debt))

    available_after_damage = deposit.amount - data.deduction_amount
    debt_deduction = min(current_debt, max(Decimal("0"), available_after_damage))
    estimated_refund = max(Decimal("0"), available_after_damage - debt_deduction)
    remaining_unpaid_debt = current_debt - debt_deduction

    return {
        "contract_id": contract.id,
        "deposit_amount": deposit.amount,
        "damage_deduction": data.deduction_amount,
        "debt_deduction": debt_deduction,
        "current_debt": current_debt,
        "estimated_refund": estimated_refund,
        "remaining_unpaid_debt": remaining_unpaid_debt
    }


def settle_deposit(
    contract_id: int,
    data: SettleDepositRequest,
    handled_by: int,
    db: Session
) -> DepositSettlementDetailResponse:
    """
    Quyết toán thanh lý cọc theo chuẩn UC002 (Cấn trừ nợ thực tế).
    Số hoàn thực tế = Tiền cọc - Khấu trừ hư hại - Cấn trừ nợ chưa trả.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    deposit = db.query(Deposit).filter(Deposit.contract_id == contract_id).first()
    if not deposit:
        raise HTTPException(status_code=404, detail="Không tìm thấy tiền cọc của hợp đồng")

    if deposit.status != "HELD":
        raise HTTPException(
            status_code=400,
            detail="Tiền cọc không ở trạng thái HELD để thực hiện thanh lý"
        )

    if data.deduction_amount < Decimal("0"):
        raise HTTPException(status_code=400, detail="Số tiền khấu trừ hư hại không được âm")

    if data.deduction_amount > deposit.amount:
        raise HTTPException(status_code=400, detail="Số tiền khấu trừ hư hại vượt quá tiền cọc")

    if data.deduction_amount > Decimal("0") and not data.deduction_reason:
        raise HTTPException(status_code=400, detail="Phải cung cấp lý do khấu trừ hư hại")

    ledger = recalculate_debt(contract.tenant_id, db)
    unpaid_debt = Decimal(str(ledger.current_debt))

    available_after_damage = deposit.amount - data.deduction_amount
    debt_deduction = min(unpaid_debt, max(Decimal("0"), available_after_damage))
    actual_refund = max(Decimal("0"), available_after_damage - debt_deduction)
    remaining_unpaid_debt = unpaid_debt - debt_deduction

    try:
        # Nếu có cấn trừ công nợ, tiến hành thanh toán tự động cho các khoản nợ quá hạn / chưa trả
        if debt_deduction > Decimal("0"):
            unpaid_receivables = db.query(Receivable).filter(
                Receivable.contract_id == contract.id,
                Receivable.status.in_(["UNPAID", "PARTIALLY_PAID", "OVERDUE", "PARTIAL"])
            ).order_by(Receivable.due_date.asc()).all()

            offset_left = debt_deduction
            for rec in unpaid_receivables:
                if offset_left <= Decimal("0"):
                    break
                needed = rec.total_amount - rec.paid_amount
                pay_amount = min(offset_left, needed)

                payment = Payment(
                    receivable_id=rec.id,
                    amount=pay_amount,
                    payment_method="DEPOSIT_OFFSET",
                    transaction_code=f"CANC-COC-{contract.contract_code}-{rec.id}",
                    note=f"Cấn trừ nợ từ tiền cọc hợp đồng {contract.contract_code}",
                    handled_by=handled_by
                )
                db.add(payment)

                rec.paid_amount = rec.paid_amount + pay_amount
                if rec.total_amount - rec.paid_amount == Decimal("0"):
                    rec.status = "PAID"
                else:
                    rec.status = "PARTIALLY_PAID"

                offset_left -= pay_amount

            # Cập nhật lại số dư công nợ sau khi cấn trừ
            recalculate_debt(contract.tenant_id, db)

        # Cập nhật thông tin bản ghi Deposit
        total_deduction = data.deduction_amount + debt_deduction
        reason_parts = []
        if data.deduction_amount > Decimal("0"):
            reason_parts.append(f"Khấu trừ hư hại tài sản: {data.deduction_reason} ({data.deduction_amount:,.0f} VNĐ)")
        if debt_deduction > Decimal("0"):
            reason_parts.append(f"Cấn trừ nợ tiền phòng/dịch vụ tồn đọng: {debt_deduction:,.0f} VNĐ")

        deposit.deduction_amount = total_deduction
        deposit.deduction_reason = " | ".join(reason_parts) if reason_parts else None
        deposit.refund_amount = actual_refund
        deposit.handled_by = handled_by
        deposit.status = "REFUNDED" if actual_refund > Decimal("0") else "DEDUCTED"

        contract.status = "TERMINATED"
        apt = db.query(Apartment).filter(Apartment.id == contract.apartment_id).first()
        if apt and apt.status == "OCCUPIED":
            apt.status = "AVAILABLE"

        db.commit()
        db.refresh(deposit)

        msg = (
            f"Thanh lý cọc thành công. Hoàn lại cho khách: {actual_refund:,.0f} VNĐ. "
            f"Đã cấn trừ công nợ: {debt_deduction:,.0f} VNĐ."
        )
        if remaining_unpaid_debt > Decimal("0"):
            msg += f" Khách thuê vẫn còn nợ chưa thanh toán hết: {remaining_unpaid_debt:,.0f} VNĐ."

        return DepositSettlementDetailResponse(
            contract_id=contract.id,
            deposit_amount=deposit.amount,
            damage_deduction=data.deduction_amount,
            debt_deduction=debt_deduction,
            actual_refund=actual_refund,
            remaining_unpaid_debt=remaining_unpaid_debt,
            status=deposit.status,
            message=msg
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi thực hiện quyết toán cọc: {str(e)}"
        )
