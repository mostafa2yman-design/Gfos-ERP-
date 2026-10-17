import React, { useState, useEffect, useMemo } from 'react';
import { ProductionOrder } from '../../types';
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
  Factory,
  Radio
} from 'lucide-react';

interface FactoryFloorMonitorProps {
  onBack?: () => void;
  onNavigateToOrder?: (orderId: string, tab?: string) => void;
}

export const FactoryFloorMonitor: React.FC<FactoryFloorMonitorProps> = ({
  onBack,
  onNavigateToOrder,
}) => {
  const { color, radius } = useTheme();
  const primaryBg = getPrimaryBg(color);
  const primaryText = getPrimaryText(color);
  const radiusClass = getRadiusClass(radius);

  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Active in-progress orders
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'مسودة' && o.status !== 'مغلق');
  }, [orders]);

  // Aggregate stage statistics from actual orders
  const stageStats = useMemo(() => {
    let cuttingCount = 0;
    let cuttingPcs = 0;
    let prepCount = 0;
    let prepPcs = 0;
    let printCount = 0;
    let printPcs = 0;
    let sewCount = 0;
    let sewPcs = 0;
    let finishCount = 0;
    let finishPcs = 0;
    let ironCount = 0;
    let ironPcs = 0;
    let packCount = 0;
    let packPcs = 0;
    let warehousePcs = 0;

    activeOrders.forEach((o) => {
      const totalOrderPcs = o.totalQuantity || 0;
      const batches = o.batches || [];

      // If cut is not yet approved
      if (!o.cutData?.approvedAt) {
        cuttingCount += 1;
        cuttingPcs += totalOrderPcs;
      }

      batches.forEach((b) => {
        const batchQty = b.quantity || 0;
        if (b.prepStatus === 'جاري' || b.prepStatus === 'لم يبدأ') {
          prepCount += 1;
          prepPcs += batchQty;
        }
        if (b.printEmbroideryStatus === 'جاري') {
          printCount += 1;
          printPcs += batchQty;
        }
        if (b.sewingData?.status === 'جاري') {
          sewCount += 1;
          sewPcs += batchQty;
        }
        if (b.finishingData?.status === 'جاري') {
          finishCount += 1;
          finishPcs += batchQty;
        }
        if (b.ironingData?.status === 'جاري') {
          ironCount += 1;
          ironPcs += batchQty;
        }
      });

      // Packing
      if (o.status === 'التغليف معتمد' || o.packingStatus === 'مكتمل') {
        warehousePcs += totalOrderPcs;
      } else if (o.packingStatus === 'جاري') {
        packCount += 1;
        packPcs += totalOrderPcs;
      }
    });

    return {
      cutting: { count: cuttingCount, pcs: cuttingPcs },
      prep: { count: prepCount, pcs: prepPcs },
      print: { count: printCount, pcs: printPcs },
      sewing: { count: sewCount, pcs: sewPcs },
      finishing: { count: finishCount, pcs: finishPcs },
      ironing: { count: ironCount, pcs: ironPcs },
      packing: { count: packCount, pcs: packPcs },
      warehouse: { pcs: warehousePcs },
    };
  }, [activeOrders]);

  // Total active pieces in production line
  const totalInLinePcs = useMemo(() => {
    return activeOrders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);
  }, [activeOrders]);

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
              {totalInLinePcs.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">قطعة</span>
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
              {stageStats.warehouse.pcs.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">قطعة معتمدة</span>
          </div>
        </div>
      </section>

      {/* Industrial Pipeline Stage Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        {/* 1. القص */}
        <div className={`bg-white dark:bg-[#150d24] border border-slate-200/90 dark:border-purple-950/50 ${radiusClass} p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <Scissors className="w-4 h-4 text-amber-500" />
              1. صالة القص
            </span>
            <span className="tabular-nums font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              {stageStats.cutting.count} أوامر
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {stageStats.cutting.pcs.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">قطعة جارية</span>
          </div>
        </div>

        {/* 2. التجهيز */}
        <div className={`bg-white dark:bg-[#150d24] border border-slate-200/90 dark:border-purple-950/50 ${radiusClass} p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <Boxes className="w-4 h-4 text-indigo-500" />
              2. التجهيز
            </span>
            <span className="tabular-nums font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
              {stageStats.prep.count} باتش
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {stageStats.prep.pcs.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">قطعة جارية</span>
          </div>
        </div>

        {/* 3. الطباعة والتطريز */}
        <div className={`bg-white dark:bg-[#150d24] border border-slate-200/90 dark:border-purple-950/50 ${radiusClass} p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <Sparkles className="w-4 h-4 text-purple-500" />
              3. طباعة/تطريز
            </span>
            <span className="tabular-nums font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
              {stageStats.print.count} باتش
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {stageStats.print.pcs.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">قطعة جارية</span>
          </div>
        </div>

        {/* 4. الخياطة */}
        <div className={`bg-white dark:bg-[#150d24] border border-blue-300 dark:border-blue-900/60 ${radiusClass} p-3.5 flex flex-col justify-between shadow-2xs ring-1 ring-blue-500/20`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <Shirt className="w-4 h-4 text-blue-500" />
              4. خطوط الخياطة
            </span>
            <span className="tabular-nums font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {stageStats.sewing.count} باتش
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-blue-950 dark:text-blue-100 font-mono tabular-nums">
              {stageStats.sewing.pcs.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">قطعة جارية</span>
          </div>
        </div>

        {/* 5. التشطيب */}
        <div className={`bg-white dark:bg-[#150d24] border border-slate-200/90 dark:border-purple-950/50 ${radiusClass} p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              5. التشطيب
            </span>
            <span className="tabular-nums font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {stageStats.finishing.count} باتش
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {stageStats.finishing.pcs.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">قطعة جارية</span>
          </div>
        </div>

        {/* 6. الكي */}
        <div className={`bg-white dark:bg-[#150d24] border border-slate-200/90 dark:border-purple-950/50 ${radiusClass} p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <Flame className="w-4 h-4 text-amber-500" />
              6. قسم الكي
            </span>
            <span className="tabular-nums font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              {stageStats.ironing.count} باتش
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {stageStats.ironing.pcs.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">قطعة جارية</span>
          </div>
        </div>

        {/* 7. التعبئة */}
        <div className={`bg-white dark:bg-[#150d24] border border-slate-200/90 dark:border-purple-950/50 ${radiusClass} p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <PackageCheck className="w-4 h-4 text-teal-500" />
              7. التعبئة
            </span>
            <span className="tabular-nums font-mono text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
              {stageStats.packing.count} أوامر
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {stageStats.packing.pcs.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">قطعة جارية</span>
          </div>
        </div>
      </section>

      {/* Main Floor Orders Feed */}
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
                  <th className="py-3 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-purple-950/40">
                {activeOrders.map((o) => {
                  const isCutDone = Boolean(o.cutData?.approvedAt);
                  const batchesCount = o.batches?.length || 0;
                  const sewingDoneBatches = o.batches?.filter((b) => b.sewingData?.status === 'مكتمل').length || 0;
                  const ironingDoneBatches = o.batches?.filter((b) => b.ironingData?.status === 'مكتمل').length || 0;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-purple-950/30 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {o.orderNumber}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{o.styleName || '—'}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{o.customerName || 'بدون عميل'}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-black text-amber-600 dark:text-amber-400 tabular-nums">
                        {(o.totalQuantity || 0).toLocaleString()} قطعة
                      </td>
                      <td className="py-3.5 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300 font-semibold">
                        {batchesCount}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-[11px] font-bold">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {isCutDone ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            معتمد ({o.cutData?.totalActualQuantity || 0})
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">جاري القص</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="tabular-nums font-mono font-bold text-slate-800 dark:text-slate-200">
                          {sewingDoneBatches} / {batchesCount} مكتمل
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="tabular-nums font-mono font-bold text-slate-800 dark:text-slate-200">
                          {ironingDoneBatches} / {batchesCount} مكوي
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onNavigateToOrder?.(o.id, 'production')}
                          className="px-3 py-1.5 rounded-lg bg-[#2C1151] hover:bg-[#3d1870] text-amber-400 border border-amber-500/30 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                        >
                          عرض التفاصيل
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
    </div>
  );
};
