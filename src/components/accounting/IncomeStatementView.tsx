import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp,
  Calendar,
  Download,
  Printer,
  BookOpen,
  Scale,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  PieChart,
  Layers,
  Percent,
  Calculator,
  ShieldCheck,
  Building,
  Boxes,
  Factory,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Info,
  Maximize2,
  Minimize2,
  Share2
} from 'lucide-react';
import { getIncomeStatement } from '../../lib/journalEngine';
import { IncomeStatementReport, IncomeStatementItem, IncomeStatementSection } from '../../types/incomeStatement';
import { getPeriodDateRange } from '../../lib/periodUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { getPrimaryBg, getPrimaryText } from '../../lib/theme';

interface IncomeStatementViewProps {
  onNavigateToLedger?: (accountCode: string) => void;
  onNavigateToJournal?: () => void;
  onNavigateToTrialBalance?: () => void;
  onNavigateToBalanceSheet?: () => void;
  onNavigateToCashFlow?: () => void;
  onBack?: () => void;
}

type ActiveTab = 'statement' | 'explanation' | 'visual';

export function IncomeStatementView({
  onNavigateToLedger,
  onNavigateToJournal,
  onNavigateToTrialBalance,
  onNavigateToBalanceSheet,
  onNavigateToCashFlow,
  onBack
}: IncomeStatementViewProps) {
  const { color } = useTheme();
  const primaryBg = getPrimaryBg(color);
  const primaryText = getPrimaryText(color);

  // States
  const [activeTab, setActiveTab] = useState<ActiveTab>('statement');
  const [periodPreset, setPeriodPreset] = useState<string>('this_month');
  const [dateFrom, setDateFrom] = useState<string>(() => getPeriodDateRange('this_month').startDate);
  const [dateTo, setDateTo] = useState<string>(() => getPeriodDateRange('this_month').endDate);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(22.5); // Standard Egyptian Corporate Tax Rate
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    revenues: true,
    cogs: true,
    opex: true,
    other: true
  });
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const [report, setReport] = useState<IncomeStatementReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Ref for print
  const printableRef = useRef<HTMLDivElement>(null);

  // Load Income Statement
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getIncomeStatement(dateFrom || undefined, dateTo || undefined, taxRatePercent);
      setReport(data);
    } catch (err) {
      console.error('Failed to load income statement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo, taxRatePercent]);

  // Listen to updates in system
  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('journal_entries_updated', handleUpdate);
    window.addEventListener('sales_invoices_updated', handleUpdate);
    window.addEventListener('sales_returns_updated', handleUpdate);
    window.addEventListener('purchases_updated', handleUpdate);
    window.addEventListener('purchase_returns_updated', handleUpdate);
    window.addEventListener('raw_materials_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('journal_entries_updated', handleUpdate);
      window.removeEventListener('sales_invoices_updated', handleUpdate);
      window.removeEventListener('sales_returns_updated', handleUpdate);
      window.removeEventListener('purchases_updated', handleUpdate);
      window.removeEventListener('purchase_returns_updated', handleUpdate);
      window.removeEventListener('raw_materials_updated', handleUpdate);
    };
  }, [dateFrom, dateTo, taxRatePercent]);

  const applyPreset = (preset: string) => {
    setPeriodPreset(preset);
    const range = getPeriodDateRange(preset);
    setDateFrom(range.startDate);
    setDateTo(range.endDate);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleAllDetails = (expand: boolean) => {
    if (!report) return;
    const allSec: Record<string, boolean> = {};
    const allIt: Record<string, boolean> = {};
    ['revenues', 'cogs', 'opex', 'other'].forEach(s => (allSec[s] = expand));
    Object.values(report.sections).forEach((sec: IncomeStatementSection) => {
      sec.items.forEach(it => {
        if (it.accounts && it.accounts.length > 0) {
          allIt[it.id] = expand;
        }
      });
    });
    setExpandedSections(allSec);
    setExpandedItems(allIt);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!report) return;
    const rows: string[][] = [
      ['مصنع الملابس الجاهزة المتكامل - قائمة الدخل والأرباح والخسائر'],
      [report.periodLabel],
      ['تاريخ التوليد:', new Date().toLocaleDateString('ar-EG')],
      [],
      ['البند المالي / الحساب', 'رقم الحساب', 'المبلغ (ج.م)', 'النسبة من صافي المبيعات %', 'النوع']
    ];

    const addSectionToCsv = (sec: IncomeStatementSection) => {
      rows.push([`=== ${sec.arabicTitle} ===`, '', sec.total.toFixed(2), `${sec.percentageOfNetSales.toFixed(1)}%`, 'إجمالي القسم']);
      sec.items.forEach(it => {
        rows.push([
          it.title,
          '',
          `${it.isDeduction ? '-' : ''}${it.amount.toFixed(2)}`,
          `${it.percentageOfNetSales.toFixed(1)}%`,
          it.isMilestone ? 'محطة رئيسية' : 'بند فرعي'
        ]);
        it.accounts.forEach(acc => {
          rows.push([`  - ${acc.accountName}`, acc.accountCode, acc.amount.toFixed(2), `${acc.percentageOfNetSales.toFixed(1)}%`, 'حساب أستاذ']);
        });
      });
      rows.push([]);
    };

    addSectionToCsv(report.sections.revenues);
    rows.push(['صافي إيرادات المبيعات', '', report.netSales.toFixed(2), '100.0%', 'صافي المبيعات']);
    rows.push([]);
    addSectionToCsv(report.sections.cogs);
    rows.push(['مجمل الربح / الخسارة (Gross Profit)', '', report.grossProfit.toFixed(2), `${report.kpis.grossProfitMargin.toFixed(1)}%`, 'مجمل الربح']);
    rows.push([]);
    addSectionToCsv(report.sections.opex);
    rows.push(['صافي الربح التشغيلي (Operating Profit - EBIT)', '', report.operatingProfit.toFixed(2), `${report.kpis.operatingProfitMargin.toFixed(1)}%`, 'ربح تشغيلي']);
    rows.push([]);
    addSectionToCsv(report.sections.other);
    rows.push(['صافي الربح قبل الضريبة (EBT)', '', report.netProfitBeforeTax.toFixed(2), '', 'ربح قبل الضريبة']);
    rows.push([`ضريبة الدخل التقديرية (${report.taxRatePercent}%)`, '', `-${report.estimatedTaxAmount.toFixed(2)}`, '', 'مخصص ضريبة']);
    rows.push(['صافي الدخل / أرباح الفترة النهائية (Net Income)', '', report.netIncome.toFixed(2), `${report.kpis.netProfitMargin.toFixed(1)}%`, 'صافي الدخل النهائي']);

    const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Income_Statement_${dateFrom || 'all'}_${dateTo || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-300">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black">قائمة الدخل والأرباح والخسائر (Income Statement)</h2>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                    P&L المعياري الصناعي
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  التقرير المالي المعياري لقياس إيرادات وتكاليف وهوامش ربحية مصنع الملابس الجاهزة
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onNavigateToCashFlow && (
              <button
                type="button"
                onClick={onNavigateToCashFlow}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-xs"
              >
                <DollarSign className="w-4 h-4 text-teal-300" />
                <span>قائمة التدفقات النقدية</span>
              </button>
            )}

            {onNavigateToBalanceSheet && (
              <button
                type="button"
                onClick={onNavigateToBalanceSheet}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-xs"
              >
                <Building className="w-4 h-4 text-indigo-300" />
                <span>قائمة المركز المالي</span>
              </button>
            )}

            {onNavigateToTrialBalance && (
              <button
                type="button"
                onClick={onNavigateToTrialBalance}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-xs"
              >
                <Scale className="w-4 h-4 text-emerald-300" />
                <span>ميزان المراجعة</span>
              </button>
            )}

            {onNavigateToJournal && (
              <button
                type="button"
                onClick={onNavigateToJournal}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-xs"
              >
                <BookOpen className="w-4 h-4 text-indigo-300" />
                <span>دفتر القيود اليومية</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة القائمة الرسمية</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('statement')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'statement'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>عرض قائمة الدخل المالية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('explanation')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'explanation'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>شرح بنود ومعادلات قائمة الدخل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'visual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>التحليل المالي وهيكل التكاليف</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards (4 Milestones) */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Net Sales */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">صافي إيرادات المبيعات</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {report.netSales.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}{' '}
                <span className="text-xs font-bold text-slate-400">ج.م</span>
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                إجمالي المبيعات: {report.grossSales.toLocaleString('ar-EG')} ج.م
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Cost of Goods Sold */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">تكلفة البضاعة المباعة (COGS)</p>
              <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                {report.totalCogs.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}{' '}
                <span className="text-xs font-bold text-rose-400">ج.م</span>
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                تمثل {report.sections.cogs.percentageOfNetSales.toFixed(1)}% من المبيعات
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Factory className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Gross Profit */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">مجمل الربح الصناعي (Gross Profit)</p>
              <p
                className={`text-xl sm:text-2xl font-black mt-1 ${
                  report.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {report.grossProfit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}{' '}
                <span className="text-xs font-bold">ج.م</span>
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  هامش {report.kpis.grossProfitMargin.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400">كفاءة التصنيع</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Net Income */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">صافي الدخل وأرباح النشاط</p>
              <p
                className={`text-xl sm:text-2xl font-black mt-1 ${
                  report.netIncome >= 0 ? 'text-indigo-700' : 'text-rose-700'
                }`}
              >
                {report.netIncome.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}{' '}
                <span className="text-xs font-bold">ج.م</span>
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  صافي ربح {report.kpis.netProfitMargin.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400">بعد الضرائب</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Period Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Period Presets */}
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-slate-400 font-medium">فترة العمل:</span>
            <button
              type="button"
              onClick={() => applyPreset('this_week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'this_week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              هذا الأسبوع (أسبوع المصنع)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last_week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'last_week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
              }`}
            >
              الأسبوع السابق
            </button>
            <button
              type="button"
              onClick={() => applyPreset('this_month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'this_month'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
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
                  : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
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
                  : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
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
                  : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
              }`}
            >
              كافة الفترات
            </button>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 font-bold">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>من:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => {
                setDateFrom(e.target.value);
                setPeriodPreset('custom');
              }}
              className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium"
            />
            <span>إلى:</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => {
                setDateTo(e.target.value);
                setPeriodPreset('custom');
              }}
              className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium"
            />

            {/* Tax Rate Input */}
            <div className="flex items-center gap-1.5 mr-2 pl-2 border-r border-slate-200">
              <span className="text-slate-500">ضريبة الشركات:</span>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={taxRatePercent}
                onChange={e => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                className="w-14 px-2 py-1 text-center border border-slate-200 rounded-lg text-xs bg-slate-50 font-bold"
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>
        </div>

        {/* Expand / Collapse Controls */}
        {activeTab === 'statement' && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-bold text-slate-700">
              {report?.periodLabel || 'كافة الفترات'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAllDetails(true)}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>توسيع كافة البند والحسابات</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => toggleAllDetails(false)}
                className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>طي التفاصيل</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: FINANCIAL STATEMENT VIEW (القائمة المحاسبية) */}
      {activeTab === 'statement' && report && (
        <div ref={printableRef} className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          {/* Printable Formal Header (visible in print) */}
          <div className="hidden print:block p-8 border-b-2 border-slate-900">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-slate-900">مصنع الملابس الجاهزة المتكامل</h1>
                <p className="text-xs text-slate-500 font-bold mt-1">نظام نسيج ERP | الإدارة المالية والمحاسبة العامة</p>
              </div>
              <div className="text-left font-mono text-xs">
                <div className="font-black text-slate-900">قائمة الدخل والأرباح والخسائر</div>
                <div className="text-slate-500">{report.periodLabel}</div>
                <div className="text-[10px] text-slate-400">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-black border-b border-slate-800">
                  <th className="p-3.5 w-10 text-center">#</th>
                  <th className="p-3.5 min-w-[280px]">البيان المالي / الحساب المحاسبي</th>
                  <th className="p-3.5 w-32 text-center">رقم الحساب</th>
                  <th className="p-3.5 w-36 text-left">المبلغ الجزئي (ج.م)</th>
                  <th className="p-3.5 w-40 text-left">المبلغ الكلي (ج.م)</th>
                  <th className="p-3.5 w-28 text-center">النسبة من المبيعات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* ============================================================== */}
                {/* SECTION 1: REVENUES & NET SALES */}
                {/* ============================================================== */}
                <tr className="bg-slate-100/90 font-black text-slate-800">
                  <td colSpan={6} className="p-3">
                    <button
                      type="button"
                      onClick={() => toggleSection('revenues')}
                      className="w-full flex items-center justify-between font-black text-xs text-slate-900 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">أولاً: إيرادات المبيعات وصافي النشاط الصناعي</span>
                        <span className="text-[11px] text-slate-500 font-normal">({report.sections.revenues.description})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700 text-sm">
                          {report.netSales.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </span>
                        {expandedSections.revenues ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                  </td>
                </tr>

                {expandedSections.revenues && (
                  <>
                    {/* Gross Sales */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center text-slate-400">1.1</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">إجمالي إيرادات المبيعات والتشغيل</div>
                        <div className="text-[11px] text-slate-400">مبيعات ملابس جاهزة + تشغيل للغير + عوادم أقمشة</div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">41</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">
                        {report.grossSales.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-slate-500">
                        {((report.grossSales / (report.netSales || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Sales Returns (Deduction) */}
                    <tr className="hover:bg-slate-50/70 transition-colors bg-rose-50/20">
                      <td className="p-3 text-center text-slate-400">1.2</td>
                      <td className="p-3">
                        <div className="font-bold text-rose-700">يُطرح: مردودات ومسموحات المبيعات</div>
                        <div className="text-[11px] text-slate-400">ملابس معادة من العملاء لعيب أو عدم مطابقة</div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">421</td>
                      <td className="p-3 text-left font-mono font-bold text-rose-600">
                        ({report.salesReturns.toLocaleString('ar-EG', { minimumFractionDigits: 2 })})
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-rose-600">
                        {((report.salesReturns / (report.netSales || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Sales Discounts (Deduction) */}
                    <tr className="hover:bg-slate-50/70 transition-colors bg-rose-50/20">
                      <td className="p-3 text-center text-slate-400">1.3</td>
                      <td className="p-3">
                        <div className="font-bold text-rose-700">يُطرح: الخصم المسموح به للعملاء</div>
                        <div className="text-[11px] text-slate-400">خصم تعجيل الدفع وخصومات الكميات الممنوحة</div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">422</td>
                      <td className="p-3 text-left font-mono font-bold text-rose-600">
                        ({report.salesDiscounts.toLocaleString('ar-EG', { minimumFractionDigits: 2 })})
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-rose-600">
                        {((report.salesDiscounts / (report.netSales || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Net Sales (Milestone 1) */}
                    <tr className="bg-emerald-50/70 border-y-2 border-emerald-200 font-black text-emerald-950">
                      <td className="p-3.5 text-center text-emerald-700 font-bold">=</td>
                      <td className="p-3.5">
                        <div className="text-sm font-black flex items-center gap-2">
                          <span>صافي إيرادات المبيعات (Net Sales)</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-900 font-bold">
                            أساس القياس المالي
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-700/80 font-normal">
                          صافي المتحصلات الاستحقاقية بعد استبعاد المردودات والخصومات
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-mono text-emerald-800 font-bold">صافي 4</td>
                      <td className="p-3.5 text-left font-mono text-slate-400">-</td>
                      <td className="p-3.5 text-left font-mono text-base font-black text-emerald-700">
                        {report.netSales.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-center font-mono text-emerald-800 font-black">100.0%</td>
                    </tr>
                  </>
                )}

                {/* ============================================================== */}
                {/* SECTION 2: COST OF GOODS SOLD (COGS) */}
                {/* ============================================================== */}
                <tr className="bg-slate-100/90 font-black text-slate-800">
                  <td colSpan={6} className="p-3">
                    <button
                      type="button"
                      onClick={() => toggleSection('cogs')}
                      className="w-full flex items-center justify-between font-black text-xs text-slate-900 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Factory className="w-4 h-4 text-rose-600" />
                        <span className="text-sm">ثانياً: تكلفة البضاعة المباعة وتكاليف التصنيع (COGS)</span>
                        <span className="text-[11px] text-slate-500 font-normal">({report.sections.cogs.description})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-rose-700 text-sm">
                          ({report.totalCogs.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}) ج.م
                        </span>
                        {expandedSections.cogs ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                  </td>
                </tr>

                {expandedSections.cogs && (
                  <>
                    {/* Direct Materials */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center text-slate-400">2.1</td>
                      <td className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-800">تكلفة المواد الخام المباشرة المنصرفة للتشغيل</div>
                            <div className="text-[11px] text-slate-400">أقمشة وغزول وبطانات + إكسسوارات وسوست وأزرار + مواد تعبئة</div>
                          </div>
                          {report.sections.cogs.items[0].accounts.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleItem('direct_materials')}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>{expandedItems.direct_materials ? 'إخفاء الحسابات' : 'عرض الحسابات'}</span>
                              {expandedItems.direct_materials ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        {/* Sub Accounts if expanded */}
                        {expandedItems.direct_materials && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                            {report.sections.cogs.items[0].accounts.map((acc, aIdx) => (
                              <div key={aIdx} className="flex items-center justify-between text-[11px]">
                                <span
                                  onClick={() => onNavigateToLedger && onNavigateToLedger(acc.accountCode)}
                                  className="font-bold text-slate-700 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5"
                                >
                                  <span className="font-mono text-slate-400">[{acc.accountCode}]</span>
                                  <span>{acc.accountName}</span>
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                  {acc.amount.toLocaleString('ar-EG')} ج.م ({acc.percentageOfNetSales.toFixed(1)}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">511</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">
                        {report.directMaterials.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-slate-600">
                        {report.kpis.materialCostRatio.toFixed(1)}%
                      </td>
                    </tr>

                    {/* Direct Labor */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center text-slate-400">2.2</td>
                      <td className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-800">أجور العمالة الإنتاجية المباشرة (Direct Labor)</div>
                            <div className="text-[11px] text-slate-400">أجور ومكافآت عمال القص، الخياطة والتجميع، الفنش والكي</div>
                          </div>
                          {report.sections.cogs.items[1].accounts.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleItem('direct_labor')}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>{expandedItems.direct_labor ? 'إخفاء الحسابات' : 'عرض الحسابات'}</span>
                              {expandedItems.direct_labor ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        {expandedItems.direct_labor && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                            {report.sections.cogs.items[1].accounts.map((acc, aIdx) => (
                              <div key={aIdx} className="flex items-center justify-between text-[11px]">
                                <span
                                  onClick={() => onNavigateToLedger && onNavigateToLedger(acc.accountCode)}
                                  className="font-bold text-slate-700 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5"
                                >
                                  <span className="font-mono text-slate-400">[{acc.accountCode}]</span>
                                  <span>{acc.accountName}</span>
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                  {acc.amount.toLocaleString('ar-EG')} ج.م ({acc.percentageOfNetSales.toFixed(1)}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">512</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">
                        {report.directLabor.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-slate-600">
                        {report.kpis.laborCostRatio.toFixed(1)}%
                      </td>
                    </tr>

                    {/* Subcontracting */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center text-slate-400">2.3</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">خدمات تصنيع وتشغيل خارجية (مقاولو باطن)</div>
                        <div className="text-[11px] text-slate-400">مصنعيات تطريز، طباعة حرارية، صباغة وغسيل ومعالجة ملابس</div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">513</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">
                        {report.subcontracting.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-slate-600">
                        {((report.subcontracting / (report.netSales || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Manufacturing Overhead (MOH) */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center text-slate-400">2.4</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">التكاليف الصناعية غير المباشرة (MOH)</div>
                        <div className="text-[11px] text-slate-400">كهرباء وقوى محركة، وقود غلايات، صيانة ماكينات، إهلاك خطوط الإنتاج</div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">52</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">
                        {report.manufacturingOverhead.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-slate-600">
                        {report.kpis.overheadCostRatio.toFixed(1)}%
                      </td>
                    </tr>

                    {/* Total COGS (Milestone 2) */}
                    <tr className="bg-rose-50/40 border-t border-rose-200 font-bold text-rose-950">
                      <td className="p-3 text-center text-rose-600">=</td>
                      <td className="p-3">
                        <div className="font-black text-rose-900">إجمالي تكلفة البضاعة المباعة (Total COGS)</div>
                        <div className="text-[11px] text-rose-700/80 font-normal">مجموع الخامات + الأجور المباشرة + خدمات التشغيل + مصاريف المصنع</div>
                      </td>
                      <td className="p-3 text-center font-mono text-rose-800">5</td>
                      <td className="p-3 text-left font-mono text-slate-400">-</td>
                      <td className="p-3 text-left font-mono font-black text-rose-700">
                        ({report.totalCogs.toLocaleString('ar-EG', { minimumFractionDigits: 2 })})
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-rose-800">
                        {((report.totalCogs / (report.netSales || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* GROSS PROFIT (Key Milestone 1) */}
                    <tr className="bg-gradient-to-r from-emerald-100/90 via-teal-50 to-emerald-100/90 border-y-2 border-emerald-300 font-black text-emerald-950">
                      <td className="p-4 text-center text-emerald-800 text-base">★</td>
                      <td className="p-4">
                        <div className="text-base font-black flex items-center gap-2">
                          <span>مجمل الربح / الخسارة الصناعية (Gross Profit)</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-600 text-white font-bold">
                            هامش مجمل الربح {report.kpis.grossProfitMargin.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-emerald-800/80 font-normal mt-0.5">
                          صافي المبيعات مخصوماً منه تكلفة الإنتاج والتصنيع (مؤشر كفاءة التسعير والتشغيل)
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono text-emerald-900 font-black">مجمل الربح</td>
                      <td className="p-4 text-left font-mono text-slate-400">-</td>
                      <td className="p-4 text-left font-mono text-lg font-black text-emerald-800">
                        {report.grossProfit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center font-mono font-black text-emerald-900">
                        {report.kpis.grossProfitMargin.toFixed(1)}%
                      </td>
                    </tr>
                  </>
                )}

                {/* ============================================================== */}
                {/* SECTION 3: OPERATING EXPENSES (OPEX) */}
                {/* ============================================================== */}
                <tr className="bg-slate-100/90 font-black text-slate-800">
                  <td colSpan={6} className="p-3">
                    <button
                      type="button"
                      onClick={() => toggleSection('opex')}
                      className="w-full flex items-center justify-between font-black text-xs text-slate-900 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">ثالثاً: المصروفات التشغيلية والبيعية والإدارية (OPEX)</span>
                        <span className="text-[11px] text-slate-500 font-normal">({report.sections.opex.description})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-purple-700 text-sm">
                          ({report.totalOpex.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}) ج.م
                        </span>
                        {expandedSections.opex ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                  </td>
                </tr>

                {expandedSections.opex && (
                  <>
                    {/* Selling & Marketing Expenses */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center text-slate-400">3.1</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">المصروفات البيعية والتسويقية (Selling & Distribution)</div>
                        <div className="text-[11px] text-slate-400">عمولات المبيعات، معارض ودعاية، شحن وتوصيل الطلبيات للعملاء</div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">61</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">
                        {report.sellingExpenses.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-slate-600">
                        {((report.sellingExpenses / (report.netSales || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* General & Administrative Expenses */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center text-slate-400">3.2</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">المصروفات الإدارية والعمومية (General & Administrative)</div>
                        <div className="text-[11px] text-slate-400">مرتبات الإدارة والمحاسبة، إنترنت واتصالات، أدوات كتابية، استشارات قانونية</div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">62</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">
                        {report.adminExpenses.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-slate-600">
                        {((report.adminExpenses / (report.netSales || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Total OPEX */}
                    <tr className="bg-purple-50/40 border-t border-purple-200 font-bold text-purple-950">
                      <td className="p-3 text-center text-purple-600">=</td>
                      <td className="p-3">
                        <div className="font-black text-purple-900">إجمالي المصروفات التشغيلية (Total OPEX)</div>
                        <div className="text-[11px] text-purple-700/80 font-normal">المصاريف البيعية والتسويقية والإدارية والعمومية</div>
                      </td>
                      <td className="p-3 text-center font-mono text-purple-800">6</td>
                      <td className="p-3 text-left font-mono text-slate-400">-</td>
                      <td className="p-3 text-left font-mono font-black text-purple-700">
                        ({report.totalOpex.toLocaleString('ar-EG', { minimumFractionDigits: 2 })})
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-purple-800">
                        {report.kpis.operatingExpenseRatio.toFixed(1)}%
                      </td>
                    </tr>

                    {/* OPERATING PROFIT / EBIT (Key Milestone 2) */}
                    <tr className="bg-indigo-50/70 border-y-2 border-indigo-200 font-black text-indigo-950">
                      <td className="p-3.5 text-center text-indigo-700 font-bold">★</td>
                      <td className="p-3.5">
                        <div className="text-sm font-black flex items-center gap-2">
                          <span>صافي الربح التشغيلي (Operating Profit - EBIT)</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-200 text-indigo-900 font-bold">
                            أرباح قبل الفوائد والضرائب {report.kpis.operatingProfitMargin.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[11px] text-indigo-700/80 font-normal">
                          مجمل الربح مخصوماً منه المصروفات التشغيلية (يقيس كفاءة النشاط الأساسي)
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-mono text-indigo-800 font-bold">EBIT</td>
                      <td className="p-3.5 text-left font-mono text-slate-400">-</td>
                      <td className="p-3.5 text-left font-mono text-base font-black text-indigo-700">
                        {report.operatingProfit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-center font-mono text-indigo-800 font-black">
                        {report.kpis.operatingProfitMargin.toFixed(1)}%
                      </td>
                    </tr>
                  </>
                )}

                {/* ============================================================== */}
                {/* SECTION 4: OTHER INCOME, FINANCING & TAXES */}
                {/* ============================================================== */}
                <tr className="bg-slate-100/90 font-black text-slate-800">
                  <td colSpan={6} className="p-3">
                    <button
                      type="button"
                      onClick={() => toggleSection('other')}
                      className="w-full flex items-center justify-between font-black text-xs text-slate-900 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">رابعاً: الإيرادات والمصروفات الأخرى والأعباء التمويلية والضرائب</span>
                        <span className="text-[11px] text-slate-500 font-normal">({report.sections.other.description})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-700 text-sm">
                          {report.sections.other.total.toLocaleString('ar-EG')} ج.م
                        </span>
                        {expandedSections.other ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                  </td>
                </tr>

                {expandedSections.other && (
                  <>
                    {/* Other Income */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center text-slate-400">4.1</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">إيرادات تشغيلية واستثنائية أخرى</div>
                        <div className="text-[11px] text-slate-400">أرباح بيع رواكد، إيرادات استثمارية متنوعة، تسويات جردية دائنة</div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">43</td>
                      <td className="p-3 text-left font-mono font-bold text-emerald-600">
                        +{report.otherIncome.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-slate-500">
                        {((report.otherIncome / (report.netSales || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Financing Expenses */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center text-slate-400">4.2</td>
                      <td className="p-3">
                        <div className="font-bold text-rose-700">يُطرح: المصروفات والفوائد التمويلية والبنكية</div>
                        <div className="text-[11px] text-slate-400">عمولات فتح اعتمادات مستندية، فوائد قروض تمويل خطوط الإنتاج</div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">624</td>
                      <td className="p-3 text-left font-mono font-bold text-rose-600">
                        ({report.financingExpenses.toLocaleString('ar-EG', { minimumFractionDigits: 2 })})
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-slate-500">
                        {((report.financingExpenses / (report.netSales || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Net Profit Before Tax */}
                    <tr className="hover:bg-slate-50/70 transition-colors bg-slate-50 font-bold">
                      <td className="p-3 text-center text-slate-400">=</td>
                      <td className="p-3">
                        <div className="font-black text-slate-900">صافي الربح قبل الضريبة (Net Profit Before Tax - EBT)</div>
                        <div className="text-[11px] text-slate-500">الربح المحاسبي الخاضع للضريبة</div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600">EBT</td>
                      <td className="p-3 text-left font-mono text-slate-400">-</td>
                      <td className="p-3 text-left font-mono font-black text-slate-900">
                        {report.netProfitBeforeTax.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600">
                        {((report.netProfitBeforeTax / (report.netSales || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>

                    {/* Estimated Corporate Income Tax */}
                    <tr className="hover:bg-slate-50/70 transition-colors bg-rose-50/20">
                      <td className="p-3 text-center text-slate-400">4.3</td>
                      <td className="p-3">
                        <div className="font-bold text-rose-700">يُطرح: مخصص ضريبة الدخل التقديرية ({report.taxRatePercent}%)</div>
                        <div className="text-[11px] text-slate-400">ضريبة أرباح الشركات طبقاً للقانون الساري</div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">ضريبة</td>
                      <td className="p-3 text-left font-mono font-bold text-rose-600">
                        ({report.estimatedTaxAmount.toLocaleString('ar-EG', { minimumFractionDigits: 2 })})
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-400">-</td>
                      <td className="p-3 text-center font-mono text-rose-600">
                        {((report.estimatedTaxAmount / (report.netSales || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  </>
                )}

                {/* ============================================================== */}
                {/* FINAL MILESTONE: NET INCOME / NET PROFIT (صافي الدخل النهائي) */}
                {/* ============================================================== */}
                <tr className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white font-black">
                  <td className="p-5 text-center text-amber-400 text-lg">✦</td>
                  <td className="p-5">
                    <div className="text-lg font-black flex items-center gap-3">
                      <span>صافي الدخل / صافي أرباح (خسائر) الفترة النهائية</span>
                      <span className="px-3 py-1 rounded-full text-xs bg-emerald-500 text-white font-black shadow-xs">
                        صافي الربح النهائي {report.kpis.netProfitMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-indigo-200/80 font-normal mt-1">
                      النتيجة المالية النهائية لنشاط المصنع المرحّلة لحساب حقوق الملكية والأرباح المحتجزة
                    </div>
                  </td>
                  <td className="p-5 text-center font-mono text-amber-400 font-black">صافي الدخل</td>
                  <td className="p-5 text-left font-mono text-slate-400">-</td>
                  <td className="p-5 text-left font-mono text-2xl font-black text-amber-300">
                    {report.netIncome.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}{' '}
                    <span className="text-xs font-normal text-slate-300">ج.م</span>
                  </td>
                  <td className="p-5 text-center font-mono text-amber-300 font-black text-base">
                    {report.kpis.netProfitMargin.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Official Signatures Section (Always visible in print) */}
          <div className="p-8 border-t-2 border-slate-300 grid grid-cols-4 gap-4 text-center text-xs text-slate-700 font-bold hidden print:grid">
            <div>
              <p>إعداد: رئيس حسابات التكاليف</p>
              <p className="mt-10 font-mono text-slate-400">.............................</p>
            </div>
            <div>
              <p>مراجعة: المدير المالي (CFO)</p>
              <p className="mt-10 font-mono text-slate-400">.............................</p>
            </div>
            <div>
              <p>اعتماد: مراجع الحسابات القانوني</p>
              <p className="mt-10 font-mono text-slate-400">.............................</p>
            </div>
            <div>
              <p>تصديق: رئيس مجلس الإدارة</p>
              <p className="mt-10 font-mono text-slate-400">.............................</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED EDUCATIONAL EXPLANATION & FORMULAS (شرح بنود قائمة الدخل) */}
      {activeTab === 'explanation' && (
        <div className="space-y-6">
          {/* Main Introduction Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 rounded-2xl border border-amber-200/80 bg-white shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-500/20 text-amber-700 rounded-xl shrink-0 mt-0.5">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">
                  ما هي قائمة الدخل (Income Statement / P&L) وما أهميتها في مصانع الملابس؟
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  قائمة الدخل (تُسمى أيضاً تقرير الأرباح والخسائر) هي <strong>أهم مرآة مالية تعكس أداء المصنع خلال فترة زمنية محددة</strong> (شهر، ربع سنة، أو سنة مالية).
                  تُجيب قائمة الدخل على السؤال الجوهري لكل صاحب مصنع ومدير مالي:
                  <strong className="text-indigo-900"> «هل مصنعنا يُحقق أرباحاً حقيقية من بيع الملابس والتشغيل، أم أن تكلفة الأقمشة وأجور العمال والمصاريف تلتهم الإيرادات؟»</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Step-by-Step Educational Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Net Sales */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">1</span>
                <h4 className="text-sm font-black text-slate-900">صافي المبيعات (Net Sales)</h4>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 font-mono text-xs font-bold text-blue-900">
                صافي المبيعات = إجمالي فواتير المبيعات - مردودات المبيعات - الخصومات المسموحة
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                لا يكفي النظر لإجمالي الفواتير، لأن العميل قد يُرجع ملابس معيبة أو نمنحه خصماً تجارياً. صافي المبيعات هو <strong>القيمة الفعلية المحققة</strong> التي تدخل المصنع وتغطي التكاليف.
              </p>
            </div>

            {/* Step 2: COGS */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center">2</span>
                <h4 className="text-sm font-black text-slate-900">تكلفة البضاعة المباعة (COGS)</h4>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 font-mono text-xs font-bold text-rose-900">
                COGS = خامات مباشرة + أجور عمالة مباشرة + خدمات خارجية + تكاليف صناعية (MOH)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                هي كل جنيه تم إنفاقه مباشرة داخل صالة الإنتاج لتصنيع الملابس المباعة (أمتار الأقمشة، السوست، أجور الخياطين، مصنعيات الطباعة والتطريز، وكهرباء وصيانة الماكينات).
              </p>
            </div>

            {/* Step 3: Gross Profit */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">3</span>
                <h4 className="text-sm font-black text-slate-900">مجمل الربح (Gross Profit)</h4>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 font-mono text-xs font-bold text-emerald-900">
                مجمل الربح = صافي المبيعات - تكلفة البضاعة المباعة (COGS)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                هو <strong>مؤشر كفاءة التصنيع والتسعير</strong>. إذا كان مجمل الربح منخفضاً، فهذا يعني إما أن أسعار بيع الملابس رخيصة جداً، أو أن هناك هدراً كبيراً في استهلاك الأقمشة أو إنتاجية العمال.
              </p>
            </div>

            {/* Step 4: OPEX */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center">4</span>
                <h4 className="text-sm font-black text-slate-900">المصروفات التشغيلية (OPEX)</h4>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 font-mono text-xs font-bold text-purple-900">
                OPEX = المصروفات البيعية والتسويقية + المصروفات الإدارية والعمومية
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                المصاريف التي تنفقها الإدارة العامة خارج خط الإنتاج (عمولات التسويق، الدعاية، الشحن للعملاء، مرتبات المحاسبين والإدارة، والإنترنت والمطبوعات).
              </p>
            </div>

            {/* Step 5: Operating Profit */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center">5</span>
                <h4 className="text-sm font-black text-slate-900">صافي الربح التشغيلي (EBIT)</h4>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 font-mono text-xs font-bold text-indigo-900">
                الربح التشغيلي = مجمل الربح - المصروفات التشغيلية (OPEX)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                يقيس قدرة النشاط الصناعي الأساسي على توليد أرباح قبل الدخول في حسابات الفوائد البنكية والقروض والضرائب.
              </p>
            </div>

            {/* Step 6: Net Income */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">6</span>
                <h4 className="text-sm font-black text-slate-900">صافي الدخل النهائي (Net Income)</h4>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 font-mono text-xs font-bold text-amber-900">
                صافي الدخل = الربح التشغيلي + الإيرادات الأخرى - المصاريف التمويلية - الضرائب
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                هو «قاع القائمة» (The Bottom Line) والربح الصافي الحقيقي الذي يؤول لملاك المصنع ويتم ترحيله إلى حقوق الملكية والأرباح المحتجزة في الميزانية العمومية.
              </p>
            </div>
          </div>

          {/* Industry Benchmarks & Diagnostic Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              <span>المعايير القياسية للنسب المالية في مصانع الملابس الجاهزة (Garment Benchmarks)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold block mb-1">تكلفة الخامات المباشرة:</span>
                <p className="text-base font-black text-slate-900 font-mono">40% - 50%</p>
                <p className="text-[11px] text-slate-500 mt-1">من صافي المبيعات (أقمشة وإكسسوارات)</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold block mb-1">أجور العمالة المباشرة:</span>
                <p className="text-base font-black text-slate-900 font-mono">15% - 25%</p>
                <p className="text-[11px] text-slate-500 mt-1">عمال الخياطة والقص والتشطيب</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold block mb-1">هامش مجمل الربح المستهدف:</span>
                <p className="text-base font-black text-emerald-600 font-mono">30% - 45%</p>
                <p className="text-[11px] text-slate-500 mt-1">لتغطية مصاريف الإدارة والتسويق</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold block mb-1">هامش صافي الربح المستهدف:</span>
                <p className="text-base font-black text-indigo-700 font-mono">10% - 20%</p>
                <p className="text-[11px] text-slate-500 mt-1">عائد ممتاز على المبيعات والاستثمار</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL ANALYSIS & COST BREAKDOWN (التحليل البياني وهيكل التكاليف) */}
      {activeTab === 'visual' && report && (
        <div className="space-y-6">
          {/* Where Does Each 100 EGP Go? Visual Waterfall */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <span>هيكل توزيع إيرادات المبيعات: أين يذهب كل 100 جنيه من مبيعات المصنع؟</span>
            </h4>

            {/* Visual Stacked Progress Bar */}
            <div className="w-full h-8 rounded-xl overflow-hidden flex font-mono text-[11px] font-bold text-white shadow-inner">
              <div
                style={{ width: `${Math.max(5, report.kpis.materialCostRatio)}%` }}
                className="bg-rose-500 flex items-center justify-center truncate px-1"
                title={`خامات: ${report.kpis.materialCostRatio}%`}
              >
                خامات {report.kpis.materialCostRatio}%
              </div>
              <div
                style={{ width: `${Math.max(5, report.kpis.laborCostRatio)}%` }}
                className="bg-amber-500 flex items-center justify-center truncate px-1"
                title={`أجور عمال: ${report.kpis.laborCostRatio}%`}
              >
                أجور {report.kpis.laborCostRatio}%
              </div>
              <div
                style={{ width: `${Math.max(4, report.kpis.overheadCostRatio)}%` }}
                className="bg-purple-500 flex items-center justify-center truncate px-1"
                title={`مصاريف مصنع: ${report.kpis.overheadCostRatio}%`}
              >
                مصنع {report.kpis.overheadCostRatio}%
              </div>
              <div
                style={{ width: `${Math.max(4, report.kpis.operatingExpenseRatio)}%` }}
                className="bg-blue-500 flex items-center justify-center truncate px-1"
                title={`مصاريف إدارية وبيعية: ${report.kpis.operatingExpenseRatio}%`}
              >
                إدارة {report.kpis.operatingExpenseRatio}%
              </div>
              <div
                style={{ width: `${Math.max(5, Math.max(0, report.kpis.netProfitMargin))}%` }}
                className="bg-emerald-600 flex items-center justify-center truncate px-1"
                title={`صافي ربح: ${report.kpis.netProfitMargin}%`}
              >
                صافي ربح {report.kpis.netProfitMargin}%
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-2">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-rose-500 shrink-0"></span>
                <span>المواد الخام ({report.kpis.materialCostRatio}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shrink-0"></span>
                <span>أجور العمالة ({report.kpis.laborCostRatio}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-purple-500 shrink-0"></span>
                <span>تكاليف المصنع ({report.kpis.overheadCostRatio}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-blue-500 shrink-0"></span>
                <span>مصاريف الإدارة ({report.kpis.operatingExpenseRatio}%)</span>
              </div>
              <div className="flex items-center gap-2 font-black text-emerald-700">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 shrink-0"></span>
                <span>صافي الربح ({report.kpis.netProfitMargin}%)</span>
              </div>
            </div>
          </div>

          {/* Break-Even Analysis Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>نقطة التعادل التقديرية (Break-Even Point)</span>
              </h4>
              <p className="text-xs text-slate-600">
                حجم المبيعات الذي يتساوى عنده إجمالي الإيرادات مع إجمالي التكاليف (الربح عنده = صفر):
              </p>
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold block">مبيعات التعادل المطلوبة:</span>
                  <span className="text-xl font-black font-mono text-indigo-950">
                    {report.kpis.breakEvenSales.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                  </span>
                </div>
                <div className="text-left text-xs font-bold text-indigo-700">
                  {report.netSales >= report.kpis.breakEvenSales ? (
                    <span className="text-emerald-700 font-black flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      تجاوزت التعادل بأمان
                    </span>
                  ) : (
                    <span className="text-amber-700 font-black flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      تحت نقطة التعادل
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>التشخيص المالي لكفاءة التشغيل (Diagnostic)</span>
              </h4>
              <ul className="text-xs space-y-2 text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    نسبة تكلفة الخامات المباشرة: <strong>{report.kpis.materialCostRatio}%</strong>{' '}
                    {report.kpis.materialCostRatio <= 50 ? '(ضمن المعدل الصناعي الممتاز)' : '(مرتفعة نسبياً - يُنصح بمراجعة هالك القص)'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    نسبة أجور العمالة الإنتاجية: <strong>{report.kpis.laborCostRatio}%</strong> (متناسبة مع حجم طلبيات التشغيل)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    هامش الربح النهائي: <strong>{report.kpis.netProfitMargin}%</strong>{' '}
                    {report.netIncome >= 0 ? '(أرباح تشغيلية إيجابية)' : '(صافي خسارة للفترة المحددة)'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
