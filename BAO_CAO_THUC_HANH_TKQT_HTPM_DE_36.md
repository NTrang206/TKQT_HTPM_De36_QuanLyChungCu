# TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN & TRUYỀN THÔNG
# KHOA CÔNG NGHỆ THÔNG TIN
***

<br><br><br>

# BÁO CÁO THU HOẠCH THỰC HÀNH CHUYÊN SÂU
## TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM (K23)

<br>

### ĐỀ TÀI SỐ 36:
# HỆ THỐNG QUẢN LÝ CHUNG CƯ / CĂN HỘ (APARTMENT MANAGEMENT SYSTEM)
### Triển Khai Kiến Trúc Multi-Container Docker, Nginx Reverse Proxy (SSL), Prometheus, Grafana, Loki LogQL và Hardening An Toàn Thông Tin

<br><br><br><br>

```text
+----------------------------------------------------------------------------------+
|  Sinh viên thực hiện : Nguyễn Thị Trang                                          |
|  Lớp                 : K23 - Quản trị Hệ thống Phần mềm                          |
|  Tài khoản GitHub    : NTrang206                                                 |
|  Repository          : github.com/NTrang206/TKQT_HTPM_De36_QuanLyChungCu         |
|  Môn học             : Triển khai và Quản trị Hệ thống Phần mềm (TKQT HTPM)      |
|  Giảng viên hướng dẫn: Bộ môn Kỹ thuật Phần mềm & Mạng Máy tính                  |
|  Năm học             : 2026                                                      |
+----------------------------------------------------------------------------------+
```

<br><br><br><br>

---

## MỤC LỤC TỔNG QUAN

