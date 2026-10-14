import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ScreenId } from '../../types';
import { ALL_SCREENS_METADATA } from '../../lib/permissionsConfig';
import { ShieldAlert, Lock, ArrowRight, Home, RefreshCw, KeyRound, AlertTriangle } from 'lucide-react';

interface AccessDeniedProps {
  screenId: ScreenId;
  onNavigateHome: () => void;
  onNavigateToFirstAllowed?: () => void;
}

export function AccessDenied({ screenId, onNavigateHome, onNavigateToFirstAllowed }: AccessDeniedProps) {
  const { currentUser, logout } = useAuth();
  const screenMeta = ALL_SCREENS_METADATA.find(s => s.id === screenId);
  const screenTitle = screenMeta ? screenMeta.title : screenId;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white dark:bg-[#140a22] rounded-2xl border border-red-200 dark:border-rose-900/50 shadow-xl p-8 text-center relative overflow-hidden">
        {/* Background Decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <ShieldAlert className="w-9 h-9 text-rose-600 dark:text-rose-400" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>نظام الحماية والرقابة المؤسسية (RBAC Policy)</span>
          </span>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            تم رفض الوصول إلى هذه الشاشة
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            عفواً، لا يمتلك حسابك الحالي صلاحية فتح واستعراض شاشة <br />
            <strong className="text-rose-600 dark:text-rose-400 font-extrabold text-base underline underline-offset-4">
              "{screenTitle}"
            </strong>
          </p>

          {/* User & Role Card */}
          <div className="bg-slate-50 dark:bg-[#1c1033] border border-slate-200 dark:border-purple-900/50 rounded-xl p-4 text-right mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">حالة الحساب الجاري:</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                نشط في الجلسة
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white dark:bg-[#130924] border border-slate-200 dark:border-purple-900/40">
                <span className="text-slate-400 block mb-0.5">المستخدم الحالي:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser.fullName}</span>
                <span className="text-[10px] text-slate-500 block">(@{currentUser.username})</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-[#130924] border border-slate-200 dark:border-purple-900/40">
                <span className="text-slate-400 block mb-0.5">الدور الوظيفي:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">{currentUser.roleTitle}</span>
                <span className="text-[10px] text-slate-500 block">{currentUser.department}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </button>

            {onNavigateToFirstAllowed && (
              <button
                onClick={onNavigateToFirstAllowed}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-300 dark:border-purple-800/60 transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>الانتقال للشاشات المتاحة</span>
              </button>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-purple-900/40 flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>إذا كنت بحاجة للوصول إلى هذه الشاشة، يرجى مراجعة مسؤول إدارة النظام لترقية الصلاحيات.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
