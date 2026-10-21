from pydantic import BaseModel, ConfigDict


class AmenityCreate(BaseModel):
    apartment_id: int
    name: str
    brand: str | None = None
    serial_number: str | None = None
    condition_status: str = "GOOD"


class AmenityUpdate(BaseModel):
    apartment_id: int
    name: str
    brand: str | None = None
    serial_number: str | None = None
    condition_status: str


class AmenityResponse(BaseModel):
    id: int
    apartment_id: int
    name: str
    brand: str | None
    serial_number: str | None
    condition_status: str

    model_config = ConfigDict(
        from_attributes=True
    )