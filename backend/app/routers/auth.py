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
from app.models.contract import Contract

from app.schemas.auth import (
    LoginRequest,
    ChangePasswordRequest,
    TenantRegisterRequest
)

from app.utils.security import (
    verify_password,
    hash_password,
    create_access_token
)

from app.dependencies.auth import (
    get_current_user
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


from sqlalchemy import or_


# =========================================================
# ĐĂNG NHẬP
# =========================================================
@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    identifier = data.username.strip()

    # 1. Tìm tài khoản theo username, email hoặc số điện thoại
    user = db.query(User).filter(
        or_(
            User.username == identifier,
            User.email == identifier,
            User.phone == identifier
        )
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Sai tên đăng nhập hoặc mật khẩu"
        )

    # 2. Kiểm tra tài khoản có bị khóa không
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Tài khoản đã bị khóa"
        )

    # 3. Kiểm tra mật khẩu
    if not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Sai tên đăng nhập hoặc mật khẩu"
        )

    # 4. Tìm Role
    role = db.query(Role).filter(
        Role.id == user.role_id
    ).first()

    if role is None:
        raise HTTPException(
            status_code=500,
            detail="Tài khoản chưa được gán vai trò hợp lệ"
        )

    # 5. Tìm tenant_id nếu là tài khoản cư dân
    tenant_id = None
    tenant = db.query(Tenant).filter(
        Tenant.user_id == user.id
    ).first()
    if tenant:
        tenant_id = tenant.id

    # 6. Tạo JWT
    access_token = create_access_token(
        user.id,
        user.role_id,
        role.role_code
    )

    # 7. Trả về cho Frontend
    return {
        "access_token": access_token,
        "token_type": "bearer",

        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role_id": user.role_id,
            "role_code": role.role_code,
            "tenant_id": tenant_id,
            "is_active": user.is_active
        }
    }


# =========================================================
# ĐĂNG XUẤT (REVOKE SESSION)
# =========================================================
@router.post("/logout")
def logout():
    return {
        "success": True,
        "message": "Đăng xuất tài khoản thành công"
    }


# =========================================================
# THÔNG TIN NGƯỜI ĐANG ĐĂNG NHẬP
# =========================================================
@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    role = db.query(Role).filter(
        Role.id == current_user.role_id
    ).first()

    tenant_id = None

    # Nếu là tài khoản Tenant Portal
    tenant = db.query(Tenant).filter(
        Tenant.user_id == current_user.id
    ).first()

    if tenant:
        tenant_id = tenant.id

    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role_id": current_user.role_id,
        "role_code": (
            role.role_code
            if role
            else None
        ),
        "tenant_id": tenant_id,
        "is_active": current_user.is_active
    }


# =========================================================
# ĐỔI MẬT KHẨU
# ADMIN / STAFF / ACCOUNTANT / TENANT
# đều dùng được vì chỉ cần đăng nhập
# =========================================================
@router.patch("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    # 1. Kiểm tra mật khẩu hiện tại
    if not verify_password(
        data.old_password,
        current_user.password_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu hiện tại không đúng"
        )

    # 2. Kiểm tra độ dài mật khẩu mới
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu mới phải có ít nhất 6 ký tự"
        )

    # 3. Không cho dùng lại mật khẩu cũ
    if verify_password(
        data.new_password,
        current_user.password_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu mới không được giống mật khẩu cũ"
        )

    # 4. Hash mật khẩu mới
    current_user.password_hash = (
        hash_password(
            data.new_password
        )
    )

    db.commit()

    return {
        "message": "Đổi mật khẩu thành công"
    }


# =========================================================
# ĐĂNG KÝ TÀI KHOẢN TENANT PORTAL
#
# Chỉ Tenant đã có hồ sơ + Contract ACTIVE
# mới được đăng ký
# =========================================================
@router.post("/register-tenant")
def register_tenant(
    data: TenantRegisterRequest,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # 1. Tìm hồ sơ Tenant bằng CCCD
    # -----------------------------------------------------
    tenant = db.query(Tenant).filter(
        Tenant.citizen_id == data.citizen_id
    ).first()

    if tenant is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hồ sơ khách thuê"
        )

    # -----------------------------------------------------
    # 2. Kiểm tra số điện thoại
    # -----------------------------------------------------
    if tenant.phone != data.phone:
        raise HTTPException(
            status_code=400,
            detail="Số điện thoại không khớp hồ sơ khách thuê"
        )

    # -----------------------------------------------------
    # 3. Tenant đã có tài khoản Portal chưa?
    # -----------------------------------------------------
    if tenant.user_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Khách thuê đã có tài khoản Portal"
        )

    # -----------------------------------------------------
    # 4. Chỉ Tenant có Contract ACTIVE
    # mới được mở Portal
    # -----------------------------------------------------
    active_contract = db.query(Contract).filter(
        Contract.tenant_id == tenant.id,
        Contract.status == "ACTIVE"
    ).first()

    if active_contract is None:
        raise HTTPException(
            status_code=400,
            detail="Khách thuê chưa có hợp đồng ACTIVE"
        )

    # -----------------------------------------------------
    # 5. Kiểm tra username
    # -----------------------------------------------------
    existing_username = db.query(User).filter(
        User.username == data.username
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Tên đăng nhập đã tồn tại"
        )

    # -----------------------------------------------------
    # 6. Kiểm tra email
    # -----------------------------------------------------
    if data.email:

        existing_email = db.query(User).filter(
            User.email == data.email
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Email đã được sử dụng"
            )

    # -----------------------------------------------------
    # 7. Kiểm tra password
    # -----------------------------------------------------
    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu phải có ít nhất 6 ký tự"
        )

    # -----------------------------------------------------
    # 8. Tìm Role TENANT
    # -----------------------------------------------------
    tenant_role = db.query(Role).filter(
        Role.role_code == "TENANT"
    ).first()

    if tenant_role is None:
        raise HTTPException(
            status_code=500,
            detail="Hệ thống chưa có vai trò TENANT"
        )

    # -----------------------------------------------------
    # 9. Tạo User
    # -----------------------------------------------------
    user = User(
        role_id=tenant_role.id,

        username=data.username,

        password_hash=hash_password(
            data.password
        ),

        full_name=tenant.full_name,

        email=data.email,

        phone=tenant.phone,

        is_active=True
    )

    db.add(user)

    # Lấy user.id trước khi commit
    db.flush()

    # -----------------------------------------------------
    # 10. Liên kết Tenant -> User
    # -----------------------------------------------------
    tenant.user_id = user.id

    db.commit()
    db.refresh(user)

    return {
        "message": "Đăng ký Tenant Portal thành công",

        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role_code": "TENANT"
        },

        "tenant_id": tenant.id
    }


# =========================================================
# ĐĂNG XUẤT
#
# JWT hiện tại là stateless.
# Frontend sẽ xóa token khỏi localStorage/sessionStorage.
# =========================================================
@router.post("/logout")
def logout(
    current_user: User = Depends(
        get_current_user
    )
):

    return {
        "message": "Đăng xuất thành công"
    }