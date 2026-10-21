-- ==============================================================================
-- KHO DU LIEU KHOI TAO CSDL HE THONG QUAN LY CHUNG CU DWELL (DE TAI 36)
-- Mon hoc: Trien khai va Quan tri He thong Phan mem (TKQT HTPM - K23)
-- Sinh vien: Nguyen Thi Trang - GitHub: NTrang206
-- ==============================================================================

-- 1. BANG ROLES (VAI TRO NGUOI DUNG)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_code VARCHAR(30) NOT NULL UNIQUE,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BANG BUILDINGS (TOA NHA CHUNG CU)
CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    building_code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    total_floors INTEGER DEFAULT 10,
    total_apartments INTEGER DEFAULT 50,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BANG USERS (TAI KHOAN HE THONG)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. BANG APARTMENTS (DANH SACH CAN HO)
CREATE TABLE IF NOT EXISTS apartments (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id),
    room_number VARCHAR(20) NOT NULL,
    floor INTEGER NOT NULL,
    area_sqm NUMERIC(6, 2) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    max_occupants INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. BANG AMENITIES (TIEN NGHI / THIET BI CAN HO)
CREATE TABLE IF NOT EXISTS amenities (
    id SERIAL PRIMARY KEY,
    apartment_id INTEGER NOT NULL REFERENCES apartments(id),
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50),
    serial_number VARCHAR(50),
    condition_status VARCHAR(50) DEFAULT 'GOOD'
);

-- 6. BANG TENANTS (CU DAN THUE CAN HO)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    full_name VARCHAR(100) NOT NULL,
    citizen_id VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    hometown VARCHAR(100),
    is_bad_debt BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. BANG BOOKINGS (DANG KY THAM QUAN / GIU CHO)
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    apartment_id INTEGER NOT NULL REFERENCES apartments(id),
    check_in_date DATE NOT NULL,
    deposit_amount NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. BANG CONTRACTS (HOP DONG THUE CAN HO)
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    contract_code VARCHAR(50) NOT NULL UNIQUE,
    apartment_id INTEGER NOT NULL REFERENCES apartments(id),
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_price NUMERIC(12, 2) NOT NULL,
    deposit_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by INTEGER NOT NULL REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    booking_id INTEGER REFERENCES bookings(id),
    ai_summary TEXT
);

-- 9. BANG EMERGENCY_CONTACTS (LIEN HE KHAN CAP CU DAN)
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50) NOT NULL
);

-- 10. BANG ROOMMATES (NGUOI O CUNG)
CREATE TABLE IF NOT EXISTS roommates (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    apartment_id INTEGER NOT NULL REFERENCES apartments(id),
    full_name VARCHAR(100) NOT NULL,
    citizen_id VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    relationship VARCHAR(50)
);

-- 11. BANG RECEIVABLES (HOA DON PHI DICH VU HANG THANG)
CREATE TABLE IF NOT EXISTS receivables (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    apartment_id INTEGER NOT NULL REFERENCES apartments(id),
    billing_month INTEGER NOT NULL,
    billing_year INTEGER NOT NULL,
    room_amount NUMERIC(12, 2) NOT NULL,
    service_amount NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_receivable_contract_period UNIQUE (contract_id, billing_month, billing_year)
);

-- 12. BANG PAYMENTS (GIAO DICH THANH TOAN)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    receivable_id INTEGER NOT NULL REFERENCES receivables(id),
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'VIETQR',
    transaction_code VARCHAR(50) UNIQUE,
    payment_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255),
    handled_by INTEGER NOT NULL REFERENCES users(id)
);

-- 13. BANG DEBT_LEDGER (SO THEO DOI CONG NO CU DAN)
CREATE TABLE IF NOT EXISTS debt_ledger (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id),
    total_receivable NUMERIC(14, 2) DEFAULT 0,
    total_paid NUMERIC(14, 2) DEFAULT 0,
    current_debt NUMERIC(14, 2) DEFAULT 0,
    last_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. BANG DEPOSITS (TIEN COC HOP DONG)
CREATE TABLE IF NOT EXISTS deposits (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL UNIQUE REFERENCES contracts(id),
    amount NUMERIC(12, 2) NOT NULL,
    paid_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'HELD',
    refund_amount NUMERIC(12, 2) DEFAULT 0,
    deduction_amount NUMERIC(12, 2) DEFAULT 0,
    deduction_reason TEXT,
    handled_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. BANG MAINTENANCE_REQUESTS (TIEP NHAN & XU LY KHIEU NAI / PHAN ANH)
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id SERIAL PRIMARY KEY,
    apartment_id INTEGER NOT NULL REFERENCES apartments(id),
    tenant_id INTEGER REFERENCES tenants(id),
    reporter_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    issue_description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'PENDING',
    repair_cost NUMERIC(12, 2) DEFAULT 0,
    assigned_staff_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITHOUT TIME ZONE,
    image_url VARCHAR(255)
);

