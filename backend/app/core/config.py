from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Hệ thống quản lý thuê căn hộ Dwell"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./quan_ly_can_ho.db"

    # JWT Security
    JWT_SECRET: str = "super_secret_jwt_key_sunshine_homes_2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 8

    # AI Configuration (Google Gemini)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # VietQR Napas247 Configuration
    VIETQR_BANK_ID: str = "MB"
    VIETQR_ACCOUNT_NO: str = "0123456789"
    VIETQR_ACCOUNT_NAME: str = "HE THONG CAN HO CHO THUE DWELL"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
