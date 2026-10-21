import urllib3
import json
import requests

# Disable insecure HTTPS warnings for self-signed certificate testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "https://localhost"
API_URL = f"{BASE_URL}/api/v1"

results = []

def record(test_name, success, details=""):
    status = "PASS" if success else "FAIL"
    results.append({"test": test_name, "status": status, "details": details})
    print(f"[{status}] {test_name}: {details}")

# 1. Test Nginx HTTPS & Security Headers
try:
    r = requests.get(BASE_URL, verify=False, timeout=5)
    headers = r.headers
    has_owasp = all(h in headers for h in ["X-Frame-Options", "X-Content-Type-Options", "Content-Security-Policy"])
    server_hidden = headers.get("Server") == "nginx"
    record("1. Nginx HTTPS & OWASP Security Headers", r.status_code == 200 and has_owasp and server_hidden, f"HTTP {r.status_code}, Server: {headers.get('Server')}")
except Exception as e:
    record("1. Nginx HTTPS & OWASP Security Headers", False, str(e))

# 2. Test HTTP -> HTTPS 301 Redirect
try:
    r = requests.get("http://localhost", allow_redirects=False, timeout=5)
    is_301 = r.status_code == 301 and "https://localhost" in r.headers.get("Location", "")
    record("2. HTTP to HTTPS 301 Redirect", is_301, f"Status {r.status_code}, Location: {r.headers.get('Location')}")
except Exception as e:
    record("2. HTTP to HTTPS 301 Redirect", False, str(e))

# 3. Test Admin Authentication & JWT Generation
token = ""
try:
    r = requests.post(f"{API_URL}/auth/login", json={"username": "admin", "password": "admin123"}, verify=False, timeout=5)
    data = r.json()
    token = data.get("access_token", "")
    user = data.get("user", {})
    record("3. Admin Login & JWT Issue", r.status_code == 200 and bool(token), f"User: {user.get('full_name')} ({user.get('role_code')})")
except Exception as e:
    record("3. Admin Login & JWT Issue", False, str(e))

auth_headers = {"Authorization": f"Bearer {token}"} if token else {}

# 4. Test Tenant Authentication
try:
    r = requests.post(f"{API_URL}/auth/login", json={"username": "tenant", "password": "tenant123"}, verify=False, timeout=5)
    data = r.json()
    t_token = data.get("access_token", "")
    t_user = data.get("user", {})
    record("4. Tenant Login & JWT Issue", r.status_code == 200 and bool(t_token), f"User: {t_user.get('full_name')} ({t_user.get('role_code')})")
except Exception as e:
    record("4. Tenant Login & JWT Issue", False, str(e))

# 5. Test Buildings API
try:
    r = requests.get(f"{API_URL}/buildings", verify=False, timeout=5)
    buildings = r.json()
    record("5. Buildings Management API", r.status_code == 200 and len(buildings) >= 2, f"Total buildings: {len(buildings)}")
except Exception as e:
    record("5. Buildings Management API", False, str(e))

# 6. Test Apartments API
try:
    r = requests.get(f"{API_URL}/apartments", verify=False, timeout=5)
    apartments = r.json()
    occupied = sum(1 for a in apartments if a.get("status") == "OCCUPIED")
    available = sum(1 for a in apartments if a.get("status") == "AVAILABLE")
    record("6. Apartments Management API", r.status_code == 200 and len(apartments) >= 5, f"Total: {len(apartments)}, Occupied: {occupied}, Available: {available}")
except Exception as e:
    record("6. Apartments Management API", False, str(e))

# 7. Test Dashboard Summary KPI
try:
    r = requests.get(f"{API_URL}/dashboard/summary", headers=auth_headers, verify=False, timeout=5)
    stats = r.json()
    apts = stats.get("apartments", {})
    record("7. Executive Dashboard KPI Summary", r.status_code == 200, f"Total Apartments: {apts.get('total')}, Occupancy: {apts.get('occupancy_rate')}%")
except Exception as e:
    record("7. Executive Dashboard KPI Summary", False, str(e))

# 8. Test Contracts API
try:
    r = requests.get(f"{API_URL}/contracts", headers=auth_headers, verify=False, timeout=5)
    contracts = r.json()
    record("8. Rental Contracts API", r.status_code == 200 and isinstance(contracts, list), f"Total active contracts: {len(contracts)}")
except Exception as e:
    record("8. Rental Contracts API", False, str(e))