-- 16. BANG SYSTEM_ALERTS (BANG TIN THONG BAO BAN QUAN LY)
CREATE TABLE IF NOT EXISTS system_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(30) NOT NULL,
    reference_id INTEGER DEFAULT 0,
    message TEXT NOT NULL,
    is_sent BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. BANG DOCUMENT_CHUNGS (DU LIEU TRI THUC SO TAY CU DAN RAG)
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    document_name VARCHAR(100) NOT NULL,
    chunk_index INTEGER NOT NULL,
    category VARCHAR(50),
    content TEXT NOT NULL,
    citation VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- NAP DU LIEU MAU THUC TE (SEED DATA)
-- ==============================================================================

-- 1. Roles
INSERT INTO roles (id, role_code, role_name, description) VALUES
(1, 'ADMIN', 'Quản trị viên', 'Quản trị toàn diện hệ thống chung cư Dwell'),
(2, 'STAFF', 'Nhân viên kỹ thuật', 'Vận hành kỹ thuật, bảo trì và xử lý sự cố'),
(3, 'ACCOUNTANT', 'Kế toán BQL', 'Quản lý thu chi hóa đơn và công nợ'),
(4, 'TENANT', 'Cư dân căn hộ', 'Chủ hộ và thành viên cư trú tại chung cư'),
(5, 'GUEST', 'Khách tham quan', 'Khách tìm hiểu và đăng ký thuê căn hộ')
ON CONFLICT (role_code) DO NOTHING;

-- 2. Buildings
INSERT INTO buildings (id, building_code, name, address, total_floors, total_apartments, status) VALUES
(1, 'T-LANDMARK', 'Dwell Landmark Tower', '128 Đường Xuân Thủy, Cầu Giấy, Hà Nội', 15, 60, 'ACTIVE'),
(2, 'T-SAPPHIRE', 'Dwell Sapphire Residence', '88 Đường Lê Văn Lương, Thanh Xuân, Hà Nội', 20, 80, 'ACTIVE')
ON CONFLICT (building_code) DO NOTHING;

