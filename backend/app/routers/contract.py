from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contract import Contract
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.contract import (
    ContractCreate,
    ContractRenewRequest,
    TerminateContractRequest,
    BookingToContractRequest,
    ContractResponse
)
from app.schemas.ai import ContractSummarizeResponse
from app.dependencies.auth import require_roles, get_current_user
from app.services.contract_service import (
    create_contract as create_contract_service,
    activate_contract as activate_contract_service,
    renew_contract as renew_contract_service,
    terminate_contract as terminate_contract_service,
    create_contract_from_booking as create_contract_from_booking_service
)
from app.services.ai_service import summarize_contract_terms

router = APIRouter(
    prefix="/contracts",
    tags=["Contracts"]
)


@router.post("", response_model=ContractResponse)
def create_contract(
    data: ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    return create_contract_service(data, current_user.id, db)


@router.get("", response_model=List[ContractResponse])
def get_contracts(
    status: Optional[str] = Query(None, description="Lọc theo trạng thái"),
    tenant_id: Optional[int] = Query(None, description="Lọc theo khách thuê"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT", "TENANT"))
):
    query = db.query(Contract)
    if current_user.role and current_user.role.role_code == "TENANT":
        tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not tenant:
            return []
        query = query.filter(Contract.tenant_id == tenant.id)
    elif tenant_id:
        query = query.filter(Contract.tenant_id == tenant_id)
    if status:
        query = query.filter(Contract.status == status)
    return query.order_by(Contract.id.desc()).all()


@router.get("/my", response_model=List[ContractResponse])
def get_my_contracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("TENANT"))
):
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ cư dân")
    return db.query(Contract).filter(Contract.tenant_id == tenant.id).order_by(Contract.id.desc()).all()


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    # Bảo vệ chống IDOR: Nếu là TENANT thì phải sở hữu hợp đồng này
    if current_user.role.role_code == "TENANT":
        tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not tenant or contract.tenant_id != tenant.id:
            raise HTTPException(status_code=403, detail="Không có quyền truy cập hợp đồng của cư dân khác")

    return contract


@router.patch("/{contract_id}/activate", response_model=ContractResponse)
def activate_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    return activate_contract_service(contract_id, current_user.id, db)


@router.post("/{contract_id}/renew", response_model=ContractResponse)
def renew_contract(
    contract_id: int,
    data: ContractRenewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    return renew_contract_service(contract_id, data, current_user.id, db)


@router.post("/{contract_id}/terminate", response_model=ContractResponse)
def terminate_contract(
    contract_id: int,
    data: TerminateContractRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    return terminate_contract_service(contract_id, data.needs_maintenance, db)


@router.post("/from-booking/{booking_id}", response_model=ContractResponse)
def create_contract_from_booking(
    booking_id: int,
    data: BookingToContractRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF"))
):
    return create_contract_from_booking_service(booking_id, data, current_user.id, db)


@router.post("/{contract_id}/summarize", response_model=ContractSummarizeResponse)
def summarize_contract_ai(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI Trích xuất & Tóm tắt 5 điều khoản cốt lõi hợp đồng (AI-FR01).
    Hỗ trợ cả nhân viên duyệt và cư dân xem lại điều khoản.
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    if current_user.role.role_code == "TENANT":
        tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not tenant or contract.tenant_id != tenant.id:
            raise HTTPException(status_code=403, detail="Không có quyền truy cập hợp đồng này")

    return summarize_contract_terms(contract_id=contract_id, contract_text=None, db=db)