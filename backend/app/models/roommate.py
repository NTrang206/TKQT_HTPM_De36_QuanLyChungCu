from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey
)
from sqlalchemy.orm import relationship as sa_relationship

from app.database import Base


class Roommate(Base):
    __tablename__ = "roommates"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id"),
        nullable=False
    )

    apartment_id = Column(
        Integer,
        ForeignKey("apartments.id"),
        nullable=False
    )

    full_name = Column(
        String(100),
        nullable=False
    )

    citizen_id = Column(
        String(20),
        nullable=False
    )

    phone = Column(
        String(20),
        nullable=True
    )

    relationship = Column(
        String(50),
        nullable=True
    )

    # Quan hệ SQLAlchemy
    tenant = sa_relationship("Tenant", back_populates="roommates")