import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  glass = false,
  padded = true,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-200/80 transition-all duration-200',
        glass ? 'glass' : 'bg-white shadow-soft',
        hoverable && 'card-hover',
        padded && 'p-5 md:p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
