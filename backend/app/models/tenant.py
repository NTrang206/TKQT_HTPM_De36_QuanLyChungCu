from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String(100),
        nullable=False
    )

    citizen_id = Column(
        String(20),
        unique=True,
        nullable=False
    )

    phone = Column(
        String(20),
        nullable=False
    )

    email = Column(
        String(100),
        nullable=True
    )

    hometown = Column(
        String(100),
        nullable=True
    )

    is_bad_debt = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.now
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        unique=True
    )

    # Quan hệ SQLAlchemy
    user = relationship("User", back_populates="tenant", foreign_keys=[user_id])
    contracts = relationship("Contract", back_populates="tenant", cascade="all, delete-orphan")
    roommates = relationship("Roommate", back_populates="tenant", cascade="all, delete-orphan")
    emergency_contacts = relationship("EmergencyContact", back_populates="tenant", cascade="all, delete-orphan")
    debt_ledger = relationship("DebtLedger", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="tenant")

    # Phương thức nghiệp vụ OOP (Domain Model Methods)
    @property
    def current_apartment_id(self):
        for c in self.contracts:
            if c.status == "ACTIVE":
                return c.apartment_id
        return None

    @property
    def current_room_number(self):
        for c in self.contracts:
            if c.status == "ACTIVE" and c.apartment:
                return c.apartment.room_number
        return None

    @property
    def building_name(self):
        for c in self.contracts:
            if c.status == "ACTIVE" and c.apartment and c.apartment.building:
                return c.apartment.building.name
        return None

    def mark_bad_debt(self, status: bool = True) -> None:
        self.is_bad_debt = status

    def has_active_contract(self) -> bool:
        if not self.contracts:
            return False
        return any(c.status == "ACTIVE" for c in self.contracts)