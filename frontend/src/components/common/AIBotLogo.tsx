import React from 'react';
import clsx from 'clsx';
import aiBotLogoPng from '../../assets/ai-bot-logo.png';

interface AIBotLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showStatusDot?: boolean;
  statusColor?: string;
  badge?: boolean;
  alt?: string;
}

export const AIBotLogo: React.FC<AIBotLogoProps> = ({
  size = 'md',
  className,
  showStatusDot = false,
  statusColor = 'bg-emerald-400',
  badge = false,
  alt = 'AI Assistant Logo',
}) => {
  const imgSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
    '2xl': 'w-14 h-14',
  }[size];

  const badgeSizes = {
    xs: 'w-6 h-6 rounded-lg p-0.5',
    sm: 'w-7 h-7 rounded-xl p-1',
    md: 'w-9 h-9 rounded-2xl p-1.5',
    lg: 'w-10 h-10 rounded-2xl p-1.5',
    xl: 'w-14 h-14 rounded-3xl p-2',
    '2xl': 'w-20 h-20 rounded-3xl p-2.5',
  }[size];

  const dotSizes = {
    xs: 'w-1.5 h-1.5 -top-0.5 -right-0.5',
    sm: 'w-2 h-2 -top-0.5 -right-0.5',
    md: 'w-2.5 h-2.5 -top-0.5 -right-0.5',
    lg: 'w-3 h-3 -top-0.5 -right-0.5',
    xl: 'w-3.5 h-3.5 top-0 right-0',
    '2xl': 'w-4 h-4 top-0.5 right-0.5',
  }[size];

  const content = (
    <img
      src={aiBotLogoPng}
      alt={alt}
      className={clsx(imgSizes, 'object-contain select-none transition-transform duration-200')}
      loading="eager"
    />
  );

  if (badge) {
    return (
      <div className={clsx('relative inline-flex shrink-0 select-none', className)}>
        <div
          className={clsx(
            badgeSizes,
            'bg-white shadow-sm border border-sky-100 flex items-center justify-center transition-all'
          )}
        >
          {content}
        </div>
        {showStatusDot && (
          <span
            className={clsx(
              'absolute rounded-full border-2 border-white ring-1 ring-slate-200/50 shadow-xs',
              statusColor,
              dotSizes
            )}
          />
        )}
      </div>
    );
  }

  return (
    <div className={clsx('relative inline-flex items-center justify-center shrink-0 select-none', className)}>
      {content}
      {showStatusDot && (
        <span
          className={clsx(
            'absolute rounded-full border-2 border-white ring-1 ring-slate-200/50 shadow-xs',
            statusColor,
            dotSizes
          )}
        />
      )}
    </div>
  );
};
