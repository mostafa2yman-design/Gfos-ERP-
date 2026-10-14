import React from 'react';

interface PrintSectionProps {
  title?: string;
  badge?: string;
  children: React.ReactNode;
  avoidBreak?: boolean;
  className?: string;
}

export const PrintSection: React.FC<PrintSectionProps> = ({ 
  title, 
  badge,
  children, 
  avoidBreak = false,
  className = ''
}) => {
  return (
    <div className={`mb-3 ${avoidBreak ? 'break-inside-avoid' : ''} ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b-2 border-slate-700 pb-1 mb-1.5">
          <h3 className="font-bold text-[11.5px] text-slate-900 flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-slate-800 inline-block rounded-xs"></span>
            {title}
          </h3>
          {badge && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700">
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="text-[10px]">
        {children}
      </div>
    </div>
  );
};