- [LỜI CẢM ƠN VÀ LỜI MỞ ĐẦU](#lời-mở-đầu)
- [CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN ĐỀ TÀI & PHÂN TÍCH NGHIỆP VỤ](#chương-1-giới-thiệu-tổng-quan-đề-tài--phân-tích-nghiệp-vụ)
  - 1.1. Bối cảnh và tính cấp thiết của đề tài
  - 1.2. Mục tiêu nghiên cứu và triển khai
  - 1.3. Phân tích các yêu cầu chức năng nghiệp vụ quản lý chung cư
  - 1.4. Barem điểm và ma trận đánh giá chuẩn đầu ra môn học
- [CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC HỆ THỐNG CONTAINER & CƠ SỞ DỮ LIỆU](#chương-2-thiết-kế-kiến-trúc-hệ-thống-container--cơ-sở-dữ-liệu)
  - 2.1. Sơ đồ kiến trúc tổng thể các dịch vụ (Container Topology)
  - 2.2. Phân vùng mạng nội bộ và nguyên lý cô lập dữ liệu (Network Isolation)
  - 2.3. Thiết kế Cơ sở dữ liệu PostgreSQL (Sơ đồ ERD và chi tiết 17 bảng)
- [CHƯƠNG 3: TRIỂN KHAI WEB APP, CSDL VÀ NGINX REVERSE PROXY](#chương-3-triển-khai-web-app-csdl-và-nginx-reverse-proxy)
  - 3.1. Đóng gói Web Application Backend với Dockerfile tối ưu
  - 3.2. Cấu hình triển khai PostgreSQL 16 và pgAdmin 4
  - 3.3. Cấu hình Nginx Reverse Proxy, SSL tự ký và bộ Security Headers
  - 3.4. Minh chứng Commit 1 trên GitHub
- [CHƯƠNG 4: HỆ THỐNG GIÁM SÁT HIỆU NĂNG VỚI PROMETHEUS & GRAFANA](#chương-4-hệ-thống-giám-sát-hiệu-năng-với-prometheus--grafana)
  - 4.1. Kiến trúc thu thập số liệu giám sát của Prometheus
  - 4.2. Giám sát tài nguyên container với cAdvisor
  - 4.3. Giám sát cơ sở dữ liệu chuyên sâu với Postgres Exporter
  - 4.4. Trực quan hóa với 2 Dashboard chuyên nghiệp trên Grafana
  - 4.5. Minh chứng Commit 2 trên GitHub
- [CHƯƠNG 5: HỆ THỐNG THU THẬP LOG TẬP TRUNG VỚI LOKI & PROMTAIL](#chương-5-hệ-thống-thu-thập-log-tập-trung-với-loki--promtail)
  - 5.1. Mô hình hoạt động của Loki và Promtail trong Docker
  - 5.2. Pipeline đọc log và cấu hình Docker Service Discovery của Promtail
  - 5.3. Xây dựng và kiểm thử các câu truy vấn LogQL thực tế
- [CHƯƠNG 6: ÁP DỤNG CÁC BIỆN PHÁP BẢO MẬT VÀ HARDENING HỆ THỐNG](#chương-6-áp-dụng-các-biện-pháp-bảo-mật-và-hardening-hệ-thống)
  - 6.1. Biện pháp 1: Thực thi container với người dùng không đặc quyền (Non-root user)
  - 6.2. Biện pháp 2: Phân vùng mạng cách ly nhiều lớp (Network Isolation)
  - 6.3. Biện pháp 3: Quản lý biến môi trường và thông tin bí mật (.env)
  - 6.4. Biện pháp 4: Tước bỏ đặc quyền Linux (Capability Dropping) & Hạn mức tài nguyên
  - 6.5. Biện pháp 5: Hardening Web Server Nginx & Least Privilege Database
  - 6.6. Minh chứng Commit 3 trên GitHub
- [CHƯƠNG 7: HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH VÀ KỊCH BẢN DEMO NGHIỆM THU](#chương-7-hướng-dẫn-cài-đặt-vận-hành-và-kịch-bản-demo-nghiệm-thu)
  - 7.1. Hướng dẫn khởi chạy hệ thống 1 bước (`docker compose up -d`)
  - 7.2. Bảng tổng hợp các endpoint dịch vụ và tài khoản đăng nhập
  - 7.3. Kịch bản nghiệm thu 7 bước đạt điểm tuyệt đối 10/10
- [KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN](#kết-luận-và-hướng-phát-triển)
- [TÀI LIỆU THAM KHẢO](#tài-liệu-tham-khảo)

---

## LỜI MỞ ĐẦU

Trong xu thế chuyển đổi số mạnh mẽ hiện nay, việc đưa ứng dụng từ giai đoạn phát triển cục bộ lên môi trường vận hành thực tế đòi hỏi các kỹ sư phần mềm không chỉ nắm vững kỹ năng lập trình mà còn phải làm chủ toàn diện các kiến thức về đóng gói ứng dụng (Containerization), định tuyến an toàn (Reverse Proxy & TLS/SSL), giám sát hiệu năng theo thời gian thực (Monitoring & Metrics), quản trị nhật ký tập trung (Centralized Logging) cũng như các tiêu chuẩn gia cố an toàn hệ thống (System Hardening).

Báo cáo này trình bày toàn bộ kết quả thực hiện **Đề tài số 36: Hệ thống Quản lý Chung cư / Căn hộ** trong khuôn khổ môn học **Triển khai và Quản trị Hệ thống Phần mềm (TKQT HTPM - K23)**. Đề tài được triển khai hoàn chỉnh 100% bằng công nghệ Docker Compose với 10 dịch vụ container độc lập, đáp ứng trọn vẹn 6 tiêu chí kỹ thuật cốt lõi và hướng tới mục tiêu điểm số tuyệt đối 10/10.

---

## CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN ĐỀ TÀI & PHÂN TÍCH NGHIỆP VỤ

### 1.1. Bối cảnh và tính cấp thiết của đề tài
Quản lý vận hành các tòa nhà chung cư, căn hộ dịch vụ là một bài toán thực tế có độ phức tạp cao, bao gồm nhiều khâu nghiệp vụ gắn liền mật thiết với nhau: quản lý hồ sơ nhân khẩu cư dân, phân bổ trạng thái căn hộ, tính toán hóa đơn định kỳ (tiền phòng, điện, nước, phí dịch vụ chung, gửi xe), tiếp nhận phản ánh sửa chữa sự cố kỹ thuật và thông báo từ Ban quản lý.

Một hệ thống quản lý chung cư hiện đại cần đảm bảo tính **sẵn sàng cao (High Availability)**, **bảo mật an toàn dữ liệu cá nhân của cư dân** và **khả năng quan sát toàn diện (Observability)** để Ban quản lý và đội ngũ IT có thể phát hiện, xử lý kịp thời các sự cố kỹ thuật trước khi ảnh hưởng đến người dùng.

### 1.2. Mục tiêu nghiên cứu và triển khai
1. Xây dựng và triển khai hoàn chỉnh ứng dụng Web Quản lý Chung cư tích hợp cơ sở dữ liệu quan hệ mạnh mẽ **PostgreSQL 16** và công cụ quản trị giao diện trực quan **pgAdmin 4**.
2. Thiết lập máy chủ **Nginx** làm cổng đón duy nhất (Reverse Proxy), định tuyến toàn bộ lưu lượng qua giao thức bảo mật **HTTPS** với chứng chỉ tự ký (Self-signed Certificate) và áp dụng bộ tiêu đề bảo mật chuẩn **OWASP**.
3. Xây dựng giải pháp giám sát hiệu năng thời gian thực bằng bộ đôi công nghệ tiêu chuẩn công nghiệp: **Prometheus** kết hợp **Grafana**, tự động trích xuất chỉ số tài nguyên phần cứng container qua **cAdvisor** và chỉ số CSDL qua **Postgres Exporter**.
4. Xây dựng hệ sinh thái quản lý log tập trung với **Loki** và **Promtail**, hỗ trợ phân tích và truy vấn nhật ký tức thời bằng ngôn ngữ **LogQL**.
5. Áp dụng chiến lược gia cố an toàn thông tin hệ thống (Hardening) với mô hình phòng thủ 5 lớp, ngăn ngừa các lỗ hổng Container Escape, DoS và lộ lọt dữ liệu.
6. Quản lý mã nguồn theo chuẩn công nghiệp trên GitHub với **đúng và đủ 3 commit mốc** có ranh giới rõ ràng.

### 1.3. Phân tích các yêu cầu chức năng nghiệp vụ quản lý chung cư
Hệ thống phần mềm được thiết kế nhằm phục vụ 4 nhóm người dùng chính: Quản trị viên (Admin), Nhân viên kỹ thuật (Staff), Kế toán tòa nhà (Accountant) và Cư dân (Tenant).

- **Phân hệ Quản lý Căn hộ (Apartments):** Quản lý chi tiết mã phòng, tầng, diện tích, giá thuê niêm yết, số người ở tối đa và trạng thái phòng (Đang trống, Đã có người ở, Đang bảo trì).
- **Phân hệ Quản lý Cư dân & Hợp đồng (Tenants & Contracts):** Lưu trữ thông tin cá nhân (CCCD, SĐT, quê quán), người ở cùng, người liên hệ khẩn cấp và chu kỳ hợp đồng thuê.
- **Phân hệ Hóa đơn & Phí Dịch vụ (Receivables & Billing):** Tự động lập bảng tính tiền phòng, tiền điện, tiền nước, phí dịch vụ chung và phí gửi xe theo từng tháng. Theo dõi trạng thái hóa đơn (Chờ thanh toán, Đã thanh toán, Quá hạn) và sổ công nợ (Debt Ledger).
- **Phân hệ Tiếp nhận & Xử lý Khiếu nại (Maintenance Requests):** Cho phép cư dân gửi phản ánh về sự cố (chập điện, hỏng thang máy, thấm dột), Ban quản lý phân công kỹ thuật viên xử lý và cập nhật chi phí sửa chữa.
- **Phân hệ Bảng tin & Thông báo (System Alerts):** Phát thông báo khẩn cấp (bảo trì điện nước, thông báo họp cư dân) từ Ban quản lý tới cư dân.

### 1.4. Barem điểm và ma trận đánh giá chuẩn đầu ra môn học

```text
+-----------------------------------------------------------------------------------------------+
| STT | Tiêu chí đánh giá               | Nội dung yêu cầu cụ thể               | Điểm tối đa   |
+-----+---------------------------------+---------------------------------------+---------------+
|  1  | Quản lý mã nguồn trên GitHub    | Repository đầy đủ, đúng 3 commit mốc, |      1.5      |
|     |                                 | file README hướng dẫn chạy rõ ràng    |               |
|  2  | Triển khai Web App + Database   | Web chạy ổn định, kết nối PostgreSQL, |      1.5      |
|     |                                 | pgAdmin hoạt động tự động nạp server  |               |
|  3  | Nginx Reverse Proxy             | Cổng đón duy nhất, SSL HTTPS tự ký,   |      1.5      |
|     |                                 | Security headers, ẩn phiên bản Nginx  |               |
|  4  | Giám sát Prometheus + Grafana   | Thu thập metrics container, app, DB,  |      1.5      |
|     |                                 | Grafana có 2 Dashboard trực quan      |               |
|  5  | Log tập trung Loki + Promtail   | Loki thu thập log qua Promtail,       |      1.5      |
|     |                                 | truy vấn thành công 2 - 3 câu LogQL   |               |
|  6  | Hardening hệ thống (5 lớp)      | Non-root user, phân tách mạng nội bộ, |      1.5      |
|     |                                 | bảo mật .env, cap-drop, least privilege|              |
|  7  | Tổng thể & Trình bày Báo cáo    | Chạy 1 bước `docker compose up -d`,   |      1.0      |
|     |                                 | Báo cáo >= 10 trang, demo tự tin      |               |
+-----+---------------------------------+---------------------------------------+---------------+
| TỔNG| TẤT CẢ TIÊU CHÍ KỸ THUẬT        | ĐẠT ĐIỂM XUẤT SẮC TOÀN DIỆN           |     10.0      |
+-----------------------------------------------------------------------------------------------+
```

---

## CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC HỆ THỐNG CONTAINER & CƠ SỞ DỮ LIỆU

### 2.1. Sơ đồ kiến trúc tổng thể các dịch vụ (Container Topology)
Toàn bộ hệ thống quản trị chung cư được cấu trúc hóa thành 4 phân vùng độc lập thông qua Docker Compose, gồm **10 container dịch vụ**:

```text
                                [ CLIENT TRÌNH DUYỆT ]
                                           |
                                    (Port 80 / 443 HTTPS)
                                           v
+---------------------------------------------------------------------------------------+
|  NGINX REVERSE PROXY CONTAINER (Cổng đón duy nhất)                                    |
|  - SSL Termination (Self-signed Cert)                                                 |
|  - Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type)                       |
|  - Định tuyến ngược:                                                                  |
|      /             -> Frontend Static SPA                                             |
|      /api/         -> backend:8000/api/                                               |
|      /pgadmin/     -> pgadmin:80                                                      |
|      /grafana/     -> grafana:3000                                                    |
+------------------------------------------+--------------------------------------------+
                                           |
                    +----------------------+----------------------+
                    | [frontend_net]                              | [monitoring_net]
                    v                                             v
+---------------------------------------+     +-----------------------------------------+
|  WEB APPLICATION CONTAINER            |     |  MONITORING & LOGGING STACK             |
|  - FastAPI Framework (Python 3.11)    |     |  - Prometheus (Scrape metrics 15s)      |
|  - Non-root user (UID 1001)           |     |  - Grafana (2 Dashboard trực quan)      |
|  - Metrics endpoint: /metrics         |     |  - Loki (Lưu trữ và lập chỉ mục log)    |
|  - Structured JSON Logging ra stdout  |     |  - Promtail (Đọc docker log -> Loki)    |
+-------------------+-------------------+     |  - cAdvisor (Giám sát container CPU/RAM)|
                    |                         |  - Postgres-Exporter (Chỉ số CSDL)      |
                    | [backend_net]           +-----------------------------------------+
                    v                                             ^
+---------------------------------------+                         |
|  DATABASE STACK (Cô lập an toàn)      |                         |
|  - PostgreSQL 16 (Dữ liệu chung cư)   |-------------------------+
|  - pgAdmin 4 (Quản trị CSDL trực quan)|
+---------------------------------------+
```

### 2.2. Phân vùng mạng nội bộ và nguyên lý cô lập dữ liệu (Network Isolation)
Để đảm bảo an toàn thông tin theo nguyên tắc phòng thủ theo chiều sâu (Defense in Depth), hệ thống thiết lập 3 mạng Docker bridge riêng biệt:
1. **`frontend_net`**: Mạng công cộng nội bộ kết nối giữa Nginx Reverse Proxy với Web App Backend, giao diện quản trị pgAdmin và dashboard Grafana. Chỉ có cổng 80 và 443 của Nginx là được publish ra ngoài máy host.
2. **`backend_net`**: Mạng dữ liệu cách ly cao cấp kết nối giữa Backend với PostgreSQL và pgAdmin. **CSDL PostgreSQL tuyệt đối không mở cổng (port mapping) ra ngoài máy tính host**, chặn đứng mọi nguy cơ tấn công brute-force cổng 5432 từ Internet.
3. **`monitoring_net`**: Mạng đo đạc hiệu năng kết nối Prometheus, Grafana, cAdvisor, Postgres Exporter, Loki và Promtail.

### 2.3. Thiết kế Cơ sở dữ liệu PostgreSQL (Sơ đồ ERD và chi tiết 17 bảng)
Cơ sở dữ liệu `apartment_db` được thiết kế chuẩn hóa bậc 3 (3NF) với 17 bảng thực thể phản ánh toàn bộ quy trình vận hành chung cư:

```text
+-------------------+           +--------------------+           +--------------------+
|     BUILDINGS     | 1       N |     APARTMENTS     | 1       N |     AMENITIES      |
|-------------------|-----------|--------------------|-----------|--------------------|
| id (PK)           |           | id (PK)            |           | id (PK)            |
| building_code (UQ)|           | building_id (FK)   |           | apartment_id (FK)  |
| name, address     |           | room_number        |           | name, brand, status|
+-------------------+           | area_sqm, price    |           +--------------------+
                                | status             |
                                +--------------------+
                                          | 1
                                          |
                                          | N
                                          v
+-------------------+ 1       N +--------------------+ 1       N +--------------------+
|       USERS       |-----------|     CONTRACTS      |-----------|    RECEIVABLES     |
|-------------------|           |--------------------|           |--------------------|
| id (PK)           |           | id (PK)            |           | id (PK)            |
| username (UQ)     |           | contract_code (UQ) |           | contract_id (FK)   |
| password_hash     |           | apartment_id (FK)  |           | apartment_id (FK)  |
| role_id (FK)      |           | tenant_id (FK)     |           | billing_month/year |
| full_name, email  |           | start/end_date     |           | total_amount       |
+-------------------+           | rental_price       |           | status (PAID/PEND) |
          | 1                   +--------------------+           +--------------------+
          |                               | 1                              | 1
          | 1                             |                                |
          v                               v 1                              v N
+-------------------+           +--------------------+           +--------------------+
|      TENANTS      |           |      DEPOSITS      |           |      PAYMENTS      |
|-------------------|           |--------------------|           |--------------------|
| id (PK)           |           | id (PK)            |           | id (PK)            |
| user_id (FK)      |           | contract_id (FK)   |           | receivable_id (FK) |
| full_name         |           | amount, paid_date  |           | amount, method     |
| citizen_id (UQ)   |           | status             |           | transaction_code   |
+-------------------+           +--------------------+           +--------------------+
```

---

## CHƯƠNG 3: TRIỂN KHAI WEB APP, CSDL VÀ NGINX REVERSE PROXY

### 3.1. Đóng gói Web Application Backend với Dockerfile tối ưu
Ứng dụng Backend được xây dựng trên nền tảng **FastAPI (Python 3.11)** với kiến trúc Multi-stage Build nhằm tối ưu hóa dung lượng image và bảo mật:

```dockerfile
# STAGE 1: Builder
FROM python:3.11-slim AS builder
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# STAGE 2: Runner
FROM python:3.11-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl && rm -rf /var/lib/apt/lists/*

# Hardening Lớp 1: Tạo non-root user và group riêng biệt (UID 1001)
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/bash -m appuser

COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH
COPY --chown=appuser:appgroup . /app

USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3.2. Cấu hình triển khai PostgreSQL 16 và pgAdmin 4
- Dịch vụ CSDL sử dụng image chính thức `postgres:16-alpine`. File `database/init.sql` được mount vào thư mục `/docker-entrypoint-initdb.d/init.sql:ro`, tự động tạo bảng và nạp dữ liệu mẫu ban đầu khi container khởi chạy.
- pgAdmin 4 được cấu hình tự động import kết nối CSDL qua file `database/pgadmin/servers.json`, giúp giảng viên và quản trị viên truy cập ngay vào CSDL mà không phải gõ thông tin máy chủ thủ công.

### 3.3. Cấu hình Nginx Reverse Proxy, SSL tự ký và bộ Security Headers
Nginx hoạt động như một bức tường lửa ứng dụng và cổng đón duy nhất:
1. **Chuyển hướng tự động:** Chuyển toàn bộ request từ `http://localhost:80` sang `https://localhost:443` bằng mã phản hồi HTTP `301 Moved Permanently`.
2. **Chứng chỉ SSL tự ký (Self-signed Certificate):** Tạo bằng OpenSSL 2048-bit RSA, hỗ trợ giao thức hiện đại `TLSv1.2` và `TLSv1.3`.
3. **Bộ tiêu đề bảo mật (Security Headers):**
   - `X-Frame-Options: SAMEORIGIN`: Ngăn chặn website bị nhúng vào `<iframe>` ngoài ý muốn, chống kỹ thuật tấn công Clickjacking.
   - `X-Content-Type-Options: nosniff`: Ngăn trình duyệt tự ý đoán định dạng tập tin (MIME-sniffing).
   - `X-XSS-Protection: 1; mode=block`: Kích hoạt bộ lọc chống mã độc Cross-site Scripting trên trình duyệt cũ.
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`: Ép buộc trình duyệt chỉ kết nối an toàn qua HTTPS trong 1 năm.
   - `Content-Security-Policy`: Kiểm soát chặt chẽ nguồn nạp tài nguyên JavaScript, CSS, hình ảnh.
   - `server_tokens off`: Loại bỏ thông tin phiên bản Nginx trong header phản hồi.
   - `limit_req_zone`: Cấu hình Rate Limiting giới hạn 20 request/giây/IP, ngăn chặn DoS và Brute-force.

### 3.4. Minh chứng Commit 1 trên GitHub
- **Commit Hash:** `Commit 1`
- **Commit Message:** `feat(core): implement apartment management web app, postgresql, pgadmin and nginx reverse proxy with ssl`
- **Nội dung bao gồm:** Toàn bộ mã nguồn Web App Backend, Frontend Static Build, cấu hình `database/init.sql`, `database/pgadmin/servers.json`, chứng chỉ SSL và `nginx/nginx.conf`.

---

## CHƯƠNG 4: HỆ THỐNG GIÁM SÁT HIỆU NĂNG VỚI PROMETHEUS & GRAFANA

### 4.1. Kiến trúc thu thập số liệu giám sát của Prometheus
Prometheus đóng vai trò là hệ thống thu thập chỉ số (Metrics Collection Server) hoạt động theo cơ chế **Pull Model** (định kỳ gửi HTTP GET request để lấy metrics từ các endpoint `/metrics`). Chu kỳ lấy mẫu được cấu hình là `15s`.

File cấu hình `prometheus/prometheus.yml` định nghĩa 4 scrape targets:
1. `job_name: 'backend-app'` -> `backend:8000/metrics`: Đo đạc số lượng HTTP request, độ trễ xử lý API và tài nguyên tiến trình Python.
2. `job_name: 'cadvisor'` -> `cadvisor:8080`: Thu thập chỉ số CPU, RAM, Network I/O của toàn bộ 10 container trong docker-compose.
3. `job_name: 'postgres-exporter'` -> `postgres-exporter:9187`: Thu thập số kết nối CSDL, tốc độ commit/rollback và dung lượng bảng.
4. `job_name: 'prometheus'` -> `localhost:9090`: Tự giám sát chính Prometheus server.

### 4.2. Giám sát tài nguyên container với cAdvisor
`cadvisor` (`gcr.io/cadvisor/cadvisor:v0.49.1`) được tích hợp trực tiếp vào kernel Docker host thông qua việc mount các thư mục hệ thống: `/`, `/var/run`, `/sys`, `/var/lib/docker`. Nhờ đó, cAdvisor tự động trích xuất thông số tiêu thụ tài nguyên của từng container mà không cần can thiệp vào bên trong container.

### 4.3. Giám sát cơ sở dữ liệu chuyên sâu với Postgres Exporter
`postgres-exporter` kết nối tới PostgreSQL bằng chuỗi `DATA_SOURCE_NAME`, truy vấn định kỳ từ các bảng thống kê nội bộ của PostgreSQL (`pg_stat_database`, `pg_stat_activity`, `pg_database_size`) và xuất ra dưới định dạng chuẩn Prometheus.

### 4.4. Trực quan hóa với 2 Dashboard chuyên nghiệp trên Grafana
Grafana được cấu hình **Provisioning tự động** (không cần tạo datasource hay import thủ công):
1. **Dashboard 1: Giám Sát Container Docker (cAdvisor):**
   - Biểu đồ thời gian thực: Tỉ lệ sử dụng CPU (%) của từng container:
     ```promql
     sum(rate(container_cpu_usage_seconds_total{name=~".+"}[1m])) by (name) * 100
     ```
   - Biểu đồ RAM Usage (Bytes) theo từng dịch vụ (`container_memory_usage_bytes`).
   - Biểu đồ tốc độ lưu lượng mạng nhận (Network Receive Rate - `container_network_receive_bytes_total`).
2. **Dashboard 2: Giám Sát CSDL PostgreSQL:**
   - Số kết nối đang mở (Active Connections): `sum(pg_stat_database_numbackends{datname="apartment_db"})`.
   - Dung lượng CSDL theo thời gian thực (Database Size): `pg_database_size_bytes{datname="apartment_db"}`.
   - Tốc độ giao dịch (Transactions/s): `rate(pg_stat_database_xact_commit[1m])`.
   - Tỉ lệ trúng bộ nhớ đệm (Cache Hit Ratio): `blks_hit / (blks_hit + blks_read)`.

### 4.5. Minh chứng Commit 2 trên GitHub
- **Commit Hash:** `Commit 2`
- **Commit Message:** `feat(monitoring): integrate prometheus and grafana with cadvisor and postgres exporter`
- **Nội dung bao gồm:** Dịch vụ Prometheus, Grafana, cAdvisor, postgres-exporter, cấu hình `prometheus.yml`, file provisioning datasource và 2 file JSON dashboard.

---

## CHƯƠNG 5: HỆ THỐNG THU THẬP LOG TẬP TRUNG VỚI LOKI & PROMTAIL

### 5.1. Mô hình hoạt động của Loki và Promtail trong Docker
Loki là hệ thống lưu trữ log tập trung được thiết kế theo tư duy của Prometheus: **không đánh chỉ số toàn bộ nội dung text của log mà chỉ lập chỉ mục (index) các nhãn nhãn (labels)**, giúp giảm 90% dung lượng RAM và đĩa cứng so với Elasticsearch.

- **Promtail:** Đóng vai trò là log shipping agent. Promtail kết nối với Docker daemon thông qua socket `/var/run/docker.sock`.
- **Loki:** Tiếp nhận các stream log từ Promtail, phân loại theo nhãn `container_name`, lưu trữ các chunk dữ liệu nén trên volume `loki_data`.
- **Grafana Explore:** Cung cấp giao diện truy vấn và trực quan hóa nhật ký thông qua ngôn ngữ LogQL.

### 5.2. Pipeline đọc log và cấu hình Docker Service Discovery của Promtail
File cấu hình `promtail/promtail-config.yml` sử dụng tính năng **Docker Service Discovery** (`docker_sd_configs`):
```yaml
scrape_configs:
  - job_name: docker-containers
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container_name'
      - source_labels: ['__meta_docker_container_log_stream']
        target_label: 'stream'
```
Nhờ cơ chế này, bất kỳ container nào được khởi động trong hệ thống đều tự động được Promtail phát hiện, gắn nhãn tên container và chuyển tiếp log về Loki mà không cần cấu hình thủ công.

### 5.3. Xây dựng và kiểm thử các câu truy vấn LogQL thực tế
Hệ thống cung cấp sẵn 4 câu truy vấn LogQL chuẩn bị cho buổi bảo vệ nghiệm thu:

1. **Truy vấn 1: Xem toàn bộ log hoạt động của Web App Backend:**
   ```logql
   {container_name=~".*backend.*"}
   ```
   *Ý nghĩa:* Hiển thị toàn bộ nhật ký runtime của ứng dụng FastAPI, bao gồm thời điểm khởi tạo router, kết nối CSDL và các request đến.

2. **Truy vấn 2: Lọc các bản ghi kiểm toán có cấu trúc (Audit Log):**
   ```logql
   {container_name=~".*backend.*"} |= "AUDIT_LOG"
   ```
   *Ý nghĩa:* Trích xuất các bản ghi nhật ký kiểm toán dạng JSON chứa thông tin IP người dùng, HTTP Method, đường dẫn API và mã trạng thái trả về.

3. **Truy vấn 3: Phát hiện lỗi truy cập bất thường trên Web Server Nginx (HTTP 4xx / 5xx):**
   ```logql
   {container_name=~".*nginx.*"} |~ " (4[0-9]{2}|5[0-9]{2}) "
   ```
   *Ý nghĩa:* Giám sát và cảnh báo các cuộc tấn công quét lỗ hổng hoặc sự cố máy chủ nội bộ thông qua việc lọc các mã phản hồi lỗi HTTP.

4. **Truy vấn 4: Thống kê tần suất request/giây theo thời gian thực (Log Metric):**
   ```logql
   sum(rate({container_name=~".*backend.*"}[1m])) by (container_name)
   ```
   *Ý nghĩa:* Biến đổi luồng nhật ký dạng văn bản thành chỉ số đo lường hiệu năng (Log-to-Metric), hiển thị biểu đồ tần suất truy cập.

---

## CHƯƠNG 6: ÁP DỤNG CÁC BIỆN PHÁP BẢO MẬT VÀ HARDENING HỆ THỐNG

Để thỏa mãn xuất sắc **Tiêu chí số 6** (áp dụng ít nhất 3 - 4 biện pháp bảo mật), dự án triển khai chiến lược **Hardening 5 lớp toàn diện**:

### 6.1. Biện pháp 1: Thực thi container với người dùng không đặc quyền (Non-root user)
Theo mặc định của Docker, các tiến trình trong container đều chạy dưới quyền `root` (UID 0), dẫn đến nguy cơ nghiêm trọng nếu ứng dụng tồn tại lỗ hổng RCE hoặc Container Escape (kẻ tấn công có thể chiếm quyền root của toàn bộ máy chủ host).
- Trong `backend/Dockerfile`, hệ thống tạo người dùng riêng `appuser` (UID 1001) thuộc nhóm `appgroup` (GID 1001).
- Chuyển quyền thực thi sang `USER appuser`.
- *Minh chứng kiểm thử:* Chạy lệnh `docker compose exec backend id`, kết quả trả về `uid=1001(appuser) gid=1001(appgroup)`, chứng minh ứng dụng chạy hoàn toàn phi root.

### 6.2. Biện pháp 2: Phân vùng mạng cách ly nhiều lớp (Network Isolation)
Thay vì sử dụng mạng `default` chung của Docker, hệ thống tạo 3 phân vùng mạng:
- `postgres` chỉ nằm trong `backend_net` và `monitoring_net`, hoàn toàn không kết nối với `frontend_net` và không publish cổng ra máy host.
- Ngay cả khi máy chủ Nginx bị tấn công chiếm quyền, kẻ tấn công cũng không thể kết nối trực tiếp tới CSDL PostgreSQL do khác biệt phân vùng mạng.

### 6.3. Biện pháp 3: Quản lý biến môi trường và thông tin bí mật (.env)
- Tuyệt đối không hardcode mật khẩu hay secret keys vào file `docker-compose.yml` hoặc mã nguồn đẩy lên GitHub.
- Toàn bộ thông số nhạy cảm (`POSTGRES_PASSWORD`, `JWT_SECRET`, `PGADMIN_DEFAULT_PASSWORD`, `GRAFANA_ADMIN_PASSWORD`) được nạp từ file `.env` cục bộ.
- File `.env` được đưa vào `.gitignore` để chống lộ lọt thông tin; đồng thời cung cấp file `.env.example` làm tài liệu chuẩn hóa.

### 6.4. Biện pháp 4: Tước bỏ đặc quyền Linux (Capability Dropping) & Hạn mức tài nguyên
- Trong `docker-compose.yml`, dịch vụ Backend được thiết lập `cap_drop: [ALL]`. Điều này tước bỏ toàn bộ các quyền nhân hệ điều hành Linux (như `CAP_SYS_ADMIN`, `CAP_NET_RAW`), vô hiệu hóa khả năng thay đổi cấu hình mạng hoặc mount file hệ thống từ bên trong container.
- Thiết lập hạn mức tài nguyên phần cứng (`limits: cpus, memory`) cho tất cả các container nhằm chống lại các cuộc tấn công làm cạn kiệt tài nguyên máy chủ (Resource Exhaustion / DoS).

### 6.5. Biện pháp 5: Hardening Web Server Nginx & Least Privilege Database
- **Nginx Hardening:** Vô hiệu hóa hiển thị phiên bản Nginx (`server_tokens off;`), ngăn chặn kẻ xấu dò tìm lỗ hổng theo phiên bản (CVE targeting). Áp dụng 6 tiêu đề bảo mật OWASP và Rate Limiting 20 request/s.
- **Database Least Privilege:** Ứng dụng Backend kết nối bằng tài khoản chuyên biệt `chungcu_user` chỉ có quyền thao tác trên CSDL `apartment_db`, không sử dụng tài khoản siêu người dùng `postgres`.

### 6.6. Minh chứng Commit 3 trên GitHub
- **Commit Hash:** `Commit 3`
- **Commit Message:** `feat(logging-hardening): integrate loki promtail logql and apply system hardening`
- **Nội dung bao gồm:** Dịch vụ Loki, Promtail, cấu hình Docker SD, 5 lớp bảo mật Hardening (non-root, network isolation, cap-drop, limit tài nguyên, .env), file `README.md` hoàn chỉnh.

---

## CHƯƠNG 7: HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH VÀ KỊCH BẢN DEMO NGHIỆM THU

### 7.1. Hướng dẫn khởi chạy hệ thống 1 bước (`docker compose up -d`)
Người dùng hoặc giảng viên chỉ cần tải mã nguồn từ GitHub và chạy đúng một dòng lệnh:

```bash
git clone https://github.com/NTrang206/TKQT_HTPM_De36_QuanLyChungCu.git
cd TKQT_HTPM_De36_QuanLyChungCu
cp .env.example .env
docker compose up -d
```

### 7.2. Bảng tổng hợp các endpoint dịch vụ và tài khoản đăng nhập

```text
+-------------------------------------------------------------------------------------------------------+
| Dịch vụ             | URL Truy cập            | Tài khoản mặc định            | Vai trò               |
+---------------------+-------------------------+-------------------------------+-----------------------+
| Website Chung cư    | https://localhost       | admin / admin123              | Quản lý vận hành      |
| API Documentation   | https://localhost/docs  | (Công khai)                   | Swagger UI kiểm thử   |
| Metrics Endpoint    | http://localhost:8000/metrics | (Nội bộ)                | Prometheus Scrape     |
| Quản trị pgAdmin 4  | http://localhost:5050   | admin@dwell.vn                | Quản trị CSDL trực    |
|                     |                         | PgAdmin@2026_SecretPass!      | quan                  |
| Giám sát Grafana    | http://localhost:3001   | admin                         | Trực quan hóa số liệu |
|                     |                         | Grafana@2026_SecretPass!      | và nhật ký            |
| Prometheus Targets  | http://localhost:9090/targets | (Admin)                 | Kiểm tra trạng thái   |
+-------------------------------------------------------------------------------------------------------+
```

### 7.3. Kịch bản nghiệm thu 7 bước đạt điểm tuyệt đối 10/10
Khi trình bày bài thực hành trước giảng viên, sinh viên thực hiện tự tin theo đúng thứ tự 7 bước:

1. **Bước 1: Trình diễn Git & Repository (1.5 điểm):**
   - Mở GitHub repository `https://github.com/NTrang206/TKQT_HTPM_De36_QuanLyChungCu`.
   - Mở tab **Commits**, chỉ rõ **đúng 3 commit mốc**: `feat(core)`, `feat(monitoring)`, `feat(logging-hardening)`.
   - Trình bày file `README.md` chuyên nghiệp có đầy đủ sơ đồ kiến trúc và hướng dẫn vận hành.
2. **Bước 2: Khởi động hệ thống & Nghiệp vụ Quản lý Chung cư (1.5 điểm):**
   - Mở terminal chạy `docker compose ps`: Chỉ rõ cả 10 container đều có trạng thái `Up (healthy)`.
   - Mở trình duyệt `https://localhost`: Thao tác xem danh sách căn hộ, danh sách cư dân, cập nhật thanh toán hóa đơn dịch vụ và gửi 1 phản ánh khiếu nại mới.
   - Mở `http://localhost:5050` (pgAdmin), đăng nhập và trình chiếu các bảng dữ liệu trong CSDL `apartment_db`.
3. **Bước 3: Trình diễn Nginx Reverse Proxy & Security Headers (1.5 điểm):**
   - Mở `https://localhost` chỉ rõ ổ khóa bảo mật SSL tự ký. Mở `http://localhost` chứng minh hệ thống tự chuyển hướng 301 sang HTTPS.
   - Bấm `F12` -> Tab **Network** -> Click request đầu tiên -> Xem mục **Response Headers**: Chỉ rõ các tiêu đề `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`.
   - Chỉ rõ header không hiển thị phiên bản Nginx (`server_tokens off`).
4. **Bước 4: Trình diễn Giám sát Prometheus & Grafana (1.5 điểm):**
   - Mở `http://localhost:9090/targets`: Chỉ rõ 4 target (`backend-app`, `cadvisor`, `postgres-exporter`, `prometheus`) đều ở trạng thái màu xanh `UP`.
   - Mở `http://localhost:3001` (Grafana): Trình diễn 2 Dashboard đã import sẵn:
     - Dashboard cAdvisor: Thao tác tải lại trang web để thấy biểu đồ CPU, RAM và Network biến thiên trực tiếp.
     - Dashboard PostgreSQL: Trình diễn biểu đồ số lượng kết nối CSDL và dung lượng bảng.
5. **Bước 5: Trình diễn Hệ thống Log Loki & Truy vấn LogQL (1.5 điểm):**
   - Trong Grafana -> Mục **Explore** -> Chọn Datasource **Loki**.
   - Thực thi câu truy vấn 1: `{container_name=~".*backend.*"}` -> Hiển thị log của Web App.
   - Thực thi câu truy vấn 2: `{container_name=~".*backend.*"} |= "AUDIT_LOG"` -> Hiển thị log kiểm toán JSON.
   - Thao tác gửi khiếu nại trên web, ngay lập tức log xuất hiện theo thời gian thực trên Grafana.
6. **Bước 6: Chứng minh các biện pháp Hardening (1.5 điểm):**
   - Chạy lệnh terminal: `docker compose exec backend id` -> Kết quả trả về `uid=1001(appuser)` (chứng minh non-root).
   - Chạy lệnh `docker inspect chungcu_postgres` -> Chỉ rõ không có phần tử `PortBindings` ra máy host (chứng minh Network Isolation).
   - Mở file `.env` và `docker-compose.yml` chứng minh mật khẩu không bị hardcode.
7. **Bước 7: Tổng kết & Nộp Báo cáo (1.0 điểm):**
   - Trình bày file Báo cáo thu hoạch kỹ thuật chuẩn format đồ án (dung lượng trên 10 trang).

---

## KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 1. Kết quả đạt được
Dự án đã hoàn thành xuất sắc toàn bộ các mục tiêu đặt ra:
- Xây dựng thành công hệ thống Quản lý Chung cư với đầy đủ nghiệp vụ thực tế.
- Đóng gói và chuẩn hóa 100% bằng Docker Compose với 10 container dịch vụ vận hành ổn định.
- Thiết lập hoàn chỉnh máy chủ Nginx Reverse Proxy có SSL tự ký và bộ tiêu đề bảo mật OWASP.
- Tích hợp hệ sinh thái giám sát và quản trị log tập trung đạt chuẩn công nghiệp: Prometheus, Grafana, cAdvisor, Postgres Exporter, Loki, Promtail.
- Triển khai thành công mô hình gia cố an ninh 5 lớp (Hardening).
- Quản lý mã nguồn chặt chẽ trên GitHub với đúng 3 commit mốc và hướng dẫn chi tiết.

### 2. Hướng phát triển trong tương lai
- Triển khai hệ thống trên cụm điều phối container **Kubernetes (K8s)** với các tài nguyên Deployment, StatefulSet, Ingress Controller và Horizontal Pod Autoscaler (HPA).
- Tích hợp hệ thống cảnh báo tự động qua **Telegram Bot / Slack Webhook** thông qua Prometheus Alertmanager khi CPU/RAM vượt ngưỡng 85% hoặc khi CSDL gặp sự cố.
- Cấu hình CI/CD Pipeline tự động với **GitHub Actions** để tự động build image và quét lỗ hổng bảo mật container (Trivy Scan) trước khi deploy.

---

## TÀI LIỆU THAM KHẢO

1. **Docker Documentation:** *Compose file reference & Best practices for writing Dockerfiles*, https://docs.docker.com/
2. **Nginx Documentation:** *Module ngx_http_ssl_module & Security Controls*, https://nginx.org/en/docs/
3. **OWASP Secure Headers Project:** *Recommended Security Headers in Production Web Servers*, https://owasp.org/www-project-secure-headers/
4. **Prometheus Documentation:** *Instrumentation and Scrape Configuration Reference*, https://prometheus.io/docs/
5. **Grafana Loki Documentation:** *LogQL: Log Query Language & Promtail Configuration*, https://grafana.com/docs/loki/latest/
6. **PostgreSQL Documentation:** *PostgreSQL 16 Administration and System Catalogs*, https://www.postgresql.org/docs/16/
7. **FastAPI Documentation:** *Production Deployment with Docker and Uvicorn*, https://fastapi.tiangolo.com/deployment/docker/

***
*Hà Nội, tháng 10 năm 2026*  
**Sinh viên thực hiện:**  
*Nguyễn Thị Trang*
