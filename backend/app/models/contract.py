from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    Text
)
from sqlalchemy.orm import relationship
from datetime import datetime, date

from app.database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    contract_code = Column(
        String(50),
        unique=True,
        nullable=False
    )

    apartment_id = Column(
        Integer,
        ForeignKey("apartments.id"),
        nullable=False
    )

    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id"),
        nullable=False
    )

    start_date = Column(
        Date,
        nullable=False
    )

    end_date = Column(
        Date,
        nullable=False
    )

    rental_price = Column(
        Numeric(12, 2),
        nullable=False
    )

    deposit_amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    status = Column(
        String(20),
        default="DRAFT"
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    approved_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.now
    )

    booking_id = Column(
        Integer,
        ForeignKey("bookings.id"),
        nullable=True
    )

    # Cột lưu trữ tóm tắt 5 điều khoản cốt lõi bằng AI (AI-FR01)
    ai_summary = Column(
        Text,
        nullable=True
    )

    # Quan hệ SQLAlchemy
    apartment = relationship("Apartment", back_populates="contracts")
    tenant = relationship("Tenant", back_populates="contracts")
    deposit = relationship("Deposit", back_populates="contract", uselist=False, cascade="all, delete-orphan")
    receivables = relationship("Receivable", back_populates="contract", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])
    booking = relationship("Booking", back_populates="contract")

    # Phương thức nghiệp vụ OOP (Domain Model Methods)
    def is_active(self) -> bool:
        return self.status == "ACTIVE"

    def is_expired(self) -> bool:
        return date.today() > self.end_date

    def days_remaining(self) -> int:
        delta = (self.end_date - date.today()).days
        return max(0, delta)

    @property
    def tenant_name(self) -> str:
        return self.tenant.full_name if self.tenant else ""

    @property
    def tenant_phone(self) -> str:
        return self.tenant.phone if self.tenant else ""

    @property
    def tenant_citizen_id(self) -> str:
        return self.tenant.citizen_id if self.tenant else ""

    @property
    def tenant_email(self) -> str:
        return self.tenant.email if self.tenant else ""

    @property
    def room_number(self) -> str:
        return self.apartment.room_number if self.apartment else ""

    @property
    def building_name(self) -> str:
        return self.apartment.building.name if (self.apartment and self.apartment.building) else ""