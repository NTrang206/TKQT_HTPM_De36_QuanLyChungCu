from pydantic import (
    BaseModel,
    ConfigDict,
    Field
)

from datetime import datetime


class AlertScanRequest(BaseModel):
    days_to_end: int = Field(
        default=30,
        ge=15,
        le=30
    )


class AlertMarkSentRequest(BaseModel):
    channel: str


class SystemAlertResponse(BaseModel):
    id: int
    alert_type: str
    reference_id: int
    message: str
    is_sent: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )