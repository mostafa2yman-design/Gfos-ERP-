import React, { useState, useEffect } from 'react';
import { ProductionOrder, BatchItem, BatchSplitMethod, BatchSizeData, BatchVariant } from '../types';
import { getOrderById } from '../lib/storage';
import * as Cmd from '../lib/productionOrderCommands';
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { Check, Plus, Trash2, Users, Building2, Layers, Package, Printer, AlertCircle } from 'lucide-react';

interface BatchesFormProps {
  key?: React.Key;
  orderId: string;
  onSaved: () => void;
}

export function BatchesForm({ orderId, onSaved }: BatchesFormProps) {
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
  const [toastConfig, setToastConfig] = useState<{message: string, type: "success" | "error" | "info"} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  
  useEffect(() => {
    const load = async () => {
      const found = await getOrderById(orderId);
      if (found) setOrder(found);
    };
    load();
  }, [orderId]);

  if (!order) return <div>جاري التحميل...</div>;

  const isReadOnly = ["مسودة", "أمر إنتاج معتمد", "أمر قص", "القص الفعلي مدخل", "الباتشات مثبتة", "التجهيز جاري", "التجهيز مكتمل", "الطباعة والتطريز جاري", "الطباعة والتطريز مكتمل", "الخياطة مكتملة", "مغلق"].includes(order.status);
  
  const batches = order.batches || [];
  
  let totalActual = 0;
  if (order.cutData) {
    order.cutData.sizes.forEach(s => s.variants.forEach(v => totalActual += (v.actualQuantity || 0)));
  }
  
  let totalBatches = 0;
  batches.forEach(b => b.sizes.forEach(s => s.variants.forEach(v => totalBatches += v.quantity)));

  const handleSplitMethodChange = async (method: BatchSplitMethod) => {
    if (isReadOnly) return;
    
    // Auto-generate batches based on method
    let newBatches: BatchItem[] = [];
    
    if (method === 'حسب اللون') {
      // Find all unique colors
      const colors = new Set<string>();
      order.cutData!.sizes.forEach(s => s.variants.forEach(v => colors.add(v.color)));
      
      let batchCount = 1;
      colors.forEach(color => {
        const batchSizes: BatchSizeData[] = [];
        order.cutData!.sizes.forEach(s => {
          const v = s.variants.find(va => va.color === color);
          if (v && v.actualQuantity > 0) {
            batchSizes.push({ size: s.size, variants: [{ color, quantity: v.actualQuantity }] });
          }
        });
        
        if (batchSizes.length > 0) {
          newBatches.push({
            id: crypto.randomUUID(),
            batchNumber: `B-${order.orderNumber}-${String(batchCount).padStart(3, '0')}`,
            sizes: batchSizes,
            prepStatus: 'جاري',
            accessoriesPrep: []
          });
          batchCount++;
        }
      });
    } else if (method === 'حسب المقاس') {
      let batchCount = 1;
      order.cutData!.sizes.forEach(s => {
        const validVariants = s.variants.filter(v => v.actualQuantity > 0);
        if (validVariants.length > 0) {
          newBatches.push({
            id: crypto.randomUUID(),
            batchNumber: `B-${order.orderNumber}-${String(batchCount).padStart(3, '0')}`,
            sizes: [{
              size: s.size,
              variants: validVariants.map(v => ({ color: v.color, quantity: v.actualQuantity }))
            }],
            prepStatus: 'جاري',
            accessoriesPrep: []
          });
          batchCount++;
        }
      });
    }
    
    const result = await Cmd.saveBatches(order, newBatches, method);
    if (result.success) {
      if (result.data) setOrder(result.data);
      setToastConfig({ message: `تم إعادة تقسيم الباتشات ${method} بنجاح`, type: "success" });
    } else {
      setError(result.error || "حدث خطأ");
    }
  };

  const handleUpdateVariantQuantity = async (batchId: string, sizeName: string, colorName: string, newQty: number) => {
    if (isReadOnly) return;
    const qty = Math.max(0, newQty || 0);
    const updatedBatches = (order.batches || []).map(batch => {
      if (batch.id !== batchId) return batch;
      return {
        ...batch,
        sizes: batch.sizes.map(s => {
          if (s.size !== sizeName) return s;
          return {
            ...s,
            variants: s.variants.map(v => {
              if (v.color !== colorName) return v;
              return { ...v, quantity: qty };
            })
          };
        })
      };
    });
    
    const result = await Cmd.saveBatches(order, updatedBatches, order.batchSplitMethod || 'مخصص');
    if (result.success && result.data) {
      setOrder(result.data);
    }
  };

  const handleAddNewBatch = async () => {
    if (isReadOnly) return;
    const nextNum = (order.batches?.length || 0) + 1;
    const newBatch: BatchItem = {
      id: crypto.randomUUID(),
      batchNumber: `B-${order.orderNumber}-${String(nextNum).padStart(3, '0')}`,
      sizes: (order.cutData?.sizes || []).map(s => ({
        size: s.size,
        variants: s.variants.map(v => ({ color: v.color, quantity: 0 }))
      })),
      prepStatus: 'جاري',
      accessoriesPrep: []
    };
    const updated = [...(order.batches || []), newBatch];
    const res = await Cmd.saveBatches(order, updated, order.batchSplitMethod || 'مخصص');
    if (res.success && res.data) {
      setOrder(res.data);
      setToastConfig({ message: `تمت إضافة باتش جديد ${newBatch.batchNumber}`, type: 'success' });
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (isReadOnly) return;
    if ((order.batches || []).length <= 1) {
      setToastConfig({ message: 'يجب أن يحتوي أمر الإنتاج على باتش واحد على الأقل', type: 'error' });
      return;
    }
    setConfirmConfig({
      isOpen: true,
      message: 'هل أنت متأكد من حذف هذا الباتش من التقسيم؟',
      onConfirm: async () => {
        const updated = (order.batches || []).filter(b => b.id !== batchId);
        const res = await Cmd.saveBatches(order, updated, order.batchSplitMethod || 'مخصص');
        setConfirmConfig(null);
        if (res.success && res.data) {
          setOrder(res.data);
          setToastConfig({ message: 'تم حذف الباتش بنجاح', type: 'success' });
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  const handleLockBatches = async () => {
    if (isReadOnly) return;
    if (totalBatches !== totalActual) {
      setToastConfig({ message: "لا يمكن التثبيت: إجمالي الباتشات لا يساوي إجمالي القص الفعلي.", type: "error" });
      return;
    }
    setConfirmConfig({
      isOpen: true,
      message: "بعد تثبيت الباتشات لن يمكن تعديل توزيع الكميات. هل أنت متأكد؟",
      onConfirm: async () => {
        const result = await Cmd.lockBatches(order);
        if (result.success) {
          setConfirmConfig(null);
          onSaved();
        } else {
          setConfirmConfig(null);
          setToastConfig({ message: result.error || "حدث خطأ", type: "error" });
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  const statusColor = totalBatches === totalActual ? 'text-emerald-600' : totalBatches < totalActual ? 'text-amber-500' : 'text-red-500';
  const statusMessage = totalBatches === totalActual ? 'التوزيع مكتمل' : totalBatches < totalActual ? 'توجد كمية غير موزعة' : 'التوزيع يتجاوز الكمية المقصوصة';

  return (
    <>
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => confirmConfig?.onCancel()}
      />
      {toastConfig && <Toast message={toastConfig.message} type={toastConfig.type} onClose={() => setToastConfig(null)} />}
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

    <div className="space-y-6 p-6">
      {order.batchesLockedAt ? (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-sm">
                  تم اعتماد وتثبيت تقسيم الباتشات بنجاح
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                  معتمد ومثبت
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                {order.batchesLockedBy ? `بواسطة: ${order.batchesLockedBy}` : ''}
                {order.batchesLockedAt ? ` • بتاريخ: ${new Date(order.batchesLockedAt).toLocaleString('ar-EG')}` : ''}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-lg">
            تم قفل توزيع الباتشات وتثبيتها للتشغيل
          </span>
        </div>
      ) : order.status === 'مسودة' ? (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm">أمر الإنتاج لا يزال مسودة قيد الإعداد</h4>
            <p className="text-xs text-amber-800 mt-0.5">
              يلزم اعتماد أمر الإنتاج وقائمة الخامات ثم إدخال القص الفعلي أولاً لتفعيل تقسيم الباتشات.
            </p>
          </div>
        </div>
      ) : null}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-lg">تقسيم الباتشات</h3>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            توزيع ناتج القص الفعلي على دفعات تشغيل مستقلة لكل مرحلة
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isReadOnly ? (
            <button
              onClick={handleLockBatches}
              disabled={totalBatches !== totalActual}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors shadow-sm font-bold text-sm ${
                totalBatches === totalActual ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              اعتماد وتثبيت الباتشات
            </button>
          ) : (
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg shadow-sm font-bold text-sm">
                <Check className="w-4 h-4 stroke-[2.5]" />
                تم الاعتماد والتثبيت
             </div>
          )}
        </div>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">القص الفعلي الكلي (المتاح)</p>
          <p className="text-2xl font-black text-slate-800">{totalActual} <span className="text-xs font-normal text-slate-500">قطعة</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">إجمالي الموزع في الباتشات</p>
          <p className={`text-2xl font-black ${statusColor}`}>{totalBatches} <span className="text-xs font-normal text-slate-500">قطعة</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">حالة التوزيع والتطابق</p>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${totalBatches === totalActual ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <p className={`text-base font-bold ${statusColor}`}>{statusMessage}</p>
            </div>
            {totalBatches !== totalActual && (
              <p className="text-xs text-slate-400 mt-0.5">
                {totalActual - totalBatches > 0 
                  ? `متبقي ${totalActual - totalBatches} قطعة بحاجة للتوزيع`
                  : `فائض ${totalBatches - totalActual} قطعة فوق ناتج القص`}
              </p>
            )}
          </div>
          {!isReadOnly && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSplitMethodChange('حسب اللون')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  order.batchSplitMethod === 'حسب اللون' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                تقسيم تلقائي حسب اللون
              </button>
              <button
                type="button"
                onClick={() => handleSplitMethodChange('حسب المقاس')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  order.batchSplitMethod === 'حسب المقاس' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                تقسيم تلقائي حسب المقاس
              </button>
              <button
                type="button"
                onClick={handleAddNewBatch}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors shadow-xs"
                title="إضافة باتش جديد فارغ للتوزيع اليدوي"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة باتش
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick navigation pill bar if multiple batches */}
      {batches.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-semibold shrink-0">الانتقال السريع للباتش:</span>
          {batches.map((b, idx) => {
            let bSum = 0;
            b.sizes.forEach(s => s.variants.forEach(v => bSum += v.quantity));
            return (
              <a
                key={b.id}
                href={`#batch-${b.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg shrink-0 font-medium transition-colors shadow-2xs"
              >
                <span className="font-bold text-indigo-600">#{idx + 1}</span>
                <span>{b.batchNumber}</span>
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[11px] font-bold">
                  {bSum} ق
                </span>
              </a>
            );
          })}
        </div>
      )}

      {/* Separate Table for each batch */}
      <div className="space-y-6">
        {batches.length > 0 ? (
          batches.map((batch, index) => {
            let batchTotal = 0;
            batch.sizes.forEach(s => s.variants.forEach(v => batchTotal += v.quantity));
            const batchPercentage = totalActual > 0 ? ((batchTotal / totalActual) * 100).toFixed(1) : '0';

            const printStatus = batch.printEmbroideryStatus || 'لم يبدأ';
            const sewStatus = batch.sewingData?.status || 'لم يبدأ';
            const prepStatus = batch.prepStatus || 'لم يبدأ';

            const isExternal =
              batch.sewingData?.manufacturingType === 'تصنيع خارجي' ||
              Boolean(batch.sewingData?.externalManufacturer?.trim());
            const isInternal =
              batch.sewingData?.manufacturingType === 'تصنيع داخلي' ||
              Boolean(batch.sewingData?.sewingGroup?.trim());
            const sewingResponsibleName = isExternal
              ? (batch.sewingData?.externalManufacturer?.trim() || 'جهة خارجية')
              : isInternal
              ? (batch.sewingData?.sewingGroup?.trim() || 'مجموعة داخلية')
              : null;

            // Collect all variants for this batch
            const items: { size: string; color: string; quantity: number }[] = [];
            batch.sizes.forEach(s => {
              s.variants.forEach(v => {
                items.push({ size: s.size, color: v.color, quantity: v.quantity });
              });
            });

            // If read-only, filter rows with quantity > 0
            const displayItems = isReadOnly ? items.filter(i => i.quantity > 0) : items;

            return (
              <div
                id={`batch-${batch.id}`}
                key={batch.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Batch Header Bar */}
                <div className="bg-slate-50/90 px-5 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-slate-800 text-base">
                          {batch.batchNumber}
                        </h4>
                        <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-200">
                          إجمالي الباتش: {batchTotal} قطعة ({batchPercentage}%)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>مراحل الباتش:</span>
                        <span className="text-emerald-700 font-semibold">القص (مكتمل)</span>
                        <span>•</span>
                        <span className="text-slate-600 font-semibold">التجهيز ({prepStatus})</span>
                        <span>•</span>
                        <span className="text-slate-600 font-semibold">الطباعة ({printStatus})</span>
                        <span>•</span>
                        <span className="text-slate-600 font-semibold">الخياطة ({sewStatus})</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {sewingResponsibleName && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isInternal
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {isInternal ? <Users className="w-3.5 h-3.5 text-blue-600" /> : <Building2 className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{isInternal ? 'مجموعة: ' : 'جهة: '}{sewingResponsibleName}</span>
                      </span>
                    )}

                    {!isReadOnly && batches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-red-200 text-xs font-semibold"
                        title="حذف هذا الباتش"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف الباتش</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* The Dedicated Table for this Batch */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-100/70 text-slate-700 text-xs font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-center w-12 border-b">#</th>
                        <th className="px-4 py-3 border-b">المقاس</th>
                        <th className="px-4 py-3 border-b">اللون</th>
                        <th className="px-4 py-3 text-center border-b">الكمية الموزعة في هذا الباتش</th>
                        <th className="px-4 py-3 text-center border-b">نسبة الصنف من الباتش</th>
                        <th className="px-4 py-3 text-center border-b">إجمالي المقصوص الفعلي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayItems.length > 0 ? (
                        displayItems.map((item, rowIdx) => {
                          const totalCutForVariant = order.cutData?.sizes
                            ?.find(s => s.size === item.size)
                            ?.variants?.find(v => v.color === item.color)?.actualQuantity || 0;

                          const rowPercentage = batchTotal > 0 ? ((item.quantity / batchTotal) * 100).toFixed(1) : '0';

                          return (
                            <tr key={`${batch.id}-${item.size}-${item.color}`} className="hover:bg-indigo-50/20 transition-colors">
                              <td className="px-4 py-2.5 text-center text-xs text-slate-400 font-mono">
                                {rowIdx + 1}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-slate-800">
                                <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-xs font-bold">
                                  {item.size}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-700 font-medium">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                                  {item.color}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {!isReadOnly ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateVariantQuantity(batch.id, item.size, item.color, parseInt(e.target.value) || 0)}
                                    className="w-24 text-center font-bold text-indigo-700 border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                                  />
                                ) : (
                                  <span className="font-extrabold text-indigo-700 text-sm">{item.quantity} قطعة</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">
                                {rowPercentage}%
                              </td>
                              <td className="px-4 py-2.5 text-center text-xs text-slate-500 font-medium">
                                {totalCutForVariant} قطعة
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-sm italic">
                            لا توجد كميات موزعة في هذا الباتش حالياً
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50/80 border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 font-bold text-slate-800 text-xs">
                          إجمالي كمية الباتش ({batch.batchNumber})
                        </td>
                        <td className="px-4 py-3 text-center font-black text-indigo-700 text-base">
                          {batchTotal} قطعة
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-600 text-xs">
                          100%
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                          {batchPercentage}% من إجمالي ناتج القص ({totalActual} ق)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-base">لم يتم تقسيم الباتشات بعد</p>
            <p className="text-slate-400 text-sm mt-1">اختر طريقة التقسيم التلقائي (حسب اللون أو حسب المقاس) لتوليد الجداول</p>
          </div>
        )}
      </div>

      {/* Bottom Approval & Control Bar */}
      {batches.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">حالة اعتماد الباتشات:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              (isReadOnly || order.batchesLockedAt)
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {(isReadOnly || order.batchesLockedAt) ? 'البـاتشات معتمدة ومثبتة' : 'قيد التوزيع والتعديل'}
            </span>
            <span className="text-xs text-slate-500">
              ({batches.length} باتش بإجمالي {totalBatches} قطعة من أصل {totalActual} مقصوصة)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {(isReadOnly || order.batchesLockedAt) ? (
              <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg shadow-xs font-bold text-sm">
                <Check className="w-5 h-5 stroke-[2.5]" />
                تم اعتماد وتثبيت الباتشات بالكامل
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLockBatches}
                disabled={totalBatches !== totalActual}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors font-bold shadow-sm text-sm cursor-pointer ${
                  totalBatches === totalActual
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                اعتماد وتثبيت الباتشات
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
