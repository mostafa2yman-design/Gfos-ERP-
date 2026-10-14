import React, { useState, useEffect, useRef } from "react";
import {
  ProductionOrder,
  CutOrderData,
  CutSizeData,
  CutVariant,
} from "../types";
import { getOrderById } from "../lib/storage";
import { getLabor, getMaterials } from "../lib/accountingStorage";
import { LaborProfile, MaterialItem } from "../types";
import { CutWorkOrderPrint } from "./print/CutWorkOrderPrint";
import * as Cmd from "../lib/productionOrderCommands";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { Check, Save, Printer, Scissors } from "lucide-react";
import { calculateFabricAnalysis } from "../lib/fabricUtils";
import { FabricSummary } from "./FabricSummary";

interface CutOrderFormProps {
  key?: React.Key;
  orderId: string;
  onSaved: () => void;
}

export function CutOrderForm({ orderId, onSaved }: CutOrderFormProps) {
  const [laborList, setLaborList] = React.useState<LaborProfile[]>([]);
  const [fabrics, setFabrics] = React.useState<MaterialItem[]>([]);
  React.useEffect(() => {
    setLaborList(getLabor().filter(l => l.isActive));
    setFabrics(getMaterials().filter(m => m.type === 'fabric' && m.isActive));
  }, []);
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [toastConfig, setToastConfig] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [cutData, setCutData] = useState<CutOrderData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const found = await getOrderById(orderId);
    if (found) {
      setOrder(found);
      if (found.cutData) {
        setCutData(found.cutData);
      } else {
        // Initialize cut data from production sizes
        setCutData({
          sizes: found.sizes.map((s) => ({
            size: s.size,
            variants: s.variants.map((v) => ({
              color: v.color,
              plannedQuantity: v.quantity,
              actualQuantity: v.quantity, // default to planned
            })),
          })),
        });
          }
      }
    };
    loadData();
  }, [orderId]);

  if (!order || !cutData) return <div>جاري التحميل...</div>;

  const isReadOnly = order.status === "مسودة" || ["القص معتمد", "تقسيم الباتشات", "الباتشات مثبتة", "التجهيز جاري", "التجهيز مكتمل", "الطباعة والتطريز جاري", "الطباعة والتطريز مكتمل", "الخياطة مكتملة", "مغلق"].includes(order.status);

  const handleActualCostChange = (value: number | undefined) => {
    if (isReadOnly) return;
    setCutData((prev) => prev ? { ...prev, actualCostPerPiece: value } : prev);
  };

  const handleWeightChange = async (color: string, value: number) => {
    if (isReadOnly) return;
    setCutData((prev) => {
      if (!prev) return prev;

      const newByColor = {
        ...(prev.actualWeightByColor || {}),
        [color]: value,
      };

      const totalActualWeight = Object.values(newByColor).reduce(
        (acc: number, curr: number) => acc + (curr || 0),
        0,
      );

      return {
        ...prev,
        actualWeightByColor: newByColor,
        actualWeight: totalActualWeight,
      };
    });
  };
  const handleVariantChange = (
    sizeIndex: number,
    variantIndex: number,
    value: number,
  ) => {
    if (isReadOnly) return;
    const newSizes = [...cutData.sizes];
    newSizes[sizeIndex] = {
      ...newSizes[sizeIndex],
      variants: [...newSizes[sizeIndex].variants],
    };
    newSizes[sizeIndex].variants[variantIndex] = {
      ...newSizes[sizeIndex].variants[variantIndex],
      actualQuantity: value,
    };
    setCutData({ ...cutData, sizes: newSizes });
  };

  const handleSaveDraft = async () => {
    if (isReadOnly) return;
    const result = await Cmd.saveCutData(order, cutData);
    if (result.success) {
      onSaved();
    } else {
      setError(result.error || "حدث خطأ");
    }
  };

  const handleApproveCut = async () => {
    if (!order) return;
    if (isReadOnly) return;
    setConfirmConfig({
      isOpen: true,
      message:
        "هل أنت متأكد من اعتماد أمر القص؟ لن تتمكن من تعديل كميات القص أو البيانات الأساسية بعد الاعتماد.",
      onConfirm: async () => {
        const result = await Cmd.approveCutOrder(order, cutData);
        if (result.success) {
          setConfirmConfig(null);
          onSaved();
        } else {
          setConfirmConfig(null);
          setError(result.error || "حدث خطأ");
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const fabricSummary = calculateFabricAnalysis(order, cutData);
  const colors = Array.from(
    new Set(cutData.sizes.flatMap((s) => s.variants.map((v) => v.color))),
  );
  let totalPlanned = 0;
  let totalActual = 0;

  cutData.sizes.forEach((s) => {
    s.variants.forEach((v) => {
      totalPlanned += v.plannedQuantity;
      totalActual += v.actualQuantity || 0;
    });
  });

  return (
    <>
      <div className={`space-y-6 print:hidden ${isPrinting ? "hidden" : ""}`}>
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => confirmConfig?.onCancel()}
      />
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}

      {isReadOnly && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-sm">
                  تم اعتماد أمر القص الفعلي بنجاح
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                  معتمد
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                {cutData.approvedBy ? `بواسطة: ${cutData.approvedBy}` : (order.cutApprovedBy ? `بواسطة: ${order.cutApprovedBy}` : '')}
                {(cutData.approvedAt || order.cutApprovedAt) && ` • بتاريخ: ${new Date(cutData.approvedAt || order.cutApprovedAt!).toLocaleString('ar-EG')}`}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-lg">
            الكميات الفعلية بعد القص مثبتة وجاهزة للمراحل التالية
          </span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#150d24] p-5 rounded-2xl border border-slate-200 dark:border-purple-950/70 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#2C1151] border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                أمر القص والتشغيل الفعلي
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                مقارنة الكميات المخططة بالكميات الفعلية بعد القص ومتابعة مسحوبات الأقمشة
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {isReadOnly ? (
            <div className="flex items-center gap-2">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3.5 py-2 rounded-xl font-bold border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>تم اعتماد القص الفعلي</span>
              </div>
              <button
                type="button"
                onClick={() => handlePrint()}
                className="flex items-center gap-1.5 bg-white dark:bg-[#1f1338] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-purple-900/40 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#2c1b4d] transition-colors shadow-2xs font-bold text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>طباعة أمر القص</span>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handlePrint()}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1f1338] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-purple-900/40 px-3.5 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-[#2c1b4d] transition-colors shadow-2xs font-bold text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>طباعة أمر القص</span>
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 bg-white dark:bg-[#1f1338] text-[#2C1151] dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 px-4 py-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors shadow-2xs font-bold text-xs cursor-pointer"
              >
                <Save className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>حفظ كمسودة</span>
              </button>
              <button
                type="button"
                onClick={handleApproveCut}
                className="flex items-center gap-1.5 bg-[#2C1151] hover:bg-[#3d1870] dark:bg-[#5a249c] dark:hover:bg-[#6c2bb8] text-white px-5 py-2 rounded-xl transition-all shadow-2xs font-bold text-xs cursor-pointer"
              >
                <Check className="w-4 h-4 text-amber-400" />
                <span>اعتماد القص الفعلي</span>
              </button>
            </>
          )}
        </div>
      </div>

      {order.cuttingInstructions && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50">
          <h4 className="font-bold text-amber-900 dark:text-amber-300 text-xs mb-1 flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>تعليمات وتشغيل صالة القص</span>
          </h4>
          <p className="text-amber-800 dark:text-amber-200/90 text-xs whitespace-pre-wrap">{order.cuttingInstructions}</p>
        </div>
      )}

      {/* Fabric & Labor Info Strip */}
      <div className="bg-white dark:bg-[#150d24] p-4 rounded-xl shadow-2xs border border-slate-200 dark:border-purple-950/70 flex flex-col md:flex-row gap-4">
        {/* نوع خامة القماش المطلوبة */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            نوع خامة القماش المطلوبة بالأمر
          </label>
          <div className="w-full px-3 py-2 bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-lg text-[#2C1151] dark:text-purple-200 font-bold text-xs flex items-center justify-between min-h-[38px]">
            <span>
              {order.materials && order.materials.length > 0 
                ? order.materials[0].name 
                : (fabricSummary?.primaryFabric?.name || 'غير محددة في أمر الإنتاج')}
            </span>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-700/60">
              المطلوب معيارياً
            </span>
          </div>
        </div>

        {/* اختيار الخامة الفعلية المستخدمة */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            الخامة الفعلية المستخدمة في القص
          </label>
          <select
            value={cutData.actualFabricName || ''}
            disabled={isReadOnly}
            onChange={(e) => setCutData(prev => prev ? { ...prev, actualFabricName: e.target.value } : prev)}
            className={`w-full px-3 py-2 border rounded-lg appearance-none font-bold text-xs ${
              isReadOnly 
                ? 'bg-slate-100 dark:bg-[#1a0f30] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-purple-900/40' 
                : 'bg-white dark:bg-[#1f1338] border-slate-300 dark:border-purple-900/60 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#2C1151]'
            }`}
          >
            <option value="">اختر الخامة الفعلية المستخدمة...</option>
            {fabrics.map(f => (
              <option key={f.id} value={f.name}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* عامل القص */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            مسؤول / عامل القص
          </label>
          <select
            value={cutData.cutterName || ''}
            disabled={isReadOnly}
            onChange={(e) => setCutData(prev => prev ? { ...prev, cutterName: e.target.value } : prev)}
            className={`w-full px-3 py-2 border rounded-lg appearance-none text-xs font-bold ${
              isReadOnly 
                ? 'bg-slate-100 dark:bg-[#1a0f30] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-purple-900/40' 
                : 'bg-white dark:bg-[#1f1338] border-slate-300 dark:border-purple-900/60 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#2C1151]'
            }`}
          >
            <option value="">اختر عامل القص...</option>
            {Array.from(new Set(laborList.map(l => l.role || 'غير محدد'))).map(role => (
              <optgroup key={role} label={role}>
                {laborList.filter(l => (l.role || 'غير محدد') === role).map(l => (
                  <option key={l.id} value={l.name}>{l.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#150d24] p-4 rounded-xl border border-slate-200 dark:border-purple-950/70 shadow-2xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي المطلوب المخطط</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">{totalPlanned}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">قطعة مستهدفة من أمر التشغيل</p>
        </div>
        <div className="bg-white dark:bg-[#150d24] p-4 rounded-xl border border-slate-200 dark:border-purple-950/70 shadow-2xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي المقصوص الفعلي</p>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono tabular-nums">{totalActual}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">قطعة تم قصها وجاهزة للتجهيز</p>
        </div>
        <div className="bg-white dark:bg-[#150d24] p-4 rounded-xl border border-slate-200 dark:border-purple-950/70 shadow-2xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">نسبة الفارق / الهالك</p>
          <p
            className={`text-2xl font-black font-mono tabular-nums ${
              totalActual < totalPlanned ? "text-rose-600 dark:text-rose-400" : totalActual > totalPlanned ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"
            }`}
          >
            {totalPlanned > 0
              ? (((totalActual - totalPlanned) / totalPlanned) * 100).toFixed(1)
              : 0}
            %
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {totalActual < totalPlanned ? 'نقص عن المستهدف' : totalActual > totalPlanned ? 'زيادة وفر بالقص' : 'متطابق تماماً'}
          </p>
        </div>
      </div>

      {/* Actual Cut Quantities Table */}
      <div className="bg-white dark:bg-[#150d24] rounded-xl shadow-2xs border border-slate-200 dark:border-purple-950/70 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-purple-950/70 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            تفاصيل الكميات المقصوصة حسب المقاس واللون
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            {cutData.sizes.length} مقاسات
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#1f1338]/60 border-b border-slate-200 dark:border-purple-950/60">
                <th className="px-5 py-3 font-bold text-slate-700 dark:text-slate-300">
                  المقاس
                </th>
                <th className="px-5 py-3 font-bold text-slate-700 dark:text-slate-300">
                  اللون
                </th>
                <th className="px-5 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">
                  المخطط
                </th>
                <th className="px-5 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">
                  القص الفعلي
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-purple-950/40">
              {cutData.sizes.map((size, sIdx) => (
                <React.Fragment key={size.size}>
                  {size.variants.map((variant, vIdx) => (
                    <tr
                      key={`${size.size}-${variant.color}`}
                      className="hover:bg-slate-50/50 dark:hover:bg-purple-950/20 transition-colors"
                    >
                      {vIdx === 0 && (
                        <td
                          className="px-5 py-3 font-bold text-slate-900 dark:text-white border-l border-slate-100 dark:border-purple-950/40"
                          rowSpan={size.variants.length}
                        >
                          {size.size}
                        </td>
                      )}
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-[#1f1338] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-purple-900/40">
                          {variant.color}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 bg-slate-100 dark:bg-[#1f1338] text-slate-700 dark:text-slate-300 rounded font-mono font-bold min-w-[3rem] tabular-nums">
                          {variant.plannedQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center w-48">
                        <input
                          type="number"
                          min="0"
                          value={variant.actualQuantity || ""}
                          onChange={(e) =>
                            handleVariantChange(
                              sIdx,
                              vIdx,
                              (() => { const v = parseInt(e.target.value, 10); return isNaN(v) ? 0 : v; })(),
                            )
                          }
                          disabled={isReadOnly}
                          className={`w-full px-3 py-1.5 border rounded-lg text-xs text-center font-mono font-bold tabular-nums ${
                            isReadOnly
                              ? "bg-slate-50 dark:bg-[#1a0f30] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-purple-900/40"
                              : "bg-white dark:bg-[#1f1338] border-purple-200 dark:border-purple-800/60 focus:ring-1 focus:ring-[#2C1151] text-[#2C1151] dark:text-amber-300"
                          }`}
                        />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-[#150d24] rounded-xl shadow-2xs border border-slate-200 dark:border-purple-950/70 overflow-hidden p-5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
            مسحوبات الأقمشة من المخزن لكل لون (كجم)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colors.map((color: string) => {
              const reqFabric = fabricSummary?.colors?.find((c: any) => c.color === color)?.requiredFabric;
              return (
                <div key={color} className="bg-slate-50 dark:bg-[#1a0f30] p-3.5 rounded-xl border border-slate-200 dark:border-purple-950/60">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5 text-center border-b border-slate-200 dark:border-purple-900/40 pb-1.5">
                    {color}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">المطلوب المعياري</span>
                      <div className="px-2.5 py-1.5 bg-white dark:bg-[#150d24] border border-slate-200 dark:border-purple-900/40 rounded-lg text-xs text-center font-mono font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                        {reqFabric ? reqFabric.toFixed(3) : '—'}
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">المسحوب الفعلي</span>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={cutData.actualWeightByColor?.[color] || ""}
                        onChange={(e) =>
                          (() => { const v = parseFloat(e.target.value); handleWeightChange(color, isNaN(v) ? 0 : v); })()
                        }
                        disabled={isReadOnly}
                        className={`w-full px-2.5 py-1.5 border rounded-lg text-xs text-center font-mono tabular-nums ${
                          isReadOnly 
                            ? "bg-slate-100 dark:bg-[#150d24] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-purple-900/40" 
                            : "bg-white dark:bg-[#1f1338] border-purple-200 dark:border-purple-800/60 focus:ring-1 focus:ring-[#2C1151] font-bold text-[#2C1151] dark:text-amber-300"
                        }`}
                        placeholder="الفعلي"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actual Cut Cost */}
        <div className="bg-white dark:bg-[#150d24] rounded-xl shadow-2xs border border-slate-200 dark:border-purple-950/70 overflow-hidden">
          <div className="bg-slate-50 dark:bg-[#1a0f30] px-5 py-3 border-b border-slate-200 dark:border-purple-950/60">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">التكلفة الفعلية للقص</h3>
          </div>
          <div className="p-5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              سعر القص الفعلي للقطعة (جنيه)
            </label>
            <div className="relative w-64">
              <input
                type="number"
                min="0"
                step="0.01"
                value={cutData.actualCostPerPiece ?? ""}
                disabled={isReadOnly}
                onChange={(e) => { const v = parseFloat(e.target.value); handleActualCostChange(isNaN(v) ? undefined : v); }}
                placeholder="0.00"
                className={`w-full pl-12 pr-4 py-2 border rounded-xl text-base font-mono font-bold tabular-nums ${
                  isReadOnly 
                    ? 'bg-slate-100 dark:bg-[#1a0f30] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-purple-900/40 cursor-not-allowed' 
                    : 'bg-white dark:bg-[#1f1338] border-purple-200 dark:border-purple-800/60 focus:ring-1 focus:ring-[#2C1151] text-[#2C1151] dark:text-amber-300'
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                جنيه
              </span>
            </div>
          </div>
        </div>

        {fabricSummary && <FabricSummary summary={fabricSummary} />}

        {/* Bottom Approval & Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-50 dark:bg-[#150d24] border border-slate-200 dark:border-purple-950/70 rounded-xl shadow-2xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">حالة مرحلة القص:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              order.status === 'مسودة'
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
                : isReadOnly 
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60' 
                  : 'bg-purple-100 dark:bg-purple-950/50 text-[#2C1151] dark:text-purple-300 border border-purple-300 dark:border-purple-800/60'
            }`}>
              {order.status === 'مسودة' 
                ? 'بانتظار اعتماد أمر الإنتاج أولاً' 
                : isReadOnly 
                  ? 'أمر القص معتمد' 
                  : 'مسودة قيد التعديل'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              (إجمالي الفعلي: {totalActual} قطعة من أصل {totalPlanned} قطعة مخططة)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {order.status === 'مسودة' ? (
              <div className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3.5 py-2 rounded-xl">
                يلزم اعتماد أمر الإنتاج وقائمة الخامات أولاً لبدء إدخال كميات القص الفعلي
              </div>
            ) : isReadOnly ? (
              <div className="flex items-center gap-2 px-5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 rounded-xl font-bold text-xs">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <span>تم اعتماد أمر القص بالكامل</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#1f1338] text-[#2C1151] dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>حفظ كمسودة</span>
                </button>
                <button
                  type="button"
                  onClick={handleApproveCut}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#2C1151] hover:bg-[#3d1870] dark:bg-[#5a249c] dark:hover:bg-[#6c2bb8] text-white rounded-xl transition-all font-bold shadow-2xs text-xs cursor-pointer"
                >
                  <Check className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                  <span>اعتماد القص الفعلي</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
      {isPrinting && (
        <div className="hidden print:block print:absolute print:inset-0">
          <CutWorkOrderPrint order={order} fabricSummary={fabricSummary} />
        </div>
      )}
    </>
  );
}
