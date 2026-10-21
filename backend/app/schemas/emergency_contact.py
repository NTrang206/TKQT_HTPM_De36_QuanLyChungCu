from pydantic import BaseModel, ConfigDict


class EmergencyContactCreate(BaseModel):
    tenant_id: int
    full_name: str
    phone: str
    relationship: str


class EmergencyContactUpdate(BaseModel):
    full_name: str
    phone: str
    relationship: str


class EmergencyContactResponse(BaseModel):
    id: int
    tenant_id: int
    full_name: str
    phone: str
    relationship: str

    model_config = ConfigDict(
        from_attributes=True
    )