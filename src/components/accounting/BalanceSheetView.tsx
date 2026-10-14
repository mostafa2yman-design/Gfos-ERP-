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
  Eye,
  RefreshCw,
  Calendar,
  Building,
  Activity,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { BalanceSheetReport, BalanceSheetSubGroup } from '../../types/balanceSheet';
import { getBalanceSheet } from '../../lib/journalEngine';

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
    <div className="space-y-6 pb-12 print:p-0 print:m-0 print:space-y-4" dir="rtl">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">قائمة المركز المالي والميزانية العمومية</h1>
              <span className="px-2 py-0.5 text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md font-mono">
                Balance Sheet (EAS / IFRS)
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                مستمدة مباشرة من شجرة الحسابات ودفتر الأستاذ العام
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              البيان الختامي الشامل للأصول والخصوم وحقوق الملكية والسيولة النقدية لمصنع الملابس الجاهزة
            </p>
          </div>
        </div>

        {/* Date Filter & Control Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>حتى تاريخ:</span>
            <input 
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          <button
            onClick={loadData}
            title="تحديث البيانات"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الميزانية الرسمية</span>
          </button>
        </div>
      </div>

      {/* Cross-Module Accounting Workflow Navigation Bar */}
      <div className="flex items-center justify-between overflow-x-auto gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 text-xs font-medium print:hidden">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span>الدورة المحاسبية المترابطة:</span>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToChartOfAccounts && (
            <button 
              onClick={onNavigateToChartOfAccounts}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>شجرة الحسابات</span>
            </button>
          )}
          {onNavigateToJournal && (
            <button 
              onClick={onNavigateToJournal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>دفتر القيود</span>
            </button>
          )}
          {onNavigateToLedger && (
            <button 
              onClick={() => onNavigateToLedger('12411')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>دفتر الأستاذ</span>
            </button>
          )}
          {onNavigateToTrialBalance && (
            <button 
              onClick={onNavigateToTrialBalance}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>ميزان المراجعة</span>
            </button>
          )}
          {onNavigateToIncomeStatement && (
            <button 
              onClick={onNavigateToIncomeStatement}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>قائمة الدخل (P&L)</span>
            </button>
          )}
          {onNavigateToCashFlow && (
            <button 
              onClick={onNavigateToCashFlow}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5 text-teal-400" />
              <span>قائمة التدفقات النقدية</span>
            </button>
          )}
        </div>
      </div>

      {/* Official Balance Status Alert Banner */}
      {report && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          report.isBalanced 
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              report.isBalanced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {report.isBalanced ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {report.isBalanced 
                    ? 'الميزانية العمومية متوازنة محاسبياً بدقة تامة (Assets = Liabilities + Equity)'
                    : 'يوجد عدم توازن بالميزانية يحتاج إلى مراجعة القيود المحاسبية'
                  }
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 font-mono">
                  الفارق: {report.difference.toFixed(2)} ج.م
                </span>
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                إجمالي الأصول ({formatCurrency(report.totalAssets)} ج.م) يتطابق تماماً مع مجموع الالتزامات وحقوق الملكية ({formatCurrency(report.totalLiabilitiesAndEquity)} ج.م).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-auto bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">إجمالي الأصول</span>
              <span className="font-bold text-emerald-400">{formatCurrency(report.totalAssets)}</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">الخصوم + الملكية</span>
              <span className="font-bold text-blue-400">{formatCurrency(report.totalLiabilitiesAndEquity)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Executive Financial Health KPI Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>رأس المال العامل الصافي</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {formatCurrency(report.kpis.workingCapital)} <span className="text-xs font-sans text-slate-400">ج.م</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 inline" /> أصول متداولة تفوق الخصوم
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>نسبة التداول (السيولة)</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {report.kpis.currentRatio.toFixed(2)}x
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              المعيار الصناعي الآمن: &gt; 1.5x
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>نسبة السيولة السريعة</span>
              <DollarSign className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {report.kpis.quickRatio.toFixed(2)}x
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              (نقدية + عملاء) / الالتزامات المتداولة
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>نسبة التمويل الذاتي (الملكية)</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {(report.kpis.equityRatio * 100).toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              حصة حقوق الملكية من إجمالي الأصول
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab('statement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'statement'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>جدول المركز المالي المحاسبي</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analysis'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>التحليل المالي وشرح بنود الميزانية</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'notes'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>دليل مراقبي الحسابات والتوصيات</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">جاري تجميع حركات دفتر الأستاذ العام وتوليد المركز المالي...</p>
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
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-5 py-3.5 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <h2 className="text-base font-bold text-white">جانب الأصول (Assets)</h2>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {formatCurrency(report.totalAssets)} ج.م
                    </span>
                  </div>

                  {/* 1. Non-Current Assets (الأصول غير المتداولة) */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-200">أولاً: الأصول غير المتداولة (الثابتة)</h3>
                        <p className="text-[11px] text-slate-400">المباني، الآلات وماكينات الخياطة، السيارات، وبرمجيات ERP</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-white">
                        {formatCurrency(report.nonCurrentAssets.total)} ج.م
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {report.nonCurrentAssets.subGroups.map((group) => (
                        <div key={group.id} className="p-3.5 hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleGroup(group.id)}>
                              <button className="text-slate-400 hover:text-white p-0.5">
                                {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="font-mono text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                {group.codePrefix}
                              </span>
                              <span className="text-xs font-bold text-slate-200">{group.arabicTitle}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedExplanation(group.explanation); }}
                                title="عرض الشرح والتحليل"
                                className="text-slate-500 hover:text-indigo-400 p-0.5"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                                {group.percentageOfSection}%
                              </span>
                              <span className={`font-mono text-xs font-bold ${
                                group.codePrefix.startsWith('113') || group.codePrefix.startsWith('1142') ? 'text-amber-400' : 'text-slate-100'
                              }`}>
                                {group.codePrefix.startsWith('113') || group.codePrefix.startsWith('1142') ? `(${formatCurrency(group.total)})` : formatCurrency(group.total)} ج.م
                              </span>
                            </div>
                          </div>

                          {/* Expanded sub-accounts */}
                          {expandedGroups[group.id] && group.accounts.length > 0 && (
                            <div className="mt-2.5 mr-6 pl-2 space-y-1.5 border-r border-slate-800">
                              {group.accounts.map((acc) => (
                                <div key={acc.accountCode} className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-slate-800/40">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-400">{acc.accountCode}</span>
                                    <span className="text-slate-300">{acc.accountName}</span>
                                    {acc.note && (
                                      <span className="text-[10px] text-slate-500">({acc.note})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-300">{formatCurrency(acc.amount)}</span>
                                    {onNavigateToLedger && (
                                      <button
                                        onClick={() => onNavigateToLedger(acc.accountCode)}
                                        title="عرض دفتر الأستاذ"
                                        className="text-slate-500 hover:text-indigo-400 transition-colors"
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
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-200">ثانياً: الأصول المتداولة (Current Assets)</h3>
                        <p className="text-[11px] text-slate-400">النقدية، العملاء، الخامات، الإنتاج تحت التشغيل، والملابس الجاهزة</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-white">
                        {formatCurrency(report.currentAssets.total)} ج.م
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {report.currentAssets.subGroups.map((group) => (
                        <div key={group.id} className="p-3.5 hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleGroup(group.id)}>
                              <button className="text-slate-400 hover:text-white p-0.5">
                                {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="font-mono text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                {group.codePrefix}
                              </span>
                              <span className="text-xs font-bold text-slate-200">{group.arabicTitle}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedExplanation(group.explanation); }}
                                title="عرض الشرح والتحليل"
                                className="text-slate-500 hover:text-indigo-400 p-0.5"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                                {group.percentageOfSection}%
                              </span>
                              <span className="font-mono text-xs font-bold text-emerald-300">
                                {formatCurrency(group.total)} ج.م
                              </span>
                            </div>
                          </div>

                          {/* Expanded sub-accounts */}
                          {expandedGroups[group.id] && group.accounts.length > 0 && (
                            <div className="mt-2.5 mr-6 pl-2 space-y-1.5 border-r border-slate-800">
                              {group.accounts.map((acc) => (
                                <div key={acc.accountCode} className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-slate-800/40">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-400">{acc.accountCode}</span>
                                    <span className="text-slate-300">{acc.accountName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-300">{formatCurrency(acc.amount)}</span>
                                    {onNavigateToLedger && (
                                      <button
                                        onClick={() => onNavigateToLedger(acc.accountCode)}
                                        title="عرض دفتر الأستاذ"
                                        className="text-slate-500 hover:text-indigo-400 transition-colors"
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
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-300 font-bold block">إجمالي أصول المصنع الكلية (Total Assets)</span>
                      <span className="text-[11px] text-slate-400">الأصول غير المتداولة + الأصول المتداولة</span>
                    </div>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {formatCurrency(report.totalAssets)} ج.م
                    </span>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* LEFT COLUMN: LIABILITIES & EQUITY (الخصوم وحقوق الملكية) */}
                {/* ============================================================== */}
                <div className="space-y-6">
                  {/* Section Title */}
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-5 py-3.5 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <h2 className="text-base font-bold text-white">الخصوم وحقوق الملكية (Liabilities & Equity)</h2>
                    </div>
                    <span className="text-sm font-mono font-bold text-blue-400">
                      {formatCurrency(report.totalLiabilitiesAndEquity)} ج.م
                    </span>
                  </div>

                  {/* 3. Current Liabilities (الالتزامات المتداولة) */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-200">ثالثاً: الالتزامات المتداولة (قصيرة الأجل)</h3>
                        <p className="text-[11px] text-slate-400">الموردون التجاريون، أوراق الدفع، أجور العمال المعلقة، والضرائب</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-white">
                        {formatCurrency(report.currentLiabilities.total)} ج.م
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {report.currentLiabilities.subGroups.map((group) => (
                        <div key={group.id} className="p-3.5 hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleGroup(group.id)}>
                              <button className="text-slate-400 hover:text-white p-0.5">
                                {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="font-mono text-xs text-rose-400 font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded">
                                {group.codePrefix}
                              </span>
                              <span className="text-xs font-bold text-slate-200">{group.arabicTitle}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedExplanation(group.explanation); }}
                                title="عرض الشرح والتحليل"
                                className="text-slate-500 hover:text-indigo-400 p-0.5"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                                {group.percentageOfSection}%
                              </span>
                              <span className="font-mono text-xs font-bold text-rose-300">
                                {formatCurrency(group.total)} ج.م
                              </span>
                            </div>
                          </div>

                          {/* Expanded sub-accounts */}
                          {expandedGroups[group.id] && group.accounts.length > 0 && (
                            <div className="mt-2.5 mr-6 pl-2 space-y-1.5 border-r border-slate-800">
                              {group.accounts.map((acc) => (
                                <div key={acc.accountCode} className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-slate-800/40">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-400">{acc.accountCode}</span>
                                    <span className="text-slate-300">{acc.accountName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-300">{formatCurrency(acc.amount)}</span>
                                    {onNavigateToLedger && (
                                      <button
                                        onClick={() => onNavigateToLedger(acc.accountCode)}
                                        title="عرض دفتر الأستاذ"
                                        className="text-slate-500 hover:text-indigo-400 transition-colors"
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
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-200">رابعاً: الالتزامات غير المتداولة (طويلة الأجل)</h3>
                        <p className="text-[11px] text-slate-400">قروض بنكية وتسهيلات تمويل خطوط الإنتاج والآلات</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-white">
                        {formatCurrency(report.nonCurrentLiabilities.total)} ج.م
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {report.nonCurrentLiabilities.subGroups.map((group) => (
                        <div key={group.id} className="p-3.5 hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleGroup(group.id)}>
                              <button className="text-slate-400 hover:text-white p-0.5">
                                {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="font-mono text-xs text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
                                {group.codePrefix}
                              </span>
                              <span className="text-xs font-bold text-slate-200">{group.arabicTitle}</span>
                            </div>
                            <span className="font-mono text-xs font-bold text-amber-300">
                              {formatCurrency(group.total)} ج.م
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Equity (حقوق الملكية) */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-200">خامساً: حقوق الملكية (Shareholders Equity)</h3>
                        <p className="text-[11px] text-slate-400">رأس المال، الاحتياطيات، وصافي أرباح الفترة من قائمة الدخل</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-white">
                        {formatCurrency(report.equity.total)} ج.م
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {report.equity.subGroups.map((group) => (
                        <div key={group.id} className={`p-3.5 transition-colors ${
                          group.id === 'current_net_income' ? 'bg-indigo-950/20 border-r-2 border-indigo-500' : 'hover:bg-slate-800/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleGroup(group.id)}>
                              <button className="text-slate-400 hover:text-white p-0.5">
                                {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <span className="font-mono text-xs text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded">
                                {group.codePrefix}
                              </span>
                              <span className="text-xs font-bold text-slate-200">{group.arabicTitle}</span>
                              {group.id === 'current_net_income' && (
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                                  من قائمة الدخل P&L
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-300">
                                {formatCurrency(group.total)} ج.م
                              </span>
                              {group.id === 'current_net_income' && onNavigateToIncomeStatement && (
                                <button
                                  onClick={onNavigateToIncomeStatement}
                                  title="فتح قائمة الدخل لمراجعة الأرباح"
                                  className="text-indigo-400 hover:text-indigo-300 p-1 rounded hover:bg-slate-800"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded sub-accounts */}
                          {expandedGroups[group.id] && group.accounts.length > 0 && (
                            <div className="mt-2.5 mr-6 pl-2 space-y-1.5 border-r border-slate-800">
                              {group.accounts.map((acc) => (
                                <div key={acc.accountCode} className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-slate-800/40">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-400">{acc.accountCode}</span>
                                    <span className="text-slate-300">{acc.accountName}</span>
                                    {acc.note && (
                                      <span className="text-[10px] text-slate-500">({acc.note})</span>
                                    )}
                                  </div>
                                  <span className="font-mono text-slate-300">{formatCurrency(acc.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Liabilities & Equity Total Footing */}
                  <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-300 font-bold block">إجمالي الخصوم وحقوق الملكية (Total Liabilities & Equity)</span>
                      <span className="text-[11px] text-slate-400">الالتزامات المتداولة + طويلة الأجل + حقوق المساهمين</span>
                    </div>
                    <span className="text-base font-bold font-mono text-blue-400">
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
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <TrendingUp className="w-5 h-5" />
                    <span>تحليل السيولة والقدرة على الوفاء بالتعهدات</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.analysisNotes.liquidityAnalysis}
                  </p>
                  <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-800/50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">التداول</span>
                      <span className="font-mono font-bold text-white">{report.kpis.currentRatio.toFixed(2)}x</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">السيولة السريعة</span>
                      <span className="font-mono font-bold text-white">{report.kpis.quickRatio.toFixed(2)}x</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">السيولة النقدية</span>
                      <span className="font-mono font-bold text-white">{report.kpis.cashRatio.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    <span>تحليل الملاءة المالية وهيكل التمويل</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.analysisNotes.solvencyAnalysis}
                  </p>
                  <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-800/50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">المديونية / الملكية</span>
                      <span className="font-mono font-bold text-white">{report.kpis.debtToEquityRatio.toFixed(2)}x</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">الديون / الأصول</span>
                      <span className="font-mono font-bold text-white">{(report.kpis.debtToAssetsRatio * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">التمويل الذاتي</span>
                      <span className="font-mono font-bold text-white">{(report.kpis.equityRatio * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 md:col-span-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Building className="w-5 h-5" />
                    <span>تحليل تركيبة المخزون الصناعي ورأس المال العامل لمصنع الملابس</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.analysisNotes.inventoryStructureAnalysis}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.analysisNotes.workingCapitalAnalysis}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs">
                      <div className="text-slate-400 mb-1">مخزون الأقمشة والخامات (1241)</div>
                      <div className="font-mono font-bold text-white text-sm">
                        {formatCurrency(report.currentAssets.rawMaterialsInventory)} ج.م
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {report.currentAssets.totalInventory > 0 ? ((report.currentAssets.rawMaterialsInventory / report.currentAssets.totalInventory) * 100).toFixed(1) : 0}% من إجمالي المخزون
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs">
                      <div className="text-slate-400 mb-1">مخزون قيد التشغيل WIP (1242)</div>
                      <div className="font-mono font-bold text-white text-sm">
                        {formatCurrency(report.currentAssets.wipInventory)} ج.م
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {report.currentAssets.totalInventory > 0 ? ((report.currentAssets.wipInventory / report.currentAssets.totalInventory) * 100).toFixed(1) : 0}% أوامر تشغيل جارية
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs">
                      <div className="text-slate-400 mb-1">مخزون الملابس الجاهزة (1243)</div>
                      <div className="font-mono font-bold text-white text-sm">
                        {formatCurrency(report.currentAssets.finishedGoodsInventory)} ج.م
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
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
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <span>إرشادات وتوصيات المراجع المالي ومراقبي الحسابات</span>
              </div>
              <p className="text-xs text-slate-400">
                ملاحظات التدقيق الداخلي الخاصة بسلامة المركز المالي والرقابة المحاسبية على خطوط الإنتاج:
              </p>
              <div className="space-y-2.5">
                {report.analysisNotes.auditorRecommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
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
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedExplanation(null)}
            >
              <div 
                className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Info className="w-4 h-4" />
                    <span>إيضاح مالي ومحاسبي</span>
                  </div>
                  <button 
                    onClick={() => setSelectedExplanation(null)}
                    className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                  >
                    إغلاق
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
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
              تم استخراج هذه القائمة المالية آلياً من نظام «نسيج ERP» لإدارة مصانع الملابس الجاهزة بتاريخ {new Date().toLocaleDateString('ar-EG')}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
