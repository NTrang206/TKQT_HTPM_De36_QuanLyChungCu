from pydantic import BaseModel, ConfigDict
from datetime import datetime


class UserCreate(BaseModel):
    role_code: str

    username: str
    password: str

    full_name: str
    email: str | None = None
    phone: str


class UserUpdate(BaseModel):
    full_name: str
    email: str | None = None
    phone: str


class AssignRoleRequest(BaseModel):
    role_code: str


class UserStatusRequest(BaseModel):
    is_active: bool


class UserResponse(BaseModel):
    id: int
    role_id: int

    username: str
    full_name: str

    email: str | None
    phone: str

    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )