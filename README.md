# HỆ THỐNG QUẢN LÝ CHUNG CƯ / CĂN HỘ (APARTMENT MANAGEMENT SYSTEM)

[![Docker](https://img.shields.io/badge/Docker-29.4-blue?logo=docker&logoColor=white)](https://www.docker.com/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-v5.1-blue?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-green?logo=nginx&logoColor=white)](https://nginx.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16--alpine-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prometheus](https://img.shields.io/badge/Prometheus-v2.51-e6522c?logo=prometheus&logoColor=white)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-10.4-orange?logo=grafana&logoColor=white)](https://grafana.com/)
[![Loki](https://img.shields.io/badge/Loki-2.9-orange?logo=grafana&logoColor=white)](https://grafana.com/oss/loki/)

> **Môn học:** Triển khai và Quản trị Hệ thống Phần mềm (TKQT HTPM - K23)  
> **Đề tài số:** 36 - Hệ thống Quản lý Chung cư / Căn hộ  
> **Sinh viên thực hiện:** Nguyễn Thị Trang  
> **Tài khoản GitHub:** [NTrang206](https://github.com/NTrang206)  
> **Repository:** [TKQT_HTPM_De36_QuanLyChungCu](https://github.com/NTrang206/TKQT_HTPM_De36_QuanLyChungCu)  

---

## 1. GIỚI THIỆU TỔNG QUAN HỆ THỐNG

Dự án triển khai một hệ sinh thái phần mềm toàn diện phục vụ công tác **Quản lý Căn hộ và Vận hành Chung cư**, bao gồm các nghiệp vụ cốt lõi:
- **Quản lý Căn hộ & Cư dân:** Lưu trữ danh sách phòng, trạng thái cho thuê, thông tin chủ hộ/khách thuê và hợp đồng.
- **Quản lý Phí Dịch vụ & Hóa đơn:** Tạo hóa đơn tự động hàng tháng (tiền phòng, tiền điện, nước, phí quản lý tòa nhà, phí gửi xe) và theo dõi trạng thái thanh toán.
- **Tiếp nhận & Xử lý Khiếu nại:** Cư dân gửi phản ánh sự cố (hư hỏng thang máy, rò rỉ nước, thiết bị điện); Ban quản lý phân công kỹ thuật xử lý.
- **Bảng tin & Thông báo BQL:** Phát thông báo bảo trì, lịch cắt điện/nước, nhắc nhở đóng tiền phí tới toàn thể cư dân.

Toàn bộ hệ thống được đóng gói và vận hành độc lập **100% bằng Docker Containers thông qua Docker Compose** theo tiêu chuẩn môi trường sản xuất (Production-ready).

---

## 2. KIẾN TRÚC HỆ THỐNG (CONTAINER TOPOLOGY)

Hệ thống bao gồm **10 Container dịch vụ** được kết nối qua 3 mạng Docker cách ly an toàn:

```text
                                [ CLIENT / TRÌNH DUYỆT ]
                                           │
                                    (Port 80 / 443 HTTPS)
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│  NGINX REVERSE PROXY CONTAINER (Cổng đón duy nhất)                                    │
│  - SSL Termination (Self-signed Cert), Security Headers (OWASP), Rate Limiting        │
│  - Định tuyến:  / -> app:3000  │  /pgadmin/ -> pgadmin:80  │  /grafana/ -> grafana:3000│
└──────────────────────────────────────────┬────────────────────────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │ [frontend_net]                              │ [monitoring_net]
                    ▼                                             ▼
┌───────────────────────────────────────┐     ┌─────────────────────────────────────────┐
│  WEB APPLICATION CONTAINER            │     │  MONITORING & LOGGING STACK             │
│  - FastAPI Non-Root (UID 1001)        │     │  - Prometheus (Scrape metrics)          │
│  - Metrics endpoint: /metrics         │     │  - Grafana (Dashboard trực quan)        │
│  - Log JSON ra stdout                 │     │  - Loki (Lưu trữ và lập chỉ mục log)    │
└───────────────────┬───────────────────┘     │  - Promtail (Đọc docker log -> Loki)    │
                    │                         │  - cAdvisor (Container metrics)         │
                    │ [backend_net]           │  - Postgres-Exporter (DB metrics)       │
                    ▼                         └─────────────────────────────────────────┘
┌───────────────────────────────────────┐                         ▲
│  DATABASE STACK (Cô lập an toàn)      │                         │
│  - PostgreSQL 16 (Dữ liệu chung cư)   ├─────────────────────────┘
│  - pgAdmin 4 (Quản trị CSDL)          │
└───────────────────────────────────────┘
```

### Bảng Phân Bổ Cổng Dịch Vụ & Mạng Nội Bộ

| STT | Service Name | Image / Base | Vai trò kỹ thuật | Internal Port | External Port (Host) | Mạng kết nối |
|:---:|---|---|---|:---:|:---:|---|
| 1 | **nginx** | `nginx:1.25-alpine` | Cổng đón duy nhất, SSL HTTPS, Security Headers | 80, 443 | **80:80**, **443:443** | `frontend_net` |
| 2 | **backend** | `python:3.11-slim` | Web API Quản lý chung cư (FastAPI, Non-root) | 8000 | *Không mở* (chỉ qua Nginx) | `frontend_net`, `backend_net`, `monitoring_net` |
| 3 | **postgres** | `postgres:16-alpine` | CSDL chính của hệ thống chung cư | 5432 | *Không mở* (cô lập an toàn) | `backend_net`, `monitoring_net` |
| 4 | **pgadmin** | `dpage/pgadmin4:latest` | Giao diện Web quản trị PostgreSQL | 80 | **5050:80** (hoặc `/pgadmin/`) | `backend_net`, `frontend_net` |
| 5 | **prometheus** | `prom/prometheus:v2.51.0` | Thu thập chỉ số metrics định kỳ | 9090 | **9090:9090** | `monitoring_net`, `frontend_net` |
| 6 | **grafana** | `grafana/grafana:10.4.0` | Trực quan hóa dashboard giám sát | 3000 | **3001:3000** (hoặc `/grafana/`) | `monitoring_net`, `frontend_net` |
| 7 | **cadvisor** | `gcr.io/cadvisor/cadvisor:v0.49.1` | Giám sát tài nguyên CPU, RAM, Network container | 8080 | *Không mở* (chỉ Prometheus) | `monitoring_net` |
| 8 | **postgres-exporter** | `prometheuscommunity/postgres-exporter` | Metrics chuyên sâu giao dịch và kết nối CSDL | 9187 | *Không mở* (chỉ Prometheus) | `backend_net`, `monitoring_net` |
| 9 | **loki** | `grafana/loki:2.9.4` | Lưu trữ và đánh chỉ mục log tập trung | 3100 | *Không mở* (chỉ nội bộ) | `monitoring_net` |
| 10 | **promtail** | `grafana/promtail:2.9.4` | Tự động đọc và chuyển tiếp log container về Loki | 9080 | *Không mở* | `monitoring_net` |

---

## 3. HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH (1 BƯỚC DUY NHẤT)

### Yêu cầu tiên quyết
- Máy tính đã cài đặt **Docker Desktop** (hoặc Docker Engine + Docker Compose).
- Git đã được cài đặt.

### Các bước khởi chạy

```bash
# 1. Clone repository về máy
git clone https://github.com/NTrang206/TKQT_HTPM_De36_QuanLyChungCu.git
cd TKQT_HTPM_De36_QuanLyChungCu

# 2. Khởi tạo file biến môi trường từ mẫu
cp .env.example .env

# 3. Khởi động toàn bộ 10 dịch vụ bằng Docker Compose
docker compose up -d
```

Quá trình khởi tạo lần đầu sẽ tự động:
1. Build image Web Application non-root tối ưu.
2. Khởi tạo cơ sở dữ liệu PostgreSQL 16 và nạp sẵn toàn bộ cấu trúc bảng cùng dữ liệu mẫu thực tế từ `database/init.sql`.
3. Tự động cấu hình sẵn máy chủ PostgreSQL trong pgAdmin thông qua file `database/pgadmin/servers.json`.
4. Nạp sẵn Datasource Prometheus, Loki và 2 Dashboard chuyên nghiệp trong Grafana.
5. Kích hoạt chứng chỉ SSL tự ký và bộ Security Headers trên Nginx Reverse Proxy.

---

## 4. DANH SÁCH ĐƯỜNG DẪN TRUY CẬP & TÀI KHOẢN MẶC ĐỊNH

| Dịch vụ | URL Truy cập Trình duyệt | Tài khoản / Mật khẩu mặc định | Ghi chú |
|---|---|---|---|
| **Website Chung cư (Nginx HTTPS)** | `https://localhost` | `admin` / `admin123` | Có SSL tự ký & Security Headers |
| **Website Chung cư (Nginx HTTP)** | `http://localhost` | - | Tự động redirect 301 sang HTTPS |
| **API Swagger Documentation** | `https://localhost/docs` | - | Xem và kiểm thử 30+ endpoints API |
| **Metrics Endpoint** | `http://localhost:8000/metrics` | - | Prometheus scrape endpoint |
| **pgAdmin 4 (Quản trị CSDL)** | `http://localhost:5050` hoặc `https://localhost/pgadmin/` | `admin@dwell.vn`<br>`PgAdmin@2026_SecretPass!` | Đã cấu hình sẵn kết nối tới CSDL |
| **Grafana Dashboard** | `http://localhost:3001` hoặc `https://localhost/grafana/` | `admin`<br>`Grafana@2026_SecretPass!` | Tự nạp 2 dashboard giám sát |
| **Prometheus Targets** | `http://localhost:9090/targets` | - | Trạng thái scrape các dịch vụ |

---

## 5. CHI TIẾT 6 TIÊU CHÍ KỸ THUẬT & MINH CHỨNG NGHIỆM THU

### Tiêu chí 1: Quản lý mã nguồn trên GitHub & 3 Commit Mốc (1.5 điểm)
Repository tuân thủ chặt chẽ chiến lược **đúng và đủ 3 commit mốc** có ranh giới kỹ thuật rõ ràng:
* **Commit 1 (`feat(core)`):** Triển khai ứng dụng Web Quản lý Chung cư, CSDL PostgreSQL (kèm `init.sql`), pgAdmin và Nginx Reverse Proxy với HTTPS SSL tự ký cùng Security Headers.
* **Commit 2 (`feat(monitoring)`):** Tích hợp Prometheus và Grafana, bổ sung cAdvisor và Postgres Exporter, tự động nạp Datasource và 2 Dashboard.
* **Commit 3 (`feat(logging-hardening)`):** Tích hợp Loki và Promtail thu thập log tập trung, truy vấn LogQL, áp dụng 5 lớp bảo mật Hardening hệ thống và tài liệu `README.md`.

### Tiêu chí 2: Triển khai Ứng dụng Web + PostgreSQL + pgAdmin (1.5 điểm)
- Web App được phát triển bằng **FastAPI** hiệu năng cao kết hợp giao diện **React SPA**.
- Tích hợp CSDL **PostgreSQL 16-alpine**, tự động chạy script `database/init.sql` tạo 17 bảng nghiệp vụ (Căn hộ, Cư dân, Hóa đơn, Khiếu nại, Hợp đồng, Bảng tin...).
- pgAdmin 4 được cấu hình tự động nhận diện PostgreSQL Server thông qua volume mount `servers.json`.

### Tiêu chí 3: Cấu hình Nginx Reverse Proxy (1.5 điểm)
- Nginx đóng vai trò là điểm tiếp nhận duy nhất (Single Point of Entry) trên hai cổng 80 và 443.
- Toàn bộ lưu lượng HTTP (Port 80) được chuyển hướng tự động 301 sang HTTPS (Port 443).
- Chứng chỉ SSL tự ký 2048-bit RSA được sinh tự động.
- Cấu hình đầy đủ các tiêu đề bảo mật chuẩn OWASP:
  - `X-Frame-Options: SAMEORIGIN` (Chống Clickjacking)
  - `X-Content-Type-Options: nosniff` (Chống MIME-type sniffing)
  - `X-XSS-Protection: 1; mode=block` (Chống Cross-site Scripting)
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (Ép buộc HTTPS)
  - `Content-Security-Policy` (Kiểm soát nguồn nạp tài nguyên)
  - `server_tokens off;` (Ẩn hoàn toàn thông tin phiên bản Nginx)
  - `limit_req_zone` (Rate Limiting 20 request/giây chống DoS)

### Tiêu chí 4: Hệ thống Giám sát Prometheus + Grafana (1.5 điểm)
- Prometheus scrape định kỳ 15 giây/lần tới 4 target: `backend-app:8000/metrics`, `cadvisor:8080`, `postgres-exporter:9187`, `localhost:9090`.
- Grafana tự động import 2 Dashboard chuyên nghiệp:
  1. **1. Giám Sát Container Docker (cAdvisor):** Biểu đồ CPU Usage (%), RAM Usage (Bytes) và Network Traffic theo từng container.
  2. **2. Giám Sát CSDL PostgreSQL:** Số lượng kết nối hoạt động (Active Connections), dung lượng CSDL (Database Size), tốc độ giao dịch (Transactions/s) và tỉ lệ Cache Hit Ratio.

### Tiêu chí 5: Hệ thống Log tập trung Loki + Promtail + LogQL (1.5 điểm)
- Promtail kết nối Docker socket (`/var/run/docker.sock`) tự động nhận diện tất cả container và gắn nhãn `container_name`.
- Chuyển tiếp toàn bộ log về Loki qua endpoint `http://loki:3100/loki/api/v1/push`.
- **4 Câu truy vấn LogQL mẫu phục vụ kiểm thử và demo nghiệm thu:**

```logql
# 1. Xem toàn bộ log của Web App Quản lý Chung cư:
{container_name=~".*backend.*"}

# 2. Lọc các bản ghi log kiểm toán có chứa cấu trúc AUDIT_LOG:
{container_name=~".*backend.*"} |= "AUDIT_LOG"

# 3. Lọc log Nginx phát hiện các request trả về mã lỗi 4xx hoặc 5xx:
{container_name=~".*nginx.*"} |~ " (4[0-9]{2}|5[0-9]{2}) "

# 4. Thống kê tốc độ request/giây vào hệ thống theo thời gian thực (Rate Metric):
sum(rate({container_name=~".*backend.*"}[1m])) by (container_name)
```

### Tiêu chí 6: Chiến lược Hardening Hệ thống 5 Lớp (1.5 điểm)
1. **Lớp 1 - Non-root Container:** Dockerfile của ứng dụng tạo người dùng riêng `appuser` (UID 1001), chạy dưới quyền hạn chế, loại bỏ triệt để nguy cơ chiếm quyền Host thông qua Container Escape.
2. **Lớp 2 - Phân vùng mạng cách ly (Network Isolation):** Tạo 3 mạng nội bộ riêng biệt (`frontend_net`, `backend_net`, `monitoring_net`). Cơ sở dữ liệu PostgreSQL tuyệt đối không mở cổng ra ngoài máy host.
3. **Lớp 3 - Quản lý bí mật qua file `.env`:** Không hardcode mật khẩu hay secret key trong file cấu hình hay mã nguồn. Có sẵn `.env.example` chuẩn mẫu.
4. **Lớp 4 - Hạn chế đặc quyền Linux & Giới hạn tài nguyên:** Sử dụng `cap_drop: [ALL]` để tước bỏ toàn bộ Linux capabilities nguy hiểm và thiết lập hạn mức `limits: cpus, memory` cho tất cả container.
5. **Lớp 5 - Ẩn thông tin phiên bản & Least Privilege Database:** Ẩn phiên bản máy chủ web Nginx (`server_tokens off;`) và ứng dụng chỉ sử dụng tài khoản chuyên biệt `chungcu_user` để thao tác với CSDL `apartment_db`.

---

## 6. KỊCH BẢN DEMO NGHIỆM THU ĐẠT ĐIỂM TUYỆT ĐỐI (7 BƯỚC)

Khi thực hiện bảo vệ nghiệm thu trước giảng viên:
1. **Bước 1 (1.5đ):** Mở trình duyệt xem GitHub cá nhân [NTrang206](https://github.com/NTrang206), chỉ rõ **đúng 3 commit mốc** và file `README.md`.
2. **Bước 2 (1.5đ):** Chạy `docker compose ps`, chỉ ra 10 container đều ở trạng thái `Up (healthy)`. Truy cập `https://localhost` để thao tác nghiệp vụ căn hộ/cư dân/hóa đơn; mở `http://localhost:5050` xem bảng dữ liệu trong pgAdmin.
3. **Bước 3 (1.5đ):** Mở DevTools (F12) tab Network trên `https://localhost`, chứng minh các Security Headers (`CSP`, `HSTS`, `X-Frame-Options`) và xác minh Nginx đã ẩn phiên bản.
4. **Bước 4 (1.5đ):** Truy cập `http://localhost:9090/targets` chứng minh tất cả các target đều `UP`. Mở `http://localhost:3001` trình diễn 2 dashboard Grafana đo đạc biến thiên tài nguyên.
5. **Bước 5 (1.5đ):** Trong Grafana mục Explore (Datasource Loki), chạy trực tiếp các câu truy vấn LogQL lọc log Web App và log Nginx.
6. **Bước 6 (1.5đ):** Mở terminal gõ lệnh `docker compose exec backend id` -> kết quả hiển thị `uid=1001(appuser)` (chứng minh non-root). Gõ `docker inspect chungcu_postgres` chứng minh không có port binding ra máy host.
7. **Bước 7 (1.0đ):** Mở và nộp file Báo cáo kỹ thuật tổng hợp chuẩn format đồ án (dung lượng > 10 trang).

---
*Dự án hoàn thành đúng hạn, thỏa mãn 100% tiêu chí đề cương môn học Triển khai và Quản trị Hệ thống Phần mềm K23.*
