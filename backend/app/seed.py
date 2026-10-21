from app.database import SessionLocal

from app.models.role import Role
from app.models.user import User

from app.utils.security import hash_password


def seed_roles():
    db = SessionLocal()

    roles = [
        {
            "role_code": "ADMIN",
            "role_name": "Quản lý",
            "description": "Quản lý toàn bộ hệ thống"
        },
        {
            "role_code": "STAFF",
            "role_name": "Nhân viên",
            "description": "Nhân viên vận hành"
        },
        {
            "role_code": "ACCOUNTANT",
            "role_name": "Kế toán",
            "description": "Quản lý tài chính và thanh toán"
        },
        {
            "role_code": "TENANT",
            "role_name": "Khách thuê",
            "description": "Cư dân đã ký hợp đồng thuê"
        }
    ]

    for item in roles:

        existing_role = db.query(Role).filter(
            Role.role_code == item["role_code"]
        ).first()

        if existing_role is None:
            db.add(Role(**item))

    db.commit()
    db.close()


def seed_admin():

    db = SessionLocal()

    admin_role = db.query(Role).filter(
        Role.role_code == "ADMIN"
    ).first()

    existing_admin = db.query(User).filter(
        User.username == "admin"
    ).first()

    if existing_admin is None:
        admin = User(
            role_id=admin_role.id,
            username="admin",
            password_hash=hash_password("admin123"),
            full_name="Nguyễn Thị Trang",
            email="admin@dwell.vn",
            phone="0904.123.456",
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("Đã tạo tài khoản Admin!")
    else:
        existing_admin.password_hash = hash_password("admin123")
        existing_admin.full_name = "Nguyễn Thị Trang"
        existing_admin.email = "admin@dwell.vn"
        existing_admin.phone = "0904.123.456"
        existing_admin.is_active = True
        db.commit()
        print("Đã cập nhật mật khẩu tài khoản Admin sang admin123!")

    db.close()


if __name__ == "__main__":

    seed_roles()

    seed_admin()