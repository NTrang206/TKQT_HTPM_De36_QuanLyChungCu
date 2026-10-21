from datetime import date, timedelta
from decimal import Decimal


def test_receivable_and_partial_payment(client, admin_headers, accountant_headers):
    # 1. Tạo lại hợp đồng ACTIVE
    today = date.today()
    c_res = client.post(
        "/api/v1/contracts",
        json={
            "apartment_id": 1,
            "tenant_id": 1,
            "start_date": str(today),
            "end_date": str(today + timedelta(days=180)),
            "rental_price": 10000000,
            "deposit_amount": 10000000
        },
        headers=admin_headers
    )
    contract_id = c_res.json()["id"]
    client.patch(f"/api/v1/deposits/contract/{contract_id}/receive", json={"amount": 10000000}, headers=accountant_headers)
    client.patch(f"/api/v1/contracts/{contract_id}/activate", headers=admin_headers)

    # 2. Tạo khoản thu tiền phòng tháng này (10.000.000 + 200.000 dịch vụ)
    r_res = client.post(
        "/api/v1/receivables",
        json={
            "contract_id": contract_id,
            "billing_month": today.month,
            "billing_year": today.year,
            "service_amount": 200000
        },
        headers=accountant_headers
    )
    assert r_res.status_code == 200, r_res.text
    rec = r_res.json()
    assert float(rec["total_amount"]) == 10200000.0
    assert rec["status"] == "UNPAID"
    rec_id = rec["id"]

    # 3. Kiểm tra sổ nợ tự động được đồng bộ (10.200.000)
    debt_res = client.get("/api/v1/debt-ledgers/tenant/1", headers=accountant_headers)
    assert debt_res.status_code == 200
    assert float(debt_res.json()["current_debt"]) == 10200000.0

    # 4. Thanh toán đợt 1 (Partial payment 5.000.000 VNĐ)
    p1_res = client.post(
        "/api/v1/payments",
        json={
            "receivable_id": rec_id,
            "amount": 5000000,
            "payment_method": "CASH",
            "note": "Thanh toán đợt 1"
        },
        headers=accountant_headers
    )
    assert p1_res.status_code == 200

    # 5. Kiểm tra trạng thái khoản thu chuyển sang PARTIALLY_PAID (Chuẩn SRS)
    rec_after_p1 = client.get(f"/api/v1/receivables/{rec_id}", headers=accountant_headers).json()
    assert rec_after_p1["status"] == "PARTIALLY_PAID"
    assert float(rec_after_p1["paid_amount"]) == 5000000.0

    # 6. Kiểm tra chống nộp dư (Còn lại 5.200.000 nhưng nộp 6.000.000)
    overpay_res = client.post(
        "/api/v1/payments",
        json={
            "receivable_id": rec_id,
            "amount": 6000000,
            "payment_method": "CASH"
        },
        headers=accountant_headers
    )
    assert overpay_res.status_code == 400
    assert "vượt quá số nợ còn lại" in overpay_res.json()["error"]["message"]

    # 7. Thanh toán nốt số tiền còn lại (5.200.000 VNĐ)
    p2_res = client.post(
        "/api/v1/payments",
        json={
            "receivable_id": rec_id,
            "amount": 5200000,
            "payment_method": "BANK_TRANSFER",
            "transaction_code": "VIB9988776655",
            "note": "Chuyển khoản thanh toán đợt 2"
        },
        headers=accountant_headers
    )
    assert p2_res.status_code == 200

    # 8. Khoản thu chuyển sang PAID và công nợ về 0
    rec_after_p2 = client.get(f"/api/v1/receivables/{rec_id}", headers=accountant_headers).json()
    assert rec_after_p2["status"] == "PAID"
    assert float(rec_after_p2["paid_amount"]) == 10200000.0

    debt_after = client.get("/api/v1/debt-ledgers/tenant/1", headers=accountant_headers).json()
    assert float(debt_after["current_debt"]) == 0.0
