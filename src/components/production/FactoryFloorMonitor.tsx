import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProductionOrder, BatchItem } from '../../types';
import { getOrders } from '../../lib/storage';
import { useTheme } from '../../contexts/ThemeContext';
import { getPrimaryBg, getPrimaryText, getRadiusClass } from '../../lib/theme';
import {
  Tv,
  Maximize2,
  Minimize2,
  RefreshCw,
  Scissors,
  Boxes,
  Sparkles,
  Shirt,
  Flame,
  PackageCheck,
  CheckCircle2,
  Clock,
  Activity,
  ChevronLeft,
  Radio,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Eye,
  AlertCircle,
  X,
  User,
  Building2,
  Tag,
  Warehouse,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export type StageKey =
  | 'cut'
  | 'prep'
  | 'print'
  | 'sew'
  | 'finish'
  | 'ironing'
  | 'packing';

interface StageConfig {
  id: StageKey;
  tab: string;
  num: string;
  name: string;
  fullName: string;
  icon: React.ElementType;
  colorName: string;
  badgeUnit: string;
  borderColor: string;
  activeBorderColor: string;
  bgColor: string;
  textColor: string;
  activeRing: string;
}

const STAGES_CONFIG: StageConfig[] = [
  {
    id: 'cut',
    tab: 'cut',
    num: '1',
    name: 'صالة القص',
    fullName: 'صالة القص والتفصيل الآلي',
    icon: Scissors,
    colorName: 'amber',
    badgeUnit: 'أوامر',
    borderColor: 'border-slate-200/90 dark:border-purple-950/50',
    activeBorderColor: 'border-amber-500 dark:border-amber-400',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600 dark:text-amber-400',
    activeRing: 'ring-2 ring-amber-500/40 shadow-md',
  },
  {
    id: 'prep',
    tab: 'prep',
    num: '2',
    name: 'التجهيز',
    fullName: 'تجهيز وصرف مستلزمات الباتش',
    icon: Boxes,
    colorName: 'indigo',
    badgeUnit: 'باتش',
    borderColor: 'border-slate-200/90 dark:border-purple-950/50',
    activeBorderColor: 'border-indigo-500 dark:border-indigo-400',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    activeRing: 'ring-2 ring-indigo-500/40 shadow-md',
  },
  {
    id: 'print',
    tab: 'print',
    num: '3',
    name: 'طباعة/تطريز',
    fullName: 'الطباعة والتطريز السلك سكرين والمكبس',
    icon: Sparkles,
    colorName: 'purple',
    badgeUnit: 'باتش',
    borderColor: 'border-slate-200/90 dark:border-purple-950/50',
    activeBorderColor: 'border-purple-500 dark:border-purple-400',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600 dark:text-purple-400',
    activeRing: 'ring-2 ring-purple-500/40 shadow-md',
  },
  {
    id: 'sew',
    tab: 'sew',
    num: '4',
    name: 'خطوط الخياطة',
    fullName: 'عنابر وخطوط الخياطة والتجميع',
    icon: Shirt,
    colorName: 'blue',
    badgeUnit: 'باتش',
    borderColor: 'border-slate-200/90 dark:border-purple-950/50',
    activeBorderColor: 'border-blue-500 dark:border-blue-400',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
    activeRing: 'ring-2 ring-blue-500/40 shadow-md',
  },
  {
    id: 'finish',
    tab: 'finish',
    num: '5',
    name: 'التشطيب',
    fullName: 'التشطيب وتنظيف الخيوط وفحص الجودة (QC)',
    icon: CheckCircle2,
    colorName: 'emerald',
    badgeUnit: 'باتش',
    borderColor: 'border-slate-200/90 dark:border-purple-950/50',
    activeBorderColor: 'border-emerald-500 dark:border-emerald-400',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    activeRing: 'ring-2 ring-emerald-500/40 shadow-md',
  },
  {
    id: 'ironing',
    tab: 'ironing',
    num: '6',
    name: 'قسم الكي',
    fullName: 'قسم الكي والبخار والمانيكان الصناعي',
    icon: Flame,
    colorName: 'orange',
    badgeUnit: 'باتش',
    borderColor: 'border-slate-200/90 dark:border-purple-950/50',
    activeBorderColor: 'border-orange-500 dark:border-orange-400',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-600 dark:text-orange-400',
    activeRing: 'ring-2 ring-orange-500/40 shadow-md',
  },
  {
    id: 'packing',
    tab: 'packing',
    num: '7',
    name: 'التعبئة',
    fullName: 'التعبئة والتغليف والباركود والكرتنة',
    icon: PackageCheck,
    colorName: 'teal',
    badgeUnit: 'باتش',
    borderColor: 'border-slate-200/90 dark:border-purple-950/50',
    activeBorderColor: 'border-teal-500 dark:border-teal-400',
    bgColor: 'bg-teal-500/10',
    textColor: 'text-teal-600 dark:text-teal-400',
    activeRing: 'ring-2 ring-teal-500/40 shadow-md',
  },
];

export interface FloorBatchRecord {
  orderId: string;
  orderNumber: string;
  styleName: string;
  customerName: string;
  category?: string;
  orderStatus: string;
  batchId: string;
  batchNumber: string;
  totalPieces: number;
  stage: StageKey;
  stageName: string;
  stageTab: string;
  statusLabel: string;
  statusType: 'in_progress' | 'completed' | 'pending';
  sizesBreakdown: { size: string; color: string; quantity: number }[];
  operatorOrLine?: string;
  notes?: string;
  rawBatch?: BatchItem;
  orderRef: ProductionOrder;
}

interface FactoryFloorMonitorProps {
  onBack?: () => void;
  onNavigateToOrder?: (orderId: string, tab?: string) => void;
}

// Helper: Calculate actual cut pieces from cutData
export const getCutActualPieces = (cutData?: any): number => {
  if (!cutData || !cutData.sizes || !Array.isArray(cutData.sizes)) return 0;
  return cutData.sizes.reduce(
    (sum: number, s: any) =>
      sum +
      (s.variants || []).reduce((vSum: number, v: any) => vSum + (Number(v.actualQuantity) || 0), 0),
    0
  );
};

// Helper: Calculate total pieces of a production order accurately
export const getOrderTotalPieces = (order: ProductionOrder): number => {
  const cutActual = getCutActualPieces(order.cutData);
  if (cutActual > 0) {
    return cutActual;
  }
  if (order.sizes && Array.isArray(order.sizes) && order.sizes.length > 0) {
    const total = order.sizes.reduce(
      (sum, s) => sum + (s.variants || []).reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0),
      0
    );
    if (total > 0) return total;
  }
  if (order.batches && Array.isArray(order.batches) && order.batches.length > 0) {
    const batchTotal = order.batches.reduce((sum, b) => sum + getBatchTotalPieces(b), 0);
    if (batchTotal > 0) return batchTotal;
  }
  return Number((order as any).totalQuantity) || 0;
};

