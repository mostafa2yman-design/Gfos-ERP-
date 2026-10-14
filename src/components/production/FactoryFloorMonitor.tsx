import React, { useState, useEffect, useMemo } from 'react';
import { ProductionOrder } from '../../types';
import { getOrders } from '../../lib/storage';
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
  AlertTriangle,
  Clock,
  ArrowRight,
  Activity,
  Layers,
  ChevronLeft
} from 'lucide-react';

interface FactoryFloorMonitorProps {
  onBack?: () => void;
  onNavigateToOrder?: (orderId: string, tab?: string) => void;
}

export const FactoryFloorMonitor: React.FC<FactoryFloorMonitorProps> = ({
  onBack,
  onNavigateToOrder,
}) => {
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
    <div className="min-h-screen bg-[#0d071a] text-slate-100 p-4 lg:p-6 flex flex-col font-sans">
      {/* Top TV Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-purple-950/60 mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-slate-300 transition-colors cursor-pointer"
              title="رجوع"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-[#2C1151] border border-amber-500/30 flex items-center justify-center">
            <Tv className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                غرفة القيادة اللحظية — صالة إنتاج المصنع
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                بث مباشر
              </span>
            </div>
            <p className="text-xs text-slate-400">
              GFOS Factory Floor Big Screen Monitor — متابعة لحظية للأوامر والباتشات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-900/40 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>آخر تحديث: </span>
            <span className="font-mono font-bold tabular-nums text-white">
              {lastRefreshed.toLocaleTimeString('ar-EG')}
            </span>
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg bg-purple-950/50 hover:bg-purple-900 text-slate-300 transition-colors cursor-pointer"
            title="تحديث البيانات الآن"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#2C1151] hover:bg-[#3d1870] text-amber-400 border border-amber-500/30 transition-colors cursor-pointer"
            title="وضع ملء الشاشة الكبيرة"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* High-Level Overview Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="bg-[#170e28] border border-purple-900/50 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-semibold block mb-1">
            الأوامر قيد التشغيل
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white font-mono tabular-nums">
              {activeOrders.length}
            </span>
            <span className="text-xs text-slate-400">أمر نشط</span>
          </div>
        </div>

        <div className="bg-[#170e28] border border-purple-900/50 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-semibold block mb-1">
            إجمالي قطع الصالة الجارية
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400 font-mono tabular-nums">
              {totalInLinePcs.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">قطعة</span>
          </div>
        </div>

        <div className="bg-[#170e28] border border-purple-900/50 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-semibold block mb-1">
            أوامر مسودة للتخطيط
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-300 font-mono tabular-nums">
              {orders.filter((o) => o.status === 'مسودة').length}
            </span>
            <span className="text-xs text-slate-400">بانتظار الاعتماد</span>
          </div>
        </div>

        <div className="bg-[#170e28] border border-purple-900/50 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-semibold block mb-1">
            جاهز بالمخزن التام
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400 font-mono tabular-nums">
              {stageStats.warehouse.pcs.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">قطعة معتمدة</span>
          </div>
        </div>
      </section>

      {/* Industrial Pipeline Stage Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {/* 1. القص */}
        <div className="bg-[#140b24] border border-purple-900/40 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-200">
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              1. صالة القص
            </span>
            <span className="tabular-nums font-mono text-[11px] text-amber-400">
              {stageStats.cutting.count} أوامر
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {stageStats.cutting.pcs.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">قطعة جارية</span>
          </div>
        </div>

        {/* 2. التجهيز */}
        <div className="bg-[#140b24] border border-purple-900/40 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-200">
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              2. التجهيز
            </span>
            <span className="tabular-nums font-mono text-[11px] text-amber-400">
              {stageStats.prep.count} باتش
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {stageStats.prep.pcs.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">قطعة جارية</span>
          </div>
        </div>

        {/* 3. الطباعة والتطريز */}
        <div className="bg-[#140b24] border border-purple-900/40 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              3. طباعة/تطريز
            </span>
            <span className="tabular-nums font-mono text-[11px] text-purple-400">
              {stageStats.print.count} باتش
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {stageStats.print.pcs.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">قطعة جارية</span>
          </div>
        </div>

        {/* 4. الخياطة */}
        <div className="bg-[#140b24] border border-blue-900/50 rounded-xl p-3 flex flex-col justify-between ring-1 ring-blue-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-blue-300">
              <Shirt className="w-3.5 h-3.5 text-blue-400" />
              4. خطوط الخياطة
            </span>
            <span className="tabular-nums font-mono text-[11px] text-blue-400 font-bold">
              {stageStats.sewing.count} باتش
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-blue-100 font-mono tabular-nums">
              {stageStats.sewing.pcs.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">قطعة جارية</span>
          </div>
        </div>

        {/* 5. التشطيب */}
        <div className="bg-[#140b24] border border-purple-900/40 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              5. التشطيب
            </span>
            <span className="tabular-nums font-mono text-[11px] text-emerald-400">
              {stageStats.finishing.count} باتش
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {stageStats.finishing.pcs.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">قطعة جارية</span>
          </div>
        </div>

        {/* 6. الكي */}
        <div className="bg-[#140b24] border border-purple-900/40 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-200">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              6. قسم الكي
            </span>
            <span className="tabular-nums font-mono text-[11px] text-amber-500">
              {stageStats.ironing.count} باتش
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {stageStats.ironing.pcs.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">قطعة جارية</span>
          </div>
        </div>

        {/* 7. التعبئة */}
        <div className="bg-[#140b24] border border-purple-900/40 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-200">
              <PackageCheck className="w-3.5 h-3.5 text-teal-400" />
              7. التعبئة
            </span>
            <span className="tabular-nums font-mono text-[11px] text-teal-400">
              {stageStats.packing.count} أوامر
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {stageStats.packing.pcs.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">قطعة جارية</span>
          </div>
        </div>
      </section>

      {/* Main Floor Orders Feed */}
      <section className="flex-1 bg-[#140a22] border border-purple-950/80 rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-purple-950 mb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>جدول التشغيل المباشر لأوامر المصنع الحالية</span>
          </h2>
          <span className="text-xs text-slate-400">
            {activeOrders.length} أوامر تحت التشغيل الميداني
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <Boxes className="w-12 h-12 stroke-[1.2] text-slate-600 mb-2" />
            <p className="font-bold text-sm text-slate-300">لا توجد أوامر قيد التشغيل حالياً</p>
            <p className="text-xs text-slate-500">
              سيظهر هنا تدفق الباتشات والإنتاج اللحظي بمجرد تفعيل أمر إنتاج
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-purple-950 text-slate-400">
                  <th className="py-2.5 px-3">رقم الأمر</th>
                  <th className="py-2.5 px-3">العميل / القصة</th>
                  <th className="py-2.5 px-3">الكمية الكلية</th>
                  <th className="py-2.5 px-3">عدد الباتشات</th>
                  <th className="py-2.5 px-3">حالة الأمر</th>
                  <th className="py-2.5 px-3">القص</th>
                  <th className="py-2.5 px-3">الخياطة</th>
                  <th className="py-2.5 px-3">الكي / التعبئة</th>
                  <th className="py-2.5 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/50">
                {activeOrders.map((o) => {
                  const isCutDone = Boolean(o.cutData?.approvedAt);
                  const batchesCount = o.batches?.length || 0;
                  const sewingDoneBatches = o.batches?.filter((b) => b.sewingData?.status === 'مكتمل').length || 0;
                  const ironingDoneBatches = o.batches?.filter((b) => b.ironingData?.status === 'مكتمل').length || 0;

                  return (
                    <tr key={o.id} className="hover:bg-purple-950/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-200">{o.styleName || '—'}</div>
                        <div className="text-[10px] text-slate-400">{o.customerName || 'بدون عميل'}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-amber-300 tabular-nums">
                        {(o.totalQuantity || 0).toLocaleString()} قطعة
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-300">
                        {batchesCount}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/40 text-[11px] font-bold">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {isCutDone ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            معتمد ({o.cutData?.totalActualQuantity || 0})
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold">جاري القص</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="tabular-nums font-mono font-bold text-slate-200">
                          {sewingDoneBatches} / {batchesCount} مكتمل
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="tabular-nums font-mono font-bold text-slate-200">
                          {ironingDoneBatches} / {batchesCount} مكوي
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onNavigateToOrder?.(o.id, 'production')}
                          className="px-2.5 py-1 rounded bg-[#2C1151] hover:bg-[#3d1870] text-amber-400 border border-amber-500/30 font-bold text-[11px] transition-colors cursor-pointer"
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
