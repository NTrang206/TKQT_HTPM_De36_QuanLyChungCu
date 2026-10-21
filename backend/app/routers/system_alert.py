from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.system_alert import SystemAlert
from app.models.receivable import Receivable
from app.models.user import User
from app.schemas.system_alert import (
    AlertScanRequest,
    AlertMarkSentRequest,
    SystemAlertResponse
)
from app.schemas.ai import DunningMessageResponse
from app.dependencies.auth import require_roles
from app.services.alert_service import scan_system_alerts
from app.services.ai_service import generate_dunning_message

router = APIRouter(
    prefix="/alerts",
    tags=["System Alerts"]
)


@router.post("/scan")
def scan_alerts(
    data: AlertScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    """
    Rule Engine quét tự động hợp đồng sắp hết hạn và các khoản nợ quá hạn (UC005).
    """
    return scan_system_alerts(days_to_end=data.days_to_end, db=db)


@router.get("", response_model=List[SystemAlertResponse])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    return db.query(SystemAlert).order_by(SystemAlert.created_at.desc()).all()


@router.get("/unsent", response_model=List[SystemAlertResponse])
def get_unsent_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    return (
        db.query(SystemAlert)
        .filter(SystemAlert.is_sent == False)
        .order_by(SystemAlert.created_at.desc())
        .all()
    )


@router.patch("/{alert_id}/mark-sent", response_model=SystemAlertResponse)
def mark_alert_sent(
    alert_id: int,
    data: AlertMarkSentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    alert = db.query(SystemAlert).filter(SystemAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Không tìm thấy cảnh báo")

    if alert.is_sent:
        raise HTTPException(status_code=400, detail="Cảnh báo này đã được đánh dấu gửi trước đó")

    valid_channels = ["EMAIL", "SMS", "ZALO"]
    if data.channel not in valid_channels:
        raise HTTPException(status_code=400, detail="Kênh gửi không hợp lệ (hỗ trợ: EMAIL, SMS, ZALO)")

    try:
        alert.is_sent = True
        db.commit()
        db.refresh(alert)
        return alert
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật cảnh báo: {str(e)}")


@router.get("/{alert_id}", response_model=SystemAlertResponse)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    alert = db.query(SystemAlert).filter(SystemAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Không tìm thấy cảnh báo")
    return alert


@router.post("/{alert_id}/generate-dunning", response_model=DunningMessageResponse)
def generate_dunning_for_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    """
    Tích hợp GenAI (AI-FR02): Soạn thông điệp nhắc nợ tự động theo cảnh báo đã quét.
    """
    alert = db.query(SystemAlert).filter(SystemAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Không tìm thấy cảnh báo")

    if alert.alert_type not in ["OVERDUE_RECEIVABLE", "OVERDUE_DEBT"]:
        raise HTTPException(status_code=400, detail="Chỉ có thể sinh thông điệp nhắc nợ cho cảnh báo quá hạn")

    return generate_dunning_message(receivable_id=alert.reference_id, urgency_level="NORMAL", db=db)