from datetime import date
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tenant import Tenant
from app.models.receivable import Receivable
from app.models.contract import Contract
from app.models.user import User
from app.schemas.receivable import ReceivableCreate, ReceivableResponse
from app.schemas.billing import VietQRDataResponse
from app.dependencies.auth import require_roles, get_current_user
from app.services.debt_service import recalculate_debt
from app.services.billing_service import generate_vietqr_data

router = APIRouter(
    prefix="/receivables",
    tags=["Receivables"]
)


def _enrich_receivable(rec: Receivable, db: Session) -> ReceivableResponse:
    res = ReceivableResponse.model_validate(rec)
    try:
        qr = generate_vietqr_data(rec.id, db)
        res.vietqr_url = qr.qr_quick_url
    except Exception:
        res.vietqr_url = None
    return res


@router.post("", response_model=ReceivableResponse)
def create_receivable(
    data: ReceivableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    if data.billing_month < 1 or data.billing_month > 12:
        raise HTTPException(status_code=400, detail="Tháng thu phải từ 1 đến 12")
    if data.billing_year < 2000:
        raise HTTPException(status_code=400, detail="Năm thu không hợp lệ")
    if data.service_amount < Decimal("0"):
        raise HTTPException(status_code=400, detail="Tiền dịch vụ không được nhỏ hơn 0")

    contract = db.query(Contract).filter(Contract.id == data.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")
    if contract.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Chỉ hợp đồng ACTIVE mới được sinh khoản phải thu")

    existing = db.query(Receivable).filter(
        Receivable.contract_id == data.contract_id,
        Receivable.billing_month == data.billing_month,
        Receivable.billing_year == data.billing_year
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Khoản phải thu của kỳ này đã tồn tại")

    room_amount = contract.rental_price
    total_amount = room_amount + data.service_amount
    due_date = date(data.billing_year, data.billing_month, 10)

    receivable = Receivable(
        contract_id=contract.id,
        apartment_id=contract.apartment_id,
        billing_month=data.billing_month,
        billing_year=data.billing_year,
        room_amount=room_amount,
        service_amount=data.service_amount,
        total_amount=total_amount,
        paid_amount=Decimal("0"),
        status="UNPAID",
        due_date=due_date
    )

    try:
        db.add(receivable)
        db.flush()

        # Đồng bộ sổ công nợ ngay khi tạo khoản thu (Fix lỗi lệch sổ nợ)
        recalculate_debt(contract.tenant_id, db)

        db.commit()
        db.refresh(receivable)
        return _enrich_receivable(receivable, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo khoản thu: {str(e)}")


@router.patch("/check-overdue")
def check_overdue_receivables(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    today = date.today()
    receivables = db.query(Receivable).filter(
        Receivable.status.in_(["UNPAID", "PARTIALLY_PAID", "PARTIAL"])
    ).all()

    updated_count = 0
    try:
        for rec in receivables:
            if today > rec.due_date and rec.paid_amount < rec.total_amount:
                rec.status = "OVERDUE"
                updated_count += 1
        db.commit()
        return {"message": "Kiểm tra quá hạn thành công", "updated_count": updated_count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật quá hạn: {str(e)}")


@router.get("", response_model=List[ReceivableResponse])
def get_receivables(
    status: Optional[str] = Query(None, description="Lọc theo trạng thái thanh toán"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT", "TENANT"))
):
    query = db.query(Receivable)
    if current_user.role and current_user.role.role_code == "TENANT":
        tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not tenant:
            return []
        query = query.join(Contract, Receivable.contract_id == Contract.id).filter(Contract.tenant_id == tenant.id)
    if status:
        query = query.filter(Receivable.status == status)
    recs = query.order_by(Receivable.id.desc()).all()
    return [_enrich_receivable(r, db) for r in recs]


@router.get("/contract/{contract_id}", response_model=List[ReceivableResponse])
def get_receivables_by_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    # IDOR Check
    if current_user.role.role_code == "TENANT":
        tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not tenant or contract.tenant_id != tenant.id:
            raise HTTPException(status_code=403, detail="Không có quyền truy cập khoản thu của hợp đồng khác")

    recs = db.query(Receivable).filter(Receivable.contract_id == contract_id).all()
    return [_enrich_receivable(r, db) for r in recs]


@router.get("/my", response_model=List[ReceivableResponse])
def get_my_receivables(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TENANT"))
):
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ khách thuê")

    recs = (
        db.query(Receivable)
        .join(Contract, Receivable.contract_id == Contract.id)
        .filter(Contract.tenant_id == tenant.id)
        .order_by(Receivable.id.desc())
        .all()
    )
    return [_enrich_receivable(r, db) for r in recs]


@router.get("/{receivable_id}", response_model=ReceivableResponse)
def get_receivable(
    receivable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(Receivable).filter(Receivable.id == receivable_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoản phải thu")

    # Sửa lỗi IDOR: Cho phép TENANT xem chi tiết hóa đơn nếu thuộc hợp đồng của chính mình
    if current_user.role.role_code == "TENANT":
        contract = db.query(Contract).filter(Contract.id == rec.contract_id).first()
        tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not tenant or contract.tenant_id != tenant.id:
            raise HTTPException(status_code=403, detail="Không có quyền truy cập khoản thu của cư dân khác")

    return _enrich_receivable(rec, db)


@router.get("/{receivable_id}/vietqr", response_model=VietQRDataResponse)
def get_receivable_vietqr(
    receivable_id: int,
    db: Session = Depends(get_db)
):
    """
    Sinh mã và URL VietQR Napas247 động gắn kèm số tiền và nội dung chuyển khoản (FR-33).
    """
    return generate_vietqr_data(receivable_id, db)