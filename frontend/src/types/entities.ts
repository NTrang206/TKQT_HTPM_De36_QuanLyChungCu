// 17 Entities conforming to Object-Oriented Design (04_GenAI_SoftwareDevelopment_object-oriented-design.docx)

export type UserRole = 'ADMIN' | 'STAFF' | 'ACCOUNTANT' | 'TENANT' | 'GUEST';

export type ApartmentStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';

export type DepositStatus = 'PENDING' | 'HELD' | 'REFUNDED' | 'DEDUCTED';

export type ReceivableStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type AlertType = 'EXPIRED_CONTRACT' | 'OVERDUE_DEBT' | 'MAINTENANCE_ANOMALY';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CONVERTED';

// 1. Role
export interface IRole {
  id: number;
  roleCode: UserRole;
  roleName: string;
  description: string;
  createdAt: string;
}

// 2. User
export interface IUser {
  id: number;
  roleId: number;
  roleCode: UserRole;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  tenantId?: number;
  assignedBuildingIds?: number[];
}

// 3. Building
export interface IBuilding {
  id: number;
  name: string;
  address: string;
  totalFloors: number;
  totalApartments: number;
  occupiedCount: number;
  availableCount: number;
  maintenanceCount: number;
  reservedCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  managerName: string;
  contactPhone: string;
  imageUrl?: string;
  monthlyRevenueEstimate: number;
}

// 4. Apartment
export interface IApartment {
  id: number;
  buildingId: number;
  buildingName: string;
  roomNumber: string;
  floor: number;
  areaSqm: number;
  price: number;
  depositDefault: number;
  maxOccupants: number;
  currentOccupants: number;
  bedrooms: number;
  bathrooms: number;
  viewDirection: string;
  status: ApartmentStatus;
  description: string;
  imageUrl: string;
  amenities: IAmenity[];
  createdAt?: string;
}

// 5. Amenity
export interface IAmenity {
  id: number;
  apartmentId: number;
  name: string;
  brand: string;
  serialNumber?: string;
  conditionStatus: 'GOOD' | 'DAMAGED' | 'REPAIRED';
  category: 'FURNITURE' | 'ELECTRONICS' | 'SANITARY' | 'SECURITY' | 'APPLIANCE';
}

// 6. Tenant
export interface ITenant {
  id: number;
  fullName: string;
  citizenId: string;
  phone: string;
  email: string;
  hometown: string;
  isBadDebt: boolean;
  createdAt: string;
  userId?: number;
  username?: string;
  currentApartmentId?: number;
  currentRoomNumber?: string;
  buildingName?: string;
  activeContractId?: number;
  emergencyContacts: IEmergencyContact[];
  roommates: IRoommate[];
  totalHeldDeposit: number;
  creditScore: number;
}

// 7. Roommate
export interface IRoommate {
  id: number;
  tenantId: number;
  apartmentId: number;
  fullName: string;
  citizenId: string;
  phone: string;
  relationship: string;
  isRegisteredTemp: boolean;
  registeredDate?: string;
}

// 8. Emergency Contact
export interface IEmergencyContact {
  id: number;
  tenantId: number;
  fullName: string;
  phone: string;
  relationship: string;
}

// 9. Contract (with AI 5 Core Terms)
export interface IContractAISummary {
  term1_duration: string; // Thời hạn hợp đồng & quy định gia hạn
  term2_rentalPrice: string; // Giá thuê cố định & tiền cọc bảo đảm
  term3_paymentObligation: string; // Nghĩa vụ thanh toán & phí dịch vụ kèm theo
  term4_penalties: string; // Phạt chậm trả & chế tài vi phạm
  term5_termination: string; // Điều kiện chấm dứt HĐ & bàn giao phòng
  confidenceScore: number;
  extractedAt: string;
}

export interface IContract {
  id: number;
  contractCode: string;
  apartmentId: number;
  roomNumber: string;
  buildingName: string;
  tenantId: number;
  tenantName: string;
  tenantCitizenId: string;
  tenantPhone: string;
  tenantEmail: string;
  startDate: string;
  endDate: string;
  rentalPrice: number;
  depositAmount: number;
  paymentCycleMonths: number;
  paymentDueDay: number;
  status: ContractStatus;
  createdBy: number;
  createdByName?: string;
  approvedBy?: number;
  approvedByName?: string;
  createdAt: string;
  bookingId?: number;
  aiSummary: IContractAISummary;
  pdfUrl?: string;
}

