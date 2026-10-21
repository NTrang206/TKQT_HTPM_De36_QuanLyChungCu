import React from 'react';
import clsx from 'clsx';
import {
  ApartmentStatus,
  ContractStatus,
  DepositStatus,
  ReceivableStatus,
  MaintenancePriority,
  MaintenanceStatus,
  BookingStatus,
} from '../../types';

interface BadgeProps {
  status?:
    | ApartmentStatus
    | ContractStatus
    | DepositStatus
    | ReceivableStatus
    | MaintenancePriority
    | MaintenanceStatus
    | BookingStatus
    | string;
  label?: string;
  variant?: 'emerald' | 'sky' | 'amber' | 'rose' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  label,
  variant,
  size = 'md',
  className,
}) => {
  // Determine variant and display text based on standard status
  let resolvedVariant = variant || 'slate';
  let text = label || status || '';

  if (status) {
    switch (status) {
      // Apartment
      case 'AVAILABLE':
        resolvedVariant = 'emerald';
        text = label || 'Trống sẵn sàng';
        break;
      case 'OCCUPIED':
        resolvedVariant = 'sky';
        text = label || 'Đang thuê';
        break;
      case 'RESERVED':
        resolvedVariant = 'amber';
        text = label || 'Đang giữ chỗ';
        break;
      case 'MAINTENANCE':
        resolvedVariant = 'rose';
        text = label || 'Đang bảo trì';
        break;

      // Contract
      case 'ACTIVE':
        resolvedVariant = 'emerald';
        text = label || 'Đang hiệu lực';
        break;
      case 'DRAFT':
        resolvedVariant = 'amber';
        text = label || 'Bản nháp (Chờ duyệt)';
        break;
      case 'EXPIRED':
        resolvedVariant = 'rose';
        text = label || 'Hết hạn';
        break;
      case 'TERMINATED':
        resolvedVariant = 'slate';
        text = label || 'Đã thanh lý';
        break;
      case 'RENEWED':
        resolvedVariant = 'purple';
        text = label || 'Đã gia hạn';
        break;

      // Deposit
      case 'HELD':
        resolvedVariant = 'emerald';
        text = label || 'Đã thu lưu ký';
        break;
      case 'REFUNDED':
        resolvedVariant = 'sky';
        text = label || 'Đã hoàn trả';
        break;
      case 'DEDUCTED':
        resolvedVariant = 'rose';
        text = label || 'Đã khấu trừ';
        break;

      // Receivable / Invoice
      case 'PAID':
        resolvedVariant = 'emerald';
        text = label || 'Đã thanh toán';
        break;
      case 'UNPAID':
        resolvedVariant = 'amber';
        text = label || 'Chưa thanh toán';
        break;
      case 'PARTIAL':
        resolvedVariant = 'sky';
        text = label || 'Thanh toán 1 phần';
        break;
      case 'OVERDUE':
        resolvedVariant = 'rose';
        text = label || 'Quá hạn nộp';
        break;

      // Maintenance Status
      case 'PENDING':
        resolvedVariant = 'amber';
        text = label || 'Chờ xử lý';
        break;
      case 'IN_PROGRESS':
        resolvedVariant = 'sky';
        text = label || 'Đang xử lý';
        break;
      case 'COMPLETED':
        resolvedVariant = 'emerald';
        text = label || 'Hoàn tất';
        break;
      case 'CANCELLED':
        resolvedVariant = 'slate';
        text = label || 'Đã hủy';
        break;

      // Priority
      case 'URGENT':
        resolvedVariant = 'rose';
        text = label || 'Khẩn cấp';
        break;
      case 'HIGH':
        resolvedVariant = 'rose';
        text = label || 'Ưu tiên cao';
        break;
      case 'MEDIUM':
        resolvedVariant = 'amber';
        text = label || 'Trung bình';
        break;
      case 'LOW':
        resolvedVariant = 'slate';
        text = label || 'Thấp';
        break;
    }
  }

  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dot-emerald-500',
    sky: 'bg-sky-50 text-sky-700 border-sky-200/80 dot-sky-500',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80 dot-amber-500',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80 dot-rose-500',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80 dot-purple-500',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dot-slate-400',
  };

  const dotColors = {
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-500',
    slate: 'bg-slate-400',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variantStyles[resolvedVariant as keyof typeof variantStyles],
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[resolvedVariant as keyof typeof dotColors])} />
      {text}
    </span>
  );
};