# 9. Test Tenants API
try:
    r = requests.get(f"{API_URL}/tenants", headers=auth_headers, verify=False, timeout=5)
    tenants = r.json()
    record("9. Tenants & Resident Directory API", r.status_code == 200 and isinstance(tenants, list), f"Total tenants: {len(tenants)}")
except Exception as e:
    record("9. Tenants & Resident Directory API", False, str(e))

# 10. Test Receivables & Invoices API
try:
    r = requests.get(f"{API_URL}/receivables", headers=auth_headers, verify=False, timeout=5)
    receivables = r.json()
    record("10. Billing & Receivables API", r.status_code == 200 and isinstance(receivables, list), f"Total invoices: {len(receivables)}")
except Exception as e:
    record("10. Billing & Receivables API", False, str(e))

# 11. Test Payments & VietQR API
try:
    r = requests.get(f"{API_URL}/payments", headers=auth_headers, verify=False, timeout=5)
    payments = r.json()
    record("11. Payments & Transaction Receipts API", r.status_code == 200 and isinstance(payments, list), f"Total recorded payments: {len(payments)}")
except Exception as e:
    record("11. Payments & Transaction Receipts API", False, str(e))

# 12. Test Maintenance Requests (Khiếu nại / Báo hỏng)
try:
    r = requests.get(f"{API_URL}/maintenance-requests", headers=auth_headers, verify=False, timeout=5)
    requests_list = r.json()
    record("12. Maintenance & Complaints API", r.status_code == 200 and isinstance(requests_list, list), f"Total maintenance requests: {len(requests_list)}")
except Exception as e:
    record("12. Maintenance & Complaints API", False, str(e))

# 13. Test System Alerts Scan
try:
    r = requests.get(f"{API_URL}/alerts", headers=auth_headers, verify=False, timeout=5)
    alerts = r.json()
    record("13. System AI Alerts & Cron Job Scan", r.status_code == 200 and isinstance(alerts, list), f"Total active alerts: {len(alerts)}")
except Exception as e:
    record("13. System AI Alerts & Cron Job Scan", False, str(e))

# 14. Test Bookings API
try:
    r = requests.get(f"{API_URL}/bookings", headers=auth_headers, verify=False, timeout=5)
    bookings = r.json()
    record("14. Guest Bookings & Viewing Requests API", r.status_code == 200 and isinstance(bookings, list), f"Total bookings: {len(bookings)}")
except Exception as e:
    record("14. Guest Bookings & Viewing Requests API", False, str(e))

# 15. Test Prometheus Targets Health
try:
    r = requests.get("http://localhost:9090/api/v1/targets", timeout=5)
    data = r.json().get("data", {})
    active = data.get("activeTargets", [])
    all_up = all(t.get("health") == "up" for t in active) and len(active) == 4
    record("15. Prometheus 4 Targets Scrape Status", all_up, f"{len(active)}/4 targets UP: {[t.get('labels', {}).get('job') for t in active]}")
except Exception as e:
    record("15. Prometheus 4 Targets Scrape Status", False, str(e))

# 16. Test Grafana Provisioned Dashboards
try:
    r = requests.get("http://localhost:3001/api/search", auth=("admin", "Grafana@2026_SecretPass!"), timeout=5)
    dashes = r.json()
    dash_titles = [d.get("title") for d in dashes if d.get("type") == "dash-db"]
    record("16. Grafana 2 Auto-Provisioned Dashboards", len(dash_titles) >= 2, f"Dashboards: {dash_titles}")
except Exception as e:
    record("16. Grafana 2 Auto-Provisioned Dashboards", False, str(e))

# 17. Test Loki Log Ingestion
try:
    r = requests.get("http://localhost:3001/api/datasources/uid/P8E80F9AEF21F6940/health", auth=("admin", "Grafana@2026_SecretPass!"), timeout=5)
    loki_ok = r.status_code == 200
    record("17. Loki Log Datasource in Grafana", loki_ok, f"Status: {r.status_code}, {r.text[:60]}")
except Exception as e:
    record("17. Loki Log Datasource in Grafana", False, str(e))

print("\n" + "="*80)
passed = sum(1 for res in results if res["status"] == "PASS")
total = len(results)
print(f"TONG KET KIEM THU: {passed}/{total} TIÊU CHÍ ĐẠT ({passed/total*100:.1f}%)")
print("="*80)
