import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LayoutGrid,
  Building2,
  FileText,
  CreditCard,
  Wrench,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { toggleSidebar } from '../../stores/globalSlice';
import { useAuth } from '../../hooks/useAuth';
import { DwellLogo } from '../common/DwellLogo';
import { useGetApartmentsQuery } from '../../modules/buildings/services/buildingApi';
import { useGetReceivablesQuery } from '../../modules/finance/services/financeApi';
import { useGetMaintenanceRequestsQuery } from '../../modules/maintenance/services/maintenanceApi';
import { useGetTenantsQuery } from '../../modules/tenants/services/tenantApi';
import clsx from 'clsx';

export const TenantSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarOpen } = useAppSelector((state) => state.global);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  // Live queries to populate badges
  const { data: apartments = [] } = useGetApartmentsQuery({});
  const { data: receivables = [] } = useGetReceivablesQuery({});
  const { data: maintenanceList = [] } = useGetMaintenanceRequestsQuery({});
  const { data: tenants = [] } = useGetTenantsQuery({});

  const currentTenant = tenants.find(
    (t) => t.fullName === user?.fullName || t.phone === user?.phone || t.email === user?.email
  ) || tenants[0] || {
    fullName: user?.fullName || 'Nguyễn Văn An',
    currentRoomNumber: 'P101',
  };

  const activeApartment = apartments.find(
    (a) => a.roomNumber === currentTenant?.currentRoomNumber
  ) || apartments[0];

  const activeBill = receivables.find(
    (r) => (r.tenantId === currentTenant?.id || r.roomNumber === activeApartment?.roomNumber) && r.status !== 'PAID'
  );

  const activeTicket = maintenanceList.find(
    (m) => m.roomNumber === activeApartment?.roomNumber && m.status === 'IN_PROGRESS'
  );

  // Exact 5 Essential Menu Items for Tenants - Short, clear labels that never truncate
  const navItems = [
    {
      id: 'overview',
      to: '/tenant-portal?tab=overview',
      label: 'Tổng quan',
      icon: <LayoutGrid className="w-[18px] h-[18px]" />,
    },
    {
      id: 'apartment',
      to: '/tenant-portal?tab=apartment',
      label: 'Căn hộ & Thiết bị',
      icon: <Building2 className="w-[18px] h-[18px]" />,
      badge: activeApartment?.roomNumber || 'P101',
    },
    {
      id: 'contract',
      to: '/tenant-portal?tab=contract',
      label: 'Hợp đồng thuê',
      icon: <FileText className="w-[18px] h-[18px]" />,
    },
    {
      id: 'billing',
      to: '/tenant-portal?tab=billing',
      label: 'Hóa đơn cước',
      icon: <CreditCard className="w-[18px] h-[18px]" />,
      badge: activeBill ? 'Chưa nộp' : undefined,
      badgeVariant: 'amber',
    },
    {
      id: 'maintenance',
      to: '/tenant-portal?tab=maintenance',
      label: 'Báo hỏng sửa chữa',
      icon: <Wrench className="w-[18px] h-[18px]" />,
      badge: activeTicket ? 'Đang sửa' : undefined,
      badgeVariant: 'blue',
    },
  ];

  return (
    <aside
      className={clsx(
        'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 p-3 bg-[#f0f4f8] flex flex-col justify-between transition-transform duration-300 shrink-0 select-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Main White Card */}
      <div className="bg-white rounded-[26px] border border-slate-200/80 shadow-xs p-3.5 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Brand Header */}
        <div className="pb-3 border-b border-slate-100">
          <DwellLogo
            badge="CƯ DÂN"
            badgeVariant="sky"
            showSubtitles={false}
          />
        </div>

        {/* Resident Mini Status Card */}
        <div className="my-2.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {currentTenant.fullName.split(' ').pop()?.slice(0, 2).toUpperCase() || 'AN'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-slate-900 text-xs truncate">{currentTenant.fullName}</div>
            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <span>Phòng {activeApartment?.roomNumber || 'P101'}</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> VNeID
              </span>
            </div>
          </div>
        </div>

        {/* Functional Navigation links list */}
        <nav className="mt-1 space-y-0.5 overflow-y-auto flex-1 pr-0.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) dispatch(toggleSidebar());
                }}
                className={clsx(
                  'group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150',
                  isActive
                    ? 'bg-[#334155] text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={clsx(
                      'transition-colors shrink-0',
                      isActive ? 'text-[#38bdf8]' : 'text-slate-500 group-hover:text-slate-700'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[13px] truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                  {item.badge && (
                    <span
                      className={clsx(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeVariant === 'amber'
                          ? 'bg-amber-100 text-amber-800'
                          : item.badgeVariant === 'blue'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-xs shrink-0" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* 24/7 Hotline Support Card */}
        <div className="pt-2 border-t border-slate-100 mt-auto">
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span className="flex items-center gap-1 text-brand-600">
                <Phone className="w-3 h-3" />
                <span>Hotline BQL:</span>
              </span>
              <a href="tel:19008899" className="text-brand-700 font-mono font-bold hover:underline">
                1900 8899
              </a>
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Kỹ thuật trực:</span>
              <span className="text-slate-700 font-mono font-semibold">0912 345 678</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
