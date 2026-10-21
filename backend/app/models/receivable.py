from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime, date

from app.database import Base


class Receivable(Base):
    __tablename__ = "receivables"

    __table_args__ = (
        UniqueConstraint(
            "contract_id",
            "billing_month",
            "billing_year",
            name="uq_receivable_contract_period"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    contract_id = Column(
        Integer,
        ForeignKey("contracts.id"),
        nullable=False
    )

    apartment_id = Column(
        Integer,
        ForeignKey("apartments.id"),
        nullable=False
    )

    billing_month = Column(
        Integer,
        nullable=False
    )

    billing_year = Column(
        Integer,
        nullable=False
    )

    room_amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    service_amount = Column(
        Numeric(12, 2),
        default=0
    )

    total_amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    paid_amount = Column(
        Numeric(12, 2),
        default=0
    )

    status = Column(
        String(20),
        default="UNPAID"
    )

    due_date = Column(
        Date,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.now
    )

    # Quan hệ SQLAlchemy
    contract = relationship("Contract", back_populates="receivables")
    apartment = relationship("Apartment", back_populates="receivables")
    payments = relationship("Payment", back_populates="receivable", cascade="all, delete-orphan")

    # Phương thức nghiệp vụ OOP (Domain Model Methods)
    def remaining_amount(self) -> float:
        return float(self.total_amount) - float(self.paid_amount)

    def is_fully_paid(self) -> bool:
        return self.status == "PAID" or self.remaining_amount() <= 0

    def is_overdue(self) -> bool:
        return not self.is_fully_paid() and date.today() > self.due_date

    @property
    def room_number(self) -> str:
        return self.apartment.room_number if self.apartment else ""

    @property
    def building_name(self) -> str:
        return self.apartment.building.name if (self.apartment and self.apartment.building) else ""

    @property
    def tenant_id(self) -> int | None:
        return self.contract.tenant_id if self.contract else None

    @property
    def tenant_name(self) -> str:
        if self.contract and self.contract.tenant:
            return self.contract.tenant.full_name
        return ""

    @property
    def tenant_phone(self) -> str:
        if self.contract and self.contract.tenant:
            return self.contract.tenant.phone
        return ""