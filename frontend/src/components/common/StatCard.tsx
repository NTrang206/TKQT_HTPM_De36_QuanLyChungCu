import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  changePercent?: number;
  changeText?: string;
  isPositiveGood?: boolean;
  icon?: React.ReactNode;
  iconBgColor?: string;
  badge?: string;
  footer?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  changePercent,
  changeText,
  isPositiveGood = true,
  icon,
  iconBgColor = 'bg-brand-50 text-brand-600',
  badge,
  footer,
  className,
}) => {
  const isPositive = changePercent !== undefined ? changePercent >= 0 : undefined;
  const isGood = isPositiveGood ? isPositive : !isPositive;

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-slate-500 truncate">
            {title}
          </span>
          {icon && (
            <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconBgColor)}>
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 flex-wrap">
          <h4 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{value}</h4>
          {subValue && <span className="text-xs font-normal text-slate-400">{subValue}</span>}
        </div>
      </div>

      {(changePercent !== undefined || changeText || badge || footer) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
          {changePercent !== undefined && (
            <div
              className={clsx(
                'inline-flex items-center gap-1 font-semibold truncate',
                isGood ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="whitespace-nowrap">{Math.abs(changePercent)}%</span>
              {changeText && <span className="text-slate-400 font-normal truncate">{changeText}</span>}
            </div>
          )}

          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 whitespace-nowrap shrink-0">
              {badge}
            </span>
          )}

          {footer}
        </div>
      )}
    </div>
  );
};
