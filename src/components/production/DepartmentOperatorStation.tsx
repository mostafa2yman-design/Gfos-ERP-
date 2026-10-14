import React, { useState, useEffect, useMemo } from 'react';
import { ProductionOrder } from '../../types';
import { getOrders } from '../../lib/storage';
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
  Users
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
    { id: 'cut', name: '1. صالة القص', icon: Scissors, tab: 'cut' },
    { id: 'prep', name: '2. التجهيز والملحقات', icon: Boxes, tab: 'prep' },
    { id: 'print', name: '3. الطباعة والتطريز', icon: Sparkles, tab: 'print' },
    { id: 'sew', name: '4. خطوط الخياطة', icon: Shirt, tab: 'sew' },
    { id: 'finish', name: '5. التشطيب والجودة', icon: CheckCircle2, tab: 'finish' },
    { id: 'ironing', name: '6. قسم الكي', icon: Flame, tab: 'ironing' },
    { id: 'packing', name: '7. التعبئة والتغليف', icon: PackageCheck, tab: 'packing' },
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
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#150d24] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="رجوع"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-[#2C1151] text-white flex items-center justify-center font-black">
            <Shirt className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white">
              محطة تشغيل الأقسام الميدانية — Operator Station
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              واجهة تشغيلية سريعة ومبسطة لمشرفي الأقسام والعمال لتسجيل الإنجاز المباشر
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Department Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 p-1 bg-slate-100 dark:bg-[#1a102e] rounded-xl border border-slate-200/80 dark:border-slate-800/80">
        {departmentsConfig.map((dept) => {
          const Icon = dept.icon;
          const isActive = selectedDept === dept.id;
          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id as OperatorDepartment)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2C1151] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{dept.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#150d24] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الأمر، الباتش، اسم الموديل أو المسؤول..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1d1233] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2C1151]"
          />
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
          إجمالي العناصر: {departmentItems.length}
        </div>
      </div>

      {/* Work Items Grid */}
      {departmentItems.length === 0 ? (
        <div className="bg-white dark:bg-[#150d24] border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
            لا توجد باتشات جارية في هذا القسم
          </p>
          <p className="text-xs text-slate-400 mt-1">
            عند وجود أوامر إنتاج في مرحلة {departmentsConfig.find((d) => d.id === selectedDept)?.name} ستظهر بطاقاتها هنا فوراً
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {departmentItems.map((item, idx) => (
            <div
              key={`${item.orderId}_${item.batchNumber || idx}`}
              className="bg-white dark:bg-[#150d24] border border-slate-200/90 dark:border-slate-800/90 rounded-xl p-4 hover:border-[#2C1151]/60 dark:hover:border-purple-600/60 transition-all flex flex-col justify-between shadow-2xs group"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-900 dark:text-white">
                    <span>{item.orderNumber}</span>
                    {item.batchNumber && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                        باتش {item.batchNumber}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'مكتمل' || item.status === 'معتمد'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : item.status === 'جاري'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {item.styleName}
                  </div>
                  {item.customerName && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      عميل: {item.customerName}
                    </div>
                  )}
                  {item.sizeSummary && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      المقاسات: {item.sizeSummary}
                    </div>
                  )}
                  {item.responsible && (
                    <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                      <Users className="w-3 h-3" />
                      <span>المسؤول: {item.responsible}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="font-mono tabular-nums font-black text-base text-slate-900 dark:text-white">
                  {item.quantity} <span className="text-xs font-normal text-slate-500">قطعة</span>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToOrder?.(item.orderId, item.tab)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2C1151] hover:bg-[#3d1870] dark:bg-[#4a1c87] dark:hover:bg-[#5b23a5] text-amber-300 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <span>تسجيل الإنتاج</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
