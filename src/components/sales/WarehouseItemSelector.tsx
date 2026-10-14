import React, { useState, useEffect, useMemo } from 'react';
import {
  CompletedOrderStock,
  WarehouseProductStock,
  getCompletedOrdersStock,
  getWarehouseProductsStock
} from '../../lib/salesWarehouseUtils';
import { SalesInvoiceItem, SalesInvoiceItemVariant } from '../../types/sales';
import {
  PackageCheck,
  Boxes,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  RotateCcw,
  Sparkles,
  Barcode,
  Search,
  AlertCircle,
  Tag,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface WarehouseItemSelectorProps {
  currentInvoiceId?: string;
  onAddFromOrder: (
    order: CompletedOrderStock,
    itemsToAdd: SalesInvoiceItem[],
    consolidatedItem?: SalesInvoiceItem
  ) => void;
  onAddFromWarehouseProduct: (item: SalesInvoiceItem) => void;
}

export function WarehouseItemSelector({
  currentInvoiceId,
  onAddFromOrder,
  onAddFromWarehouseProduct
}: WarehouseItemSelectorProps) {
  const [activeMode, setActiveMode] = useState<'order' | 'warehouse'>('warehouse');
  const [completedOrders, setCompletedOrders] = useState<CompletedOrderStock[]>([]);
  const [warehouseProducts, setWarehouseProducts] = useState<WarehouseProductStock[]>([]);
  const [loading, setLoading] = useState(true);

  // Completed Order Selection State
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [orderVariantQuantities, setOrderVariantQuantities] = useState<Record<string, number>>({});
  const [orderUnitPrice, setOrderUnitPrice] = useState<number>(280);

  // Warehouse Product Selection State
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [productVariantQuantities, setProductVariantQuantities] = useState<Record<string, number>>({});
  const [productUnitPrice, setProductUnitPrice] = useState<number>(280);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);

  const loadStockData = async () => {
    setLoading(true);
    try {
      const [ords, prods] = await Promise.all([
        getCompletedOrdersStock(currentInvoiceId),
        getWarehouseProductsStock(currentInvoiceId)
      ]);
      setCompletedOrders(ords);
      setWarehouseProducts(prods);

      // Default select first available if none selected
      if (prods.length > 0 && !selectedProductName) {
        setSelectedProductName(prods[0].styleName);
      }
      if (ords.length > 0 && !selectedOrderId) {
        setSelectedOrderId(ords[0].orderId);
      }
    } catch (e) {
      console.error('Failed to load warehouse stock data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData();

    const handleUpdate = () => loadStockData();
    window.addEventListener('gfos_storage_update', handleUpdate);
    window.addEventListener('sales_invoices_updated', handleUpdate);
    window.addEventListener('sales_returns_updated', handleUpdate);
    window.addEventListener('finished_goods_updated', handleUpdate);

    return () => {
      window.removeEventListener('gfos_storage_update', handleUpdate);
      window.removeEventListener('sales_invoices_updated', handleUpdate);
      window.removeEventListener('sales_returns_updated', handleUpdate);
      window.removeEventListener('finished_goods_updated', handleUpdate);
    };
  }, [currentInvoiceId]);

  // Active selected completed order
  const activeOrder = useMemo(() => {
    return completedOrders.find(o => o.orderId === selectedOrderId || o.orderNumber === selectedOrderId);
  }, [completedOrders, selectedOrderId]);

  // Active selected warehouse product
  const activeProduct = useMemo(() => {
    return warehouseProducts.find(
      p => p.styleName.trim().toLowerCase() === selectedProductName.trim().toLowerCase()
    );
  }, [warehouseProducts, selectedProductName]);

  // Reset or initialize order variant counts when active order changes
  useEffect(() => {
    if (activeOrder) {
      const initial: Record<string, number> = {};
      activeOrder.variants.forEach(v => {
        const key = `${v.size}___${v.color}`;
        initial[key] = 0;
      });
      setOrderVariantQuantities(initial);
    }
  }, [activeOrder?.orderId]);

  // Reset or initialize warehouse variant counts when active product changes
  useEffect(() => {
    if (activeProduct) {
      const initial: Record<string, number> = {};
      activeProduct.variants.forEach(v => {
        const key = `${v.size}___${v.color}`;
        initial[key] = 0;
      });
      setProductVariantQuantities(initial);
      setProductUnitPrice(activeProduct.suggestedPrice || 280);
      setIsDropdownOpen(true);
    }
  }, [activeProduct?.styleName]);

  // Handlers for Order mode
  const handleSetAllOrderRemaining = () => {
    if (!activeOrder) return;
    const allRemaining: Record<string, number> = {};
    activeOrder.variants.forEach(v => {
      const key = `${v.size}___${v.color}`;
      allRemaining[key] = Math.max(0, v.remaining);
    });
    setOrderVariantQuantities(allRemaining);
  };

  const handleResetOrderQuantities = () => {
    if (!activeOrder) return;
    const zeros: Record<string, number> = {};
    activeOrder.variants.forEach(v => {
      const key = `${v.size}___${v.color}`;
      zeros[key] = 0;
    });
    setOrderVariantQuantities(zeros);
  };

  const totalSelectedOrderPieces = useMemo(() => {
    return Object.values(orderVariantQuantities).reduce<number>((sum: number, q: number) => sum + (Number(q) || 0), 0);
  }, [orderVariantQuantities]);

  const handleInsertFromOrder = () => {
    if (!activeOrder || totalSelectedOrderPieces <= 0) return;

    const variantsToAdd: SalesInvoiceItemVariant[] = [];
    const sizesSet = new Set<string>();
    const colorsSet = new Set<string>();

    activeOrder.variants.forEach(v => {
      const key = `${v.size}___${v.color}`;
      const qty = Number(orderVariantQuantities[key]) || 0;
      if (qty > 0) {
        variantsToAdd.push({
          size: v.size,
          color: v.color,
          quantity: qty,
          barcode: v.barcode,
          remainingStock: v.remaining
        });
        sizesSet.add(v.size);
        colorsSet.add(v.color);
      }
    });

    const consolidatedItem: SalesInvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      orderId: activeOrder.orderId,
      orderNumber: activeOrder.orderNumber,
      barcode: activeOrder.primaryBarcode,
      styleName: activeOrder.styleName,
      category: activeOrder.category,
      size: Array.from(sizesSet).join('، '),
      color: Array.from(colorsSet).join('، '),
      unit: 'قطعة',
      quantity: totalSelectedOrderPieces,
      unitPrice: orderUnitPrice,
      discount: 0,
      total: totalSelectedOrderPieces * orderUnitPrice,
      variants: variantsToAdd
    };

    onAddFromOrder(activeOrder, [], consolidatedItem);
    handleResetOrderQuantities();
  };

  // Handlers for Warehouse Product mode
  const handleSetAllProductRemaining = () => {
    if (!activeProduct) return;
    const allRemaining: Record<string, number> = {};
    activeProduct.variants.forEach(v => {
      const key = `${v.size}___${v.color}`;
      allRemaining[key] = Math.max(0, v.remaining);
    });
    setProductVariantQuantities(allRemaining);
  };

  const handleResetProductQuantities = () => {
    if (!activeProduct) return;
    const zeros: Record<string, number> = {};
    activeProduct.variants.forEach(v => {
      const key = `${v.size}___${v.color}`;
      zeros[key] = 0;
    });
    setProductVariantQuantities(zeros);
  };

  const handleQuickAddProductVariant = (key: string, delta: number, max: number) => {
    setProductVariantQuantities(prev => {
      const cur = Number(prev[key]) || 0;
      const next = Math.max(0, Math.min(cur + delta, max));
      return { ...prev, [key]: next };
    });
  };

  const totalSelectedProductPieces = useMemo(() => {
    return Object.values(productVariantQuantities).reduce<number>((sum: number, q: number) => sum + (Number(q) || 0), 0);
  }, [productVariantQuantities]);

  const handleInsertFromWarehouseProduct = () => {
    if (!activeProduct || totalSelectedProductPieces <= 0) return;

    const variantsToAdd: SalesInvoiceItemVariant[] = [];
    const sizesSet = new Set<string>();
    const colorsSet = new Set<string>();

    activeProduct.variants.forEach(v => {
      const key = `${v.size}___${v.color}`;
      const qty = Number(productVariantQuantities[key]) || 0;
      if (qty > 0) {
        variantsToAdd.push({
          size: v.size,
          color: v.color,
          quantity: qty,
          barcode: v.barcode,
          remainingStock: v.remaining
        });
        sizesSet.add(v.size);
        colorsSet.add(v.color);
      }
    });

    // Associated order info if any
    const firstOrder = activeProduct.orders[0];

    const newItem: SalesInvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      orderId: firstOrder?.orderId,
      orderNumber: firstOrder?.orderNumber,
      barcode: activeProduct.primaryBarcode,
      styleName: activeProduct.styleName,
      category: activeProduct.category,
      size: Array.from(sizesSet).join('، ') || 'متعدد',
      color: Array.from(colorsSet).join('، ') || 'متعدد',
      unit: 'قطعة',
      quantity: totalSelectedProductPieces,
      unitPrice: productUnitPrice,
      discount: 0,
      total: totalSelectedProductPieces * productUnitPrice,
      variants: variantsToAdd
    };

    onAddFromWarehouseProduct(newItem);
    handleResetProductQuantities();
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-indigo-200/80 p-4 shadow-xs space-y-4">
      {/* Selection Mode Toggle Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveMode('warehouse')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'warehouse'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>الاختيار من أصناف المخزن</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeMode === 'warehouse' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {warehouseProducts.length} صنف
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('order')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'order'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>الاختيار من أمر إنتاج مكتمل</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeMode === 'order' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {completedOrders.length} أمر
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>إدراج سريع وتلقائي مع إظهار رصيد المتبقي بالمخزن للأصناف والأوامر</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: الاختيار من الأصناف الموجودة بالمخزن             */}
      {/* ======================================================== */}
      {activeMode === 'warehouse' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Warehouse Product Dropdown Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                اختر الصنف من مخزن المنتجات التامة (مع عرض الرصيد المتبقي):
              </label>
              <select
                value={selectedProductName}
                onChange={e => setSelectedProductName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                {warehouseProducts.length === 0 ? (
                  <option value="">لا توجد أصناف معتمدة بالمخزن حالياً</option>
                ) : (
                  warehouseProducts.map(p => (
                    <option key={p.styleName} value={p.styleName}>
                      {p.styleName} ({p.category}) — المتبقي بالمخزن: {p.totalStock.toLocaleString('ar-EG')} قطعة
                      {p.primaryBarcode ? ` [باركود: ${p.primaryBarcode}]` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر بيع القطعة (ج.م)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={productUnitPrice}
                  onChange={e => setProductUnitPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-emerald-800 text-left focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  dir="ltr"
                />
                <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">ج.م</span>
              </div>
            </div>
          </div>

          {/* Active Product Details & Sizes/Colors Dropdown Card */}
          {activeProduct && (
            <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-2xs">
              {/* Product Header / Banner */}
              <div
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="p-3.5 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-2xs">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-blue-950">{activeProduct.styleName}</h4>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {activeProduct.category}
                      </span>
                      {activeProduct.primaryBarcode && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1" dir="ltr">
                          <Barcode className="w-3 h-3" />
                          <span>{activeProduct.primaryBarcode}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>إجمالي المتبقي بالمخزن: <strong className="text-emerald-700 font-black">{activeProduct.totalStock.toLocaleString('ar-EG')} قطعة</strong></span>
                      <span>•</span>
                      <span>المقاسات: {activeProduct.availableSizes.join('، ') || '-'}</span>
                      <span>•</span>
                      <span>الألوان: {activeProduct.availableColors.join('، ') || '-'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700">
                    {isDropdownOpen ? 'إخفاء جدول المقاسات' : 'قائمة إدخال المقاسات والألوان'}
                  </span>
                  <div className="p-1 rounded-lg bg-blue-100 text-blue-800">
                    {isDropdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Dropdown Matrix for Sizes & Colors */}
              {isDropdownOpen && (
                <div className="p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>أدخل الأعداد المطلوبة للمقاسات والألوان (يظهر الإجمالي في الفاتورة مع الصنف):</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSetAllProductRemaining}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        إدراج كل المتبقي بالمخزن
                      </button>
                      <button
                        type="button"
                        onClick={handleResetProductQuantities}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        تصفير الأعداد
                      </button>
                    </div>
                  </div>

                  {/* Variants Grid Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">المقاس</th>
                          <th className="py-2 px-3">اللون</th>
                          <th className="py-2 px-3 text-center">كود الباركود</th>
                          <th className="py-2 px-3 text-center">المتبقي بالمخزن</th>
                          <th className="py-2 px-3 text-center w-36">الكمية المطلوبة للبيع</th>
                          <th className="py-2 px-3 text-center">إجراءات سريعة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeProduct.variants.map((v, idx) => {
                          const key = `${v.size}___${v.color}`;
                          const qty = productVariantQuantities[key] || 0;
                          const isExceeded = qty > v.remaining;

                          return (
                            <tr key={idx} className={`hover:bg-slate-50/80 ${qty > 0 ? 'bg-blue-50/30' : ''}`}>
                              <td className="py-2 px-3 font-black text-indigo-900">{v.size}</td>
                              <td className="py-2 px-3 font-bold text-slate-700">{v.color}</td>
                              <td className="py-2 px-3 text-center">
                                {v.barcode ? (
                                  <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200" dir="ltr">
                                    {v.barcode}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  {v.remaining.toLocaleString('ar-EG')} قطعة
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max={v.remaining}
                                    value={qty === 0 ? '' : qty}
                                    onChange={e => {
                                      const val = Math.max(0, Number(e.target.value) || 0);
                                      setProductVariantQuantities(prev => ({
                                        ...prev,
                                        [key]: val
                                      }));
                                    }}
                                    placeholder="0"
                                    className={`w-24 px-2 py-1 text-center font-black rounded-lg border text-xs outline-none ${
                                      isExceeded
                                        ? 'border-red-400 bg-red-50 text-red-900 ring-1 ring-red-400'
                                        : qty > 0
                                        ? 'border-blue-400 bg-blue-50 text-blue-900 font-black'
                                        : 'border-slate-300 bg-white text-slate-900'
                                    }`}
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAddProductVariant(key, 1, v.remaining)}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    +1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAddProductVariant(key, 5, v.remaining)}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    +5
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setProductVariantQuantities(prev => ({ ...prev, [key]: v.remaining }))}
                                    className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    الكل
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary & Insert Action Bar */}
                  <div className="bg-slate-900 text-white p-3 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">إجمالي القطع المختارة:</span>
                        <span className="text-base font-black text-amber-300">
                          {totalSelectedProductPieces.toLocaleString('ar-EG')} قطعة
                        </span>
                      </div>
                      <div className="border-r border-slate-700 pr-4">
                        <span className="text-slate-400 block text-[10px]">سعر البيع:</span>
                        <span className="font-bold text-white">{productUnitPrice} ج.م</span>
                      </div>
                      <div className="border-r border-slate-700 pr-4">
                        <span className="text-slate-400 block text-[10px]">إجمالي قيمة الصنف:</span>
                        <span className="text-base font-black text-emerald-400">
                          {(totalSelectedProductPieces * productUnitPrice).toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={totalSelectedProductPieces <= 0}
                      onClick={handleInsertFromWarehouseProduct}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إدراج الصنف في الفاتورة ({totalSelectedProductPieces} قطعة)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: الاختيار من أمر إنتاج مكتمل                       */}
      {/* ======================================================== */}
      {activeMode === 'order' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                اختر أمر الإنتاج المكتمل (يعرض إجمالي المتبقي بالمخزن):
              </label>
              <select
                value={selectedOrderId}
                onChange={e => setSelectedOrderId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                {completedOrders.length === 0 ? (
                  <option value="">لا توجد أوامر إنتاج مكتملة بالمخزن حالياً</option>
                ) : (
                  completedOrders.map(o => (
                    <option key={o.orderId} value={o.orderId}>
                      [{o.orderNumber}] {o.styleName} ({o.customerName}) — المتبقي بالمخزن: {o.remainingStock.toLocaleString('ar-EG')} قطعة (من إجمالي {o.totalProduced.toLocaleString('ar-EG')})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر بيع القطعة (ج.م)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={orderUnitPrice}
                  onChange={e => setOrderUnitPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-emerald-800 text-left focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  dir="ltr"
                />
                <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">ج.م</span>
              </div>
            </div>
          </div>

          {/* Active Order Card */}
          {activeOrder && (
            <div className="bg-white rounded-2xl border border-indigo-200 overflow-hidden shadow-2xs">
              <div className="p-3.5 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-2xs">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-indigo-950">
                        {activeOrder.orderNumber} - {activeOrder.styleName}
                      </h4>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {activeOrder.customerName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>إجمالي الإنتاج: <strong>{activeOrder.totalProduced.toLocaleString('ar-EG')}</strong></span>
                      <span>•</span>
                      <span>المباع سابقاً: <strong className="text-slate-700">{activeOrder.totalSold.toLocaleString('ar-EG')}</strong></span>
                      <span>•</span>
                      <span>المرتجع: <strong className="text-blue-700">{activeOrder.totalReturned.toLocaleString('ar-EG')}</strong></span>
                      <span>•</span>
                      <span>المتبقي بالمخزن: <strong className="text-emerald-700 font-black">{activeOrder.remainingStock.toLocaleString('ar-EG')} قطعة</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSetAllOrderRemaining}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    تحديد كل المتبقي
                  </button>
                  <button
                    type="button"
                    onClick={handleResetOrderQuantities}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    تصفير
                  </button>
                </div>
              </div>

              {/* Order Variants Matrix */}
              <div className="p-4 space-y-4">
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">المقاس</th>
                        <th className="py-2 px-3">اللون</th>
                        <th className="py-2 px-3 text-center">كود الباركود</th>
                        <th className="py-2 px-3 text-center">المتبقي بالمخزن</th>
                        <th className="py-2 px-3 text-center w-36">الكمية للفاتورة</th>
                        <th className="py-2 px-3 text-center">إجراء سريع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeOrder.variants.map((v, idx) => {
                        const key = `${v.size}___${v.color}`;
                        const qty = orderVariantQuantities[key] || 0;

                        return (
                          <tr key={idx} className={`hover:bg-slate-50/80 ${qty > 0 ? 'bg-indigo-50/30' : ''}`}>
                            <td className="py-2 px-3 font-black text-indigo-900">{v.size}</td>
                            <td className="py-2 px-3 font-bold text-slate-700">{v.color}</td>
                            <td className="py-2 px-3 text-center">
                              {v.barcode ? (
                                <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200" dir="ltr">
                                  {v.barcode}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                {v.remaining.toLocaleString('ar-EG')} قطعة
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                max={v.remaining}
                                value={qty === 0 ? '' : qty}
                                onChange={e => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setOrderVariantQuantities(prev => ({
                                    ...prev,
                                    [key]: val
                                  }));
                                }}
                                placeholder="0"
                                className="w-24 px-2 py-1 mx-auto block text-center font-black rounded-lg border border-indigo-300 text-xs focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setOrderVariantQuantities(prev => ({ ...prev, [key]: v.remaining }))}
                                className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold cursor-pointer"
                              >
                                إضافة المتبقي ({v.remaining})
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Bar */}
                <div className="bg-slate-900 text-white p-3 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">إجمالي القطع المختارة:</span>
                      <span className="text-base font-black text-amber-300">
                        {totalSelectedOrderPieces.toLocaleString('ar-EG')} قطعة
                      </span>
                    </div>
                    <div className="border-r border-slate-700 pr-4">
                      <span className="text-slate-400 block text-[10px]">سعر البيع:</span>
                      <span className="font-bold text-white">{orderUnitPrice} ج.م</span>
                    </div>
                    <div className="border-r border-slate-700 pr-4">
                      <span className="text-slate-400 block text-[10px]">الإجمالي المالي:</span>
                      <span className="text-base font-black text-emerald-400">
                        {(totalSelectedOrderPieces * orderUnitPrice).toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={totalSelectedOrderPieces <= 0}
                    onClick={handleInsertFromOrder}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إدراج بنود أمر الإنتاج في الفاتورة ({totalSelectedOrderPieces} قطعة)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default WarehouseItemSelector;
