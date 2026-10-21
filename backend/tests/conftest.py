import pytest
from datetime import date
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.role import Role
from app.models.user import User
from app.models.building import Building
from app.models.apartment import Apartment
from app.models.tenant import Tenant
from app.utils.security import hash_password, create_access_token
from app.services.ai_service import seed_default_document_chunks

# Sử dụng SQLite In-Memory với StaticPool để chia sẻ kết nối giữa app và test
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def clean_db():
    """
    Tạo mới CSDL và nạp dữ liệu nền tảng trước mỗi test để đảm bảo tính độc lập hoàn toàn.
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed 4 vai trò
    roles_data = [
        {"id": 1, "role_code": "ADMIN", "role_name": "Quản trị viên"},
        {"id": 2, "role_code": "STAFF", "role_name": "Nhân viên vận hành"},
        {"id": 3, "role_code": "ACCOUNTANT", "role_name": "Kế toán"},
        {"id": 4, "role_code": "TENANT", "role_name": "Khách thuê"}
    ]
    for r in roles_data:
        db.add(Role(**r))

    # Seed 4 tài khoản người dùng
    admin = User(
        id=1,
        role_id=1,
        username="test_admin",
        password_hash=hash_password("admin123"),
        full_name="Admin Test",
        email="admin_test@dwell.vn",
        phone="0901000001",
        is_active=True
    )
    staff = User(
        id=2,
        role_id=2,
        username="test_staff",
        password_hash=hash_password("staff123"),
        full_name="Staff Test",
        email="staff_test@dwell.vn",
        phone="0901000002",
        is_active=True
    )
    accountant = User(
        id=3,
        role_id=3,
        username="test_accountant",
        password_hash=hash_password("accountant123"),
        full_name="Accountant Test",
        email="accountant_test@dwell.vn",
        phone="0901000003",
        is_active=True
    )
    tenant_user = User(
        id=4,
        role_id=4,
        username="test_tenant",
        password_hash=hash_password("tenant123"),
        full_name="Nguyễn Văn A",
        email="nguyenvana@gmail.com",
        phone="0901000004",
        is_active=True
    )
    db.add_all([admin, staff, accountant, tenant_user])

    # Seed tòa nhà mẫu
    bld = Building(
        id=1,
        building_code="TOA-A",
        name="Tòa Tháp Dwell Luxury A",
        address="123 Đường Nguyễn Hữu Thọ, Q.7, TP.HCM",
        total_floors=10,
        total_apartments=1
    )
    db.add(bld)

    # Seed căn hộ mẫu (A-101)
    apt = Apartment(
        id=1,
        building_id=1,
        room_number="A-101",
        floor=1,
        area_sqm=Decimal("65.5"),
        price=Decimal("12000000"),
        max_occupants=3,
        status="AVAILABLE"
    )
    db.add(apt)

    # Seed khách thuê mẫu (Tenant id=1)
    tenant = Tenant(
        id=1,
        full_name="Nguyễn Văn A",
        citizen_id="079201009999",
        phone="0901000004",
        email="nguyenvana@gmail.com",
        hometown="TP. Hồ Chí Minh",
        is_bad_debt=False,
        user_id=4
    )
    db.add(tenant)

    # Seed 10 đoạn tri thức nội quy cho RAG Chatbot
    seed_default_document_chunks(db)

    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers():
    token = create_access_token(user_id=1, role_id=1, role_code="ADMIN")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def staff_headers():
    token = create_access_token(user_id=2, role_id=2, role_code="STAFF")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def accountant_headers():
    token = create_access_token(user_id=3, role_id=3, role_code="ACCOUNTANT")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def tenant_headers():
    token = create_access_token(user_id=4, role_id=4, role_code="TENANT")
    return {"Authorization": f"Bearer {token}"}
