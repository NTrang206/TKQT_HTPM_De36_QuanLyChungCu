from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Numeric
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Apartment(Base):
    __tablename__ = "apartments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    building_id = Column(
        Integer,
        ForeignKey("buildings.id"),
        nullable=False
    )

    room_number = Column(
        String(20),
        nullable=False
    )

    floor = Column(
        Integer,
        nullable=False
    )

    area_sqm = Column(
        Numeric(6, 2),
        nullable=False
    )

    price = Column(
        Numeric(12, 2),
        nullable=False
    )

    max_occupants = Column(
        Integer,
        default=2
    )

    status = Column(
        String(20),
        default="AVAILABLE"
    )

    created_at = Column(
        DateTime,
        default=datetime.now
    )

    # Quan hệ SQLAlchemy
    building = relationship("Building", back_populates="apartments")
    contracts = relationship("Contract", back_populates="apartment", cascade="all, delete-orphan")
    amenities = relationship("Amenity", back_populates="apartment", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="apartment", cascade="all, delete-orphan")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="apartment")
    receivables = relationship("Receivable", back_populates="apartment")

    @property
    def building_name(self) -> str:
        return self.building.name if self.building else "Sunshine Diamond Tower"

    # Phương thức nghiệp vụ OOP (Domain Model Methods)
    def is_available(self) -> bool:
        return self.status == "AVAILABLE"

    def can_reserve(self) -> bool:
        return self.status == "AVAILABLE"

    def can_occupy(self) -> bool:
        return self.status in ["AVAILABLE", "RESERVED"]