import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  LogOut,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../hooks/useRedux';
import { toggleSidebar } from '../../stores/globalSlice';
import { DwellLogo } from '../common/DwellLogo';

export const TenantHeader: React.FC = () => {
  const { user, isTenant, logout } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Sidebar toggle & Resident Room Tag */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand logo visible on mobile */}
        <div className="lg:hidden">
          <DwellLogo badge="Cư Dân" badgeVariant="sky" showSubtitles={false} />
        </div>

        {/* Room Badge visible on desktop */}
        <div className="hidden lg:flex items-center gap-2">
          {isTenant ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Phòng P101 • Sunshine Diamond Tower</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Mô Phỏng Cư Dân • Căn P101</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Hotline, Simulation Quick Back & Profile */}
      <div className="flex items-center gap-3">
        {!isTenant && (
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">Quay Lại Quản Trị BQL</span>
            <span className="sm:hidden">Quản Trị</span>
          </Link>
        )}

        {/* Hotline */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/80">
          <PhoneCall className="w-3.5 h-3.5 text-brand-600" />
          <span>Hotline: <strong className="font-mono text-slate-900">1900 8899</strong></span>
        </div>

        {/* User Profile / Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900">{user?.fullName || 'Nguyễn Văn An'}</div>
            <div className="text-[10px] text-slate-500 font-medium">
              {user?.roleCode === 'TENANT' ? 'Căn hộ P101 • Khách thuê' : `${user?.roleCode} (BQL)`}
            </div>
          </div>

          <button
            onClick={() => {
              if (user?.roleCode === 'ADMIN' || user?.roleCode === 'STAFF' || user?.roleCode === 'ACCOUNTANT') {
                navigate('/admin/dashboard');
              } else {
                logout();
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title={user?.roleCode === 'ADMIN' ? 'Về trang Quản Trị' : 'Đăng xuất'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
