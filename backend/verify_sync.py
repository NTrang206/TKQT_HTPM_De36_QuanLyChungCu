import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_api():
    print("=== STARTING API SYNC VERIFICATION ===")
    
    # 1. Login
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
    if resp.status_code != 200:
        print(f"FAILED LOGIN: {resp.status_code} {resp.text}")
        return
    token = resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print(">>> 1. Login successful as admin! Token acquired.")

    # 2. Check /auth/me
    me = requests.get(f"{BASE_URL}/auth/me", headers=headers).json()
    print(f">>> 2. Current User: {me.get('full_name')} ({me.get('username')}) - Role: {me.get('role', {}).get('name') if isinstance(me.get('role'), dict) else me.get('role')}")

    # 3. Buildings
    b_resp = requests.get(f"{BASE_URL}/buildings", headers=headers)
    buildings = b_resp.json() if b_resp.status_code == 200 else []
    print(f">>> 3. Buildings ({len(buildings)}):")
    for b in buildings:
        print(f"   - [{b.get('id')}] {b.get('name')} | {b.get('address')} | Total Apts: {b.get('total_apartments')}")

    # 4. Apartments
    a_resp = requests.get(f"{BASE_URL}/apartments", headers=headers)
    apartments = a_resp.json() if a_resp.status_code == 200 else []
    print(f">>> 4. Apartments ({len(apartments)}):")
    status_counts = {}
    for a in apartments:
        st = a.get("status")
        status_counts[st] = status_counts.get(st, 0) + 1
    print(f"   Breakdown: {status_counts}")
    sample_a = apartments[0] if apartments else {}
    p_val = float(sample_a.get('price') or 0)
    print(f"   Sample Apt: {sample_a.get('room_number')} in {sample_a.get('building_name')} - Price: {p_val:,.0f} VND - Status: {sample_a.get('status')}")

    # 5. Tenants
    t_resp = requests.get(f"{BASE_URL}/tenants", headers=headers)
    tenants = t_resp.json() if t_resp.status_code == 200 else []
    print(f">>> 5. Tenants ({len(tenants)}):")
    for t in tenants[:5]:
        rm_count = len(t.get("roommates", []))
        ec_count = len(t.get("emergency_contacts", []))
        print(f"   - [{t.get('id')}] {t.get('full_name')} | Room: {t.get('current_room_number', 'None')} ({t.get('building_name', 'None')}) | Roommates: {rm_count} | Emerg Contacts: {ec_count}")

    # 6. Contracts
    c_resp = requests.get(f"{BASE_URL}/contracts", headers=headers)
    contracts = c_resp.json() if c_resp.status_code == 200 else []
    print(f">>> 6. Contracts ({len(contracts)}):")
    c_status = {}
    for c in contracts:
        st = c.get("status")
        c_status[st] = c_status.get(st, 0) + 1
    print(f"   Status breakdown: {c_status}")
    for c in contracts[:4]:
        t_name = c.get("tenant_name") or "N/A"
        apt_num = c.get("room_number") or "N/A"
        b_name = c.get("building_name") or "N/A"
        m_rent = float(c.get('rental_price') or 0)
        print(f"   - Contract #{c.get('contract_code', c.get('id'))}: Tenant={t_name}, Room={apt_num} ({b_name}), Rent={m_rent:,.0f} VND, Status={c.get('status')}")

    # 7. Receivables & Payments
    r_resp = requests.get(f"{BASE_URL}/receivables", headers=headers)
    receivables = r_resp.json() if r_resp.status_code == 200 else []
    print(f">>> 7. Receivables ({len(receivables)}):")
    r_status = {}
    for r in receivables:
        st = r.get("status")
        r_status[st] = r_status.get(st, 0) + 1
    print(f"   Status breakdown: {r_status}")

    # 8. Debt Ledgers
    d_resp = requests.get(f"{BASE_URL}/debt-ledgers", headers=headers)
    ledgers = d_resp.json() if d_resp.status_code == 200 else []
    print(f">>> 8. Debt Ledgers ({len(ledgers)}):")
    math_errors = 0
    for l in ledgers:
        tot_rec = float(l.get("total_receivable") or 0)
        tot_paid = float(l.get("total_paid") or 0)
        curr_debt = float(l.get("current_debt") or 0)
        calc_debt = tot_rec - tot_paid
        if abs(calc_debt - curr_debt) > 1:
            print(f"   [!] Math mismatch for Tenant ID {l.get('tenant_id')}: rec={tot_rec}, paid={tot_paid}, db_debt={curr_debt}, calc={calc_debt}")
            math_errors += 1
        else:
            t_obj = l.get("tenant", {})
            t_name = t_obj.get("full_name") if t_obj else f"ID {l.get('tenant_id')}"
            print(f"   - Tenant: {t_name} | Receivable: {tot_rec:,.0f} | Paid: {tot_paid:,.0f} | Debt: {curr_debt:,.0f} [OK]")
    if math_errors == 0:
        print("   >>> ALL DEBT LEDGERS 100% MATHEMATICALLY CONSISTENT!")

    # 9. Maintenance Requests
    m_resp = requests.get(f"{BASE_URL}/maintenance-requests", headers=headers)
    maints = m_resp.json() if m_resp.status_code == 200 else []
    print(f">>> 9. Maintenance Requests ({len(maints)}):")
    for m in maints:
        c_val = float(m.get('repair_cost') or 0)
        print(f"   - [{m.get('status')}] {m.get('issue_description')} | Room: {m.get('room_number')} ({m.get('building_name')}) | Staff: {m.get('assigned_staff_name', 'Unassigned')} | Cost: {c_val:,.0f} VND")

    # 10. Bookings
    bk_resp = requests.get(f"{BASE_URL}/bookings", headers=headers)
    bookings = bk_resp.json() if bk_resp.status_code == 200 else []
    print(f">>> 10. Bookings ({len(bookings)}):")
    for bk in bookings:
        dep_val = float(bk.get('deposit_amount') or 0)
        print(f"   - [{bk.get('status')}] {bk.get('customer_name')} ({bk.get('customer_phone')}) | Apt ID: {bk.get('apartment_id')} | Deposit: {dep_val:,.0f} VND")

    # 11. System Alerts
    al_resp = requests.get(f"{BASE_URL}/alerts", headers=headers)
    alerts = al_resp.json() if al_resp.status_code == 200 else []
    print(f">>> 11. System Alerts ({len(alerts)}):")
    for al in alerts:
        print(f"   - [{al.get('alert_type')}] {al.get('message')}")

    # 12. Tenant Login & Portal Verification
    t_login = requests.post(f"{BASE_URL}/auth/login", json={"username": "tenant", "password": "tenant123"})
    if t_login.status_code == 200:
        t_token = t_login.json().get("access_token")
        t_headers = {"Authorization": f"Bearer {t_token}"}
        t_contracts = requests.get(f"{BASE_URL}/contracts/my", headers=t_headers).json()
        t_maints = requests.get(f"{BASE_URL}/maintenance-requests/my", headers=t_headers).json()
        print(f">>> 12. Tenant 'tenant' Portal Access:")
        print(f"   - My Contracts: {len(t_contracts)} contracts")
        for tc in t_contracts:
            print(f"     * Contract {tc.get('contract_code')}: Room {tc.get('room_number')} ({tc.get('building_name')}) - Rent: {float(tc.get('rental_price') or 0):,.0f} VND")
        print(f"   - My Maintenance: {len(t_maints)} tickets")
        for tm in t_maints:
            print(f"     * Ticket {tm.get('id')}: {tm.get('issue_description')} [{tm.get('status')}]")
    else:
        print(f">>> 12. Tenant login failed: {t_login.status_code}")

    print("=== VERIFICATION COMPLETE ===")

if __name__ == "__main__":
    test_api()
