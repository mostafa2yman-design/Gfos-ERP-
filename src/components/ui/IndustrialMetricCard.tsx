import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IndustrialMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  planned?: string | number;
  actual?: string | number;
  variance?: {
    value: string | number;
    isPositive?: boolean;
    neutral?: boolean;
  };
  status?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
  onClick?: () => void;
  clickable?: boolean;
  active?: boolean;
  className?: string;
}

export const IndustrialMetricCard: React.FC<IndustrialMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  planned,
  actual,
  variance,
  status = 'neutral',
  onClick,
  clickable = false,
  active = false,
  className = '',
}) => {
  // Border and accent indicator according to industrial discipline
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'danger':
        return 'text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'primary':
        return 'text-[#2C1151] dark:text-[#c4a4ff] border-[#2C1151]/30';
      default:
        return 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  const getCardRing = () => {
    if (active) return 'ring-2 ring-[#2C1151] dark:ring-[#a87ffb] border-transparent';
    return 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700';
  };

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`relative bg-white dark:bg-[#150d24] border rounded-xl p-4 transition-all duration-150 ${getCardRing()} ${
        clickable ? 'cursor-pointer hover:shadow-sm' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`p-2 rounded-lg bg-slate-50 dark:bg-[#1f1435] ${getStatusColor()}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </span>
        </div>

        {variance && (
          <span
            className={`text-xs font-bold tabular-nums ${
              variance.neutral
                ? 'text-slate-500 dark:text-slate-400'
                : variance.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {variance.value}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
          {value}
        </span>
        {subtitle && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </span>
        )}
      </div>

      {(planned !== undefined || actual !== undefined) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {planned !== undefined && (
            <div>
              <span>مخطط: </span>
              <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                {planned}
              </span>
            </div>
          )}
          {actual !== undefined && (
            <div>
              <span>منفذ: </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {actual}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
