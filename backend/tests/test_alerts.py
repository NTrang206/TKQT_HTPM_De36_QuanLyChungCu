from datetime import date, timedelta


def test_rule_engine_scan_and_alert_lifecycle(client, admin_headers, accountant_headers):
    today = date.today()

    # 1. Tạo hợp đồng sắp hết hạn trong 15 ngày tới
    c_res = client.post(
        "/api/v1/contracts",
        json={
            "apartment_id": 1,
            "tenant_id": 1,
            "start_date": str(today - timedelta(days=100)),
            "end_date": str(today + timedelta(days=15)),
            "rental_price": 7000000,
            "deposit_amount": 14000000
        },
        headers=admin_headers
    )
    contract_id = c_res.json()["id"]
    client.patch(f"/api/v1/deposits/contract/{contract_id}/receive", json={"amount": 14000000}, headers=accountant_headers)
    client.patch(f"/api/v1/contracts/{contract_id}/activate", headers=admin_headers)

    # 2. Tạo khoản thu nợ đã quá hạn
    rec_res = client.post(
        "/api/v1/receivables",
        json={
            "contract_id": contract_id,
            "billing_month": 1,
            "billing_year": 2026,
            "service_amount": 150000
        },
        headers=accountant_headers
    )
    rec_id = rec_res.json()["id"]

    # Chạy kiểm tra quá hạn
    client.patch("/api/v1/receivables/check-overdue", headers=accountant_headers)

    # 3. Chạy quét cảnh báo Rule Engine
    scan_res = client.post(
        "/api/v1/alerts/scan",
        json={"days_to_end": 30},
        headers=admin_headers
    )
    assert scan_res.status_code == 200, scan_res.text
    data = scan_res.json()
    assert data["status"] == "success"
    assert data["created_expiring_alerts"] >= 1 or data["total_new_alerts"] >= 1

    # 4. Lấy danh sách alert chưa gửi
    unsent_res = client.get("/api/v1/alerts/unsent", headers=admin_headers)
    assert unsent_res.status_code == 200
    unsent_list = unsent_res.json()
    assert len(unsent_list) >= 1

    alert_id = unsent_list[0]["id"]

    # 5. Đánh dấu đã gửi cảnh báo
    mark_res = client.patch(
        f"/api/v1/alerts/{alert_id}/mark-sent",
        json={"channel": "EMAIL"},
        headers=admin_headers
    )
    assert mark_res.status_code == 200
    assert mark_res.json()["is_sent"] is True
