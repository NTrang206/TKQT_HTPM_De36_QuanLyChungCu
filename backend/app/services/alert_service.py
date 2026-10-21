from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.contract import Contract
from app.models.receivable import Receivable
from app.models.system_alert import SystemAlert
from app.models.apartment import Apartment
from app.models.tenant import Tenant


def scan_system_alerts(
    days_to_end: int = 30,
    db: Session = None
) -> dict:
    """
    Rule Engine tự động quét và sinh cảnh báo hệ thống (UC005):
    1. Cảnh báo hợp đồng sắp hết hạn trong ngưỡng ngày.
    2. Cảnh báo các khoản thu quá hạn nộp.
    """
    today = date.today()
    threshold_date = today + timedelta(days=days_to_end)

    created_expiring_alerts = 0
    created_overdue_alerts = 0

    try:
        # 1. Quét hợp đồng sắp hết hạn
        expiring_contracts = db.query(Contract).filter(
            Contract.status == "ACTIVE",
            Contract.end_date >= today,
            Contract.end_date <= threshold_date
        ).all()

        for c in expiring_contracts:
            days_left = (c.end_date - today).days
            existing = db.query(SystemAlert).filter(
                SystemAlert.alert_type == "EXPIRING_CONTRACT",
                SystemAlert.reference_id == c.id,
                SystemAlert.created_at >= datetime.combine(today, datetime.min.time())
            ).first()

            if not existing:
                tenant = db.query(Tenant).filter(Tenant.id == c.tenant_id).first()
                t_name = tenant.full_name if tenant else f"Khách #{c.tenant_id}"
                alert = SystemAlert(
                    alert_type="EXPIRING_CONTRACT",
                    reference_id=c.id,
                    message=(
                        f"Hợp đồng {c.contract_code} (Cư dân: {t_name}) "
                        f"sẽ hết hạn sau {days_left} ngày (ngày {c.end_date.strftime('%d/%m/%Y')})."
                    ),
                    is_sent=False
                )
                db.add(alert)
                created_expiring_alerts += 1

        # 2. Quét các khoản thu quá hạn
        overdue_receivables = db.query(Receivable).filter(
            Receivable.due_date < today,
            Receivable.status.in_(["UNPAID", "PARTIALLY_PAID", "PARTIAL"])
        ).all()

        for r in overdue_receivables:
            days_overdue = (today - r.due_date).days
            remaining = r.total_amount - r.paid_amount
            # Cập nhật status sang OVERDUE
            r.status = "OVERDUE"

            existing = db.query(SystemAlert).filter(
                SystemAlert.alert_type == "OVERDUE_RECEIVABLE",
                SystemAlert.reference_id == r.id,
                SystemAlert.created_at >= datetime.combine(today, datetime.min.time())
            ).first()

            if not existing:
                alert = SystemAlert(
                    alert_type="OVERDUE_RECEIVABLE",
                    reference_id=r.id,
                    message=(
                        f"Khoản thu #{r.id} (Tháng {r.billing_month}/{r.billing_year}) "
                        f"đã quá hạn {days_overdue} ngày. Số nợ cần thu: {remaining:,.0f} VNĐ."
                    ),
                    is_sent=False
                )
                db.add(alert)
                created_overdue_alerts += 1

        db.commit()

        return {
            "status": "success",
            "created_expiring_alerts": created_expiring_alerts,
            "created_overdue_alerts": created_overdue_alerts,
            "total_new_alerts": created_expiring_alerts + created_overdue_alerts,
            "message": (
                f"Đã quét xong: Phát hiện {created_expiring_alerts} hợp đồng sắp hết hạn và "
                f"{created_overdue_alerts} khoản thu nợ quá hạn."
            )
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi quét cảnh báo tự động: {str(e)}"
        )
