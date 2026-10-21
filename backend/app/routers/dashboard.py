import io
import csv
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.apartment import Apartment
from app.models.contract import Contract
from app.models.tenant import Tenant
from app.models.payment import Payment
from app.models.debt_ledger import DebtLedger
from app.models.receivable import Receivable
from app.models.deposit import Deposit
from app.models.maintenance_request import MaintenanceRequest
from app.models.system_alert import SystemAlert
from app.models.user import User
from app.dependencies.auth import require_roles

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    today = date.today()

    total_apartments = db.query(Apartment).count()
    occupied = db.query(Apartment).filter(Apartment.status == "OCCUPIED").count()
    available = db.query(Apartment).filter(Apartment.status == "AVAILABLE").count()
    reserved = db.query(Apartment).filter(Apartment.status == "RESERVED").count()
    maintenance = db.query(Apartment).filter(Apartment.status == "MAINTENANCE").count()

    occupancy_rate = 0.0
    if total_apartments > 0:
        occupancy_rate = round(occupied / total_apartments * 100, 2)

    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar()
    total_debt = db.query(func.coalesce(func.sum(DebtLedger.current_debt), 0)).scalar()
    overdue_receivables = db.query(Receivable).filter(Receivable.status == "OVERDUE").count()
    held_deposit = db.query(func.coalesce(func.sum(Deposit.amount), 0)).filter(Deposit.status == "HELD").scalar()

    end_limit = today + timedelta(days=30)
    expiring_contracts = db.query(Contract).filter(
        Contract.status == "ACTIVE",
        Contract.end_date >= today,
        Contract.end_date <= end_limit
    ).count()

    pending_maintenance = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.status.in_(["PENDING", "PROCESSING", "IN_PROGRESS"])
    ).count()

    unsent_alerts = db.query(SystemAlert).filter(SystemAlert.is_sent == False).count()

    return {
        "apartments": {
            "total": total_apartments,
            "available": available,
            "reserved": reserved,
            "occupied": occupied,
            "maintenance": maintenance,
            "occupancy_rate": occupancy_rate
        },
        "finance": {
            "total_revenue": total_revenue,
            "total_debt": total_debt,
            "held_deposit": held_deposit,
            "overdue_receivables": overdue_receivables
        },
        "operations": {
            "expiring_contracts": expiring_contracts,
            "pending_maintenance": pending_maintenance,
            "unsent_alerts": unsent_alerts
        }
    }


@router.get("/revenue")
def revenue_report(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    total = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.payment_date >= start_datetime,
        Payment.payment_date <= end_datetime
    ).scalar()

    count = db.query(Payment).filter(
        Payment.payment_date >= start_datetime,
        Payment.payment_date <= end_datetime
    ).count()

    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_revenue": total,
        "payment_count": count
    }


@router.get("/overdue")
def overdue_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    today = date.today()
    receivables = db.query(Receivable).filter(
        Receivable.due_date < today,
        Receivable.status != "PAID"
    ).all()

    result = []
    for item in receivables:
        remaining = item.total_amount - item.paid_amount
        if remaining <= 0:
            continue
        result.append({
            "receivable_id": item.id,
            "contract_id": item.contract_id,
            "due_date": str(item.due_date),
            "days_overdue": (today - item.due_date).days,
            "total_amount": float(item.total_amount),
            "paid_amount": float(item.paid_amount),
            "remaining_amount": float(remaining)
        })

    return result


@router.get("/export-revenue")
def export_revenue_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "ACCOUNTANT"))
):
    """
    [UC010] Xuất báo cáo doanh thu thực thu định dạng CSV (tương thích Excel UTF-8 BOM).
    """
    query = db.query(Payment)
    if start_date:
        query = query.filter(Payment.payment_date >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(Payment.payment_date <= datetime.combine(end_date, datetime.max.time()))

    payments = query.order_by(Payment.payment_date.desc()).all()

    output = io.StringIO()
    # Ghi UTF-8 BOM để Excel hiển thị đúng dấu tiếng Việt
    output.write("\ufeff")
    writer = csv.writer(output)
    writer.writerow([
        "Mã giao dịch",
        "Mã phiếu thu",
        "Mã khoản thu",
        "Mã hợp đồng",
        "Tên khách thuê",
        "Số tiền (VNĐ)",
        "Phương thức",
        "Ngày thanh toán",
        "Ghi chú"
    ])

    for p in payments:
        rec = db.query(Receivable).filter(Receivable.id == p.receivable_id).first()
        contract = db.query(Contract).filter(Contract.id == rec.contract_id).first() if rec else None
        tenant = db.query(Tenant).filter(Tenant.id == contract.tenant_id).first() if contract else None

        writer.writerow([
            p.transaction_code or f"PT-{p.id}",
            p.id,
            p.receivable_id,
            contract.contract_code if contract else "N/A",
            tenant.full_name if tenant else "N/A",
            f"{p.amount:,.0f}",
            p.payment_method,
            p.payment_date.strftime("%d/%m/%Y %H:%M:%S"),
            p.note or ""
        ])

    csv_data = output.getvalue()
    filename = f"bao_cao_doanh_thu_{date.today().strftime('%Y%m%d')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )