from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.user import User
from app.models.role import Role
from app.models.tenant import Tenant

from app.schemas.user import (
    UserCreate,
    UserUpdate,
    AssignRoleRequest,
    UserStatusRequest,
    UserResponse
)

from app.dependencies.auth import require_roles

from app.utils.security import hash_password


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# =========================================================
# TẠO TÀI KHOẢN
# Chỉ ADMIN
# =========================================================
@router.post(
    "",
    response_model=UserResponse
)
def create_user(
    data: UserCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    # Kiểm tra username
    existing_username = db.query(User).filter(
        User.username == data.username
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Tên đăng nhập đã tồn tại"
        )

    # Kiểm tra email
    if data.email:

        existing_email = db.query(User).filter(
            User.email == data.email
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Email đã được sử dụng"
            )

    # Tìm Role
    role = db.query(Role).filter(
        Role.role_code == data.role_code
    ).first()

    if role is None:
        raise HTTPException(
            status_code=404,
            detail="Vai trò không tồn tại"
        )

    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu phải có ít nhất 6 ký tự"
        )

    user = User(
        role_id=role.id,

        username=data.username,

        password_hash=hash_password(
            data.password
        ),

        full_name=data.full_name,
        email=data.email,
        phone=data.phone,

        is_active=True
    )

    db.add(user)
    db.commit()
    from app.routers.tenant import sync_users_and_tenants
    sync_users_and_tenants(db)
    db.refresh(user)

    return user


# =========================================================
# DANH SÁCH TÀI KHOẢN
# =========================================================
@router.get(
    "",
    response_model=list[UserResponse]
)
def get_users(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    return db.query(User).all()


# =========================================================
# XEM CHI TIẾT TÀI KHOẢN
# =========================================================
@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(
    user_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tài khoản"
        )

    return user


# =========================================================
# CẬP NHẬT THÔNG TIN TÀI KHOẢN
# =========================================================
@router.put(
    "/{user_id}",
    response_model=UserResponse
)
def update_user(
    user_id: int,
    data: UserUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tài khoản"
        )

    if data.email:

        email_owner = db.query(User).filter(
            User.email == data.email,
            User.id != user_id
        ).first()

        if email_owner:
            raise HTTPException(
                status_code=400,
                detail="Email đã được sử dụng"
            )

    user.full_name = data.full_name
    user.email = data.email
    user.phone = data.phone

    db.commit()
    db.refresh(user)

    return user


# =========================================================
# GÁN ROLE
# =========================================================
@router.patch(
    "/{user_id}/role",
    response_model=UserResponse
)
def assign_role(
    user_id: int,
    data: AssignRoleRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tài khoản"
        )

    role = db.query(Role).filter(
        Role.role_code == data.role_code
    ).first()

    if role is None:
        raise HTTPException(
            status_code=404,
            detail="Vai trò không tồn tại"
        )

    user.role_id = role.id

    db.commit()
    db.refresh(user)

    return user


# =========================================================
# KHÓA / MỞ TÀI KHOẢN
# =========================================================
@router.patch(
    "/{user_id}/status",
    response_model=UserResponse
)
def change_user_status(
    user_id: int,
    data: UserStatusRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tài khoản"
        )

    if user.id == current_user.id and not data.is_active:
        raise HTTPException(
            status_code=400,
            detail="Bạn không thể tự khóa tài khoản của mình"
        )

    user.is_active = data.is_active

    db.commit()
    db.refresh(user)

    return user


# =========================================================
# XÓA LOGIC TÀI KHOẢN
# Không xóa vật lý vì User đang được Contract,
# Payment, Deposit... tham chiếu.
# =========================================================
@router.delete("/{user_id}")
def delete_user(
    user_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tài khoản"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Không thể tự xóa tài khoản đang đăng nhập"
        )

    # Không DELETE vật lý vì có nhiều FK.
    # Ta khóa tài khoản.
    user.is_active = False

    db.commit()

    return {
        "message": "Đã vô hiệu hóa tài khoản"
    }