import React, { useState, useEffect, useRef } from "react";
import { ProductionOrder, BatchItem, IroningData, IroningVariantData } from "../types";
import { getOrderById } from "../lib/storage";
import { getLabor } from "../lib/accountingStorage";
import { LaborProfile } from "../types";
import * as Cmd from "../lib/productionOrderCommands";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { Check, Save, Sparkles, Printer, CheckSquare, Settings2, Copy } from "lucide-react";
import { IroningWorkOrderPrint } from "./print/workorders/IroningWorkOrderPrint";
import { eventBus } from "../lib/events/eventBus";

interface Props {
  orderId: string;
  onSaved: () => void;
}

export const IroningForm: React.FC<Props> = ({ orderId, onSaved }) => {
  const [ironingWorkers, setIroningWorkers] = React.useState<LaborProfile[]>([]);
  React.useEffect(() => {
    setIroningWorkers(getLabor().filter(l => l.isActive));
  }, []);
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [toastConfig, setToastConfig] = useState<{ message: string; type: "success" | "error"; } | null>(null);
  
  const [printing, setPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrintAll = async () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
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
          ironingData: b.ironingData || {
            status: 'لم يبدأ',
            actualQuantities: (b.finishingData?.actualQuantities || []).map(sq => ({
              size: sq.size,
              color: sq.color,
              actualQuantity: ((sq as any).actualQuantity ?? (sq as any).quantity ?? 0)
            })) || []
          }
        })) || []
      );
    }
  };

  const handleUpdateIroningData = (batchId: string, field: keyof IroningData, value: any) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b;
        return {
          ...b,
          ironingData: {
            ...(b.ironingData as IroningData),
            [field]: value,
          },
        };
      })
    );
  };

  const handleVariantQuantityChange = (batchId: string, size: string, color: string, actualQuantity: number) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId || !b.ironingData) return b;
        
        const existingQty = [...b.ironingData.actualQuantities];
        const idx = existingQty.findIndex(q => q.size === size && q.color === color);
        
        if (idx >= 0) {
          existingQty[idx] = { ...existingQty[idx], actualQuantity };
        } else {
          existingQty.push({ size, color, actualQuantity });
        }
        
        return {
          ...b,
          ironingData: {
            ...b.ironingData,
            actualQuantities: existingQty
          }
        };
      })
    );
  };

  const saveIroning = async (batchId: string, shouldApprove: boolean = false) => {
    if (!order) return;
    
    const batch = batches.find((b) => b.id === batchId);
    if (!batch || !batch.ironingData) return;

    if (shouldApprove) {
      if (batch.ironingData.actualCostPerPiece === undefined || batch.ironingData.actualCostPerPiece === null) {
        setToastConfig({ message: "يجب إدخال تكلفة المكواة الفعلية للقطعة قبل الاعتماد.", type: "error" });
        return;
      }
    }

    const updatedOrder = { ...order, batches };
    const savedResult = await Cmd.saveIroningData(order, batches);

    if (savedResult.success) {
      if (shouldApprove) {
        setConfirmConfig({
          isOpen: true,
          message: `هل أنت متأكد من اعتماد بيانات المكواة للباتش ${batch.batchNumber}؟ لا يمكن تعديل البيانات بعد الاعتماد.`,
          onConfirm: async () => {
            setConfirmConfig(null);
            
            const approveResult = await Cmd.approveBatchIroning(savedResult.data!, batchId);
            if (approveResult.success) {
              setToastConfig({ message: `تم اعتماد مكواة الباتش ${batch.batchNumber} بنجاح.`, type: "success" });
              if (approveResult.data) {
                setOrder(approveResult.data);
                setBatches(approveResult.data.batches || []);
              }
              onSaved();
            } else {
              setToastConfig({ message: approveResult.error || "حدث خطأ أثناء الاعتماد.", type: "error" });
            }
          },
        });
      } else {
        setToastConfig({ message: "تم الحفظ بنجاح.", type: "success" });
        if (savedResult.data) {
          setOrder(savedResult.data);
          setBatches(savedResult.data.batches || []);
        }
        onSaved();
      }
    } else {
      setToastConfig({ message: savedResult.error || "حدث خطأ أثناء الحفظ.", type: "error" });
    }
  };
  

  const handleCopyDetails = (sourceBatchId: string) => {
    const sourceBatch = batches.find(b => b.id === sourceBatchId);
    if (!sourceBatch || !sourceBatch.ironingData) return;
    
    const updatedBatches = batches.map(b => {
      if (b.id === sourceBatchId) return b;
      return {
        ...b,
        ironingData: {
          ...b.ironingData!,
          actualCostPerPiece: sourceBatch.ironingData.actualCostPerPiece,
          workerName: sourceBatch.ironingData.workerName
        }
      };
    });
    setBatches(updatedBatches);
    setToastConfig({ message: "تم نسخ تفاصيل المكواة لجميع الباتشات بنجاح", type: "success" });
  };

  const totalBatches = batches.length;
  const approvedBatches = batches.filter(b => b.ironingData?.status === 'مكتمل').length;
  const allBatchesApproved = totalBatches > 0 && approvedBatches === totalBatches;

  const approveAllIroning = async () => {
    if (!order) return;
    
    if (!allBatchesApproved) {
      setToastConfig({
        message: `لا يمكن اعتماد كامل مرحلة المكواة إلا بعد اعتماد جميع الباتشات أولاً. (تم اعتماد ${approvedBatches} من أصل ${totalBatches} باتش)`,
        type: "error",
      });
      return;
    }
    
    setConfirmConfig({
      isOpen: true,
      message: "هل أنت متأكد من اعتماد مرحلة المكواة بالكامل للأوردر؟ لن تتمكن من تعديل البيانات بعد الاعتماد.",
      onConfirm: async () => {
        setConfirmConfig(null);
        const saveResult = await Cmd.saveIroningData(order, batches);
        if (!saveResult.success || !saveResult.data) {
          setToastConfig({ message: saveResult.error || "خطأ في الحفظ", type: "error" });
          return;
        }
        const approveResult = await Cmd.approveAllIroning(saveResult.data);
        if (approveResult.success) {
          setToastConfig({ message: "تم اعتماد مرحلة المكواة بالكامل بنجاح.", type: "success" });
          if (approveResult.data) {
            setOrder(approveResult.data);
            setBatches(approveResult.data.batches || []);
          }
          onSaved();
        } else {
          setToastConfig({ message: approveResult.error || "حدث خطأ أثناء الاعتماد.", type: "error" });
        }
      }
    });
  };

  if (!order) return <div>جاري التحميل...</div>;

  const isFullyApproved = allBatchesApproved || order.status === 'المكواة مكتملة' || order.status === 'مغلق';
  const isOrderReadOnly = isFullyApproved;

  return (
    <>
      <div className="space-y-6 relative print:hidden">
        <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => setConfirmConfig(null)}
      />
      {toastConfig && <Toast message={toastConfig.message} type={toastConfig.type} onClose={() => setToastConfig(null)} />}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              مرحلة المكواة
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              إدارة بيانات وتكاليف مرحلة المكواة لجميع الباتشات
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrintAll}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-sm"
            >
              <Printer className="w-4 h-4" />
              طباعة أمر التشغيل الشامل
            </button>
            {isFullyApproved ? (
               <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg font-bold text-sm shadow-xs">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  تم الاعتماد بالكامل ({approvedBatches} من {totalBatches})
               </div>
            ) : allBatchesApproved ? (
              <button
                onClick={approveAllIroning}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold text-sm shadow-sm"
              >
                <CheckSquare className="w-4 h-4" />
                اعتماد المكواة بالكامل ({approvedBatches} من {totalBatches})
              </button>
            ) : (
              <button
                onClick={() => {
                  setToastConfig({
                    message: `لا يمكن اعتماد كامل مرحلة المكواة إلا بعد اعتماد جميع الباتشات أولاً. (تم اعتماد ${approvedBatches} من أصل ${totalBatches} باتش)`,
                    type: "error",
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 border border-slate-300 rounded-lg cursor-not-allowed font-medium text-sm shadow-xs"
                title={`يجب اعتماد جميع الباتشات أولاً (متبقي ${totalBatches - approvedBatches} باتش لم يعتمد)`}
              >
                <CheckSquare className="w-4 h-4 text-slate-400" />
                اعتماد المكواة بالكامل ({approvedBatches} من {totalBatches} معتمد)
              </button>
            )}
          </div>
        </div>
        
        {order.ironingInstructions && (
           <div className="bg-amber-50 p-4 border-b border-amber-100">
             <h4 className="font-bold text-amber-800 text-sm mb-1">تعليمات المكواة</h4>
             <p className="text-amber-700 text-sm whitespace-pre-wrap">{order.ironingInstructions}</p>
           </div>
        )}

        <div className="p-6 space-y-6">
          {batches.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">ملخص أمر المكواة</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-bold border-b">باتش</th>
                      <th className="px-4 py-3 font-bold border-b">المسئول / العامل</th>
                      <th className="px-4 py-3 font-bold border-b text-center">المطلوب (المستلم من التشطيب)</th>
                      <th className="px-4 py-3 font-bold border-b text-center">الفعلي (المكوي)</th>
                      <th className="px-4 py-3 font-bold border-b text-center">النقص</th>
                      <th className="px-4 py-3 font-bold border-b text-center">السعر / قطعة</th>
                      <th className="px-4 py-3 font-bold border-b text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map(batch => {
                      const fData = batch.ironingData;
                      let bReq = 0;
                      let bAct = 0;
                      
                      // Required is what came out of finishing or sewing
                      if (batch.finishingData?.actualQuantities && batch.finishingData.actualQuantities.length > 0) {
                        batch.finishingData.actualQuantities.forEach(fq => bReq += (fq.actualQuantity || 0));
                      } else if (batch.sewingData?.actualQuantities && batch.sewingData.actualQuantities.length > 0) {
                        batch.sewingData.actualQuantities.forEach(sq => bReq += (sq.actualQuantity || 0));
                      }
                      if (bReq === 0) {
                        batch.sizes.forEach(bs => bs.variants.forEach(v => bReq += v.quantity));
                      }
                      
                      fData?.actualQuantities?.forEach(v => bAct += (v.actualQuantity || 0));
                      const bMiss = bReq - bAct;
                      const worker = fData?.workerName || "—";
                      const price = fData?.actualCostPerPiece !== undefined && fData?.actualCostPerPiece !== null 
                        ? Number(fData.actualCostPerPiece).toFixed(2) 
                        : "—";
                      const isComplete = fData?.status === 'مكتمل';
                      
                      return (
                        <tr key={batch.id}>
                          <td className="px-4 py-3 font-bold">{batch.batchNumber}</td>
                          <td className="px-4 py-3 text-slate-600">{worker}</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">{bReq}</td>
                          <td className="px-4 py-3 text-center text-indigo-700 font-bold">{bAct}</td>
                          <td className="px-4 py-3 text-center text-amber-600 font-bold">{bMiss > 0 ? bMiss : "—"}</td>
                          <td className="px-4 py-3 text-center text-emerald-700 font-bold">{price}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {fData?.status || 'لم يبدأ'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {batches.map((batch) => {
            const fData = batch.ironingData;
            if (!fData) return null;
            const isBatchReadOnly = isOrderReadOnly || fData.status === 'مكتمل';

            return (
              <div key={batch.id} className="border border-slate-200 dark:border-purple-950/70 bg-white dark:bg-[#150d24] rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-50 dark:bg-[#1a0f30] px-4 py-3 flex justify-between items-center border-b border-slate-200 dark:border-purple-950/60">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800 dark:text-white bg-white dark:bg-[#1f1338] border border-slate-200 dark:border-purple-900/40 px-3 py-1 rounded-lg shadow-2xs text-xs font-mono">
                      باتش: {batch.batchNumber}
                    </span>

                    {!isOrderReadOnly && batches.length > 1 && fData.status !== 'مكتمل' && (
                      <button
                        onClick={() => handleCopyDetails(batch.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm ml-2"
                        title="نسخ تفاصيل المكواة للباتشات المتبقية"
                      >
                        <Copy className="w-4 h-4" />
                        نسخ للباتشات
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {fData.status === 'مكتمل' ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg shadow-xs">
                        <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                        تم الاعتماد {fData.approvedBy ? `(${fData.approvedBy})` : ''}
                      </span>
                    ) : (
                      !isOrderReadOnly && (
                        <button
                          onClick={() => saveIroning(batch.id, true)}
                          className="flex items-center gap-1.5 px-3 py-1 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-xs"
                        >
                          <Check className="w-4 h-4" />
                          اعتماد الباتش
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">عامل المكواة</label>
                      <select
                        value={fData.workerName || ""}
                        onChange={(e) => handleUpdateIroningData(batch.id, 'workerName', e.target.value)}
                        disabled={isBatchReadOnly}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="">اختر عامل المكواة...</option>
                        
                        {Array.from(new Set(ironingWorkers.map(w => w.role || 'غير محدد'))).map(role => (
                          <optgroup key={role} label={role}>
                            {ironingWorkers.filter(w => (w.role || 'غير محدد') === role).map(w => (
                              <option key={w.id} value={w.name}>{w.name}</option>
                            ))}
                          </optgroup>
                        ))}

                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        تكلفة المكواة الفعلية (للقطعة)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={fData.actualCostPerPiece ?? ""}
                          onChange={(e) => { const v = parseFloat(e.target.value); handleUpdateIroningData(batch.id, 'actualCostPerPiece', isNaN(v) ? undefined : v); }}
                          disabled={isBatchReadOnly}
                          className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                          placeholder="0.00"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">جنيه</span>
                      </div>
                    </div>
                  </div>

                                    <div>
                    <h5 className="font-bold text-slate-700 mb-3 text-md">الكميات الفعلية المصنعة السليمة:</h5>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-bold border-b">المقاس</th>
                          <th className="px-4 py-3 font-bold border-b">اللون</th>
                          <th className="px-4 py-3 font-bold border-b">الوارد من التشطيب</th>
                          <th className="px-4 py-3 font-bold border-b">السليم (المكواة)</th>
                          <th className="px-4 py-3 font-bold border-b">النقص (الهالك)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                           let finishingTotal = 0;
                           let ironingTotal = 0;
                           let missingTotal = 0;
                           
                           const rows = (batch.finishingData?.actualQuantities || []).map(sq => {
                                 const incomingQty = (sq as any).actualQuantity ?? (sq as any).quantity ?? 0;
                                 const currentIroningQty = (fData.actualQuantities.find(fq => fq.size === sq.size && fq.color === sq.color) as any)?.actualQuantity ?? (fData.actualQuantities.find(fq => fq.size === sq.size && fq.color === sq.color) as any)?.quantity ?? incomingQty;
                                 const diff = incomingQty - currentIroningQty;
                                 
                                 finishingTotal += incomingQty;
                                 ironingTotal += currentIroningQty;
                                 missingTotal += diff;
                                 
                                 return (
                                    <tr key={`${sq.size}-${sq.color}`}>
                                       <td className="px-4 py-3 text-slate-600 font-medium">
                                          {sq.size}
                                       </td>
                                       <td className="px-4 py-3 text-slate-600 font-medium">
                                          {sq.color}
                                       </td>
                                       <td className="px-4 py-3 text-slate-600">
                                          {incomingQty}
                                       </td>
                                       <td className="px-4 py-3 w-48">
                                          <input 
                                             type="number"
                                             min="0"
                                             max={incomingQty}
                                             disabled={isBatchReadOnly}
                                             value={currentIroningQty === 0 && !(fData.actualQuantities.find(fq => fq.size === sq.size && fq.color === sq.color)) ? "" : currentIroningQty}
                                             onChange={(e) => {
                                                let val = parseInt(e.target.value, 10);
                                                if (isNaN(val)) val = 0;
                                                if (val > incomingQty) val = incomingQty;
                                                handleVariantQuantityChange(batch.id, sq.size, sq.color, val);
                                             }}
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
                                          {diff === 0 && currentIroningQty > 0 && (
                                            <Check className="w-4 h-4 text-emerald-500 inline" />
                                          )}
                                       </td>
                                    </tr>
                                 );
                           });
                           
                           return (
                             <>
                               {rows}
                               <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                 <td colSpan={2} className="px-4 py-3 text-slate-800 text-left">الإجمالي</td>
                                 <td className="px-4 py-3 text-slate-800">{finishingTotal}</td>
                                 <td className="px-4 py-3 text-indigo-700">{ironingTotal}</td>
                                 <td className="px-4 py-3 text-amber-600">{missingTotal}</td>
                               </tr>
                             </>
                           );
                        })()}
                      </tbody>
                    </table>
                    </div>
                  </div>
                  
                  {fData.status === 'مكتمل' ? (
                    <div className="flex justify-between items-center bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-lg mt-4">
                      <div className="flex items-center gap-2 text-emerald-800 font-medium text-sm">
                        <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                        <div>
                          <span>تم اعتماد مكواة هذا الباتش بنجاح {fData.approvedBy ? `بواسطة ${fData.approvedBy}` : ''} {fData.approvedAt ? `بتاريخ ${new Date(fData.approvedAt).toLocaleDateString('ar-EG')}` : ''}</span>
                          {fData.approvalCode && (
                            <div className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 w-fit mt-1">
                              كود التوثيق النظامي: {fData.approvalCode}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                        معتمد بالسجل
                      </span>
                    </div>
                  ) : (
                    !isBatchReadOnly && (
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => saveIroning(batch.id, false)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm"
                        >
                          <Save className="w-4 h-4" />
                          حفظ مؤقت
                        </button>
                        <button
                          onClick={() => saveIroning(batch.id, true)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold text-sm shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                          اعتماد مكواة الباتش {batch.batchNumber}
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {batches.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 m-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">حالة اعتماد الباتشات:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${allBatchesApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                {approvedBatches} من {totalBatches} باتش معتمد
              </span>
              {!allBatchesApproved && (
                <span className="text-xs text-slate-500">
                  (يجب اعتماد جميع الباتشات أولاً لاعتماد كامل المكواة)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isFullyApproved ? (
                <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg shadow-xs font-bold text-sm">
                  <CheckSquare className="w-5 h-5 stroke-[2.5]" />
                  تم الاعتماد بالكامل
                </div>
              ) : allBatchesApproved ? (
                <button
                  onClick={approveAllIroning}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold shadow-sm text-sm"
                >
                  <CheckSquare className="w-5 h-5 stroke-[2.5]" />
                  اعتماد المكواة بالكامل ({approvedBatches} من {totalBatches})
                </button>
              ) : (
                <button
                  onClick={() => {
                    setToastConfig({
                      message: `لا يمكن اعتماد كامل مرحلة المكواة إلا بعد اعتماد جميع الباتشات أولاً. (تم اعتماد ${approvedBatches} من أصل ${totalBatches} باتش)`,
                      type: "error",
                    });
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-200 text-slate-500 rounded-lg cursor-not-allowed font-bold text-sm opacity-80"
                  title={`لا يمكن اعتماد كامل الأوردر، متبقي ${totalBatches - approvedBatches} باتش لم يتم اعتماده`}
                >
                  <CheckSquare className="w-5 h-5 text-slate-400" />
                  اعتماد المكواة بالكامل ({approvedBatches} من {totalBatches})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      </div>
      
      {/* Hidden Print Container */}
      {printing && order && (
        <div className="hidden print:block print:w-full">
          <IroningWorkOrderPrint order={order} />
        </div>
      )}
    </>
  );
};
