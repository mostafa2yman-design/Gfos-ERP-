import React, { useState, useEffect, useMemo } from 'react';
import { ProductionOrder } from '../../types';
import { getOrders } from '../../lib/storage';
import { useTheme } from '../../contexts/ThemeContext';
import { getPrimaryBg, getPrimaryText, getRadiusClass } from '../../lib/theme';
import {
  Scissors,
  Boxes,
  Sparkles,
  Shirt,
  CheckCircle2,
  Flame,
  PackageCheck,
  Search,
  Filter,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Layers,
  ChevronLeft,
  Users,
  Sliders,
  Check,
  Activity
} from 'lucide-react';

export type OperatorDepartment =
  | 'cut'
  | 'prep'
  | 'print'
  | 'sew'
  | 'finish'
  | 'ironing'
  | 'packing';

interface DepartmentOperatorStationProps {
  onBack?: () => void;
  onNavigateToOrder?: (orderId: string, tab: string) => void;
  initialDepartment?: OperatorDepartment;
}

export const DepartmentOperatorStation: React.FC<DepartmentOperatorStationProps> = ({
  onBack,
  onNavigateToOrder,
  initialDepartment = 'sew',
}) => {
  const { color, radius } = useTheme();
  const primaryBg = getPrimaryBg(color);
  const primaryText = getPrimaryText(color);
  const radiusClass = getRadiusClass(radius);

  const [selectedDept, setSelectedDept] = useState<OperatorDepartment>(initialDepartment);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const allOrders = await getOrders();
      setOrders(allOrders);
    } catch (e) {
      console.error('Error loading operator station data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('gfos_storage_update', loadData);
    return () => {
      window.removeEventListener('gfos_storage_update', loadData);
    };
  }, []);

  const departmentsConfig = [
    { id: 'cut', name: '1. صالة القص', icon: Scissors, tab: 'cut', accentColor: 'text-amber-500' },
    { id: 'prep', name: '2. التجهيز والملحقات', icon: Boxes, tab: 'prep', accentColor: 'text-indigo-500' },
    { id: 'print', name: '3. الطباعة والتطريز', icon: Sparkles, tab: 'print', accentColor: 'text-purple-500' },
    { id: 'sew', name: '4. خطوط الخياطة', icon: Shirt, tab: 'sew', accentColor: 'text-blue-500' },
    { id: 'finish', name: '5. التشطيب والجودة', icon: CheckCircle2, tab: 'finish', accentColor: 'text-emerald-500' },
    { id: 'ironing', name: '6. قسم الكي', icon: Flame, tab: 'ironing', accentColor: 'text-orange-500' },
    { id: 'packing', name: '7. التعبئة والتغليف', icon: PackageCheck, tab: 'packing', accentColor: 'text-teal-500' },
  ];

  // Active in-progress orders
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'مسودة' && o.status !== 'مغلق');
  }, [orders]);

  // Extract work items specific to the chosen department
  const departmentItems = useMemo(() => {
    const list: Array<{
      orderId: string;
      orderNumber: string;
      styleName: string;
      customerName?: string;
      batchNumber?: string;
      quantity: number;
      sizeSummary?: string;
      status: string;
      responsible?: string;
      tab: string;
    }> = [];

    activeOrders.forEach((o) => {
      if (selectedDept === 'cut') {
        const isCutApproved = Boolean(o.cutData?.approvedAt);
        list.push({
          orderId: o.id,
          orderNumber: o.orderNumber,
          styleName: o.styleName || '—',
          customerName: o.customerName,
          quantity: o.cutData?.totalActualQuantity || o.totalQuantity || 0,
          status: isCutApproved ? 'معتمد' : o.cutData ? 'مسجل مبدئي' : 'بانتظار القص',
          tab: 'cut',
        });
      } else {
        (o.batches || []).forEach((b) => {
          let stageStatus = 'غير محدد';
          let responsibleName = '';

          if (selectedDept === 'prep') {
            stageStatus = b.prepStatus || 'لم يبدأ';
          } else if (selectedDept === 'print') {
            stageStatus = b.printEmbroideryStatus || 'لم يبدأ';
          } else if (selectedDept === 'sew') {
            stageStatus = b.sewingData?.status || 'لم يبدأ';
            responsibleName = b.sewingData?.responsibleName || '';
          } else if (selectedDept === 'finish') {
            stageStatus = b.finishingData?.status || 'لم يبدأ';
          } else if (selectedDept === 'ironing') {
            stageStatus = b.ironingData?.status || 'لم يبدأ';
          } else if (selectedDept === 'packing') {
            stageStatus = o.packingStatus || 'لم يبدأ';
          }

          const sizesText = b.sizes
            ? Object.entries(b.sizes)
                .map(([s, q]) => `${s}: ${q}`)
                .join(', ')
            : '';

          list.push({
            orderId: o.id,
            orderNumber: o.orderNumber,
            styleName: o.styleName || '—',
            customerName: o.customerName,
            batchNumber: b.batchNumber,
            quantity: b.quantity || 0,
            sizeSummary: sizesText,
            status: stageStatus,
            responsible: responsibleName,
            tab: selectedDept,
          });
        });
      }
    });

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (item) =>
        item.orderNumber.toLowerCase().includes(term) ||
        item.styleName.toLowerCase().includes(term) ||
        (item.batchNumber && item.batchNumber.toLowerCase().includes(term)) ||
        (item.responsible && item.responsible.toLowerCase().includes(term))
    );
  }, [activeOrders, selectedDept, searchTerm]);

  return (
    <div className="space-y-5 font-sans">
      {/* Top Banner */}
      <div className={`bg-white dark:bg-[#150d24] ${radiusClass} p-4 sm:p-5 border border-slate-200 dark:border-purple-950/60 shadow-xs flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="رجوع"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 rounded-xl bg-[#2C1151] border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <Sliders className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                مراحل تشغيل أوامر الإنتاج
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                محطة المشرفين الميدانية
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              واجهة تشغيلية مركزية لمشرفي الصالة ومسؤولي الخطوط لمتابعة وتسجيل إنجاز الباتشات في كل مرحلة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1f1338] dark:hover:bg-[#2c1b4d] border border-slate-200 dark:border-purple-900/40 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* Department Selector Tabs */}
      <div className={`bg-white dark:bg-[#150d24] p-2 rounded-2xl border border-slate-200 dark:border-purple-950/60 shadow-2xs flex items-center gap-1.5 overflow-x-auto custom-scrollbar`}>
        {departmentsConfig.map((dept) => {
          const Icon = dept.icon;
          const isActive = selectedDept === dept.id;
          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id as OperatorDepartment)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2C1151] text-amber-300 dark:text-amber-400 border border-amber-500/40 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-purple-950/40 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : dept.accentColor}`} />
              <span>{dept.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#150d24] p-3.5 sm:p-4 ${radiusClass} border border-slate-200 dark:border-purple-950/60 shadow-2xs`}>
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الأمر، الباتش، اسم الموديل أو المسؤول..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-purple-900/40 bg-slate-50 dark:bg-[#1b1031] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 font-bold"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 tabular-nums">
            إجمالي الباتشات في هذه المرحلة: {departmentItems.length}
          </span>
        </div>
      </div>

      {/* Work Items Grid */}
      {departmentItems.length === 0 ? (
        <div className={`bg-white dark:bg-[#150d24] border border-dashed border-slate-200 dark:border-purple-950/70 ${radiusClass} p-12 text-center shadow-2xs`}>
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-black text-base text-slate-800 dark:text-slate-200">
            لا توجد باتشات جارية في هذا القسم حالياً
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            عند وجود أوامر إنتاج في مرحلة {departmentsConfig.find((d) => d.id === selectedDept)?.name} ستظهر بطاقاتها هنا فوراً
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentItems.map((item, idx) => (
            <div
              key={`${item.orderId}_${item.batchNumber || idx}`}
              className={`bg-white dark:bg-[#150d24] border border-slate-200 dark:border-purple-950/60 ${radiusClass} p-4.5 hover:border-purple-500/60 dark:hover:border-purple-600/60 transition-all flex flex-col justify-between shadow-2xs hover:shadow-md group`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-purple-950/60">
                  <div className="flex items-center gap-2 font-mono font-bold text-xs text-slate-900 dark:text-white">
                    <span className="text-slate-900 dark:text-white font-black">{item.orderNumber}</span>
                    {item.batchNumber && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-[11px] font-bold">
                        باتش {item.batchNumber}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                      item.status === 'مكتمل' || item.status === 'معتمد'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                        : item.status === 'جاري'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {item.styleName}
                  </div>
                  {item.customerName && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      العميل: {item.customerName}
                    </div>
                  )}
                  {item.sizeSummary && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate bg-slate-50 dark:bg-purple-950/30 p-1.5 rounded-lg border border-slate-100 dark:border-purple-900/30">
                      المقاسات: {item.sizeSummary}
                    </div>
                  )}
                  {item.responsible && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 font-bold mt-1">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>المسؤول: {item.responsible}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-purple-950/60">
                <div className="font-mono tabular-nums font-black text-lg text-slate-900 dark:text-white">
                  {item.quantity.toLocaleString()} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">قطعة</span>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToOrder?.(item.orderId, item.tab)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2C1151] hover:bg-[#3d1870] text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <span>تسجيل الإنتاج</span>
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
