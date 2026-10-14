import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Eye,
  FileSpreadsheet,
  Building2,
  TrendingUp,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { getTrialBalance } from '../../lib/journalEngine';
import { TrialBalanceReport, TrialBalanceItem } from '../../types/journal';
import { getPeriodDateRange } from '../../lib/periodUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { getPrimaryBg, getPrimaryText } from '../../lib/theme';

interface TrialBalanceViewProps {
  onNavigateToLedger?: (accountCode: string) => void;
  onNavigateToJournal?: () => void;
  onNavigateToIncomeStatement?: () => void;
  onNavigateToBalanceSheet?: () => void;
  onNavigateToCashFlow?: () => void;
  onBack?: () => void;
}

type DisplayFormat = 'full' | 'balances' | 'movements';

export const TrialBalanceView: React.FC<TrialBalanceViewProps> = ({
  onNavigateToLedger,
  onNavigateToJournal,
  onNavigateToIncomeStatement,
  onNavigateToBalanceSheet,
  onNavigateToCashFlow,
  onBack
}) => {
  const { color } = useTheme();
  const primaryBg = getPrimaryBg(color);
  const primaryText = getPrimaryText(color);

  // Filter states
  const [periodPreset, setPeriodPreset] = useState<string>('this_month');
  const [dateFrom, setDateFrom] = useState<string>(() => getPeriodDateRange('this_month').startDate);
  const [dateTo, setDateTo] = useState<string>(() => getPeriodDateRange('this_month').endDate);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'leaf_only' | 'level_1' | 'level_2' | 'level_3'>('all');
  const [hideZeroAccounts, setHideZeroAccounts] = useState(true);
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>('full');

  // Data & loading states
  const [report, setReport] = useState<TrialBalanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load trial balance
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getTrialBalance(dateFrom || undefined, dateTo || undefined);
      setReport(data);
    } catch (error) {
      console.error('Failed to load trial balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo]);

  // Listen to system updates
  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('gfos_storage_update', handleUpdate);
    window.addEventListener('journal_entries_updated', handleUpdate);
    window.addEventListener('sales_invoices_updated', handleUpdate);
    window.addEventListener('purchases_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('gfos_storage_update', handleUpdate);
      window.removeEventListener('journal_entries_updated', handleUpdate);
      window.removeEventListener('sales_invoices_updated', handleUpdate);
      window.removeEventListener('purchases_updated', handleUpdate);
    };
  }, [dateFrom, dateTo]);

  // Apply Quick Date Range Preset
  const applyPreset = (preset: string) => {
    setPeriodPreset(preset);
    const range = getPeriodDateRange(preset);
    setDateFrom(range.startDate);
    setDateTo(range.endDate);
  };

  // Filter items based on user criteria
  const filteredItems = useMemo(() => {
    if (!report) return [];

    return report.items.filter(item => {
      // 1. Search term (Code or Name)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesCode = item.accountCode.toLowerCase().includes(query);
        const matchesName = item.accountName.toLowerCase().includes(query);
        if (!matchesCode && !matchesName) return false;
      }

      // 2. Account type filter
      if (accountTypeFilter !== 'all' && item.accountType !== accountTypeFilter) {
        return false;
      }

      // 3. Level filter
      if (levelFilter === 'leaf_only' && item.isParent) {
        return false;
      } else if (levelFilter === 'level_1' && item.level !== 1) {
        return false;
      } else if (levelFilter === 'level_2' && item.level !== 2) {
        return false;
      } else if (levelFilter === 'level_3' && item.level !== 3) {
        return false;
      }

      // 4. Hide zero accounts
      if (hideZeroAccounts) {
        const hasActivity =
          item.openingDebit > 0 ||
          item.openingCredit > 0 ||
          item.periodDebit > 0 ||
          item.periodCredit > 0 ||
          item.closingDebit > 0 ||
          item.closingCredit > 0;
        if (!hasActivity) return false;
      }

      return true;
    });
  }, [report, searchTerm, accountTypeFilter, levelFilter, hideZeroAccounts]);

  // Recalculate visible sum row if filtering by leaf accounts
  const visibleTotals = useMemo(() => {
    if (!filteredItems.length) {
      return {
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: 0,
        periodCredit: 0,
        totalDebit: 0,
        totalCredit: 0,
        closingDebit: 0,
        closingCredit: 0
      };
    }

    // If viewing all including parents, only sum non-parents to avoid double-counting
    const itemsToSum = filteredItems.filter(it => !it.isParent);
    const list = itemsToSum.length > 0 ? itemsToSum : filteredItems;

    const round = (n: number) => Math.round(n * 100) / 100;

    return {
      openingDebit: round(list.reduce((s, it) => s + it.openingDebit, 0)),
      openingCredit: round(list.reduce((s, it) => s + it.openingCredit, 0)),
      periodDebit: round(list.reduce((s, it) => s + it.periodDebit, 0)),
      periodCredit: round(list.reduce((s, it) => s + it.periodCredit, 0)),
      totalDebit: round(list.reduce((s, it) => s + it.totalDebit, 0)),
      totalCredit: round(list.reduce((s, it) => s + it.totalCredit, 0)),
      closingDebit: round(list.reduce((s, it) => s + it.closingDebit, 0)),
      closingCredit: round(list.reduce((s, it) => s + it.closingCredit, 0))
    };
  }, [filteredItems]);

  const isVisibleBalanced =
    Math.abs(visibleTotals.closingDebit - visibleTotals.closingCredit) < 0.01;

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredItems.length) return;

    const headers = [
      'كود الحساب',
      'اسم الحساب',
      'النوع',
      'المستوى',
      'أول المدة مدين',
      'أول المدة دائن',
      'حركات الفترة مدين',
      'حركات الفترة دائن',
      'المجاميع مدين',
      'المجاميع دائن',
      'آخر المدة مدين',
      'آخر المدة دائن'
    ];

    const rows = filteredItems.map(it => [
      it.accountCode,
      `"${it.accountName.replace(/"/g, '""')}"`,
      it.accountType,
      it.level,
      it.openingDebit,
      it.openingCredit,
      it.periodDebit,
      it.periodCredit,
      it.totalDebit,
      it.totalCredit,
      it.closingDebit,
      it.closingCredit
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ميزان_المراجعة_${dateFrom || 'البداية'}_${dateTo || 'اليوم'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          )}
          <div className={`p-3 rounded-xl ${primaryBg} text-white shadow-xs`}>
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                ميزان المراجعة (بالمجاميع والأرصدة)
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold">
                Trial Balance
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تقرير التوازن المحاسبي العام للأصول والخصوم وحقوق الملكية والإيرادات والمصروفات
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToCashFlow && (
            <button
              type="button"
              onClick={onNavigateToCashFlow}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 transition-colors"
            >
              <DollarSign className="w-4 h-4 text-teal-600" />
              <span>التدفقات النقدية</span>
            </button>
          )}

          {onNavigateToBalanceSheet && (
            <button
              type="button"
              onClick={onNavigateToBalanceSheet}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 transition-colors"
            >
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>المركز المالي</span>
            </button>
          )}

          {onNavigateToIncomeStatement && (
            <button
              type="button"
              onClick={onNavigateToIncomeStatement}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>قائمة الدخل (P&L)</span>
            </button>
          )}

          {onNavigateToJournal && (
            <button
              type="button"
              onClick={onNavigateToJournal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>دفتر القيود اليومية</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel/CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الميزان</span>
          </button>
        </div>
      </div>

      {/* KPI Cards & Balance Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {/* Balance Status Card */}
        <div
          className={`p-4 rounded-2xl border ${
            isVisibleBalanced
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">حالة التوازن المحاسبي</span>
            {isVisibleBalanced ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-black">
              {isVisibleBalanced ? 'ميزان متزن تماماً' : 'يوجد فارق غير متزن!'}
            </span>
          </div>
          <p className="text-[11px] mt-1 opacity-80">
            {isVisibleBalanced
              ? 'إجمالي المدين يطابق إجمالي الدائن بدقة 100%'
              : `فارق التوازن: ${(visibleTotals.closingDebit - visibleTotals.closingCredit).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`}
          </p>
        </div>

        {/* Period Movements Debit/Credit */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">حركات الفترة المحددة</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 space-y-1 text-xs font-bold">
            <div className="flex justify-between text-blue-700 dark:text-blue-400">
              <span>مدين:</span>
              <span>{visibleTotals.periodDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</span>
            </div>
            <div className="flex justify-between text-indigo-700 dark:text-indigo-400">
              <span>دائن:</span>
              <span>{visibleTotals.periodCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</span>
            </div>
          </div>
        </div>

        {/* Ending Balances Debit/Credit */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">الأرصدة الختامية للميزان</span>
            <Scale className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 space-y-1 text-xs font-bold">
            <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
              <span>مدين:</span>
              <span>{visibleTotals.closingDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</span>
            </div>
            <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
              <span>دائن:</span>
              <span>{visibleTotals.closingCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</span>
            </div>
          </div>
        </div>

        {/* Filter Summary & Accounts Count */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">الحسابات المدرجة</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {filteredItems.length}
            </span>
            <span className="text-xs text-slate-400 font-bold">حساب مالي</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {dateFrom || dateTo
              ? `الفترة: ${dateFrom || 'البداية'} إلى ${dateTo || 'الآن'}`
              : 'كافة الحركات منذ بداية النظام'}
          </p>
        </div>
      </div>

      {/* Filter & Period Controls Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 print:hidden">
        {/* Row 1: Search & Primary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="بحث برقم الحساب أو الاسم..."
              className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
            />
          </div>

          {/* Account Type Filter */}
          <div>
            <select
              value={accountTypeFilter}
              onChange={e => setAccountTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 font-bold cursor-pointer"
            >
              <option value="all">كافة أنواع الحسابات</option>
              <option value="أصول">الأصول (متداولة وثابتة)</option>
              <option value="خصوم">الخصوم والالتزامات</option>
              <option value="حقوق ملكية">حقوق الملكية ورأس المال</option>
              <option value="إيرادات">الإيرادات والمبيعات</option>
              <option value="تكاليف ومصروفات">التكاليف والمصروفات</option>
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 font-bold cursor-pointer"
            >
              <option value="all">كافة المستويات (رئيسي وفرعي)</option>
              <option value="leaf_only">الحسابات الفرعية (المعاملاتية) فقط</option>
              <option value="level_1">المستوى 1 (الحسابات الرئيسية العامة)</option>
              <option value="level_2">المستوى 2 (الحسابات العامة)</option>
              <option value="level_3">المستوى 3 (الحسابات المساعدة)</option>
            </select>
          </div>

          {/* Display Format Mode */}
          <div>
            <select
              value={displayFormat}
              onChange={e => setDisplayFormat(e.target.value as DisplayFormat)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold cursor-pointer"
            >
              <option value="full">ميزان المراجعة الكامل (8 أعمدة)</option>
              <option value="balances">ميزان المراجعة بالأرصدة (4 أعمدة)</option>
              <option value="movements">ميزان المراجعة بالحركات والمجاميع (4 أعمدة)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Factory Period Presets (Saturday-Friday) & Date Inputs */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
          {/* Quick Period Buttons */}
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-slate-400 font-medium">فترات العمل:</span>
            <button
              type="button"
              onClick={() => applyPreset('this_week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                periodPreset === 'this_week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
              }`}
            >
              <span>هذا الأسبوع (أسبوع المصنع)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last_week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'last_week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              الأسبوع السابق
            </button>
            <button
              type="button"
              onClick={() => applyPreset('today')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => applyPreset('this_month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'this_month'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              هذا الشهر
            </button>
            <button
              type="button"
              onClick={() => applyPreset('this_quarter')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'this_quarter'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              الربع الحالي
            </button>
            <button
              type="button"
              onClick={() => applyPreset('this_year')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'this_year'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              العام الحالي
            </button>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'all' && !dateFrom && !dateTo
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              كافة الفترات
            </button>
          </div>

          {/* Custom Date Pickers & Zero-account Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>من:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => {
                  setDateFrom(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800"
              />
              <span>إلى:</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => {
                  setDateTo(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideZeroAccounts}
                onChange={e => setHideZeroAccounts(e.target.checked)}
                className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>إخفاء الحسابات الصفرية</span>
            </label>
          </div>
        </div>
      </div>

      {/* Official Print Header (Visible ONLY on print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
        <h2 className="text-xl font-black">مصنع الملابس الجاهزة المتكامل - نسيج ERP</h2>
        <h3 className="text-base font-bold mt-1">ميزان المراجعة بالمجاميع والأرصدة</h3>
        <p className="text-xs text-slate-600 mt-1">
          عن الفترة من: {dateFrom || 'بداية النشاط'} إلى: {dateTo || 'تاريخه'} | تاريخ الاستخراج:{' '}
          {new Date().toLocaleDateString('ar-EG')}
        </p>
      </div>

      {/* Main Trial Balance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            {/* Top Multi-Header */}
            <thead>
              <tr className="bg-slate-800 text-white font-bold border-b border-slate-700">
                <th rowSpan={2} className="py-3 px-3 w-24">كود الحساب</th>
                <th rowSpan={2} className="py-3 px-4 min-w-[220px]">اسم الحساب المالي</th>
                <th rowSpan={2} className="py-3 px-2 text-center w-16">النوع</th>
                
                {/* 1. Opening Balances (أرصدة بداية الفترة) */}
                {(displayFormat === 'full' || displayFormat === 'balances') && (
                  <th colSpan={2} className="py-2 px-2 text-center bg-slate-700/80 border-x border-slate-600">
                    أرصدة أول المدة
                  </th>
                )}

                {/* 2. Period Movements (حركات الفترة المحددة) */}
                {(displayFormat === 'full' || displayFormat === 'movements') && (
                  <th colSpan={2} className="py-2 px-2 text-center bg-blue-900/60 border-x border-slate-600">
                    حركات الفترة
                  </th>
                )}

                {/* 3. Totals (المجاميع الكلية) */}
                {(displayFormat === 'full' || displayFormat === 'movements') && (
                  <th colSpan={2} className="py-2 px-2 text-center bg-indigo-900/60 border-x border-slate-600">
                    المجاميع
                  </th>
                )}

                {/* 4. Ending Balances (أرصدة نهاية الفترة) */}
                {(displayFormat === 'full' || displayFormat === 'balances') && (
                  <th colSpan={2} className="py-2 px-2 text-center bg-emerald-900/60 border-x border-slate-600">
                    الأرصدة الختامية
                  </th>
                )}

                <th rowSpan={2} className="py-3 px-3 text-center w-16 print:hidden">دفتر الأستاذ</th>
              </tr>

              {/* Sub-Header: Debit / Credit */}
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] border-b border-slate-300 dark:border-slate-700">
                {/* Opening */}
                {(displayFormat === 'full' || displayFormat === 'balances') && (
                  <>
                    <th className="py-2 px-2 text-left bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700">مدين</th>
                    <th className="py-2 px-2 text-left bg-slate-50 dark:bg-slate-800/80 border-l border-slate-200 dark:border-slate-700">دائن</th>
                  </>
                )}

                {/* Movements */}
                {(displayFormat === 'full' || displayFormat === 'movements') && (
                  <>
                    <th className="py-2 px-2 text-left bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-r border-slate-200 dark:border-slate-700">مدين</th>
                    <th className="py-2 px-2 text-left bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-l border-slate-200 dark:border-slate-700">دائن</th>
                  </>
                )}

                {/* Totals */}
                {(displayFormat === 'full' || displayFormat === 'movements') && (
                  <>
                    <th className="py-2 px-2 text-left bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border-r border-slate-200 dark:border-slate-700">مدين</th>
                    <th className="py-2 px-2 text-left bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border-l border-slate-200 dark:border-slate-700">دائن</th>
                  </>
                )}

                {/* Ending */}
                {(displayFormat === 'full' || displayFormat === 'balances') && (
                  <>
                    <th className="py-2 px-2 text-left bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-700">مدين</th>
                    <th className="py-2 px-2 text-left bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-l border-slate-200 dark:border-slate-700">دائن</th>
                  </>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                      <p className="font-bold text-sm">جاري احتساب وتوليد ميزان المراجعة والقيود المحاسبية...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map(item => {
                  const isParent = item.isParent;
                  const rowClass = isParent
                    ? 'bg-slate-50/70 dark:bg-slate-800/40 font-bold text-slate-900 dark:text-white'
                    : 'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-300';

                  return (
                    <tr
                      key={item.accountId}
                      onClick={() => onNavigateToLedger?.(item.accountCode)}
                      className={`${rowClass} transition-colors cursor-pointer group`}
                      title="اضغط لفتح كشف حساب دفتر الأستاذ العام"
                    >
                      {/* Account Code */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <span style={{ paddingRight: `${(item.level - 1) * 12}px` }}>
                          {item.accountCode}
                        </span>
                      </td>

                      {/* Account Name */}
                      <td className="py-2.5 px-4 font-semibold">
                        <div
                          className="flex items-center gap-1.5"
                          style={{ paddingRight: `${(item.level - 1) * 12}px` }}
                        >
                          {isParent && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          <span className={isParent ? 'font-black' : ''}>{item.accountName}</span>
                        </div>
                      </td>

                      {/* Account Type */}
                      <td className="py-2.5 px-2 text-center text-[10px] whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {item.accountType}
                        </span>
                      </td>

                      {/* Opening Balances */}
                      {(displayFormat === 'full' || displayFormat === 'balances') && (
                        <>
                          <td className="py-2.5 px-2 text-left font-mono border-r border-slate-100 dark:border-slate-800">
                            {item.openingDebit > 0 ? item.openingDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-left font-mono border-l border-slate-100 dark:border-slate-800">
                            {item.openingCredit > 0 ? item.openingCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                        </>
                      )}

                      {/* Period Movements */}
                      {(displayFormat === 'full' || displayFormat === 'movements') && (
                        <>
                          <td className="py-2.5 px-2 text-left font-mono text-blue-700 dark:text-blue-300 border-r border-slate-100 dark:border-slate-800">
                            {item.periodDebit > 0 ? item.periodDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-left font-mono text-blue-700 dark:text-blue-300 border-l border-slate-100 dark:border-slate-800">
                            {item.periodCredit > 0 ? item.periodCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                        </>
                      )}

                      {/* Totals */}
                      {(displayFormat === 'full' || displayFormat === 'movements') && (
                        <>
                          <td className="py-2.5 px-2 text-left font-mono text-indigo-800 dark:text-indigo-300 border-r border-slate-100 dark:border-slate-800">
                            {item.totalDebit > 0 ? item.totalDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-left font-mono text-indigo-800 dark:text-indigo-300 border-l border-slate-100 dark:border-slate-800">
                            {item.totalCredit > 0 ? item.totalCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                        </>
                      )}

                      {/* Ending Balances */}
                      {(displayFormat === 'full' || displayFormat === 'balances') && (
                        <>
                          <td className="py-2.5 px-2 text-left font-mono font-bold text-emerald-800 dark:text-emerald-300 border-r border-slate-100 dark:border-slate-800">
                            {item.closingDebit > 0 ? item.closingDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-left font-mono font-bold text-emerald-800 dark:text-emerald-300 border-l border-slate-100 dark:border-slate-800">
                            {item.closingCredit > 0 ? item.closingCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                        </>
                      )}

                      {/* Action column (Ledger icon) */}
                      <td className="py-2.5 px-3 text-center print:hidden" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onNavigateToLedger?.(item.accountCode)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="عرض دفتر الأستاذ للحساب"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-slate-400">
                    <Scale className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-bold text-sm">لا توجد حسابات تطابق خيارات التصفية الحالية</p>
                    <p className="text-xs mt-1">جرّب إلغاء تفعيل "إخفاء الحسابات الصفرية" أو توسيع الفترة المحددة</p>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Table Footer: Totals Row */}
            {filteredItems.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-700">
                  <td colSpan={3} className="py-3 px-4 text-right">
                    <span>إجمالي ميزان المراجعة العام:</span>
                  </td>

                  {/* Opening */}
                  {(displayFormat === 'full' || displayFormat === 'balances') && (
                    <>
                      <td className="py-3 px-2 text-left font-mono border-r border-slate-700">
                        {visibleTotals.openingDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-left font-mono border-l border-slate-700">
                        {visibleTotals.openingCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                    </>
                  )}

                  {/* Movements */}
                  {(displayFormat === 'full' || displayFormat === 'movements') && (
                    <>
                      <td className="py-3 px-2 text-left font-mono text-blue-300 border-r border-slate-700">
                        {visibleTotals.periodDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-left font-mono text-blue-300 border-l border-slate-700">
                        {visibleTotals.periodCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                    </>
                  )}

                  {/* Totals */}
                  {(displayFormat === 'full' || displayFormat === 'movements') && (
                    <>
                      <td className="py-3 px-2 text-left font-mono text-indigo-300 border-r border-slate-700">
                        {visibleTotals.totalDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-left font-mono text-indigo-300 border-l border-slate-700">
                        {visibleTotals.totalCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                    </>
                  )}

                  {/* Ending */}
                  {(displayFormat === 'full' || displayFormat === 'balances') && (
                    <>
                      <td className="py-3 px-2 text-left font-mono text-emerald-400 border-r border-slate-700">
                        {visibleTotals.closingDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-left font-mono text-emerald-400 border-l border-slate-700">
                        {visibleTotals.closingCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                    </>
                  )}

                  <td className="py-3 px-3 text-center print:hidden">
                    {isVisibleBalanced ? (
                      <span className="text-[10px] text-emerald-400 font-bold">متزن ✓</span>
                    ) : (
                      <span className="text-[10px] text-rose-400 font-bold">فرق ✗</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Official Signatures for Print */}
      <div className="hidden print:grid grid-cols-3 gap-6 pt-10 text-center text-xs font-bold text-slate-800">
        <div className="border-t border-slate-400 pt-2">
          <p>إعداد / المحاسب المالي</p>
          <p className="mt-8">....................................</p>
        </div>
        <div className="border-t border-slate-400 pt-2">
          <p>مراجعة / رئيس قسم الحسابات</p>
          <p className="mt-8">....................................</p>
        </div>
        <div className="border-t border-slate-400 pt-2">
          <p>اعتماد / المدير المالي</p>
          <p className="mt-8">....................................</p>
        </div>
      </div>
    </div>
  );
};

export default TrialBalanceView;
