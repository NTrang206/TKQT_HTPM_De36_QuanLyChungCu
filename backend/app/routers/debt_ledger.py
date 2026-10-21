from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.debt_ledger import DebtLedger
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.debt_ledger import DebtLedgerResponse
from app.services.debt_service import recalculate_debt
from app.dependencies.auth import require_roles, get_current_user

router = APIRouter(
    prefix="/debt-ledgers",
    tags=["Debt Ledgers"]
)


@router.get("", response_model=List[DebtLedgerResponse])
def get_debt_ledgers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    return db.query(DebtLedger).all()


@router.get("/tenant/{tenant_id}", response_model=DebtLedgerResponse)
@router.get("/{tenant_id}", response_model=DebtLedgerResponse)
def get_debt_by_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách thuê")

    # IDOR Check: TENANT chỉ được xem sổ nợ của mình
    if current_user.role.role_code == "TENANT":
        my_tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not my_tenant or my_tenant.id != tenant_id:
            raise HTTPException(status_code=403, detail="Không có quyền xem sổ nợ của cư dân khác")

    # Tự động tính toán hoặc khởi tạo sổ nợ nếu chưa có
    return recalculate_debt(tenant_id, db)


@router.patch("/tenant/{tenant_id}/recalculate", response_model=DebtLedgerResponse)
def recalculate_tenant_debt(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    return recalculate_debt(tenant_id, db)


@router.get("/my", response_model=DebtLedgerResponse)
def get_my_debt(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TENANT"))
):
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if tenant is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ khách thuê")

    return recalculate_debt(tenant.id, db)