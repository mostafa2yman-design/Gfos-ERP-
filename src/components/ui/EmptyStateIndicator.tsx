import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateIndicatorProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyStateIndicator: React.FC<EmptyStateIndicatorProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#150d24] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#23153d] flex items-center justify-center mb-3 text-slate-400 dark:text-slate-500">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 text-xs font-bold text-white bg-[#2C1151] hover:bg-[#3d1870] dark:bg-[#6b31b3] dark:hover:bg-[#7e3bd2] rounded-lg transition-colors cursor-pointer shadow-2xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
