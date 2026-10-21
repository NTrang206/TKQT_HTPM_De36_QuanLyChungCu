from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.models.role import Role
from app.database import get_db
from app.models.user import User
from app.utils.security import decode_access_token


security = HTTPBearer()


DEMO_TOKEN_MAP = {
    "demo-admin-token": "admin",
    "demo-staff-token": "staff",
    "demo-accountant-token": "accountant",
    "demo-tenant-token": "tenant",
}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    if token in DEMO_TOKEN_MAP:
        demo_user = db.query(User).filter(
            User.username == DEMO_TOKEN_MAP[token]
        ).first()
        if demo_user and demo_user.is_active:
            return demo_user

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Token không hợp lệ hoặc đã hết hạn"
        )

    user_id = payload.get("user_id")

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Token không hợp lệ"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Người dùng không tồn tại"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Tài khoản đã bị khóa"
        )

    return user
def require_roles(*allowed_roles: str):

    def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):

        role = db.query(Role).filter(
            Role.id == current_user.role_id
        ).first()

        if role is None:
            raise HTTPException(
                status_code=403,
                detail="Vai trò người dùng không hợp lệ"
            )

        if role.role_code not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Bạn không có quyền thực hiện chức năng này"
            )

        return current_user

    return role_checker