-- 3. Users (Mật khẩu mặc định: admin123, staff123, tenant123)
-- Hash bcrypt tương ứng: $2b$12$xI67CtCncsHqw/f5D..kVuL/Baxvf8gJIA18yiy7E0LvpUCV5i2A6
INSERT INTO users (id, role_id, username, password_hash, full_name, email, phone, is_active) VALUES
(1, 1, 'admin', '$2b$12$xI67CtCncsHqw/f5D..kVuL/Baxvf8gJIA18yiy7E0LvpUCV5i2A6', 'Nguyễn Thị Trang', 'admin@dwell.vn', '0904123456', TRUE),
(2, 2, 'staff', '$2b$12$xI67CtCncsHqw/f5D..kVuL/Baxvf8gJIA18yiy7E0LvpUCV5i2A6', 'Lê Văn Cường', 'staff@dwell.vn', '0912234567', TRUE),
(3, 3, 'accountant', '$2b$12$xI67CtCncsHqw/f5D..kVuL/Baxvf8gJIA18yiy7E0LvpUCV5i2A6', 'Hoàng Khánh Ly', 'acc@dwell.vn', '0988345678', TRUE),
(4, 4, 'tenant', '$2b$12$xI67CtCncsHqw/f5D..kVuL/Baxvf8gJIA18yiy7E0LvpUCV5i2A6', 'Nguyễn Văn An', 'an.nguyen@gmail.com', '0912888999', TRUE),
(5, 4, 'tenant2', '$2b$12$xI67CtCncsHqw/f5D..kVuL/Baxvf8gJIA18yiy7E0LvpUCV5i2A6', 'Trần Thị Bích', 'bich.tran@gmail.com', '0933111222', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 4. Apartments
INSERT INTO apartments (id, building_id, room_number, floor, area_sqm, price, max_occupants, status) VALUES
(1, 1, 'P101', 1, 65.50, 8500000, 4, 'OCCUPIED'),
(2, 1, 'P102', 1, 72.00, 9500000, 4, 'OCCUPIED'),
(3, 1, 'P201', 2, 55.00, 7200000, 3, 'OCCUPIED'),
(4, 1, 'P202', 2, 85.00, 12000000, 5, 'AVAILABLE'),
(5, 1, 'P301', 3, 60.00, 8000000, 3, 'AVAILABLE'),
(6, 2, 'S101', 1, 90.00, 13500000, 5, 'AVAILABLE'),
(7, 2, 'S201', 2, 75.00, 10500000, 4, 'AVAILABLE')
ON CONFLICT DO NOTHING;

-- 5. Tenants
INSERT INTO tenants (id, user_id, full_name, citizen_id, phone, email, hometown, is_bad_debt) VALUES
(1, 4, 'Nguyễn Văn An', '001200001111', '0912888999', 'an.nguyen@gmail.com', 'Hà Nội', FALSE),
(2, 5, 'Trần Thị Bích', '001200002222', '0933111222', 'bich.tran@gmail.com', 'Hải Phòng', FALSE)
ON CONFLICT (citizen_id) DO NOTHING;

-- 6. Contracts
INSERT INTO contracts (id, contract_code, apartment_id, tenant_id, start_date, end_date, rental_price, deposit_amount, status, created_by) VALUES
(1, 'HD-2026-101', 1, 1, '2026-01-01', '2026-12-31', 8500000, 17000000, 'ACTIVE', 1),
(2, 'HD-2026-102', 2, 2, '2026-03-01', '2027-02-28', 9500000, 19000000, 'ACTIVE', 1)
ON CONFLICT (contract_code) DO NOTHING;

-- 7. Receivables (Hóa đơn dịch vụ)
INSERT INTO receivables (id, contract_id, apartment_id, billing_month, billing_year, room_amount, service_amount, total_amount, paid_amount, status, due_date) VALUES
(1, 1, 1, 10, 2026, 8500000, 1250000, 9750000, 9750000, 'PAID', '2026-10-15'),
(2, 2, 2, 10, 2026, 9500000, 1420000, 10920000, 0, 'PENDING', '2026-10-25')
ON CONFLICT (contract_id, billing_month, billing_year) DO NOTHING;

-- 8. Payments
INSERT INTO payments (id, receivable_id, amount, payment_method, transaction_code, note, handled_by) VALUES
(1, 1, 9750000, 'VIETQR', 'TXN-202610-001', 'Thanh toán tiền phòng và dịch vụ tháng 10/2026', 1)
ON CONFLICT (transaction_code) DO NOTHING;

-- 9. Maintenance Requests (Khiếu nại / Phản ánh của cư dân)
INSERT INTO maintenance_requests (id, apartment_id, tenant_id, reporter_name, phone, issue_description, priority, status, repair_cost, assigned_staff_id) VALUES
(1, 1, 1, 'Nguyễn Văn An', '0912888999', 'Hư hỏng vòi cấp nước máy giặt tại logia sau, nước bị rò rỉ.', 'HIGH', 'IN_PROGRESS', 250000, 2),
(2, 2, 2, 'Trần Thị Bích', '0933111222', 'Điều hòa phòng khách phát ra tiếng kêu rè rè khi hoạt động.', 'MEDIUM', 'PENDING', 0, 2)
ON CONFLICT DO NOTHING;

-- 10. System Alerts (Thông báo BQL)
INSERT INTO system_alerts (id, alert_type, reference_id, message, is_sent) VALUES
(1, 'MAINTENANCE', 101, 'Ban Quản lý thông báo bảo trì định kỳ hệ thống thang máy Tháp Landmark từ 08:00 - 11:00 ngày 25/10/2026.', TRUE),
(2, 'BILLING', 102, 'Nhắc nhở nộp phí dịch vụ quản lý căn hộ tháng 10/2026. Hạn cuối thanh toán là ngày 25/10/2026.', TRUE)
ON CONFLICT DO NOTHING;

-- Cập nhật SEQUENCE SERIAL cho tất cả các bảng để tránh lỗi khóa chính khi insert tiếp
SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles));
SELECT setval('buildings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM buildings));
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('apartments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM apartments));
SELECT setval('tenants_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tenants));
SELECT setval('contracts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM contracts));
SELECT setval('receivables_id_seq', (SELECT COALESCE(MAX(id), 1) FROM receivables));
SELECT setval('payments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM payments));
SELECT setval('maintenance_requests_id_seq', (SELECT COALESCE(MAX(id), 1) FROM maintenance_requests));
SELECT setval('system_alerts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM system_alerts));
