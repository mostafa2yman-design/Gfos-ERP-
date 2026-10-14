import React, { useState, useEffect, useMemo } from 'react';
import {
  SalesInvoice,
  SalesPaymentStatus,
  SalesDeliveryStatus,
  SalesPaymentMethod,
  SalesMetrics,
  SalesReturn
} from '../../types/sales';
import {
  getSalesInvoices,
  deleteSalesInvoice,
  addSalesInvoice,
  updateSalesInvoice,
  calculateSalesMetrics,
  getSalesReturns,
  addSalesReturn,
  updateSalesReturn,
  deleteSalesReturn
} from '../../lib/salesStorage';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { SalesInvoiceFormModal } from './SalesInvoiceFormModal';
import { SalesInvoiceDetailsModal } from './SalesInvoiceDetailsModal';
import { SalesReturnFormModal } from './SalesReturnFormModal';
import { SalesReturnDetailsModal } from './SalesReturnDetailsModal';
import { getPeriodDateRange } from '../../lib/periodUtils';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  Building,
  User,
  Phone,
  Eye,
  Edit,
  Trash2,
  Printer,
  FileText,
  Boxes,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Percent,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Scale,
  CreditCard,
  LayoutGrid,
  List,
  Layers,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  ShieldCheck,
  PackageOpen
} from 'lucide-react';

interface SalesDashboardProps {
  onNavigateToJournal?: () => void;
  onNavigateToLedger?: (accountCode?: string) => void;
  onNavigateToWarehouse?: () => void;
  onNavigateToCustomers?: () => void;
  onNavigateToOrder?: (orderId: string) => void;
  onNavigateToTreasury?: () => void;
}

