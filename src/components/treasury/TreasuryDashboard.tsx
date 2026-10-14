import React, { useState, useEffect, useMemo } from 'react';
import { TreasuryTransaction, TreasuryTransactionType, TreasuryMetrics } from '../../types/treasury';
import {
  getTreasuryTransactions,
  addTreasuryTransaction,
  deleteTreasuryTransaction,
  calculateTreasuryMetrics
} from '../../lib/treasuryStorage';
import { TreasuryTransactionModal } from './TreasuryTransactionModal';
import { TreasuryVoucherPrintModal } from './TreasuryVoucherPrintModal';
import { SystemAuditLogModal } from '../audit/SystemAuditLogModal';
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Building,
  Calendar,
  Search,
  Printer,
  FileText,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  BookOpen,
  Scale,
  ShoppingCart,
  Boxes,
  Layers,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Clock
} from 'lucide-react';

interface TreasuryDashboardProps {
  onNavigateToJournal?: () => void;
  onNavigateToLedger?: (accountCode?: string) => void;
  onNavigateToSales?: () => void;
  onNavigateToPurchases?: () => void;
  onNavigateToCashFlow?: () => void;
}

export function TreasuryDashboard({
  onNavigateToJournal,
  onNavigateToLedger,
  onNavigateToSales,
  onNavigateToPurchases,
  onNavigateToCashFlow
}: TreasuryDashboardProps) {
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | TreasuryTransactionType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'cash' | 'bank' | 'cheque'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<TreasuryTransactionType>('customer_collection');
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<TreasuryTransaction | null>(null);

  // Load transactions
  const loadTransactions = () => {
    setTransactions(getTreasuryTransactions());
  };

  useEffect(() => {
    loadTransactions();

    const handleUpdate = () => {
      loadTransactions();
    };

    window.addEventListener('treasury_transactions_updated', handleUpdate);
    return () => {
      window.removeEventListener('treasury_transactions_updated', handleUpdate);
    };
  }, []);

  // Metrics calculation
  const metrics: TreasuryMetrics = useMemo(() => {
    return calculateTreasuryMetrics(transactions);
  }, [transactions]);

  // Open modal with specific initial type
  const handleOpenAdd = (type: TreasuryTransactionType) => {
    setModalInitialType(type);
    setShowAddModal(true);
  };

  // Add transaction handler
  const handleAddTransaction = (data: any) => {
    addTreasuryTransaction(data);
    loadTransactions();
  };

  // Delete transaction handler
  const handleDeleteTransaction = (id: string, voucherNum: string) => {
    if (window.confirm(`هل أنت متأكد من حذف السند ${voucherNum}؟ سيتم تحديث قيود الحسابات والأرصدة فوراً.`)) {
      deleteTreasuryTransaction(id);
      loadTransactions();
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Tab filter
      if (activeTab !== 'all' && t.type !== activeTab) return false;

      // Channel filter
      if (channelFilter !== 'all' && t.paymentChannel !== channelFilter) return false;

      // Date range filter
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchVoucher = t.voucherNumber.toLowerCase().includes(term);
        const matchParty = t.partyName?.toLowerCase().includes(term);
        const matchDesc = t.description?.toLowerCase().includes(term);
        const matchRef = t.referenceNumber?.toLowerCase().includes(term);
        const matchCat = t.categoryLabel?.toLowerCase().includes(term);
        const matchInv = t.relatedInvoiceNumber?.toLowerCase().includes(term);
        if (!matchVoucher && !matchParty && !matchDesc && !matchRef && !matchCat && !matchInv) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, activeTab, channelFilter, startDate, endDate, searchTerm]);

  const getTypeBadge = (type: TreasuryTransactionType) => {
    switch (type) {
      case 'customer_collection':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>إيراد تحصيل عميل</span>
          </span>
        );
      case 'other_revenue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-teal-100 text-teal-800 border border-teal-300">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>إيراد آخر</span>
          </span>
        );
      case 'supplier_payment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            <span>سداد موردين</span>
          </span>
        );
      case 'other_expense':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            <span>مصروف آخر</span>
          </span>
        );
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'cash':
        return <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">خزينة نقداً</span>;
      case 'bank':
        return <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">تحويل بنكي</span>;
      case 'cheque':
        return <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">شيك تجاري</span>;
      default:
        return <span className="text-[11px] font-bold text-slate-600">نقداً</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-white">إدارة الإيرادات والمصروفات والخزينة</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  الخزينة والمدفوعات
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                تسجيل ومتابعة سندات القبض والتحصيل وسندات الصرف والسداد والمصروفات مربوطة آلياً بدفتر القيود وشجرة الحسابات
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Links */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {onNavigateToJournal && (
              <button
                type="button"
                onClick={onNavigateToJournal}
                className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>دفتر القيود</span>
              </button>
            )}

            {onNavigateToLedger && (
              <button
                type="button"
                onClick={() => onNavigateToLedger('1211')}
                className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>أستاذ الخزينة</span>
              </button>
            )}

            {onNavigateToCashFlow && (
              <button
                type="button"
                onClick={onNavigateToCashFlow}
                className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <span>التدفقات النقدية</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition-all border border-indigo-400/40 cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="سجل الاعتمادات والرقابة الإدارية والمالية لكافة الحركات"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              <span>سجل الاعتمادات والرقابة</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Bar: Four Core Operations */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => handleOpenAdd('customer_collection')}
            className="p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-white transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="text-right">
              <span className="text-[11px] text-emerald-300 font-bold block">إيداع مقبوضات</span>
              <span className="text-xs font-black">+ إيراد تحصيل عميل</span>
            </div>
            <ArrowDownLeft className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('other_revenue')}
            className="p-3 rounded-2xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-white transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="text-right">
              <span className="text-[11px] text-teal-300 font-bold block">إيراد متنوع / عوادم</span>
              <span className="text-xs font-black">+ إيراد آخر</span>
            </div>
            <TrendingUp className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('supplier_payment')}
            className="p-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-white transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="text-right">
              <span className="text-[11px] text-rose-300 font-bold block">سداد فواتير خامات</span>
              <span className="text-xs font-black">+ تسجيل سداد موردين</span>
            </div>
            <ArrowUpRight className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('other_expense')}
            className="p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-white transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="text-right">
              <span className="text-[11px] text-amber-300 font-bold block">كهرباء، صيانة، أجور</span>
              <span className="text-xs font-black">+ مصروف آخر</span>
            </div>
            <DollarSign className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Financial KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Vault Cash */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">رصيد الخزينة (1211)</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {metrics.totalVaultCash.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block">السيولة النقدية الحاضرة</span>
        </div>

        {/* Bank Cash */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">رصيد البنك الجاري (1213)</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {metrics.totalBankCash.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
          </div>
          <span className="text-[10px] text-indigo-600 font-bold block">الحسابات المصرفية الجارية</span>
        </div>

        {/* Total Revenues */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs">
            <span className="font-bold">إجمالي الإيرادات</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            {metrics.totalRevenues.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            تحصيلات: {metrics.totalCustomerCollections.toLocaleString('ar-EG')} · أخرى: {metrics.totalOtherRevenues.toLocaleString('ar-EG')}
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-800 text-xs">
            <span className="font-bold">إجمالي المصروفات</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700 font-mono">
            {metrics.totalExpenses.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            سداد موردين: {metrics.totalSupplierPayments.toLocaleString('ar-EG')} · مصروفات: {metrics.totalOtherExpenses.toLocaleString('ar-EG')}
          </span>
        </div>

        {/* Net Flow */}
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 col-span-2 lg:col-span-1 ${
          metrics.netCashFlow >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={metrics.netCashFlow >= 0 ? 'text-emerald-900' : 'text-rose-900'}>
              صافي التدفق النقدي
            </span>
            <TrendingUp className={`w-4 h-4 ${metrics.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div className={`text-xl font-black font-mono ${metrics.netCashFlow >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
            {metrics.netCashFlow.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block">
            {metrics.netCashFlow >= 0 ? 'فائض نقدي إيجابي (+)' : 'عجز تدفق نقدي (-)'}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>كل الحركات المالية</span>
            <span className="mr-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
              {transactions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customer_collection')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === 'customer_collection'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>إيراد تحصيل عميل</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('other_revenue')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === 'other_revenue'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>إيراد آخر</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supplier_payment')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === 'supplier_payment'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>تسجيل سداد موردين</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('other_expense')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTab === 'other_expense'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>مصروف آخر</span>
            </span>
          </button>
        </div>

        {/* Filters Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم السند، اسم العميل/المورد، البيان، رقم الفاتورة..."
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="all">كل طرق الدفع</option>
              <option value="cash">نقداً بالخزينة</option>
              <option value="bank">تحويل بنكي</option>
              <option value="cheque">شيك مصرفي</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700"
              title="من تاريخ"
            />
          </div>

          <div className="sm:col-span-2">
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700"
              title="إلى تاريخ"
            />
          </div>
        </div>
      </div>

      {/* Transactions List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900">سجل المعاملات وسندات الخزينة</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold font-mono">
              {filteredTransactions.length} حركة
            </span>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            تحديث فوري مع دفتر القيود المحاسبية والحسابات العامة
          </span>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">رقم السند والتاريخ</th>
                  <th className="py-3.5 px-4">نوع الحركة المالية</th>
                  <th className="py-3.5 px-4">الطرف الثاني / المستفيد</th>
                  <th className="py-3.5 px-4">الصندوق / الحساب المالي</th>
                  <th className="py-3.5 px-4">البيان والشرح</th>
                  <th className="py-3.5 px-4">المعتمد وتوقيت التوثيق</th>
                  <th className="py-3.5 px-4 text-center">المبلغ (ج.م)</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredTransactions.map(t => {
                  const isRevenue = t.type === 'customer_collection' || t.type === 'other_revenue';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Voucher & Date */}
                      <td className="py-3 px-4 font-medium">
                        <div className="font-mono font-black text-blue-900 text-xs">{t.voucherNumber}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {t.date} {t.time ? `· ${t.time}` : ''}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {getTypeBadge(t.type)}
                          <div className="block">{getChannelBadge(t.paymentChannel)}</div>
                        </div>
                      </td>

                      {/* Party */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {t.partyName || t.beneficiary || 'عام / نقدي'}
                        </div>
                        {t.relatedInvoiceNumber && (
                          <div className="text-[11px] text-blue-700 font-medium">
                            فاتورة: <span className="font-mono font-bold">{t.relatedInvoiceNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Fund & Accounting */}
                      <td className="py-3 px-4 text-[11px]">
                        <div className="font-bold text-slate-800">{t.fundAccountName}</div>
                        <div className="text-slate-500 font-mono">
                          مقابل: <span className="text-slate-700 font-bold">{t.targetAccountCode}</span> ({t.targetAccountName})
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-700 font-medium truncate" title={t.description}>
                          {t.description}
                        </p>
                        {t.referenceNumber && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            مرجع: {t.referenceNumber}
                          </span>
                        )}
                      </td>

                      {/* Approver & Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-black text-slate-900 text-xs">
                            {t.approvedBy?.userName || t.createdBy?.userName || 'مدير عام النظام'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                          {t.approvedBy?.userRoleLabel || t.createdBy?.userRole || 'المسؤول المالي'}
                        </div>
                        <div className="text-[10px] text-indigo-700 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>{t.approvalDate || t.date} · {t.approvalTime || t.time || '12:00:00'}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className={`text-sm font-black ${
                          isRevenue ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {isRevenue ? '+' : '-'} {t.amount.toLocaleString('ar-EG')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedVoucherForPrint(t)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="طباعة السند الرسمي"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {onNavigateToJournal && (
                            <button
                              type="button"
                              onClick={onNavigateToJournal}
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                              title="عرض القيد في دفتر القيود"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(t.id, t.voucherNumber)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                            title="حذف السند"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <DollarSign className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <h4 className="text-sm font-bold text-slate-700">لا توجد حركات مالية مطابقة للمعايير المحددة</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              يمكنك تسجيل سند تحصيل عميل، إيراد آخر، سداد مورد أو مصروف آخر باستخدام الأزرار أعلاه.
            </p>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <TreasuryTransactionModal
          initialType={modalInitialType}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTransaction}
        />
      )}

      {/* Print Voucher Modal */}
      {selectedVoucherForPrint && (
        <TreasuryVoucherPrintModal
          transaction={selectedVoucherForPrint}
          onClose={() => setSelectedVoucherForPrint(null)}
          onNavigateToJournal={onNavigateToJournal}
        />
      )}

      {/* System Audit & Approvals Log Modal */}
      {showAuditModal && (
        <SystemAuditLogModal
          onClose={() => setShowAuditModal(false)}
        />
      )}
    </div>
  );
}
