from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey
)
from sqlalchemy.orm import relationship

from app.database import Base


class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    apartment_id = Column(
        Integer,
        ForeignKey("apartments.id"),
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )

    brand = Column(
        String(50),
        nullable=True
    )

    serial_number = Column(
        String(50),
        nullable=True
    )

    condition_status = Column(
        String(50),
        default="GOOD"
    )

    # Quan hệ SQLAlchemy
    apartment = relationship("Apartment", back_populates="amenities")