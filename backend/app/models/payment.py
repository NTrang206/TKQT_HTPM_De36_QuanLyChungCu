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


class Payment(Base):
    __tablename__ = "payments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    receivable_id = Column(
        Integer,
        ForeignKey("receivables.id"),
        nullable=False
    )

    amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    payment_method = Column(
        String(30),
        nullable=False
    )

    transaction_code = Column(
        String(50),
        unique=True,
        nullable=True
    )

    payment_date = Column(
        DateTime,
        default=datetime.now
    )

    note = Column(
        String(255),
        nullable=True
    )

    handled_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # Quan hệ SQLAlchemy
    receivable = relationship("Receivable", back_populates="payments")
    handler = relationship("User", foreign_keys=[handled_by])

    @property
    def room_number(self) -> str:
        return self.receivable.room_number if self.receivable else ""

    @property
    def payer_name(self) -> str:
        return self.receivable.tenant_name if self.receivable else ""

    @property
    def handled_by_name(self) -> str:
        return self.handler.full_name if self.handler else ""