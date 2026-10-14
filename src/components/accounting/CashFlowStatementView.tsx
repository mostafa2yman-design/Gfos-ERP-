import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ArrowLeft, 
  Printer, 
  Download, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  AlertTriangle, 
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
  ArrowDownRight
} from 'lucide-react';
import { CashFlowStatementReport, CashFlowLineItem } from '../../types/cashFlow';
import { getCashFlowStatement } from '../../lib/journalEngine';

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
    <div className="space-y-6 pb-12 print:p-0 print:m-0 print:space-y-4" dir="rtl">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">قائمة التدفقات النقدية (Cash Flow Statement)</h1>
              <span className="px-2 py-0.5 text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-md font-mono">
                الطريقة غير المباشرة (IAS 7 / EAS 4)
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                مستمدة مباشرة من شجرة الحسابات ودفتر الأستاذ العام
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              حركة السيولة النقدية الفعلية ومصادر واستخدامات الأموال في الأنشطة التشغيلية والاستثمارية والتمويلية
            </p>
          </div>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>من:</span>
            <input 
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-0.5 focus:outline-none focus:border-teal-500 text-xs"
            />
            <span>إلى:</span>
            <input 
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-0.5 focus:outline-none focus:border-teal-500 text-xs"
            />
          </div>

          <button
            onClick={loadData}
            title="تحديث البيانات"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
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
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/25 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة القائمة الرسمية</span>
          </button>
        </div>
      </div>

      {/* Accounting Workflow Interlink Bar */}
      <div className="flex items-center justify-between overflow-x-auto gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 text-xs font-medium print:hidden">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Activity className="w-4 h-4 text-teal-400" />
          <span>الربط المحاسبي المتكامل:</span>
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
              onClick={() => onNavigateToLedger('1211')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>أستاذ الخزينة والبنوك</span>
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
          {onNavigateToBalanceSheet && (
            <button 
              onClick={onNavigateToBalanceSheet}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span>قائمة المركز المالي (الميزانية)</span>
            </button>
          )}
        </div>
      </div>

      {/* Cash Reconciliation Status Banner */}
      {report && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          report.isReconciled 
            ? 'bg-teal-950/30 border-teal-500/30 text-teal-300'
            : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              report.isReconciled ? 'bg-teal-500/20 text-teal-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {report.isReconciled 
                    ? 'مطابقة تامة ومؤكدة لرصيد النقدية وما في حكمها مع أرصدة دفتر الأستاذ العام (حسابات 121)'
                    : 'مطابقة تقريبية للنقدية مع وجود فارق تسوية بسيط'
                  }
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 font-mono">
                  رصيد نهاية الفترة: {formatCurrency(report.cashAtEnd)} ج.م
                </span>
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                نقدية أول الفترة ({formatCurrency(report.cashAtBeginning)} ج.م) + صافي التغير ({report.netCashChange >= 0 ? '+' : ''}{formatCurrency(report.netCashChange)} ج.م) = نقدية آخر المدة بالخزينة والبنوك ({formatCurrency(report.cashAtEnd)} ج.م).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-auto bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">صافي التغير النقدي</span>
              <span className={`font-bold ${report.netCashChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {report.netCashChange >= 0 ? '+' : ''}{formatCurrency(report.netCashChange)}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px]">الرصيد الفعلي بالدفتر</span>
              <span className="font-bold text-teal-400">{formatCurrency(report.actualCashInLedger)}</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>التدفق التشغيلي (OCF)</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className={`text-lg font-bold font-mono ${report.operatingActivities.netCashFromOperating >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(report.operatingActivities.netCashFromOperating)} <span className="text-xs font-sans text-slate-400">ج.م</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              النقدية الناتجة من مبيعات وتصنيع الملابس
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>التدفق النقدي الحر (FCF)</span>
              <DollarSign className="w-4 h-4 text-teal-400" />
            </div>
            <div className={`text-lg font-bold font-mono ${report.kpis.freeCashFlow >= 0 ? 'text-teal-400' : 'text-amber-400'}`}>
              {formatCurrency(report.kpis.freeCashFlow)} <span className="text-xs font-sans text-slate-400">ج.م</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              التشغيلي بعد خصم النفقات الرأسمالية (CapEx)
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>معدل جودة الأرباح</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {report.kpis.operatingCashToNetIncomeRatio.toFixed(2)}x
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              نسبة التدفق التشغيلي إلى صافي الأرباح
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>التقييم العام للموقف النقدي</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-base font-bold text-emerald-400">
              {report.analysisNotes.overallHealth}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              استقرار سيولة تغطية الأجور والالتزامات
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
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>القائمة والبنود المحاسبية</span>
        </button>

        <button
          onClick={() => setActiveTab('explanation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'explanation'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>الشرح والتحليل المالي للأنشطة</span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'recommendations'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
          <p className="text-slate-400 text-sm">جاري احتساب التدفقات النقدية ومطابقة الحسابات...</p>
        </div>
      ) : report ? (
        <>
          {activeTab === 'statement' && (
            <div className="space-y-6">
              {/* SECTION 1: OPERATING ACTIVITIES (الأنشطة التشغيلية) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div>
                      <h2 className="text-sm font-bold text-white">1. التدفقات النقدية من الأنشطة التشغيلية (Operating Activities)</h2>
                      <p className="text-[11px] text-slate-400">النقدية المتولدة مباشرة من تصنيع وبيع الملابس الجاهزة وحركة رأس المال العامل</p>
                    </div>
                  </div>
                  <span className={`font-mono text-sm font-bold ${report.operatingActivities.netCashFromOperating >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {report.operatingActivities.netCashFromOperating >= 0 ? '+' : ''}{formatCurrency(report.operatingActivities.netCashFromOperating)} ج.م
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {/* Step A: Net Income Base */}
                  <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">صافي ربح النشاط الصناعي للفترة (من قائمة الدخل)</span>
                      {onNavigateToIncomeStatement && (
                        <button
                          onClick={onNavigateToIncomeStatement}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 px-2 py-0.5 rounded bg-indigo-500/10"
                        >
                          <span>عرض P&L</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-300">
                      {formatCurrency(report.operatingActivities.netIncomeAfterTax)} ج.م
                    </span>
                  </div>

                  {/* Step B: Non-Cash Adjustments */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                      <span>يضاف / يخصم: تسويات البنود غير النقدية</span>
                    </h3>
                    <div className="space-y-1.5">
                      {report.operatingActivities.depreciationAndNonCashAdjustments.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/20 hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-slate-300">{item.title}</span>
                            <button
                              onClick={() => setSelectedItemExplanation(item)}
                              className="text-slate-500 hover:text-teal-400 p-0.5"
                              title="عرض الشرح والتحليل"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="font-mono font-bold text-emerald-400">
                            +{formatCurrency(item.amount)} ج.م
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step C: Working Capital Changes */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                      <span>التغير في عناصر رأس المال العامل التشغيلي:</span>
                    </h3>
                    <div className="space-y-1.5">
                      {report.operatingActivities.workingCapitalAdjustments.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/20 hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.amount >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            <span className="text-slate-300">{item.title}</span>
                            {item.code && (
                              <span className="font-mono text-[10px] text-slate-500">({item.code})</span>
                            )}
                            <button
                              onClick={() => setSelectedItemExplanation(item)}
                              className="text-slate-500 hover:text-teal-400 p-0.5"
                              title="عرض الشرح والتحليل"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)} ج.م
                            </span>
                            {item.relatedAccountCodes && item.relatedAccountCodes.length > 0 && onNavigateToLedger && (
                              <button
                                onClick={() => onNavigateToLedger(item.relatedAccountCodes![0])}
                                title="عرض دفتر الأستاذ العام"
                                className="text-slate-500 hover:text-teal-400 p-0.5"
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
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-200">صافي النقدية المتولدة من الأنشطة التشغيلية</span>
                    <span className={`font-mono text-sm ${report.operatingActivities.netCashFromOperating >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {report.operatingActivities.netCashFromOperating >= 0 ? '+' : ''}{formatCurrency(report.operatingActivities.netCashFromOperating)} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: INVESTING ACTIVITIES (الأنشطة الاستثمارية) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <h2 className="text-sm font-bold text-white">2. التدفقات النقدية من الأنشطة الاستثمارية (Investing Activities)</h2>
                      <p className="text-[11px] text-slate-400">النفقات الرأسمالية (CapEx) لشراء وتحديث ماكينات الخياطة ومقصات الفرد وتجهيزات المصنع</p>
                    </div>
                  </div>
                  <span className={`font-mono text-sm font-bold ${report.investingActivities.netCashFromInvesting >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                    {report.investingActivities.netCashFromInvesting >= 0 ? '+' : ''}{formatCurrency(report.investingActivities.netCashFromInvesting)} ج.م
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    {report.investingActivities.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/20 hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-slate-300">{item.title}</span>
                          {item.code && (
                            <span className="font-mono text-[10px] text-slate-500">({item.code})</span>
                          )}
                          <button
                            onClick={() => setSelectedItemExplanation(item)}
                            className="text-slate-500 hover:text-teal-400 p-0.5"
                            title="عرض الشرح والتحليل"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">
                            {formatCurrency(item.amount)} ج.م
                          </span>
                          {item.relatedAccountCodes && item.relatedAccountCodes.length > 0 && onNavigateToLedger && (
                            <button
                              onClick={() => onNavigateToLedger(item.relatedAccountCodes![0])}
                              title="عرض دفتر الأستاذ العام"
                              className="text-slate-500 hover:text-teal-400 p-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-200">صافي النقدية المستخدمة في الأنشطة الاستثمارية</span>
                    <span className="font-mono text-sm text-amber-400">
                      {formatCurrency(report.investingActivities.netCashFromInvesting)} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: FINANCING ACTIVITIES (الأنشطة التمويلية) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <div>
                      <h2 className="text-sm font-bold text-white">3. التدفقات النقدية من الأنشطة التمويلية (Financing Activities)</h2>
                      <p className="text-[11px] text-slate-400">سداد القروض والتسهيلات البنكية، مساهمات الشركاء، والتمويل الرأسمالي</p>
                    </div>
                  </div>
                  <span className={`font-mono text-sm font-bold ${report.financingActivities.netCashFromFinancing >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                    {report.financingActivities.netCashFromFinancing >= 0 ? '+' : ''}{formatCurrency(report.financingActivities.netCashFromFinancing)} ج.م
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    {report.financingActivities.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/20 hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.amount >= 0 ? 'bg-indigo-400' : 'bg-rose-400'}`} />
                          <span className="text-slate-300">{item.title}</span>
                          {item.code && (
                            <span className="font-mono text-[10px] text-slate-500">({item.code})</span>
                          )}
                          <button
                            onClick={() => setSelectedItemExplanation(item)}
                            className="text-slate-500 hover:text-teal-400 p-0.5"
                            title="عرض الشرح والتحليل"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                            {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)} ج.م
                          </span>
                          {item.relatedAccountCodes && item.relatedAccountCodes.length > 0 && onNavigateToLedger && (
                            <button
                              onClick={() => onNavigateToLedger(item.relatedAccountCodes![0])}
                              title="عرض دفتر الأستاذ العام"
                              className="text-slate-500 hover:text-teal-400 p-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-200">صافي النقدية من الأنشطة التمويلية</span>
                    <span className={`font-mono text-sm ${report.financingActivities.netCashFromFinancing >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                      {report.financingActivities.netCashFromFinancing >= 0 ? '+' : ''}{formatCurrency(report.financingActivities.netCashFromFinancing)} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: NET CASH RECONCILIATION SUMMARY */}
              <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  <span>خلاصة حركة النقدية والمطابقة مع أرصدة الخزينة والبنوك</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
                    <span className="text-xs text-slate-400 block mb-1">صافي التغير في النقدية خلال الفترة</span>
                    <span className={`text-base font-bold font-mono ${report.netCashChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {report.netCashChange >= 0 ? '+' : ''}{formatCurrency(report.netCashChange)} ج.م
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">تشغيلي + استثماري + تمويلي</p>
                  </div>

                  <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
                    <span className="text-xs text-slate-400 block mb-1">رصيد النقدية في بداية الفترة</span>
                    <span className="text-base font-bold font-mono text-slate-200">
                      {formatCurrency(report.cashAtBeginning)} ج.م
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">الرصيد الافتتاحي بالخزينة والبنوك</p>
                  </div>

                  <div className="p-3.5 bg-teal-950/40 rounded-xl border border-teal-500/40">
                    <span className="text-xs text-teal-300 block mb-1">رصيد النقدية في نهاية الفترة (الختامي)</span>
                    <span className="text-base font-bold font-mono text-teal-400">
                      {formatCurrency(report.cashAtEnd)} ج.م
                    </span>
                    <p className="text-[10px] text-teal-400/80 mt-1">مطابق تماماً لدفتر الأستاذ والمركز المالي</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Explanation Tab */}
          {activeTab === 'explanation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                    <Activity className="w-5 h-5" />
                    <span>تحليل التدفق النقدي التشغيلي وجودة الأرباح</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.analysisNotes.operatingCashAnalysis}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {report.analysisNotes.workingCapitalImpactAnalysis}
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">هامش التدفق التشغيلي:</span>
                    <span className="font-mono font-bold text-teal-400">{report.kpis.operatingCashFlowMargin.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <DollarSign className="w-5 h-5" />
                    <span>تحليل التدفق الاستثماري والتمويلي</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.analysisNotes.investingCashAnalysis}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.analysisNotes.financingCashAnalysis}
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">التدفق النقدي الحر (FCF):</span>
                    <span className="font-mono font-bold text-emerald-400">{formatCurrency(report.kpis.freeCashFlow)} ج.م</span>
                  </div>
                </div>

                {/* Educational Insight Card */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 md:col-span-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <BookOpen className="w-5 h-5" />
                    <span>لماذا يختلف صافي الربح المحاسبي عن التدفق النقدي في مصانع الملابس؟</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 leading-relaxed">
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                      <span className="font-bold text-white block mb-1">1. مبيعات بالآجل vs التحصيل النقدي</span>
                      <span>يتم تسجيل إيراد البيع بمجرد إصدار الفاتورة للعميل (أساس الاستحقاق)، بينما التدفق النقدي لا يسجلها إلا عند التحصيل الفعلي في الخزينة أو البنك.</span>
                    </div>
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                      <span className="font-bold text-white block mb-1">2. أقمشة ومستلزمات محتجزة في المخازن</span>
                      <span>شراء أقمشة أو صرف خامات للقص يمتص نقدية سائلة فوراً، لكنها لا تظهر كمصروف في قائمة الدخل إلا بعد تصنيعها وبيعها (COGS).</span>
                    </div>
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                      <span className="font-bold text-white block mb-1">3. إهلاك الآلات وماكينات الخياطة</span>
                      <span>الإهلاك ينقص صافي الربح الدفتري في قائمة الدخل، لكنه مصروف محاسبي غير نقدي ولا يتضمن دفع أي أموال، لذا يعاد إضافته في قائمة التدفقات.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <HelpCircle className="w-5 h-5 text-teal-400" />
                <span>إرشادات وتوصيات إدارة السيولة النقدية لمصنع الملابس</span>
              </div>
              <p className="text-xs text-slate-400">
                توجيهات الإدارة المالية لضمان وفرة السيولة اليومية وتفادي أي عجز في أجور خطوط الخياطة أو مستحقات الموردين:
              </p>
              <div className="space-y-2.5">
                {report.analysisNotes.financialRecommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
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
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedItemExplanation(null)}
            >
              <div 
                className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                    <Info className="w-4 h-4" />
                    <span>إيضاح بند التدفق النقدي</span>
                  </div>
                  <button 
                    onClick={() => setSelectedItemExplanation(null)}
                    className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                  >
                    إغلاق
                  </button>
                </div>
                <div className="font-bold text-xs text-white">
                  {selectedItemExplanation.title}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedItemExplanation.explanation}
                </p>
                {selectedItemExplanation.notes && (
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 font-mono">
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
              تم استخراج تقرير التدفقات النقدية آلياً من نظام «نسيج ERP» بتاريخ {new Date().toLocaleDateString('ar-EG')}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
