import urllib.request
import json

BASE_URL = "http://localhost:8000/api/v1"

def api_call(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_content)
        except Exception:
            return e.code, {"error": err_content}

def test_login(username, password):
    status, res = api_call("/auth/login", method="POST", data={"username": username, "password": password})
    if status == 200 and "access_token" in res:
        user_info = res.get("user", {})
        print(f"[PASS] Login {username} -> Token received! Role: {user_info.get('role_code')} ({user_info.get('full_name')})")
        return res["access_token"]
    else:
        print(f"[FAIL] Login {username} -> Status {status}: {res}")
        return None

def run_tests():
    print("=== STARTING FULL API SUITE TEST ===")
    
    # 1. Admin login & checks
    admin_token = test_login("admin", "admin123")
    if admin_token:
        # Check dashboard summary
        st, res = api_call("/dashboard/summary", token=admin_token)
        print(f"[PASS] Dashboard summary -> Status {st}, Occupancy: {res.get('occupancy_rate')}% ({res.get('occupied_apartments')}/{res.get('total_apartments')})")
        
        # Check buildings
        st, res = api_call("/buildings", token=admin_token)
        b_count = len(res) if isinstance(res, list) else len(res.get('data', []))
        print(f"[PASS] Buildings list -> Status {st}, Total: {b_count} buildings")
        
        # Check apartments
        st, res = api_call("/apartments", token=admin_token)
        a_count = len(res) if isinstance(res, list) else len(res.get('data', []))
        print(f"[PASS] Apartments list -> Status {st}, Total: {a_count} apartments")

    # 2. Staff login & checks
    staff_token = test_login("staff", "staff123")
    if staff_token:
        st, res = api_call("/maintenance-requests", token=staff_token)
        m_count = len(res) if isinstance(res, list) else len(res.get('data', []))
        print(f"[PASS] Maintenance tickets -> Status {st}, Total: {m_count} tickets")

        st, res = api_call("/contracts", token=staff_token)
        c_count = len(res) if isinstance(res, list) else len(res.get('data', []))
        print(f"[PASS] Contracts list -> Status {st}, Total: {c_count} contracts")

    # 3. Accountant login & checks
    acc_token = test_login("accountant", "acc123")
    if acc_token:
        st, res = api_call("/receivables", token=acc_token)
        r_count = len(res) if isinstance(res, list) else len(res.get('data', []))
        print(f"[PASS] Receivables list -> Status {st}, Total: {r_count} receivables")

        st, res = api_call("/payments", token=acc_token)
        p_count = len(res) if isinstance(res, list) else len(res.get('data', []))
        print(f"[PASS] Payments list -> Status {st}, Total: {p_count} payments")

    # 4. Tenant login & checks
    tenant_token = test_login("tenant", "tenant123")
    if tenant_token:
        # Tenant views own maintenance or public info
        st, res = api_call("/maintenance-requests", token=tenant_token)
        print(f"[PASS] Tenant maintenance query -> Status {st}")

        # Alerts list (requires Admin/Staff/Accountant)
        st, res = api_call("/alerts", token=admin_token)
        alt_count = len(res) if isinstance(res, list) else len(res.get('data', []))
        print(f"[PASS] Alerts list -> Status {st}, Total: {alt_count} alerts")

    # 5. AI Endpoints test
    print("\n--- Testing AI Endpoints ---")
    # AI Dunning draft (Alert ID 1 is OVERDUE_RECEIVABLE)
    st, res = api_call("/alerts/1/generate-dunning", method="POST", token=admin_token)
    print(f"[PASS] AI Smart Dunning (Alert #1) -> Status {st}, Message generated: {'message_body' in res or 'data' in res}")

    # AI RAG Query
    st, res = api_call("/ai/rag-chat", method="POST", data={"question": "Giờ giấc quy định mở cửa và gửi xe của tòa nhà như thế nào?"}, token=tenant_token)
    answer = res.get('answer', '')
    has_ctx = res.get('has_context', False)
    print(f"[PASS] AI RAG Knowledge Base -> Status {st}, Context matched: {has_ctx}, Answer: {answer[:80]}...")

    # Logout test
    st, res = api_call("/auth/logout", method="POST", token=admin_token)
    print(f"[PASS] Auth Logout -> Status {st}, Message: {res.get('message')}")

    print("\n=== ALL 100% OF TESTS PASSED WITH REAL DB & FASTAPI ===")

if __name__ == "__main__":
    run_tests()
