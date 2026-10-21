from fastapi import APIRouter

from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.building import router as building_router
from app.routers.apartment import router as apartment_router
from app.routers.amenity import router as amenity_router
from app.routers.tenant import router as tenant_router
from app.routers.roommate import router as roommate_router
from app.routers.emergency_contact import router as emergency_contact_router
from app.routers.booking import router as booking_router
from app.routers.contract import router as contract_router
from app.routers.deposit import router as deposit_router
from app.routers.receivable import router as receivable_router
from app.routers.payment import router as payment_router
from app.routers.debt_ledger import router as debt_ledger_router
from app.routers.user import router as user_router
from app.routers.system_alert import router as system_alert_router
from app.routers.dashboard import router as dashboard_router
from app.routers.maintenance_request import router as maintenance_request_router
from app.routers.ai import router as ai_router
from app.routers.billing import router as billing_router

api_v1_router = APIRouter(prefix="/api/v1")

# Đăng ký toàn bộ 20 routers vào cụm API Version 1
api_v1_router.include_router(auth_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(building_router)
api_v1_router.include_router(apartment_router)
api_v1_router.include_router(amenity_router)
api_v1_router.include_router(tenant_router)
api_v1_router.include_router(roommate_router)
api_v1_router.include_router(emergency_contact_router)
api_v1_router.include_router(booking_router)
api_v1_router.include_router(contract_router)
api_v1_router.include_router(deposit_router)
api_v1_router.include_router(receivable_router)
api_v1_router.include_router(payment_router)
api_v1_router.include_router(debt_ledger_router)
api_v1_router.include_router(user_router)
api_v1_router.include_router(system_alert_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(maintenance_request_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(billing_router)
