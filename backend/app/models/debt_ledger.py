from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    ForeignKey,
    Numeric
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class DebtLedger(Base):
    __tablename__ = "debt_ledger"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id"),
        unique=True,
        nullable=False
    )

    total_receivable = Column(
        Numeric(14, 2),
        default=0
    )

    total_paid = Column(
        Numeric(14, 2),
        default=0
    )

    current_debt = Column(
        Numeric(14, 2),
        default=0
    )

    last_updated = Column(
        DateTime,
        default=datetime.now
    )

    # Quan hệ SQLAlchemy
    tenant = relationship("Tenant", back_populates="debt_ledger")

    # Phương thức nghiệp vụ
    def has_debt(self) -> bool:
        return float(self.current_debt) > 0

    @property
    def tenant_name(self) -> str:
        return self.tenant.full_name if self.tenant else ""

    @property
    def tenant_phone(self) -> str:
        return self.tenant.phone if self.tenant else ""