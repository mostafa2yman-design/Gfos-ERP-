import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Calendar,
  Search,
  Filter,
  Users,
  PackageSearch,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  DollarSign,
  Layers,
  Sparkles,
  RefreshCw,
  Boxes,
  RotateCcw,
  BookOpen,
  LayoutGrid,
  Table as TableIcon,
  Truck,
  ArrowRight
} from 'lucide-react';
import {
  PurchaseInvoice,
  PurchasePaymentStatus,
  PurchasePaymentMethod,
  PurchaseReceiptStatus,
  PurchaseReturn,
  PurchaseReturnReason,
  PurchaseReturnRefundMethod,
  PurchaseMetrics
} from '../../types/purchases';
import { getPeriodDateRange } from '../../lib/periodUtils';
import {
  getPurchases,
  savePurchases,
  addPurchase,
  updatePurchase,
  deletePurchase,
  getPurchaseReturns,
  addPurchaseReturn,
  updatePurchaseReturn,
  deletePurchaseReturn,
  calculatePurchaseMetrics
} from '../../lib/purchasesStorage';
import { PurchaseInvoiceFormModal } from './PurchaseInvoiceFormModal';
import { PurchaseInvoiceDetailsModal } from './PurchaseInvoiceDetailsModal';
import { PurchaseReturnFormModal } from './PurchaseReturnFormModal';
import { PurchaseReturnDetailsModal } from './PurchaseReturnDetailsModal';
import { QuickAddSupplierModal } from './QuickAddSupplierModal';
import { QuickAddMaterialModal } from './QuickAddMaterialModal';
import { useNotification } from '../../context/NotificationContext';
import { SensitiveDataMask } from '../common/SensitiveDataMask';

interface PurchasesDashboardProps {
  onNavigateToAccounting?: (tab: 'customers' | 'materials', autoOpenAdd?: boolean) => void;
  onNavigateToWarehouse?: () => void;
  onNavigateToJournal?: () => void;
  onNavigateToTreasury?: () => void;
}

export function PurchasesDashboard({
  onNavigateToAccounting,
  onNavigateToWarehouse,
  onNavigateToJournal,
  onNavigateToTreasury
}: PurchasesDashboardProps) {
  const { notifySuccess, notifyInfo } = useNotification();

  // Primary Data
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(false);

  // Tabs: 'invoices' | 'returns'
  const [mainTab, setMainTab] = useState<'invoices' | 'returns'>('invoices');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [receiptFilter, setReceiptFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [periodPreset, setPeriodPreset] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals State for Invoices
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [confirmDeleteInvoiceConfig, setConfirmDeleteInvoiceConfig] = useState<{
    isOpen: boolean;
    invoice: PurchaseInvoice | null;
  }>({ isOpen: false, invoice: null });

  // Modals State for Returns
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<PurchaseReturn | null>(null);
  const [viewingReturn, setViewingReturn] = useState<PurchaseReturn | null>(null);
  const [returnInitialInvoice, setReturnInitialInvoice] = useState<PurchaseInvoice | null>(null);
  const [confirmDeleteReturnConfig, setConfirmDeleteReturnConfig] = useState<{
    isOpen: boolean;
    returnRecord: PurchaseReturn | null;
  }>({ isOpen: false, returnRecord: null });

  // Quick Addition Modals
  const [showQuickSupplierModal, setShowQuickSupplierModal] = useState(false);
  const [showQuickMaterialModal, setShowQuickMaterialModal] = useState(false);

  // Load primary data
  const loadData = () => {
    setLoading(true);
    try {
      setPurchases(getPurchases());
      setPurchaseReturns(getPurchaseReturns());
    } catch (err) {
      console.error('Failed to load purchases data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('purchases_updated', handleUpdate);
    window.addEventListener('purchase_returns_updated', handleUpdate);
    window.addEventListener('raw_materials_updated', handleUpdate);
    return () => {
      window.removeEventListener('purchases_updated', handleUpdate);
      window.removeEventListener('purchase_returns_updated', handleUpdate);
      window.removeEventListener('raw_materials_updated', handleUpdate);
    };
  }, []);

  // Quick Period Presets (Factory Weekly Cycles: Saturday-Friday)
  const applyPeriodPreset = (preset: string) => {
    setPeriodPreset(preset);
    const range = getPeriodDateRange(preset);
    setDateFrom(range.startDate);
    setDateTo(range.endDate);
  };

  // Suppliers list for dropdown
  const uniqueSuppliers = useMemo(() => {
    const map = new Map<string, string>();
    purchases.forEach(p => {
      if (p.supplierId && p.supplierName) {
        map.set(p.supplierId, p.supplierName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [purchases]);

  // Filtered Purchases Invoices
  const filteredInvoices = useMemo(() => {
    return purchases.filter(inv => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesNum = inv.invoiceNumber?.toLowerCase().includes(q) || false;
        const matchesSupp = inv.supplierName?.toLowerCase().includes(q) || false;
        const matchesPhone = inv.supplierPhone?.toLowerCase().includes(q) || false;
        const matchesRef = inv.referenceNumber?.toLowerCase().includes(q) || false;
        const matchesNotes = inv.notes?.toLowerCase().includes(q) || false;
        const matchesItem = inv.items?.some(it => it.materialName?.toLowerCase().includes(q)) || false;
        if (!matchesNum && !matchesSupp && !matchesPhone && !matchesRef && !matchesNotes && !matchesItem) {
          return false;
        }
      }

      // Supplier
      if (supplierFilter !== 'all' && inv.supplierId !== supplierFilter) {
        return false;
      }

      // Payment Status
      if (statusFilter !== 'all' && inv.paymentStatus !== statusFilter) {
        return false;
      }

      // Receipt Status
      if (receiptFilter !== 'all') {
        const invReceipt = inv.receiptStatus || 'received';
        if (invReceipt !== receiptFilter) return false;
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
  }, [purchases, searchTerm, supplierFilter, statusFilter, receiptFilter, paymentMethodFilter, dateFrom, dateTo]);

  // Aggregate Metrics for Invoices
  const invoiceMetrics: PurchaseMetrics = useMemo(() => {
    return calculatePurchaseMetrics(filteredInvoices);
  }, [filteredInvoices]);

  // Filtered Purchase Returns
  const filteredReturns = useMemo(() => {
    return purchaseReturns.filter(ret => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesNum = ret.returnNumber?.toLowerCase().includes(q) || false;
        const matchesInv = ret.originalInvoiceNumber?.toLowerCase().includes(q) || false;
        const matchesSupp = ret.supplierName?.toLowerCase().includes(q) || false;
        const matchesPhone = ret.supplierPhone?.toLowerCase().includes(q) || false;
        const matchesItem = ret.items?.some(it => it.materialName?.toLowerCase().includes(q)) || false;
        const matchesNotes = ret.notes?.toLowerCase().includes(q) || false;
        if (!matchesNum && !matchesInv && !matchesSupp && !matchesPhone && !matchesItem && !matchesNotes) {
          return false;
        }
      }

      if (supplierFilter !== 'all' && ret.supplierId !== supplierFilter) {
        return false;
      }

      if (dateFrom && ret.date < dateFrom) return false;
      if (dateTo && ret.date > dateTo) return false;

      return true;
    });
  }, [purchaseReturns, searchTerm, supplierFilter, dateFrom, dateTo]);

  // Aggregate Metrics for Returns
  const returnMetrics = useMemo(() => {
    const totalReturnsValue = filteredReturns.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);
    const totalReturnsCount = filteredReturns.length;
    const creditDeductionTotal = filteredReturns
      .filter(r => r.refundMethod === 'credit_deduction')
      .reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);
    const cashBankRefundTotal = filteredReturns
      .filter(r => r.refundMethod === 'cash' || r.refundMethod === 'bank')
      .reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);
    const totalUnitsReturned = filteredReturns.reduce(
      (sum, r) => sum + r.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0),
      0
    );

    const returnRate = invoiceMetrics.totalPurchasesValue > 0
      ? (totalReturnsValue / invoiceMetrics.totalPurchasesValue) * 100
      : 0;

    return {
      totalReturnsValue: Math.round(totalReturnsValue * 100) / 100,
      totalReturnsCount,
      creditDeductionTotal: Math.round(creditDeductionTotal * 100) / 100,
      cashBankRefundTotal: Math.round(cashBankRefundTotal * 100) / 100,
      totalUnitsReturned: Math.round(totalUnitsReturned * 100) / 100,
      returnRate: Math.round(returnRate * 10) / 10
    };
  }, [filteredReturns, invoiceMetrics.totalPurchasesValue]);

  // Invoices Handlers
  const handleSaveInvoice = (savedInv: PurchaseInvoice) => {
    if (editingInvoice) {
      updatePurchase(savedInv);
      notifySuccess(
        `تم تحديث فاتورة الشراء (${savedInv.invoiceNumber}) وترحيل القيد المحاسبي بنجاح`,
        'إدارة المشتريات'
      );
    } else {
      addPurchase(savedInv);
      notifySuccess(
        `تم تسجيل فاتورة الشراء (${savedInv.invoiceNumber}) وإثبات القيد الآلي وتحديث المخزن بنجاح`,
        'إدارة المشتريات'
      );
    }
    loadData();
    setIsInvoiceFormOpen(false);
    setEditingInvoice(null);
  };

  const handleDeleteInvoiceConfirm = () => {
    if (!confirmDeleteInvoiceConfig.invoice) return;
    deletePurchase(confirmDeleteInvoiceConfig.invoice.id);
    notifyInfo(
      `تم حذف فاتورة الشراء رقم ${confirmDeleteInvoiceConfig.invoice.invoiceNumber}`,
      'إدارة المشتريات'
    );
    setConfirmDeleteInvoiceConfig({ isOpen: false, invoice: null });
    loadData();
  };

  // Returns Handlers
  const handleSaveReturn = async (savedRet: PurchaseReturn) => {
    if (editingReturn) {
      await updatePurchaseReturn(savedRet);
      notifySuccess(
        `تم تحديث إذن مردودات المشتريات (${savedRet.returnNumber}) وإعادة احتساب القيد والمخزن`,
        'مردودات المشتريات'
      );
    } else {
      await addPurchaseReturn(savedRet);
      notifySuccess(
        `تم تسجيل إذن المرتجع (${savedRet.returnNumber}) وخصم كميات المخزن وترحيل القيد المحاسبي بنجاح`,
        'مردودات المشتريات'
      );
    }
    loadData();
    setIsReturnFormOpen(false);
    setEditingReturn(null);
    setReturnInitialInvoice(null);
  };

  const handleDeleteReturnConfirm = () => {
    if (!confirmDeleteReturnConfig.returnRecord) return;
    deletePurchaseReturn(confirmDeleteReturnConfig.returnRecord.id);
    notifyInfo(
      `تم حذف إذن المرتجع رقم ${confirmDeleteReturnConfig.returnRecord.returnNumber}`,
      'مردودات المشتريات'
    );
    setConfirmDeleteReturnConfig({ isOpen: false, returnRecord: null });
    loadData();
  };

  const handleOpenCreateReturnForInvoice = (invoice: PurchaseInvoice) => {
    setReturnInitialInvoice(invoice);
    setEditingReturn(null);
    setIsReturnFormOpen(true);
  };

  // Badges
  const getStatusBadge = (status: PurchasePaymentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>مدفوع بالكامل</span>
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
            <span>آجل / غير مسدد</span>
          </span>
        );
    }
  };

  const getReceiptBadge = (status?: PurchaseReceiptStatus) => {
    switch (status) {
      case 'received':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            <span>تم الاستلام بالمخزن</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>قيد التوريد والشحن</span>
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Truck className="w-3 h-3 text-amber-600" />
            <span>استلام جزئي</span>
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method: PurchasePaymentMethod) => {
    switch (method) {
      case 'cash':
        return <span className="text-slate-600 font-bold">نقداً (خزينة)</span>;
      case 'bank':
        return <span className="text-blue-700 font-bold">تحويل بنكي</span>;
      case 'credit':
        return <span className="text-purple-700 font-bold">آجل (مورد)</span>;
      case 'cheque':
        return <span className="text-amber-700 font-bold">شيك مصرفي</span>;
      default:
        return <span>{method}</span>;
    }
  };

  const getReturnReasonBadge = (reason: PurchaseReturnReason) => {
    switch (reason) {
      case 'defective':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>عيوب نسيج / تالف</span>
          </span>
        );
      case 'wrong_spec':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span>مواصفات غير مطابقة</span>
          </span>
        );
      case 'wrong_color':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <span>اختلاف الصباغة واللون</span>
          </span>
        );
      case 'surplus':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <span>فائض عن حاجة التشغيل</span>
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>تأخر بالتوريد</span>
          </span>
        );
      case 'damaged':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <span>تلفيات شحن وتفريغ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>سبب آخر</span>
          </span>
        );
    }
  };

  const getRefundMethodBadge = (method: PurchaseReturnRefundMethod) => {
    switch (method) {
      case 'credit_deduction':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span>خصم من رصيد المورد</span>
          </span>
        );
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>استرداد نقدي بالخزينة</span>
          </span>
        );
      case 'bank':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span>تحويل بنكي مسترد</span>
          </span>
        );
      default:
        return <span className="text-slate-600 font-bold">{method}</span>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner & Header (Exact match to Sales Dashboard styling) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-300">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black">إدارة المشتريات وتوريدات الخامات</h2>
                  <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                    منظومة توريد الأقمشة والإكسسوارات ومستلزمات الإنتاج
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  تسجيل فواتير الشراء وإثبات القيود الآلية ومتابعة ذمم الموردين ومردودات المشتريات
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
                <BookOpen className="w-4 h-4 text-indigo-300" />
                <span>دفتر قيود المشتريات</span>
              </button>
            )}

            {onNavigateToWarehouse && (
              <button
                type="button"
                onClick={onNavigateToWarehouse}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-xs"
              >
                <Boxes className="w-4 h-4 text-emerald-300" />
                <span>مخزن الخامات والمستلزمات</span>
              </button>
            )}

            {onNavigateToTreasury && (
              <button
                type="button"
                onClick={onNavigateToTreasury}
                className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>سداد مورد (الخزينة)</span>
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
              <span>تسجيل مرتجع مشتريات</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingInvoice(null);
                setIsInvoiceFormOpen(true);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>فاتورة مشتريات جديدة</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (فواتير المشتريات vs مرتجعات المشتريات) */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMainTab('invoices')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mainTab === 'invoices'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>فواتير المشتريات ({purchases.length})</span>
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
            <span>مرتجعات ومردودات المشتريات ({purchaseReturns.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards (5 Cards matching Sales Dashboard) */}
      {mainTab === 'invoices' ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Purchases Value */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">إجمالي المشتريات</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                <SensitiveDataMask
                  dataKey="materials.view_prices"
                  value={`${invoiceMetrics.totalPurchasesValue.toLocaleString('ar-EG')} ج.م`}
                />
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Paid Cash & Bank */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">المسدد للموردين</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                <SensitiveDataMask
                  dataKey="materials.view_prices"
                  value={`${invoiceMetrics.totalPaidAmount.toLocaleString('ar-EG')} ج.م`}
                />
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Remaining Payables */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">المستحق للموردين (الآجل)</p>
              <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                <SensitiveDataMask
                  dataKey="materials.view_prices"
                  value={`${invoiceMetrics.totalRemainingAmount.toLocaleString('ar-EG')} ج.م`}
                />
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Invoices and Raw Materials Count */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">الفواتير والكميات الواردة</p>
              <p className="text-xl sm:text-2xl font-black text-indigo-700 mt-1">
                {invoiceMetrics.totalItemsQuantity.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-slate-400">وحدة/كجم</span>
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                {invoiceMetrics.totalInvoicesCount} فاتورة شراء
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          {/* Payment Rate */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 col-span-2 md:col-span-1 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">نسبة سداد المشتريات</p>
              <p className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
                {invoiceMetrics.paymentRate}%
              </p>
              <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, invoiceMetrics.paymentRate)}%` }}
                />
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      ) : (
        /* Returns KPI Cards */
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Returns Value */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">إجمالي المردودات للموردين</p>
              <p className="text-xl sm:text-2xl font-black text-orange-600 mt-1">
                {returnMetrics.totalReturnsValue.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-slate-400">ج.م</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>

          {/* Credit Deductions */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">مخصوم من رصيد الموردين</p>
              <p className="text-xl sm:text-2xl font-black text-purple-700 mt-1">
                {returnMetrics.creditDeductionTotal.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-purple-400">ج.م</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
          </div>

          {/* Cash/Bank Refunds */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">مسترد نقداً وبنكياً</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {returnMetrics.cashBankRefundTotal.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-emerald-400">ج.م</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Returned Units & Returns count */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">أذون وكميات المرتجع</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {returnMetrics.totalUnitsReturned.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-slate-400">وحدة</span>
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                {returnMetrics.totalReturnsCount} إذن ارتجاع
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          {/* Return Rate */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 col-span-2 md:col-span-1 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">نسبة المردودات من المشتريات</p>
              <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                {returnMetrics.returnRate}%
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                مؤشر جودة الخامات الموردة
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Filter Toolbar (Exact match to Sales Dashboard) */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-3">
        {/* Row 1: Search, Supplier, Statuses, Payment Method, View Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={
                mainTab === 'invoices'
                  ? 'بحث برقم الفاتورة، اسم المورد، هاتف، خامة...'
                  : 'بحث برقم إذن المرتجع، الفاتورة، المورد، الخامة...'
              }
              className="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-bold"
            />
          </div>

          {/* Supplier Filter */}
          <div>
            <select
              value={supplierFilter}
              onChange={e => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white font-bold cursor-pointer"
            >
              <option value="all">كافة الموردين ({uniqueSuppliers.length})</option>
              {uniqueSuppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter (for invoices) */}
          {mainTab === 'invoices' && (
            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white font-bold cursor-pointer"
              >
                <option value="all">كافة حالات السداد</option>
                <option value="paid">مدفوع بالكامل</option>
                <option value="partial">سداد جزئي</option>
                <option value="unpaid">آجل / غير مسدد</option>
              </select>
            </div>
          )}

          {/* Receipt / Delivery Status (for invoices) */}
          {mainTab === 'invoices' && (
            <div>
              <select
                value={receiptFilter}
                onChange={e => setReceiptFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white font-bold cursor-pointer"
              >
                <option value="all">كافة حالات الاستلام</option>
                <option value="received">تم الاستلام بالمخزن</option>
                <option value="pending">قيد التوريد والشحن</option>
                <option value="partial">استلام جزئي</option>
              </select>
            </div>
          )}

          {/* Payment Method Filter */}
          {mainTab === 'invoices' && (
            <div>
              <select
                value={paymentMethodFilter}
                onChange={e => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white font-bold cursor-pointer"
              >
                <option value="all">طرق السداد</option>
                <option value="cash">نقداً (خزينة)</option>
                <option value="bank">تحويل بنكي</option>
                <option value="credit">آجل مورد</option>
                <option value="cheque">شيك</option>
              </select>
            </div>
          )}

          {/* View Mode Toggle: Table or Cards */}
          <div className="flex items-center justify-end gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="عرض جدول"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">جدول</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="عرض بطاقات"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">بطاقات</span>
            </button>
          </div>
        </div>

        {/* Row 2: Quick Period Presets (Factory Weekly Cycles: Saturday-Friday) */}
        <div className="flex flex-wrap items-center justify-between pt-3 mt-3 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-slate-400 font-medium">فترات العمل:</span>
            <button
              type="button"
              onClick={() => applyPeriodPreset('this_week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                periodPreset === 'this_week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <span>هذا الأسبوع (أسبوع المصنع)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('last_week')}
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
              onClick={() => applyPeriodPreset('today')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
              }`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('this_month')}
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
              onClick={() => applyPeriodPreset('this_quarter')}
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
              onClick={() => applyPeriodPreset('this_year')}
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
              onClick={() => applyPeriodPreset('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'all' && !dateFrom && !dateTo
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
              }`}
            >
              كافة الفترات
            </button>
          </div>

          {/* Date Pickers */}
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
              className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium"
            />
            <span>إلى:</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => {
                setDateTo(e.target.value);
                setPeriodPreset('custom');
              }}
              className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium"
            />

            {(dateFrom || dateTo || searchTerm || supplierFilter !== 'all' || statusFilter !== 'all' || receiptFilter !== 'all' || paymentMethodFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSupplierFilter('all');
                  setStatusFilter('all');
                  setReceiptFilter('all');
                  setPaymentMethodFilter('all');
                  setDateFrom('');
                  setDateTo('');
                  setPeriodPreset('all');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold transition-colors cursor-pointer mr-2"
              >
                إعادة ضبط الفلاتر
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT DISPLAY */}
      {mainTab === 'invoices' ? (
        /* INVOICES SECTION */
        viewMode === 'table' ? (
          /* Table View for Invoices */
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold border-b border-slate-700">
                    <th className="p-3 w-10 text-center"></th>
                    <th className="p-3 min-w-[130px]">رقم الفاتورة</th>
                    <th className="p-3 min-w-[100px]">تاريخ التوريد</th>
                    <th className="p-3 min-w-[180px]">المورد</th>
                    <th className="p-3 min-w-[100px]">طريقة السداد</th>
                    <th className="p-3 min-w-[110px]">حالة السداد</th>
                    <th className="p-3 min-w-[110px]">حالة الاستلام</th>
                    <th className="p-3 min-w-[110px] text-left">إجمالي الفاتورة</th>
                    <th className="p-3 min-w-[100px] text-left">المسدد</th>
                    <th className="p-3 min-w-[100px] text-left">المتبقي الآجل</th>
                    <th className="p-3 min-w-[120px] text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                        <p className="font-bold text-sm">لا توجد فواتير مشتريات تطابق البحث أو الفلترة المحددة</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => {
                      const isExpanded = expandedInvoiceId === inv.id;
                      return (
                        <React.Fragment key={inv.id}>
                          <tr className="hover:bg-slate-50/80 transition-colors group">
                            {/* Expand row */}
                            <td className="p-3 text-center">
                              <button
                                onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                                className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>

                            {/* Invoice Number */}
                            <td className="p-3 font-mono font-black text-indigo-900">
                              <div className="flex items-center gap-1.5">
                                <span>{inv.invoiceNumber}</span>
                                {inv.referenceNumber && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500 font-normal">
                                    {inv.referenceNumber}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="p-3 text-slate-600 font-mono">
                              {inv.date}
                            </td>

                            {/* Supplier */}
                            <td className="p-3">
                              <div className="font-bold text-slate-800">{inv.supplierName}</div>
                              {inv.supplierPhone && (
                                <div className="text-[11px] text-slate-400 font-mono">{inv.supplierPhone}</div>
                              )}
                            </td>

                            {/* Payment Method */}
                            <td className="p-3">
                              {getPaymentMethodBadge(inv.paymentMethod)}
                            </td>

                            {/* Payment Status */}
                            <td className="p-3">
                              {getStatusBadge(inv.paymentStatus)}
                            </td>

                            {/* Receipt Status */}
                            <td className="p-3">
                              {getReceiptBadge(inv.receiptStatus)}
                            </td>

                            {/* Grand Total */}
                            <td className="p-3 text-left font-mono font-black text-slate-900 text-sm">
                              <SensitiveDataMask
                                dataKey="materials.view_prices"
                                value={`${Number(inv.grandTotal).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`}
                                compact
                              />
                            </td>

                            {/* Paid */}
                            <td className="p-3 text-left font-mono font-bold text-emerald-600">
                              <SensitiveDataMask
                                dataKey="materials.view_prices"
                                value={Number(inv.paidAmount).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                                compact
                              />
                            </td>

                            {/* Remaining */}
                            <td className="p-3 text-left font-mono font-bold text-rose-600">
                              <SensitiveDataMask
                                dataKey="materials.view_prices"
                                value={Number(inv.remainingAmount).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                                compact
                              />
                            </td>

                            {/* Actions */}
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingInvoice(inv)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="عرض تفاصيل الفاتورة"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenCreateReturnForInvoice(inv)}
                                  className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                  title="تسجيل مرتجع لهذه الفاتورة"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingInvoice(inv);
                                    setIsInvoiceFormOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="تعديل الفاتورة"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteInvoiceConfig({ isOpen: true, invoice: inv })}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="حذف الفاتورة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Items Preview Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90 border-b border-slate-200">
                              <td colSpan={11} className="p-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                                      <Boxes className="w-4 h-4 text-indigo-600" />
                                      <span>الخامات والمستلزمات الواردة بالفاتورة ({inv.items?.length || 0} صنف):</span>
                                    </span>
                                    {inv.notes && (
                                      <span className="text-xs text-slate-500 italic font-medium">
                                        ملاحظات: {inv.notes}
                                      </span>
                                    )}
                                  </div>

                                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                                    <table className="w-full text-right text-xs">
                                      <thead>
                                        <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                          <th className="p-2">اسم الخامة</th>
                                          <th className="p-2 text-center">النوع</th>
                                          <th className="p-2 text-center">الوحدة</th>
                                          <th className="p-2 text-center">الكمية</th>
                                          <th className="p-2 text-left">سعر الوحدة</th>
                                          <th className="p-2 text-left">الإجمالي</th>
                                          <th className="p-2">ملاحظات</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {(inv.items || []).map((it, idx) => (
                                          <tr key={idx} className="hover:bg-slate-50">
                                            <td className="p-2 font-bold text-slate-800">{it.materialName}</td>
                                            <td className="p-2 text-center text-[10px] text-slate-500">
                                              {it.materialType === 'fabric' ? 'قماش' : 'إكسسوار'}
                                            </td>
                                            <td className="p-2 text-center text-slate-500">{it.unit}</td>
                                            <td className="p-2 text-center font-bold font-mono text-indigo-700">
                                              {it.quantity}
                                            </td>
                                            <td className="p-2 text-left font-mono">
                                              {Number(it.unitPrice).toLocaleString('ar-EG')} ج.م
                                            </td>
                                            <td className="p-2 text-left font-mono font-bold text-slate-900">
                                              {Number(it.total).toLocaleString('ar-EG')} ج.م
                                            </td>
                                            <td className="p-2 text-slate-400 text-[11px]">{it.notes || '-'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards View for Invoices */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvoices.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                <p className="font-bold text-sm">لا توجد فواتير مشتريات تطابق البحث أو الفلترة</p>
              </div>
            ) : (
              filteredInvoices.map(inv => (
                <div
                  key={inv.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Invoice # and Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-base font-black font-mono text-indigo-900 block">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{inv.date}</span>
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(inv.paymentStatus)}
                        {getReceiptBadge(inv.receiptStatus)}
                      </div>
                    </div>

                    {/* Supplier info */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="truncate">{inv.supplierName}</span>
                      </div>
                      {inv.supplierPhone && (
                        <p className="text-[11px] text-slate-500 font-mono">{inv.supplierPhone}</p>
                      )}
                    </div>

                    {/* Financial summary breakdown */}
                    <div className="space-y-1.5 text-xs font-bold pt-1 border-t border-slate-100">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>إجمالي الفاتورة:</span>
                        <span className="font-mono text-sm font-black text-slate-900">
                          {Number(inv.grandTotal).toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>المسدد:</span>
                        <span className="font-mono">
                          {Number(inv.paidAmount).toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-rose-600">
                        <span>المتبقي الآجل:</span>
                        <span className="font-mono">
                          {Number(inv.remainingAmount).toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    </div>

                    {/* Items Count and Summary */}
                    <div className="text-[11px] text-slate-500 bg-indigo-50/50 p-2 rounded-lg flex items-center justify-between">
                      <span className="font-bold">عدد الأصناف: {inv.items?.length || 0} صنف</span>
                      <span className="font-bold text-indigo-700">طريقة السداد: {inv.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateReturnForInvoice(inv)}
                      className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-orange-200 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                      <span>إرجاع</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingInvoice(inv)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInvoice(inv);
                          setIsInvoiceFormOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteInvoiceConfig({ isOpen: true, invoice: inv })}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      ) : (
        /* RETURNS SECTION */
        viewMode === 'table' ? (
          /* Table View for Purchase Returns */
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold border-b border-slate-700">
                    <th className="p-3 min-w-[130px]">رقم إذن المرتجع</th>
                    <th className="p-3 min-w-[100px]">تاريخ الارتجاع</th>
                    <th className="p-3 min-w-[180px]">المورد</th>
                    <th className="p-3 min-w-[130px]">فاتورة الشراء الأصلية</th>
                    <th className="p-3 min-w-[130px]">طريقة التسوية المالية</th>
                    <th className="p-3 min-w-[110px]">حالة المخزون</th>
                    <th className="p-3 min-w-[110px] text-left">قيمة المرتجع</th>
                    <th className="p-3 min-w-[100px] text-center">عدد الأصناف</th>
                    <th className="p-3 min-w-[100px] text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        <RotateCcw className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                        <p className="font-bold text-sm">لا توجد أذون مردودات مشتريات مسجلة تطابق البحث</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map(ret => (
                      <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Return Number */}
                        <td className="p-3 font-mono font-black text-orange-900">
                          {ret.returnNumber}
                        </td>

                        {/* Date */}
                        <td className="p-3 text-slate-600 font-mono">
                          {ret.date}
                        </td>

                        {/* Supplier */}
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{ret.supplierName}</div>
                          {ret.supplierPhone && (
                            <div className="text-[11px] text-slate-400 font-mono">{ret.supplierPhone}</div>
                          )}
                        </td>

                        {/* Original Invoice */}
                        <td className="p-3 font-mono font-bold text-indigo-700">
                          {ret.originalInvoiceNumber}
                        </td>

                        {/* Refund Method */}
                        <td className="p-3">
                          {getRefundMethodBadge(ret.refundMethod)}
                        </td>

                        {/* Stock Returned */}
                        <td className="p-3">
                          {ret.stockReturned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              <span>مخصوم من المخزن</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                              لم يتم الخصم
                            </span>
                          )}
                        </td>

                        {/* Grand Total */}
                        <td className="p-3 text-left font-mono font-black text-orange-700 text-sm">
                          {Number(ret.grandTotal).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}{' '}
                          <span className="text-[10px] font-normal text-slate-400">ج.م</span>
                        </td>

                        {/* Items Count */}
                        <td className="p-3 text-center font-bold text-slate-700">
                          {ret.items.length} صنف (
                          {ret.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)} وحدة)
                        </td>

                        {/* Actions */}
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingReturn(ret)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="عرض تفاصيل إذن المرتجع"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingReturn(ret);
                                setIsReturnFormOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="تعديل إذن المرتجع"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteReturnConfig({ isOpen: true, returnRecord: ret })}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف إذن المرتجع"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards View for Purchase Returns */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReturns.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <RotateCcw className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                <p className="font-bold text-sm">لا توجد أذون مردودات مشتريات مسجلة</p>
              </div>
            ) : (
              filteredReturns.map(ret => (
                <div
                  key={ret.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-base font-black font-mono text-orange-900 block">
                          {ret.returnNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{ret.date}</span>
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getRefundMethodBadge(ret.refundMethod)}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>{ret.supplierName}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        فاتورة الشراء: <strong className="text-indigo-700 font-mono">{ret.originalInvoiceNumber}</strong>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 text-xs flex justify-between items-center font-bold">
                      <span className="text-orange-950">صافي قيمة المرتجع:</span>
                      <span className="text-base font-black font-mono text-orange-700">
                        {Number(ret.grandTotal).toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>الأصناف المرتجعة:</span>
                        <span className="font-bold">{ret.items.length} صنف</span>
                      </div>
                      {ret.returnReasonGeneral && (
                        <p className="text-slate-600 italic truncate">
                          السبب: {ret.returnReasonGeneral}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingReturn(ret)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReturn(ret);
                        setIsReturnFormOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteReturnConfig({ isOpen: true, returnRecord: ret })}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      )}

      {/* --- ALL MODALS --- */}

      {/* Purchase Invoice Form Modal */}
      {isInvoiceFormOpen && (
        <PurchaseInvoiceFormModal
          invoice={editingInvoice}
          onClose={() => {
            setIsInvoiceFormOpen(false);
            setEditingInvoice(null);
          }}
          onSave={handleSaveInvoice}
          onNavigateToAccounting={onNavigateToAccounting}
        />
      )}

      {/* Purchase Invoice Details Modal */}
      {viewingInvoice && (
        <PurchaseInvoiceDetailsModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onEdit={inv => {
            setViewingInvoice(null);
            setEditingInvoice(inv);
            setIsInvoiceFormOpen(true);
          }}
        />
      )}

      {/* Purchase Return Form Modal */}
      {isReturnFormOpen && (
        <PurchaseReturnFormModal
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

      {/* Purchase Return Details Modal */}
      {viewingReturn && (
        <PurchaseReturnDetailsModal
          purchaseReturn={viewingReturn}
          onClose={() => setViewingReturn(null)}
          onNavigateToJournal={onNavigateToJournal}
        />
      )}

      {/* Quick Add Supplier Modal */}
      {showQuickSupplierModal && (
        <QuickAddSupplierModal
          onClose={() => setShowQuickSupplierModal(false)}
          onSuccess={supplier => {
            setShowQuickSupplierModal(false);
            notifySuccess(`تم إضافة المورد (${supplier.name}) بنجاح`, 'الموردون');
            loadData();
          }}
        />
      )}

      {/* Quick Add Material Modal */}
      {showQuickMaterialModal && (
        <QuickAddMaterialModal
          onClose={() => setShowQuickMaterialModal(false)}
          onSuccess={material => {
            setShowQuickMaterialModal(false);
            notifySuccess(`تم إضافة الخامة (${material.name}) بنجاح`, 'دليل الخامات');
            loadData();
          }}
        />
      )}

      {/* Confirm Delete Invoice Modal */}
      {confirmDeleteInvoiceConfig.isOpen && confirmDeleteInvoiceConfig.invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">تأكيد حذف فاتورة الشراء</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من حذف فاتورة الشراء رقم{' '}
              <strong className="text-slate-900 font-mono">
                {confirmDeleteInvoiceConfig.invoice.invoiceNumber}
              </strong>{' '}
              للمورد{' '}
              <strong className="text-slate-900">
                {confirmDeleteInvoiceConfig.invoice.supplierName}
              </strong>
              ؟ سيتم حذف حركات القيد المحاسبي والمخزن المرتبطة بها.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteInvoiceConfig({ isOpen: false, invoice: null })}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteInvoiceConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer shadow-md"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Return Modal */}
      {confirmDeleteReturnConfig.isOpen && confirmDeleteReturnConfig.returnRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">تأكيد حذف إذن المرتجع</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من حذف إذن مردودات المشتريات رقم{' '}
              <strong className="text-slate-900 font-mono">
                {confirmDeleteReturnConfig.returnRecord.returnNumber}
              </strong>{' '}
              للمورد{' '}
              <strong className="text-slate-900">
                {confirmDeleteReturnConfig.returnRecord.supplierName}
              </strong>
              ؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteReturnConfig({ isOpen: false, returnRecord: null })}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteReturnConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer shadow-md"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default PurchasesDashboard;
