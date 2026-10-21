from fastapi import APIRouter, Depends

from app.models.user import User
from app.dependencies.auth import require_roles


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/test")
def admin_test(
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    return {
        "message": "Bạn có quyền ADMIN",
        "username": current_user.username
    }
@router.get("/staff-or-admin")
def staff_or_admin(
    current_user: User = Depends(
        require_roles("ADMIN", "STAFF")
    )
):

    return {
        "message": "ADMIN hoặc STAFF được truy cập"
    }