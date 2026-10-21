# KẾ HOẠCH TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM
## ĐỀ TÀI 36: HỆ THỐNG QUẢN LÝ CHUNG CƯ / CĂN HỘ
**Môn học:** Triển khai và Quản trị Hệ thống Phần mềm (TKQT HTPM - K23)  
**Mục tiêu điểm số:** 10/10 (Thỏa mãn 100% tiêu chí đánh giá và yêu cầu kỹ thuật)

---

## MỤC LỤC TỔNG QUAN
1. [Phân Tích Đề Tài & Barem Điểm Chi Tiết](#1-phân-tích-đề-tài--barem-điểm-chi-tiết)
2. [Kiến Trúc Tổng Thể & Thiết Kế Hệ Thống (Docker Architecture)](#2-kiến-trúc-tổng-thể--thiết-kế-hệ-thống)
3. [Thiết Kế Cơ Sở Dữ Liệu PostgreSQL & Nghiệp Vụ Quản Lý Chung Cư](#3-thiết-kế-cơ-sở-dữ-liệu-postgresql--nghiệp-vụ)
4. [Chi Tiết 6 Tiêu Chí Kỹ Thuật Bắt Buộc](#4-chi-tiết-6-tiêu-chí-kỹ-thuật-bắt-buộc)
   - Tiêu chí 1: Quản lý mã nguồn trên GitHub & Chiến lược 3 Commit
   - Tiêu chí 2: Triển khai Web App + PostgreSQL + pgAdmin
   - Tiêu chí 3: Cấu hình Nginx Reverse Proxy (SSL Self-signed & Security Headers)
   - Tiêu chí 4: Hệ thống Giám sát Metrics (Prometheus + Grafana + Exporters)
   - Tiêu chí 5: Hệ thống Thu thập Log tập trung (Loki + Promtail + LogQL Queries)
   - Tiêu chí 6: Chiến lược Hardening Hệ thống (Bảo mật 5 lớp)
5. [Cấu Trúc Thư Mục Dự Án Chuẩn Hóa](#5-cấu-trúc-thư-mục-dự-án-chuẩn-hóa)
6. [Kế Hoạch & Lộ Trình Triển Khai Theo Từng Giai Đoạn (Sprint)](#6-kế-hoạch--lộ-trình-triển-khai-từng-giai-đoạn)
7. [Kịch Bản Demo Nghiệm Thu Đạt Điểm Tuyệt Đối](#7-kịch-bản-demo-nghiệm-thu-đạt-điểm-tuyệt-đối)
8. [Đề Cương & Dàn Ý Báo Cáo Kỹ Thuật (Tối Thiểu 10 Trang)](#8-đề-cương--dàn-ý-báo-cáo-kỹ-thuật-tối-thiểu-10-trang)

---

## 1. PHÂN TÍCH ĐỀ TÀI & BAREM ĐIỂM CHI TIẾT

### 1.1. Thông tin Đề tài 36
- **Tên đề tài:** Hệ thống Quản lý Chung cư / Căn hộ (Apartment Management System).
- **Phần mềm cần triển khai:** Website quản lý cư dân, phí dịch vụ, thông báo của Ban quản lý, tiếp nhận và xử lý khiếu nại.
- **Cơ sở dữ liệu:** PostgreSQL + pgAdmin.
- **Công nghệ triển khai:** 100% dịch vụ chạy trên Docker Container thông qua Docker Compose.

### 1.2. Barem Điểm và Ma Trận Đánh Giá (Thang Điểm 10)

| STT | Tiêu chí đánh giá | Nội dung yêu cầu cụ thể | Điểm tối đa |
|:---:|:---|:---|:---:|
| **1** | **Quản lý mã nguồn trên GitHub** | - Tạo tài khoản GitHub theo MSSV.<br>- Repository đầy đủ source code và toàn bộ cấu hình.<br>- Có **đúng và đủ 3 commit mốc** có ý nghĩa rõ ràng.<br>- File `README.md` chuyên nghiệp, hướng dẫn chạy chi tiết. | **1.5** |
| **2** | **Triển khai Ứng dụng + Database** | - Ứng dụng web chạy ổn định, giao diện trực quan.<br>- Kết nối PostgreSQL thành công, có dữ liệu mẫu thực tế.<br>- pgAdmin hoạt động ổn định, cấu hình sẵn kết nối. | **1.5** |
| **3** | **Nginx Reverse Proxy** | - Cấu hình Nginx làm cổng vào duy nhất (Reverse Proxy).<br>- Hỗ trợ HTTPS (chứng chỉ tự ký SSL/TLS).<br>- Cấu hình đầy đủ Security Headers cơ bản chống tấn công web. | **1.5** |
| **4** | **Giám sát Prometheus + Grafana** | - Prometheus scrape metrics container, web server, database.<br>- Grafana kết nối Prometheus, có dashboard trực quan hóa tài nguyên CPU/RAM, kết nối DB, HTTP traffic. | **1.5** |
| **5** | **Log tập trung Loki + Promtail** | - Loki nhận log từ Promtail cào tự động từ Docker container.<br>- Grafana truy vấn được log qua LogQL.<br>- Viết và demo thành công **ít nhất 2 - 3 câu truy vấn LogQL**. | **1.5** |
| **6** | **Hardening hệ thống** | - Áp dụng ít nhất **3 - 4 biện pháp bảo mật**:<br>  + Non-root user trong Dockerfile.<br>  + Phân vùng mạng (Network Isolation).<br>  + Mật khẩu mạnh & quản lý qua biến môi trường (.env).<br>  + Security headers và ẩn phiên bản Nginx.<br>  + Hạn chế đặc quyền (least privilege) người dùng DB. | **1.5** |
| **7** | **Tổng thể & Trình bày** | - Khởi động toàn bộ chỉ với `docker compose up -d`.<br>- Báo cáo tổng hợp **tối thiểu 10 trang**, đúng format chuẩn.<br>- Minh chứng screenshot rõ ràng, nắm vững kiến thức khi vấn đáp. | **1.0** |
| **TỔNG** | **TẤT CẢ TIÊU CHÍ** | **ĐẠT CHUẨN ĐẦU RA MÔN HỌC** | **10.0** |

---

## 2. KIẾN TRÚC TỔNG THỂ & THIẾT KẾ HỆ THỐNG

### 2.1. Sơ đồ Kiến trúc Các Dịch vụ (Container Topology)
Toàn bộ hệ thống được chia làm 4 khối phân quyền qua mạng Docker nội bộ:

```text
                                [ CLIENT / TRÌNH DUYỆT ]
                                           |
                                    (Port 80 / 443 HTTPS)
                                           v
+---------------------------------------------------------------------------------------+
|  NGINX REVERSE PROXY CONTAINER (Cổng đón duy nhất)                                    |
|  - SSL Termination (Self-signed Cert)                                                 |
|  - Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type)                       |
|  - Định tuyến ngược:                                                                  |
|      /             -> app:3000                                                        |
|      /pgadmin/     -> pgadmin:80                                                      |
|      /grafana/     -> grafana:3000                                                    |
+------------------------------------------+--------------------------------------------+
                                           |
                    +----------------------+----------------------+
                    | [frontend_net]                              | [monitoring_net]
                    v                                             v
+---------------------------------------+     +-----------------------------------------+
|  WEB APPLICATION CONTAINER            |     |  MONITORING & LOGGING STACK             |
|  - Quản lý Chung cư (NodeJS / Python) |     |  - Prometheus (Scrape metrics)          |
|  - Non-root user (UID 1001)           |     |  - Grafana (Dashboard trực quan)        |
|  - Metrics endpoint: /metrics         |     |  - Loki (Lưu trữ và lập chỉ mục log)    |
|  - Log format: JSON ra stdout         |     |  - Promtail (Đọc docker log -> Loki)    |
+-------------------+-------------------+     |  - cAdvisor / Node-Exporter (Container) |
                    |                         |  - Postgres-Exporter (DB metrics)       |
                    | [backend_net]           +-----------------------------------------+
                    v                                             ^
+---------------------------------------+                         |
|  DATABASE STACK (Cô lập an toàn)      |                         |
|  - PostgreSQL 16 (Căn hộ, Cư dân,...) |-------------------------+
|  - pgAdmin 4 (Quản trị DB trực quan)  |  (Scrape metrics qua backend_net / monitoring_net)
+---------------------------------------+
```

### 2.2. Danh sách Container & Phân Bổ Cổng (Port Mapping)

| Service Name | Image / Base | Vai trò | Internal Port | External Port (Host) | Mạng tham gia |
|---|---|---|---|---|---|
| **nginx** | `nginx:alpine` | Reverse proxy, SSL, Security | 80, 443 | `80:80`, `443:443` | `frontend_net` |
| **app** | `node:20-alpine` (Dockerfile) | Web Quản lý chung cư | 3000 | Không mở (chỉ qua Nginx) | `frontend_net`, `backend_net` |
| **postgres** | `postgres:16-alpine` | CSDL chính của hệ thống | 5432 | Không mở (chỉ qua app/pgadmin) | `backend_net` |
| **pgadmin** | `dpage/pgadmin4:latest` | Giao diện quản trị CSDL | 80 | `5050:80` (hoặc qua Nginx) | `backend_net`, `frontend_net` |
| **prometheus** | `prom/prometheus:v2.51.0` | Thu thập metrics hệ thống | 9090 | `9090:9090` (chỉ admin) | `monitoring_net`, `backend_net`, `frontend_net` |
| **grafana** | `grafana/grafana:10.4.0` | Dashboard giám sát | 3000 | `3001:3000` (hoặc qua Nginx) | `monitoring_net`, `frontend_net` |
| **loki** | `grafana/loki:2.9.4` | Lưu trữ log tập trung | 3100 | Không mở (chỉ nội bộ) | `monitoring_net` |
| **promtail** | `grafana/promtail:2.9.4` | Cào log container gửi về Loki | - | Host daemon | `monitoring_net` |
| **cadvisor** | `gcr.io/cadvisor/cadvisor:v0.49.1` | Giám sát tài nguyên container | 8080 | Không mở (chỉ Prometheus) | `monitoring_net` |
| **postgres_exporter** | `prometheuscommunity/postgres-exporter` | Metrics chuyên sâu Postgres | 9187 | Không mở (chỉ Prometheus) | `monitoring_net`, `backend_net` |

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL & NGHIỆP VỤ

### 3.1. Các Thực Thể Nghiệp Vụ Chính của Hệ Thống Chung Cư
1. **Căn hộ (Apartments):** Mã căn hộ (ví dụ: `P101`, `P102`), diện tích, tầng, số phòng ngủ, trạng thái (Đã có cư dân / Trống).
2. **Cư dân (Residents):** Họ tên, số điện thoại, CMND/CCCD, email, quan hệ (Chủ hộ / Thành viên / Khách thuê), ngày chuyển vào.
3. **Phí dịch vụ & Bảng giá (Service Types):** Phí quản lý chung cư, phí gửi xe máy/ô tô, tiền điện, tiền nước, phí gom rác.
4. **Hóa đơn hàng tháng (Invoices):** Tháng/năm, mã căn hộ, chi tiết các khoản phí, tổng tiền, hạn nộp, trạng thái (Chưa thanh toán / Đã thanh toán / Quá hạn).
5. **Thông báo từ BQL (Announcements):** Tiêu đề, nội dung, phạm vi áp dụng (Toàn tòa nhà / Từng tầng), mức độ ưu tiên (Bình thường / Khẩn cấp), ngày tạo.
6. **Phản ánh & Khiếu nại (Complaints):** Người gửi, căn hộ, nội dung phản ánh (Hư hỏng thang máy, ồn ào, thấm dột...), hình ảnh đính kèm, trạng thái (Mới tiếp nhận / Đang xử lý / Đã giải quyết), phản hồi của BQL.

### 3.2. Sơ đồ Quan hệ Thực thể (ERD Dạng Văn Bản)
```text
+-------------------+           +--------------------+
|    APARTMENTS     | 1       N |     RESIDENTS      |
|-------------------|-----------|--------------------|
| id (PK)           |           | id (PK)            |
| room_number (UQ)  |           | apartment_id (FK)  |
| floor             |           | full_name          |
| area_m2           |           | phone_number       |
| status            |           | is_household_head  |
+-------------------+           +--------------------+
          | 1                             | 1
          |                               |
          | N                             | N
          v                               v
+-------------------+           +--------------------+
|     INVOICES      |           |     COMPLAINTS     |
|-------------------|           |--------------------|
| id (PK)           |           | id (PK)            |
| apartment_id (FK) |           | resident_id (FK)   |
| billing_month     |           | title              |
| total_amount      |           | description        |
| payment_status    |           | status (PENDING/..) |
| created_at        |           | resolved_at        |
+-------------------+           +--------------------+
```

### 3.3. File Khởi Tạo CSDL Tự Động (`init.sql`)
Hệ thống sẽ mount file `init.sql` vào `/docker-entrypoint-initdb.d/init.sql` của PostgreSQL container để tự động tạo bảng và nạp dữ liệu mẫu thực tế khi container khởi động lần đầu.

---

## 4. CHI TIẾT 6 TIÊU CHÍ KỸ THUẬT BẮT BUỘC

### TIÊU CHÍ 1: QUẢN LÝ MÃ NGUỒN TRÊN GITHUB & CHIẾN LƯỢC 3 COMMIT (1.5 ĐIỂM)

- **Quy tắc đặt tên:**
  - Tài khoản GitHub: Đặt theo MSSV (ví dụ: `23001234` hoặc `sv-23001234`).
  - Tên Repository: `TKQT_HTPM_De36_QuanLyChungCu`.
- **Chiến lược 3 Commit mốc (Bắt buộc theo yêu cầu đề bài):**
  - **Commit 1:**
    - *Message:* `feat(core): implement apartment management web app, postgresql, pgadmin and nginx reverse proxy with ssl`
    - *Nội dung:* Mã nguồn Web App, cấu hình `docker-compose.yml` (App + Postgres + pgAdmin + Nginx), chứng chỉ SSL tự ký, Nginx reverse proxy và security headers.
  - **Commit 2:**
    - *Message:* `feat(monitoring): integrate prometheus and grafana with cadvisor and postgres exporter`
    - *Nội dung:* Bổ sung dịch vụ Prometheus, Grafana, cAdvisor, postgres-exporter; cấu hình `prometheus.yml`, datasource và provisioning dashboards cho Grafana.
  - **Commit 3:**
    - *Message:* `feat(logging-hardening): integrate loki promtail logql and apply system hardening`
    - *Nội dung:* Bổ sung Loki, Promtail; cấu hình cào log docker; cấu hình non-root user trong Dockerfile, phân tách Docker networks, thiết lập quyền hạn mức và hoàn thiện tài liệu hướng dẫn.
- **Tài liệu README.md:**
  - Giới thiệu tổng quan đề tài 36.
  - Hướng dẫn cài đặt 1 bước: `docker compose up -d`.
  - Danh sách URL và tài khoản đăng nhập mặc định.
  - Hướng dẫn kiểm tra và truy vấn LogQL, xem dashboard Grafana.

---

### TIÊU CHÍ 2: TRIỂN KHAI WEB APP + POSTGRESQL + PGADMIN (1.5 ĐIỂM)

- **Ngôn ngữ & Framework đề xuất:** **Node.js (Express.js)**
  - *Lý do:* Khởi động cực nhanh, tiêu thụ ít RAM (chỉ ~40-60MB), dễ viết middleware xuất log định dạng JSON ra stdout, tích hợp sẵn thư viện `prom-client` để xuất metrics `/metrics` chuẩn Prometheus.
- **Giao diện người dùng (UI):**
  - Giao diện Dashboard quản trị chung cư hiện đại, tông màu xanh navy / slate cao cấp.
  - 4 module hiển thị rõ ràng:
    1. Bảng điều khiển tổng quan (Số căn hộ, cư dân, số hóa đơn chưa thu, khiếu nại chờ xử lý).
    2. Quản lý danh sách cư dân & căn hộ (CRUD).
    3. Quản lý phí dịch vụ & thu tiền hóa đơn.
    4. Quản lý bảng thông báo và tiếp nhận khiếu nại.
- **Tích hợp pgAdmin 4:**
  - Cấu hình file `servers.json` và mount vào `/pgadmin4/servers.json` để tự động import kết nối đến PostgreSQL mà không cần giảng viên phải gõ host/password thủ công.

---

### TIÊU CHÍ 3: CẤU HÌNH NGINX REVERSE PROXY (1.5 ĐIỂM)

- **SSL/TLS Tự ký (Self-signed Certificate):**
  - Tạo chứng chỉ với OpenSSL:
    ```bash
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout nginx/ssl/nginx-selfsigned.key \
      -out nginx/ssl/nginx-selfsigned.crt \
      -subj "/C=VN/ST=HCM/L=HCM/O=ChungCuDev/OU=IT/CN=localhost"
    ```
- **Cấu hình Nginx (`nginx.conf`):**
  - Chuyển hướng tự động toàn bộ HTTP (Port 80) sang HTTPS (Port 443).
  - Tắt hiển thị phiên bản Nginx: `server_tokens off;`.
  - Cấu hình các **Security Headers chuẩn OWASP**:
    ```nginx
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: https:;" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    ```
  - Cấu hình Rate Limiting cơ bản để chống brute-force và DoS:
    ```nginx
    limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
    ```

---

### TIÊU CHÍ 4: HỆ THỐNG GIÁM SÁT PROMETHEUS + GRAFANA (1.5 ĐIỂM)

- **Prometheus (`prometheus.yml`):**
  - Cấu hình `scrape_interval: 15s`.
  - Scrape targets:
    1. `job_name: 'prometheus'` -> `localhost:9090`
    2. `job_name: 'cadvisor'` -> `cadvisor:8080` (Metrics CPU, RAM, Network của từng container)
    3. `job_name: 'postgres-exporter'` -> `postgres-exporter:9187` (Metrics kết nối DB, transactions, cache hit ratio)
    4. `job_name: 'apartment-app'` -> `app:3000` (HTTP request duration, request rate)
- **Grafana Provisioning:**
  - Tự động cấu hình Data Source Prometheus qua file `grafana/provisioning/datasources/prometheus.yml`.
  - Tự động import sẵn 2 Dashboards chuyên nghiệp:
    1. **Docker Container Monitoring (cAdvisor):** Đo CPU usage, Memory usage của 10 container trong docker-compose.
    2. **PostgreSQL Monitoring:** Đo số lượng active connection, transaction rate, database size.

---

### TIÊU CHÍ 5: HỆ THỐNG LOG TẬP TRUNG LOKI + PROMTAIL (1.5 ĐIỂM)

- **Loki & Promtail Workflow:**
  - Docker daemon ghi log container ra file JSON log mặc định (`/var/lib/docker/containers/*/*-json.log`).
  - Promtail mount volume thư mục log của Docker và file cấu hình `promtail-config.yml`.
  - Promtail trích xuất label `container_name`, loại bỏ ký tự rác và chuyển tiếp toàn bộ về endpoint `http://loki:3100/loki/api/v1/push`.
- **Danh sách câu truy vấn LogQL chuẩn bị sẵn cho buổi Demo (Tối thiểu 3 queries):**
  1. **Query 1 - Xem toàn bộ log của Web App Quản lý Chung cư:**
     ```logql
     {container_name=~".*app.*"}
     ```
  2. **Query 2 - Lọc các bản ghi log có chứa từ khóa lỗi hoặc khiếu nại:**
     ```logql
     {container_name=~".*app.*"} |= "ERROR" or |= "complaint"
     ```
  3. **Query 3 - Lọc log truy cập Nginx phát hiện mã lỗi HTTP 4xx hoặc 5xx:**
     ```logql
     {container_name=~".*nginx.*"} |~ " (4[0-9]{2}|5[0-9]{2}) "
     ```
  4. **Query 4 - Đếm tần suất request vào hệ thống (Log Rate Metric):**
     ```logql
     sum(rate({container_name=~".*app.*"}[1m])) by (container_name)
     ```

---

### TIÊU CHÍ 6: CHIẾN LƯỢC HARDENING HỆ THỐNG (BẢO MẬT 5 LỚP) (1.5 ĐIỂM)

Áp dụng đầy đủ và minh chứng rõ 5 biện pháp bảo mật:
1. **Non-Root Container:**
   - Trong Dockerfile của Web App, tạo user chuyên quyền không có quyền root:
     ```dockerfile
     RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001 -G nodejs
     USER appuser
     ```
   - Ngăn chặn nguy cơ Container Escape chiếm quyền host server.
2. **Phân Vùng Mạng (Network Isolation):**
   - Tạo 3 Docker Network riêng biệt:
     - `frontend_net`: Chỉ cho Nginx kết nối với Web App và Grafana.
     - `backend_net`: Chỉ cho Web App kết nối với PostgreSQL và pgAdmin. Database không giao tiếp trực tiếp với Internet.
     - `monitoring_net`: Prometheus kết nối cAdvisor, postgres-exporter, app để cào dữ liệu.
3. **Mật Khẩu Mạnh & Biến Môi Trường (.env):**
   - Tuyệt đối không hardcode mật khẩu trong `docker-compose.yml`.
   - Sử dụng file `.env` riêng biệt, sinh mật khẩu ngẫu nhiên trên 16 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt. Có sẵn file `.env.example`.
4. **Hạn Chế Đặc Quyền Linux (Capability Dropping) & Giới Hạn Tài Nguyên:**
   - Thêm cấu hình trong `docker-compose.yml`:
     ```yaml
     cap_drop:
       - ALL
     deploy:
       resources:
         limits:
           cpus: '0.50'
           memory: 256M
     ```
5. **Nginx Hardening & Database Least Privilege:**
   - Ẩn toàn bộ thông tin phiên bản server Nginx (`server_tokens off;`).
   - Tạo tài khoản DB riêng `chungcu_app` chỉ có quyền thao tác trên CSDL `apartment_db`, không sử dụng user `postgres` superuser trong ứng dụng.

---

## 5. CẤU TRÚC THƯ MỤC DỰ ÁN CHUẨN HÓA

```text
TKQT_HTPM_De36_QuanLyChungCu/
├── .env.example                       # File mẫu cấu hình biến môi trường
├── .env                               # File cấu hình bí mật thực tế (.gitignore)
├── .gitignore                         # Loại bỏ node_modules, .env, log
├── README.md                          # Tài liệu hướng dẫn sử dụng và kiểm thử
├── docker-compose.yml                 # File khởi chạy toàn bộ 10 dịch vụ
│
├── app/                               # Mã nguồn Web App Quản lý Chung cư
│   ├── Dockerfile                     # Dockerfile multi-stage, non-root user
│   ├── package.json                   # Dependencies: express, pg, prom-client...
│   ├── server.js                      # Entrypoint API & Web Server
│   ├── config/                        # Cấu hình kết nối DB
│   ├── public/                        # Static assets (CSS, JS, Icons)
│   ├── views/                         # Giao diện hiển thị (EJS / HTML)
│   └── routes/                        # Các API: cư dân, căn hộ, hóa đơn, khiếu nại
│
├── database/                          # Cấu hình CSDL PostgreSQL
│   └── init.sql                       # Schema tạo bảng và dữ liệu mẫu thực tế
│
├── nginx/                             # Cấu hình Nginx Reverse Proxy
│   ├── nginx.conf                     # Cấu hình định tuyến, SSL, Security Headers
│   └── ssl/                           # Thư mục chứa cert và key tự ký
│       ├── nginx-selfsigned.crt
│       └── nginx-selfsigned.key
│
├── prometheus/                        # Cấu hình hệ thống giám sát
│   └── prometheus.yml                 # Scrape configs cho cAdvisor, App, Postgres
│
├── grafana/                           # Cấu hình Dashboard trực quan
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   ├── prometheus.yml         # Tự động nạp datasource Prometheus
│   │   │   └── loki.yml               # Tự động nạp datasource Loki
│   │   └── dashboards/
│   │       └── dashboards.yml         # Tự động nạp danh sách dashboard
│   └── dashboards/
│       ├── docker-monitoring.json     # Dashboard cAdvisor giám sát container
│       └── postgres-monitoring.json   # Dashboard PostgreSQL metrics
│
├── loki/                              # Cấu hình hệ thống lưu trữ log
│   └── loki-config.yml                # Cấu hình lưu trữ và thời gian giữ log
│
└── promtail/                          # Cấu hình thu thập log
    └── promtail-config.yml            # Scrape config đọc docker container logs
```

---

## 6. KẾ HOẠCH & LỘ TRÌNH TRIỂN KHAI TỪNG GIAI ĐOẠN

Kế hoạch được chia thành 4 Sprint tuần tự, bám sát các mốc Commit:

```text
[Sprint 1: CSDL & Core Web App]
       |
       v
[Sprint 2: Nginx SSL & Reverse Proxy] ---------> [ COMMIT 1: CORE & PROXY ]
       |
       v
[Sprint 3: Prometheus + Grafana + Exporters] --> [ COMMIT 2: MONITORING ]
       |
       v
[Sprint 4: Loki + Promtail + Hardening] -------> [ COMMIT 3: LOGGING & HARDENING ]
       |
       v
[Sprint 5: Viết Báo Cáo >= 10 Trang & Demo] ---> [ BÁO CÁO HOÀN THÀNH (10/10) ]
```

### Sprint 1: Xây dựng CSDL và Ứng dụng Quản lý Chung cư (1.5 ngày)
- Khởi tạo thư mục dự án và Git repo.
- Thiết kế schema SQL (`init.sql`) đầy đủ bảng Căn hộ, Cư dân, Hóa đơn, Khiếu nại.
- Xây dựng Web App Node.js Express với giao diện trực quan, responsive.
- Tích hợp endpoint `/metrics` với thư viện `prom-client`.
- Viết `Dockerfile` tối ưu, sử dụng non-root user `appuser`.

### Sprint 2: Thiết lập Docker Compose, pgAdmin & Nginx Reverse Proxy (1 ngày)
- Viết file `docker-compose.yml` ghép nối App + PostgreSQL + pgAdmin.
- Sinh chứng chỉ SSL tự ký cho domain `localhost`.
- Cấu hình file `nginx.conf`: Reverse proxy cho App, cấu hình SSL 443 và các Security Headers.
- Kiểm tra truy cập `https://localhost` trên trình duyệt.
- **Thực hiện Commit 1 lên GitHub.**

### Sprint 3: Tích hợp Hệ thống Giám sát Metrics (1 ngày)
- Thêm dịch vụ `prometheus`, `grafana`, `cadvisor`, `postgres_exporter` vào `docker-compose.yml`.
- Soạn thảo `prometheus.yml` cào metrics từ tất cả các exporter.
- Cấu hình datasource Prometheus tự động trong Grafana.
- Thiết lập và xuất 2 dashboard JSON vào thư mục provisioning.
- **Thực hiện Commit 2 lên GitHub.**

### Sprint 4: Tích hợp Log tập trung và Triển khai Hardening (1.5 ngày)
- Thêm dịch vụ `loki` và `promtail` vào `docker-compose.yml`.
- Cấu hình Promtail đọc file log Docker container và gắn nhãn `container_name`.
- Cấu hình datasource Loki trong Grafana, kiểm thử các câu truy vấn LogQL.
- Áp dụng triệt để 5 biện pháp Hardening: non-root, network isolation, cap-drop, limit tài nguyên, mật khẩu mạnh qua `.env`.
- **Thực hiện Commit 3 lên GitHub.**

### Sprint 5: Soạn thảo Báo cáo Kỹ thuật & Tổng dượt Demo (1 ngày)
- Viết báo cáo tối thiểu 10 trang theo đúng đề cương chuẩn.
- Chụp ảnh minh chứng sắc nét từng tiêu chí.
- Kiểm tra tính độc lập của lệnh `docker compose up -d` trên môi trường sạch.

---

## 7. KỊCH BẢN DEMO NGHIỆM THU ĐẠT ĐIỂM TUYỆT ĐỐI

Khi giảng viên yêu cầu nghiệm thu bài thực hành, trình bày theo thứ tự 7 bước sau:

1. **Bước 1: Trình diễn Git & Repository (1.5 điểm)**
   - Mở GitHub repository cá nhân có tên theo MSSV.
   - Trình bày lịch sử commit: Chỉ rõ 3 commit mốc (Commit 1: Proxy/App, Commit 2: Monitoring, Commit 3: Loki & Hardening).
   - Trình bày file `README.md` rõ ràng, có sơ đồ kiến trúc và hướng dẫn cài đặt.
2. **Bước 2: Khởi động hệ thống & Nghiệp vụ Chung cư (1.5 điểm)**
   - Chạy lệnh `docker compose up -d` trong terminal, chỉ ra 10 container đều có trạng thái `Up` hoặc `healthy`.
   - Mở trình duyệt truy cập Web App Quản lý Chung cư:
     + Thao tác xem danh sách căn hộ, danh sách cư dân.
     + Thao tác đổi trạng thái hóa đơn dịch vụ thành "Đã thanh toán".
     + Gửi một phản ánh/khiếu nại mới từ cư dân (để tạo log kiểm thử).
   - Mở pgAdmin (`http://localhost:5050` hoặc đường dẫn quy định), đăng nhập và hiển thị dữ liệu bảng trong PostgreSQL.
3. **Bước 3: Trình diễn Nginx Reverse Proxy & Security (1.5 điểm)**
   - Truy cập qua `https://localhost` (có ổ khóa xanh/chứng chỉ tự ký).
   - Mở Developer Tools (F12) -> Tab Network -> Xem Response Headers: Chỉ rõ các header bảo mật `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`.
   - Chứng minh Nginx đã ẩn thông tin phiên bản (`server_tokens off`).
4. **Bước 4: Trình diễn Giám sát Prometheus & Grafana (1.5 điểm)**
   - Mở Prometheus (`http://localhost:9090/targets`): Trình bày tất cả các target (`cadvisor`, `postgres-exporter`, `app`) đều ở trạng thái `UP`.
   - Mở Grafana (`http://localhost:3001`): Trình diễn Dashboard Docker Container (CPU/RAM biến thiên khi thao tác web) và Dashboard PostgreSQL.
5. **Bước 5: Trình diễn Hệ thống Log Loki & Truy vấn LogQL (1.5 điểm)**
   - Trong Grafana -> Mục Explore -> Chọn Datasource Loki.
   - Thực thi trực tiếp 3 câu truy vấn LogQL đã chuẩn bị:
     + Truy vấn log App: `{container_name=~".*app.*"}`
     + Truy vấn log lọc lỗi: `{container_name=~".*app.*"} |= "complaint"`
     + Truy vấn log Nginx: `{container_name=~".*nginx.*"}`
   - Thao tác gửi khiếu nại trên web, ngay lập tức log xuất hiện trên Grafana.
6. **Bước 6: Chứng minh các biện pháp Hardening (1.5 điểm)**
   - Chạy lệnh `docker compose exec app id`: Kết quả trả về `uid=1001(appuser)` (chứng minh non-root).
   - Chạy lệnh `docker network ls` và `docker inspect`: Chứng minh PostgreSQL nằm ở `backend_net`, không thể truy cập trực tiếp từ máy host bên ngoài.
   - Mở file `.env` và `docker-compose.yml`: Chứng minh không lưu lộ mật khẩu.
7. **Bước 7: Tổng kết & Nộp Báo cáo (1.0 điểm)**
   - Mở file báo cáo PDF (>10 trang) có đầy đủ ảnh chụp minh chứng, trang bìa tiêu chuẩn.

---

## 8. ĐỀ CƯƠNG & DÀN Ý BÁO CÁO KỸ THUẬT (TỐI THIỂU 10 TRANG)

Cấu trúc chi tiết của Báo cáo thu hoạch để đạt dung lượng từ 12 - 15 trang:

- **TRANG BÌA:** Chuẩn format đồ án / thực tập: Trường, Khoa, Môn học, Tên Đề tài 36: "Hệ thống Quản lý Chung cư / Căn hộ", Giảng viên hướng dẫn, Sinh viên thực hiện (Họ tên, MSSV, Lớp).
- **MỤC LỤC, DANH MỤC HÌNH VẼ, DANH MỤC BẢNG BIỂU** (1 trang).
- **CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN ĐỀ TÀI & BÀI TOÁN NGHIỆP VỤ (2 trang)**
  - 1.1. Bối cảnh và tính cấp thiết của hệ thống quản lý chung cư.
  - 1.2. Các yêu cầu chức năng nghiệp vụ (Căn hộ, cư dân, phí dịch vụ, hóa đơn, thông báo, khiếu nại).
  - 1.3. Yêu cầu kỹ thuật phi chức năng và mục tiêu vận hành container.
- **CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC HỆ THỐNG & CƠ SỞ DỮ LIỆU (2 - 3 trang)**
  - 2.1. Sơ đồ kiến trúc tổng thể các dịch vụ Docker (Container Topology).
  - 2.2. Thiết kế Cơ sở dữ liệu PostgreSQL (Sơ đồ ERD, mô tả chi tiết các trường dữ liệu và ràng buộc khóa ngoại).
  - 2.3. Thiết kế luồng dữ liệu giữa Nginx, Web App và PostgreSQL.
- **CHƯƠNG 3: TRIỂN KHAI DỊCH VỤ VÀ CẤU HÌNH REVERSE PROXY (2 - 3 trang)**
  - 3.1. Đóng gói ứng dụng Web App với Dockerfile tối ưu.
  - 3.2. Cấu hình triển khai cơ sở dữ liệu và công cụ quản trị pgAdmin.
  - 3.3. Cấu hình Nginx Reverse Proxy: Định tuyến, cấu hình SSL/TLS tự ký, thiết lập các Security Headers.
  - 3.4. Minh chứng Commit 1 trên GitHub và kết quả chạy thử nghiệm.
- **CHƯƠNG 4: HỆ THỐNG GIÁM SÁT HIỆU NĂNG VỚI PROMETHEUS & GRAFANA (2 - 3 trang)**
  - 4.1. Kiến trúc thu thập metrics của Prometheus.
  - 4.2. Cấu hình cAdvisor giám sát tài nguyên container và postgres-exporter giám sát DB.
  - 4.3. Thiết lập trực quan hóa với Grafana Dashboard (Hình ảnh minh họa Dashboard CPU, RAM, Network, DB Connection).
  - 4.4. Minh chứng Commit 2 trên GitHub.
- **CHƯƠNG 5: HỆ THỐNG QUẢN TRỊ LOG TẬP TRUNG VỚI LOKI & PROMTAIL (2 trang)**
  - 5.1. Mô hình hoạt động của Loki và Promtail thu thập log container.
  - 5.2. Cấu hình pipeline Promtail và datasource Loki.
  - 5.3. Xây dựng và phân tích các câu truy vấn LogQL thực tế (Hình ảnh minh chứng kết quả truy vấn log).
- **CHƯƠNG 6: ÁP DỤNG CÁC BIỆN PHÁP BẢO MẬT VÀ HARDENING HỆ THỐNG (2 trang)**
  - 6.1. Triển khai non-root container và ý nghĩa an toàn thông tin.
  - 6.2. Thiết kế phân vùng mạng cách ly (Network Isolation).
  - 6.3. Quản lý bí mật (Secrets) qua biến môi trường an toàn.
  - 6.4. Các kỹ thuật hardening Nginx và phân quyền cơ sở dữ liệu.
  - 6.5. Minh chứng Commit 3 trên GitHub.
- **CHƯƠNG 7: HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH VÀ KẾT LUẬN (1 - 2 trang)**
  - 7.1. Hướng dẫn chạy hệ thống từ mã nguồn GitHub (`docker compose up -d`).
  - 7.2. Bảng tổng hợp các endpoint, tài khoản và cổng dịch vụ.
  - 7.3. Đánh giá mức độ hoàn thành theo tiêu chí môn học.
  - 7.4. Hướng phát triển và mở rộng trong tương lai.
- **TÀI LIỆU THAM KHẢO** (0.5 trang).

---
*Kế hoạch được lập tự động dựa trên quy chuẩn đề tài thực hành môn Triển khai và Quản trị Hệ thống Phần mềm K23.*
