import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SensitiveDataKey } from '../../types';
import { Lock, ShieldAlert } from 'lucide-react';

interface SensitiveDataMaskProps {
  dataKey: SensitiveDataKey;
  value: React.ReactNode;
  fallbackText?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Enterprise Sensitive Data Protection Component
 * Protects costs, purchase prices, valuations, and margins at the component level.
 * When unauthorized: renders encrypted dots `••••••` with an elegant lock icon.
 * Ensures the sensitive value is NEVER injected into the client DOM when unauthorized!
 */
export function SensitiveDataMask({
  dataKey,
  value,
  fallbackText = '••••••',
  className = '',
  compact = false
}: SensitiveDataMaskProps) {
  const { canViewSensitive } = useAuth();
  const authorized = canViewSensitive(dataKey);

  if (authorized) {
    return <span className={className}>{value}</span>;
  }

  if (compact) {
    return (
      <span
        title="بيانات مالية مشفرة ومحمية (غير مصرح بالعرض)"
        className={`inline-flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-purple-950/40 text-slate-400 dark:text-purple-300 border border-slate-200 dark:border-purple-800/40 select-none cursor-not-allowed ${className}`}
      >
        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
        <span className="tracking-widest font-black text-[10px]">{fallbackText}</span>
      </span>
    );
  }

  return (
    <span
      title="بيانات تكلفة / أسعار مشفرة وفق سياسة الصلاحيات المؤسسية"
      className={`inline-flex items-center gap-1.5 font-mono text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-[#1a0f2e] text-slate-500 dark:text-purple-300 border border-slate-200 dark:border-purple-800/50 select-none cursor-not-allowed group transition-all shadow-2xs ${className}`}
    >
      <Lock className="w-3 h-3 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
      <span className="tracking-widest font-bold text-xs">{fallbackText}</span>
      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
        مشفر
      </span>
    </span>
  );
}
