import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  ArrowLeft, 
  Printer, 
  Download, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  ShieldCheck, 
  BookOpen, 
  FileText,
  HelpCircle,
  RefreshCw,
  Calendar,
  Building,
  Activity,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { BalanceSheetReport } from '../../types/balanceSheet';
import { getBalanceSheet } from '../../lib/journalEngine';
import { useTheme } from '../../contexts/ThemeContext';
import { getPrimaryBg, getPrimaryText, getRadiusClass } from '../../lib/theme';

interface BalanceSheetViewProps {
  onNavigateToLedger?: (accountCode: string) => void;
  onNavigateToJournal?: () => void;
  onNavigateToTrialBalance?: () => void;
  onNavigateToIncomeStatement?: () => void;
  onNavigateToCashFlow?: () => void;
  onNavigateToChartOfAccounts?: () => void;
  onBack?: () => void;
}

export const BalanceSheetView: React.FC<BalanceSheetViewProps> = ({
  onNavigateToLedger,
  onNavigateToJournal,
  onNavigateToTrialBalance,
  onNavigateToIncomeStatement,
  onNavigateToCashFlow,
  onNavigateToChartOfAccounts,
  onBack
}) => {
  const { color, radius } = useTheme();
  const primaryBg = getPrimaryBg(color);
  const primaryText = getPrimaryText(color);
  const radiusClass = getRadiusClass(radius);

  const [report, setReport] = useState<BalanceSheetReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'statement' | 'analysis' | 'notes'>('statement');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    buildings: false,
    machinery: true,
    cash: true,
    receivables: true,
    raw_inventory: true,
    wip_inventory: true,
    fg_inventory: true,
    suppliers: true,
    accrued_expenses: true,
    paid_capital: false,
    current_net_income: true
  });
  const [selectedExplanation, setSelectedExplanation] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getBalanceSheet(asOfDate);
      setReport(data);
    } catch (err) {
      console.error('Error loading Balance Sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('gfos_storage_update', handleUpdate);
    window.addEventListener('journal_entries_updated', handleUpdate);
    window.addEventListener('purchases_updated', handleUpdate);
    window.addEventListener('sales_updated', handleUpdate);
    window.addEventListener('treasury_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('gfos_storage_update', handleUpdate);
      window.removeEventListener('journal_entries_updated', handleUpdate);
      window.removeEventListener('purchases_updated', handleUpdate);
      window.removeEventListener('sales_updated', handleUpdate);
      window.removeEventListener('treasury_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [asOfDate]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    const lines = [
      'الرمز المحاسبي,اسم البند / الحساب المالي,المبلغ بالجنيه المصري (EGP),النسبة من الإجمالي',
      '--- الأصول غير المتداولة ---',
      ...report.nonCurrentAssets.subGroups.flatMap(sg => [
        `"${sg.codePrefix}","${sg.arabicTitle}","${sg.total}","${sg.percentageOfSection}%"`,
        ...sg.accounts.map(a => `"${a.accountCode}","  - ${a.accountName}","${a.amount}","${a.percentageOfTotal}%"`)
      ]),
      `,"إجمالي الأصول غير المتداولة","${report.nonCurrentAssets.total}",""`,
      '',
      '--- الأصول المتداولة ---',
      ...report.currentAssets.subGroups.flatMap(sg => [
        `"${sg.codePrefix}","${sg.arabicTitle}","${sg.total}","${sg.percentageOfSection}%"`,
        ...sg.accounts.map(a => `"${a.accountCode}","  - ${a.accountName}","${a.amount}","${a.percentageOfTotal}%"`)
      ]),
      `,"إجمالي الأصول المتداولة","${report.currentAssets.total}",""`,
      `,"إجمالي الأصول الكلية","${report.totalAssets}","100%"`,
      '',
      '--- الالتزامات المتداولة ---',
      ...report.currentLiabilities.subGroups.flatMap(sg => [
        `"${sg.codePrefix}","${sg.arabicTitle}","${sg.total}","${sg.percentageOfSection}%"`,
        ...sg.accounts.map(a => `"${a.accountCode}","  - ${a.accountName}","${a.amount}",""` )
      ]),
      `,"إجمالي الالتزامات المتداولة","${report.currentLiabilities.total}",""`,
      '',
      '--- حقوق الملكية ---',
      ...report.equity.subGroups.flatMap(sg => [
        `"${sg.codePrefix}","${sg.arabicTitle}","${sg.total}","${sg.percentageOfSection}%"`,
        ...sg.accounts.map(a => `"${a.accountCode}","  - ${a.accountName}","${a.amount}",""` )
      ]),
      `,"إجمالي حقوق الملكية","${report.equity.total}",""`,
      `,"إجمالي الالتزامات وحقوق الملكية","${report.totalLiabilitiesAndEquity}","100%"`
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Balance_Sheet_${asOfDate}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:m-0 print:space-y-4 font-sans" dir="rtl">
      {/* Top Header & Actions */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 ${radiusClass} shadow-xs print:hidden`}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shrink-0 shadow-2xs"
              title="رجوع للشاشة السابقة"
            >
              <ArrowLeft className="w-5 h-5 transform rotate-180" />
            </button>
          )}

          <div className={`w-12 h-12 rounded-xl ${primaryBg} text-white flex items-center justify-center shadow-xs shrink-0`}>
            <Scale className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                قائمة المركز المالي والميزانية العمومية
              </h1>
              <span className="px-2.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold">
                Balance Sheet (EAS / IFRS)
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-md font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                مستمدة مباشرة من شجرة الحسابات ودفتر الأستاذ العام
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              البيان الختامي الشامل للأصول والخصوم وحقوق الملكية والسيولة النقدية لمصنع الملابس الجاهزة
            </p>
          </div>
        </div>

        {/* Date Filter & Control Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>حتى تاريخ:</span>
            <input 
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold"
            />
          </div>

          <button
            onClick={loadData}
            title="تحديث البيانات"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-slate-600 dark:text-slate-300' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-4 py-2 ${primaryBg} hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer`}
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الميزانية الرسمية</span>
          </button>
        </div>
      </div>

      {/* Cross-Module Accounting Workflow Navigation Bar */}
      <div className={`flex items-center justify-between overflow-x-auto gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-2xs print:hidden custom-scrollbar`}>
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>الدورة المحاسبية المترابطة:</span>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToChartOfAccounts && (
            <button 
              onClick={onNavigateToChartOfAccounts}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>شجرة الحسابات</span>
            </button>
          )}
          {onNavigateToJournal && (
            <button 
              onClick={onNavigateToJournal}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>دفتر القيود</span>
            </button>
          )}
          {onNavigateToLedger && (
            <button 
              onClick={() => onNavigateToLedger('12411')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>دفتر الأستاذ</span>
            </button>
          )}
          {onNavigateToTrialBalance && (
            <button 
              onClick={onNavigateToTrialBalance}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-500" />
              <span>ميزان المراجعة</span>
            </button>
          )}
          {onNavigateToIncomeStatement && (
            <button 
              onClick={onNavigateToIncomeStatement}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>قائمة الدخل (P&L)</span>
            </button>
          )}
          {onNavigateToCashFlow && (
            <button 
              onClick={onNavigateToCashFlow}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5 text-teal-500" />
              <span>قائمة التدفقات النقدية</span>
            </button>
          )}
        </div>
      </div>

      {/* Official Balance Status Alert Banner */}
      {report && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
          report.isBalanced 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              report.isBalanced ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}>
              {report.isBalanced ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm">
                  {report.isBalanced 
                    ? 'الميزانية العمومية متوازنة محاسبياً بدقة تامة (Assets = Liabilities + Equity)'
                    : 'يوجد عدم توازن بالميزانية يحتاج إلى مراجعة القيود المحاسبية'
                  }
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
                  الفارق: {report.difference.toFixed(2)} ج.م
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                إجمالي الأصول ({formatCurrency(report.totalAssets)} ج.م) يتطابق تماماً مع مجموع الالتزامات وحقوق الملكية ({formatCurrency(report.totalLiabilitiesAndEquity)} ج.م).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-auto bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">إجمالي الأصول</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(report.totalAssets)}</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">الخصوم + الملكية</span>
              <span className="font-black text-blue-600 dark:text-blue-400">{formatCurrency(report.totalLiabilitiesAndEquity)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Executive Financial Health KPI Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 print:grid-cols-4">
          <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 ${radiusClass} shadow-2xs hover:shadow-xs transition-all`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <span>رأس المال العامل الصافي</span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {formatCurrency(report.kpis.workingCapital)} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ج.م</span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 inline" /> أصول متداولة تفوق الخصوم
            </p>
          </div>

          <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 ${radiusClass} shadow-2xs hover:shadow-xs transition-all`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <span>نسبة التداول (السيولة)</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {report.kpis.currentRatio.toFixed(2)}x
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              المعيار الصناعي الآمن: &gt; 1.5x
            </p>
          </div>

          <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 ${radiusClass} shadow-2xs hover:shadow-xs transition-all`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <span>نسبة السيولة السريعة</span>
              <DollarSign className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {report.kpis.quickRatio.toFixed(2)}x
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              (نقدية + عملاء) / الالتزامات المتداولة
            </p>
          </div>

          <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 ${radiusClass} shadow-2xs hover:shadow-xs transition-all`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <span>نسبة التمويل الذاتي (الملكية)</span>
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {(report.kpis.equityRatio * 100).toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              حصة حقوق الملكية من إجمالي الأصول
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs print:hidden`}>
        <button
          onClick={() => setActiveTab('statement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'statement'
              ? `${primaryBg} text-white shadow-xs font-black`
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>جدول المركز المالي المحاسبي</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'analysis'
              ? `${primaryBg} text-white shadow-xs font-black`
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>التحليل المالي وشرح بنود الميزانية</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'notes'
              ? `${primaryBg} text-white shadow-xs font-black`
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>دليل مراقبي الحسابات والتوصيات</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">جاري تجميع حركات دفتر الأستاذ العام وتوليد المركز المالي...</p>
        </div>
      ) : report ? (
        <>
          {activeTab === 'statement' && (
            <div className="space-y-6">
              {/* Dual-Column Classic Accounting Presentation: Assets vs Liabilities & Equity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
                {/* ============================================================== */}
                {/* RIGHT COLUMN: ASSETS (الأصول) */}
                {/* ============================================================== */}
                <div className="space-y-6">
                  {/* Section Title */}
                  <div className={`flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-5 py-3.5 ${radiusClass} shadow-2xs`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <h2 className="text-base font-black text-emerald-950 dark:text-emerald-100">جانب الأصول (Assets)</h2>
                    </div>
                    <span className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(report.totalAssets)} ج.م
                    </span>
                  </div>

                  {/* 1. Non-Current Assets (الأصول غير المتداولة) */}
                  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${radiusClass} overflow-hidden shadow-2xs`}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">أولاً: الأصول غير المتداولة (الثابتة)</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">المباني، الآلات وماكينات الخياطة، السيارات، وبرمجيات ERP</p>
                      </div>
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(report.nonCurrentAssets.total)} ج.م
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {report.nonCurrentAssets.subGroups.map((group) => (
                        <div key={group.id} className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleGroup(group.id)}>
                              <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5">
                                {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800/40">
                                {group.codePrefix}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{group.arabicTitle}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedExplanation(group.explanation); }}
                                title="عرض الشرح والتحليل"
                                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 cursor-pointer"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                                {group.percentageOfSection}%
                              </span>
                              <span className={`font-mono text-xs font-black ${
                                group.codePrefix.startsWith('113') || group.codePrefix.startsWith('1142') ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                              }`}>
                                {group.codePrefix.startsWith('113') || group.codePrefix.startsWith('1142') ? `(${formatCurrency(group.total)})` : formatCurrency(group.total)} ج.م
                              </span>
                            </div>
                          </div>

                          {/* Expanded sub-accounts */}
                          {expandedGroups[group.id] && group.accounts.length > 0 && (
                            <div className="mt-2.5 mr-6 pl-2 space-y-1.5 border-r-2 border-slate-200 dark:border-slate-700">
                              {group.accounts.map((acc) => (
                                <div key={acc.accountCode} className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">{acc.accountCode}</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{acc.accountName}</span>
                                    {acc.note && (
                                      <span className="text-[10px] text-slate-500">({acc.note})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-800 dark:text-slate-300 font-bold">{formatCurrency(acc.amount)}</span>
                                    {onNavigateToLedger && (
                                      <button
                                        onClick={() => onNavigateToLedger(acc.accountCode)}
                                        title="عرض دفتر الأستاذ"
                                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-0.5 cursor-pointer"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Current Assets (الأصول المتداولة) */}
                  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${radiusClass} overflow-hidden shadow-2xs`}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">ثانياً: الأصول المتداولة (Current Assets)</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">النقدية، العملاء، الخامات، الإنتاج تحت التشغيل، والملابس الجاهزة</p>
                      </div>
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(report.currentAssets.total)} ج.م
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {report.currentAssets.subGroups.map((group) => (
                        <div key={group.id} className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleGroup(group.id)}>
                              <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5">
                                {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40">
                                {group.codePrefix}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{group.arabicTitle}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedExplanation(group.explanation); }}
                                title="عرض الشرح والتحليل"
                                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 cursor-pointer"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                                {group.percentageOfSection}%
                              </span>
                              <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(group.total)} ج.م
                              </span>
                            </div>
                          </div>

                          {/* Expanded sub-accounts */}
                          {expandedGroups[group.id] && group.accounts.length > 0 && (
                            <div className="mt-2.5 mr-6 pl-2 space-y-1.5 border-r-2 border-slate-200 dark:border-slate-700">
                              {group.accounts.map((acc) => (
                                <div key={acc.accountCode} className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">{acc.accountCode}</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{acc.accountName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-800 dark:text-slate-300 font-bold">{formatCurrency(acc.amount)}</span>
                                    {onNavigateToLedger && (
                                      <button
                                        onClick={() => onNavigateToLedger(acc.accountCode)}
                                        title="عرض دفتر الأستاذ"
                                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-0.5 cursor-pointer"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assets Total Footing */}
                  <div className={`p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 ${radiusClass} flex items-center justify-between`}>
                    <div>
                      <span className="text-xs text-emerald-950 dark:text-emerald-200 font-black block">إجمالي أصول المصنع الكلية (Total Assets)</span>
                      <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">الأصول غير المتداولة + الأصول المتداولة</span>
                    </div>
                    <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(report.totalAssets)} ج.م
                    </span>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* LEFT COLUMN: LIABILITIES & EQUITY (الخصوم وحقوق الملكية) */}
                {/* ============================================================== */}
                <div className="space-y-6">
                  {/* Section Title */}
                  <div className={`flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 px-5 py-3.5 ${radiusClass} shadow-2xs`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <h2 className="text-base font-black text-blue-950 dark:text-blue-100">الخصوم وحقوق الملكية (Liabilities & Equity)</h2>
                    </div>
                    <span className="text-sm font-mono font-black text-blue-700 dark:text-blue-400">
                      {formatCurrency(report.totalLiabilitiesAndEquity)} ج.م
                    </span>
                  </div>

                  {/* 3. Current Liabilities (الالتزامات المتداولة) */}
                  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${radiusClass} overflow-hidden shadow-2xs`}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">ثالثاً: الالتزامات المتداولة (قصيرة الأجل)</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">الموردون التجاريون، أوراق الدفع، أجور العمال المعلقة، والضرائب</p>
                      </div>
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(report.currentLiabilities.total)} ج.م
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {report.currentLiabilities.subGroups.map((group) => (
                        <div key={group.id} className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleGroup(group.id)}>
                              <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5">
                                {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="font-mono text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200/50 dark:border-rose-800/40">
                                {group.codePrefix}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{group.arabicTitle}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedExplanation(group.explanation); }}
                                title="عرض الشرح والتحليل"
                                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 cursor-pointer"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                                {group.percentageOfSection}%
                              </span>
                              <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">
                                {formatCurrency(group.total)} ج.م
                              </span>
                            </div>
                          </div>

                          {/* Expanded sub-accounts */}
                          {expandedGroups[group.id] && group.accounts.length > 0 && (
                            <div className="mt-2.5 mr-6 pl-2 space-y-1.5 border-r-2 border-slate-200 dark:border-slate-700">
                              {group.accounts.map((acc) => (
                                <div key={acc.accountCode} className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">{acc.accountCode}</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{acc.accountName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-800 dark:text-slate-300 font-bold">{formatCurrency(acc.amount)}</span>
                                    {onNavigateToLedger && (
                                      <button
                                        onClick={() => onNavigateToLedger(acc.accountCode)}
                                        title="عرض دفتر الأستاذ"
                                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-0.5 cursor-pointer"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Non-Current Liabilities (الالتزامات غير المتداولة) */}
                  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${radiusClass} overflow-hidden shadow-2xs`}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">رابعاً: الالتزامات غير المتداولة (طويلة الأجل)</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">قروض بنكية وتسهيلات تمويل خطوط الإنتاج والآلات</p>
                      </div>
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(report.nonCurrentLiabilities.total)} ج.م
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {report.nonCurrentLiabilities.subGroups.map((group) => (
                        <div key={group.id} className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleGroup(group.id)}>
                              <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5">
                                {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/40">
                                {group.codePrefix}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{group.arabicTitle}</span>
                            </div>
                            <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                              {formatCurrency(group.total)} ج.م
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Equity (حقوق الملكية) */}
                  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${radiusClass} overflow-hidden shadow-2xs`}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">خامساً: حقوق الملكية (Shareholders Equity)</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">رأس المال، الاحتياطيات، وصافي أرباح الفترة من قائمة الدخل</p>
                      </div>
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(report.equity.total)} ج.م
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {report.equity.subGroups.map((group) => (
                        <div key={group.id} className={`p-3.5 transition-colors ${
                          group.id === 'current_net_income' ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-r-4 border-indigo-500' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleGroup(group.id)}>
                              <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5">
                                {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-800/40">
                                {group.codePrefix}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{group.arabicTitle}</span>
                              {group.id === 'current_net_income' && (
                                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                                  من قائمة الدخل P&L
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                                {formatCurrency(group.total)} ج.م
                              </span>
                              {group.id === 'current_net_income' && onNavigateToIncomeStatement && (
                                <button
                                  onClick={onNavigateToIncomeStatement}
                                  title="فتح قائمة الدخل لمراجعة الأرباح"
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 p-1 rounded-lg hover:bg-indigo-100/60 dark:hover:bg-indigo-950/60 cursor-pointer"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded sub-accounts */}
                          {expandedGroups[group.id] && group.accounts.length > 0 && (
                            <div className="mt-2.5 mr-6 pl-2 space-y-1.5 border-r-2 border-slate-200 dark:border-slate-700">
                              {group.accounts.map((acc) => (
                                <div key={acc.accountCode} className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">{acc.accountCode}</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{acc.accountName}</span>
                                    {acc.note && (
                                      <span className="text-[10px] text-slate-500">({acc.note})</span>
                                    )}
                                  </div>
                                  <span className="font-mono text-slate-800 dark:text-slate-300 font-bold">{formatCurrency(acc.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Liabilities & Equity Total Footing */}
                  <div className={`p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 ${radiusClass} flex items-center justify-between`}>
                    <div>
                      <span className="text-xs text-blue-950 dark:text-blue-200 font-black block">إجمالي الخصوم وحقوق الملكية (Total Liabilities & Equity)</span>
                      <span className="text-[11px] text-blue-700/80 dark:text-blue-400/80">الالتزامات المتداولة + طويلة الأجل + حقوق المساهمين</span>
                    </div>
                    <span className="text-base font-black font-mono text-blue-700 dark:text-blue-400">
                      {formatCurrency(report.totalLiabilitiesAndEquity)} ج.م
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 ${radiusClass} space-y-3 shadow-2xs`}>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm">
                    <TrendingUp className="w-5 h-5" />
                    <span>تحليل السيولة والقدرة على الوفاء بالتعهدات</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {report.analysisNotes.liquidityAnalysis}
                  </p>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">التداول</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{report.kpis.currentRatio.toFixed(2)}x</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">السيولة السريعة</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{report.kpis.quickRatio.toFixed(2)}x</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">السيولة النقدية</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{report.kpis.cashRatio.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>

                <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 ${radiusClass} space-y-3 shadow-2xs`}>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    <span>تحليل الملاءة المالية وهيكل التمويل</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {report.analysisNotes.solvencyAnalysis}
                  </p>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">المديونية / الملكية</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{report.kpis.debtToEquityRatio.toFixed(2)}x</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">الديون / الأصول</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{(report.kpis.debtToAssetsRatio * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">التمويل الذاتي</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{(report.kpis.equityRatio * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 ${radiusClass} space-y-3 md:col-span-2 shadow-2xs`}>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                    <Building className="w-5 h-5" />
                    <span>تحليل تركيبة المخزون الصناعي ورأس المال العامل لمصنع الملابس</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {report.analysisNotes.inventoryStructureAnalysis}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {report.analysisNotes.workingCapitalAnalysis}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="text-slate-500 dark:text-slate-400 mb-1 font-bold">مخزون الأقمشة والخامات (1241)</div>
                      <div className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        {formatCurrency(report.currentAssets.rawMaterialsInventory)} ج.م
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                        {report.currentAssets.totalInventory > 0 ? ((report.currentAssets.rawMaterialsInventory / report.currentAssets.totalInventory) * 100).toFixed(1) : 0}% من إجمالي المخزون
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="text-slate-500 dark:text-slate-400 mb-1 font-bold">مخزون قيد التشغيل WIP (1242)</div>
                      <div className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        {formatCurrency(report.currentAssets.wipInventory)} ج.م
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                        {report.currentAssets.totalInventory > 0 ? ((report.currentAssets.wipInventory / report.currentAssets.totalInventory) * 100).toFixed(1) : 0}% أوامر تشغيل جارية
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="text-slate-500 dark:text-slate-400 mb-1 font-bold">مخزون الملابس الجاهزة (1243)</div>
                      <div className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        {formatCurrency(report.currentAssets.finishedGoodsInventory)} ج.م
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                        {report.currentAssets.totalInventory > 0 ? ((report.currentAssets.finishedGoodsInventory / report.currentAssets.totalInventory) * 100).toFixed(1) : 0}% جاهز للتسليم والبيع
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 ${radiusClass} space-y-4 shadow-2xs`}>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
                <span>إرشادات وتوصيات المراجع المالي ومراقبي الحسابات</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ملاحظات التدقيق الداخلي الخاصة بسلامة المركز المالي والرقابة المحاسبية على خطوط الإنتاج:
              </p>
              <div className="space-y-2.5">
                {report.analysisNotes.auditorRecommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-mono text-xs font-black">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal / Flyout for Line Item Explanation */}
          {selectedExplanation && (
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedExplanation(null)}
            >
              <div 
                className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 ${radiusClass} max-w-md w-full shadow-2xl space-y-3`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm">
                    <Info className="w-4 h-4" />
                    <span>إيضاح مالي ومحاسبي</span>
                  </div>
                  <button 
                    onClick={() => setSelectedExplanation(null)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer font-bold"
                  >
                    إغلاق
                  </button>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedExplanation}
                </p>
              </div>
            </div>
          )}

          {/* Official Printing Footing with Certification Signatures */}
          <div className="hidden print:block mt-8 pt-6 border-t-2 border-slate-300 text-black">
            <div className="grid grid-cols-4 gap-4 text-center text-xs">
              <div className="border border-slate-300 p-3 rounded">
                <span className="block font-bold mb-6">رئيس حسابات التكاليف</span>
                <span className="text-[10px] text-slate-500">التوقيع: .....................</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="block font-bold mb-6">المدير المالي (CFO)</span>
                <span className="text-[10px] text-slate-500">التوقيع: .....................</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="block font-bold mb-6">مراقب الحسابات الخارجي</span>
                <span className="text-[10px] text-slate-500">التوقيع: .....................</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="block font-bold mb-6">رئيس مجلس الإدارة</span>
                <span className="text-[10px] text-slate-500">التوقيع: .....................</span>
              </div>
            </div>
            <div className="text-center text-[10px] text-slate-500 mt-4">
              تم استخراج هذه القائمة المالية آلياً من نظام «GFOS ERP» لإدارة مصانع الملابس الجاهزة بتاريخ {new Date().toLocaleDateString('ar-EG')}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