// Helper: Calculate total pieces of a batch accurately
export const getBatchTotalPieces = (batch: BatchItem): number => {
  if (!batch || !batch.sizes || !Array.isArray(batch.sizes)) return 0;
  return batch.sizes.reduce(
    (sum, s) => sum + (s.variants || []).reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0),
    0
  );
};

export const FactoryFloorMonitor: React.FC<FactoryFloorMonitorProps> = ({
  onBack,
  onNavigateToOrder,
}) => {
  const { color, radius } = useTheme();
  const radiusClass = getRadiusClass(radius);

  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selected stage filter for interactive batch exploration
  const [selectedStage, setSelectedStage] = useState<StageKey | 'all'>('all');
  const [batchSearch, setBatchSearch] = useState('');
  const [inspectingBatch, setInspectingBatch] = useState<FloorBatchRecord | null>(null);

  const batchesSectionRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error('Error fetching orders for floor monitor:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s auto-refresh
    window.addEventListener('gfos_storage_update', fetchOrders);
    return () => {
      clearInterval(interval);
      window.removeEventListener('gfos_storage_update', fetchOrders);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Active in-progress orders (exclude drafts and fully closed orders)
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'مسودة' && o.status !== 'مغلق');
  }, [orders]);

  // Extract all floor batch records and link them to their actual factory stage
  const allFloorBatches = useMemo(() => {
    const list: FloorBatchRecord[] = [];

    activeOrders.forEach((order) => {
      const orderTotalPcs = getOrderTotalPieces(order);
      const isCutDone = Boolean(order.cutData?.approvedAt || order.cutApprovedAt);

      // 1. If Cutting is NOT approved, the order is currently on the cutting table
      if (!isCutDone) {
        list.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          styleName: order.styleName || 'بدون مسمى قصة',
          customerName: order.customerName || 'عميل نقدي / مصنع',
          category: order.category,
          orderStatus: order.status,
          batchId: `cut_table_${order.id}`,
          batchNumber: 'طاولة القص الرئيسية',
          totalPieces: orderTotalPcs,
          stage: 'cut',
          stageName: 'صالة القص',
          stageTab: 'cut',
          statusLabel: order.cutData?.totalActualQuantity
            ? 'تم إدخال القص الفعلي بانتظار الاعتماد'
            : 'جاري فرد القماش والتفصيل',
          statusType: order.cutData?.totalActualQuantity ? 'pending' : 'in_progress',
          sizesBreakdown: (order.sizes || []).flatMap((s) =>
            (s.variants || []).map((v) => ({
              size: s.size,
              color: v.color,
              quantity: Number(v.quantity) || 0,
            }))
          ),
          operatorOrLine: order.cutData?.markerCode
            ? `ماركر: ${order.cutData.markerCode}`
            : 'عنبر وطاولة القص الآلي',
          notes: order.cuttingInstructions || 'أمر تشغيل فرد وقص',
          orderRef: order,
        });
        return; // Next order, cut is not yet split into batches
      }

      // 2. Cut is approved: check batches
      const batches = order.batches || [];

      // If cut is approved but batches haven't been generated yet
      if (batches.length === 0) {
        list.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          styleName: order.styleName || 'بدون مسمى قصة',
          customerName: order.customerName || 'عميل نقدي',
          category: order.category,
          orderStatus: order.status,
          batchId: `prep_waiting_${order.id}`,
          batchNumber: 'بانتظار تقسيم الباتشات',
          totalPieces: orderTotalPcs,
          stage: 'prep',
          stageName: 'التجهيز',
          stageTab: 'batches',
          statusLabel: 'القص معتمد وبانتظار تثبيت الباتشات',
          statusType: 'pending',
          sizesBreakdown: (order.sizes || []).flatMap((s) =>
            (s.variants || []).map((v) => ({
              size: s.size,
              color: v.color,
              quantity: Number(v.quantity) || 0,
            }))
          ),
          operatorOrLine: 'مكتب التخطيط والمتابعة',
          orderRef: order,
        });
        return;
      }

      // Process each individual batch and pinpoint its precise operational stage
      batches.forEach((b) => {
        let batchPcs = getBatchTotalPieces(b);
        // Fallback if size matrix in batch wasn't populated: split proportionally
        if (batchPcs <= 0 && batches.length > 0) {
          batchPcs = Math.round(orderTotalPcs / batches.length) || 0;
        }

        const sizesBreakdown = (b.sizes || []).flatMap((s) =>
          (s.variants || []).map((v) => ({
            size: s.size,
            color: v.color,
            quantity: Number(v.quantity) || 0,
          }))
        );

        let stage: StageKey = 'prep';
        let stageName = 'التجهيز';
        let stageTab = 'prep';
        let statusLabel = 'جاري التجهيز';
        let statusType: 'in_progress' | 'completed' | 'pending' = 'in_progress';
        let operatorOrLine = 'عنبر تجهيز المستلزمات';

        // Stage Resolution:
        // A. Ironing complete -> Packing or Warehouse
        if (b.ironingData?.status === 'مكتمل' || order.ironingApprovedAt) {
          if (
            order.packingStatus === 'مكتمل' ||
            order.status === 'التغليف معتمد' ||
            order.status === 'مغلق'
          ) {
            // Already finished and in warehouse, skip from active floor batches
            return;
          } else {
            stage = 'packing';
            stageName = 'التعبئة';
            stageTab = 'packing';
            statusLabel =
              order.packingStatus === 'جاري'
                ? 'جاري التعبئة والكرتنة'
                : 'اكتمل الكي وجاهز للتعبئة';
            statusType = order.packingStatus === 'جاري' ? 'in_progress' : 'pending';
            operatorOrLine = 'عنبر التعبئة والتغليف';
          }
        }
        // B. Ironing in progress or finishing complete
        else if (b.ironingData?.status === 'جاري') {
          stage = 'ironing';
          stageName = 'قسم الكي';
          stageTab = 'ironing';
          statusLabel = 'جاري الكي بالبخار';
          statusType = 'in_progress';
          operatorOrLine = b.ironingData.workerName || 'قسم الكي الصناعي';
        } else if (b.finishingData?.status === 'مكتمل' || order.finishingApprovedAt) {
          stage = 'ironing';
          stageName = 'قسم الكي';
          stageTab = 'ironing';
          statusLabel = 'اكتمل التشطيب وجاهز للكي';
          statusType = 'pending';
          operatorOrLine = b.finishingData?.workerName || 'بانتظار استلام المكواة';
        }
        // C. Finishing in progress or sewing complete
        else if (b.finishingData?.status === 'جاري') {
          stage = 'finish';
          stageName = 'التشطيب';
          stageTab = 'finish';
          statusLabel = 'جاري التشطيب وفحص الجودة';
          statusType = 'in_progress';
          operatorOrLine = b.finishingData.workerName || 'فريق التشطيب والفحص';
        } else if (b.sewingData?.status === 'مكتمل' || order.sewingApprovedAt || order.status === 'الخياطة مكتملة') {
          stage = 'finish';
          stageName = 'التشطيب';
          stageTab = 'finish';
          statusLabel = 'اكتملت الخياطة وجاهز للتشطيب والفحص';
          statusType = 'pending';
          operatorOrLine =
            b.sewingData?.sewingGroup ||
            b.sewingData?.externalManufacturer ||
            'بانتظار تسليم الفنش';
        }
        // D. Sewing in progress or previous stages complete
        else if (b.sewingData?.status === 'جاري') {
          stage = 'sew';
          stageName = 'خطوط الخياطة';
          stageTab = 'sew';
          statusLabel = 'جاري تجميع الخياطة بالخط';
          statusType = 'in_progress';
          operatorOrLine =
            b.sewingData.sewingGroup ||
            b.sewingData.externalManufacturer ||
            'خط الخياطة والتجميع';
        } else {
          // Check print & embroidery requirement
          const hasPrint = Boolean(
            b.executionType && b.executionType !== 'بدون طباعة / تطريز'
          );

          if (hasPrint) {
            if (
              b.printEmbroideryStatus === 'مكتمل' ||
              b.printApprovedAt ||
              b.printApprovedBy ||
              order.printEmbroideryApprovedAt
            ) {
              stage = 'sew';
              stageName = 'خطوط الخياطة';
              stageTab = 'sew';
              statusLabel = 'اكتملت الطباعة وجاهز لبدء الخياطة';
              statusType = 'pending';
              operatorOrLine = 'بانتظار تسليم خط الخياطة';
            } else if (
              b.prepStatus === 'مكتمل' ||
              b.prepApprovedAt ||
              b.prepApprovedBy ||
              order.prepApprovedAt
            ) {
              stage = 'print';
              stageName = 'طباعة/تطريز';
              stageTab = 'print';
              statusLabel =
                b.printEmbroideryStatus === 'جاري'
                  ? 'جاري التنفيذ بالمطبعة / التطريز'
                  : 'جاهز للإرسال للمطبعة والتطريز';
              statusType =
                b.printEmbroideryStatus === 'جاري' ? 'in_progress' : 'pending';
              operatorOrLine = b.printDetails?.designName
                ? `تصميم: ${b.printDetails.designName}`
                : b.executionType || 'مطبعة خارجية / تطريز';
            } else {
              stage = 'prep';
              stageName = 'التجهيز';
              stageTab = 'prep';
              statusLabel =
                b.prepStatus === 'جاري'
                  ? 'جاري تجهيز المستلزمات'
                  : 'بانتظار صرف المستلزمات';
              statusType = b.prepStatus === 'جاري' ? 'in_progress' : 'pending';
              operatorOrLine = 'عنبر تجهيز المستلزمات';
            }
          } else {
            // No print: direct from Prep to Sewing
            if (
              b.prepStatus === 'مكتمل' ||
              b.prepApprovedAt ||
              b.prepApprovedBy ||
              order.prepApprovedAt
            ) {
              stage = 'sew';
              stageName = 'خطوط الخياطة';
              stageTab = 'sew';
              statusLabel = 'اكتمل التجهيز وجاهز للخياطة';
              statusType = 'pending';
              operatorOrLine = 'بانتظار تسليم خط الخياطة';
            } else {
              stage = 'prep';
              stageName = 'التجهيز';
              stageTab = 'prep';
              statusLabel =
                b.prepStatus === 'جاري'
                  ? 'جاري تجهيز المستلزمات'
                  : 'بانتظار صرف المستلزمات';
              statusType = b.prepStatus === 'جاري' ? 'in_progress' : 'pending';
              operatorOrLine = 'عنبر تجهيز المستلزمات';
            }
          }
        }

        list.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          styleName: order.styleName || 'بدون مسمى قصة',
          customerName: order.customerName || 'عميل نقدي',
          category: order.category,
          orderStatus: order.status,
          batchId: b.id,
          batchNumber: b.batchNumber || `باتش ${b.id.slice(-4)}`,
          totalPieces: batchPcs,
          stage,
          stageName,
          stageTab,
          statusLabel,
          statusType,
          sizesBreakdown,
          operatorOrLine,
          rawBatch: b,
          orderRef: order,
        });
      });
    });

    return list;
  }, [activeOrders]);

  // Aggregate stage statistics from the actual floor batch records
  const stageStats = useMemo(() => {
    const stats: Record<
      StageKey,
      { count: number; pcs: number; batches: FloorBatchRecord[] }
    > = {
      cut: { count: 0, pcs: 0, batches: [] },
      prep: { count: 0, pcs: 0, batches: [] },
      print: { count: 0, pcs: 0, batches: [] },
      sew: { count: 0, pcs: 0, batches: [] },
      finish: { count: 0, pcs: 0, batches: [] },
      ironing: { count: 0, pcs: 0, batches: [] },
      packing: { count: 0, pcs: 0, batches: [] },
    };

    allFloorBatches.forEach((record) => {
      if (stats[record.stage]) {
        stats[record.stage].count += 1;
        stats[record.stage].pcs += record.totalPieces;
        stats[record.stage].batches.push(record);
      }
    });

    // Warehouse completed items
    let warehousePcs = 0;
    orders.forEach((o) => {
      if (o.status === 'التغليف معتمد' || o.packingStatus === 'مكتمل' || o.status === 'مغلق') {
        warehousePcs += getOrderTotalPieces(o);
      }
    });

    return {
      ...stats,
      warehouse: { pcs: warehousePcs },
    };
  }, [allFloorBatches, orders]);

  // Total active pieces across all stages in the factory
  const totalInLinePcs = useMemo(() => {
    return allFloorBatches.reduce((sum, b) => sum + b.totalPieces, 0);
  }, [allFloorBatches]);

  // Filtered batches to show in the dedicated Stage Inspection panel
  const displayedBatches = useMemo(() => {
    let result = allFloorBatches;
    if (selectedStage !== 'all') {
      result = result.filter((b) => b.stage === selectedStage);
    }
    if (batchSearch.trim()) {
      const q = batchSearch.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.batchNumber.toLowerCase().includes(q) ||
          b.orderNumber.toLowerCase().includes(q) ||
          b.styleName.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.stageName.toLowerCase().includes(q) ||
          (b.operatorOrLine && b.operatorOrLine.toLowerCase().includes(q))
      );
    }
    return result;
  }, [allFloorBatches, selectedStage, batchSearch]);

  const handleStageCardClick = (stageId: StageKey) => {
    setSelectedStage((prev) => (prev === stageId ? 'all' : stageId));
    // Smoothly bring the batches section into view
    setTimeout(() => {
      batchesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleNavigateToBatch = (batch: FloorBatchRecord) => {
    if (onNavigateToOrder) {
      onNavigateToOrder(batch.orderId, batch.stageTab);
    }
  };

  const activeStageConfig = useMemo(() => {
    if (selectedStage === 'all') return null;
    return STAGES_CONFIG.find((s) => s.id === selectedStage);
  }, [selectedStage]);

  return (
    <div className={`space-y-6 font-sans ${isFullscreen ? 'p-6 bg-slate-100 dark:bg-[#0c0617] min-h-screen' : ''}`}>
      {/* Top Header Bar */}
      <header className={`bg-white dark:bg-[#150d24] ${radiusClass} p-4 sm:p-5 border border-slate-200 dark:border-purple-950/60 shadow-xs flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer`}
              title="رجوع"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 rounded-xl bg-[#2C1151] border border-amber-500/40 flex items-center justify-center shrink-0 shadow-xs">
            <Tv className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                غرفة التحكم اللحظية للإنتاج
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold animate-pulse">
                <Radio className="w-3 h-3 text-emerald-500" />
                مباشر
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              شاشة القيادة الميدانية الشاملة — متابعة حية وتدفق لحظي لأوامر وباتشات خطوط الإنتاج
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1c0f33] border border-slate-200 dark:border-purple-900/40 text-slate-600 dark:text-slate-300">
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="hidden sm:inline">آخر تحديث:</span>
            <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              {lastRefreshed.toLocaleTimeString('ar-EG')}
            </span>
          </div>

          <button
            onClick={fetchOrders}
            className={`p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1c0f33] dark:hover:bg-purple-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-purple-900/40 transition-colors cursor-pointer shadow-2xs`}
            title="تحديث البيانات الآن"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2C1151] hover:bg-[#3d1870] text-amber-400 border border-amber-500/40 font-bold transition-colors cursor-pointer shadow-xs`}
            title="وضع ملء الشاشة"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">إنهاء العرض الكامل</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">ملء الشاشة (TV)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* High-Level Overview Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`bg-white dark:bg-[#150d24] border border-slate-200 dark:border-purple-950/60 ${radiusClass} p-4 sm:p-5 shadow-2xs hover:border-slate-300 dark:hover:border-purple-900/60 transition-all`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              الأوامر قيد التشغيل
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {activeOrders.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">أمر نشط</span>
          </div>
        </div>

        <div className={`bg-white dark:bg-[#150d24] border border-slate-200 dark:border-purple-950/60 ${radiusClass} p-4 sm:p-5 shadow-2xs hover:border-slate-300 dark:hover:border-purple-900/60 transition-all`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              إجمالي قطع الصالة الجارية
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
              {totalInLinePcs.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">قطعة جارية</span>
          </div>
        </div>

        <div className={`bg-white dark:bg-[#150d24] border border-slate-200 dark:border-purple-950/60 ${radiusClass} p-4 sm:p-5 shadow-2xs hover:border-slate-300 dark:hover:border-purple-900/60 transition-all`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              أوامر مسودة للتخطيط
            </span>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-700 dark:text-slate-200 font-mono tabular-nums">
              {orders.filter((o) => o.status === 'مسودة').length}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">بانتظار الاعتماد</span>
          </div>
        </div>

        <div className={`bg-white dark:bg-[#150d24] border border-slate-200 dark:border-purple-950/60 ${radiusClass} p-4 sm:p-5 shadow-2xs hover:border-slate-300 dark:hover:border-purple-900/60 transition-all`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              جاهز بالمخزن التام
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              {stageStats.warehouse.pcs.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">قطعة معتمدة</span>
          </div>
        </div>
      </section>

      {/* Industrial Pipeline Stage Cards - INTERACTIVE */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              مراحل خطوط الإنتاج الصناعية
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              (انقر على أي مرحلة لعرض وتصفح باتشاتها الميدانية)
            </span>
          </div>
          {selectedStage !== 'all' && (
            <button
              onClick={() => setSelectedStage('all')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>إعادة عرض كافة المراحل</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
          {STAGES_CONFIG.map((stage) => {
            const Icon = stage.icon;
            const stat = stageStats[stage.id];
            const isSelected = selectedStage === stage.id;
            const hasBatches = stat.count > 0;

            return (
              <div
                key={stage.id}
                onClick={() => handleStageCardClick(stage.id)}
                className={`bg-white dark:bg-[#150d24] border ${
                  isSelected ? `${stage.activeBorderColor} ${stage.activeRing}` : stage.borderColor
                } ${radiusClass} p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer relative group text-right select-none`}
              >
                {isSelected && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                    المرحلة المحددة
                  </span>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    <Icon className={`w-4 h-4 ${stage.textColor}`} />
                    <span>{stage.num}. {stage.name}</span>
                  </span>
                  <span
                    className={`tabular-nums font-mono text-[11px] font-bold ${stage.textColor} ${stage.bgColor} px-1.5 py-0.5 rounded`}
                  >
                    {stat.count} {stage.badgeUnit}
                  </span>
                </div>

                <div className="mt-2">
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                    {stat.pcs.toLocaleString('ar-EG')}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">قطعة جارية</span>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-amber-500 transition-colors">
                      {hasBatches ? 'عرض الباتشات ↵' : 'خالية'}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-purple-950/60 flex items-center justify-center text-[10px] font-bold text-amber-600 dark:text-amber-400 gap-1">
                    <span>مفتوحة للمعاينة</span>
                    <ChevronDown className="w-3 h-3 animate-bounce" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* DEDICATED STAGE BATCHES PANEL ("ولما اضغط ع المرحله يعرض بطريقه واضحه بيانات الباتشات") */}
      <section
        ref={batchesSectionRef}
        className={`bg-white dark:bg-[#150d24] border ${
          selectedStage !== 'all' ? 'border-amber-500/40 dark:border-amber-400/40 ring-1 ring-amber-500/20' : 'border-slate-200 dark:border-purple-950/60'
        } ${radiusClass} p-4 sm:p-5 shadow-xs flex flex-col space-y-4 transition-all`}
      >
        {/* Panel Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-purple-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              {activeStageConfig ? (
                <activeStageConfig.icon className="w-5 h-5 text-amber-500" />
              ) : (
                <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {activeStageConfig
                    ? `باتشات ${activeStageConfig.fullName} الجارية`
                    : 'كافة باتشات خطوط الإنتاج الجارية بالمصنع'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs border border-purple-200 dark:border-purple-800">
                  {displayedBatches.length} باتش
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs border border-amber-200 dark:border-amber-800/40">
                  {displayedBatches.reduce((s, b) => s + b.totalPieces, 0).toLocaleString('ar-EG')} قطعة
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                اضغط على أي باتش للانتقال الفوري إلى شاشة تشغيل المرحلة داخل أمر الإنتاج
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={batchSearch}
                onChange={(e) => setBatchSearch(e.target.value)}
                placeholder="بحث برقم الباتش، الأمر، القصة..."
                className="w-full pl-3 pr-9 py-1.5 rounded-xl border border-slate-200 dark:border-purple-900/60 bg-slate-50 dark:bg-[#1c0f33] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              {batchSearch && (
                <button
                  onClick={() => setBatchSearch('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedStage !== 'all' && (
              <button
                onClick={() => setSelectedStage('all')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                عرض كل المراحل
              </button>
            )}
          </div>
        </div>

        {/* Batches Content Grid */}
        {displayedBatches.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-purple-950/40 flex items-center justify-center text-slate-400">
              <Boxes className="w-7 h-7 stroke-[1.2]" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                {selectedStage !== 'all'
                  ? `لا توجد باتشات جارية في ${activeStageConfig?.name} حالياً`
                  : 'لا توجد باتشات مطابقة لخيارات البحث'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedStage !== 'all'
                  ? 'كافة الباتشات تم تمريرها للمراحل التالية، انقر على مرحلة أخرى لاستعراض باتشاتها'
                  : 'تأكد من وجود أوامر نشطة قيد التشغيل في المصنع'}
              </p>
            </div>
            {selectedStage !== 'all' && (
              <button
                onClick={() => setSelectedStage('all')}
                className="px-4 py-2 rounded-xl bg-[#2C1151] text-amber-400 font-bold text-xs hover:bg-[#3d1870] transition-colors cursor-pointer"
              >
                استعراض كافة باتشات المصنع
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {displayedBatches.map((batch) => {
              const stageConf = STAGES_CONFIG.find((s) => s.id === batch.stage);
              const StageIcon = stageConf?.icon || Layers;

              return (
                <div
                  key={`${batch.orderId}_${batch.batchId}`}
                  onClick={() => handleNavigateToBatch(batch)}
                  className={`bg-slate-50/70 dark:bg-[#1a0f2e] border border-slate-200 dark:border-purple-950/60 hover:border-amber-500/60 dark:hover:border-amber-400/60 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative`}
                >
                  {/* Top Row: Batch number & Stage Tag */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                          <StageIcon className="w-4 h-4 text-amber-500" />
                          <span>{batch.batchNumber}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono text-[11px] font-bold">
                          {batch.orderNumber}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          batch.statusType === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        }`}
                      >
                        {batch.stageName}
                      </span>
                    </div>

                    {/* Style and Customer */}
                    <div className="mb-3">
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                        {batch.styleName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{batch.customerName}</span>
                      </div>
                    </div>

                    {/* Status Note & Operator info */}
                    <div className="bg-white dark:bg-[#140b24] p-2.5 rounded-lg border border-slate-200/80 dark:border-purple-950/50 mb-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                          حالة التشغيل:
                        </span>
                        <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                          {batch.statusLabel}
                        </span>
                      </div>
                      {batch.operatorOrLine && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                            جهة التشغيل:
                          </span>
                          <span className="font-semibold text-[11px] text-indigo-600 dark:text-indigo-400 truncate max-w-[160px]">
                            {batch.operatorOrLine}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Sizes Breakdown chips */}
                    {batch.sizesBreakdown.length > 0 && (
                      <div className="space-y-1 mb-3">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          توزيع المقاسات والألوان:
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {batch.sizesBreakdown.slice(0, 6).map((sb, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-purple-950/60 text-slate-700 dark:text-slate-300"
                            >
                              {sb.color} ({sb.size}): {sb.quantity}
                            </span>
                          ))}
                          {batch.sizesBreakdown.length > 6 && (
                            <span className="text-[10px] font-mono text-slate-400 px-1 py-0.5">
                              +{batch.sizesBreakdown.length - 6} مقاس آخر
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom / Action to Navigate ("وبالضغط عليها يودينى ليها") */}
                  <div className="pt-3 border-t border-slate-200 dark:border-purple-950/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                        إجمالي كمية الباتش
                      </span>
                      <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                        {batch.totalPieces.toLocaleString('ar-EG')} قطعة
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingBatch(batch);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="معاينة تفاصيل الباتش"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToBatch(batch);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2C1151] hover:bg-[#3d1870] text-amber-400 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer shadow-xs group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:border-amber-500"
                      >
                        <span>فتح بالمرحلة</span>
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Floor Orders Feed Table */}
      <section className={`bg-white dark:bg-[#150d24] border border-slate-200 dark:border-purple-950/60 ${radiusClass} p-4 sm:p-5 shadow-xs flex flex-col`}>
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-purple-950/60 mb-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-amber-500" />
            <span>جدول التشغيل المباشر لأوامر المصنع الحالية</span>
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-purple-950/50 text-slate-600 dark:text-slate-300">
            {activeOrders.length} أوامر تحت التشغيل الميداني
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <Boxes className="w-12 h-12 stroke-[1.2] text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">لا توجد أوامر قيد التشغيل حالياً</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              سيظهر هنا تدفق الباتشات والإنتاج اللحظي بمجرد تفعيل أمر إنتاج
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-purple-950/60 text-slate-500 dark:text-slate-400 font-bold">
                  <th className="py-3 px-3">رقم الأمر</th>
                  <th className="py-3 px-3">العميل / القصة</th>
                  <th className="py-3 px-3">الكمية الكلية</th>
                  <th className="py-3 px-3">عدد الباتشات</th>
                  <th className="py-3 px-3">حالة الأمر</th>
                  <th className="py-3 px-3">القص</th>
                  <th className="py-3 px-3">الخياطة</th>
                  <th className="py-3 px-3">الكي / التعبئة</th>
                  <th className="py-3 px-3 text-center">الإجراء الميداني</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-purple-950/40">
                {activeOrders.map((o) => {
                  const isCutDone = Boolean(o.cutData?.approvedAt || o.cutApprovedAt);
                  const orderPcs = getOrderTotalPieces(o);
                  const batchesCount = o.batches?.length || 0;
                  const sewingDoneBatches =
                    o.batches?.filter((b) => b.sewingData?.status === 'مكتمل').length || 0;
                  const ironingDoneBatches =
                    o.batches?.filter((b) => b.ironingData?.status === 'مكتمل').length || 0;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-purple-950/30 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        <button
                          type="button"
                          onClick={() => onNavigateToOrder?.(o.id, 'production')}
                          className="hover:text-amber-500 hover:underline cursor-pointer font-bold"
                        >
                          {o.orderNumber}
                        </button>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{o.styleName || '—'}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{o.customerName || 'بدون عميل'}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-black text-amber-600 dark:text-amber-400 tabular-nums">
                        {orderPcs.toLocaleString('ar-EG')} قطعة
                      </td>
                      <td className="py-3.5 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300 font-semibold">
                        {batchesCount > 0 ? `${batchesCount} باتش` : 'بانتظار التقسيم'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-[11px] font-bold">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {isCutDone ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToOrder?.(o.id, 'cut')}
                            className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold hover:underline cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>معتمد ({o.cutData?.totalActualQuantity || orderPcs})</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigateToOrder?.(o.id, 'cut')}
                            className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span>جاري القص ({orderPcs})</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => onNavigateToOrder?.(o.id, 'sew')}
                          className="tabular-nums font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer block"
                        >
                          {sewingDoneBatches} / {batchesCount} مكتمل
                          {batchesCount > 0 && (
                            <span className="text-[10px] font-sans text-slate-400 block font-normal">
                              ({Math.round((sewingDoneBatches / batchesCount) * 100)}%)
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => onNavigateToOrder?.(o.id, 'ironing')}
                          className="tabular-nums font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 hover:underline cursor-pointer block"
                        >
                          {ironingDoneBatches} / {batchesCount} مكوي
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            // Find the natural active tab for this order
                            if (!isCutDone) onNavigateToOrder?.(o.id, 'cut');
                            else if (batchesCount === 0) onNavigateToOrder?.(o.id, 'batches');
                            else if (sewingDoneBatches < batchesCount) onNavigateToOrder?.(o.id, 'sew');
                            else if (ironingDoneBatches < batchesCount) onNavigateToOrder?.(o.id, 'finish');
                            else onNavigateToOrder?.(o.id, 'packing');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#2C1151] hover:bg-[#3d1870] text-amber-400 border border-amber-500/30 font-bold text-xs transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          الانتقال للتشغيل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* QUICK BATCH INSPECTION MODAL */}
      {inspectingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#150d24] rounded-2xl border border-slate-200 dark:border-purple-900/60 shadow-2xl max-w-lg w-full p-5 text-right space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-purple-950/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    بطاقة تفاصيل الباتش ({inspectingBatch.batchNumber})
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {inspectingBatch.orderNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectingBatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-purple-950/30 rounded-xl">
                <span className="text-slate-500 block mb-1">الموديل / القصة:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{inspectingBatch.styleName}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-purple-950/30 rounded-xl">
                <span className="text-slate-500 block mb-1">العميل:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{inspectingBatch.customerName}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-purple-950/30 rounded-xl">
                <span className="text-slate-500 block mb-1">المرحلة الحالية:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">{inspectingBatch.stageName}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-purple-950/30 rounded-xl">
                <span className="text-slate-500 block mb-1">إجمالي الكمية:</span>
                <span className="font-black text-amber-600 font-mono">{inspectingBatch.totalPieces} قطعة</span>
              </div>
            </div>

            {inspectingBatch.sizesBreakdown.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  تفصيل المقاسات والألوان:
                </span>
                <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-purple-950/20 rounded-xl border border-slate-200 dark:border-purple-950/50">
                  {inspectingBatch.sizesBreakdown.map((sb, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] p-1.5 rounded-lg bg-white dark:bg-purple-950/60 border border-slate-200/80 dark:border-purple-900/40 text-center font-mono"
                    >
                      <div className="text-slate-500 font-medium">{sb.color} ({sb.size})</div>
                      <div className="font-bold text-slate-900 dark:text-white">{sb.quantity} قطعة</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-purple-950/60 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setInspectingBatch(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-purple-950/50 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={() => {
                  const b = inspectingBatch;
                  setInspectingBatch(null);
                  handleNavigateToBatch(b);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C1151] hover:bg-[#3d1870] text-amber-400 border border-amber-500/40 font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <span>الانتقال لمرحلة {inspectingBatch.stageName} بأمر الإنتاج</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
