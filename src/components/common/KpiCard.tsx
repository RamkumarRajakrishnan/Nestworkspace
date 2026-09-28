import React from 'react';
import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  icon: LucideIcon;
  variant?: 'default' | 'critical' | 'warning' | 'success' | 'info' | 'purple';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
  variant = 'default',
  onClick,
}) => {
  // Circular icon container style
  const getIconContainerStyle = () => {
    switch (variant) {
      case 'critical':
        return 'bg-[#FEE2E2] text-[#B42318]';
      case 'warning':
        return 'bg-[#FEF3C7] text-[#B45309]';
      case 'success':
        return 'bg-[#DCFCE7] text-[#15803D]';
      case 'purple':
        return 'bg-white/20 text-white';
      default:
        // Worker app default: soft circular light-purple icon container!
        return 'bg-[#EDE9FE] text-[#5B21B6]';
    }
  };

  const isPurpleHighlight = variant === 'purple';

  return (
    <div
      onClick={onClick}
      className={clsx(
        'group relative rounded-2xl border transition-all duration-200 p-4.5',
        isPurpleHighlight
          ? 'bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] text-white border-transparent shadow-soft-md'
          : 'bg-white border-[#EEEEF2] text-[#1F1F1F] shadow-soft-sm hover:shadow-soft-md hover:border-[#DDD6FE]',
        onClick && 'cursor-pointer active:scale-[0.99]'
      )}
    >
      <div className="flex items-start justify-between">
        {/* Soft Circular Icon Container (Worker app style) */}
        <div
          className={clsx(
            'flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105',
            getIconContainerStyle()
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {trend && (
          <span
            className={clsx(
              'rounded-full px-2 py-0.5 text-[11px] font-semibold font-mono',
              isPurpleHighlight
                ? 'bg-white/20 text-white'
                : trend.isNeutral
                ? 'bg-slate-100 text-slate-600'
                : trend.isPositive
                ? 'bg-[#ECFDF3] text-[#027A48]'
                : 'bg-[#FEF2F2] text-[#B42318]'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      <div className="mt-3.5 space-y-1">
        <p
          className={clsx(
            'text-xs font-semibold uppercase tracking-wider',
            isPurpleHighlight ? 'text-purple-200' : 'text-[#6B6B6B]'
          )}
        >
          {title}
        </p>
        <div
          className={clsx(
            'text-2xl font-bold font-mono tracking-tight',
            isPurpleHighlight ? 'text-white' : 'text-[#1F1F1F]'
          )}
        >
          {value}
        </div>
        {subtext && (
          <p
            className={clsx(
              'text-[11px]',
              isPurpleHighlight ? 'text-purple-200/90' : 'text-[#6B6B6B]'
            )}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
