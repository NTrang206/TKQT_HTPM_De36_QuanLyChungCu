import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Building,
  ShieldCheck,
  QrCode,
  Wrench,
  Users,
  CheckCircle2,
  AlertTriangle,
  Download,
  Star,
  Home,
  Receipt,
  FileSignature,
  FileText,
  UserPlus,
  Phone,
  Image as ImageIcon,
  ArrowLeft,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { VietQRModal } from '../components/common/VietQRModal';
import { useGetApartmentsQuery } from '../modules/buildings/services/buildingApi';
import { useGetContractsQuery, useRenewContractMutation } from '../modules/contracts/services/contractApi';
import { useGetReceivablesQuery, useRecordPaymentMutation } from '../modules/finance/services/financeApi';
import {
  useGetMaintenanceRequestsQuery,
  useCreateMaintenanceRequestMutation,
  useCompleteAndInspectMaintenanceMutation,
} from '../modules/maintenance/services/maintenanceApi';
import { useGetTenantsQuery, useAddRoommateMutation } from '../modules/tenants/services/tenantApi';
import { formatCurrency, formatDate } from '../utils/formatters';
import { generateVietQRUrl, DEFAULT_BUILDING_BANK_ACCOUNT } from '../utils/vietqr';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export type PortalTab = 'overview' | 'apartment' | 'contract' | 'billing' | 'maintenance';

