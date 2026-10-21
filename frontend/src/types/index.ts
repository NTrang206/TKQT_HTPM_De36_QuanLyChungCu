export * from './entities';

// UI State and Filter Types
export interface IPaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  total?: number;
  page?: number;
  limit?: number;
}

export interface IDashboardStats {
  occupancyRate: number;
  occupiedRooms: number;
  totalRooms: number;
  vacantRooms: number;
  reservedRooms: number;
  maintenanceRooms: number;
  totalRevenueMonth: number;
  targetRevenueMonth: number;
  revenueGrowthMoM: number;
  netOperatingIncome: number;
  noiMarginPercent: number;
  totalDebtOverdue: number;
  overdueDebtCount: number;
  debtChangeMoM: number;
  csatScore: number;
  avgMaintenanceSlaHours: number;
  activeContractsCount: number;
  expiringContractsCount: number;
  draftContractsCount: number;
  totalDepositsHeld: number;
}
