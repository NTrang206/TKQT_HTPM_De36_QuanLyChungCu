from datetime import date, timedelta


def test_ai_contract_summarizer(client, admin_headers):
    # 1. Tạo hợp đồng để tóm tắt
    today = date.today()
    c_res = client.post(
        "/api/v1/contracts",
        json={
            "apartment_id": 1,
            "tenant_id": 1,
            "start_date": str(today),
            "end_date": str(today + timedelta(days=365)),
            "rental_price": 15000000,
            "deposit_amount": 30000000
        },
        headers=admin_headers
    )
    contract_id = c_res.json()["id"]

    # 2. Gọi API AI tóm tắt hợp đồng
    sum_res = client.post(
        "/api/v1/ai/summarize-contract",
        json={"contract_id": contract_id},
        headers=admin_headers
    )
    assert sum_res.status_code == 200, sum_res.text
    data = sum_res.json()
    assert data["contract_id"] == contract_id
    assert "core_terms" in data

    terms = data["core_terms"]
    assert "15,000,000" in terms["rental_price"]
    assert "30,000,000" in terms["deposit_terms"]
    assert "10" in terms["payment_due_date"]
    assert "bồi hoàn" in terms["refund_and_termination_policy"].lower() or "hoàn trả" in terms["refund_and_termination_policy"].lower()


def test_ai_dunning_message_generator(client, admin_headers, accountant_headers):
    # 1. Tạo một hợp đồng và tạo khoản thu
    today = date.today()
    c_res = client.post(
        "/api/v1/contracts",
        json={
            "apartment_id": 1,
            "tenant_id": 1,
            "start_date": str(today),
            "end_date": str(today + timedelta(days=180)),
            "rental_price": 10000000,
            "deposit_amount": 20000000
        },
        headers=admin_headers
    )
    contract_id = c_res.json()["id"]
    client.patch(f"/api/v1/deposits/contract/{contract_id}/receive", json={"amount": 20000000}, headers=accountant_headers)
    client.patch(f"/api/v1/contracts/{contract_id}/activate", headers=admin_headers)

    r_res = client.post(
        "/api/v1/receivables",
        json={
            "contract_id": contract_id,
            "billing_month": 5,
            "billing_year": 2026,
            "service_amount": 300000
        },
        headers=accountant_headers
    )
    assert r_res.status_code == 200, r_res.text
    rec_id = r_res.json()["id"]

    # 2. Gọi AI sinh thông điệp nhắc nợ
    dunning_res = client.post(
        "/api/v1/ai/generate-dunning-message",
        json={"receivable_id": rec_id, "urgency_level": "NORMAL"},
        headers=accountant_headers
    )
    assert dunning_res.status_code == 200, dunning_res.text
    dunning_data = dunning_res.json()
    assert dunning_data["receivable_id"] == rec_id
    assert dunning_data["recipient_name"] != ""
    assert "Dwell" in dunning_data["email_subject"] or "DWELL" in dunning_data["email_subject"]
    assert "vietqr.io" in dunning_data["vietqr_quick_link"]
    assert len(dunning_data["message_body"]) > 50


def test_rag_chat_resident_rules_found(client):
    # Cư dân hỏi về việc nuôi thú cưng
    rag_res = client.post(
        "/api/v1/ai/rag-chat",
        json={"question": "Tôi có được nuôi chó mèo trong căn hộ không?"}
    )
    assert rag_res.status_code == 200, rag_res.text
    data = rag_res.json()
    assert data["has_context"] is True
    assert len(data["citations"]) > 0
    assert any("Điều 3" in cit or "Nuôi Thú cưng" in cit for cit in data["citations"])
    assert "chó" in data["answer"].lower() or "mèo" in data["answer"].lower()


def test_rag_chat_no_context_guardrail(client):
    # Cư dân hỏi câu hỏi hoàn toàn nằm ngoài tài liệu nội quy
    rag_res = client.post(
        "/api/v1/ai/rag-chat",
        json={"question": "Thời tiết ngày mai ở Tokyo có mưa không?"}
    )
    assert rag_res.status_code == 200, rag_res.text
    data = rag_res.json()
    # Tuân thủ nguyên tắc No Context -> No Answer
    assert data["has_context"] is False
    assert len(data["citations"]) == 0
    assert "không đề cập" in data["answer"] or "không có thông tin" in data["answer"]
    assert "1900 6868" in data["answer"]


def test_get_knowledge_chunks(client):
    res = client.get("/api/v1/ai/knowledge-chunks")
    assert res.status_code == 200
    chunks = res.json()
    assert len(chunks) >= 10