// 10. Deposit
export interface IDeposit {
  id: number;
  contractId: number;
  contractCode: string;
  roomNumber: string;
  tenantName: string;
  amount: number;
  paidDate?: string;
  status: DepositStatus;
  refundAmount: number;
  deductionAmount: number;
  deductionReason?: string;
  handledBy?: number;
  handledByName?: string;
  createdAt: string;
}

// 11. Receivable (Monthly Bill / Invoice)
export interface IReceivable {
  id: number;
  contractId: number;
  apartmentId: number;
  roomNumber: string;
  buildingName: string;
  tenantId: number;
  tenantName: string;
  tenantPhone: string;
  billingMonth: number;
  billingYear: number;
  roomAmount: number;
  serviceAmount: number;
  electricityCost: number;
  electricityUsageKwh: number;
  waterCost: number;
  waterUsageM3: number;
  managementCost: number;
  parkingCost: number;
  internetCost: number;
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
  status: ReceivableStatus;
  dueDate: string;
  createdAt: string;
  qrPayload?: string;
}

// 12. Payment
export interface IPayment {
  id: number;
  receivableId: number;
  contractId: number;
  receiptNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionCode: string;
  paymentDate: string;
  note: string;
  handledBy: number;
  handledByName: string;
  payerName: string;
  roomNumber: string;
}

// 13. Debt Ledger
export interface IDebtLedger {
  id: number;
  tenantId: number;
  tenantName: string;
  tenantPhone: string;
  roomNumber: string;
  buildingName: string;
  totalReceivable: number;
  totalPaid: number;
  currentDebt: number;
  lastUpdated: string;
  isOverdue: boolean;
}

// 14. Maintenance Request
export interface IMaintenanceRequest {
  id: number;
  ticketCode: string;
  apartmentId: number;
  roomNumber: string;
  buildingName: string;
  reporterName: string;
  phone: string;
  issueDescription: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'APPLIANCE' | 'DOOR_LOCK' | 'OTHER';
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  repairCost: number;
  assignedStaffId?: number;
  technicianName?: string;
  technicianPhone?: string;
  technicianAvatar?: string;
  createdAt: string;
  resolvedAt?: string;
  imageUrl?: string;
  tenantId?: number;
  slaMinutes: number;
  rating?: number;
  feedback?: string;
}

// 15. System Alert
export interface ISystemAlert {
  id: number;
  alertCode: string;
  alertType: AlertType;
  referenceId: number;
  referenceCode: string;
  targetName: string;
  targetPhone: string;
  roomNumber: string;
  buildingName: string;
  amountDue?: number;
  daysOverdue?: number;
  daysUntilExpiry?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isSent: boolean;
  sentChannels: ('ZALO' | 'SMS' | 'EMAIL' | 'APP_PUSH')[];
  aiDraftContent: {
    scenario: 'FRIENDLY_REMINDER' | 'OVERDUE_WITH_PENALTY' | 'CONTRACT_RENEWAL' | 'SERVICE_SUSPENSION_WARNING';
    tone: 'EMPATHETIC' | 'STRICT' | 'CONCISE_SMS';
    subject: string;
    body: string;
    generatedAt: string;
  };
  createdAt: string;
}

// 16. Document Chunk (RAG Knowledge Base)
export interface IDocumentChunk {
  id: number;
  docCode: string;
  documentName: string;
  title: string;
  chunkIndex: number;
  category: 'ELEVATOR' | 'SECURITY_FIRE' | 'LIVING_RULES' | 'RENOVATION' | 'BILLING' | 'PARKING';
  content: string;
  similarityScore?: number;
  citation: string;
  createdAt: string;
}

// 17. Booking
export interface IBooking {
  id: number;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCitizenId?: string;
  apartmentId: number;
  roomNumber: string;
  buildingName: string;
  monthlyPrice: number;
  checkInDate: string;
  depositAmount: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  convertedContractId?: number;
}
