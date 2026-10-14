import React, { useState, useEffect, useRef } from "react";
import { ProductionOrder, BatchItem, SewingData, SewingVariantData, SewingManufacturingType } from "../types";
import { getOrderById } from "../lib/storage";
import { getOperationalGroups } from "../lib/accountingStorage";
import { OperationalGroup } from "../types";
import * as Cmd from "../lib/productionOrderCommands";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { Check, Save, Scissors, Printer, CheckSquare, Copy } from "lucide-react";
import { SewingWorkOrder } from './workorders/SewingWorkOrder';
import { eventBus } from "../lib/events/eventBus";

interface Props {
  orderId: string;
  onSaved: () => void;
}

export const SewingForm: React.FC<Props> = ({ orderId, onSaved }) => {
  const [internalGroups, setInternalGroups] = useState<OperationalGroup[]>([]);
  const [externalGroups, setExternalGroups] = useState<OperationalGroup[]>([]);
  
  useEffect(() => {
    const allGroups = getOperationalGroups();
    setInternalGroups(allGroups.filter(g => g.type === 'internal' && g.isActive));
    setExternalGroups(allGroups.filter(g => g.type === 'external' && g.isActive));
  }, []);
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [toastConfig, setToastConfig] = useState<{ message: string; type: "success" | "error"; } | null>(null);
  const [printingBatchId, setPrintingBatchId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = async (batchId: string) => {
    setPrintingBatchId(batchId);
    setTimeout(() => {
      window.print();
      setPrintingBatchId(null);
    }, 100);
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    const o = await getOrderById(orderId);
    if (o) {
      setOrder(o);
      setBatches(
        o.batches?.map((b) => ({
          ...b,
          sewingData: b.sewingData || {
            status: "لم يبدأ",
            actualQuantities: [],
          },
        })) || []
      );
    }
  };

  if (!order) return null;

  const isSewingCompleted = order.status === 'الخياطة مكتملة' || ["التشطيب جاري", "التشطيب مكتمل", "المكواة جاري", "المكواة مكتملة", "مغلق"].includes(order.status);
  const isReadOnly = isSewingCompleted || ["مسودة", "أمر إنتاج معتمد", "أمر قص", "القص الفعلي مدخل", "القص معتمد", "تقسيم الباتشات", "الباتشات مثبتة", "التجهيز جاري"].includes(order.status);

  const totalBatches = batches.length;
  const approvedBatches = batches.filter((b) => b.sewingData?.status === "مكتمل").length;
  const allBatchesApproved = totalBatches > 0 && approvedBatches === totalBatches;

  const handleSewingChange = (
    batchId: string,
    field: keyof SewingData,
    value: any
  ) => {
    setBatches(
      batches.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            sewingData: {
              ...b.sewingData!,
              [field]: value,
            },
          };
        }
        return b;
      })
    );
  };

  const handleReceiveFullBatch = async (batchId: string) => {
    setBatches(
      batches.map((b) => {
        if (b.id === batchId) {
          const newActualQuantities: SewingVariantData[] = [];
          b.sizes.forEach(bs => {
            bs.variants.forEach(v => {
              newActualQuantities.push({
                size: bs.size,
                color: v.color,
                actualQuantity: v.quantity
              });
            });
          });
          return {
            ...b,
            sewingData: {
              ...b.sewingData!,
              actualQuantities: newActualQuantities
            }
          };
        }
        return b;
      })
    );
  };

  const handleActualQtyChange = (
    batchId: string,
    size: string,
    color: string,
    qty: number
  ) => {
    setBatches(
      batches.map((b) => {
        if (b.id === batchId) {
          const sData = b.sewingData!;
          const existing = sData.actualQuantities;
          const index = existing.findIndex((v) => v.size === size && v.color === color);
          let newQuantities = [...existing];
          if (index >= 0) {
            newQuantities[index].actualQuantity = qty;
          } else {
            newQuantities.push({ size, color, actualQuantity: qty });
          }
          return {
            ...b,
            sewingData: {
              ...sData,
              actualQuantities: newQuantities,
            },
          };
        }
        return b;
      })
    );
  };

  const handleSave = async () => {
    const result = await Cmd.saveSewingData(order, batches);
    if (result.success && result.data) {
      setOrder(result.data);
      if (result.data.batches) setBatches(result.data.batches);
      setToastConfig({
        message: "تم حفظ بيانات الخياطة بنجاح",
        type: "success",
      });
      if (onSaved) onSaved();
    } else {
      setToastConfig({
        message: result.error || "حدث خطأ أثناء الحفظ",
        type: "error",
      });
    }
  };

  const handleCopyDetails = (sourceBatchId: string) => {
    const sourceBatch = batches.find(b => b.id === sourceBatchId);
    if (!sourceBatch || !sourceBatch.sewingData) return;
    
    const updatedBatches = batches.map(b => {
      if (b.id === sourceBatchId) return b;
      return {
        ...b,
        sewingData: {
          ...b.sewingData!,
          manufacturingType: sourceBatch.sewingData.manufacturingType,
          sewingGroup: sourceBatch.sewingData.sewingGroup,
          externalManufacturer: sourceBatch.sewingData.externalManufacturer,
          actualCostPerPiece: sourceBatch.sewingData.actualCostPerPiece
        }
      };
    });
    setBatches(updatedBatches);
    setToastConfig({ message: "تم نسخ تفاصيل الخياطة لجميع الباتشات بنجاح", type: "success" });
  };

  const handleApproveBatch = async (batchId: string) => {
    const targetBatch = batches.find(b => b.id === batchId);
    if (!targetBatch || !targetBatch.sewingData) {
      setToastConfig({ message: "بيانات الخياطة غير متوفرة لهذا الباتش", type: "error" });
      return;
    }
    const s = targetBatch.sewingData;
    if (!s.manufacturingType) {
      setToastConfig({ message: `يجب تحديد نوع التصنيع للباتش ${targetBatch.batchNumber}`, type: "error" });
      return;
    }
    if (s.manufacturingType === 'تصنيع داخلي' && !s.sewingGroup) {
      setToastConfig({ message: `يجب اختيار مجموعة الخياطة للباتش ${targetBatch.batchNumber}`, type: "error" });
      return;
    }
    if (s.manufacturingType === 'تصنيع خارجي' && !s.externalManufacturer) {
      setToastConfig({ message: `يجب إدخال أو اختيار جهة التصنيع الخارجي للباتش ${targetBatch.batchNumber}`, type: "error" });
      return;
    }
    if (s.actualCostPerPiece === undefined || s.actualCostPerPiece === null) {
      setToastConfig({ message: `يجب إدخال سعر التصنيع الفعلي للقطعة للباتش ${targetBatch.batchNumber}`, type: "error" });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      message: `هل أنت متأكد من اعتماد الخياطة للباتش رقم ${targetBatch.batchNumber}؟ لا يمكن تعديل بيانات الباتش بعد الاعتماد.`,
      onConfirm: async () => {
        const saveResult = await Cmd.saveSewingData(order, batches);
        if (saveResult.success && saveResult.data) {
          const approveResult = await Cmd.approveBatchSewing(saveResult.data, batchId);
          if (approveResult.success && approveResult.data) {
            setOrder(approveResult.data);
            setBatches(approveResult.data.batches || []);
            setToastConfig({
              message: `تم اعتماد خياطة الباتش ${targetBatch.batchNumber} بنجاح`,
              type: "success",
            });
            if (onSaved) onSaved();
          } else {
            setToastConfig({
              message: approveResult.error || "حدث خطأ أثناء الاعتماد",
              type: "error",
            });
          }
        } else {
          setToastConfig({
            message: saveResult.error || "حدث خطأ أثناء الحفظ",
            type: "error",
          });
        }
        setConfirmConfig(null);
      },
    });
  };

  const handleApprove = async () => {
    if (!allBatchesApproved) {
      setToastConfig({
        message: `لا يمكن اعتماد كامل مرحلة الخياطة إلا بعد اعتماد جميع الباتشات أولاً. (تم اعتماد ${approvedBatches} من أصل ${totalBatches} باتش)`,
        type: "error",
      });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      message:
        "هل أنت متأكد من اعتماد مرحلة الخياطة بالكامل للأوردر؟ لن تتمكن من تعديل بيانات الخياطة لاحقاً.",
      onConfirm: async () => {
        const saveResult = await Cmd.saveSewingData(order, batches);
        if (saveResult.success && saveResult.data) {
          const approveResult = await Cmd.approveSewing(saveResult.data);
          if (approveResult.success && approveResult.data) {
            setOrder(approveResult.data);
            setBatches(approveResult.data.batches || []);
            setToastConfig({
              message: "تم اعتماد مرحلة الخياطة بالكامل بنجاح",
              type: "success",
            });
            if (onSaved) onSaved();
          } else {
            setToastConfig({
              message: approveResult.error || "حدث خطأ أثناء الاعتماد",
              type: "error",
            });
          }
        } else {
           setToastConfig({
              message: saveResult.error || "حدث خطأ أثناء الحفظ",
              type: "error",
            });
        }
        setConfirmConfig(null);
      },
    });
  };

  return (
    <>
    <div className={`space-y-6 print:hidden ${printingBatchId ? 'hidden' : ''}`}>
      {toastConfig && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig(null)}
        />
      )}
      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          title="تأكيد الاعتماد"
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

      {order.sewingInstructions && (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
          <h4 className="font-bold text-amber-900 text-sm mb-1">تعليمات وملاحظات الخياطة</h4>
          <p className="text-amber-800 text-sm whitespace-pre-wrap">{order.sewingInstructions}</p>
        </div>
      )}

      {batches.length === 0 ? (
        <div className="bg-white dark:bg-[#150d24] p-8 rounded-2xl shadow-2xs border border-slate-200 dark:border-purple-950/70 text-center text-slate-500 dark:text-slate-400 text-sm">
          لا توجد باتشات في هذا الأمر.
        </div>
      ) : (
        <>
          {batches.length > 1 && (
            <div className="bg-white dark:bg-[#150d24] rounded-2xl shadow-2xs border border-slate-200 dark:border-purple-950/70 overflow-hidden mb-8">
              <div className="bg-slate-50 dark:bg-[#1a0f30] px-6 py-3.5 border-b border-slate-200 dark:border-purple-950/60 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">جدول ملخص تشغيل دفعات الخياطة (جميع الباتشات)</h3>
                <span className="text-[10px] text-slate-400 font-mono">{batches.length} باتش</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50/75 dark:bg-[#1f1338]/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-purple-950/60">
                    <tr>
                      <th className="px-4 py-3 font-bold">باتش</th>
                      <th className="px-4 py-3 font-bold">طريقة التصنيع</th>
                      <th className="px-4 py-3 font-bold">الجهة / المجموعة</th>
                      <th className="px-4 py-3 font-bold text-center">المطلوب</th>
                      <th className="px-4 py-3 font-bold text-center">الفعلي</th>
                      <th className="px-4 py-3 font-bold text-center">النقص</th>
                      <th className="px-4 py-3 font-bold text-center">السعر / قطعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-purple-950/40">
                    {batches.map(batch => {
                      const sData = batch.sewingData!;
                      let bReq = 0;
                      let bAct = 0;
                      batch.sizes.forEach(bs => bs.variants.forEach(v => bReq += v.quantity));
                      sData.actualQuantities.forEach(v => bAct += (v.actualQuantity || 0));
                      const bMiss = bReq - bAct;
                      const method = sData.manufacturingType || "—";
                      const group = sData.manufacturingType === "تصنيع داخلي" 
                                      ? (sData.sewingGroup || "—") 
                                      : (sData.manufacturingType === "تصنيع خارجي" 
                                          ? (sData.externalManufacturer || "—") 
                                          : "—");
                      const price = sData.actualCostPerPiece !== undefined ? Number(sData.actualCostPerPiece).toFixed(2) : "—";
                      
                      return (
                        <tr key={batch.id} className="hover:bg-slate-50/50 dark:hover:bg-purple-950/20 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{batch.batchNumber}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{method}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold">{group}</td>
                          <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">{bReq}</td>
                          <td className="px-4 py-3 text-center font-mono tabular-nums text-purple-700 dark:text-purple-300 font-bold">{bAct}</td>
                          <td className="px-4 py-3 text-center font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold">{bMiss > 0 ? bMiss : "—"}</td>
                          <td className="px-4 py-3 text-center font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold">{price}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {batches.map((batch) => {
            const sData = batch.sewingData!;
          let requiredTotal = 0;
          let actualTotal = 0;
          batch.sizes.forEach(bs => {
            bs.variants.forEach(v => {
              requiredTotal += v.quantity;
            });
          });
          sData.actualQuantities.forEach(v => {
             actualTotal += (v.actualQuantity || 0);
          });
          
          let completionRatio = requiredTotal > 0 ? (actualTotal / requiredTotal) * 100 : 0;
          const missing = requiredTotal - actualTotal;

          return (
            <div key={batch.id} className="bg-white dark:bg-[#150d24] rounded-2xl shadow-2xs border border-slate-200 dark:border-purple-950/70 overflow-hidden mb-6">
              <div className="bg-slate-50 dark:bg-[#1a0f30] px-6 py-4 border-b border-slate-200 dark:border-purple-950/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">دفعة:</span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800/60">
                      {batch.batchNumber}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handlePrint(batch.id)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1f1338] border border-slate-300 dark:border-purple-900/40 rounded-lg hover:text-[#2C1151] hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>طباعة الإيصال</span>
                  </button>
                  {!isReadOnly && batches.length > 1 && batch.sewingData?.status !== 'مكتمل' && (
                    <button
                      type="button"
                      onClick={() => handleCopyDetails(batch.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1f1338] border border-slate-300 dark:border-purple-900/40 rounded-lg hover:text-[#2C1151] hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors shadow-2xs cursor-pointer"
                      title="نسخ تفاصيل الخياطة للباتشات المتبقية"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>نسخ للباتشات</span>
                    </button>
                  )}

                  {batch.sewingData?.status !== 'مكتمل' ? (
                    <button 
                      type="button"
                      onClick={() => handleApproveBatch(batch.id)} 
                      disabled={isReadOnly}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#2C1151] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 rounded-lg hover:bg-purple-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-500" />
                      <span>اعتماد الباتش</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/60 rounded-lg shadow-2xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                      <span>تم الاعتماد {batch.sewingData?.approvedBy ? `(${batch.sewingData.approvedBy})` : ''}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs">
                    <span className="text-slate-500 dark:text-slate-400 ml-1.5">نسبة الإنجاز:</span>
                    <span className={`font-mono font-bold tabular-nums ${completionRatio >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {Number(completionRatio).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs bg-white dark:bg-[#150d24] px-3 py-1 rounded-full border border-slate-200 dark:border-purple-950/60 shadow-2xs font-mono tabular-nums">
                    <span className="text-slate-400 ml-1">مطلوب:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{requiredTotal}</span>
                    <span className="text-slate-300 dark:text-slate-600 mx-1.5">|</span>
                    <span className="text-slate-400 ml-1">فعلي:</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">{actualTotal}</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      طريقة التصنيع <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={sData.manufacturingType || ""}
                      onChange={(e) => handleSewingChange(batch.id, "manufacturingType", e.target.value)}
                      disabled={isReadOnly || sData.status === 'مكتمل'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="" disabled>اختر الطريقة...</option>
                      <option value="تصنيع داخلي">تصنيع داخلي</option>
                      <option value="تصنيع خارجي">تصنيع خارجي</option>
                    </select>
                  </div>

                  {sData.manufacturingType === "تصنيع داخلي" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        مجموعة الخياطة المسؤولة <span className="text-red-500">*</span>
                      </label>
                      
                      <select
                        value={sData.sewingGroup || ""}
                        onChange={(e) => handleSewingChange(batch.id, "sewingGroup", e.target.value)}
                        disabled={isReadOnly || sData.status === 'مكتمل'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="" disabled>اختر المجموعة...</option>
                        {internalGroups.map(g => (
                          <option key={g.id} value={g.name}>{g.name}</option>
                        ))}
                      </select>

                    </div>
                  )}

                  {sData.manufacturingType === "تصنيع خارجي" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        جهة التصنيع الخارجي <span className="text-red-500">*</span>
                      </label>
                      
                      <select
                        value={sData.externalManufacturer || ""}
                        onChange={(e) => handleSewingChange(batch.id, "externalManufacturer", e.target.value)}
                        disabled={isReadOnly || sData.status === 'مكتمل'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="" disabled>اختر الجهة الخارجية...</option>
                        {externalGroups.map(g => (
                          <option key={g.id} value={g.name}>{g.name}</option>
                        ))}
                      </select>

                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      سعر التصنيع الفعلي / قطعة <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={sData.actualCostPerPiece === undefined ? "" : sData.actualCostPerPiece}
                        onChange={(e) => { const v = parseFloat(e.target.value); handleSewingChange(batch.id, 'actualCostPerPiece', isNaN(v) ? undefined : v); }}
                        disabled={isReadOnly || sData.status === 'مكتمل'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.00"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        جنيه
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-bold text-slate-700">
                      الكميات الفعلية المصنعة
                    </h4>
                    {sData.status !== 'مكتمل' && !isReadOnly && (
                      <button
                        onClick={() => handleReceiveFullBatch(batch.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors shadow-sm"
                        title="استلام كامل الكمية المطوبة تلقائياً"
                      >
                        <CheckSquare className="w-4 h-4" />
                        استلام كامل للباتش
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-bold border-b">المقاس</th>
                          <th className="px-4 py-3 font-bold border-b">اللون</th>
                          <th className="px-4 py-3 font-bold border-b">المطلوب</th>
                          <th className="px-4 py-3 font-bold border-b">الفعلي المصنع</th>
                          <th className="px-4 py-3 font-bold border-b">النقص</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batch.sizes.map((bs) =>
                          bs.variants.map((v) => {
                            const actQtyData = sData.actualQuantities.find(
                              (aq) => aq.size === bs.size && aq.color === v.color
                            );
                            const actQty = actQtyData ? actQtyData.actualQuantity : 0;
                            const diff = v.quantity - actQty;

                            return (
                              <tr key={`${bs.size}-${v.color}`}>
                                <td className="px-4 py-3 text-slate-600 font-medium">
                                  {bs.size}
                                </td>
                                <td className="px-4 py-3 text-slate-600 font-medium">
                                  {v.color}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {v.quantity}
                                </td>
                                <td className="px-4 py-3 w-48">
                                  <input
                                    type="number"
                                    min="0"
                                    max={v.quantity}
                                    value={actQty === 0 && !actQtyData ? "" : actQty}
                                    onChange={(e) => {
                                      let val = (() => { const v = parseInt(e.target.value, 10); return isNaN(v) ? 0 : v; })();
                                      if (val > v.quantity) val = v.quantity;
                                      handleActualQtyChange(batch.id, bs.size, v.color, val);
                                    }}
                                    disabled={isReadOnly || sData.status === 'مكتمل'}
                                    className="w-full px-3 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  {diff > 0 && (
                                    <span className="text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full text-xs">
                                      {diff}
                                    </span>
                                  )}
                                  {diff === 0 && actQtyData && (
                                    <Check className="w-4 h-4 text-emerald-500 inline" />
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                        <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                          <td colSpan={2} className="px-4 py-3 text-slate-800 text-left">الإجمالي</td>
                          <td className="px-4 py-3 text-slate-800">{requiredTotal}</td>
                          <td className="px-4 py-3 text-indigo-700">{actualTotal}</td>
                          <td className="px-4 py-3 text-amber-600">{missing}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {missing > 0 && actualTotal > 0 && (
                    <p className="text-amber-600 text-sm mt-3 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-center gap-2">
                       يوجد نقص إجمالي {missing} قطعة عن الكمية المطلوبة في هذا الباتش.
                    </p>
                  )}

                  {batch.sewingData?.status === 'مكتمل' ? (
                    <div className="flex justify-between items-center bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-lg mt-4">
                      <div className="flex items-center gap-2 text-emerald-800 font-medium text-sm">
                        <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                        <div>
                          <span>تم اعتماد خياطة هذا الباتش بنجاح {batch.sewingData.approvedBy ? `بواسطة ${batch.sewingData.approvedBy}` : ''} {batch.sewingData.approvedAt ? `بتاريخ ${new Date(batch.sewingData.approvedAt).toLocaleString('ar-EG')}` : ''}</span>
                          {batch.sewingData.approvalCode && (
                            <div className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 w-fit mt-1">
                              كود التوثيق النظامي: {batch.sewingData.approvalCode}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                        معتمد بالسجل
                      </span>
                    </div>
                  ) : (
                    !isReadOnly && (
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleApproveBatch(batch.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold text-sm shadow-sm"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          اعتماد خياطة الباتش {batch.batchNumber}
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })
        }
        </>
      )}

      {batches.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-slate-50 dark:bg-[#150d24] border border-slate-200 dark:border-purple-950/70 rounded-xl shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">حالة اعتماد الباتشات:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${allBatchesApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
              {approvedBatches} من {totalBatches} باتش معتمد
            </span>
            {!allBatchesApproved && (
              <span className="text-xs text-slate-500">
                (يجب اعتماد جميع الباتشات أولاً لاعتماد كامل الخياطة)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isReadOnly && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium shadow-xs text-sm"
              >
                <Save className="w-4 h-4" />
                حفظ مؤقت
              </button>
            )}

            {isSewingCompleted ? (
              <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg shadow-xs font-bold text-sm">
                <Check className="w-5 h-5 stroke-[2.5]" />
                تم الاعتماد بالكامل
              </div>
            ) : allBatchesApproved ? (
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold shadow-sm text-sm"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                اعتماد الخياطة بالكامل ({approvedBatches} من {totalBatches})
              </button>
            ) : (
              <button
                onClick={() => {
                  setToastConfig({
                    message: `لا يمكن اعتماد كامل مرحلة الخياطة إلا بعد اعتماد جميع الباتشات أولاً. (تم اعتماد ${approvedBatches} من أصل ${totalBatches} باتش)`,
                    type: "error",
                  });
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-200 text-slate-500 rounded-lg cursor-not-allowed font-bold text-sm opacity-80"
                title={`لا يمكن اعتماد كامل الأوردر، متبقي ${totalBatches - approvedBatches} باتش لم يتم اعتماده`}
              >
                <Check className="w-5 h-5 text-slate-400" />
                اعتماد الخياطة بالكامل ({approvedBatches} من {totalBatches})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    
      {printingBatchId && (
        <div className="print:block hidden print:absolute print:inset-0">
          <SewingWorkOrder order={order} batch={batches.find(b => b.id === printingBatchId)!} />
        </div>
      )}
    </>
  );
};
