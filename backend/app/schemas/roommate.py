from pydantic import BaseModel, ConfigDict


class RoommateCreate(BaseModel):
    tenant_id: int
    apartment_id: int
    full_name: str
    citizen_id: str
    phone: str | None = None
    relationship: str | None = None


class RoommateUpdate(BaseModel):
    tenant_id: int
    apartment_id: int
    full_name: str
    citizen_id: str
    phone: str | None = None
    relationship: str | None = None


class RoommateResponse(BaseModel):
    id: int
    tenant_id: int
    apartment_id: int
    full_name: str
    citizen_id: str
    phone: str | None
    relationship: str | None

    model_config = ConfigDict(
        from_attributes=True
    )