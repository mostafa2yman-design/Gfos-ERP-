import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Search,
  Filter,
  Calendar,
  Printer,
  ChevronDown,
  BookOpen,
  ArrowRight,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  Layers,
  Building2,
  Clock,
  User,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Briefcase,
  ChevronLeft,
  DollarSign
} from 'lucide-react';
import { AccountLedgerSummary, LedgerMovement } from '../../types/journal';
import { getAccountLedger, getAllJournalEntries } from '../../lib/journalEngine';
import { getAccounts } from '../../lib/accountingStorage';
import { AccountNode } from '../../types';
import { getPeriodDateRange } from '../../lib/periodUtils';

interface GeneralLedgerViewProps {
  initialAccountCode?: string;
  onNavigateToJournal?: (entryNumber?: string) => void;
  onNavigateToTrialBalance?: () => void;
  onNavigateToIncomeStatement?: () => void;
  onNavigateToBalanceSheet?: () => void;
  onNavigateToCashFlow?: () => void;
}

export function GeneralLedgerView({
  initialAccountCode,
  onNavigateToJournal,
  onNavigateToTrialBalance,
  onNavigateToIncomeStatement,
  onNavigateToBalanceSheet,
  onNavigateToCashFlow
}: GeneralLedgerViewProps) {
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>(initialAccountCode || '12411'); // default: raw materials fabric
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ledgerSummary, setLedgerSummary] = useState<AccountLedgerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Search in accounts list
  const [accountSearch, setAccountSearch] = useState('');

  // Load accounts
  useEffect(() => {
    const list = getAccounts();
    setAccounts(list);
    if (!selectedAccountCode && list.length > 0) {
      // Pick first active operational account (e.g. 12411)
      const defaultAcc = list.find(a => a.code === '12411') || list[0];
      setSelectedAccountCode(defaultAcc.code);
    }
  }, []);

  // Sync if initialAccountCode changes
  useEffect(() => {
    if (initialAccountCode) {
      setSelectedAccountCode(initialAccountCode);
    }
  }, [initialAccountCode]);

  // Fetch ledger summary whenever account or date range changes
  const fetchLedger = async () => {
    if (!selectedAccountCode) return;
    setLoading(true);
    try {
      const summary = await getAccountLedger(selectedAccountCode, dateFrom || undefined, dateTo || undefined);
      setLedgerSummary(summary);
    } catch (err) {
      console.error('Failed to load account ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedAccountCode, dateFrom, dateTo]);

  // Selected account object
  const currentAccount = useMemo(() => {
    return accounts.find(a => a.code === selectedAccountCode || a.id === selectedAccountCode);
  }, [accounts, selectedAccountCode]);

  // Filter accounts for picker
  const filteredAccounts = useMemo(() => {
    if (!accountSearch.trim()) return accounts;
    const term = accountSearch.toLowerCase();
    return accounts.filter(a => a.code.includes(term) || a.name.toLowerCase().includes(term));
  }, [accounts, accountSearch]);

  // Quick date presets
  const applyPreset = (preset: 'this_week' | 'last_week' | 'this_month' | 'this_quarter' | 'this_year' | 'all') => {
    const range = getPeriodDateRange(preset);
    setDateFrom(range.startDate);
    setDateTo(range.endDate);
  };

  // Group accounts by main category for clean picker
  const accountCategories = useMemo(() => {
    const categories: Record<string, AccountNode[]> = {
      '1 - الأصول': [],
      '2 - الخصوم والالتزامات': [],
      '3 - حقوق الملكية': [],
      '4 - الإيرادات والمبيعات': [],
      '5 - تكاليف الإنتاج والتصنيع': [],
      '6 - المصروفات البيعية والعمومية': []
    };

    filteredAccounts.forEach(acc => {
      if (acc.code.startsWith('1')) categories['1 - الأصول'].push(acc);
      else if (acc.code.startsWith('2')) categories['2 - الخصوم والالتزامات'].push(acc);
      else if (acc.code.startsWith('3')) categories['3 - حقوق الملكية'].push(acc);
      else if (acc.code.startsWith('4')) categories['4 - الإيرادات والمبيعات'].push(acc);
      else if (acc.code.startsWith('5')) categories['5 - تكاليف الإنتاج والتصنيع'].push(acc);
      else if (acc.code.startsWith('6')) categories['6 - المصروفات البيعية والعمومية'].push(acc);
    });

    return categories;
  }, [filteredAccounts]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600/30 rounded-xl border border-emerald-400/30 text-emerald-300">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <span>دفتر الأستاذ العام للحسابات</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  General Ledger
                </span>
              </h2>
              <p className="text-sm text-slate-300 mt-0.5">
                كشف تحليلي تفصيلي لحركات الحساب وأرصدة أول وآخر المدة وفق القيود اليومية المزدوجة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onNavigateToCashFlow && (
              <button
                onClick={() => onNavigateToCashFlow()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-teal-300" />
                <span>التدفقات النقدية</span>
              </button>
            )}

            {onNavigateToBalanceSheet && (
              <button
                onClick={() => onNavigateToBalanceSheet()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all cursor-pointer"
              >
                <Scale className="w-4 h-4 text-indigo-300" />
                <span>المركز المالي</span>
              </button>
            )}

            {onNavigateToCashFlow && (
              <button
                onClick={() => onNavigateToCashFlow()}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-teal-300" />
                <span>قائمة التدفقات النقدية</span>
              </button>
            )}

            {onNavigateToBalanceSheet && (
              <button
                onClick={() => onNavigateToBalanceSheet()}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                <Scale className="w-4 h-4 text-cyan-300" />
                <span>قائمة المركز المالي</span>
              </button>
            )}

            {onNavigateToIncomeStatement && (
              <button
                onClick={() => onNavigateToIncomeStatement()}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                <span>قائمة الدخل (P&L)</span>
              </button>
            )}

            {onNavigateToTrialBalance && (
              <button
                onClick={() => onNavigateToTrialBalance()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all cursor-pointer"
              >
                <Scale className="w-4 h-4 text-emerald-300" />
                <span>ميزان المراجعة</span>
              </button>
            )}

            {onNavigateToJournal && (
              <button
                onClick={() => onNavigateToJournal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-300" />
                <span>دفتر القيود اليومية</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الحساب</span>
            </button>

            <button
              onClick={fetchLedger}
              title="تحديث البيانات"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Account Selection & Period Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Account Picker */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              اختر الحساب المالي المراد عرض دفتر الأستاذ له:
            </label>
            <div className="relative">
              <select
                value={selectedAccountCode}
                onChange={(e) => setSelectedAccountCode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500/40 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {(Object.entries(accountCategories) as [string, AccountNode[]][]).map(([catTitle, catAccounts]) => {
                  if (catAccounts.length === 0) return null;
                  return (
                    <optgroup key={catTitle} label={catTitle}>
                      {catAccounts.map((acc) => (
                        <option key={acc.id} value={acc.code}>
                          {acc.code} — {acc.name} ({acc.nature === 'debit' ? 'طبيعة مدينة' : 'طبيعة دائنة'})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Date range */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              الفترة المالية (من تاريخ - إلى تاريخ):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-slate-400 font-medium">فترات سريعة:</span>
            <button
              type="button"
              onClick={() => applyPreset('this_week')}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>هذا الأسبوع (أسبوع المصنع)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last_week')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
            >
              الأسبوع السابق
            </button>
            <button
              type="button"
              onClick={() => applyPreset('this_month')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
            >
              هذا الشهر
            </button>
            <button
              type="button"
              onClick={() => applyPreset('this_quarter')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
            >
              الربع الحالي
            </button>
            <button
              type="button"
              onClick={() => applyPreset('this_year')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
            >
              العام الحالي
            </button>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
            >
              كافة الفترات
            </button>
          </div>

          {currentAccount && (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>كود الحساب: <strong className="font-mono text-slate-800 dark:text-slate-200">{currentAccount.code}</strong></span>
              <span>•</span>
              <span>طبيعة الحساب: <strong className="text-indigo-600 dark:text-indigo-400">{currentAccount.nature === 'debit' ? 'مدين بطبيعته' : 'دائن بطبيعته'}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Account Header & Metric Summary Cards */}
      {ledgerSummary && (
        <div className="space-y-4">
          {/* Account Title Banner */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-mono font-black text-base flex items-center justify-center shadow-md">
                {ledgerSummary.accountCode}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {ledgerSummary.accountName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  نوع الحساب: <span className="font-semibold text-slate-700 dark:text-slate-300">{ledgerSummary.accountType}</span> — الطبيعة العادية: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{ledgerSummary.normalNature === 'debit' ? 'مدين' : 'دائن'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>
                {dateFrom || dateTo
                  ? `الفترة من: ${dateFrom || 'البداية'} إلى: ${dateTo || 'اليوم'}`
                  : 'كافة الحركات المسجلة بالنظام حتى تاريخه'}
              </span>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Opening Balance */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="text-xs font-bold text-slate-400">رصيد أول المدة (Opening Balance)</div>
              <div className="text-2xl font-black text-slate-800 dark:text-white mt-1 tabular-nums">
                {ledgerSummary.openingBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold">
                <span className={`px-2 py-0.5 rounded-full ${
                  ledgerSummary.openingBalanceNature === 'debit'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                }`}>
                  {ledgerSummary.openingBalanceNature === 'debit' ? 'رصيد مدين' : 'رصيد دائن'}
                </span>
                <span className="text-slate-400 text-[11px]">قبل بداية الفترة</span>
              </div>
            </div>

            {/* 2. Total Period Debits */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">إجمالي الحركات المدينة (Debits)</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                {ledgerSummary.totalDebits.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-xs text-slate-400 font-medium">
                مجموع المبالغ المنصرفة / المحملة كمدين
              </div>
            </div>

            {/* 3. Total Period Credits */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400">إجمالي الحركات الدائنة (Credits)</div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
                {ledgerSummary.totalCredits.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-xs text-slate-400 font-medium">
                مجموع المبالغ المودعة / المحملة كدائن
              </div>
            </div>

            {/* 4. Closing / Current Balance */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-indigo-500/50 shadow-sm relative overflow-hidden">
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                الرصيد الحالي / آخر المدة (Closing)
              </div>
              <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1 tabular-nums">
                {ledgerSummary.closingBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold">
                <span className={`px-2 py-0.5 rounded-full ${
                  ledgerSummary.closingBalanceNature === 'debit'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : ledgerSummary.closingBalanceNature === 'credit'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {ledgerSummary.closingBalanceNature === 'debit'
                    ? 'رصيد نهائي مدين'
                    : ledgerSummary.closingBalanceNature === 'credit'
                    ? 'رصيد نهائي دائن'
                    : 'رصيد مقفل (صفر)'}
                </span>
                <span className="text-slate-400 text-[11px]">الرصيد الصافي</span>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>سجل حركة الحساب التفصيلي (Transactions Ledger)</span>
              </div>
              <div className="text-xs text-slate-500">
                عدد الحركات: <strong className="text-slate-800 dark:text-slate-200">{ledgerSummary.movements.length}</strong> حركة
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
                <p className="font-bold">جاري حساب دفتر الأستاذ...</p>
              </div>
            ) : ledgerSummary.movements.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Scale className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600 dark:text-slate-300">لا توجد حركات مسجلة لهذا الحساب خلال الفترة المحددة</p>
                <p className="text-xs text-slate-400 mt-1">الرصيد الافتتاحي هو: {ledgerSummary.openingBalance} ج.م</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs md:text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4 text-center">رقم القيد</th>
                      <th className="py-3 px-4">نوع الحركة / المرجع</th>
                      <th className="py-3 px-4 min-w-[200px]">البيان وشرح الحركة</th>
                      <th className="py-3 px-4 text-left">مدين (+)</th>
                      <th className="py-3 px-4 text-left">دائن (-)</th>
                      <th className="py-3 px-4 text-left">الرصيد التراكمي</th>
                      <th className="py-3 px-4 text-center">طبيعة الرصيد</th>
                      <th className="py-3 px-4">المسؤول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Opening Balance Row */}
                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 font-bold text-slate-600 dark:text-slate-300">
                      <td className="py-3 px-4 text-slate-400">—</td>
                      <td className="py-3 px-4 text-center text-slate-400">—</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold">
                          رصيد أول المدة
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        رصيد الحساب المنقول من الفترة السابقة
                      </td>
                      <td className="py-3 px-4 text-left font-mono">
                        {ledgerSummary.openingBalanceNature === 'debit' && ledgerSummary.openingBalance > 0
                          ? ledgerSummary.openingBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-left font-mono">
                        {ledgerSummary.openingBalanceNature === 'credit' && ledgerSummary.openingBalance > 0
                          ? ledgerSummary.openingBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-slate-800 dark:text-white tabular-nums">
                        {ledgerSummary.openingBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {ledgerSummary.openingBalanceNature === 'debit' ? 'مدين' : 'دائن'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">النظام</td>
                    </tr>

                    {/* Movements Rows */}
                    {ledgerSummary.movements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{mov.date}</div>
                          {mov.time && <div className="text-[10px] text-slate-400 font-mono">{mov.time}</div>}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {onNavigateToJournal ? (
                            <button
                              type="button"
                              onClick={() => onNavigateToJournal(mov.entryNumber)}
                              className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{mov.entryNumber}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="font-mono font-bold text-indigo-600">{mov.entryNumber}</span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {mov.entryTypeLabel}
                          </div>
                          {mov.reference && (
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              مرجع: {mov.reference}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 max-w-sm">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {mov.description}
                          </div>
                          {mov.costCenter && (
                            <div className="text-[11px] text-indigo-500 font-semibold mt-0.5">
                              [مركز تكلفة / أمر: {mov.costCenter}]
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                          {mov.debit > 0
                            ? mov.debit.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '—'}
                        </td>

                        <td className="py-3 px-4 text-left font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                          {mov.credit > 0
                            ? mov.credit.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '—'}
                        </td>

                        <td className="py-3 px-4 text-left font-mono font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                          {mov.balanceAfter.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            mov.balanceNature === 'debit'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : mov.balanceNature === 'credit'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {mov.balanceNature === 'debit' ? 'مدين' : mov.balanceNature === 'credit' ? 'دائن' : 'متزن'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {mov.userName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Ledger Totals Footer */}
                  <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <tr>
                      <td colSpan={4} className="py-3.5 px-4 text-left font-black">
                        إجمالي حركات الفترة والرصيد الختامي:
                      </td>
                      <td className="py-3.5 px-4 text-left font-mono text-emerald-600 font-black tabular-nums whitespace-nowrap">
                        {ledgerSummary.totalDebits.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-left font-mono text-rose-600 font-black tabular-nums whitespace-nowrap">
                        {ledgerSummary.totalCredits.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-left font-mono text-indigo-700 dark:text-indigo-300 font-black tabular-nums whitespace-nowrap">
                        {ledgerSummary.closingBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-black">
                          {ledgerSummary.closingBalanceNature === 'debit' ? 'رصيد مدين' : 'رصيد دائن'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GeneralLedgerView;
