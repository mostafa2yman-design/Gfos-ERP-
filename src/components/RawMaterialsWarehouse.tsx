import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  RefreshCw,
  Printer,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Calendar,
  DollarSign,
  Tag,
  Scissors,
  Package,
  LayoutGrid,
  Table as TableIcon,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';
import {
  RawMaterialsInventoryState,
  MaterialStockItem,
  calculateRawMaterialsInventory
} from '../lib/rawMaterialsInventory';
import { MaterialMovementLedgerModal } from './warehouse/MaterialMovementLedgerModal';
import { StockAdjustmentModal } from './warehouse/StockAdjustmentModal';
import { SensitiveDataMask } from './common/SensitiveDataMask';

interface RawMaterialsWarehouseProps {
  onNavigateToPurchases?: () => void;
  onNavigateToAccountingMaterials?: () => void;
  initialTab?: 'fabrics' | 'accessories' | 'all';
}

export function RawMaterialsWarehouse({
  onNavigateToPurchases,
  onNavigateToAccountingMaterials,
  initialTab = 'fabrics'
}: RawMaterialsWarehouseProps) {
  const [activeTab, setActiveTab] = useState<'fabrics' | 'accessories' | 'all'>(initialTab);
  const [inventory, setInventory] = useState<RawMaterialsInventoryState | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'value_desc' | 'stock_desc' | 'cost_desc' | 'name'>('value_desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialStockItem | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentTargetMaterial, setAdjustmentTargetMaterial] = useState<MaterialStockItem | null>(null);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await calculateRawMaterialsInventory();
      setInventory(data);
    } catch (e) {
      console.error('Failed to load raw materials inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();

    const handleUpdate = () => loadInventory();
    window.addEventListener('raw_materials_updated', handleUpdate);
    window.addEventListener('purchases_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('raw_materials_updated', handleUpdate);
      window.removeEventListener('purchases_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Update selected material if modal is open and inventory refreshed
  useEffect(() => {
    if (selectedMaterial && inventory) {
      const updated = inventory.allMaterials.find(m => m.id === selectedMaterial.id);
      if (updated) setSelectedMaterial(updated);
    }
  }, [inventory]);

  // Current tab items & stats
  const { currentItems, currentStats } = useMemo(() => {
    if (!inventory) {
      return { currentItems: [], currentStats: null };
    }
    if (activeTab === 'fabrics') {
      return { currentItems: inventory.fabrics, currentStats: inventory.fabricsStats };
    }
    if (activeTab === 'accessories') {
      return { currentItems: inventory.accessories, currentStats: inventory.accessoriesStats };
    }
    return { currentItems: inventory.allMaterials, currentStats: inventory.overallStats };
  }, [inventory, activeTab]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = currentItems.filter(item => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(term);
        const matchesCode = item.code.toLowerCase().includes(term);
        const matchesUnit = item.unit.toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesUnit) return false;
      }

      // Status
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'value_desc') return b.totalStockValue - a.totalStockValue;
      if (sortBy === 'stock_desc') return b.currentStock - a.currentStock;
      if (sortBy === 'cost_desc') return b.averageCost - a.averageCost;
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
      return 0;
    });

    return result;
  }, [currentItems, searchTerm, statusFilter, sortBy]);

  const handleOpenLedger = (material: MaterialStockItem) => {
    setSelectedMaterial(material);
  };

  const handleOpenAdjustment = (material?: MaterialStockItem) => {
    setAdjustmentTargetMaterial(material || null);
    setShowAdjustmentModal(true);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Main Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-md">
              <Boxes className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  إدارة المشتريات والمخازن
                </span>
                <span className="text-xs text-slate-400 font-medium">• حركة الخامات المستمرة</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                مخزن الأقمشة والإكسسوارات ومستلزمات الإنتاج
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                متابعة دقيقة للأرصدة المتوفرة عدداً وقيمة مالية، وتتبع حركات الوارد من فواتير الشراء والمنصرف لأوامر التشغيل والقص
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => handleOpenAdjustment()}
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="تسجيل إذن تسوية مخزنية أو رصيد افتتاحي"
            >
              <Plus className="w-4 h-4" />
              <span>تسوية / رصيد افتتاحي</span>
            </button>

            {onNavigateToPurchases && (
              <button
                onClick={onNavigateToPurchases}
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                title="الانتقال لإدارة فواتير المشتريات والتوريد"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>فواتير المشتريات</span>
              </button>
            )}

            <button
              onClick={handlePrintSummary}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="طباعة تقرير جرد المخزن"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الجرد</span>
            </button>

            <button
              onClick={loadInventory}
              type="button"
              className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Separator and Warehouse Tab Selector */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Distinct Warehouse Tabs */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl gap-1">
            {/* Fabrics Warehouse Tab */}
            <button
              onClick={() => setActiveTab('fabrics')}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'fabrics'
                  ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${activeTab === 'fabrics' ? 'bg-indigo-600' : 'bg-slate-400'}`} />
              <span>🧵 مخزن الأقمشة</span>
              {inventory && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                  activeTab === 'fabrics' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  <span>{inventory.fabrics.length} صنف |</span>
                  <SensitiveDataMask
                    dataKey="inventory.view_valuation"
                    value={`${inventory.fabricsStats.totalStockValue.toLocaleString('ar-EG')} ج.م`}
                    compact
                  />
                </span>
              )}
            </button>

            {/* Accessories Warehouse Tab */}
            <button
              onClick={() => setActiveTab('accessories')}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'accessories'
                  ? 'bg-white text-amber-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${activeTab === 'accessories' ? 'bg-amber-600' : 'bg-slate-400'}`} />
              <span>🧷 مخزن الإكسسوارات والمستلزمات</span>
              {inventory && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                  activeTab === 'accessories' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  <span>{inventory.accessories.length} صنف |</span>
                  <SensitiveDataMask
                    dataKey="inventory.view_valuation"
                    value={`${inventory.accessoriesStats.totalStockValue.toLocaleString('ar-EG')} ج.م`}
                    compact
                  />
                </span>
              )}
            </button>

            {/* Combined All Tab */}
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📊 العرض المجمع (الكل)</span>
              {inventory && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-600">
                  {inventory.allMaterials.length}
                </span>
              )}
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 self-end sm:self-auto bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="عرض جدول منظم"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="عرض بطاقات تفصيلية"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row (Displaying Count and Value Organically) */}
      {currentStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Stock Value */}
          <div className="bg-white dark:bg-[#150d24] p-5 rounded-2xl border border-slate-200 dark:border-purple-950/70 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              <span>إجمالي قيمة رصيد المخزن</span>
              <span className="p-2 bg-purple-50 dark:bg-purple-950/50 text-[#2C1151] dark:text-amber-400 rounded-xl border border-purple-200 dark:border-purple-800/60">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                <SensitiveDataMask
                  dataKey="inventory.view_valuation"
                  value={currentStats.totalStockValue.toLocaleString('ar-EG')}
                />
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ج.م</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-purple-950/60">
              <span>عدد الأصناف:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{currentStats.totalItemsCount} صنف</span>
            </div>
          </div>

          {/* 2. Total In-Stock Quantity */}
          <div className="bg-white dark:bg-[#150d24] p-5 rounded-2xl border border-slate-200 dark:border-purple-950/70 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              <span>رصيد المخزن الحالي (الكميات)</span>
              <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <Package className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {currentStats.totalStockQuantity.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {activeTab === 'fabrics' ? 'كجم / متر' : activeTab === 'accessories' ? 'وحدة / قطعة' : 'كميات مجمعة'}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-purple-950/60">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>متوفر:</span>
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentStats.inStockCount} صنف</span>
            </div>
          </div>

          {/* 3. Inbound Purchases */}
          <div className="bg-white dark:bg-[#150d24] p-5 rounded-2xl border border-slate-200 dark:border-purple-950/70 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">إجمالي الوارد (توريدات الشراء)</span>
              <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <ArrowDownLeft className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                +{currentStats.totalInQuantity.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">كمية</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-purple-950/60">
              <span>القيمة التوريدية:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">{currentStats.totalInValue.toLocaleString('ar-EG')} ج.م</span>
            </div>
          </div>

          {/* 4. Outbound Production */}
          <div className="bg-white dark:bg-[#150d24] p-5 rounded-2xl border border-slate-200 dark:border-purple-950/70 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-rose-700 dark:text-rose-400 font-bold">إجمالي المنصرف (تشغيل وقص)</span>
              <span className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800/60">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-400 font-mono tabular-nums">
                -{currentStats.totalOutQuantity.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">كمية</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-purple-950/60">
              <span>قيمة المنصرف:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">{currentStats.totalOutValue.toLocaleString('ar-EG')} ج.م</span>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث باسم الخامة أو الكود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Filter by Stock Status */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({currentItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('in_stock')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'in_stock' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>متوفر</span>
            </button>
            <button
              onClick={() => setStatusFilter('low_stock')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'low_stock' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>منخفض</span>
            </button>
            <button
              onClick={() => setStatusFilter('out_of_stock')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'out_of_stock' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>نفد</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mr-auto md:mr-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="value_desc">الأعلى قيمة مالية (ج.م)</option>
              <option value="stock_desc">الأكبر رصيداً متوفراً</option>
              <option value="cost_desc">الأعلى سعر تكلفة</option>
              <option value="name">أبجدياً (أ - ي)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">جاري احتساب ومطابقة حركات المخزن من فواتير الشراء وأوامر التشغيل...</p>
        </div>
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">لا توجد خامات مطابقة لمعايير البحث في هذا المخزن</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            يمكنك تسجيل فواتير شراء لتوريد الخامات أو تسجيل رصيد افتتاحي/تسوية مخزنية
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => handleOpenAdjustment()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              إضافة رصيد افتتاحي
            </button>
            {onNavigateToPurchases && (
              <button
                onClick={onNavigateToPurchases}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                تسجيل فاتورة شراء جديدة
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Organized Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">كود الخامة</th>
                  <th className="py-3.5 px-4">اسم الخامة والتصنيف</th>
                  <th className="py-3.5 px-3 text-center">الوحدة</th>
                  <th className="py-3.5 px-4 text-center bg-indigo-50/50 text-indigo-950 font-black">
                    رصيد المخزن الحالي (العدد/الكمية)
                  </th>
                  <th className="py-3.5 px-3 text-center">متوسط التكلفة</th>
                  <th className="py-3.5 px-4 text-center bg-emerald-50/50 text-emerald-950 font-black">
                    إجمالي القيمة المالية
                  </th>
                  <th className="py-3.5 px-3 text-center">إجمالي الوارد</th>
                  <th className="py-3.5 px-3 text-center">إجمالي المنصرف</th>
                  <th className="py-3.5 px-3 text-center">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAndSortedItems.map((item) => {
                  const isFabric = item.type === 'fabric';
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenLedger(item)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 group-hover:bg-white px-2 py-0.5 rounded border border-slate-200">
                          {item.code}
                        </span>
                      </td>

                      {/* Name & Type */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isFabric ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                          <span>{isFabric ? 'أقمشة وتريكو' : 'إكسسوارات ومستلزمات'}</span>
                          {item.lastMovementDate && (
                            <span>• آخر حركة: {item.lastMovementDate}</span>
                          )}
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap text-slate-600 font-bold">
                        {item.unit}
                      </td>

                      {/* Current Stock (Count/Quantity) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap bg-indigo-50/20">
                        <div className="text-base font-black font-mono text-indigo-950">
                          {item.currentStock.toLocaleString('ar-EG')}
                        </div>
                        <span className="text-[10px] text-indigo-600 font-bold">
                          {item.unit} متوفر
                        </span>
                      </td>

                      {/* Average Cost */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap text-slate-700 font-mono">
                        <div className="font-bold">
                          <SensitiveDataMask
                            dataKey="materials.view_prices"
                            value={`${item.averageCost.toLocaleString('ar-EG')} ج.م`}
                            compact
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">لـ {item.unit}</span>
                      </td>

                      {/* Total Stock Value */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap bg-emerald-50/20">
                        <div className="text-sm font-black font-mono text-emerald-800">
                          <SensitiveDataMask
                            dataKey="inventory.view_valuation"
                            value={`${item.totalStockValue.toLocaleString('ar-EG')} ج.م`}
                            compact
                          />
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          قيمة المخزون
                        </span>
                      </td>

                      {/* Total In */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap text-emerald-700 font-mono">
                        <div className="font-bold">+{item.totalInQuantity.toLocaleString('ar-EG')}</div>
                        <span className="text-[10px] text-slate-400">{item.totalInValue.toLocaleString('ar-EG')} ج.م</span>
                      </td>

                      {/* Total Out */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap text-rose-700 font-mono">
                        <div className="font-bold">-{item.totalOutQuantity.toLocaleString('ar-EG')}</div>
                        <span className="text-[10px] text-slate-400">{item.totalOutValue.toLocaleString('ar-EG')} ج.م</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.status === 'in_stock'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.status === 'low_stock'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {item.status === 'in_stock' ? 'متوفر' : item.status === 'low_stock' ? 'منخفض' : 'نفد الرصيد'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenLedger(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="تتبع حركة الخامة وارد ومنصرف بالتفصيل"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>تتبع الحركة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenAdjustment(item)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="إضافة تسوية مخزنية أو رصيد افتتاحي"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              يتم عرض <span className="font-bold text-slate-800">{filteredAndSortedItems.length}</span> من أصل <span className="font-bold text-slate-800">{currentItems.length}</span> صنف مسجل
            </div>
            <div className="flex items-center gap-4">
              <span>إجمالي قيمة الأصناف المعروضة:</span>
              <span className="font-black text-indigo-900 font-mono text-sm">
                {filteredAndSortedItems.reduce((acc, m) => acc + m.totalStockValue, 0).toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedItems.map((item) => {
            const isFabric = item.type === 'fabric';
            return (
              <div
                key={item.id}
                onClick={() => handleOpenLedger(item)}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all p-5 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top line of Card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.code}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'in_stock'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'low_stock'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.status === 'in_stock' ? 'متوفر' : item.status === 'low_stock' ? 'منخفض' : 'نفد الرصيد'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-2">
                    {item.name}
                  </h3>

                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isFabric ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                    <span>{isFabric ? 'مخزن الأقمشة' : 'مخزن الإكسسوارات'}</span>
                    <span>• الوحدة: {item.unit}</span>
                  </div>

                  {/* Stock Count and Value Highlight Box */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold">الرصيد المتوفر</div>
                      <div className="text-lg font-black text-indigo-950 font-mono">
                        {item.currentStock.toLocaleString('ar-EG')}
                      </div>
                      <div className="text-[10px] text-slate-500">{item.unit}</div>
                    </div>
                    <div className="border-r border-slate-200 pr-2">
                      <div className="text-[10px] text-slate-500 font-bold">القيمة المالية</div>
                      <div className="text-lg font-black text-emerald-700 font-mono">
                        <SensitiveDataMask
                          dataKey="inventory.view_valuation"
                          value={`${item.totalStockValue.toLocaleString('ar-EG')} ج.م`}
                          compact
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inbound & Outbound Sub-stats */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between text-emerald-700 bg-emerald-50/50 p-2 rounded-lg">
                      <span className="flex items-center gap-1 font-bold">
                        <ArrowDownLeft className="w-3 h-3" />
                        <span>وارد:</span>
                      </span>
                      <span className="font-mono font-bold">+{item.totalInQuantity}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-700 bg-rose-50/50 p-2 rounded-lg">
                      <span className="flex items-center gap-1 font-bold">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>منصرف:</span>
                      </span>
                      <span className="font-mono font-bold">-{item.totalOutQuantity}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    متوسط التكلفة: <SensitiveDataMask dataKey="materials.view_prices" value={`${item.averageCost} ج.م`} compact />
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenLedger(item);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>تتبع الحركة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Movement Ledger Modal (Detailed Tracking) */}
      {selectedMaterial && (
        <MaterialMovementLedgerModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          onOpenAdjustment={(mat) => handleOpenAdjustment(mat)}
          onRefresh={loadInventory}
        />
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && inventory && (
        <StockAdjustmentModal
          material={adjustmentTargetMaterial}
          materialsList={inventory.allMaterials}
          onClose={() => {
            setShowAdjustmentModal(false);
            setAdjustmentTargetMaterial(null);
          }}
          onSaved={() => {
            loadInventory();
          }}
        />
      )}
    </div>
  );
}
