import React from 'react';
import clsx from 'clsx';

interface DwellLogoProps {
  badge?: string;
  badgeVariant?: 'blue' | 'sky' | 'emerald' | 'slate' | 'amber';
  subtitle1?: string;
  subtitle2?: string;
  showSubtitles?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DwellLogo: React.FC<DwellLogoProps> = ({
  badge,
  badgeVariant = 'sky',
  subtitle1 = 'Hệ thống căn hộ cho thuê toàn quốc',
  subtitle2 = 'Bàn giao nhận phòng tức thì',
  showSubtitles = false,
  size = 'md',
  className,
}) => {
  const badgeClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    sky: 'bg-sky-100 text-sky-800 border-sky-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-300',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
  }[badgeVariant];

  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl p-1',
    md: 'w-10 h-10 rounded-2xl p-1.5',
    lg: 'w-12 h-12 rounded-2xl p-2',
  }[size];

  const svgSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  }[size];

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-[20px] sm:text-[22px]',
    lg: 'text-2xl',
  }[size];

  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      {/* 2-Tower Building Icon Box */}
      <div
        className={clsx(
          iconSizes,
          'bg-sky-50 border border-sky-100/90 flex items-center justify-center shadow-xs shrink-0 select-none'
        )}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={svgSizes}
        >
          {/* Main Tower (Left) */}
          <rect x="13" y="8" width="18" height="34" rx="2" fill="#0284c7" />
          {/* Sub Tower (Right) */}
          <rect x="25" y="16" width="13" height="26" rx="1.5" fill="#38bdf8" />

          {/* Windows Left */}
          <rect x="16" y="12" width="3" height="3" rx="0.5" fill="white" />
          <rect x="21" y="12" width="3" height="3" rx="0.5" fill="white" />
          <rect x="16" y="18" width="3" height="3" rx="0.5" fill="white" />
          <rect x="21" y="18" width="3" height="3" rx="0.5" fill="white" />
          <rect x="16" y="24" width="3" height="3" rx="0.5" fill="white" />
          <rect x="21" y="24" width="3" height="3" rx="0.5" fill="white" />
          <rect x="16" y="30" width="3" height="3" rx="0.5" fill="white" />
          <rect x="21" y="30" width="3" height="3" rx="0.5" fill="white" />

          {/* Windows Right */}
          <rect x="28" y="20" width="2.5" height="2.5" rx="0.5" fill="#f0f9ff" />
          <rect x="32" y="20" width="2.5" height="2.5" rx="0.5" fill="#f0f9ff" />
          <rect x="28" y="26" width="2.5" height="2.5" rx="0.5" fill="#f0f9ff" />
          <rect x="32" y="26" width="2.5" height="2.5" rx="0.5" fill="#f0f9ff" />
          <rect x="28" y="32" width="2.5" height="2.5" rx="0.5" fill="#f0f9ff" />
          <rect x="32" y="32" width="2.5" height="2.5" rx="0.5" fill="#f0f9ff" />

          {/* Ground Base */}
          <path d="M9 42H39" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Text & Optional Badge & Subtitles */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={clsx(
              titleSizes,
              'font-extrabold tracking-tight text-[#1d4ed8]'
            )}
          >
            Dwell
          </span>
          {badge && (
            <span
              className={clsx(
                'px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase border',
                badgeClasses
              )}
            >
              {badge}
            </span>
          )}
        </div>

        {showSubtitles && (
          <>
            <p className="text-[7.5px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-tight leading-tight mt-1 truncate">
              {subtitle1}
            </p>
            {subtitle2 && (
              <p className="text-[7px] sm:text-[7.5px] font-medium text-slate-400 uppercase tracking-tight leading-tight mt-0.5 truncate">
                {subtitle2}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
