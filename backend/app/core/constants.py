from enum import Enum


class ApartmentStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    OCCUPIED = "OCCUPIED"
    MAINTENANCE = "MAINTENANCE"


class ContractStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    TERMINATED = "TERMINATED"


class DepositStatus(str, Enum):
    PENDING = "PENDING"
    HELD = "HELD"
    REFUNDED = "REFUNDED"
    DEDUCTED = "DEDUCTED"


class ReceivableStatus(str, Enum):
    UNPAID = "UNPAID"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    OVERDUE = "OVERDUE"


class PaymentMethod(str, Enum):
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    MOMO = "MOMO"
    VNPAY = "VNPAY"
    DEPOSIT_OFFSET = "DEPOSIT_OFFSET"


class MaintenancePriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class MaintenanceStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CONVERTED = "CONVERTED"
    CANCELLED = "CANCELLED"


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    ACCOUNTANT = "ACCOUNTANT"
    TENANT = "TENANT"


class AlertType(str, Enum):
    OVERDUE_RECEIVABLE = "OVERDUE_RECEIVABLE"
    EXPIRING_CONTRACT = "EXPIRING_CONTRACT"
    MAINTENANCE_PENDING = "MAINTENANCE_PENDING"
