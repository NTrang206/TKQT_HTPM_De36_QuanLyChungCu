import json
import sys
from datetime import date, datetime, timedelta
from decimal import Decimal
from app.database import SessionLocal, engine, Base
from app.models import (
    Role, User, Building, Apartment, Amenity, Tenant, Roommate,
    EmergencyContact, Booking, Contract, Deposit, Receivable,
    Payment, DebtLedger, SystemAlert, MaintenanceRequest, DocumentChunk
)
from app.utils.security import hash_password
from app.services.ai_service import seed_default_document_chunks
from app.services.debt_service import recalculate_debt

def seed_all():
    db = SessionLocal()
    try:
        print(">>> Bắt đầu khởi tạo và đồng bộ hóa toàn diện dữ liệu CSDL Dwell...")

        # -------------------------------------------------------------
        # 1. ROLES
        # -------------------------------------------------------------
        roles = {
            "ADMIN": "Quản trị viên hệ thống toàn quyền",
            "STAFF": "Nhân viên vận hành tòa nhà",
            "ACCOUNTANT": "Kế toán tài chính & thu chi",
            "TENANT": "Cư dân thuê căn hộ",
            "GUEST": "Khách tìm thuê tham quan"
        }
        role_objs = {}
        for code, desc in roles.items():
            r = db.query(Role).filter(Role.role_code == code).first()
            if not r:
                r = Role(role_code=code, role_name=f"Vai trò {code}", description=desc)
                db.add(r)
                db.flush()
            role_objs[code] = r
        db.commit()

        # -------------------------------------------------------------
        # 2. USERS
        # -------------------------------------------------------------
        users_info = [
            ("admin", "admin123", "ADMIN", "Nguyễn Thị Trang", "admin@dwell.vn", "0904.123.456"),
            ("staff", "staff123", "STAFF", "Lê Văn Cường", "staff@dwell.vn", "0912.234.567"),
            ("accountant", "acc123", "ACCOUNTANT", "Hoàng Khánh Ly", "accountant@dwell.vn", "0988.345.678"),
            ("tenant", "tenant123", "TENANT", "Nguyễn Văn An", "tenant@dwell.vn", "0912.888.999"),
            ("tenant2", "tenant123", "TENANT", "Trần Thị Bích", "bich.tran@gmail.com", "0933.111.222"),
            ("tenant3", "tenant123", "TENANT", "Lê Hoàng Nam", "nam.le@gmail.com", "0908.112.233"),
            ("tenant4", "tenant123", "TENANT", "Đỗ Thu Trang", "trang.do@gmail.com", "0915.667.788"),
            ("tenant5", "tenant123", "TENANT", "Phạm Minh Đức", "duc.pham@gmail.com", "0944.333.444"),
        ]
        user_objs = {}
        for uname, pwd, rcode, fname, email, phone in users_info:
            u = db.query(User).filter(User.username == uname).first()
            if not u:
                u = User(
                    username=uname,
                    password_hash=hash_password(pwd),
                    role_id=role_objs[rcode].id,
                    full_name=fname,
                    email=email,
                    phone=phone,
                    is_active=True
                )
                db.add(u)
                db.flush()
            else:
                u.password_hash = hash_password(pwd)
                u.role_id = role_objs[rcode].id
                u.full_name = fname
                u.email = email
                u.phone = phone
                u.is_active = True
                db.flush()
            user_objs[uname] = u
        db.commit()

        # -------------------------------------------------------------
        # 3. BUILDINGS (4 Tòa nhà tại các vị trí trọng điểm)
        # -------------------------------------------------------------
        buildings_data = [
            ("BLD-01", "Sunshine Diamond Tower", "128 Mai Chí Thọ, P. An Phú, TP. Thủ Đức, TP.HCM", 25, 120, "ACTIVE"),
            ("BLD-02", "Sunshine Riverside Complex", "45 Võ Thị Sáu, P. Đa Kao, Quận 1, TP.HCM", 18, 80, "ACTIVE"),
            ("BLD-03", "Sunshine City View", "72 Nguyễn Gia Trí, P. 25, Bình Thạnh, TP.HCM", 15, 60, "ACTIVE"),
            ("BLD-04", "Sunshine Park Residences", "88 Vũ Phạm Hàm, P. Yên Hòa, Cầu Giấy, Hà Nội", 20, 90, "ACTIVE"),
        ]
        bld_objs = []
        for code, name, addr, floors, apts, status in buildings_data:
            b = db.query(Building).filter(Building.building_code == code).first()
            if not b:
                b = Building(
                    building_code=code,
                    name=name,
                    address=addr,
                    total_floors=floors,
                    total_apartments=apts,
                    status=status
                )
                db.add(b)
                db.flush()
            else:
                b.name = name
                b.address = addr
                b.total_floors = floors
                b.total_apartments = apts
                b.status = status
                db.flush()
            bld_objs.append(b)
        db.commit()

        # -------------------------------------------------------------
        # 4. APARTMENTS (24 căn hộ đa dạng diện tích, giá thuê và trạng thái)
        # -------------------------------------------------------------
        apts_data = [
            # Tòa 1: Sunshine Diamond Tower (Thủ Đức)
            (bld_objs[0].id, "P101", 1, Decimal("65.5"), Decimal("14000000"), 3, "OCCUPIED"),
            (bld_objs[0].id, "P102", 1, Decimal("72.0"), Decimal("16500000"), 4, "AVAILABLE"),
            (bld_objs[0].id, "P201", 2, Decimal("50.0"), Decimal("11000000"), 2, "RESERVED"),
            (bld_objs[0].id, "P202", 2, Decimal("85.0"), Decimal("19000000"), 4, "OCCUPIED"),
            (bld_objs[0].id, "P301", 3, Decimal("55.0"), Decimal("12500000"), 2, "MAINTENANCE"),
            (bld_objs[0].id, "P302", 3, Decimal("78.0"), Decimal("17500000"), 3, "OCCUPIED"),
            (bld_objs[0].id, "P401", 4, Decimal("92.0"), Decimal("21000000"), 4, "AVAILABLE"),
            (bld_objs[0].id, "P501", 5, Decimal("115.0"), Decimal("26000000"), 5, "OCCUPIED"),

            # Tòa 2: Sunshine Riverside Complex (Quận 1)
            (bld_objs[1].id, "A101", 1, Decimal("60.0"), Decimal("13500000"), 3, "OCCUPIED"),
            (bld_objs[1].id, "A201", 2, Decimal("75.0"), Decimal("17000000"), 4, "AVAILABLE"),
            (bld_objs[1].id, "A202", 2, Decimal("82.0"), Decimal("18500000"), 4, "OCCUPIED"),
            (bld_objs[1].id, "A301", 3, Decimal("48.0"), Decimal("10500000"), 2, "RESERVED"),
            (bld_objs[1].id, "A302", 3, Decimal("68.0"), Decimal("15000000"), 3, "AVAILABLE"),
            (bld_objs[1].id, "A401", 4, Decimal("105.0"), Decimal("24000000"), 4, "OCCUPIED"),

            # Tòa 3: Sunshine City View (Bình Thạnh)
            (bld_objs[2].id, "B101", 1, Decimal("45.0"), Decimal("9500000"), 2, "AVAILABLE"),
            (bld_objs[2].id, "B102", 1, Decimal("52.0"), Decimal("11500000"), 2, "OCCUPIED"),
            (bld_objs[2].id, "B201", 2, Decimal("63.0"), Decimal("13000000"), 3, "AVAILABLE"),
            (bld_objs[2].id, "B202", 2, Decimal("70.0"), Decimal("14500000"), 3, "OCCUPIED"),
            (bld_objs[2].id, "B301", 3, Decimal("58.0"), Decimal("12000000"), 2, "MAINTENANCE"),

            # Tòa 4: Sunshine Park Residences (Cầu Giấy, Hà Nội)
            (bld_objs[3].id, "C101", 1, Decimal("55.0"), Decimal("10000000"), 2, "OCCUPIED"),
            (bld_objs[3].id, "C102", 1, Decimal("68.0"), Decimal("13500000"), 3, "AVAILABLE"),
            (bld_objs[3].id, "C201", 2, Decimal("80.0"), Decimal("16000000"), 4, "OCCUPIED"),
            (bld_objs[3].id, "C202", 2, Decimal("90.0"), Decimal("18000000"), 4, "AVAILABLE"),
            (bld_objs[3].id, "C301", 3, Decimal("42.0"), Decimal("8500000"), 2, "AVAILABLE"),
        ]
        apt_map = {}
        for bid, rnum, flr, area, price, max_occ, status in apts_data:
            a = db.query(Apartment).filter(Apartment.building_id == bid, Apartment.room_number == rnum).first()
            if not a:
                a = Apartment(
                    building_id=bid,
                    room_number=rnum,
                    floor=flr,
                    area_sqm=area,
                    price=price,
                    max_occupants=max_occ,
                    status=status
                )
                db.add(a)
                db.flush()
            else:
                a.floor = flr
                a.area_sqm = area
                a.price = price
                a.max_occupants = max_occ
                a.status = status
                db.flush()
            apt_map[rnum] = a
        db.commit()

        # -------------------------------------------------------------
        # 5. AMENITIES (Tiện nghi trang thiết bị nội thất căn hộ)
        # -------------------------------------------------------------
        amenities_seed = [
            (apt_map["P101"].id, "Điều hòa Daikin Inverter 12000BTU (x2)", "Daikin", "DK-2024-9912", "GOOD"),
            (apt_map["P101"].id, "Tủ lạnh 2 cánh Inverter 320L", "Panasonic", "PN-320L-44", "GOOD"),
            (apt_map["P101"].id, "Bếp từ đôi Hafele HC-IS772EA", "Hafele", "HF-IS772", "GOOD"),
            (apt_map["P101"].id, "Khóa cửa thông minh vân tay Smart Lock", "Yale", "YL-YDM4109", "GOOD"),
            (apt_map["P101"].id, "Máy giặt sấy lồng ngang 9kg", "Electrolux", "EL-9000X", "GOOD"),
            (apt_map["P102"].id, "Điều hòa Daikin Inverter 18000BTU", "Daikin", "DK-18000", "GOOD"),
            (apt_map["P102"].id, "Tủ lạnh Side-by-Side 540L", "Samsung", "SS-540SBS", "GOOD"),
            (apt_map["P201"].id, "Điều hòa LG Dual Inverter 9000BTU", "LG", "LG-9000D", "GOOD"),
            (apt_map["P202"].id, "Điều hòa âm trần nối ống gió Multi", "Mitsubishi", "MS-MULTI", "GOOD"),
            (apt_map["P202"].id, "Máy rửa bát Bosch Serie 6", "Bosch", "BS-SMS68", "GOOD"),
            (apt_map["P301"].id, "Điều hòa Casper Inverter", "Casper", "CP-1200", "MAINTENANCE"),
            (apt_map["P302"].id, "Điều hòa Daikin Inverter 12000BTU", "Daikin", "DK-P302", "GOOD"),
            (apt_map["P501"].id, "Hệ thống điều hòa trung tâm VRV Daikin", "Daikin", "DK-VRV5", "GOOD"),
            (apt_map["P501"].id, "Bếp từ đôi Bosch & Lò nướng âm tủ", "Bosch", "BS-OVEN7", "GOOD"),
            (apt_map["A101"].id, "Điều hòa Panasonic 12000BTU", "Panasonic", "PN-A101", "GOOD"),
            (apt_map["A202"].id, "Điều hòa Daikin 2 chiều Inverter", "Daikin", "DK-A202", "GOOD"),
            (apt_map["A401"].id, "Tủ lạnh Hitachi Inverter 580L", "Hitachi", "HT-580", "GOOD"),
            (apt_map["B102"].id, "Điều hòa Gree Inverter 9000BTU", "Gree", "GR-B102", "GOOD"),
            (apt_map["B202"].id, "Bếp từ đôi Sunhouse & Hút mùi", "Sunhouse", "SH-B202", "GOOD"),
            (apt_map["C101"].id, "Điều hòa Daikin Inverter 12000BTU", "Daikin", "DK-C101", "GOOD"),
            (apt_map["C201"].id, "Điều hòa âm trần nối ống gió", "Mitsubishi", "MS-C201", "GOOD"),
        ]
        for aid, aname, abrand, aserial, astatus in amenities_seed:
            ex_am = db.query(Amenity).filter(Amenity.apartment_id == aid, Amenity.name == aname).first()
            if not ex_am:
                db.add(Amenity(
                    apartment_id=aid,
                    name=aname,
                    brand=abrand,
                    serial_number=aserial,
                    condition_status=astatus
                ))
        db.commit()

        # -------------------------------------------------------------
        # 6. TENANTS (12 Khách thuê đại diện cư dân có thật)
        # -------------------------------------------------------------
        tenants_data = [
            ("Nguyễn Văn An", "079095001234", "0912.888.999", "tenant@dwell.vn", "Hà Nội", False, user_objs["tenant"].id),
            ("Trần Thị Bích", "079096005678", "0933.111.222", "bich.tran@gmail.com", "Đà Nẵng", False, user_objs["tenant2"].id),
            ("Lê Hoàng Nam", "001201004567", "0908.112.233", "nam.le@gmail.com", "Hải Phòng", False, user_objs["tenant3"].id),
            ("Đỗ Thu Trang", "001202008899", "0915.667.788", "trang.do@gmail.com", "Hà Nội", False, user_objs["tenant4"].id),
            ("Phạm Minh Đức", "079097009876", "0944.333.444", "duc.pham@gmail.com", "TP.HCM", False, user_objs["tenant5"].id),
            ("Vũ Hoàng Long", "079098003456", "0989.123.789", "long.vu@gmail.com", "Nam Định", False, None),
            ("Phan Thị Mai", "079099007890", "0973.456.123", "mai.phan@gmail.com", "Cần Thơ", False, None),
            ("Đặng Quốc Bảo", "079100001234", "0962.333.222", "bao.dang@gmail.com", "Nghệ An", False, None),
            ("Bùi Phương Linh", "079101005678", "0937.888.777", "linh.bui@gmail.com", "Quảng Ninh", False, None),
            ("Hoàng Đức Trọng", "001203009988", "0904.555.666", "trong.hoang@gmail.com", "Hà Nội", False, None),
            ("Ngô Hải Yến", "001204001122", "0918.222.333", "yen.ngo@gmail.com", "Bắc Ninh", False, None),
            ("Dương Minh Khang", "079102008899", "0983.111.444", "khang.duong@gmail.com", "Bà Rịa - Vũng Tàu", False, None),
        ]
        tenant_map = {}
        for fname, cccd, phone, email, home, bad_debt, uid in tenants_data:
            t = db.query(Tenant).filter(Tenant.citizen_id == cccd).first()
            if not t:
                t = Tenant(
                    full_name=fname,
                    citizen_id=cccd,
                    phone=phone,
                    email=email,
                    hometown=home,
                    is_bad_debt=bad_debt,
                    user_id=uid
                )
                db.add(t)
                db.flush()
            else:
                t.full_name = fname
                t.phone = phone
                t.email = email
                t.hometown = home
                t.is_bad_debt = bad_debt
                t.user_id = uid
                db.flush()
            tenant_map[fname] = t
        db.commit()
        from app.routers.tenant import sync_users_and_tenants
        sync_users_and_tenants(db)

        # -------------------------------------------------------------
        # 7. ROOMMATES & EMERGENCY CONTACTS
        # -------------------------------------------------------------
        roommates_data = [
            (tenant_map["Nguyễn Văn An"].id, apt_map["P101"].id, "Nguyễn Văn Bình", "079095009999", "0912.777.666", "Em trai"),
            (tenant_map["Trần Thị Bích"].id, apt_map["P202"].id, "Trần Thảo Nhi", "079096008888", "0933.222.333", "Con gái"),
            (tenant_map["Lê Hoàng Nam"].id, apt_map["P302"].id, "Vũ Thu Hà", "001201004568", "0908.223.344", "Vợ"),
            (tenant_map["Đỗ Thu Trang"].id, apt_map["P501"].id, "Đỗ Minh Anh", "001202008898", "0915.889.900", "Em gái"),
            (tenant_map["Phạm Minh Đức"].id, apt_map["A101"].id, "Phạm Quỳnh Nga", "079097009877", "0944.555.666", "Vợ"),
            (tenant_map["Vũ Hoàng Long"].id, apt_map["A202"].id, "Trần Quốc Trung", "079098003457", "0989.456.789", "Bạn cùng phòng"),
            (tenant_map["Phan Thị Mai"].id, apt_map["A401"].id, "Phan Quốc Bảo", "079099007891", "0973.789.456", "Em trai"),
            (tenant_map["Bùi Phương Linh"].id, apt_map["B202"].id, "Nguyễn Thu Thảo", "079101005679", "0937.999.888", "Bạn cùng phòng"),
            (tenant_map["Ngô Hải Yến"].id, apt_map["C201"].id, "Ngô Thị Phương", "001204001123", "0918.333.444", "Em gái"),
        ]
        for tid, aid, rname, rcccd, rphone, rrel in roommates_data:
            ex_rm = db.query(Roommate).filter(Roommate.citizen_id == rcccd).first()
            if not ex_rm:
                db.add(Roommate(
                    tenant_id=tid,
                    apartment_id=aid,
                    full_name=rname,
                    citizen_id=rcccd,
                    phone=rphone,
                    relationship=rrel
                ))
        db.commit()

        emergency_contacts_data = [
            (tenant_map["Nguyễn Văn An"].id, "Nguyễn Văn Chung", "0909.555.444", "Bố"),
            (tenant_map["Trần Thị Bích"].id, "Trần Văn Hùng", "0903.666.777", "Chồng"),
            (tenant_map["Lê Hoàng Nam"].id, "Lê Văn Thành", "0913.445.566", "Bố"),
            (tenant_map["Đỗ Thu Trang"].id, "Đỗ Quốc Huy", "0912.334.455", "Anh trai"),
            (tenant_map["Phạm Minh Đức"].id, "Phạm Văn Cường", "0902.111.222", "Bố"),
            (tenant_map["Vũ Hoàng Long"].id, "Vũ Thị Mai", "0912.999.888", "Mẹ"),
            (tenant_map["Phan Thị Mai"].id, "Phan Văn Đạt", "0938.123.456", "Bố"),
            (tenant_map["Đặng Quốc Bảo"].id, "Đặng Thị Hoa", "0962.444.333", "Chị gái"),
            (tenant_map["Bùi Phương Linh"].id, "Bùi Văn Long", "0914.555.666", "Bố"),
            (tenant_map["Hoàng Đức Trọng"].id, "Hoàng Văn Tuấn", "0904.777.888", "Anh trai"),
            (tenant_map["Ngô Hải Yến"].id, "Ngô Văn Dũng", "0903.444.555", "Bố"),
        ]
        for tid, cname, cphone, crel in emergency_contacts_data:
            ex_ec = db.query(EmergencyContact).filter(EmergencyContact.tenant_id == tid, EmergencyContact.phone == cphone).first()
            if not ex_ec:
                db.add(EmergencyContact(
                    tenant_id=tid,
                    full_name=cname,
                    phone=cphone,
                    relationship=crel
                ))
        db.commit()

        # -------------------------------------------------------------
        # 8. CONTRACTS (14 Hợp đồng bao gồm ACTIVE, DRAFT, TERMINATED)
        # -------------------------------------------------------------
        today = date.today()

        def make_ai_summary(duration_str, price_str, deposit_str, special_note=""):
            return json.dumps({
                "term1_duration": duration_str,
                "term2_rentalPrice": f"Giá thuê cố định {price_str}/tháng, tiền đặt cọc {deposit_str} lưu ký an toàn.",
                "term3_paymentObligation": "Thanh toán cước phí căn hộ và dịch vụ từ ngày 01 đến ngày 10 hàng tháng qua cổng VietQR Napas247.",
                "term4_penalties": "Phạt chậm nộp 0.05%/ngày tính trên số dư nợ quá hạn.",
                "term5_termination": f"Thông báo trước tối thiểu 30 ngày qua Portal Cư Dân khi kết thúc hợp đồng. {special_note}"
            }, ensure_ascii=False)

        contracts_data = [
            # 1. P101 - Nguyễn Văn An (ACTIVE)
            ("HD-2026-P101", apt_map["P101"].id, tenant_map["Nguyễn Văn An"].id,
             today - timedelta(days=60), today + timedelta(days=305),
             Decimal("14000000"), Decimal("28000000"), "ACTIVE",
             make_ai_summary("Thời hạn 12 tháng, ưu tiên tái ký ổn định giá.", "14.000.000 VNĐ", "28.000.000 VNĐ")),

            # 2. P202 - Trần Thị Bích (ACTIVE - Sắp hết hạn sau 19 ngày để test SQ03 & Cảnh báo)
            ("HD-2025-P202", apt_map["P202"].id, tenant_map["Trần Thị Bích"].id,
             today - timedelta(days=346), today + timedelta(days=19),
             Decimal("19000000"), Decimal("38000000"), "ACTIVE",
             make_ai_summary("Thời hạn 12 tháng - SẮP HẾT HẠN TRONG 19 NGÀY.", "19.000.000 VNĐ", "38.000.000 VNĐ", "Cần kích hoạt thủ tục gia hạn SQ03.")),

            # 3. P302 - Lê Hoàng Nam (ACTIVE)
            ("HD-2026-P302", apt_map["P302"].id, tenant_map["Lê Hoàng Nam"].id,
             today - timedelta(days=90), today + timedelta(days=275),
             Decimal("17500000"), Decimal("35000000"), "ACTIVE",
             make_ai_summary("Thời hạn 12 tháng.", "17.500.000 VNĐ", "35.000.000 VNĐ")),

            # 4. P501 - Đỗ Thu Trang (ACTIVE - Penthouse)
            ("HD-2026-P501", apt_map["P501"].id, tenant_map["Đỗ Thu Trang"].id,
             today - timedelta(days=45), today + timedelta(days=320),
             Decimal("26000000"), Decimal("52000000"), "ACTIVE",
             make_ai_summary("Hợp đồng Penthouse cao cấp 12 tháng.", "26.000.000 VNĐ", "52.000.000 VNĐ")),

            # 5. A101 - Phạm Minh Đức (ACTIVE)
            ("HD-2026-A101", apt_map["A101"].id, tenant_map["Phạm Minh Đức"].id,
             today - timedelta(days=120), today + timedelta(days=245),
             Decimal("13500000"), Decimal("27000000"), "ACTIVE",
             make_ai_summary("Thời hạn 12 tháng.", "13.500.000 VNĐ", "27.000.000 VNĐ")),

            # 6. A202 - Vũ Hoàng Long (ACTIVE)
            ("HD-2026-A202", apt_map["A202"].id, tenant_map["Vũ Hoàng Long"].id,
             today - timedelta(days=30), today + timedelta(days=335),
             Decimal("18500000"), Decimal("37000000"), "ACTIVE",
             make_ai_summary("Thời hạn 12 tháng.", "18.500.000 VNĐ", "37.000.000 VNĐ")),

            # 7. A401 - Phan Thị Mai (ACTIVE)
            ("HD-2026-A401", apt_map["A401"].id, tenant_map["Phan Thị Mai"].id,
             today - timedelta(days=150), today + timedelta(days=215),
             Decimal("24000000"), Decimal("48000000"), "ACTIVE",
             make_ai_summary("Thời hạn 12 tháng căn góc 3PN.", "24.000.000 VNĐ", "48.000.000 VNĐ")),

            # 8. B102 - Đặng Quốc Bảo (ACTIVE)
            ("HD-2026-B102", apt_map["B102"].id, tenant_map["Đặng Quốc Bảo"].id,
             today - timedelta(days=75), today + timedelta(days=290),
             Decimal("11500000"), Decimal("23000000"), "ACTIVE",
             make_ai_summary("Thời hạn 12 tháng.", "11.500.000 VNĐ", "23.000.000 VNĐ")),

            # 9. B202 - Bùi Phương Linh (ACTIVE)
            ("HD-2026-B202", apt_map["B202"].id, tenant_map["Bùi Phương Linh"].id,
             today - timedelta(days=40), today + timedelta(days=325),
             Decimal("14500000"), Decimal("29000000"), "ACTIVE",
             make_ai_summary("Thời hạn 12 tháng.", "14.500.000 VNĐ", "29.000.000 VNĐ")),

            # 10. C101 - Hoàng Đức Trọng (ACTIVE)
            ("HD-2026-C101", apt_map["C101"].id, tenant_map["Hoàng Đức Trọng"].id,
             today - timedelta(days=100), today + timedelta(days=265),
             Decimal("10000000"), Decimal("20000000"), "ACTIVE",
             make_ai_summary("Thời hạn 12 tháng.", "10.000.000 VNĐ", "20.000.000 VNĐ")),

            # 11. C201 - Ngô Hải Yến (DRAFT - Chờ duyệt & thu cọc kích hoạt)
            ("HD-2026-C201", apt_map["C201"].id, tenant_map["Ngô Hải Yến"].id,
             today, today + timedelta(days=365),
             Decimal("16000000"), Decimal("32000000"), "DRAFT",
             make_ai_summary("Bản thảo hợp đồng chờ khách ký điện tử và nộp cọc.", "16.000.000 VNĐ", "32.000.000 VNĐ")),

            # 12. P102 - Khách mới (DRAFT)
            ("HD-2026-P102", apt_map["P102"].id, tenant_map["Nguyễn Văn An"].id,
             today + timedelta(days=5), today + timedelta(days=370),
             Decimal("16500000"), Decimal("33000000"), "DRAFT",
             make_ai_summary("Bản thảo thuê thêm văn phòng làm việc.", "16.500.000 VNĐ", "33.000.000 VNĐ")),

            # 13. B101 - Dương Minh Khang (TERMINATED - Đã thanh lý SQ04)
            ("HD-2024-B101", apt_map["B101"].id, tenant_map["Dương Minh Khang"].id,
             today - timedelta(days=400), today - timedelta(days=35),
             Decimal("9500000"), Decimal("19000000"), "TERMINATED",
             make_ai_summary("Hợp đồng đã thanh lý hoàn tất thủ tục bàn giao.", "9.500.000 VNĐ", "19.000.000 VNĐ")),

            # 14. C301 - Khách cũ (TERMINATED)
            ("HD-2024-C301", apt_map["C301"].id, tenant_map["Hoàng Đức Trọng"].id,
             today - timedelta(days=500), today - timedelta(days=135),
             Decimal("8500000"), Decimal("17000000"), "TERMINATED",
             make_ai_summary("Hợp đồng đã hết hạn và hoàn cọc 100%.", "8.500.000 VNĐ", "17.000.000 VNĐ")),
        ]
        contract_map = {}
        for ccode, aid, tid, sdate, edate, rprice, damount, st, aisum in contracts_data:
            c = db.query(Contract).filter(Contract.contract_code == ccode).first()
            if not c:
                c = Contract(
                    contract_code=ccode,
                    apartment_id=aid,
                    tenant_id=tid,
                    start_date=sdate,
                    end_date=edate,
                    rental_price=rprice,
                    deposit_amount=damount,
                    status=st,
                    created_by=user_objs["admin"].id,
                    approved_by=user_objs["admin"].id,
                    ai_summary=aisum
                )
                db.add(c)
                db.flush()
            else:
                c.apartment_id = aid
                c.tenant_id = tid
                c.start_date = sdate
                c.end_date = edate
                c.rental_price = rprice
                c.deposit_amount = damount
                c.status = st
                c.ai_summary = aisum
                db.flush()
            contract_map[ccode] = c
        db.commit()

        # -------------------------------------------------------------
        # 9. DEPOSITS (Tương ứng với từng hợp đồng)
        # -------------------------------------------------------------
        for ccode, c in contract_map.items():
            dep = db.query(Deposit).filter(Deposit.contract_id == c.id).first()
            if c.status == "ACTIVE":
                dst = "HELD"
                refund = Decimal("0")
                deduction = Decimal("0")
                dreason = None
            elif c.status == "DRAFT":
                dst = "PENDING"
                refund = Decimal("0")
                deduction = Decimal("0")
                dreason = None
            else: # TERMINATED
                dst = "REFUNDED"
                deduction = Decimal("1500000") if "B101" in ccode else Decimal("0")
                dreason = "Khấu trừ chi phí sơn lại tường phòng ngủ bị trầy xước" if deduction > 0 else None
                refund = c.deposit_amount - deduction

            if not dep:
                dep = Deposit(
                    contract_id=c.id,
                    amount=c.deposit_amount,
                    status=dst,
                    paid_date=c.start_date if dst in ["HELD", "REFUNDED"] else None,
                    refund_amount=refund,
                    deduction_amount=deduction,
                    deduction_reason=dreason,
                    handled_by=user_objs["accountant"].id
                )
                db.add(dep)
            else:
                dep.amount = c.deposit_amount
                dep.status = dst
                dep.refund_amount = refund
                dep.deduction_amount = deduction
                dep.deduction_reason = dreason
                dep.handled_by = user_objs["accountant"].id
        db.commit()

        # -------------------------------------------------------------
        # 10. RECEIVABLES & PAYMENTS (Kỳ T08, T09, T10 chuẩn hóa nghiệp vụ)
        # -------------------------------------------------------------
        curr_m = today.month
        curr_y = today.year
        prev_m = 12 if curr_m == 1 else curr_m - 1
        prev_y = curr_y - 1 if curr_m == 1 else curr_y
        next_m = 1 if curr_m == 12 else curr_m + 1
        next_y = curr_y + 1 if curr_m == 12 else curr_y

        active_contracts = [
            ("P101", "HD-2026-P101", Decimal("14000000"), Decimal("1500000")),
            ("P202", "HD-2025-P202", Decimal("19000000"), Decimal("2100000")),
            ("P302", "HD-2026-P302", Decimal("17500000"), Decimal("1700000")),
            ("P501", "HD-2026-P501", Decimal("26000000"), Decimal("2500000")),
            ("A101", "HD-2026-A101", Decimal("13500000"), Decimal("1500000")),
            ("A202", "HD-2026-A202", Decimal("18500000"), Decimal("2000000")),
            ("A401", "HD-2026-A401", Decimal("24000000"), Decimal("2800000")),
            ("B102", "HD-2026-B102", Decimal("11500000"), Decimal("1300000")),
            ("B202", "HD-2026-B202", Decimal("14500000"), Decimal("1700000")),
            ("C101", "HD-2026-C101", Decimal("10000000"), Decimal("1200000")),
        ]

        # 1. Hóa đơn Tháng trước (TẤT CẢ ĐÃ THANH TOÁN PAID 100%)
        for rnum, ccode, rprice, sfee in active_contracts:
            c = contract_map[ccode]
            tot = rprice + sfee
            rec_prev = db.query(Receivable).filter(
                Receivable.contract_id == c.id,
                Receivable.billing_month == prev_m,
                Receivable.billing_year == prev_y
            ).first()
            if not rec_prev:
                rec_prev = Receivable(
                    contract_id=c.id,
                    apartment_id=c.apartment_id,
                    billing_month=prev_m,
                    billing_year=prev_y,
                    room_amount=rprice,
                    service_amount=sfee,
                    total_amount=tot,
                    paid_amount=tot,
                    status="PAID",
                    due_date=date(prev_y, prev_m, 10)
                )
                db.add(rec_prev)
                db.flush()

                p = Payment(
                    receivable_id=rec_prev.id,
                    amount=tot,
                    payment_method="BANK_TRANSFER",
                    transaction_code=f"MB-{prev_y}{prev_m:02d}-{c.id:03d}",
                    note=f"Chuyển khoản tiền phòng và dịch vụ tháng {prev_m}/{prev_y}",
                    handled_by=user_objs["accountant"].id,
                    payment_date=datetime(prev_y, prev_m, 8, 10, 30)
                )
                db.add(p)

        # 2. Hóa đơn Tháng hiện tại (T09/2026 - Phân bổ trạng thái phong phú)
        rec_status_spec = {
            "P101": ("PAID", Decimal("1.0")),               # Trả đủ 100%
            "P202": ("OVERDUE", Decimal("0.0")),            # Quá hạn 16 ngày (Test Kế toán & AI Dunning)
            "P302": ("PAID", Decimal("1.0")),               # Trả đủ 100%
            "P501": ("PARTIALLY_PAID", Decimal("0.5")),     # Trả 50%
            "A101": ("UNPAID", Decimal("0.0")),             # Chưa trả (đến hạn 10/10)
            "A202": ("PAID", Decimal("1.0")),               # Trả đủ qua VietQR
            "A401": ("PAID", Decimal("1.0")),               # Trả đủ
            "B102": ("OVERDUE", Decimal("0.0")),            # Quá hạn 6 ngày
            "B202": ("UNPAID", Decimal("0.0")),             # Chưa trả
            "C101": ("PAID", Decimal("1.0")),               # Trả đủ
        }

        rec_curr_map = {}
        for rnum, ccode, rprice, sfee in active_contracts:
            c = contract_map[ccode]
            tot = rprice + sfee
            st, pay_ratio = rec_status_spec.get(rnum, ("UNPAID", Decimal("0")))
            paid_amt = Decimal(str(round(float(tot * pay_ratio))))
            due_d = today - timedelta(days=16) if st == "OVERDUE" and rnum == "P202" else (
                today - timedelta(days=6) if st == "OVERDUE" else date(curr_y, curr_m, 10)
            )

            rec_curr = db.query(Receivable).filter(
                Receivable.contract_id == c.id,
                Receivable.billing_month == curr_m,
                Receivable.billing_year == curr_y
            ).first()

            if not rec_curr:
                rec_curr = Receivable(
                    contract_id=c.id,
                    apartment_id=c.apartment_id,
                    billing_month=curr_m,
                    billing_year=curr_y,
                    room_amount=rprice,
                    service_amount=sfee,
                    total_amount=tot,
                    paid_amount=paid_amt,
                    status=st,
                    due_date=due_d
                )
                db.add(rec_curr)
                db.flush()
            else:
                rec_curr.total_amount = tot
                rec_curr.paid_amount = paid_amt
                rec_curr.status = st
                rec_curr.due_date = due_d
                db.flush()

            rec_curr_map[rnum] = rec_curr

            if paid_amt > Decimal("0"):
                existing_p = db.query(Payment).filter(Payment.receivable_id == rec_curr.id).first()
                if not existing_p:
                    p = Payment(
                        receivable_id=rec_curr.id,
                        amount=paid_amt,
                        payment_method="VIETQR" if rnum in ["P101", "A202"] else "BANK_TRANSFER",
                        transaction_code=f"VQR-{curr_y}{curr_m:02d}-{c.id:03d}",
                        note=f"Thanh toán cước phí tháng {curr_m}/{curr_y} căn {rnum}",
                        handled_by=user_objs["accountant"].id,
                        payment_date=datetime(curr_y, curr_m, 5, 14, 20)
                    )
                    db.add(p)

        # 3. Hóa đơn Tháng tới (T10/2026 - UNPAID để test ResidentPortal thanh toán VietQR)
        for rnum in ["P101", "P302"]:
            c = contract_map[f"HD-2026-{rnum}"]
            rprice = c.rental_price
            sfee = Decimal("1650000")
            tot = rprice + sfee

            rec_next = db.query(Receivable).filter(
                Receivable.contract_id == c.id,
                Receivable.billing_month == next_m,
                Receivable.billing_year == next_y
            ).first()
            if not rec_next:
                rec_next = Receivable(
                    contract_id=c.id,
                    apartment_id=c.apartment_id,
                    billing_month=next_m,
                    billing_year=next_y,
                    room_amount=rprice,
                    service_amount=sfee,
                    total_amount=tot,
                    paid_amount=Decimal("0"),
                    status="UNPAID",
                    due_date=date(next_y, next_m, 10)
                )
                db.add(rec_next)
        db.commit()

        # -------------------------------------------------------------
        # 11. RECALCULATE DEBT LEDGERS (Đồng bộ sổ nợ 100% khớp hóa đơn)
        # -------------------------------------------------------------
        for t in tenant_map.values():
            recalculate_debt(t.id, db)
        db.commit()

        # -------------------------------------------------------------
        # 12. MAINTENANCE REQUESTS (6 phiếu bảo trì thực tế)
        # -------------------------------------------------------------
        maintenances_data = [
            (apt_map["P101"].id, tenant_map["Nguyễn Văn An"].id, "Nguyễn Văn An", "0912.888.999",
             "Vòi sen tắm bị rò rỉ nước ở gioăng cao su cần thay mới", "MEDIUM", "IN_PROGRESS",
             user_objs["staff"].id, Decimal("150000")),

            (apt_map["P202"].id, tenant_map["Trần Thị Bích"].id, "Trần Thị Bích", "0933.111.222",
             "Điều hòa phòng ngủ chính làm mát kém, cần vệ sinh lưới lọc và nạp gas R32", "HIGH", "PENDING",
             None, Decimal("0")),

            (apt_map["P301"].id, None, "Ban Quản Lý Tòa Nhà", "0904.123.456",
             "Sửa chữa chống thấm trần thạch cao ban công trước khi bàn giao phòng mới", "MEDIUM", "COMPLETED",
             user_objs["staff"].id, Decimal("450000")),

            (apt_map["A101"].id, tenant_map["Phạm Minh Đức"].id, "Phạm Minh Đức", "0944.333.444",
             "Khóa cửa vân tay thông minh báo pin yếu và chập chờn khi nhận diện", "MEDIUM", "PENDING",
             None, Decimal("0")),

            (apt_map["A401"].id, tenant_map["Phan Thị Mai"].id, "Phan Thị Mai", "0973.456.123",
             "Bảo dưỡng vệ sinh máy rửa bát Bosch Serie 6 định kỳ", "LOW", "IN_PROGRESS",
             user_objs["staff"].id, Decimal("200000")),

            (apt_map["B301"].id, None, "Kỹ thuật vận hành Dwell", "0912.234.567",
             "Thay toàn bộ bóng đèn LED âm trần phòng khách và kiểm tra aptomat", "LOW", "COMPLETED",
             user_objs["staff"].id, Decimal("180000")),
        ]
        for aid, tid, rname, rphone, rdesc, rpri, rstat, astaff, rcost in maintenances_data:
            ex_m = db.query(MaintenanceRequest).filter(
                MaintenanceRequest.apartment_id == aid,
                MaintenanceRequest.issue_description == rdesc
            ).first()
            if not ex_m:
                db.add(MaintenanceRequest(
                    apartment_id=aid,
                    tenant_id=tid,
                    reporter_name=rname,
                    phone=rphone,
                    issue_description=rdesc,
                    priority=rpri,
                    status=rstat,
                    assigned_staff_id=astaff,
                    repair_cost=rcost
                ))
        db.commit()

        # -------------------------------------------------------------
        # 13. BOOKINGS (4 Đơn đặt phòng và giữ chỗ từ khách tham quan)
        # -------------------------------------------------------------
        bookings_data = [
            ("BK-202609-8888", "Trần Văn Hùng", "0977.888.999", "hung.tran@gmail.com",
             apt_map["P201"].id, today + timedelta(days=7), Decimal("5000000"), "CONFIRMED",
             "Khách đã đặt cọc giữ chỗ 5 triệu VNĐ qua chuyển khoản Napas247, hẹn ký hợp đồng"),

            ("BK-202609-9999", "Lê Mỹ Dung", "0988.777.666", "mydung.le@gmail.com",
             apt_map["A301"].id, today + timedelta(days=14), Decimal("2000000"), "CONFIRMED",
             "Đã cọc giữ chỗ 2 triệu VNĐ, dọn vào đầu tháng sau"),

            ("BK-202609-7777", "Ngô Văn Lâm", "0903.111.444", "lam.ngo@gmail.com",
             apt_map["P102"].id, today + timedelta(days=3), Decimal("0"), "PENDING",
             "Hẹn xem thực tế căn hộ vào 10:00 sáng Thứ 7 tuần này"),

            ("BK-202609-6666", "Võ Thị Yến", "0914.888.222", "yen.vo@gmail.com",
             apt_map["B201"].id, today + timedelta(days=5), Decimal("0"), "PENDING",
             "Khách quan tâm căn 2PN ban công hướng Đông"),
        ]
        for bcode, cname, cphone, cemail, aid, cdate, damt, bst, bnote in bookings_data:
            ex_b = db.query(Booking).filter(Booking.booking_code == bcode).first()
            if not ex_b:
                db.add(Booking(
                    booking_code=bcode,
                    customer_name=cname,
                    customer_phone=cphone,
                    customer_email=cemail,
                    apartment_id=aid,
                    check_in_date=cdate,
                    deposit_amount=damt,
                    status=bst,
                    notes=bnote
                ))
        db.commit()

        # -------------------------------------------------------------
        # 14. SYSTEM ALERTS (Cảnh báo quá hạn & hợp đồng sắp hết hạn)
        # -------------------------------------------------------------
        rec_p202 = rec_curr_map.get("P202")
        if rec_p202:
            ex_alt1 = db.query(SystemAlert).filter(
                SystemAlert.alert_type == "OVERDUE_RECEIVABLE",
                SystemAlert.reference_id == rec_p202.id
            ).first()
            if not ex_alt1:
                db.add(SystemAlert(
                    alert_type="OVERDUE_RECEIVABLE",
                    reference_id=rec_p202.id,
                    message=f"Khoản thu #{rec_p202.id} (Tháng {rec_p202.billing_month}/{rec_p202.billing_year}) của căn P202 đã quá hạn 16 ngày. Số nợ cần thu: 21.100.000 VNĐ.",
                    is_sent=False
                ))

        rec_b102 = rec_curr_map.get("B102")
        if rec_b102:
            ex_alt2 = db.query(SystemAlert).filter(
                SystemAlert.alert_type == "OVERDUE_RECEIVABLE",
                SystemAlert.reference_id == rec_b102.id
            ).first()
            if not ex_alt2:
                db.add(SystemAlert(
                    alert_type="OVERDUE_RECEIVABLE",
                    reference_id=rec_b102.id,
                    message=f"Khoản thu #{rec_b102.id} (Tháng {rec_b102.billing_month}/{rec_b102.billing_year}) của căn B102 đã quá hạn 6 ngày. Số nợ cần thu: 12.800.000 VNĐ.",
                    is_sent=False
                ))

        c_p202 = contract_map.get("HD-2025-P202")
        if c_p202:
            ex_alt3 = db.query(SystemAlert).filter(
                SystemAlert.alert_type == "EXPIRING_CONTRACT",
                SystemAlert.reference_id == c_p202.id
            ).first()
            if not ex_alt3:
                db.add(SystemAlert(
                    alert_type="EXPIRING_CONTRACT",
                    reference_id=c_p202.id,
                    message=f"Hợp đồng HD-2025-P202 (Cư dân: Trần Thị Bích - Căn P202) sẽ hết hạn sau 19 ngày (ngày {c_p202.end_date.strftime('%d/%m/%Y')}).",
                    is_sent=False
                ))
        db.commit()

        # -------------------------------------------------------------
        # 15. DOCUMENT CHUNKS (RAG Knowledge Base)
        # -------------------------------------------------------------
        seed_default_document_chunks(db)

        print("=============================================================")
        print(">>> HOÀN TẤT ĐỒNG BỘ DỮ LIỆU TOÀN DIỆN THÀNH CÔNG RỰC RỠ!")
        print(">>> CSDL hiện tại: 4 Tòa nhà, 24 Căn hộ, 12 Cư dân, 14 Hợp đồng,")
        print(">>> 14 Tiền cọc, 30+ Khoản thu, Sổ nợ, Bảo trì & Bookings chuẩn 100%!")
        print("=============================================================")

    except Exception as e:
        db.rollback()
        print("LỖI KHI NẠP DỮ LIỆU:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
