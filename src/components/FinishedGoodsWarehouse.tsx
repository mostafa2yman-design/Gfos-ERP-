import React, { useState, useEffect, useMemo } from "react";
import { ProductionOrder, PackingInvoice } from "../types";
import { getOrders } from "../lib/storage";
import { 
  PackageCheck, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Boxes, 
  Calendar, 
  User, 
  Tag, 
  Printer, 
  Layers, 
  ExternalLink, 
  FileText,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Clock,
  Sparkles,
  TrendingUp,
  Barcode
} from "lucide-react";
import { eventBus } from "../lib/events/eventBus";
import { FinishedProductItem, ProductColorSummary, processOrderItem } from "../lib/finishedGoodsUtils";
import { PrintDocument, PrintHeader, PrintSection, PrintSignatures } from "./print/layout";

interface Props {
  onNavigateToOrder?: (orderId: string, tab?: string) => void;
  onNavigateToSales?: () => void;
}

export const FinishedGoodsWarehouse: React.FC<Props> = ({ onNavigateToOrder, onNavigateToSales }) => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "quantity" | "orderNumber">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"approved" | "pending">("approved");

  const loadOrdersData = async () => {
    setLoading(true);
    try {
      const allOrders = await getOrders();
      setOrders(allOrders);
    } catch (err) {
      console.error("Error loading orders for finished goods warehouse:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdersData();

    const handleUpdate = () => loadOrdersData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("gfos_storage_update", handleUpdate);
    window.addEventListener("finished_goods_updated", handleUpdate);
    window.addEventListener("sales_returns_updated", handleUpdate);
    const unsub = eventBus.subscribe("ORDER_UPDATED" as any, () => {
      loadOrdersData();
    });

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("gfos_storage_update", handleUpdate);
      window.removeEventListener("finished_goods_updated", handleUpdate);
      window.removeEventListener("sales_returns_updated", handleUpdate);
      unsub();
    };
  }, []);

  const processedItems = useMemo(() => {
    return orders.map(processOrderItem);
  }, [orders]);

  // Filter approved and ready/pending items
  const approvedItems = useMemo(() => {
    return processedItems.filter(item => item.isApproved);
  }, [processedItems]);

  const pendingItems = useMemo(() => {
    // Orders that have ironing completed or packing invoices started, but packing not approved yet
    return processedItems.filter(item => {
      if (item.isApproved) return false;
      const hasIroningDone = item.order.batches?.some(b => b.ironingData?.status === "مكتمل");
      const hasPackingInvoices = (item.order.packingInvoices && item.order.packingInvoices.length > 0);
      return hasIroningDone || hasPackingInvoices;
    });
  }, [processedItems]);

  // Current list based on active tab
  const currentItems = activeTab === "approved" ? approvedItems : pendingItems;

  // Filter and sort
  const filteredAndSortedItems = useMemo(() => {
    let result = currentItems.filter(item => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        item.order.orderNumber.toLowerCase().includes(term) ||
        item.order.styleName.toLowerCase().includes(term) ||
        item.order.customerName.toLowerCase().includes(term) ||
        (item.order.category && item.order.category.toLowerCase().includes(term)) ||
        (item.order.barcode && item.order.barcode.toLowerCase().includes(term)) ||
        (item.primaryBarcode && item.primaryBarcode.toLowerCase().includes(term)) ||
        (item.barcodes && item.barcodes.some(b => b.toLowerCase().includes(term)));

      const matchesCategory = categoryFilter === "all" || item.order.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime();
      } else if (sortBy === "quantity") {
        comparison = b.totalPieces - a.totalPieces;
      } else if (sortBy === "orderNumber") {
        comparison = a.order.orderNumber.localeCompare(b.order.orderNumber);
      }
      return sortOrder === "desc" ? comparison : -comparison;
    });

    return result;
  }, [currentItems, searchTerm, categoryFilter, sortBy, sortOrder]);

  // Key KPI stats
  const totalApprovedPieces = useMemo(() => {
    return approvedItems.reduce((sum, item) => sum + item.totalPieces, 0);
  }, [approvedItems]);

  const totalApprovedModels = approvedItems.length;
  const uniqueCustomersCount = useMemo(() => {
    const custs = new Set(approvedItems.map(item => item.order.customerName).filter(Boolean));
    return custs.size;
  }, [approvedItems]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const handlePrintInventory = () => {
    window.print();
  };

  return (
    <>
      <div className="space-y-6 pb-12 print:hidden" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <PackageCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">مخزن المنتجات التامة</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  جاهز للتسليم
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                استلام وتتبع المنتجات التامة المعتمدة من مرحلة التغليف مع تفاصيل الأعداد والألوان
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {onNavigateToSales && (
              <button
                onClick={onNavigateToSales}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>فواتير المبيعات</span>
              </button>
            )}
            <button
              onClick={handlePrintInventory}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/10"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة جرد المخزن</span>
            </button>
            <button
              onClick={loadOrdersData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/10"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-xs text-slate-400 font-medium">إجمالي القطع التامة بالمخزن</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {totalApprovedPieces.toLocaleString("ar-EG")} <span className="text-xs font-normal text-slate-400">قطعة</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-xs text-slate-400 font-medium">عدد الموديلات والقصات الجاهزة</div>
            <div className="text-2xl font-black text-indigo-400 mt-1">
              {totalApprovedModels} <span className="text-xs font-normal text-slate-400">موديل</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-xs text-slate-400 font-medium">عدد العملاء المخصص لهم</div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {uniqueCustomersCount} <span className="text-xs font-normal text-slate-400">عميل</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-xs text-slate-400 font-medium">أوامر بانتظار اعتماد التغليف</div>
            <div className="text-2xl font-black text-sky-400 mt-1">
              {pendingItems.length} <span className="text-xs font-normal text-slate-400">أمر</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("approved")}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === "approved"
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>المنتجات التامة المعتمدة</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'approved' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {approvedItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === "pending"
                ? "border-amber-500 text-amber-800 bg-amber-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>بانتظار اعتماد التغليف</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {pendingItems.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white dark:bg-[#150d24] p-4 rounded-xl border border-slate-200 dark:border-purple-950/70 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الأمر، كود الباركود (PM-00001)، الموديل، العميل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-10 py-2 border border-slate-300 dark:border-purple-900/60 rounded-xl text-xs bg-slate-50 dark:bg-[#1f1338] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#251743] focus:ring-1 focus:ring-[#2C1151]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>الفئة:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-300 dark:border-purple-900/60 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1f1338]"
            >
              <option value="all">كل الفئات</option>
              <option value="رجالي">رجالي</option>
              <option value="حريمي">حريمي</option>
              <option value="أطفال">أطفال</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>الترتيب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-slate-300 dark:border-purple-900/60 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1f1338]"
            >
              <option value="date">تاريخ الاستلام</option>
              <option value="quantity">إجمالي الكمية</option>
              <option value="orderNumber">رقم الأوردر</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
              className="p-1 border border-slate-300 dark:border-purple-900/60 rounded-lg hover:bg-slate-100 dark:hover:bg-[#251743] text-slate-600 dark:text-slate-300 text-xs cursor-pointer"
              title={sortOrder === "desc" ? "تنازلي" : "تصاعدي"}
            >
              {sortOrder === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </div>
      </div>

      {/* List of Finished Goods */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="bg-white dark:bg-[#150d24] rounded-2xl border border-dashed border-slate-300 dark:border-purple-950/70 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-purple-950/40 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-amber-400 mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {activeTab === "approved" 
              ? "لا توجد منتجات تامة معتمدة حالياً بالمخزن"
              : "لا توجد أوامر بانتظار اعتماد التغليف"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            {activeTab === "approved"
              ? "عند اعتماد مرحلة التغليف من داخل أمر الإنتاج، ستظهر المنتجات تلقائياً هنا مع تفاصيل الأعداد والألوان والمقاسات المستلمة."
              : "جميع الأوامر التي اكتملت بالمكواة وجاهزة للتغليف تظهر هنا للمراجعة السريعة."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedItems.map((item) => {
            const isExpanded = expandedOrderId === item.order.id;

            return (
              <div
                key={item.order.id}
                className={`bg-white dark:bg-[#150d24] rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                  isExpanded ? "border-purple-500 ring-2 ring-purple-950/40" : "border-slate-200 dark:border-purple-950/70 hover:border-slate-300 dark:hover:border-purple-800/80"
                }`}
              >
                {/* Product Main Card / Row */}
                <div
                  onClick={() => toggleExpand(item.order.id)}
                  className="p-5 cursor-pointer hover:bg-slate-50/75 transition-colors select-none"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Left: Product Info */}
                    <div className="flex items-start sm:items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        item.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        <Boxes className="w-6 h-6" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {item.order.orderNumber}
                          </span>
                          {(item.primaryBarcode || item.order.barcode) && (
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs" title="كود الباركود التسلسلي المعتمد">
                              <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{item.primaryBarcode || item.order.barcode}</span>
                            </span>
                          )}
                          <h3 className="text-lg font-bold text-slate-800 hover:text-indigo-600 transition-colors">
                            {item.order.styleName}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {item.order.category || "عام"}
                          </span>
                          {item.isApproved ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              معتمد بالمخزن
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              بانتظار الاعتماد
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>العميل: <strong className="text-slate-700">{item.order.customerName || "المصنع"}</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>التاريخ: <span dir="ltr">{new Date(item.receivedDate).toLocaleDateString("ar-EG")}</span></span>
                          </div>
                          {item.approvedBy && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>الاعتماد: {item.approvedBy}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quantities and Toggle button */}
                    <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      {/* Total Pieces Badge */}
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">الكمية المستلمة بالتغليف</div>
                        <div className="text-xl font-black text-emerald-600 flex items-baseline gap-1">
                          <span>{item.totalPieces.toLocaleString("ar-EG")}</span>
                          <span className="text-xs font-normal text-slate-500">قطعة</span>
                        </div>
                      </div>

                      {/* Colors summary chips */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        {item.colorBreakdown.slice(0, 3).map(c => (
                          <span
                            key={c.color}
                            className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-medium border border-slate-200"
                            title={`${c.color}: ${c.totalQuantity} قطعة (${c.percentage}%)`}
                          >
                            {c.color} ({c.totalQuantity})
                          </span>
                        ))}
                        {item.colorBreakdown.length > 3 && (
                          <span className="text-xs text-slate-400">+{item.colorBreakdown.length - 3}</span>
                        )}
                      </div>

                      {/* Expand / Collapse Button */}
                      <button
                        type="button"
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isExpanded
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <span>تفاصيل الأعداد والألوان</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dropdown / Expandable Detailed Section */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-6 space-y-6 animate-in fade-in-50 duration-200">
                    {/* Header of details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-bold text-slate-800 text-sm">
                          تفاصيل الأعداد والألوان والمقاسات المستلمة من التغليف
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {onNavigateToOrder && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToOrder(item.order.id, "packing");
                            }}
                            className="text-xs flex items-center gap-1.5 bg-white text-indigo-700 hover:text-indigo-900 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 font-medium transition-colors shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>فتح أمر التغليف</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Color Distribution Bar */}
                    <div>
                      <div className="text-xs font-bold text-slate-600 mb-2">توزيع الألوان المستلمة:</div>
                      <div className="flex flex-wrap gap-2">
                        {item.colorBreakdown.map((cb) => (
                          <div
                            key={cb.color}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3 min-w-[140px]"
                          >
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs bg-indigo-500" />
                            <div className="flex-1">
                              <div className="text-xs font-bold text-slate-800">{cb.color}</div>
                              <div className="text-[11px] text-slate-500">
                                <strong>{cb.totalQuantity}</strong> قطعة ({cb.percentage}%)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Matrix: Color x Size Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <div className="bg-slate-100/70 px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-700">
                        مصفوفة الكميات المستلمة بالتفصيل (المقاس / اللون):
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4 font-bold border-l border-slate-200">اللون</th>
                              {item.sizes.map((size) => (
                                <th key={size} className="py-3 px-3 text-center font-bold border-l border-slate-100 min-w-[60px]">
                                  {size}
                                </th>
                              ))}
                              <th className="py-3 px-4 text-center font-bold bg-slate-100/80 text-indigo-900">
                                إجمالي اللون
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {item.colors.map((color) => {
                              const colorTotal = item.colorBreakdown.find(c => c.color === color)?.totalQuantity || 0;
                              return (
                                <tr key={color} className="hover:bg-indigo-50/30 transition-colors">
                                  <td className="py-3 px-4 font-bold text-slate-800 border-l border-slate-200">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                                      <span>{color}</span>
                                    </div>
                                  </td>
                                  {item.sizes.map((size) => {
                                    const val = item.matrix[color]?.[size] || 0;
                                    return (
                                      <td key={size} className="py-3 px-3 text-center border-l border-slate-100 font-medium">
                                        {val > 0 ? (
                                          <span className="text-slate-800 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                            {val}
                                          </span>
                                        ) : (
                                          <span className="text-slate-300">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="py-3 px-4 text-center font-black bg-slate-50/50 text-indigo-700">
                                    {colorTotal}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {/* Footer with Size Totals */}
                          <tfoot className="bg-slate-100 border-t-2 border-slate-200 font-bold text-slate-800">
                            <tr>
                              <td className="py-3 px-4 border-l border-slate-200">إجمالي المقاس</td>
                              {item.sizes.map((size) => (
                                <td key={size} className="py-3 px-3 text-center border-l border-slate-200 font-bold text-indigo-900">
                                  {item.sizeTotals[size] || 0}
                                </td>
                              ))}
                              <td className="py-3 px-4 text-center font-black text-sm bg-emerald-100 text-emerald-900">
                                {item.totalPieces} قطعة
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Barcodes Section: Sequential Barcodes attached to order variants */}
                    {item.barcodes && item.barcodes.length > 0 && (
                      <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Barcode className="w-4 h-4 text-indigo-600" />
                            <h5 className="font-bold text-slate-800 text-xs">
                              أكواد الباركود التسلسلية المعتمدة للمنتج بالمخزن (مرافقة لأمر الإنتاج وفواتير البيع):
                            </h5>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                            {item.barcodes.length} كود تسلسلي معتمد
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {item.colors.map(color => {
                            return item.sizes.map(size => {
                              const qty = item.matrix[color]?.[size] || 0;
                              const code = item.barcodeMap[`${size}_${color}`] || item.primaryBarcode;
                              if (!code && qty === 0) return null;
                              return (
                                <div
                                  key={`${color}-${size}`}
                                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/40 hover:border-indigo-200 transition-colors flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <div className="font-bold text-slate-800">
                                      {color} / مقاس {size}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      الكمية: {qty} قطعة
                                    </div>
                                  </div>
                                  {code ? (
                                    <span className="font-mono font-black text-indigo-900 bg-white border border-indigo-200 px-2 py-1 rounded shadow-2xs text-[11px]">
                                      {code}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">-</span>
                                  )}
                                </div>
                              );
                            });
                          })}
                        </div>
                      </div>
                    )}

                    {/* Packing Invoices & Receipts Details if available */}
                    {item.invoices && item.invoices.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span>أذون وفواتير التغليف المعتمدة ({item.invoices.length} إذن):</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {item.invoices.map((inv, idx) => {
                            const invPieces = inv.variants?.reduce((s, v) => s + (Number(v.quantity) || 0), 0) || 0;
                            return (
                              <div key={inv.id || idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs">
                                <div className="flex justify-between items-center font-bold text-slate-800 mb-1">
                                  <span>إذن تسليم #{idx + 1}</span>
                                  <span className="text-emerald-700 font-extrabold">{invPieces} قطعة</span>
                                </div>
                                <div className="text-slate-500">
                                  <span>الجهة المستلمة: </span>
                                  <strong className="text-slate-700">{inv.customerName || item.order.customerName}</strong>
                                </div>
                                <div className="text-slate-400 mt-1">
                                  التاريخ: <span dir="ltr">{inv.date || new Date().toISOString().split("T")[0]}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* A4 Print Document for Finished Goods Inventory */}
    <div className="hidden print:block print:w-full" dir="rtl">
      <PrintDocument>
        <PrintHeader
          orderNumber="WH-FG-INV"
          title="تقرير جرد مخزن المنتجات التامة"
          subtitle="بيان الأرصدة والموديلات الجاهزة للتسليم"
          documentType="تقرير جرد مخزني"
          classification="مخازن المنتجات التامة"
          metaItems={[
            { label: 'تاريخ الجرد', value: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'إجمالي الموديلات', value: `${totalApprovedPieces > 0 ? totalApprovedModels : 0} موديل` },
            { label: 'إجمالي القطع الجاهزة', value: `${totalApprovedPieces.toLocaleString('ar-EG')} قطعة`, highlight: true },
            { label: 'عدد العملاء', value: `${uniqueCustomersCount} عميل` },
          ]}
        />

        <PrintSection title="جدول أرصدة الموديلات التامة المعتمدة">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="border border-slate-300 p-2 text-center w-10">#</th>
                <th className="border border-slate-300 p-2 text-right">رقم أمر الإنتاج</th>
                <th className="border border-slate-300 p-2 text-right">اسم الموديل</th>
                <th className="border border-slate-300 p-2 text-right">العميل</th>
                <th className="border border-slate-300 p-2 text-center">تاريخ الاعتماد</th>
                <th className="border border-slate-300 p-2 text-center">عدد الألوان</th>
                <th className="border border-slate-300 p-2 text-center">الكمية التامة</th>
              </tr>
            </thead>
            <tbody>
              {approvedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-300 p-4 text-center text-slate-500">لا توجد منتجات تامة معتمدة حالياً بالمخزن</td>
                </tr>
              ) : (
                approvedItems.map((item, idx) => (
                  <tr key={item.order.id || idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-mono font-bold text-slate-900">{item.order.orderNumber}</td>
                    <td className="border border-slate-300 p-2 font-bold text-slate-800">{item.order.styleName}</td>
                    <td className="border border-slate-300 p-2 text-slate-700">{item.order.customerName || 'عام'}</td>
                    <td className="border border-slate-300 p-2 text-center text-[10px] text-slate-600">
                      {item.order.packingApprovedAt ? new Date(item.order.packingApprovedAt).toLocaleDateString('ar-EG') : '—'}
                    </td>
                    <td className="border border-slate-300 p-2 text-center">{item.colors.length}</td>
                    <td className="border border-slate-300 p-2 text-center font-black text-slate-900">{item.totalPieces.toLocaleString('ar-EG')}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold">
                <td colSpan={6} className="border border-slate-300 p-2 text-right font-black text-slate-900">
                  الإجمالي العام للمنتجات التامة بالمخزن:
                </td>
                <td className="border border-slate-300 p-2 text-center font-black text-slate-900 text-sm">
                  {totalApprovedPieces.toLocaleString('ar-EG')} قطعة
                </td>
              </tr>
            </tfoot>
          </table>
        </PrintSection>

        <PrintSignatures
          signatures={[
            { role: 'أمين مخزن المنتجات التامة', name: 'المسئول الفعلي' },
            { role: 'مراقب الجودة والتغليف', name: 'الاعتماد' },
            { role: 'إدارة العمليات والإنتاج', name: 'الاعتماد العام' },
          ]}
        />
      </PrintDocument>
    </div>
  </>
  );
};
