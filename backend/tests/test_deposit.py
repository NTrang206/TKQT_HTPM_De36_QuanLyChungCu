from datetime import date, timedelta
from decimal import Decimal


def test_deposit_settlement_with_debt_offset(client, admin_headers, accountant_headers):
    """
    Kiểm thử quyết toán cọc theo chuẩn UC002 (Cấn trừ nợ thực tế).
    Xác minh hệ thống không chặn cọc khi còn nợ, mà cấn trừ nợ thẳng vào cọc hoàn trả.
    """
    today = date.today()
    # 1. Tạo hợp đồng với tiền cọc 10.000.000 VNĐ
    c_res = client.post(
        "/api/v1/contracts",
        json={
            "apartment_id": 1,
            "tenant_id": 1,
            "start_date": str(today - timedelta(days=60)),
            "end_date": str(today + timedelta(days=120)),
            "rental_price": 5000000,
            "deposit_amount": 10000000
        },
        headers=admin_headers
    )
    contract_id = c_res.json()["id"]

    # 2. Thu cọc HELD
    client.patch(f"/api/v1/deposits/contract/{contract_id}/receive", json={"amount": 10000000}, headers=accountant_headers)
    client.patch(f"/api/v1/contracts/{contract_id}/activate", headers=admin_headers)

    # 3. Tạo một khoản thu chưa thanh toán (nợ 3.000.000 VNĐ)
    rec_res = client.post(
        "/api/v1/receivables",
        json={
            "contract_id": contract_id,
            "billing_month": 1,
            "billing_year": 2026,
            "service_amount": 500000
        },
        headers=accountant_headers
    )
    assert rec_res.status_code == 200

    # 4. Xem trước thanh lý cọc (Khấu trừ hư hại 2.000.000 VNĐ)
    preview_res = client.post(
        f"/api/v1/deposits/contract/{contract_id}/settlement-preview",
        json={"deduction_amount": 2000000},
        headers=accountant_headers
    )
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    assert float(preview_data["damage_deduction"]) == 2000000.0
    # Tiền cọc (10M) - Hư hại (2M) - Nợ (5.5M) = Hoàn 2.5M
    assert float(preview_data["estimated_refund"]) == 2500000.0

    # 5. Thực hiện quyết toán cọc chi tiết
    settle_res = client.post(
        f"/api/v1/deposits/contract/{contract_id}/settle-detail",
        json={
            "deduction_amount": 2000000,
            "deduction_reason": "Bồi thường vỡ mặt kính bếp từ"
        },
        headers=accountant_headers
    )
    assert settle_res.status_code == 200, settle_res.text
    settle_data = settle_res.json()

    assert float(settle_data["deposit_amount"]) == 10000000.0
    assert float(settle_data["damage_deduction"]) == 2000000.0
    assert float(settle_data["debt_deduction"]) == 5500000.0
    assert float(settle_data["actual_refund"]) == 2500000.0
    assert float(settle_data["remaining_unpaid_debt"]) == 0.0
    assert settle_data["status"] == "REFUNDED"

    # 6. Kiểm tra lại nợ của khách thuê đã được xóa về 0 nhờ cấn trừ cọc
    debt_res = client.get("/api/v1/debt-ledgers/tenant/1", headers=accountant_headers)
    assert debt_res.status_code == 200
    debt_check = debt_res.json()
    assert float(debt_check["current_debt"]) == 0.0
