import logging
from datetime import datetime, date
from app.database import SessionLocal
from app.services.alert_service import scan_system_alerts
from app.services.billing_service import generate_monthly_receivables

logger = logging.getLogger("DwellCronJobs")


def run_daily_alert_scan():
    """
    Tác vụ chạy ngầm định kỳ hàng ngày:
    Quét nợ quá hạn và hợp đồng sắp hết hạn để tạo cảnh báo hệ thống.
    """
    db = SessionLocal()
    try:
        logger.info(f"[{datetime.now()}] Bắt đầu chạy quét cảnh báo hệ thống...")
        result = scan_system_alerts(days_to_end=30, db=db)
        logger.info(f"Hoàn thành quét cảnh báo: {result['message']}")
        return result
    except Exception as e:
        logger.error(f"Lỗi khi chạy quét cảnh báo định kỳ: {str(e)}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


def run_monthly_billing_engine():
    """
    Tác vụ chạy ngầm ngày 01 hàng tháng:
    Tự động sinh hóa đơn tiền phòng và dịch vụ cho toàn bộ hợp đồng ACTIVE.
    """
    today = date.today()
    db = SessionLocal()
    try:
        logger.info(f"[{datetime.now()}] Bắt đầu kích hoạt Billing Engine định kỳ...")
        result = generate_monthly_receivables(
            month=today.month,
            year=today.year,
            due_day=10,
            db=db
        )
        logger.info(f"Hoàn thành Billing Engine: {result.message}")
        return result
    except Exception as e:
        logger.error(f"Lỗi khi chạy Billing Engine định kỳ: {str(e)}")
        return None
    finally:
        db.close()
