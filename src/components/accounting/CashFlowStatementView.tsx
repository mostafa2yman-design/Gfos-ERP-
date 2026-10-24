import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ArrowLeft, 
  Printer, 
  Download, 
  Info, 
  CheckCircle, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  BookOpen, 
  FileText,
  HelpCircle,
  RefreshCw,
  Calendar,
  Layers,
  Building,
  ArrowUpRight,
  ExternalLink,
  Scale
} from 'lucide-react';
import { CashFlowStatementReport, CashFlowLineItem } from '../../types/cashFlow';
import { getCashFlowStatement } from '../../lib/journalEngine';
import { useTheme } from '../../contexts/ThemeContext';
import { getPrimaryBg, getPrimaryText, getRadiusClass } from '../../lib/theme';

interface CashFlowStatementViewProps {
  onNavigateToLedger?: (accountCode: string) => void;
  onNavigateToJournal?: () => void;
  onNavigateToTrialBalance?: () => void;
  onNavigateToIncomeStatement?: () => void;
  onNavigateToBalanceSheet?: () => void;
  onNavigateToChartOfAccounts?: () => void;
  onBack?: () => void;
}

export const CashFlowStatementView: React.FC<CashFlowStatementViewProps> = ({
  onNavigateToLedger,
  onNavigateToJournal,
  onNavigateToTrialBalance,
  onNavigateToIncomeStatement,
  onNavigateToBalanceSheet,
  onNavigateToChartOfAccounts,
  onBack
}) => {
  const { color, radius } = useTheme();
  const primaryBg = getPrimaryBg(color);
  const primaryText = getPrimaryText(color);
  const radiusClass = getRadiusClass(radius);

  const [report, setReport] = useState<CashFlowStatementReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'statement' | 'explanation' | 'recommendations'>('statement');
  const [selectedItemExplanation, setSelectedItemExplanation] = useState<CashFlowLineItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCashFlowStatement(dateFrom || undefined, dateTo || undefined);
      setReport(data);
    } catch (err) {
      console.error('Error loading Cash Flow statement:', err);
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
  }, [dateFrom, dateTo]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    const lines = [
      'البند المالي / البيان المحاسبي,الرمز المرجعي,المبلغ بالجنيه المصري (EGP),نوع التدفق,الشرح المحاسبي',
      '--- 1. التدفقات النقدية من الأنشطة التشغيلية ---',
      `"صافي الربح قبل الضريبة (من قائمة الدخل)","","${report.operatingActivities.netIncomeBeforeTax}","داخل","صافي نتيجة النشاط"`,
      ...report.operatingActivities.depreciationAndNonCashAdjustments.map(it => 
        `"${it.title}","${it.code || ''}","${it.amount}","${it.isPositive ? 'داخل' : 'خارج'}","${it.explanation}"`
      ),
      ...report.operatingActivities.workingCapitalAdjustments.map(it => 
        `"${it.title}","${it.code || ''}","${it.amount}","${it.isPositive ? 'داخل' : 'خارج'}","${it.explanation}"`
      ),
      `"صافي التدفق النقدي من الأنشطة التشغيلية","","${report.operatingActivities.netCashFromOperating}","",""`,
      '',
      '--- 2. التدفقات النقدية من الأنشطة الاستثمارية ---',
      ...report.investingActivities.items.map(it => 
        `"${it.title}","${it.code || ''}","${it.amount}","${it.isPositive ? 'داخل' : 'خارج'}","${it.explanation}"`
      ),
      `"صافي التدفق النقدي من الأنشطة الاستثمارية","","${report.investingActivities.netCashFromInvesting}","",""`,
      '',
      '--- 3. التدفقات النقدية من الأنشطة التمويلية ---',
      ...report.financingActivities.items.map(it => 
        `"${it.title}","${it.code || ''}","${it.amount}","${it.isPositive ? 'داخل' : 'خارج'}","${it.explanation}"`
      ),
      `"صافي التدفق النقدي من الأنشطة التمويلية","","${report.financingActivities.netCashFromFinancing}","",""`,
      '',
      `"صافي التغير في النقدية وما في حكمها","","${report.netCashChange}","",""`,
      `"رصيد النقدية في بداية الفترة","","${report.cashAtBeginning}","",""`,
      `"رصيد النقدية في نهاية الفترة","","${report.cashAtEnd}","",""`
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Cash_Flow_Statement_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:m-0 print:space-y-4 font-sans" dir="rtl">
      {/* Top Header & Action Controls */}
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
            <DollarSign className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                قائمة التدفقات النقدية (Cash Flow Statement)
              </h1>
              <span className="px-2.5 py-0.5 text-xs bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 rounded-lg font-bold">
                الطريقة غير المباشرة (IAS 7 / EAS 4)
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-md font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                مستمدة مباشرة من شجرة الحسابات ودفتر الأستاذ العام
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              حركة السيولة النقدية الفعلية ومصادر واستخدامات الأموال في الأنشطة التشغيلية والاستثمارية والتمويلية
            </p>
          </div>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-teal-500" />
            <span>من:</span>
            <input 
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-bold"
            />
            <span>إلى:</span>
            <input 
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-bold"
            />
          </div>

          <button
            onClick={loadData}
            title="تحديث البيانات"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-500' : ''}`} />
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
            <span>طباعة القائمة الرسمية</span>
          </button>
        </div>
      </div>

      {/* Accounting Workflow Interlink Bar */}
      <div className={`flex items-center justify-between overflow-x-auto gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-2xs print:hidden custom-scrollbar`}>
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Activity className="w-4 h-4 text-teal-500" />
          <span>الربط المحاسبي المتكامل:</span>
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
              onClick={() => onNavigateToLedger('1211')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>أستاذ الخزينة والبنوك</span>
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
          {onNavigateToBalanceSheet && (
            <button 
              onClick={onNavigateToBalanceSheet}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-500" />
              <span>قائمة المركز المالي (الميزانية)</span>
            </button>
          )}
        </div>
      </div>

      {/* Cash Reconciliation Status Banner */}
      {report && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
          report.isReconciled 
            ? 'bg-teal-50/80 dark:bg-teal-950/30 border-teal-200 dark:border-teal-500/30 text-teal-900 dark:text-teal-200'
            : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              report.isReconciled ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}>
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm">
                  {report.isReconciled 
                    ? 'مطابقة تامة ومؤكدة لرصيد النقدية وما في حكمها مع أرصدة دفتر الأستاذ العام (حسابات 121)'
                    : 'مطابقة تقريبية للنقدية مع وجود فارق تسوية بسيط'
                  }
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-mono font-bold">
                  رصيد نهاية الفترة: {formatCurrency(report.cashAtEnd)} ج.م
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                نقدية أول الفترة ({formatCurrency(report.cashAtBeginning)} ج.م) + صافي التغير ({report.netCashChange >= 0 ? '+' : ''}{formatCurrency(report.netCashChange)} ج.م) = نقدية آخر المدة بالخزينة والبنوك ({formatCurrency(report.cashAtEnd)} ج.م).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-auto bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">صافي التغير النقدي</span>
              <span className={`font-black ${report.netCashChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {report.netCashChange >= 0 ? '+' : ''}{formatCurrency(report.netCashChange)}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold">الرصيد الفعلي بالدفتر</span>
              <span className="font-black text-teal-600 dark:text-teal-400">{formatCurrency(report.actualCashInLedger)}</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 print:grid-cols-4">
          <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 ${radiusClass} shadow-2xs hover:shadow-xs transition-all`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <span>التدفق التشغيلي (OCF)</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className={`text-xl font-black font-mono tabular-nums ${report.operatingActivities.netCashFromOperating >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(report.operatingActivities.netCashFromOperating)} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ج.م</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              النقدية الناتجة من مبيعات وتصنيع الملابس
            </p>
          </div>

          <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 ${radiusClass} shadow-2xs hover:shadow-xs transition-all`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <span>التدفق النقدي الحر (FCF)</span>
              <DollarSign className="w-4 h-4 text-teal-500" />
            </div>
            <div className={`text-xl font-black font-mono tabular-nums ${report.kpis.freeCashFlow >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {formatCurrency(report.kpis.freeCashFlow)} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ج.م</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              التشغيلي بعد خصم النفقات الرأسمالية (CapEx)
            </p>
          </div>

          <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 ${radiusClass} shadow-2xs hover:shadow-xs transition-all`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <span>معدل جودة الأرباح</span>
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {report.kpis.operatingCashToNetIncomeRatio.toFixed(2)}x
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              نسبة التدفق التشغيلي إلى صافي الأرباح
            </p>
          </div>

          <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 ${radiusClass} shadow-2xs hover:shadow-xs transition-all`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <span>التقييم العام للموقف النقدي</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {report.analysisNotes.overallHealth}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              استقرار سيولة تغطية الأجور والالتزامات
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
          <FileText className="w-4 h-4" />
          <span>القائمة والبنود المحاسبية</span>
        </button>

        <button
          onClick={() => setActiveTab('explanation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'explanation'
              ? `${primaryBg} text-white shadow-xs font-black`
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>الشرح والتحليل المالي للأنشطة</span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'recommendations'
              ? `${primaryBg} text-white shadow-xs font-black`
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>توصيات إدارة السيولة والنقدية</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-10 h-10 text-teal-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">جاري احتساب التدفقات النقدية ومطابقة الحسابات...</p>
        </div>
      ) : report ? (
        <>
          {activeTab === 'statement' && (
            <div className="space-y-6">
              {/* SECTION 1: OPERATING ACTIVITIES (الأنشطة التشغيلية) */}
              <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${radiusClass} overflow-hidden shadow-2xs`}>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white">1. التدفقات النقدية من الأنشطة التشغيلية (Operating Activities)</h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">النقدية المتولدة مباشرة من تصنيع وبيع الملابس الجاهزة وحركة رأس المال العامل</p>
                    </div>
                  </div>
                  <span className={`font-mono text-sm font-black ${report.operatingActivities.netCashFromOperating >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {report.operatingActivities.netCashFromOperating >= 0 ? '+' : ''}{formatCurrency(report.operatingActivities.netCashFromOperating)} ج.م
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Step A: Net Income Base */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">صافي ربح النشاط الصناعي للفترة (من قائمة الدخل)</span>
                      {onNavigateToIncomeStatement && (
                        <button
                          onClick={onNavigateToIncomeStatement}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 font-bold cursor-pointer"
                        >
                          <span>عرض P&L</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(report.operatingActivities.netIncomeAfterTax)} ج.م
                    </span>
                  </div>

                  {/* Step B: Non-Cash Adjustments */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <span>يضاف / يخصم: تسويات البنود غير النقدية</span>
                    </h3>
                    <div className="space-y-1.5">
                      {report.operatingActivities.depreciationAndNonCashAdjustments.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-slate-800 dark:text-slate-200 font-bold">{item.title}</span>
                            <button
                              onClick={() => setSelectedItemExplanation(item)}
                              className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-0.5 cursor-pointer"
                              title="عرض الشرح والتحليل"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(item.amount)} ج.م
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step C: Working Capital Changes */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <span>التغير في عناصر رأس المال العامل التشغيلي:</span>
                    </h3>
                    <div className="space-y-1.5">
                      {report.operatingActivities.workingCapitalAdjustments.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.amount >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-slate-800 dark:text-slate-200 font-bold">{item.title}</span>
                            {item.code && (
                              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold">({item.code})</span>
                            )}
                            <button
                              onClick={() => setSelectedItemExplanation(item)}
                              className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-0.5 cursor-pointer"
                              title="عرض الشرح والتحليل"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-black ${item.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)} ج.م
                            </span>
                            {item.relatedAccountCodes && item.relatedAccountCodes.length > 0 && onNavigateToLedger && (
                              <button
                                onClick={() => onNavigateToLedger(item.relatedAccountCodes![0])}
                                title="عرض دفتر الأستاذ العام"
                                className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-0.5 cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operating Total Footing */}
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/40 rounded-xl flex items-center justify-between text-xs font-black">
                    <span className="text-emerald-950 dark:text-emerald-200">صافي النقدية المتولدة من الأنشطة التشغيلية</span>
                    <span className={`font-mono text-sm ${report.operatingActivities.netCashFromOperating >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {report.operatingActivities.netCashFromOperating >= 0 ? '+' : ''}{formatCurrency(report.operatingActivities.netCashFromOperating)} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: INVESTING ACTIVITIES (الأنشطة الاستثمارية) */}
              <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${radiusClass} overflow-hidden shadow-2xs`}>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white">2. التدفقات النقدية من الأنشطة الاستثمارية (Investing Activities)</h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">النفقات الرأسمالية (CapEx) لشراء وتحديث ماكينات الخياطة ومقصات الفرد وتجهيزات المصنع</p>
                    </div>
                  </div>
                  <span className={`font-mono text-sm font-black ${report.investingActivities.netCashFromInvesting >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {report.investingActivities.netCashFromInvesting >= 0 ? '+' : ''}{formatCurrency(report.investingActivities.netCashFromInvesting)} ج.م
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <div className="space-y-1.5">
                    {report.investingActivities.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-slate-800 dark:text-slate-200 font-bold">{item.title}</span>
                          {item.code && (
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold">({item.code})</span>
                          )}
                          <button
                            onClick={() => setSelectedItemExplanation(item)}
                            className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-0.5 cursor-pointer"
                            title="عرض الشرح والتحليل"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                            {formatCurrency(item.amount)} ج.م
                          </span>
                          {item.relatedAccountCodes && item.relatedAccountCodes.length > 0 && onNavigateToLedger && (
                            <button
                              onClick={() => onNavigateToLedger(item.relatedAccountCodes![0])}
                              title="عرض دفتر الأستاذ العام"
                              className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-0.5 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/40 rounded-xl flex items-center justify-between text-xs font-black">
                    <span className="text-blue-950 dark:text-blue-200">صافي النقدية المستخدمة في الأنشطة الاستثمارية</span>
                    <span className="font-mono text-sm text-amber-600 dark:text-amber-400">
                      {formatCurrency(report.investingActivities.netCashFromInvesting)} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: FINANCING ACTIVITIES (الأنشطة التمويلية) */}
              <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${radiusClass} overflow-hidden shadow-2xs`}>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white">3. التدفقات النقدية من الأنشطة التمويلية (Financing Activities)</h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">سداد القروض والتسهيلات البنكية، مساهمات الشركاء، والتمويل الرأسمالي</p>
                    </div>
                  </div>
                  <span className={`font-mono text-sm font-black ${report.financingActivities.netCashFromFinancing >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {report.financingActivities.netCashFromFinancing >= 0 ? '+' : ''}{formatCurrency(report.financingActivities.netCashFromFinancing)} ج.م
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <div className="space-y-1.5">
                    {report.financingActivities.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.amount >= 0 ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                          <span className="text-slate-800 dark:text-slate-200 font-bold">{item.title}</span>
                          {item.code && (
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold">({item.code})</span>
                          )}
                          <button
                            onClick={() => setSelectedItemExplanation(item)}
                            className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-0.5 cursor-pointer"
                            title="عرض الشرح والتحليل"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-black ${item.amount >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)} ج.م
                          </span>
                          {item.relatedAccountCodes && item.relatedAccountCodes.length > 0 && onNavigateToLedger && (
                            <button
                              onClick={() => onNavigateToLedger(item.relatedAccountCodes![0])}
                              title="عرض دفتر الأستاذ العام"
                              className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-0.5 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/40 rounded-xl flex items-center justify-between text-xs font-black">
                    <span className="text-indigo-950 dark:text-indigo-200">صافي النقدية من الأنشطة التمويلية</span>
                    <span className={`font-mono text-sm ${report.financingActivities.netCashFromFinancing >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {report.financingActivities.netCashFromFinancing >= 0 ? '+' : ''}{formatCurrency(report.financingActivities.netCashFromFinancing)} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: NET CASH RECONCILIATION SUMMARY */}
              <div className={`bg-white dark:bg-slate-900 border-2 border-teal-500/40 dark:border-teal-500/30 ${radiusClass} p-5 shadow-xs space-y-4`}>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500" />
                  <span>خلاصة حركة النقدية والمطابقة مع أرصدة الخزينة والبنوك</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">صافي التغير في النقدية خلال الفترة</span>
                    <span className={`text-base font-black font-mono ${report.netCashChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {report.netCashChange >= 0 ? '+' : ''}{formatCurrency(report.netCashChange)} ج.م
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">تشغيلي + استثماري + تمويلي</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">رصيد النقدية في بداية الفترة</span>
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                      {formatCurrency(report.cashAtBeginning)} ج.م
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">الرصيد الافتتاحي بالخزينة والبنوك</p>
                  </div>

                  <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-500/40 shadow-2xs">
                    <span className="text-xs text-teal-800 dark:text-teal-300 font-bold block mb-1">رصيد النقدية في نهاية الفترة (الختامي)</span>
                    <span className="text-base font-black font-mono text-teal-600 dark:text-teal-400">
                      {formatCurrency(report.cashAtEnd)} ج.م
                    </span>
                    <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80 mt-1 font-semibold">مطابق تماماً لدفتر الأستاذ والمركز المالي</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Explanation Tab */}
          {activeTab === 'explanation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 ${radiusClass} shadow-2xs space-y-3`}>
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-sm">
                    <Activity className="w-5 h-5" />
                    <span>تحليل التدفق النقدي التشغيلي وجودة الأرباح</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {report.analysisNotes.operatingCashAnalysis}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {report.analysisNotes.workingCapitalImpactAnalysis}
                  </p>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">هامش التدفق التشغيلي:</span>
                    <span className="font-mono font-black text-teal-600 dark:text-teal-400">{report.kpis.operatingCashFlowMargin.toFixed(1)}%</span>
                  </div>
                </div>

                <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 ${radiusClass} shadow-2xs space-y-3`}>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-sm">
                    <DollarSign className="w-5 h-5" />
                    <span>تحليل التدفق الاستثماري والتمويلي</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {report.analysisNotes.investingCashAnalysis}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {report.analysisNotes.financingCashAnalysis}
                  </p>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">التدفق النقدي الحر (FCF):</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(report.kpis.freeCashFlow)} ج.م</span>
                  </div>
                </div>

                {/* Educational Insight Card */}
                <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 ${radiusClass} shadow-2xs space-y-3 md:col-span-2`}>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm">
                    <BookOpen className="w-5 h-5" />
                    <span>لماذا يختلف صافي الربح المحاسبي عن التدفق النقدي في مصانع الملابس؟</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="font-black text-slate-900 dark:text-white block mb-1">1. مبيعات بالآجل vs التحصيل النقدي</span>
                      <span>يتم تسجيل إيراد البيع بمجرد إصدار الفاتورة للعميل (أساس الاستحقاق)، بينما التدفق النقدي لا يسجلها إلا عند التحصيل الفعلي في الخزينة أو البنك.</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="font-black text-slate-900 dark:text-white block mb-1">2. أقمشة ومستلزمات محتجزة في المخازن</span>
                      <span>شراء أقمشة أو صرف خامات للقص يمتص نقدية سائلة فوراً، لكنها لا تظهر كمصروف في قائمة الدخل إلا بعد تصنيعها وبيعها (COGS).</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="font-black text-slate-900 dark:text-white block mb-1">3. إهلاك الآلات وماكينات الخياطة</span>
                      <span>الإهلاك ينقص صافي الربح الدفتري في قائمة الدخل، لكنه مصروف محاسبي غير نقدي ولا يتضمن دفع أي أموال، لذا يعاد إضافته في قائمة التدفقات.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 ${radiusClass} shadow-2xs space-y-4`}>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm">
                <HelpCircle className="w-5 h-5 text-teal-500" />
                <span>إرشادات وتوصيات إدارة السيولة النقدية لمصنع الملابس</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                توجيهات الإدارة المالية لضمان وفرة السيولة اليومية وتفادي أي عجز في أجور خطوط الخياطة أو مستحقات الموردين:
              </p>
              <div className="space-y-2.5">
                {report.analysisNotes.financialRecommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium">
                    <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 font-mono text-xs font-black">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal / Flyout for Line Item Explanation */}
          {selectedItemExplanation && (
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedItemExplanation(null)}
            >
              <div 
                className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 ${radiusClass} max-w-md w-full shadow-2xl space-y-3`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-black text-sm">
                    <Info className="w-4 h-4" />
                    <span>إيضاح بند التدفق النقدي</span>
                  </div>
                  <button 
                    onClick={() => setSelectedItemExplanation(null)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer font-bold"
                  >
                    إغلاق
                  </button>
                </div>
                <div className="font-black text-sm text-slate-900 dark:text-white">
                  {selectedItemExplanation.title}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedItemExplanation.explanation}
                </p>
                {selectedItemExplanation.notes && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono">
                    الحسابات المرتبطة: {selectedItemExplanation.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Official Printing Footing */}
          <div className="hidden print:block mt-8 pt-6 border-t-2 border-slate-300 text-black">
            <div className="grid grid-cols-4 gap-4 text-center text-xs">
              <div className="border border-slate-300 p-3 rounded">
                <span className="block font-bold mb-6">رئيس حسابات الخزينة</span>
                <span className="text-[10px] text-slate-500">التوقيع: .....................</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="block font-bold mb-6">المدير المالي (CFO)</span>
                <span className="text-[10px] text-slate-500">التوقيع: .....................</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="block font-bold mb-6">مراجع الحسابات</span>
                <span className="text-[10px] text-slate-500">التوقيع: .....................</span>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="block font-bold mb-6">العضو المنتدب</span>
                <span className="text-[10px] text-slate-500">التوقيع: .....................</span>
              </div>
            </div>
            <div className="text-center text-[10px] text-slate-500 mt-4">
              تم استخراج تقرير التدفقات النقدية آلياً من نظام «GFOS ERP» بتاريخ {new Date().toLocaleDateString('ar-EG')}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
