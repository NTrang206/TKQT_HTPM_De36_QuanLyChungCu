from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    role_code = Column(
        String(30),
        unique=True,
        nullable=False
    )

    role_name = Column(
        String(50),
        nullable=False
    )

    description = Column(
        String(255),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.now
    )

    # Quan hệ SQLAlchemy
    users = relationship("User", back_populates="role")