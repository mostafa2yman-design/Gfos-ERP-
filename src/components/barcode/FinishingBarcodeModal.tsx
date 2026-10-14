import React, { useState, useEffect, useMemo } from 'react';
import { ProductionOrder, BatchItem } from '../../types';
import { 
  BarcodeLabelSettings, 
  BarcodePrintItem 
} from '../../types/barcode';
import { 
  getBarcodeSettings, 
  saveBarcodeSettings,
  generateBarcodeValue,
  formatBarcodeSequence
} from '../../lib/barcodeSettings';
import { getFactorySettings, saveOrder } from '../../lib/storage';
import { BarcodeLabelCard } from './BarcodeLabelCard';
import { 
  X, 
  Printer, 
  Barcode, 
  Sliders, 
  Edit3, 
  Check, 
  Eye, 
  Tag,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrder;
  batches: BatchItem[];
  initialBatchId?: string;
}

export const FinishingBarcodeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  order,
  batches,
  initialBatchId
}) => {
  const [settings, setSettings] = useState<BarcodeLabelSettings>(getBarcodeSettings());
  const [orderFooterText, setOrderFooterText] = useState<string>('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>(initialBatchId || 'all');
  const [items, setItems] = useState<BarcodePrintItem[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccessNotice, setPrintSuccessNotice] = useState(false);

  // Load factory settings for branding
  const factorySettings = useMemo(() => getFactorySettings(), []);

  // Initialize items from order & batches finishing data
  useEffect(() => {
    if (!order) return;

    // Strictly load barcode configuration from general settings
    const currentBarcodeSettings = getBarcodeSettings();
    setSettings(currentBarcodeSettings);
    const initialFooter = currentBarcodeSettings.customFooter || '';
    setOrderFooterText(initialFooter);

    let nextSeq = Number(currentBarcodeSettings.lastSequenceNumber) || 0;
    const prefix = currentBarcodeSettings.sequencePrefix || 'PM';
    const padding = currentBarcodeSettings.sequencePadding || 5;
    let didAllocateNew = false;
    const orderBarcodesMap: Record<string, string> = { ...(order.barcodes || {}) };

    const generatedItems: BarcodePrintItem[] = [];

    // Filter batches if a specific batch is chosen
    const activeBatches = selectedBatchFilter === 'all' 
      ? batches 
      : batches.filter(b => b.id === selectedBatchFilter);

    activeBatches.forEach(batch => {
      const finishingQuantities = batch.finishingData?.actualQuantities || [];
      const sewingQuantities = batch.sewingData?.actualQuantities || [];

      // If finishing actual quantities exist, use them; otherwise fallback to sewing or planned
      if (finishingQuantities.length > 0) {
        finishingQuantities.forEach((fq, idx) => {
          const qty = (fq as any).actualQuantity ?? (fq as any).quantity ?? 0;
          if (qty > 0 || finishingQuantities.length === 1) {
            const keyBatch = `${batch.batchNumber}_${fq.size}_${fq.color}`;
            const keySimple = `${fq.size}_${fq.color}`;
            let barcodeVal = fq.barcode || orderBarcodesMap[keyBatch] || orderBarcodesMap[keySimple];

            // If no sequential barcode assigned yet, assign the NEXT sequential number
            if (!barcodeVal) {
              nextSeq += 1;
              barcodeVal = formatBarcodeSequence(prefix, nextSeq, padding);
              didAllocateNew = true;
              fq.barcode = barcodeVal;
              orderBarcodesMap[keyBatch] = barcodeVal;
              orderBarcodesMap[keySimple] = barcodeVal;
            }

            generatedItems.push({
              id: `${batch.id}-${fq.size}-${fq.color}-${idx}`,
              batchId: batch.id,
              batchNumber: batch.batchNumber,
              orderNumber: order.orderNumber,
              productName: order.styleName || 'منتج جاهز',
              productType: order.category || 'ملابس جاهزة',
              size: fq.size || 'M',
              color: fq.color || 'أسود',
              barcodeValue: barcodeVal,
              actualQuantity: qty,
              printQuantity: currentBarcodeSettings.copiesMode === 'single_each' ? 1 : Math.max(1, qty),
              price: currentBarcodeSettings.defaultPrice,
              factoryName: factorySettings?.name || 'مصنع الملابس الجاهزة',
              date: new Date().toISOString().split('T')[0],
              customFooter: initialFooter
            });
          }
        });
      } else if (sewingQuantities.length > 0) {
        sewingQuantities.forEach((sq, idx) => {
          const qty = sq.actualQuantity || 0;
          const keyBatch = `${batch.batchNumber}_${sq.size}_${sq.color}`;
          const keySimple = `${sq.size}_${sq.color}`;
          let barcodeVal = orderBarcodesMap[keyBatch] || orderBarcodesMap[keySimple];

          if (!barcodeVal) {
            nextSeq += 1;
            barcodeVal = formatBarcodeSequence(prefix, nextSeq, padding);
            didAllocateNew = true;
            orderBarcodesMap[keyBatch] = barcodeVal;
            orderBarcodesMap[keySimple] = barcodeVal;
          }

          generatedItems.push({
            id: `${batch.id}-${sq.size}-${sq.color}-${idx}`,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            orderNumber: order.orderNumber,
            productName: order.styleName || 'منتج جاهز',
            productType: order.category || 'ملابس جاهزة',
            size: sq.size || 'M',
            color: sq.color || 'أسود',
            barcodeValue: barcodeVal,
            actualQuantity: qty,
            printQuantity: currentBarcodeSettings.copiesMode === 'single_each' ? 1 : Math.max(1, qty),
            price: currentBarcodeSettings.defaultPrice,
            factoryName: factorySettings?.name || 'مصنع الملابس الجاهزة',
            date: new Date().toISOString().split('T')[0],
            customFooter: initialFooter
          });
        });
      } else {
        // Fallback to order planned sizes
        order.sizes?.forEach((sd, sIdx) => {
          sd.variants?.forEach((v, vIdx) => {
            const keyBatch = `${batch.batchNumber}_${sd.size}_${v.color}`;
            const keySimple = `${sd.size}_${v.color}`;
            let barcodeVal = orderBarcodesMap[keyBatch] || orderBarcodesMap[keySimple];

            if (!barcodeVal) {
              nextSeq += 1;
              barcodeVal = formatBarcodeSequence(prefix, nextSeq, padding);
              didAllocateNew = true;
              orderBarcodesMap[keyBatch] = barcodeVal;
              orderBarcodesMap[keySimple] = barcodeVal;
            }

            generatedItems.push({
              id: `${batch.id}-${sd.size}-${v.color}-${sIdx}-${vIdx}`,
              batchId: batch.id,
              batchNumber: batch.batchNumber,
              orderNumber: order.orderNumber,
              productName: order.styleName || 'منتج جاهز',
              productType: order.category || 'ملابس جاهزة',
              size: sd.size,
              color: v.color,
              barcodeValue: barcodeVal,
              actualQuantity: v.quantity || 1,
              printQuantity: 1,
              price: currentBarcodeSettings.defaultPrice,
              factoryName: factorySettings?.name || 'مصنع الملابس الجاهزة',
              date: new Date().toISOString().split('T')[0],
              customFooter: initialFooter
            });
          });
        });
      }
    });

    // If new sequential barcodes were generated, commit to settings and order storage
    if (didAllocateNew) {
      saveBarcodeSettings({ lastSequenceNumber: nextSeq });
      const primaryBarcode = Object.values(orderBarcodesMap)[0] || '';
      const updatedOrder: ProductionOrder = {
        ...order,
        barcode: order.barcode || primaryBarcode,
        barcodes: orderBarcodesMap,
        batches: batches.map(b => {
          if (!b.finishingData) return b;
          return {
            ...b,
            finishingData: {
              ...b.finishingData,
              actualQuantities: b.finishingData.actualQuantities.map(q => {
                const bVal = orderBarcodesMap[`${b.batchNumber}_${q.size}_${q.color}`] || orderBarcodesMap[`${q.size}_${q.color}`];
                return bVal ? { ...q, barcode: bVal } : q;
              })
            }
          };
        })
      };
      saveOrder(updatedOrder).then(() => {
        window.dispatchEvent(new CustomEvent('gfos_storage_update'));
        window.dispatchEvent(new CustomEvent('finished_goods_updated'));
      });
    }

    setItems(generatedItems);
    if (selectedPreviewIndex >= generatedItems.length) {
      setSelectedPreviewIndex(0);
    }
  }, [order, batches, selectedBatchFilter, isOpen]);

  // Update item field (Name, Type, Order number, Size, Color, Price, printQuantity, barcodeValue, customFooter, etc.)
  const handleItemFieldChange = (id: string, field: keyof BarcodePrintItem, value: any) => {
    setItems(prev => {
      const updatedList = prev.map(item => {
        if (item.id !== id) return item;
        return { ...item, [field]: value };
      });

      // If barcodeValue changed, sync to order barcodes and persist
      if (field === 'barcodeValue') {
        const targetItem = updatedList.find(i => i.id === id);
        if (targetItem && targetItem.barcodeValue) {
          const cleanCode = targetItem.barcodeValue.trim().toUpperCase();
          const keyBatch = `${targetItem.batchNumber}_${targetItem.size}_${targetItem.color}`;
          const keySimple = `${targetItem.size}_${targetItem.color}`;
          const newMap = { ...(order.barcodes || {}), [keyBatch]: cleanCode, [keySimple]: cleanCode };
          const updatedOrder: ProductionOrder = {
            ...order,
            barcode: cleanCode,
            barcodes: newMap,
            batches: batches.map(b => {
              if (b.id !== targetItem.batchId || !b.finishingData) return b;
              return {
                ...b,
                finishingData: {
                  ...b.finishingData,
                  actualQuantities: b.finishingData.actualQuantities.map(q => {
                    if (q.size === targetItem.size && q.color === targetItem.color) {
                      return { ...q, barcode: cleanCode };
                    }
                    return q;
                  })
                }
              };
            })
          };
          saveOrder(updatedOrder).then(() => {
            window.dispatchEvent(new CustomEvent('finished_goods_updated'));
            window.dispatchEvent(new CustomEvent('gfos_storage_update'));
          });
        }
      }

      return updatedList;
    });
  };

  // Modify the label footer text only within this work order
  const handleFooterTextChange = (newFooter: string) => {
    setOrderFooterText(newFooter);
    setItems(prev => prev.map(it => ({
      ...it,
      customFooter: newFooter
    })));
  };

  // Effective barcode settings for print and preview (strictly from general settings + work order footer)
  const effectiveSettings = useMemo(() => ({
    ...settings,
    customFooter: orderFooterText
  }), [settings, orderFooterText]);

  // Bulk actions for print quantities
  const setAllQuantitiesToActual = () => {
    setItems(prev => prev.map(it => ({
      ...it,
      printQuantity: Math.max(1, it.actualQuantity)
    })));
  };

  const setAllQuantitiesToSingle = () => {
    setItems(prev => prev.map(it => ({
      ...it,
      printQuantity: 1
    })));
  };

  const applyGlobalNameAndType = (productName: string, productType: string) => {
    setItems(prev => prev.map(it => ({
      ...it,
      productName,
      productType
    })));
  };

  // Calculate totals
  const totalStickersCount = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.printQuantity) || 0), 0);
  }, [items]);

  // Flattened array of stickers for printing
  const flatPrintStickers = useMemo(() => {
    const list: BarcodePrintItem[] = [];
    items.forEach(item => {
      const count = Number(item.printQuantity) || 0;
      for (let i = 0; i < count; i++) {
        list.push(item);
      }
    });
    return list;
  }, [items]);

  // Execute print with thermal styles
  const handlePrint = () => {
    if (flatPrintStickers.length === 0) return;
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      setPrintSuccessNotice(true);
      setTimeout(() => setPrintSuccessNotice(false), 3000);
    }, 150);
  };

  if (!isOpen) return null;

  const previewItem = items[selectedPreviewIndex] || items[0];

  return (
    <>
      {/* Dynamic Thermal Page Size Style Injector for Print */}
      <style>{`
        @media print {
          @page {
            size: ${settings.widthMm}mm ${settings.heightMm}mm;
            margin: 0mm !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .thermal-print-container {
            display: block !important;
            width: ${settings.widthMm}mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          .thermal-sticker-page {
            width: ${settings.widthMm}mm !important;
            height: ${settings.heightMm}mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Screen Modal Overlay */}
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:hidden" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* 1. Modal Top Bar */}
          <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                <Barcode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>منظومة طباعة ملصقات الباركود - مرحلة التشطيب</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {order.orderNumber}
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  طباعة باركود للمنتجات التامة مع إمكانية التعديل واختيار المقاس واللون والنوع والرقم والاسم
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/15 rounded-xl text-xs text-slate-200">
                <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                <span className="text-slate-300">مقاس الملصق:</span>
                <span className="font-mono font-bold text-white bg-indigo-500/40 px-2 py-0.5 rounded">
                  {settings.widthMm} × {settings.heightMm} مم
                </span>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded hidden sm:inline">
                  معتمد من الإعدادات
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Work Order Footer Text Banner (The ONLY editable setting inside Work Order) */}
          <div className="p-3 sm:px-6 bg-indigo-50/80 border-b border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label htmlFor="order-footer-input" className="text-xs font-black text-slate-800">
                    نص تذييل الملصق (Footer Text):
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                    متاح للتعديل في أمر التشغيل
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  يظهر هذا النص أسفل ملصقات الباركود لهذا الأمر (الافتراضي من الإعدادات العامة: &quot;{settings.customFooter || 'بدون'}&quot;)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                id="order-footer-input"
                type="text"
                value={orderFooterText}
                onChange={(e) => handleFooterTextChange(e.target.value)}
                placeholder="مثال: صنع في مصر - قطن 100% فاخر"
                className="w-full md:w-80 px-3 py-1.5 bg-white border border-indigo-200 focus:border-indigo-600 rounded-xl text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
              {orderFooterText !== (settings.customFooter || '') && (
                <button
                  type="button"
                  onClick={() => handleFooterTextChange(settings.customFooter || '')}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                  title="استعادة النص الافتراضي المعتمد في الإعدادات العامة"
                >
                  استعادة الافتراضي
                </button>
              )}
            </div>
          </div>

          {/* 3. Action Toolbar (Filters & Bulk Quantity Controls) */}
          <div className="p-3 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">تصفية حسب الباتش:</span>
              <select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="all">جميع الباتشات ({batches.length} باتش)</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    باتش #{b.batchNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">ضبط كمية الطباعة:</span>
              <button
                type="button"
                onClick={setAllQuantitiesToActual}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                title="طباعة ملصق لكل قطعة سليمة مشطبة"
              >
                حسب الكمية المشطبة
              </button>
              <button
                type="button"
                onClick={setAllQuantitiesToSingle}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                title="ملصق واحد تجريبي لكل مقاس ولون"
              >
                ملصق واحد لكل صنف
              </button>
            </div>
          </div>

          {/* 4. Main Body: Split View (Table with In-Place Editing + Live Preview) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Editable Items Table (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>أصناف ومقاسات الأوردر للتعديل المباشر قبل الطباعة:</span>
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  ({items.length} تشكيلة مقاس/لون)
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  لا توجد كميات مشطبة أو تفاصيل أصناف في هذا الباتش.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2.5 w-12 text-center">معاينة</th>
                          <th className="p-2.5">المقاس</th>
                          <th className="p-2.5">اللون</th>
                          <th className="p-2.5">كود الباركود</th>
                          <th className="p-2.5">الاسم (الموديل)</th>
                          <th className="p-2.5">النوع</th>
                          <th className="p-2.5">أمر التشغيل</th>
                          <th className="p-2.5 w-20 text-center">المشطب</th>
                          <th className="p-2.5 w-24 text-center">عدد الملصقات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => {
                          const isSelected = selectedPreviewIndex === idx;
                          return (
                            <tr 
                              key={item.id} 
                              className={`transition-colors ${
                                isSelected ? 'bg-indigo-50/80 ring-1 ring-inset ring-indigo-500/40' : 'hover:bg-slate-50/60'
                              }`}
                            >
                              {/* Preview Radio Selector */}
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPreviewIndex(idx)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isSelected 
                                      ? 'bg-indigo-600 text-white' 
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="عرض في المعاينة"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </td>

                              {/* المقاس (Editable) */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.size}
                                  onChange={(e) => handleItemFieldChange(item.id, 'size', e.target.value)}
                                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-center text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
                                />
                              </td>

                              {/* اللون (Editable) */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.color}
                                  onChange={(e) => handleItemFieldChange(item.id, 'color', e.target.value)}
                                  className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </td>

                              {/* كود الباركود التسلسلي المعتمد (Editable / Sequential) */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.barcodeValue}
                                  onChange={(e) => handleItemFieldChange(item.id, 'barcodeValue', e.target.value)}
                                  className="w-28 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded font-mono font-black text-indigo-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                                  dir="ltr"
                                  title="كود الباركود التسلسلي المعتمد للمنتج في المخزن وفواتير البيع"
                                />
                              </td>

                              {/* الاسم (Editable) */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.productName}
                                  onChange={(e) => handleItemFieldChange(item.id, 'productName', e.target.value)}
                                  className="w-full min-w-[130px] px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none truncate"
                                />
                              </td>

                              {/* النوع (Editable) */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.productType}
                                  onChange={(e) => handleItemFieldChange(item.id, 'productType', e.target.value)}
                                  className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none truncate"
                                />
                              </td>

                              {/* الرقم / أمر التشغيل (Editable) */}
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.orderNumber}
                                  onChange={(e) => handleItemFieldChange(item.id, 'orderNumber', e.target.value)}
                                  className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                                  dir="ltr"
                                />
                              </td>

                              {/* الكمية الفعلية المشطبة */}
                              <td className="p-2 text-center font-bold text-slate-700">
                                {item.actualQuantity}
                              </td>

                              {/* عدد الملصقات للطباعة */}
                              <td className="p-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="9999"
                                  value={item.printQuantity}
                                  onChange={(e) => handleItemFieldChange(item.id, 'printQuantity', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                  className="w-16 px-2 py-1 bg-indigo-50/70 border border-indigo-300 rounded font-bold text-center text-indigo-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Live Label Preview & Summary (4 cols) */}
            <div className="lg:col-span-4 flex flex-col items-center space-y-4">
              <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>المعاينة الحية للملصق:</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {settings.widthMm}mm × {settings.heightMm}mm
                  </span>
                </div>

                {previewItem ? (
                  <div className="p-4 bg-white/60 border border-dashed border-slate-300 rounded-xl flex items-center justify-center min-h-[200px] w-full overflow-auto">
                    <BarcodeLabelCard
                      item={previewItem}
                      settings={effectiveSettings}
                      isPrintPreview={true}
                    />
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-10">اختر صنفاً للمعاينة</div>
                )}

                {previewItem && (
                  <div className="w-full mt-3 pt-3 border-t border-slate-200 text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-semibold">الموديل:</span>
                      <span className="font-bold text-slate-900">{previewItem.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">المقاس / اللون:</span>
                      <span className="font-bold text-slate-900">{previewItem.size} - {previewItem.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">كود الباركود المشفر:</span>
                      <span className="font-mono text-indigo-700 font-bold" dir="ltr">{previewItem.barcodeValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">نص تذييل الملصق:</span>
                      <span className="font-bold text-indigo-700">
                        {previewItem.customFooter !== undefined ? (previewItem.customFooter || 'بدون') : (effectiveSettings.customFooter || 'بدون')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Print Summary Card */}
              <div className="w-full bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs text-indigo-200 font-bold">إجمالي ملصقات الباركود</span>
                  <div className="text-2xl font-black text-white tabular-nums">
                    {totalStickersCount} <span className="text-xs font-normal text-slate-300">ملصق</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>جاهز للطباعة على طابعات الباركود الحرارية</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    تلقائياً يقوم المتصفح بإرسال كل ملصق على حدة بحجم {settings.widthMm}×{settings.heightMm} مم بدون هوامش زائدة.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={flatPrintStickers.length === 0}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Printer className="w-5 h-5 text-slate-950" />
                  <span>بدء طباعة {totalStickersCount} ملصق الآن</span>
                </button>

                {printSuccessNotice && (
                  <div className="text-center text-xs font-bold text-emerald-300 animate-in fade-in">
                    ✓ تم إرسال أمر الطباعة بنجاح
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Modal Footer */}
          <div className="p-3 sm:px-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
            <span className="text-xs text-slate-600">
              تعتمد أبعاد وعناصر ملصق الباركود تلقائياً على ما تم ضبطه في <strong>الإعدادات العامة</strong>، ويتاح فقط تعديل نص تذييل الملصق لأمر التشغيل.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* Actual Hidden/Print Container rendered exclusively for @media print */}
      <div className="hidden print:block thermal-print-container">
        {flatPrintStickers.map((sticker, idx) => (
          <div key={`print-sticker-${idx}`} className="thermal-sticker-page">
            <BarcodeLabelCard
              item={sticker}
              settings={effectiveSettings}
              isPrintPreview={false}
            />
          </div>
        ))}
      </div>
    </>
  );
};
