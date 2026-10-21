from pydantic import BaseModel, ConfigDict
from datetime import datetime


class BuildingCreate(BaseModel):
    building_code: str
    name: str
    address: str
    total_floors: int = 1
    total_apartments: int = 0
    status: str = "ACTIVE"


class BuildingUpdate(BaseModel):
    building_code: str
    name: str
    address: str
    total_floors: int
    total_apartments: int
    status: str


class BuildingResponse(BaseModel):
    id: int
    building_code: str
    name: str
    address: str
    total_floors: int
    total_apartments: int
    status: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )