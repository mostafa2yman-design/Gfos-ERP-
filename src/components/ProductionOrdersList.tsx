import React, { useState, useEffect } from 'react';
import { getOrders } from '../lib/storage';
import { ProductionOrder } from '../types';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { 
  Search, 
  Edit, 
  Eye, 
  Filter, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Scissors, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  LayoutGrid, 
  List, 
  Calendar, 
  User, 
  Tag, 
  Activity, 
  Check, 
  Shirt, 
  Boxes, 
  Package, 
  Sparkles, 
  ExternalLink,
  Info,
  Building2,
  Users,
  Flame,
  PackageCheck,
  Barcode
} from 'lucide-react';
import * as Cmd from '../lib/productionOrderCommands';
import { getDefaultTabForStatus } from '../lib/orderWorkflow';
import { getPeriodDateRange } from '../lib/periodUtils';

interface ProductionOrdersListProps {
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onNavigateToOrder?: (orderId: string, tab?: string) => void;
}

interface StageStep {
  name: string;
  tab: string;
  status: 'completed' | 'in_progress' | 'ready' | 'pending' | 'draft';
  label: string;
  approver?: string;
  approvedAt?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function ProductionOrdersList({ onEdit, onView, onNavigateToOrder }: ProductionOrdersListProps) {
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [periodPreset, setPeriodPreset] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const applyPeriodPreset = (preset: string) => {
    setPeriodPreset(preset);
    const range = getPeriodDateRange(preset);
    setDateFrom(range.startDate);
    setDateTo(range.endDate);
  };
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
  const [toastConfig, setToastConfig] = useState<{message: string, type: "success" | "error" | "info"} | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const data = await getOrders();
    setOrders(data);
  };

  const handleDelete = async (order: ProductionOrder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!hasPermission('production.delete')) {
      setToastConfig({ message: 'عفواً، لا تملك صلاحية حذف أوامر الإنتاج. يرجى مراجعة مدير النظام.', type: "error" });
      return;
    }
    setConfirmConfig({
      isOpen: true,
      message: `هل أنت متأكد من حذف أمر الإنتاج ${order.orderNumber} نهائياً؟`,
      onConfirm: async () => {
        const result = await Cmd.deleteProductionOrder(order);
        if (result.success) {
          setConfirmConfig(null);
          setToastConfig({ message: `تم حذف الأمر ${order.orderNumber} بنجاح`, type: "success" });
          loadOrders();
        } else {
          setConfirmConfig(null);
          setToastConfig({ message: result.error || "حدث خطأ أثناء الحذف", type: "error" });
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  const handleTrackOrder = (orderId: string, tab: string = 'production', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onNavigateToOrder) {
      onNavigateToOrder(orderId, tab);
    } else {
      onView(orderId);
    }
  };

  const toggleExpandOrder = (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // Helper calculations for an order
  const getOrderMetrics = (order: ProductionOrder) => {
    const requiredTotal = (order.sizes || []).reduce((sum, size) => 
      sum + (size.variants || []).reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0)
    , 0);

    let actualCutTotal = 0;
    if (order.cutData?.sizes) {
      order.cutData.sizes.forEach(s => s.variants.forEach(v => actualCutTotal += (Number(v.actualQuantity) || 0)));
    }

    const batchCount = order.batches?.length || 0;
    let distributedBatchTotal = 0;
    let preppedBatchesCount = 0;
    let printedBatchesCount = 0;
    let sewnBatchesCount = 0;

    (order.batches || []).forEach(b => {
      let bSum = 0;
      b.sizes.forEach(s => s.variants.forEach(v => bSum += (Number(v.quantity) || 0)));
      distributedBatchTotal += bSum;
      if (b.prepStatus === 'مكتمل') preppedBatchesCount++;
      if (b.printEmbroideryStatus === 'مكتمل') printedBatchesCount++;
      if (b.sewingData?.status === 'مكتمل') sewnBatchesCount++;
    });

    const cutPercentage = requiredTotal > 0 ? Math.round((actualCutTotal / requiredTotal) * 100) : 0;
    const cutDifference = actualCutTotal - requiredTotal;

    return {
      requiredTotal,
      actualCutTotal,
      cutPercentage,
      cutDifference,
      batchCount,
      distributedBatchTotal,
      preppedBatchesCount,
      printedBatchesCount,
      sewnBatchesCount
    };
  };

  // Build the 8-stage execution pipeline for any order
  const getOrderStages = (order: ProductionOrder): StageStep[] => {
    const metrics = getOrderMetrics(order);

    // 1. أمر الإنتاج
    const prodStatus: StageStep['status'] = order.productionApprovedBy 
      ? 'completed' 
      : (order.status === 'مسودة' ? 'draft' : 'in_progress');

    // 2. أمر القص
    const cutStatus: StageStep['status'] = order.cutApprovedBy 
      ? 'completed' 
      : (metrics.actualCutTotal > 0 || order.cutData?.cutterName ? 'in_progress' : (order.productionApprovedBy ? 'ready' : 'pending'));

    // 3. تقسيم الباتشات
    const batchesStatus: StageStep['status'] = order.batchesLockedBy 
      ? 'completed' 
      : (metrics.batchCount > 0 ? 'in_progress' : (order.cutApprovedBy ? 'ready' : 'pending'));

    // 4. التجهيز
    const prepStatus: StageStep['status'] = order.prepApprovedBy 
      ? 'completed' 
      : (order.batches?.some(b => b.prepStatus === 'جاري' || b.prepStatus === 'مكتمل') ? 'in_progress' : (order.batchesLockedBy ? 'ready' : 'pending'));

    // 5. الطباعة والتطريز
    const printStatus: StageStep['status'] = order.printEmbroideryApprovedBy 
      ? 'completed' 
      : (order.batches?.some(b => b.printEmbroideryStatus === 'جاري' || b.printEmbroideryStatus === 'مكتمل') ? 'in_progress' : (order.batchesLockedBy ? 'ready' : 'pending'));

    // 6. الخياطة
    const sewStatus: StageStep['status'] = order.sewingApprovedBy 
      ? 'completed' 
      : (order.batches?.some(b => b.sewingData?.status === 'جاري' || b.sewingData?.status === 'مكتمل') ? 'in_progress' : (order.batchesLockedBy ? 'ready' : 'pending'));

    // 7. التشطيب
    const finishStatus: StageStep['status'] = order.finishingApprovedBy
      ? 'completed'
      : (order.batches?.some(b => b.finishingData?.status === 'جاري' || b.finishingData?.status === 'مكتمل') ? 'in_progress' : (order.sewingApprovedBy ? 'ready' : 'pending'));

    // 8. المكواة
    const ironingStatus: StageStep['status'] = order.ironingApprovedBy
      ? 'completed'
      : (order.batches?.some(b => b.ironingData?.status === 'جاري' || b.ironingData?.status === 'مكتمل') ? 'in_progress' : (order.finishingApprovedBy ? 'ready' : 'pending'));

    // 9. التغليف
    const packStatus: StageStep['status'] = order.packingApprovedBy || order.packingStatus === 'مكتمل'
      ? 'completed'
      : (order.packingInvoices && order.packingInvoices.length > 0 ? 'in_progress' : (order.ironingApprovedBy ? 'ready' : 'pending'));

    // 10. المخزن التام
    const warehouseStatus: StageStep['status'] = order.status === 'مغلق'
      ? 'completed'
      : (order.packingApprovedBy ? 'ready' : 'pending');

    return [
      { 
        name: 'أمر الإنتاج', 
        tab: 'production', 
        status: prodStatus, 
        label: prodStatus === 'completed' ? 'معتمد' : prodStatus === 'draft' ? 'مسودة' : 'قيد المراجعة',
        approver: order.productionApprovedBy,
        approvedAt: order.productionApprovedAt,
        icon: FileText
      },
      { 
        name: 'القص', 
        tab: 'cut', 
        status: cutStatus, 
        label: cutStatus === 'completed' ? 'معتمد' : cutStatus === 'in_progress' ? 'جاري القص' : 'بالانتظار',
        approver: order.cutApprovedBy,
        approvedAt: order.cutApprovedAt,
        icon: Scissors
      },
      { 
        name: 'الباتشات', 
        tab: 'batches', 
        status: batchesStatus, 
        label: batchesStatus === 'completed' ? 'مثبتة' : batchesStatus === 'in_progress' ? 'قيد التقسيم' : 'بالانتظار',
        approver: order.batchesLockedBy,
        approvedAt: order.batchesLockedAt,
        icon: Layers
      },
      { 
        name: 'التجهيز', 
        tab: 'prep', 
        status: prepStatus, 
        label: prepStatus === 'completed' ? 'مكتمل' : prepStatus === 'in_progress' ? 'جاري' : 'بالانتظار',
        approver: order.prepApprovedBy,
        approvedAt: order.prepApprovedAt,
        icon: Boxes
      },
      { 
        name: 'الطباعة', 
        tab: 'print', 
        status: printStatus, 
        label: printStatus === 'completed' ? 'مكتمل' : printStatus === 'in_progress' ? 'جاري' : 'بالانتظار',
        approver: order.printEmbroideryApprovedBy,
        approvedAt: order.printEmbroideryApprovedAt,
        icon: Sparkles
      },
      { 
        name: 'الخياطة', 
        tab: 'sew', 
        status: sewStatus, 
        label: sewStatus === 'completed' ? 'مكتملة' : sewStatus === 'in_progress' ? 'جارية' : 'بالانتظار',
        approver: order.sewingApprovedBy,
        approvedAt: order.sewingApprovedAt,
        icon: Shirt
      },
      { 
        name: 'التشطيب', 
        tab: 'finish', 
        status: finishStatus, 
        label: finishStatus === 'completed' ? 'مكتمل' : finishStatus === 'in_progress' ? 'جاري' : 'بالانتظار',
        approver: order.finishingApprovedBy,
        approvedAt: order.finishingApprovedAt,
        icon: CheckCircle2
      },
      { 
        name: 'المكواة', 
        tab: 'ironing', 
        status: ironingStatus, 
        label: ironingStatus === 'completed' ? 'مكتمل' : ironingStatus === 'in_progress' ? 'جاري' : 'بالانتظار',
        approver: order.ironingApprovedBy,
        approvedAt: order.ironingApprovedAt,
        icon: Flame
      },
      { 
        name: 'التغليف', 
        tab: 'packing', 
        status: packStatus, 
        label: packStatus === 'completed' ? 'معتمد' : packStatus === 'in_progress' ? 'جاري الفوترة' : 'بالانتظار',
        approver: order.packingApprovedBy,
        approvedAt: order.packingApprovedAt,
        icon: Package
      },
      { 
        name: 'المخزن', 
        tab: 'warehouse', 
        status: warehouseStatus, 
        label: warehouseStatus === 'completed' ? 'مغلق' : warehouseStatus === 'ready' ? 'جاهز للتوريد' : 'بالانتظار',
        approver: order.packingApprovedBy,
        approvedAt: order.packingApprovedAt,
        icon: PackageCheck
      }
    ];
  };

  // Helper to get the current active stage tab of an order when clicked directly
  const getOrderCurrentActiveStageTab = (order: ProductionOrder): string => {
    const stages = getOrderStages(order);
    // Find the latest in-progress stage
    const inProgress = stages.slice().reverse().find(s => s.status === 'in_progress');
    if (inProgress) return inProgress.tab;

    // Find the first ready stage to start
    const ready = stages.find(s => s.status === 'ready');
    if (ready) return ready.tab;

    // If all completed, return warehouse
    if (stages.every(s => s.status === 'completed')) return 'warehouse';

    return getDefaultTabForStatus(order.status);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase().trim();
    const cleanTerm = term.replace(/[^a-zA-Z0-9]/g, '');
    const cleanOrderNumber = (order.orderNumber || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

    const matchesSearch = 
      !term ||
      order.orderNumber.toLowerCase().includes(term) ||
      term.includes(order.orderNumber.toLowerCase()) ||
      (cleanTerm.length >= 3 && cleanTerm.includes(cleanOrderNumber)) ||
      (cleanOrderNumber.length >= 3 && cleanOrderNumber.includes(cleanTerm)) ||
      order.styleName.toLowerCase().includes(term) ||
      order.customerName.toLowerCase().includes(term) ||
      (order.category && order.category.toLowerCase().includes(term)) ||
      (order.cutData?.actualFabricName && order.cutData.actualFabricName.toLowerCase().includes(term)) ||
      (order.cutData?.cutterName && order.cutData.cutterName.toLowerCase().includes(term));
    
    if (!matchesSearch) return false;

    if (statusFilter === 'الكل') return true;
    if (statusFilter === 'قيد التشغيل') return !['مسودة', 'مغلق'].includes(order.status);
    if (statusFilter === 'المكتملة') return ['مغلق', 'الخياطة مكتملة', 'التجهيز مكتمل'].includes(order.status) || Boolean(order.packingApprovedBy);
    if (statusFilter === 'المسودات') return order.status === 'مسودة';

    if (statusFilter !== 'الكل' && order.status !== statusFilter) return false;

    // Date filtering (by orderDate or createdAt)
    if (dateFrom || dateTo) {
      const oDate = order.orderDate || (order.createdAt ? order.createdAt.split('T')[0] : '');
      if (dateFrom && oDate && oDate < dateFrom) return false;
      if (dateTo && oDate && oDate > dateTo) return false;
    }

    return true;
  });

  // Global aggregate stats
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter(o => !['مسودة', 'مغلق'].includes(o.status)).length;
  const completedOrdersCount = orders.filter(o => o.status === 'مغلق' || o.packingApprovedBy).length;
  const totalPlannedPieces = orders.reduce((sum, o) => sum + getOrderMetrics(o).requiredTotal, 0);
  const totalCutPieces = orders.reduce((sum, o) => sum + getOrderMetrics(o).actualCutTotal, 0);

  const getStatusBadgeClass = (status: string) => {
    if (status === 'مسودة') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (['أمر إنتاج معتمد', 'القص معتمد', 'الباتشات مثبتة', 'التجهيز مكتمل', 'الخياطة مكتملة'].includes(status)) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (status === 'مغلق') return 'bg-slate-200 text-slate-800 border-slate-300';
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  };

  const getStageBadgeClass = (status: StageStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-2xs';
      case 'in_progress':
        return 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 animate-pulse';
      case 'ready':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
      case 'draft':
        return 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200';
      default:
        return 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-150';
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => confirmConfig?.onCancel()}
      />
      {toastConfig && <Toast message={toastConfig.message} type={toastConfig.type} onClose={() => setToastConfig(null)} />}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#150d24] p-4 rounded-xl shadow-2xs border border-slate-200 dark:border-purple-950/70 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الأوامر</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1">{totalOrdersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#2C1151] dark:text-amber-400 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#150d24] p-4 rounded-xl shadow-2xs border border-slate-200 dark:border-purple-950/70 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">قيد التشغيل</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1">{activeOrdersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#150d24] p-4 rounded-xl shadow-2xs border border-slate-200 dark:border-purple-950/70 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">الأوامر المكتملة</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">{completedOrdersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#150d24] p-4 rounded-xl shadow-2xs border border-slate-200 dark:border-purple-950/70 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">القطع المطلوبة</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1">{totalPlannedPieces.toLocaleString('ar-EG')}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center font-bold">
            <Shirt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#150d24] p-4 rounded-xl shadow-2xs border border-slate-200 dark:border-purple-950/70 col-span-2 md:col-span-1 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">القص الفعلي الكلي</p>
            <div className="flex items-baseline gap-1 mt-1">
              <p className="text-2xl font-black text-[#2C1151] dark:text-purple-300 font-mono tabular-nums">{totalCutPieces.toLocaleString('ar-EG')}</p>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                ({totalPlannedPieces > 0 ? Math.round((totalCutPieces / totalPlannedPieces) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#2C1151] dark:text-amber-400 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center font-bold">
            <Scissors className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Header & Filter Control Bar */}
      <div className="bg-white dark:bg-[#150d24] rounded-xl shadow-2xs border border-slate-200/90 dark:border-purple-950/70 p-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">أوامر الإنتاج والمتابعة الميدانية</h2>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {filteredOrders.length} أمر
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              اضغط على أي أمر أو على مرحلة محددة لتتبع مسار التشغيل والاطلاع على التفاصيل الميدانية
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="عرض البطاقة التفصيلية للأمر"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>البطاقة التفصيلية للأمر</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="عرض جدول الأوامر التفصيلي"
              >
                <List className="w-4 h-4" />
                <span>جدول الأوامر التفصيلي</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="مسح الباركود █║▌ أو بحث برقم الأمر، العميل، الموديل، الخامة..."
              className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200/70 hover:bg-slate-300 px-1.5 py-0.5 rounded cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>
          
          <div className="relative w-full sm:w-60">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <select
              className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white font-medium cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="الكل">جميع الأوامر</option>
              <option value="قيد التشغيل">قيد التشغيل الميداني</option>
              <option value="المكتملة">المكتملة والجاهزة</option>
              <option value="المسودات">المسودات غير المعتمدة</option>
              <option disabled>──────────</option>
              <option value="مسودة">مسودة</option>
              <option value="أمر إنتاج معتمد">أمر إنتاج معتمد</option>
              <option value="أمر قص">أمر قص</option>
              <option value="القص الفعلي مدخل">القص الفعلي مدخل</option>
              <option value="القص معتمد">القص معتمد</option>
              <option value="تقسيم الباتشات">تقسيم الباتشات</option>
              <option value="الباتشات مثبتة">الباتشات مثبتة</option>
              <option value="التجهيز جاري">التجهيز جاري</option>
              <option value="التجهيز مكتمل">التجهيز مكتمل</option>
              <option value="الطباعة والتطريز جاري">الطباعة والتطريز جاري</option>
              <option value="الطباعة والتطريز مكتمل">الطباعة والتطريز مكتمل</option>
              <option value="الخياطة مكتملة">الخياطة مكتملة</option>
              <option value="مغلق">أمر مغلق</option>
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Quick Period Presets (Factory Weekly Cycles: Saturday-Friday) */}
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

          {(dateFrom || dateTo || searchTerm || statusFilter !== 'الكل') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('الكل');
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

      {/* ORDERS DISPLAY */}
      {viewMode === 'cards' ? (
        /* CARDS VIEW: Rich Interactive Cards with Progress Trackers */
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const metrics = getOrderMetrics(order);
              const stages = getOrderStages(order);
              const isExpanded = expandedOrderId === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => handleTrackOrder(order.id, getOrderCurrentActiveStageTab(order))}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer overflow-hidden group"
                >
                  {/* Top Bar of the Card */}
                  <div className="p-5 border-b border-slate-100 bg-linear-to-r from-slate-50/70 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {order.orderNumber}
                          </span>
                          <span className={`text-xs px-3 py-0.5 rounded-full font-bold border ${getStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                          {order.category && (
                            <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-md font-semibold border border-slate-200">
                              {order.category}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            العميل: <strong className="text-slate-700">{order.customerName || 'غير محدد'}</strong>
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            الموديل: <strong className="text-slate-700">{order.styleName || 'بدون'}</strong>
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            تاريخ الأمر: <span className="text-slate-700">{order.orderDate}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Quantities & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                      <div className="text-left md:text-right">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs text-slate-500 font-semibold">المطلوب:</span>
                          <span className="text-sm font-bold text-slate-800">{metrics.requiredTotal}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-xs text-slate-500 font-semibold">المقصوص:</span>
                          <span className="text-base font-black text-indigo-600">{metrics.actualCutTotal}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {metrics.batchCount > 0 ? `${metrics.batchCount} باتشات (${metrics.distributedBatchTotal} ق)` : 'لم تقسم باتشات'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleTrackOrder(order.id, getOrderCurrentActiveStageTab(order), e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          title="تتبع ومتابعة المرحلة النشطة للأمر"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>تتبع الأمر</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => toggleExpandOrder(order.id, e)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="عرض شريط التتبع والتفاصيل السريعة"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {order.status === 'مسودة' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onEdit(order.id); }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="تعديل المسودة"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {Cmd.canDeleteProductionOrder(order) && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(order, e)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="حذف الأمر"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Stages Pipeline Strip */}
                  <div className="px-5 py-3 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold shrink-0">
                      <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      <span>مسار المراحل:</span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 scrollbar-none">
                      {stages.map((st, sIdx) => {
                        const Icon = st.icon;
                        return (
                          <button
                            key={st.tab}
                            type="button"
                            onClick={(e) => handleTrackOrder(order.id, st.tab, e)}
                            className={`group/btn flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${getStageBadgeClass(st.status)}`}
                            title={`${st.name}: ${st.label} (اضغط للفتح المباشر)`}
                          >
                            <Icon className="w-3 h-3 shrink-0" />
                            <span>{st.name}</span>
                            {st.status === 'completed' && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded In-Depth Details Drawer */}
                  {isExpanded && (
                    <div className="p-5 bg-indigo-50/20 border-t border-slate-200 space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Fabric & Materials Info */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <h5 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                            <Scissors className="w-4 h-4 text-indigo-600" />
                            <span>خامة القماش والقص الفعلي</span>
                          </h5>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">الخامة المطلوبة:</span>
                              <span className="font-bold text-slate-800">
                                {order.materials?.[0]?.name || 'غير محددة'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">الخامة الفعلية المنفذة:</span>
                              <span className="font-bold text-indigo-700">
                                {order.cutData?.actualFabricName || 'لم تُحدد بعد'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">مسؤول القص (المقصدار):</span>
                              <span className="font-bold text-slate-700">
                                {order.cutData?.cutterName || 'غير مسجل'}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-100">
                              <span className="text-slate-500">نسبة إنجاز القص:</span>
                              <span className="font-bold text-emerald-700">
                                {metrics.cutPercentage}% ({metrics.actualCutTotal} من {metrics.requiredTotal})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Batches Progress Breakdown */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <h5 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span>متابعة باتشات التشغيل ({metrics.batchCount})</span>
                          </h5>
                          {metrics.batchCount > 0 ? (
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-500">إجمالي قطع الباتشات:</span>
                                <span className="font-bold text-slate-800">{metrics.distributedBatchTotal} قطعة</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">التجهيز المكتمل:</span>
                                <span className="font-bold text-emerald-700">{metrics.preppedBatchesCount} من {metrics.batchCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">الطباعة والتطريز المكتمل:</span>
                                <span className="font-bold text-emerald-700">{metrics.printedBatchesCount} من {metrics.batchCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">الخياطة المكتملة:</span>
                                <span className="font-bold text-emerald-700">{metrics.sewnBatchesCount} من {metrics.batchCount}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic py-2 text-center">
                              لم يتم تقسيم الباتشات بعد
                            </p>
                          )}
                        </div>

                        {/* Approvals History & Timestamps */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <h5 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>سجل اعتمادات المراحل</span>
                          </h5>
                          <div className="space-y-1 text-xs max-h-28 overflow-y-auto pr-1">
                            {order.productionApprovedBy && (
                              <div className="flex justify-between text-slate-600">
                                <span>أمر الإنتاج:</span>
                                <span className="font-semibold text-emerald-700">{order.productionApprovedBy}</span>
                              </div>
                            )}
                            {order.cutApprovedBy && (
                              <div className="flex justify-between text-slate-600">
                                <span>القص:</span>
                                <span className="font-semibold text-emerald-700">{order.cutApprovedBy}</span>
                              </div>
                            )}
                            {order.batchesLockedBy && (
                              <div className="flex justify-between text-slate-600">
                                <span>الباتشات:</span>
                                <span className="font-semibold text-emerald-700">{order.batchesLockedBy}</span>
                              </div>
                            )}
                            {order.prepApprovedBy && (
                              <div className="flex justify-between text-slate-600">
                                <span>التجهيز:</span>
                                <span className="font-semibold text-emerald-700">{order.prepApprovedBy}</span>
                              </div>
                            )}
                            {order.printEmbroideryApprovedBy && (
                              <div className="flex justify-between text-slate-600">
                                <span>الطباعة:</span>
                                <span className="font-semibold text-emerald-700">{order.printEmbroideryApprovedBy}</span>
                              </div>
                            )}
                            {order.sewingApprovedBy && (
                              <div className="flex justify-between text-slate-600">
                                <span>الخياطة:</span>
                                <span className="font-semibold text-emerald-700">{order.sewingApprovedBy}</span>
                              </div>
                            )}
                            {!order.productionApprovedBy && (
                              <p className="text-xs text-slate-400 italic">الأمر لا يزال مسودة قيد الإعداد</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Department Instructions Preview */}
                      {(order.cuttingInstructions || order.sewingInstructions || order.finishingInstructions || order.packingInstructions) && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-xs font-bold text-slate-700 block mb-1">تعليمات وملاحظات التشغيل الميداني:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {order.cuttingInstructions && (
                              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                <strong className="text-indigo-900 block mb-0.5">ملاحظات القص:</strong>
                                <span className="text-slate-600">{order.cuttingInstructions}</span>
                              </div>
                            )}
                            {order.sewingInstructions && (
                              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                <strong className="text-indigo-900 block mb-0.5">ملاحظات الخياطة:</strong>
                                <span className="text-slate-600">{order.sewingInstructions}</span>
                              </div>
                            )}
                            {order.finishingInstructions && (
                              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                <strong className="text-indigo-900 block mb-0.5">ملاحظات التشطيب:</strong>
                                <span className="text-slate-600">{order.finishingInstructions}</span>
                              </div>
                            )}
                            {order.packingInstructions && (
                              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                <strong className="text-indigo-900 block mb-0.5">ملاحظات التغليف:</strong>
                                <span className="text-slate-600">{order.packingInstructions}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Jump directly to any stage button strip */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 ml-auto">الانتقال السريع للمرحلة:</span>
                        {stages.map(st => (
                          <button
                            key={st.tab}
                            type="button"
                            onClick={() => handleTrackOrder(order.id, st.tab)}
                            className="px-3 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                          >
                            شاشة {st.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-bold text-base">لا توجد أوامر إنتاج مطابقة للبحث</p>
              <p className="text-slate-400 text-xs mt-1">تأكد من شروط البحث أو الفلتر المحدد</p>
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW: Crystal-Clear Detailed Tabular View with Clickable Rows */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold">
                <tr>
                  <th className="px-5 py-3.5">أمر الإنتاج</th>
                  <th className="px-5 py-3.5">العميل والموديل</th>
                  <th className="px-5 py-3.5">خامة القماش المطلوبة</th>
                  <th className="px-5 py-3.5 text-center">المطلوب</th>
                  <th className="px-5 py-3.5 text-center">القص الفعلي</th>
                  <th className="px-5 py-3.5 text-center">الباتشات</th>
                  <th className="px-5 py-3.5 text-center">مسار المراحل التفاعلي</th>
                  <th className="px-5 py-3.5 text-center">الحالة</th>
                  <th className="px-5 py-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const metrics = getOrderMetrics(order);
                    const stages = getOrderStages(order);

                    return (
                      <tr 
                        key={order.id} 
                        onClick={() => handleTrackOrder(order.id, getOrderCurrentActiveStageTab(order))}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                      >
                        {/* Order Number & Date */}
                        <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600 font-extrabold group-hover:underline">
                              {order.orderNumber}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-normal block mt-0.5">
                            {order.orderDate}
                          </span>
                        </td>

                        {/* Customer & Style */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{order.customerName}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{order.styleName}</span>
                            {order.category && (
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[11px]">
                                {order.category}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Material */}
                        <td className="px-5 py-3.5 text-xs text-slate-700 whitespace-nowrap">
                          <span className="font-medium">
                            {order.materials?.[0]?.name || 'غير محدد'}
                          </span>
                          {order.cutData?.actualFabricName && (
                            <span className="text-[11px] text-indigo-600 block mt-0.5 font-semibold">
                              المنفذ: {order.cutData.actualFabricName}
                            </span>
                          )}
                        </td>

                        {/* Planned Quantity */}
                        <td className="px-5 py-3.5 text-center font-bold text-slate-700 whitespace-nowrap">
                          {metrics.requiredTotal} <span className="text-xs font-normal text-slate-400">ق</span>
                        </td>

                        {/* Actual Cut Quantity */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <span className="font-black text-indigo-600 text-base">
                            {metrics.actualCutTotal}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            ({metrics.cutPercentage}%)
                          </span>
                        </td>

                        {/* Batches */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          {metrics.batchCount > 0 ? (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full text-xs font-bold">
                              {metrics.batchCount} باتش
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">بدون</span>
                          )}
                        </td>

                        {/* Interactive Stages Pipeline */}
                        <td className="px-5 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {stages.map(st => (
                              <button
                                key={st.tab}
                                type="button"
                                onClick={(e) => handleTrackOrder(order.id, st.tab, e)}
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border transition-transform hover:scale-110 cursor-pointer ${getStageBadgeClass(st.status)}`}
                                title={`${st.name}: ${st.label}`}
                              >
                                {st.name.charAt(0)}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleTrackOrder(order.id, getOrderCurrentActiveStageTab(order))}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-xs shadow-2xs cursor-pointer"
                              title="تتبع ومتابعة المرحلة النشطة لأمر الإنتاج"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>تتبع</span>
                            </button>

                            {order.status === 'مسودة' && (
                              <button
                                type="button"
                                onClick={() => onEdit(order.id)}
                                className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="تعديل المسودة"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {Cmd.canDeleteProductionOrder(order) && (
                              <button
                                type="button"
                                onClick={(e) => handleDelete(order, e)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="حذف الأمر"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      لا توجد أوامر إنتاج مطابقة للبحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