export const ResidentPortalPage: React.FC = () => {
  const toast = useToast();
  const { user, isManagement } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Queries
  const { data: apartments = [] } = useGetApartmentsQuery({});
  const { data: contracts = [] } = useGetContractsQuery({});
  const { data: receivables = [] } = useGetReceivablesQuery({});
  const { data: maintenanceList = [] } = useGetMaintenanceRequestsQuery({});
  const { data: tenants = [] } = useGetTenantsQuery({});

  // Mutations
  const [recordPayment, { isLoading: isPaying }] = useRecordPaymentMutation();
  const [createMaintenance, { isLoading: isReporting }] = useCreateMaintenanceRequestMutation();
  const [completeMaintenance, { isLoading: isInspecting }] = useCompleteAndInspectMaintenanceMutation();
  const [renewContract, { isLoading: isRenewing }] = useRenewContractMutation();
  const [addRoommate, { isLoading: isAddingRm }] = useAddRoommateMutation();

  // Active Resident Context (Dynamic from Auth and DB)
  const currentTenant = tenants.find((t) => t.userId === user?.id || t.fullName === user?.fullName || t.phone === user?.phone || t.email === user?.email)
    || tenants.find((t) => t.fullName === 'Nguyễn Văn An')
    || tenants[0]
    || {
      id: 1,
      fullName: user?.roleCode === 'TENANT' ? (user?.fullName || 'Nguyễn Văn An') : 'Nguyễn Văn An',
      currentRoomNumber: 'P101',
      phone: user?.phone || '0912.888.999',
      roommates: [],
    };

  const activeContract = contracts.find((c) => c.tenantId === currentTenant?.id && c.status === 'ACTIVE')
    || contracts.find((c) => c.tenantId === currentTenant?.id || c.roomNumber === currentTenant?.currentRoomNumber)
    || contracts.find((c) => c.roomNumber === 'P101')
    || contracts[0];
  const activeApartment = apartments.find((a) => a.id === activeContract?.apartmentId || a.roomNumber === activeContract?.roomNumber || a.roomNumber === currentTenant?.currentRoomNumber)
    || apartments.find((a) => a.roomNumber === 'P101')
    || apartments[0];
  const activeBill = receivables.find((r) => (r.contractId === activeContract?.id || r.tenantId === currentTenant?.id || r.roomNumber === activeApartment?.roomNumber) && r.status !== 'PAID')
    || receivables.find((r) => r.contractId === activeContract?.id || r.tenantId === currentTenant?.id || r.roomNumber === activeApartment?.roomNumber)
    || receivables[0];
  const activeTicket = maintenanceList.find((m) => (m.apartmentId === activeApartment?.id || m.roomNumber === activeApartment?.roomNumber) && m.status === 'IN_PROGRESS')
    || maintenanceList.find((m) => m.apartmentId === activeApartment?.id || m.roomNumber === activeApartment?.roomNumber)
    || maintenanceList[0];

  // Tab State with URL query synchronization
  const paramTab = searchParams.get('tab') as PortalTab | null;
  const validTabs: PortalTab[] = ['overview', 'apartment', 'contract', 'billing', 'maintenance'];
  const [activeTab, setActiveTabState] = useState<PortalTab>(
    paramTab && validTabs.includes(paramTab) ? paramTab : 'overview'
  );

  const setActiveTab = (tab: PortalTab) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as PortalTab | null;
    if (tab && validTabs.includes(tab) && tab !== activeTab) {
      setActiveTabState(tab);
    }
  }, [searchParams]);

  // Modals state
  const [isVietQROpen, setIsVietQROpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isAddRoommateOpen, setIsAddRoommateOpen] = useState(false);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  // New Ticket State
  const [newCategory, setNewCategory] = useState<'PLUMBING' | 'ELECTRICAL' | 'APPLIANCE' | 'DOOR_LOCK' | 'OTHER'>('PLUMBING');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  // Roommate state
  const [rmName, setRmName] = useState('');
  const [rmCitizenId, setRmCitizenId] = useState('');
  const [rmPhone, setRmPhone] = useState('');
  const [rmRelation, setRmRelation] = useState('Vợ / Chồng');

  // Rating state
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('Kỹ thuật viên nhiệt tình, xử lý nhanh chóng.');

  const qrUrl = generateVietQRUrl({
    bankId: 'MB',
    accountNo: DEFAULT_BUILDING_BANK_ACCOUNT.accountNo,
    accountName: DEFAULT_BUILDING_BANK_ACCOUNT.accountName,
    amount: activeBill?.remainingDebt || 15725000,
    description: `${(activeContract?.contractCode || 'HD2026P101').replace(/-/g, '')} T${activeBill?.billingMonth || 10}`,
    template: 'compact2',
  });

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    try {
      await createMaintenance({
        apartmentId: activeApartment?.id || 1,
        roomNumber: activeApartment?.roomNumber || 'P101',
        buildingName: activeApartment?.buildingName || 'Sunshine Diamond Tower',
        reporterName: currentTenant.fullName,
        phone: currentTenant.phone,
        issueDescription: newDesc,
        category: newCategory,
        priority: newPriority,
      }).unwrap();

      toast.success('Đã gửi yêu cầu', 'Bộ phận kỹ thuật tòa nhà đã tiếp nhận và sẽ liên hệ xử lý!');
      setNewDesc('');
    } catch {
      toast.error('Lỗi', 'Không thể gửi yêu cầu lúc này');
    }
  };

  const handleInspectTicket = async () => {
    if (!activeTicket) return;
    try {
      await completeMaintenance({
        ticketId: activeTicket.id,
        cost: activeTicket.repairCost || 150000,
        rating,
        feedback: ratingComment,
        isPass: true,
      }).unwrap();

      toast.success('Nghiệm thu thành công', 'Cảm ơn Quý khách đã xác nhận hoàn thành công việc!');
      setIsInspectModalOpen(false);
    } catch {
      toast.error('Lỗi', 'Không thể nghiệm thu lúc này');
    }
  };

  const handleAddRoommate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addRoommate({
        tenantId: currentTenant.id,
        roommate: {
          apartmentId: activeApartment?.id || 1,
          fullName: rmName,
          citizenId: rmCitizenId,
          phone: rmPhone,
          relationship: rmRelation,
          isRegisteredTemp: true,
          registeredDate: new Date().toISOString().split('T')[0],
        },
      }).unwrap();

      toast.success('Đăng ký thành công', `Hồ sơ tạm trú của ${rmName} đã được cập nhật!`);
      setIsAddRoommateOpen(false);
      setRmName('');
      setRmCitizenId('');
      setRmPhone('');
    } catch {
      toast.error('Lỗi', 'Không thể thêm thành viên');
    }
  };

  const handleDirectTransferConfirm = async () => {
    if (!activeBill) return;
    try {
      await recordPayment({
        receivableId: activeBill.id,
        amount: activeBill.remainingDebt,
        paymentMethod: 'BANK_TRANSFER',
        note: 'Thanh toán chuyển khoản từ Cổng Cư Dân',
      }).unwrap();

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success('Thanh toán thành công', 'Hóa đơn đã được ghi nhận thanh toán thành công!');
    } catch {
      toast.error('Lỗi', 'Không thể xác nhận giao dịch');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 0. BQL SIMULATION NOTICE (Only shown when Admin/Staff/Accountant visits) */}
      {isManagement && (
        <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
                <span>Chế độ Xem Trước Dành Cho Ban Quản Lý</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  {user?.roleCode}
                </span>
              </div>
              <p className="text-amber-800 text-xs mt-0.5">
                Bạn đang xem giao diện thực tế của Khách thuê <strong>{currentTenant.fullName}</strong> tại căn hộ <strong>{activeApartment?.roomNumber} - {activeApartment?.buildingName}</strong>.
              </p>
            </div>
          </div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 font-bold text-slate-800 hover:text-brand-700 bg-white px-3.5 py-2 rounded-xl shadow-xs border border-amber-300 hover:border-brand-300 transition-all text-xs shrink-0 self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Bảng Quản Trị</span>
          </Link>
        </div>
      )}

      {/* 1. TOP WELCOME BANNER (Clean, balanced, no neon AI glows) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
              <Home className="w-3.5 h-3.5 text-slate-600" />
              <span>Cổng Thông Tin Cư Dân</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isManagement ? (
                <span>Xem trước Cổng Cư Dân: <span className="text-brand-700">{currentTenant.fullName}</span></span>
              ) : (
                <span>Xin chào, <span className="text-brand-700">{currentTenant.fullName}</span>!</span>
              )}
            </h1>

            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                Căn hộ {activeApartment?.roomNumber || 'P101'} (Tầng {activeApartment?.floor || 1}, {activeApartment?.buildingName || 'Sunshine Diamond Tower'})
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                <FileSignature className="w-3.5 h-3.5 text-slate-500" />
                Hợp đồng: {activeContract?.contractCode || 'HD-2026-P101'} (Hạn: {formatDate(activeContract?.endDate || '2026-12-31')})
              </span>
            </div>

            {/* Unpaid alert */}
            {activeBill && activeBill.status !== 'PAID' && (
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-semibold mt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Hóa đơn cước phí Tháng {activeBill.billingMonth} chưa thanh toán (Hạn đóng: {formatDate(activeBill.dueDate)})</span>
              </div>
            )}
          </div>

          {/* Quick Pay CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<QrCode className="w-4 h-4" />}
              onClick={() => {
                setActiveTab('billing');
                setIsVietQROpen(true);
              }}
            >
              Thanh Toán VietQR Ngay
            </Button>
          </div>
        </div>
      </div>

      {/* 2. TAB WORKSPACE */}
      <div className="space-y-6">
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 4 Clean Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Card 1: Căn hộ */}
              <div
                onClick={() => setActiveTab('apartment')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-soft transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Căn Hộ Đang Thuê</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                      <Building className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 leading-tight">
                    Phòng {activeApartment?.roomNumber || 'P101'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {activeApartment?.areaSqm || 65.5} m² • {activeApartment?.bedrooms || 2} PN • Tầng {activeApartment?.floor || 1}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Chi tiết đồ đạc bàn giao</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform text-slate-400" />
                </div>
              </div>

              {/* Card 2: Hóa đơn */}
              <div
                onClick={() => setActiveTab('billing')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-soft transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cước Phí Tháng {activeBill?.billingMonth || 9}</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 leading-tight">
                    {formatCurrency(activeBill?.remainingDebt || 21100000)}
                  </div>
                  <div className="text-xs mt-1 truncate">
                    {activeBill?.status === 'PAID' ? (
                      <span className="text-emerald-600 font-bold">● Đã thanh toán</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">● Hạn đóng: {formatDate(activeBill?.dueDate || '2026-09-10')}</span>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-700">
                  <span>Thanh toán VietQR</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform text-slate-400" />
                </div>
              </div>

              {/* Card 3: Hợp đồng */}
              <div
                onClick={() => setActiveTab('contract')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-soft transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hợp Đồng Thuê Nhà</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 leading-tight truncate">
                    {activeContract?.contractCode || 'HD-2026-P101'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    Thời hạn: Đến {formatDate(activeContract?.endDate || '2027-07-27')}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Xem điều khoản hợp đồng</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform text-slate-400" />
                </div>
              </div>

              {/* Card 4: Kỹ thuật */}
              <div
                onClick={() => setActiveTab('maintenance')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-soft transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bảo Trì & Kỹ Thuật</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                      <Wrench className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 leading-tight">
                    {activeTicket?.status === 'IN_PROGRESS' ? '01 Phiếu đang sửa' : 'Hệ Thống Tốt'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {activeTicket?.status === 'IN_PROGRESS' ? activeTicket.issueDescription : 'Không có sự cố nào'}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Gửi yêu cầu sửa chữa</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform text-slate-400" />
                </div>
              </div>
            </div>

            {/* 2 Balanced Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Box 1: Căn hộ & Trang thiết bị (7 cols) */}
              <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Hồ Sơ Căn Hộ & Cư Dân</h3>
                      <div className="text-[11px] text-slate-500">Phòng {activeApartment?.roomNumber || 'P101'} • Tầng {activeApartment?.floor || 1}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('apartment')}
                    className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1"
                  >
                    <span>Xem chi tiết</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {(activeApartment?.amenities && activeApartment.amenities.length > 0 ? activeApartment.amenities : [
                    { id: 1, name: 'Điều hòa Inverter', category: 'Thiết bị làm mát', status: 'GOOD', quantity: 2 },
                    { id: 2, name: 'Tủ lạnh 2 cánh', category: 'Thiết bị bếp', status: 'GOOD', quantity: 1 },
                    { id: 3, name: 'Khóa cửa vân tay', category: 'An ninh', status: 'GOOD', quantity: 1 },
                  ]).slice(0, 3).map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-900">{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}</div>
                        <div className="text-[10px] text-slate-400">{item.category || 'Trang thiết bị'}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold text-[10px] rounded-full">
                        ● Hoạt động tốt
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Thành viên cư trú: <strong>{1 + (currentTenant.roommates?.length || 0)} người</strong>
                  </span>
                  <button
                    onClick={() => setIsAddRoommateOpen(true)}
                    className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Khai báo tạm trú</span>
                  </button>
                </div>
              </div>

              {/* Box 2: Hóa đơn & VietQR (5 cols) */}
              <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Hóa Đơn Tháng {activeBill?.billingMonth || 9}</h3>
                      <div className="text-[11px] text-slate-500">Mã phiếu thu: #PT-{activeBill?.id || '001'}</div>
                    </div>
                  </div>
                  {activeBill?.status === 'PAID' ? (
                    <Badge status="PAID" label="ĐÃ THU" />
                  ) : (
                    <Badge status="UNPAID" label="CHƯA THU" />
                  )}
                </div>

                <div className="flex items-center gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200 shrink-0 shadow-2xs">
                    <img src={qrUrl} alt="VietQR" className="w-full h-full object-cover rounded" />
                  </div>
                  <div className="min-w-0 space-y-1 text-xs">
                    <div className="text-slate-500 text-[11px]">Tổng cước phí cần nộp:</div>
                    <div className="text-lg font-black text-slate-900">
                      {formatCurrency(activeBill?.remainingDebt || 21100000)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Napas247 • MBBank • STK: <strong className="font-mono text-slate-800">{DEFAULT_BUILDING_BANK_ACCOUNT.accountNo}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('billing')}
                  >
                    Bảng Phân Bổ Chi Phí
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<QrCode className="w-3.5 h-3.5" />}
                    onClick={() => setIsVietQROpen(true)}
                  >
                    Mã VietQR Thanh Toán
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: APARTMENT ================= */}
        {activeTab === 'apartment' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Căn Hộ {activeApartment?.roomNumber || 'P101'} – {activeApartment?.description || 'Căn hộ tiêu chuẩn'}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Tầng {activeApartment?.floor || 1} • {activeApartment?.buildingName || 'Sunshine Diamond Tower'} • Hướng {activeApartment?.viewDirection || 'Đông Nam'}
                    </div>
                  </div>
                </div>
                <Badge status={activeApartment?.status || 'OCCUPIED'} label="ĐANG THUÊ CHÍNH THỨC" />
              </div>

              {/* Room specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Diện tích thông thủy</span>
                  <strong className="text-slate-900 text-base font-black">{activeApartment?.areaSqm || 65.5} m²</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Phòng ngủ</span>
                  <strong className="text-slate-900 text-base font-black">0{activeApartment?.bedrooms || 2} PN</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Phòng vệ sinh</span>
                  <strong className="text-slate-900 text-base font-black">0{activeApartment?.bathrooms || 1} WC</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Giá thuê hợp đồng</span>
                  <strong className="text-brand-700 text-base font-black">{formatCurrency(activeContract?.rentalPrice || activeApartment?.price || 14000000)}</strong>
                </div>
              </div>

              {/* Handover Equipment List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Danh Mục Trang Thiết Bị Bàn Giao Ký Nhận</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    Biên bản bàn giao hiện trạng
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {(activeApartment?.amenities && activeApartment.amenities.length > 0 ? activeApartment.amenities : [
                    { id: 1, name: 'Điều hòa Inverter', category: 'Thiết bị làm mát', status: 'GOOD', quantity: 2 },
                    { id: 2, name: 'Tủ lạnh 2 cánh', category: 'Thiết bị bếp', status: 'GOOD', quantity: 1 },
                    { id: 3, name: 'Bếp từ đôi âm mặt kính', category: 'Thiết bị bếp', status: 'GOOD', quantity: 1 },
                    { id: 4, name: 'Khóa cửa vân tay Smart Lock', category: 'An ninh', status: 'GOOD', quantity: 1 },
                  ]).map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-900">{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}</div>
                        <div className="text-[10px] text-slate-400">{item.category || 'Trang thiết bị'} • Căn {activeApartment?.roomNumber || 'P101'}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold text-[10px] rounded-full">
                        ● Tốt - Bình thường
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roommates List & VNeID */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-700" />
                    <span>Danh Sách Thành Viên Ở Cùng ({1 + (currentTenant.roommates?.length || 0)} người)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    VNeID Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-bold mx-auto flex items-center justify-center text-xs">
                      {currentTenant.fullName.split(' ').pop()?.slice(0, 2).toUpperCase() || 'AN'}
                    </div>
                    <div className="font-bold text-slate-900 mt-1.5 text-xs">{currentTenant.fullName}</div>
                    <div className="text-[10px] text-slate-400">Chủ hộ / Đại diện hợp đồng</div>
                  </div>

                  {currentTenant.roommates && currentTenant.roommates.length > 0 ? (
                    currentTenant.roommates.map((rm) => (
                      <div key={rm.id || rm.citizenId} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <div className="w-9 h-9 rounded-full bg-slate-700 text-white font-bold mx-auto flex items-center justify-center text-xs">
                          {rm.fullName.split(' ').pop()?.slice(0, 2).toUpperCase() || 'TV'}
                        </div>
                        <div className="font-bold text-slate-900 mt-1.5 text-xs">{rm.fullName}</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">{rm.relationship || 'Người thân'} • {rm.isRegisteredTemp ? 'Đã duyệt tạm trú' : 'Chờ duyệt'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center col-span-2 flex items-center justify-center text-slate-400 text-xs">
                      Chưa đăng ký thêm thành viên lưu trú
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-400">
                    Khai báo thông tin lưu trú trực tuyến kết nối Ban Quản Lý và Cổng DVC.
                  </span>
                  <button
                    onClick={() => setIsAddRoommateOpen(true)}
                    className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 self-start sm:self-auto"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Thêm Người / Khai Báo Tạm Trú</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CONTRACT ================= */}
        {activeTab === 'contract' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <FileSignature className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Hợp Đồng Thuê Căn Hộ
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Chứng thư số điện tử • Giá trị pháp lý đầy đủ
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                  MÃ {activeContract?.contractCode || 'HD-2026-P101'}
                </span>
              </div>

              {/* Deposit Info Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      TIỀN CỌC BẢO ĐẢM HỢP ĐỒNG
                    </div>
                    <div className="text-xl font-black text-slate-900">{formatCurrency(activeContract?.depositAmount || 28000000)}</div>
                  </div>
                </div>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Bảo đảm theo hợp đồng</span>
                </span>
              </div>

              {/* 5 Core Terms List (Standard legal language, no AI gimmicks) */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-bold text-slate-800">
                  05 Điều Khoản Trọng Yếu Cần Lưu Ý
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900 block text-xs">Thời hạn thuê:</strong>
                      <span className="text-slate-600 text-xs leading-relaxed">
                        Thời hạn thuê từ ngày {formatDate(activeContract?.startDate || '2026-01-01')} đến hết {formatDate(activeContract?.endDate || '2027-07-27')}. Ưu tiên gia hạn theo thỏa thuận hai bên.
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900 block text-xs">Giá thuê cố định:</strong>
                      <span className="text-slate-600 text-xs leading-relaxed">
                        Giá thuê căn hộ: {formatCurrency(activeContract?.rentalPrice || 14000000)}/tháng. Tiền cọc bảo đảm: {formatCurrency(activeContract?.depositAmount || 28000000)}.
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900 block text-xs">Cam kết hoàn trả tiền đặt cọc:</strong>
                      <span className="text-slate-600 text-xs leading-relaxed">
                        Hoàn trả {formatCurrency(activeContract?.depositAmount || 28000000)} trong vòng 48h làm việc kể từ thời điểm bàn giao lại hiện trạng căn hộ.
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <strong className="text-slate-900 block text-xs">Kỳ hạn nộp cước dịch vụ:</strong>
                      <span className="text-slate-600 text-xs leading-relaxed">
                        Thanh toán cước phí căn hộ, điện lực và nước sạch từ ngày 01 đến 05 hàng tháng qua hình thức chuyển khoản mã VietQR.
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      5
                    </span>
                    <div>
                      <strong className="text-slate-900 block text-xs">Chấm dứt & Gia hạn hợp đồng:</strong>
                      <span className="text-slate-600 text-xs leading-relaxed">
                        Thông báo trước tối thiểu 30 ngày cho Ban Quản Lý trước khi hết hạn hoặc có nhu cầu trả phòng.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => toast.info('Tải PDF', 'Đang tải file Hợp đồng thuê căn hộ (PDF)...')}
                  className="text-xs font-bold text-slate-700 hover:text-brand-700 flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Tải Hợp Đồng (PDF)</span>
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<FileSignature className="w-4 h-4" />}
                  onClick={() => setIsRenewModalOpen(true)}
                >
                  Gửi Yêu Cầu Gia Hạn HĐ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: BILLING ================= */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Hóa Đơn Căn Hộ & Dịch Vụ Tháng {activeBill?.billingMonth || 9}/{activeBill?.billingYear || 2026}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Mã phiếu thu: #PT-{activeBill?.id || '001'} • Hạn thanh toán: {formatDate(activeBill?.dueDate || '2026-09-10')}
                    </div>
                  </div>
                </div>

                {activeBill?.status === 'PAID' ? (
                  <Badge status="PAID" label="ĐÃ THANH TOÁN" />
                ) : (
                  <Badge status="UNPAID" label={`CHƯA THANH TOÁN (Hạn ${formatDate(activeBill?.dueDate || '2026-09-10')})`} />
                )}
              </div>

              {/* Split breakdown + VietQR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cost breakdown items (7 cols) */}
                <div className="lg:col-span-7 space-y-2.5 text-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Bảng Phân Bổ Chi Phí Tháng {activeBill?.billingMonth || 9}
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <div>
                      <strong className="text-slate-900 text-xs">1. Tiền thuê căn hộ {activeApartment?.roomNumber || 'P101'}</strong>
                    </div>
                    <span className="font-extrabold text-slate-900 text-xs">{formatCurrency(activeBill?.roomAmount || activeContract?.rentalPrice || 14000000)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <div>
                      <strong className="text-slate-900 text-xs">2. Tiền Điện Sinh Hoạt</strong>
                      <div className="text-[10px] text-slate-400">Đơn giá 3.500 đ/kWh</div>
                    </div>
                    <span className="font-extrabold text-slate-900 text-xs">{formatCurrency(activeBill?.electricityCost || 850000)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <div>
                      <strong className="text-slate-900 text-xs">3. Tiền Nước Sạch</strong>
                      <div className="text-[10px] text-slate-400">Đơn giá 15.000 đ/m³</div>
                    </div>
                    <span className="font-extrabold text-slate-900 text-xs">{formatCurrency(activeBill?.waterCost || 240000)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <div>
                      <strong className="text-slate-900 text-xs">4. Phí Quản Lý Dịch Vụ & Rác Thải</strong>
                    </div>
                    <span className="font-extrabold text-slate-900 text-xs">{formatCurrency(activeBill?.serviceAmount || 635000)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <div>
                      <strong className="text-slate-900 text-xs">5. Internet Wi-Fi Căn Hộ</strong>
                    </div>
                    <span className="font-bold text-emerald-700 text-xs">0 ₫ (Tài trợ trọn gói)</span>
                  </div>

                  {/* Total amount */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        TỔNG CỘNG CẦN THANH TOÁN
                      </span>
                      <span className="text-[11px] text-slate-400">Phiếu thu: PT-{activeBill?.id || '001'}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {formatCurrency(activeBill?.remainingDebt || activeBill?.totalAmount || 21100000)}
                    </div>
                  </div>
                </div>

                {/* Dynamic VietQR Snapshot (5 cols) */}
                <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <span>Thanh Toán Chuyển Khoản VietQR</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl shadow-xs border border-slate-200 max-w-[180px]">
                    <img src={qrUrl} alt="Mã VietQR" className="w-full h-auto rounded-lg" />
                  </div>

                  <div className="text-xs text-slate-600 space-y-0.5">
                    <div>Ngân hàng: <strong className="text-slate-900">MBBank</strong></div>
                    <div>Số tài khoản: <strong className="text-slate-900 font-mono font-bold">{DEFAULT_BUILDING_BANK_ACCOUNT.accountNo}</strong></div>
                    <div>Chủ tài khoản: <strong className="text-slate-900">{DEFAULT_BUILDING_BANK_ACCOUNT.accountName}</strong></div>
                    <div>Cú pháp: <span className="font-mono text-brand-700 font-bold">{(activeContract?.contractCode || 'HD2026P101').replace(/-/g, '')} T{activeBill?.billingMonth || 9}</span></div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<QrCode className="w-3.5 h-3.5" />}
                    onClick={() => setIsVietQROpen(true)}
                    className="w-full"
                  >
                    Xem Mã QR Phóng To
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => toast.info('In biên lai', 'Đang tải hóa đơn điện tử PDF...')}
                >
                  In Biên Lai Điện Tử
                </Button>

                <Button
                  variant="success"
                  size="sm"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  isLoading={isPaying}
                  disabled={activeBill?.status === 'PAID'}
                  onClick={handleDirectTransferConfirm}
                >
                  {activeBill?.status === 'PAID' ? 'Đã Thanh Toán Thành Công' : 'Xác Nhận Đã Chuyển Khoản'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: MAINTENANCE ================= */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Báo Hỏng & Sửa Chữa Thiết Bị
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Đội ngũ kỹ thuật tòa nhà trực hỗ trợ 24/7 • SLA xử lý 15-30 phút
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold self-start sm:self-auto">
                  SLA 15-30 PHÚT
                </span>
              </div>

              {/* Active Ticket Tracking */}
              {activeTicket && activeTicket.status === 'IN_PROGRESS' && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold">
                        ĐANG XỬ LÝ
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">
                        Phiếu #{activeTicket.ticketCode}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">Dự kiến xong: Hôm nay</span>
                  </div>

                  <div className="text-sm text-slate-800 font-semibold flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Hiện trạng: {activeTicket.issueDescription}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                        KT
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{activeTicket.technicianName || 'Kỹ thuật viên tòa nhà'}</div>
                        <div className="text-xs text-slate-500">Bộ phận Cơ - Điện • ĐT: {activeTicket.technicianPhone || '0912 345 678'}</div>
                      </div>
                    </div>

                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setIsInspectModalOpen(true)}
                      className="self-start sm:self-auto"
                    >
                      Nghiệm Thu & Đóng Phiếu
                    </Button>
                  </div>
                </div>
              )}

              {/* Form Create Ticket */}
              <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
                <div className="text-xs font-bold text-slate-800">
                  Tạo Yêu Cầu Sửa Chữa Mới
                </div>

                {/* Category picker */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  {[
                    { id: 'PLUMBING', label: 'Hệ thống Nước' },
                    { id: 'ELECTRICAL', label: 'Hệ thống Điện' },
                    { id: 'APPLIANCE', label: 'Đồ Gia dụng' },
                    { id: 'OTHER', label: 'Sự cố Khác' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewCategory(cat.id as any)}
                      className={`py-2.5 rounded-xl border font-semibold transition-all text-xs ${
                        newCategory === cat.id
                          ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Mô tả sự cố (VD: Đèn phòng tắm không sáng, vòi nước bồn rửa bị rỉ...)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-xs text-slate-900 focus:outline-none focus:border-slate-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => toast.info('Chụp ảnh', 'Đã mở camera để đính kèm ảnh hiện trường')}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                    title="Chụp ảnh hiện trường"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        checked={newPriority === 'MEDIUM'}
                        onChange={() => setNewPriority('MEDIUM')}
                      />
                      <span>Bình thường (24h)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-rose-600 font-bold">
                      <input
                        type="radio"
                        name="priority"
                        checked={newPriority === 'URGENT'}
                        onChange={() => setNewPriority('URGENT')}
                      />
                      <span>Khẩn cấp (&lt;30 phút)</span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isReporting}
                    leftIcon={<Wrench className="w-4 h-4" />}
                  >
                    Gửi Yêu Cầu Sửa Chữa
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic VietQR Modal */}
      {activeBill && (
        <VietQRModal
          isOpen={isVietQROpen}
          onClose={() => setIsVietQROpen(false)}
          receivableId={activeBill.id}
          amount={activeBill.remainingDebt}
          roomNumber={activeApartment?.roomNumber || 'P101'}
          tenantName={currentTenant.fullName}
          billMonth={activeBill.billingMonth}
          billYear={activeBill.billingYear}
        />
      )}

      {/* Modal Renew Contract */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title="Gửi Yêu Cầu Tái Ký & Gia Hạn Hợp Đồng Thuê"
        subtitle="Ban Quản Lý sẽ liên hệ để xác nhận và tiến hành thủ tục gia hạn"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsRenewModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isRenewing}
              onClick={async () => {
                try {
                  await renewContract({
                    contractId: activeContract.id,
                    newEndDate: '2027-12-31',
                  }).unwrap();
                  toast.success('Thành công', 'Đã gửi yêu cầu gia hạn hợp đồng tới Ban Quản Lý!');
                  setIsRenewModalOpen(false);
                } catch {
                  toast.error('Lỗi', 'Không thể gửi yêu cầu');
                }
              }}
            >
              Xác Nhận Đăng Ký Gia Hạn
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
            Hợp đồng hiện tại: <strong>{activeContract?.contractCode || 'HD-2026-P101'}</strong> (Hạn chót: {formatDate(activeContract?.endDate || '2026-12-31')}). Khi xác nhận, Ban Quản Lý sẽ lập dự thảo phụ lục hợp đồng gia hạn thêm 12 tháng với giá thuê giữ nguyên <strong>{formatCurrency(activeContract?.rentalPrice || 14000000)}/tháng</strong>.
          </div>
        </div>
      </Modal>

      {/* Modal Add Roommate */}
      <Modal
        isOpen={isAddRoommateOpen}
        onClose={() => setIsAddRoommateOpen(false)}
        title="Khai Báo Thành Viên Ở Cùng & Tạm Trú"
        subtitle="Thông tin sẽ được đồng bộ lên hồ sơ lưu trú căn hộ"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddRoommateOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isAddingRm}
              onClick={handleAddRoommate}
            >
              Lưu Thông Tin Lưu Trú
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddRoommate} className="space-y-4">
          <Input
            label="Họ và tên người ở cùng"
            required
            placeholder="VD: Trần Thị Mai"
            value={rmName}
            onChange={(e) => setRmName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Số CCCD 12 chữ số"
              required
              placeholder="001201008888"
              value={rmCitizenId}
              onChange={(e) => setRmCitizenId(e.target.value)}
            />
            <Input
              label="Số điện thoại"
              placeholder="0913.***.***"
              value={rmPhone}
              onChange={(e) => setRmPhone(e.target.value)}
            />
          </div>

          <Input
            label="Mối quan hệ với chủ hộ"
            placeholder="VD: Vợ / Chồng / Con / Bạn bè"
            value={rmRelation}
            onChange={(e) => setRmRelation(e.target.value)}
          />
        </form>
      </Modal>

      {/* Modal Inspect & 5-Star Rating */}
      <Modal
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
        title="Nghiệm Thu Sửa Chữa & Đánh Giá Dịch Vụ"
        subtitle={`Phiếu #${activeTicket?.ticketCode || 'BT-2024-042'} • Kỹ thuật viên: ${activeTicket?.technicianName || 'Lê Văn Thắng'}`}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsInspectModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="success"
              size="sm"
              isLoading={isInspecting}
              onClick={handleInspectTicket}
            >
              Xác Nhận Đã Hoàn Tất
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="text-center py-2">
            <div className="text-xs font-bold text-slate-700 mb-2">
              Bạn có hài lòng với chất lượng xử lý sự cố?
            </div>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-600 mt-1 inline-block">
              {rating === 5 ? 'Rất hài lòng (5/5 sao)' : `${rating}/5 sao`}
            </span>
          </div>

          <Input
            label="Nhận xét hoặc góp ý"
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
