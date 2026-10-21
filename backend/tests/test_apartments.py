def test_get_apartments_and_filter(client):
    # 1. Lấy toàn bộ căn hộ công khai
    res = client.get("/api/v1/apartments")
    assert res.status_code == 200, res.text
    apts = res.json()
    assert len(apts) >= 1

    # 2. Lọc theo building_id
    res_bld = client.get("/api/v1/apartments?building_id=1")
    assert res_bld.status_code == 200
    assert all(a["building_id"] == 1 for a in res_bld.json())

    # 3. Lọc theo khoảng giá
    res_price = client.get("/api/v1/apartments?min_price=10000000&max_price=20000000")
    assert res_price.status_code == 200
    for a in res_price.json():
        assert 10000000 <= float(a["price"]) <= 20000000

    # 4. Kiểm tra lấy chi tiết 1 căn
    detail_res = client.get("/api/v1/apartments/1")
    assert detail_res.status_code == 200
    assert detail_res.json()["room_number"] == "A-101"


def test_tenant_roommates_and_emergency_contacts(client, tenant_headers):
    # Kiểm tra cư dân lấy danh sách roommate và liên hệ khẩn cấp của mình
    r_res = client.get("/api/v1/roommates/my", headers=tenant_headers)
    assert r_res.status_code == 200, r_res.text
    assert isinstance(r_res.json(), list)

    e_res = client.get("/api/v1/emergency-contacts/my", headers=tenant_headers)
    assert e_res.status_code == 200, e_res.text
    assert isinstance(e_res.json(), list)

