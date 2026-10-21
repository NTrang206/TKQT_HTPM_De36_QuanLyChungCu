import React, { useState } from 'react';
import {
  Bell,
  Menu,
  LogOut,
  ChevronDown,
  Building2,
  Search,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { toggleSidebar } from '../../stores/globalSlice';
import { useToast } from '../../hooks/useToast';
import { Link } from 'react-router-dom';
import { UserRole } from '../../types';

export const AdminHeader: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { notifications } = useAppSelector((state) => state.global);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Sidebar toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Role Tag */}
        {user?.roleCode === 'ACCOUNTANT' ? (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/90 rounded-full text-xs font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Phân Hệ Kế Toán & Thu Phí</span>
          </div>
        ) : user?.roleCode === 'STAFF' ? (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-300 rounded-full text-xs font-bold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Ban Quản Lý Tòa Nhà</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/90 rounded-full text-xs font-bold text-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Cổng Quản Trị Hệ Thống</span>
          </div>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            aria-label="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Thông báo hệ thống</span>
                <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded">
                  {notifications.length} mới
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80';
              }}
              alt={user?.fullName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs"
            />
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-slate-900 line-clamp-1">{user?.fullName}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                {user?.roleCode === 'ACCOUNTANT'
                  ? 'Kế toán trưởng'
                  : user?.roleCode === 'ADMIN'
                  ? 'Quản trị viên'
                  : user?.roleCode === 'STAFF'
                  ? 'Ban quản lý'
                  : user?.roleCode}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{user?.fullName}</div>
                <div className="text-[11px] text-slate-500">{user?.email}</div>
              </div>

              {/* Portal navigation links */}
              <div className="p-1">
                <Link
                  to="/tenant-portal"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  <Building2 className="w-4 h-4 text-brand-600" />
                  <span>Cổng Cư Dân (Resident Hub)</span>
                </Link>

                <Link
                  to="/explore"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  <Search className="w-4 h-4 text-emerald-600" />
                  <span>Khám Phá Căn Hộ (Guest)</span>
                </Link>
              </div>

              {/* Demo Account Switcher inside dropdown menu (compact & out of the main header) */}
              <div className="border-t border-slate-100 p-2">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                  Đổi vai trò tài khoản
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {[
                    { code: 'ADMIN' as UserRole, label: 'Quản trị' },
                    { code: 'ACCOUNTANT' as UserRole, label: 'Kế toán' },
                    { code: 'STAFF' as UserRole, label: 'Nhân viên' },
                    { code: 'TENANT' as UserRole, label: 'Cư dân' },
                  ].map((r) => (
                    <button
                      key={r.code}
                      onClick={() => {
                        switchRole(r.code);
                        setShowUserMenu(false);
                        toast.info('Chuyển vai trò', `Đã chuyển sang tài khoản ${r.label}`);
                        if (r.code === 'TENANT') {
                          window.location.href = '/tenant-portal';
                        } else if (r.code === 'ACCOUNTANT') {
                          window.location.href = '/admin/finance';
                        } else {
                          window.location.href = '/admin/dashboard';
                        }
                      }}
                      className={`text-left px-2 py-1 rounded-lg transition-colors ${
                        user?.roleCode === r.code
                          ? 'bg-brand-50 text-brand-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 p-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng Xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