export function SalesDashboard({
  onNavigateToJournal,
  onNavigateToLedger,
  onNavigateToWarehouse,
  onNavigateToCustomers,
  onNavigateToOrder,
  onNavigateToTreasury
}: SalesDashboardProps) {
  const { hasPermission } = useAuth();
  const { notifySuccess, notifyInfo, notifyError } = useNotification();

  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Main Tab: invoices vs returns
  const [mainTab, setMainTab] = useState<'invoices' | 'returns'>('invoices');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [periodPreset, setPeriodPreset] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const applyPeriodPreset = (preset: string) => {
    setPeriodPreset(preset);
    const range = getPeriodDateRange(preset);
    setDateFrom(range.startDate);
    setDateTo(range.endDate);
  };

  // Modals for Invoices
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<SalesInvoice | null>(null);
  const [confirmDeleteConfig, setConfirmDeleteConfig] = useState<{
    isOpen: boolean;
    invoice: SalesInvoice | null;
  }>({ isOpen: false, invoice: null });

  // Modals for Returns
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [returnInitialInvoice, setReturnInitialInvoice] = useState<SalesInvoice | null>(null);
  const [editingReturn, setEditingReturn] = useState<SalesReturn | null>(null);
  const [viewingReturn, setViewingReturn] = useState<SalesReturn | null>(null);
  const [confirmDeleteReturnConfig, setConfirmDeleteReturnConfig] = useState<{
    isOpen: boolean;
    returnRecord: SalesReturn | null;
  }>({ isOpen: false, returnRecord: null });

  const loadData = () => {
    setLoading(true);
    try {
      const data = getSalesInvoices();
      setInvoices(data);
      const rets = getSalesReturns();
      setSalesReturns(rets);
    } catch (err) {
      console.error('Failed to load sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorage = () => loadData();
    window.addEventListener('sales_invoices_updated', handleStorage);
    window.addEventListener('sales_returns_updated', handleStorage);
    return () => {
      window.removeEventListener('sales_invoices_updated', handleStorage);
      window.removeEventListener('sales_returns_updated', handleStorage);
    };
  }, []);

  // Filtered Sales Invoices List
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesNum = inv.invoiceNumber.toLowerCase().includes(q);
        const matchesCust = inv.customerName.toLowerCase().includes(q);
        const matchesPhone = inv.customerPhone?.toLowerCase().includes(q) || false;
        const matchesStyle = inv.items.some(it => it.styleName.toLowerCase().includes(q));
        const matchesOrder = inv.relatedOrderNumber?.toLowerCase().includes(q) || false;
        if (!matchesNum && !matchesCust && !matchesPhone && !matchesStyle && !matchesOrder) {
          return false;
        }
      }

      // Payment Status
      if (statusFilter !== 'all' && inv.paymentStatus !== statusFilter) {
        return false;
      }

      // Delivery Status
      if (deliveryFilter !== 'all' && inv.deliveryStatus !== deliveryFilter) {
        return false;
      }

      // Payment Method
      if (paymentMethodFilter !== 'all' && inv.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      // Date Range
      if (dateFrom && inv.date < dateFrom) return false;
      if (dateTo && inv.date > dateTo) return false;

      return true;
    });
  }, [invoices, searchTerm, statusFilter, deliveryFilter, paymentMethodFilter, dateFrom, dateTo]);

  // Aggregate Metrics for Invoices
  const metrics: SalesMetrics = useMemo(() => {
    return calculateSalesMetrics(filteredInvoices);
  }, [filteredInvoices]);

  // Filtered Returns List
  const filteredReturns = useMemo(() => {
    return salesReturns.filter(ret => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesNum = ret.returnNumber.toLowerCase().includes(q);
        const matchesInv = ret.originalInvoiceNumber.toLowerCase().includes(q);
        const matchesCust = ret.customerName.toLowerCase().includes(q);
        const matchesPhone = ret.customerPhone?.toLowerCase().includes(q) || false;
        const matchesStyle = ret.items.some(it => it.styleName.toLowerCase().includes(q));
        if (!matchesNum && !matchesInv && !matchesCust && !matchesPhone && !matchesStyle) {
          return false;
        }
      }

      if (dateFrom && ret.date < dateFrom) return false;
      if (dateTo && ret.date > dateTo) return false;

      return true;
    });
  }, [salesReturns, searchTerm, dateFrom, dateTo]);

  // Aggregate Metrics for Returns
  const totalReturnsValue = useMemo(() => {
    return filteredReturns.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);
  }, [filteredReturns]);

  const totalReturnPieces = useMemo(() => {
    return filteredReturns.reduce(
      (sum, r) => sum + r.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0),
      0
    );
  }, [filteredReturns]);

  // Handlers for Returns
  const handleSaveReturn = async (savedRet: SalesReturn) => {
    if (editingReturn) {
      await updateSalesReturn(savedRet);
      notifySuccess(
        `تم تحديث إذن المرتجع (${savedRet.returnNumber}) وإعادة احتساب القيد والمخزن`,
        'مرتجعات المبيعات'
      );
    } else {
      await addSalesReturn(savedRet);
      notifySuccess(
        `تم تسجيل إذن المرتجع (${savedRet.returnNumber}) وتحديث رصيد المخزن والقيود الآلية بنجاح`,
        'مرتجعات المبيعات'
      );
    }
    loadData();
    setIsReturnFormOpen(false);
    setEditingReturn(null);
    setReturnInitialInvoice(null);
  };

  const handleDeleteReturnConfirm = () => {
    if (!confirmDeleteReturnConfig.returnRecord) return;
    deleteSalesReturn(confirmDeleteReturnConfig.returnRecord.id);
    notifyInfo(
      `تم حذف إذن المرتجع رقم ${confirmDeleteReturnConfig.returnRecord.returnNumber}`,
      'مرتجعات المبيعات'
    );
    setConfirmDeleteReturnConfig({ isOpen: false, returnRecord: null });
    loadData();
  };

  const handleOpenCreateReturnForInvoice = (invoice: SalesInvoice) => {
    setReturnInitialInvoice(invoice);
    setEditingReturn(null);
    setIsReturnFormOpen(true);
  };

  // Handlers
  const handleSaveInvoice = (savedInv: SalesInvoice) => {
    if (editingInvoice) {
      updateSalesInvoice(savedInv);
      notifySuccess(
        `تم تحديث فاتورة المبيعات (${savedInv.invoiceNumber}) وترحيل القيد المحاسبي بنجاح`,
        'إدارة المبيعات'
      );
    } else {
      addSalesInvoice(savedInv);
      notifySuccess(
        `تم إصدار فاتورة المبيعات (${savedInv.invoiceNumber}) وتسجيل القيد الآلي بنجاح`,
        'إدارة المبيعات'
      );
    }
    loadData();
    setIsFormOpen(false);
    setEditingInvoice(null);
  };

  const handleDeleteConfirm = () => {
    if (!confirmDeleteConfig.invoice) return;
    deleteSalesInvoice(confirmDeleteConfig.invoice.id);
    notifyInfo(`تم حذف فاتورة المبيعات رقم ${confirmDeleteConfig.invoice.invoiceNumber}`, 'إدارة المبيعات');
    setConfirmDeleteConfig({ isOpen: false, invoice: null });
    loadData();
  };

  const getStatusBadge = (status: SalesPaymentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>مدفوع</span>
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>سداد جزئي</span>
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>آجل غير مسدد</span>
          </span>
        );
    }
  };

  const getDeliveryBadge = (status: SalesDeliveryStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            <span>تم التسليم</span>
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3 h-3 text-blue-600" />
            <span>جاهز بالمخزن</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>قيد التجهيز</span>
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method: SalesPaymentMethod) => {
    switch (method) {
      case 'cash':
        return <span className="text-slate-600 font-bold">نقداً</span>;
      case 'bank':
        return <span className="text-blue-700 font-bold">تحويل بنكي</span>;
      case 'credit':
        return <span className="text-purple-700 font-bold">آجل (عميل)</span>;
      case 'cheque':
        return <span className="text-amber-700 font-bold">شيك</span>;
      default:
        return <span>{method}</span>;
    }
  };

  const getReturnReasonBadge = (reason: string) => {
    switch (reason) {
      case 'defective':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>عيوب صناعة/تالف</span>
          </span>
        );
      case 'wrong_size':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span>مقاس غير مطابق</span>
          </span>
        );
      case 'wrong_color':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <span>لون مختلف</span>
          </span>
        );
      case 'surplus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <span>فائض عن الحاجة</span>
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>تأخر بالتسليم</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>{reason || 'سبب آخر'}</span>
          </span>
        );
    }
  };

  const getRefundMethodBadge = (method: string) => {
    switch (method) {
      case 'credit_deduction':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span>خصم من رصيد العميل</span>
          </span>
        );
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>رد نقدي من الخزينة</span>
          </span>
        );
      case 'bank':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span>تحويل بنكي للعميل</span>
          </span>
        );
      default:
        return <span className="text-slate-600 font-bold">{method}</span>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-3 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-300">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black">إدارة المبيعات وفواتير العملاء</h2>
                  <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                    منظومة تسليم وتوريد المنتجات التامة
                  </span>
                </div>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  إصدار ومتابعة فواتير بيع الملابس والمنتجات التامة مع الإثبات الآلي للقيود المحاسبية وتتبع الذمم
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onNavigateToJournal && (
              <button
                type="button"
                onClick={onNavigateToJournal}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-xs"
              >
                <BookOpen className="w-4 h-4 text-blue-300" />
                <span>دفتر قيود المبيعات</span>
              </button>
            )}

            {onNavigateToWarehouse && (
              <button
                type="button"
                onClick={onNavigateToWarehouse}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-xs"
              >
                <Boxes className="w-4 h-4 text-emerald-300" />
                <span>مخزن المنتجات التامة</span>
              </button>
            )}

            {onNavigateToTreasury && (
              <button
                type="button"
                onClick={onNavigateToTreasury}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>تحصيل عميل (الخزينة)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingReturn(null);
                setReturnInitialInvoice(null);
                setIsReturnFormOpen(true);
              }}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تسجيل مرتجع مبيعات</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingInvoice(null);
                setIsFormOpen(true);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>فاتورة مبيعات جديدة</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (فواتير المبيعات vs مرتجعات المبيعات) */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMainTab('invoices')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mainTab === 'invoices'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>فواتير المبيعات ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('returns')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mainTab === 'returns'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>مرتجعات ومردودات المبيعات ({salesReturns.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {mainTab === 'invoices' ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Sales Value */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">إجمالي المبيعات</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {metrics.totalSalesValue.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-slate-400">ج.م</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Collected Cash & Bank */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">المحصل نقداً وبنكياً</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {metrics.totalPaidAmount.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-emerald-400">ج.م</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Receivables / Remaining Credit */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">المتبقي الآجل (الذمم)</p>
              <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                {metrics.totalRemainingAmount.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-rose-400">ج.م</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Invoices and Pieces */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">الفواتير والقطع المباعة</p>
              <p className="text-xl sm:text-2xl font-black text-indigo-700 mt-1">
                {metrics.totalPiecesSold.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-slate-400">قطعة</span>
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                {metrics.totalInvoicesCount} فاتورة
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          {/* Collection Rate */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 col-span-2 md:col-span-1 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">معدل التحصيل النقدي</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-xl sm:text-2xl font-black text-teal-700">{metrics.collectionRate}%</p>
                <span className="text-[11px] font-bold text-slate-400">من الإجمالي</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {metrics.paidInvoicesCount} مسددة · {metrics.partialInvoicesCount} جزئي · {metrics.unpaidInvoicesCount} آجل
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Returns Value */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">إجمالي قيمة المرتجعات</p>
              <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                {totalReturnsValue.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-slate-400">ج.م</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>

          {/* Return Orders Count */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">أذون الارتجاع المسجلة</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {filteredReturns.length}{' '}
                <span className="text-xs font-bold text-slate-400">إذن</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Returned Pieces */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">إجمالي القطع المسترجعة</p>
              <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
                {totalReturnPieces.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-slate-400">قطعة</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          {/* Added to Warehouse */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">المخزن التام والمخزون</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {filteredReturns.filter(r => r.stockReturned).length}{' '}
                <span className="text-xs font-bold text-slate-400">إذن</span>
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">أعيدت لرصيد التام</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Refunded Cash / Bank */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 col-span-2 md:col-span-1 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">الرد النقدي والبنكي</p>
              <p className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
                {filteredReturns
                  .reduce((sum, r) => sum + (r.refundMethod !== 'credit_deduction' ? Number(r.refundedAmount || r.grandTotal) : 0), 0)
                  .toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-blue-400">ج.م</span>
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">تسوية الخزينة والبنوك</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Filter & Control Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Quick Search */}
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={
                mainTab === 'invoices'
                  ? 'بحث برقم الفاتورة، اسم العميل، الهاتف، أو الموديل...'
                  : 'بحث برقم المرتجع، رقم الفاتورة الأصلية، اسم العميل، أو الموديل...'
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* View Mode & Refresh */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="عرض الجدول الميداني"
              >
                <List className="w-4 h-4" />
                <span>جدول {mainTab === 'invoices' ? 'الفواتير' : 'المرتجعات'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="عرض البطاقات"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>بطاقات {mainTab === 'invoices' ? 'المبيعات' : 'المرتجعات'}</span>
              </button>
            </div>

            <button
              onClick={loadData}
              title="تحديث البيانات"
              className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          {mainTab === 'invoices' ? (
            <>
              {/* Payment Status Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">حالة السداد</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer font-bold"
                >
                  <option value="all">كافة حالات السداد (الكل)</option>
                  <option value="paid">مدفوعة بالكامل</option>
                  <option value="partial">سداد جزئي (متبقي رصيد)</option>
                  <option value="unpaid">آجل غير مسدد</option>
                </select>
              </div>

              {/* Delivery Status Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">حالة التسليم</label>
                <select
                  value={deliveryFilter}
                  onChange={e => setDeliveryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer font-bold"
                >
                  <option value="all">كافة حالات التسليم (الكل)</option>
                  <option value="delivered">تم التسليم للعميل</option>
                  <option value="ready">جاهز للتسليم بالمخزن</option>
                  <option value="pending">قيد التجهيز والتعبئة</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">طريقة الدفع</label>
                <select
                  value={paymentMethodFilter}
                  onChange={e => setPaymentMethodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer font-bold"
                >
                  <option value="all">كافة طرق الدفع</option>
                  <option value="cash">نقداً (خزينة)</option>
                  <option value="bank">تحويل بنكي</option>
                  <option value="credit">آجل على الحساب</option>
                  <option value="cheque">شيك بنكي</option>
                </select>
              </div>
            </>
          ) : (
            <div className="col-span-2 sm:col-span-3 flex items-center gap-2 text-slate-600 bg-orange-50/60 p-2.5 rounded-xl border border-orange-200/60">
              <RotateCcw className="w-4 h-4 text-orange-600 shrink-0" />
              <p className="text-xs font-medium">
                يتم ربط كل إذن مرتجع بفاتورة مبيعات أصلية وتحديث رصيد مخزن المنتجات التامة فورياً وتسجيل قيود اليومية الآلية.
              </p>
            </div>
          )}

          {/* Date from / to */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Quick Period Presets (Factory Weekly Cycles) */}
        <div className="flex flex-wrap items-center justify-between pt-3 mt-3 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-slate-400 font-medium">فترات العمل:</span>
            <button
              type="button"
              onClick={() => applyPeriodPreset('this_week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                periodPreset === 'this_week'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <span>هذا الأسبوع (أسبوع المصنع)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('last_week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'last_week'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700'
              }`}
            >
              الأسبوع السابق
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('today')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'today'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700'
              }`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('this_month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'this_month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700'
              }`}
            >
              هذا الشهر
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('this_year')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'this_year'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700'
              }`}
            >
              العام الحالي
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'all' && !dateFrom && !dateTo
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700'
              }`}
            >
              كافة الفترات
            </button>
          </div>

          {(dateFrom || dateTo || searchTerm || statusFilter !== 'all' || deliveryFilter !== 'all' || paymentMethodFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDeliveryFilter('all');
                setPaymentMethodFilter('all');
                setDateFrom('');
                setDateTo('');
                setPeriodPreset('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold transition-colors cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT DISPLAY */}
      {mainTab === 'invoices' ? (
        viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right min-w-[980px]">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">رقم الفاتورة</th>
                  <th className="py-3.5 px-4">تاريخ الإصدار</th>
                  <th className="py-3.5 px-4">العميل / المؤسسة</th>
                  <th className="py-3.5 px-4">أصناف الملابس</th>
                  <th className="py-3.5 px-4 text-center">الكمية الإجمالية</th>
                  <th className="py-3.5 px-4 text-left">الصافي الإجمالي</th>
                  <th className="py-3.5 px-4 text-left">المحصل</th>
                  <th className="py-3.5 px-4 text-left">المتبقي الآجل</th>
                  <th className="py-3.5 px-4 text-center">حالة السداد</th>
                  <th className="py-3.5 px-4 text-center">حالة التسليم</th>
                  <th className="py-3.5 px-4 text-center">طريقة الدفع</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map(inv => {
                    const invPieces = inv.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setViewingInvoice(inv)}
                        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-black text-blue-900 group-hover:text-blue-700 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            {inv.invoiceNumber}
                          </span>
                          {inv.relatedOrderNumber && (
                            <span className="text-[10px] text-indigo-700 font-bold block mt-0.5">
                              أمر: {inv.relatedOrderNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                          {inv.date}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-900 line-clamp-1">{inv.customerName}</div>
                          {inv.customerPhone && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{inv.customerPhone}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-bold line-clamp-1">
                            {inv.items.map(it => it.styleName).filter(Boolean).slice(0, 2).join('، ')}
                            {inv.items.length > 2 ? ` (+${inv.items.length - 2})` : ''}
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {inv.items.length} بند
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-slate-800">
                          {invPieces.toLocaleString('ar-EG')} ق
                        </td>
                        <td className="py-3.5 px-4 text-left font-black text-blue-950 whitespace-nowrap">
                          {Number(inv.grandTotal).toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3.5 px-4 text-left font-bold text-emerald-700 whitespace-nowrap">
                          {Number(inv.paidAmount).toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3.5 px-4 text-left font-bold text-rose-700 whitespace-nowrap">
                          {Number(inv.remainingAmount).toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(inv.paymentStatus)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {getDeliveryBadge(inv.deliveryStatus)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {getPaymentMethodBadge(inv.paymentMethod)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenCreateReturnForInvoice(inv)}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="تسجيل مرتجع لهذه الفاتورة"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewingInvoice(inv)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="عرض تفاصيل الفاتورة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingInvoice(inv);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="تعديل الفاتورة"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteConfig({ isOpen: true, invoice: inv })}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف الفاتورة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto text-center space-y-2">
                        <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                        <p className="text-xs font-bold text-slate-500">لا توجد فواتير مبيعات مطابقة لمعايير البحث</p>
                        <p className="text-[11px] text-slate-400">اضغط على زر "فاتورة مبيعات جديدة" لإصدار فاتورة</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map(inv => {
              const invPieces = inv.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
              return (
                <div
                  key={inv.id}
                  onClick={() => setViewingInvoice(inv)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {inv.invoiceNumber}
                        </span>
                        {inv.relatedOrderNumber && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {inv.relatedOrderNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-500">{inv.date}</span>
                    </div>

                    {/* Customer */}
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{inv.customerName}</h4>
                      {inv.customerPhone && (
                        <p className="text-xs text-slate-500 mt-0.5">{inv.customerPhone}</p>
                      )}
                    </div>

                    {/* Items preview */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>إجمالي القطع:</span>
                        <span className="font-black text-slate-900">{invPieces.toLocaleString('ar-EG')} قطعة</span>
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {inv.items.map(it => `${it.styleName} (${it.quantity})`).join('، ')}
                      </div>
                    </div>

                    {/* Financials Box */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                      <div className="bg-blue-50/50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-500 block">الصافي</span>
                        <span className="font-black text-blue-950 text-xs">
                          {Number(inv.grandTotal).toLocaleString('ar-EG')}
                        </span>
                      </div>
                      <div className="bg-emerald-50/50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-500 block">المحصل</span>
                        <span className="font-black text-emerald-700 text-xs">
                          {Number(inv.paidAmount).toLocaleString('ar-EG')}
                        </span>
                      </div>
                      <div className="bg-rose-50/50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-500 block">المتبقي</span>
                        <span className="font-black text-rose-700 text-xs">
                          {Number(inv.remainingAmount).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getStatusBadge(inv.paymentStatus)}
                      {getDeliveryBadge(inv.deliveryStatus)}
                    </div>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateReturnForInvoice(inv)}
                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="تسجيل مرتجع لهذه الفاتورة"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInvoice(inv);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteConfig({ isOpen: true, invoice: inv })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              لا توجد فواتير مبيعات مطابقة.
            </div>
          )}
        </div>
      )) : (
        /* ================= SALES RETURNS DISPLAY ================= */
        viewMode === 'table' ? (
          /* TABLE VIEW - RETURNS */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right min-w-[980px]">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">رقم إذن المرتجع</th>
                    <th className="py-3.5 px-4">تاريخ المرتجع</th>
                    <th className="py-3.5 px-4">فاتورة المبيعات الأصلية</th>
                    <th className="py-3.5 px-4">العميل</th>
                    <th className="py-3.5 px-4">الأصناف المسترجعة</th>
                    <th className="py-3.5 px-4 text-center">الكمية</th>
                    <th className="py-3.5 px-4 text-left">قيمة المرتجع</th>
                    <th className="py-3.5 px-4 text-center">سبب الارتجاع</th>
                    <th className="py-3.5 px-4 text-center">حالة المخزن</th>
                    <th className="py-3.5 px-4 text-center">طريقة الرد المالي</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.length > 0 ? (
                    filteredReturns.map(ret => {
                      const retPieces = ret.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                      return (
                        <tr
                          key={ret.id}
                          onClick={() => setViewingReturn(ret)}
                          className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-black text-orange-950 group-hover:text-orange-700 flex items-center gap-1.5">
                              <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                              {ret.returnNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {ret.date}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              <FileText className="w-3 h-3 text-blue-600" />
                              {ret.originalInvoiceNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{ret.customerName}</div>
                            {ret.customerPhone && (
                              <div className="text-[11px] text-slate-400">{ret.customerPhone}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="truncate text-slate-700 font-medium">
                              {ret.items.map(it => `${it.styleName} (${it.size}/${it.color})`).join('، ')}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-center font-black text-slate-800 whitespace-nowrap">
                            {retPieces.toLocaleString('ar-EG')} قطعة
                          </td>
                          <td className="py-3.5 px-4 text-left font-black text-rose-700 whitespace-nowrap">
                            {Number(ret.grandTotal).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {getReturnReasonBadge(ret.items[0]?.reason || 'other')}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {ret.stockReturned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>أعيدت لرصيد التام</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                <span>لم تسجل بالمخزن</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {getRefundMethodBadge(ret.refundMethod)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingReturn(ret)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="عرض تفاصيل المرتجع والطباعة"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReturn(ret);
                                  setReturnInitialInvoice(null);
                                  setIsReturnFormOpen(true);
                                }}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="تعديل إذن المرتجع"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteReturnConfig({ isOpen: true, returnRecord: ret })}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="حذف المرتجع"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto text-center space-y-2">
                          <RotateCcw className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                          <p className="text-xs font-bold text-slate-500">لا توجد أذون مرتجعات مبيعات مطابقة للبحث</p>
                          <p className="text-[11px] text-slate-400">اضغط على زر "تسجيل مرتجع مبيعات" لإصدار إذن مرتجع جديد</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARDS VIEW - RETURNS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReturns.length > 0 ? (
              filteredReturns.map(ret => {
                const retPieces = ret.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                return (
                  <div
                    key={ret.id}
                    onClick={() => setViewingReturn(ret)}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-orange-950 text-sm flex items-center gap-1">
                              <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                              {ret.returnNumber}
                            </span>
                            <span className="text-slate-400 text-xs">·</span>
                            <span className="text-slate-500 text-xs font-medium">{ret.date}</span>
                          </div>
                          <p className="text-xs font-bold text-blue-900 mt-1">{ret.customerName}</p>
                          <p className="text-[11px] text-blue-600 mt-0.5 font-bold">
                            عن فاتورة: {ret.originalInvoiceNumber}
                          </p>
                        </div>
                        <div className="text-left">
                          <span className="text-base font-black text-rose-700 block">
                            {Number(ret.grandTotal).toLocaleString('ar-EG')} ج.م
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold block">{retPieces} قطعة</span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="bg-orange-50/40 p-2.5 rounded-xl border border-orange-100 text-xs space-y-1">
                        {ret.items.slice(0, 2).map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-slate-700">
                            <span className="truncate max-w-[180px]">
                              {it.styleName} ({it.size}/{it.color})
                            </span>
                            <span className="font-bold text-orange-900">
                              {it.quantity} {it.unit}
                            </span>
                          </div>
                        ))}
                        {ret.items.length > 2 && (
                          <p className="text-[10px] text-slate-400 text-center pt-0.5">
                            +{ret.items.length - 2} أصناف أخرى
                          </p>
                        )}
                      </div>

                      {/* Return Reason & Stock Returned */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>{getReturnReasonBadge(ret.items[0]?.reason || 'other')}</div>
                        {ret.stockReturned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>مخزن التام</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">غير مخزن</span>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
                      <div>{getRefundMethodBadge(ret.refundMethod)}</div>

                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setViewingReturn(ret)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض وطباعة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReturn(ret);
                            setReturnInitialInvoice(null);
                            setIsReturnFormOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteReturnConfig({ isOpen: true, returnRecord: ret })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                لا توجد أذون مرتجعات مبيعات مطابقة.
              </div>
            )}
          </div>
        )
      )}

      {/* Confirm Delete Invoice Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteConfig.isOpen}
        message={`هل أنت متأكد من حذف فاتورة المبيعات رقم (${confirmDeleteConfig.invoice?.invoiceNumber}) للعميل (${confirmDeleteConfig.invoice?.customerName})؟ سيتم تحديث وتعديل القيود المحاسبية التلقائية فوراً.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteConfig({ isOpen: false, invoice: null })}
      />

      {/* Confirm Delete Return Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteReturnConfig.isOpen}
        message={`هل أنت متأكد من حذف إذن مرتجع المبيعات رقم (${confirmDeleteReturnConfig.returnRecord?.returnNumber}) للعميل (${confirmDeleteReturnConfig.returnRecord?.customerName})؟ سيتم تحديث وتعديل القيود المحاسبية التلقائية فوراً.`}
        onConfirm={handleDeleteReturnConfirm}
        onCancel={() => setConfirmDeleteReturnConfig({ isOpen: false, returnRecord: null })}
      />

      {/* Sales Invoice Form Modal (New & Edit) */}
      {isFormOpen && (
        <SalesInvoiceFormModal
          invoice={editingInvoice}
          onClose={() => {
            setIsFormOpen(false);
            setEditingInvoice(null);
          }}
          onSave={handleSaveInvoice}
        />
      )}

      {/* Sales Invoice Details Modal (View & Print) */}
      {viewingInvoice && (
        <SalesInvoiceDetailsModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onEdit={inv => {
            setViewingInvoice(null);
            setEditingInvoice(inv);
            setIsFormOpen(true);
          }}
          onOpenReturn={inv => handleOpenCreateReturnForInvoice(inv)}
          onNavigateToJournal={onNavigateToJournal}
          onNavigateToOrder={onNavigateToOrder}
        />
      )}

      {/* Sales Return Form Modal (New & Edit) */}
      {isReturnFormOpen && (
        <SalesReturnFormModal
          initialInvoice={returnInitialInvoice}
          returnRecord={editingReturn}
          onClose={() => {
            setIsReturnFormOpen(false);
            setEditingReturn(null);
            setReturnInitialInvoice(null);
          }}
          onSave={handleSaveReturn}
        />
      )}

      {/* Sales Return Details Modal (View & Print) */}
      {viewingReturn && (
        <SalesReturnDetailsModal
          salesReturn={viewingReturn}
          onClose={() => setViewingReturn(null)}
          onNavigateToJournal={onNavigateToJournal}
        />
      )}
    </div>
  );
}

export default SalesDashboard;
