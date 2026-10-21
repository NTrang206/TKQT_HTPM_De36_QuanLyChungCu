from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.deposit import Deposit
from app.models.contract import Contract
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.deposit import (
    ReceiveDepositRequest,
    SettleDepositRequest,
    DepositSettlementPreviewRequest,
    DepositResponse,
    DepositSettlementDetailResponse
)
from app.dependencies.auth import require_roles, get_current_user
from app.services.deposit_service import (
    receive_deposit as receive_deposit_service,
    preview_deposit_settlement as preview_deposit_settlement_service,
    settle_deposit as settle_deposit_service
)

router = APIRouter(
    prefix="/deposits",
    tags=["Deposits"]
)


@router.get("", response_model=List[DepositResponse])
def get_deposits(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT", "STAFF"))
):
    return db.query(Deposit).all()


@router.get("/my", response_model=List[DepositResponse])
def get_my_deposits(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TENANT"))
):
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ khách thuê")

    return (
        db.query(Deposit)
        .join(Contract, Deposit.contract_id == Contract.id)
        .filter(Contract.tenant_id == tenant.id)
        .all()
    )


@router.get("/contract/{contract_id}", response_model=DepositResponse)
def get_deposit_by_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deposit = db.query(Deposit).filter(Deposit.contract_id == contract_id).first()
    if not deposit:
        raise HTTPException(status_code=404, detail="Hợp đồng chưa có thông tin tiền cọc")

    # IDOR Check: TENANT chỉ được xem cọc của chính mình
    if current_user.role.role_code == "TENANT":
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not tenant or contract.tenant_id != tenant.id:
            raise HTTPException(status_code=403, detail="Không có quyền truy cập thông tin cọc của cư dân khác")

    return deposit


@router.patch("/contract/{contract_id}/receive", response_model=DepositResponse)
def receive_deposit(
    contract_id: int,
    data: ReceiveDepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    return receive_deposit_service(contract_id, data, current_user.id, db)


@router.post("/contract/{contract_id}/settlement-preview")
def preview_deposit_settlement(
    contract_id: int,
    data: DepositSettlementPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    return preview_deposit_settlement_service(contract_id, data, db)


@router.patch("/contract/{contract_id}/settle", response_model=DepositResponse)
def settle_deposit(
    contract_id: int,
    data: SettleDepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    """
    Quyết toán cọc theo chuẩn UC002 (Cấn trừ nợ thực tế).
    Tự động hoàn cọc sau khi cấn trừ hư hại và nợ tồn đọng.
    """
    detail = settle_deposit_service(contract_id, data, current_user.id, db)
    # Trả về deposit object để khớp DepositResponse
    deposit = db.query(Deposit).filter(Deposit.contract_id == contract_id).first()
    return deposit


@router.post("/contract/{contract_id}/settle-detail", response_model=DepositSettlementDetailResponse)
def settle_deposit_detail(
    contract_id: int,
    data: SettleDepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    """
    Endpoint quyết toán cọc trả về chi tiết các khoản khấu trừ nợ và số hoàn thực tế.
    """
    return settle_deposit_service(contract_id, data, current_user.id, db)