import re
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class TenantCreate(BaseModel):
    full_name: str
    citizen_id: str
    phone: str
    email: Optional[str] = None
    hometown: Optional[str] = None

    @field_validator("citizen_id")
    @classmethod
    def validate_citizen_id(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^\d{9,12}$", clean):
            raise ValueError("Số CMND/CCCD phải gồm 9 đến 12 chữ số hợp lệ")
        return clean

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^0\d{9,10}$", clean):
            raise ValueError("Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và có 10-11 số)")
        return clean


class TenantUpdate(BaseModel):
    full_name: str
    citizen_id: str
    phone: str
    email: Optional[str] = None
    hometown: Optional[str] = None
    is_bad_debt: bool = False

    @field_validator("citizen_id")
    @classmethod
    def validate_citizen_id(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^\d{9,12}$", clean):
            raise ValueError("Số CMND/CCCD phải gồm 9 đến 12 chữ số hợp lệ")
        return clean

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^0\d{9,10}$", clean):
            raise ValueError("Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và có 10-11 số)")
        return clean


class TenantResponse(BaseModel):
    id: int
    full_name: str
    citizen_id: str
    phone: str
    email: Optional[str] = None
    hometown: Optional[str] = None
    is_bad_debt: bool
    user_id: Optional[int] = None
    username: Optional[str] = None
    current_apartment_id: Optional[int] = None
    current_room_number: Optional[str] = None
    building_name: Optional[str] = None
    roommates: Optional[List[dict]] = None
    emergency_contacts: Optional[List[dict]] = None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class TenantSummaryResponse(BaseModel):
    id: int
    full_name: str
    citizen_id: str
    phone: str
    email: Optional[str]
    hometown: Optional[str]
    is_bad_debt: bool
    current_debt: Decimal
    total_paid: Decimal
    contracts_count: int
    active_contracts: List[dict]
    roommates_count: int
    maintenance_requests_count: int