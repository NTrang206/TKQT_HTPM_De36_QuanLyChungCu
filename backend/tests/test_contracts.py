from datetime import date, timedelta
from decimal import Decimal


def test_create_contract_success(client, admin_headers):
    today = date.today()
    payload = {
        "apartment_id": 1,
        "tenant_id": 1,
        "start_date": str(today),
        "end_date": str(today + timedelta(days=180)),
        "rental_price": 12000000,
        "deposit_amount": 24000000
    }
    response = client.post("/api/v1/contracts", json=payload, headers=admin_headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "DRAFT"
    assert data["contract_code"].startswith("HD-")
    assert float(data["rental_price"]) == 12000000.0


def test_create_contract_invalid_dates(client, admin_headers):
    today = date.today()
    payload = {
        "apartment_id": 1,
        "tenant_id": 1,
        "start_date": str(today),
        "end_date": str(today - timedelta(days=1)),
        "rental_price": 12000000,
        "deposit_amount": 24000000
    }
    response = client.post("/api/v1/contracts", json=payload, headers=admin_headers)
    assert response.status_code == 400
    assert "sau ngày bắt đầu" in response.json()["error"]["message"]


def test_create_contract_schedule_conflict(client, admin_headers):
    today = date.today()
    # Tạo hợp đồng 1
    client.post(
        "/api/v1/contracts",
        json={
            "apartment_id": 1,
            "tenant_id": 1,
            "start_date": str(today),
            "end_date": str(today + timedelta(days=90)),
            "rental_price": 12000000,
            "deposit_amount": 24000000
        },
        headers=admin_headers
    )

    # Thử tạo hợp đồng 2 với thời gian giao thoa
    conflict_payload = {
        "apartment_id": 1,
        "tenant_id": 1,
        "start_date": str(today + timedelta(days=30)),
        "end_date": str(today + timedelta(days=120)),
        "rental_price": 12000000,
        "deposit_amount": 24000000
    }
    response = client.post("/api/v1/contracts", json=conflict_payload, headers=admin_headers)
    assert response.status_code == 400
    assert "trùng" in response.json()["error"]["message"] or "hiệu lực" in response.json()["error"]["message"]


def test_activate_contract_flow(client, admin_headers):
    today = date.today()
    c_res = client.post(
        "/api/v1/contracts",
        json={
            "apartment_id": 1,
            "tenant_id": 1,
            "start_date": str(today),
            "end_date": str(today + timedelta(days=180)),
            "rental_price": 12000000,
            "deposit_amount": 24000000
        },
        headers=admin_headers
    )
    contract_id = c_res.json()["id"]

    # Kích hoạt trực tiếp khi chưa thu cọc -> Báo lỗi 400
    activate_res = client.patch(f"/api/v1/contracts/{contract_id}/activate", headers=admin_headers)
    assert activate_res.status_code == 400
    assert "chưa được thu" in activate_res.json()["error"]["message"]

    # Thu tiền cọc sang HELD
    deposit_res = client.patch(
        f"/api/v1/deposits/contract/{contract_id}/receive",
        json={"amount": 24000000},
        headers=admin_headers
    )
    assert deposit_res.status_code == 200
    assert deposit_res.json()["status"] == "HELD"

    # Kích hoạt thành công -> Hợp đồng ACTIVE, Căn hộ OCCUPIED
    activate_success = client.patch(f"/api/v1/contracts/{contract_id}/activate", headers=admin_headers)
    assert activate_success.status_code == 200
    assert activate_success.json()["status"] == "ACTIVE"

    # Kiểm tra trạng thái căn hộ đã chuyển sang OCCUPIED
    apt_res = client.get("/api/v1/apartments/1")
    assert apt_res.status_code == 200
    assert apt_res.json()["status"] == "OCCUPIED"


def test_terminate_contract_flow(client, admin_headers):
    today = date.today()
    c_res = client.post(
        "/api/v1/contracts",
        json={
            "apartment_id": 1,
            "tenant_id": 1,
            "start_date": str(today),
            "end_date": str(today + timedelta(days=180)),
            "rental_price": 12000000,
            "deposit_amount": 24000000
        },
        headers=admin_headers
    )
    contract_id = c_res.json()["id"]
    client.patch(f"/api/v1/deposits/contract/{contract_id}/receive", json={"amount": 24000000}, headers=admin_headers)
    client.patch(f"/api/v1/contracts/{contract_id}/activate", headers=admin_headers)

    # Thanh lý hợp đồng và chuyển phòng về AVAILABLE
    term_res = client.post(
        f"/api/v1/contracts/{contract_id}/terminate",
        json={"needs_maintenance": False},
        headers=admin_headers
    )
    assert term_res.status_code == 200
    assert term_res.json()["status"] == "TERMINATED"

    apt_res = client.get("/api/v1/apartments/1")
    assert apt_res.json()["status"] == "AVAILABLE"
