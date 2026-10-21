from datetime import date, timedelta


def test_billing_engine_batch_generation(client, admin_headers, accountant_headers):
    # 1. Kích hoạt một hợp đồng
    today = date.today()
    c_res = client.post(
        "/api/v1/contracts",
        json={
            "apartment_id": 1,
            "tenant_id": 1,
            "start_date": str(today),
            "end_date": str(today + timedelta(days=90)),
            "rental_price": 8000000,
            "deposit_amount": 16000000
        },
        headers=admin_headers
    )
    contract_id = c_res.json()["id"]
    client.patch(f"/api/v1/deposits/contract/{contract_id}/receive", json={"amount": 16000000}, headers=accountant_headers)
    client.patch(f"/api/v1/contracts/{contract_id}/activate", headers=admin_headers)

    # 2. Chạy Billing Engine cho tháng 11/2026
    billing_res = client.post(
        "/api/v1/billing/generate-monthly",
        json={
            "billing_month": 11,
            "billing_year": 2026,
            "due_day": 10,
            "default_service_fee": 150000
        },
        headers=accountant_headers
    )
    assert billing_res.status_code == 200, billing_res.text
    data = billing_res.json()
    assert data["billing_month"] == 11
    assert data["created_receivables_count"] >= 1
    assert float(data["total_billed_amount"]) >= 8150000.0

    # 3. Chạy lại cùng tháng đó -> Hệ thống phải bỏ qua (chống trùng)
    duplicate_res = client.post(
        "/api/v1/billing/generate-monthly",
        json={
            "billing_month": 11,
            "billing_year": 2026,
            "due_day": 10,
            "default_service_fee": 150000
        },
        headers=accountant_headers
    )
    assert duplicate_res.status_code == 200
    dup_data = duplicate_res.json()
    assert dup_data["created_receivables_count"] == 0
    assert dup_data["skipped_existing_count"] >= 1


def test_vietqr_endpoint(client, admin_headers, accountant_headers):
    # Tạo hợp đồng và khoản thu độc lập
    today = date.today()
    c_res = client.post(
        "/api/v1/contracts",
        json={
            "apartment_id": 1,
            "tenant_id": 1,
            "start_date": str(today),
            "end_date": str(today + timedelta(days=90)),
            "rental_price": 8000000,
            "deposit_amount": 16000000
        },
        headers=admin_headers
    )
    contract_id = c_res.json()["id"]
    client.patch(f"/api/v1/deposits/contract/{contract_id}/receive", json={"amount": 16000000}, headers=accountant_headers)
    client.patch(f"/api/v1/contracts/{contract_id}/activate", headers=admin_headers)

    rec_res = client.post(
        "/api/v1/receivables",
        json={
            "contract_id": contract_id,
            "billing_month": 10,
            "billing_year": 2026,
            "service_amount": 100000
        },
        headers=accountant_headers
    )
    assert rec_res.status_code == 200, rec_res.text
    rec_id = rec_res.json()["id"]

    qr_res = client.get(f"/api/v1/billing/vietqr/{rec_id}")
    assert qr_res.status_code == 200
    qr_data = qr_res.json()
    assert qr_data["bank_id"] == "MB"
    assert "img.vietqr.io" in qr_data["qr_quick_url"]
    assert "DWELL" in qr_data["transfer_content"]
