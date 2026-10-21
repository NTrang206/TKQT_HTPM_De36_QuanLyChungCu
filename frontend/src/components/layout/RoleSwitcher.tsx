import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { Shield, UserCheck, Calculator, Home, User } from 'lucide-react';
import clsx from 'clsx';

export const RoleSwitcher: React.FC = () => {
  const { activeRole, switchRole } = useAuth();

  const roles: { code: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { code: 'ADMIN', label: 'Quản trị (Admin)', icon: <Shield className="w-3.5 h-3.5" />, color: 'hover:text-purple-600' },
    { code: 'STAFF', label: 'Nhân viên (Staff)', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'hover:text-blue-600' },
    { code: 'ACCOUNTANT', label: 'Kế toán (Accountant)', icon: <Calculator className="w-3.5 h-3.5" />, color: 'hover:text-emerald-600' },
    { code: 'TENANT', label: 'Cư dân (Tenant)', icon: <Home className="w-3.5 h-3.5" />, color: 'hover:text-amber-600' },
    { code: 'GUEST', label: 'Khách (Guest)', icon: <User className="w-3.5 h-3.5" />, color: 'hover:text-slate-600' },
  ];

  return (
    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner">
      {roles.map((r) => {
        const isActive = activeRole === r.code;
        return (
          <button
            key={r.code}
            onClick={() => {
              switchRole(r.code);
              if (r.code === 'TENANT') {
                window.location.href = '/tenant-portal';
              } else if (r.code === 'ACCOUNTANT') {
                window.location.href = '/admin/finance';
              } else if (r.code === 'GUEST') {
                window.location.href = '/explore';
              } else {
                window.location.href = '/admin/dashboard';
              }
            }}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150',
              isActive
                ? 'bg-white text-slate-900 shadow-soft ring-1 ring-slate-200'
                : `text-slate-600 ${r.color}`
            )}
            title={`Chuyển vai trò sang ${r.label}`}
          >
            {r.icon}
            <span className="hidden md:inline">{r.label}</span>
            <span className="inline md:hidden">{r.code}</span>
          </button>
        );
      })}
    </div>
  );
};
