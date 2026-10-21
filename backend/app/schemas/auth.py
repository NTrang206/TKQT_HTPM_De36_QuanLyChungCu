from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str
class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
class TenantRegisterRequest(BaseModel):
    citizen_id: str
    phone: str

    username: str
    password: str

    email: str | None = None