from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime
)

from datetime import datetime

from app.database import Base


class SystemAlert(Base):
    __tablename__ = "system_alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    alert_type = Column(
        String(30),
        nullable=False
    )

    reference_id = Column(
        Integer,
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    is_sent = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.now
    )