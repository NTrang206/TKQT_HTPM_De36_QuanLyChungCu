from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Building(Base):
    __tablename__ = "buildings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    building_code = Column(
        String(30),
        unique=True,
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )

    address = Column(
        String(255),
        nullable=False
    )

    total_floors = Column(
        Integer,
        default=1
    )

    total_apartments = Column(
        Integer,
        default=0
    )

    status = Column(
        String(30),
        default="ACTIVE"
    )

    created_at = Column(
        DateTime,
        default=datetime.now
    )

    # Quan hệ SQLAlchemy
    apartments = relationship("Apartment", back_populates="building", cascade="all, delete-orphan")