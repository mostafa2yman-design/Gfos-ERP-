import React, { useState, useEffect } from "react";
import { ProductionOrder, BatchItem, AccessoryPrepItem } from "../types";
import { getOrderById } from "../lib/storage";
import { getMaterials } from "../lib/accountingStorage";
import { MaterialItem } from "../types";
import * as Cmd from "../lib/productionOrderCommands";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { Printer, Check, CheckSquare, Square } from "lucide-react";
import { calculateBatchAccessories } from "../lib/prepUtils";
import { BatchPreparationWorkOrder } from "./workorders/BatchPreparationWorkOrder";

interface PrintPrepSheetProps {
  key?: React.Key;
  orderId: string;
  onSaved: () => void;
}

export function PrintPrepSheet({ orderId, onSaved }: PrintPrepSheetProps) {
  const [accessories, setAccessories] = React.useState<MaterialItem[]>([]);
  React.useEffect(() => {
    setAccessories(getMaterials().filter(m => m.type === 'accessory' && m.isActive));
  }, []);
  const [order, setOrder] = useState<ProductionOrder | null>(null);

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
  const [printingBatchId, setPrintingBatchId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const found = await getOrderById(orderId);
    if (found) {
      if (
        found.batches &&
        found.batches.length > 0 &&
        found.accessories &&
        found.accessories.length > 0
      ) {
        let needsSave = false;

        const updatedBatches = found.batches.map((batch) => {
          if (!batch.accessoriesPrep || batch.accessoriesPrep.length === 0) {
            needsSave = true;
            return {
              ...batch,
              accessoriesPrep: found.accessories.map((acc) => ({
                accessoryName: acc.name,
                accessoryId: acc.id,
                unit: acc.unit,
                requiredQuantity: 1, // maintained for structural compatibility
                actualPrepared: 0,
                waste: 0,
                isPrepared: false,
                notes: "",
              })),
            };
          }
          return batch;
        });

        if (needsSave && updatedBatches) {
          const result = await Cmd.savePrepData(found, updatedBatches);
          if (result.success && result.data) {
            setOrder(result.data);
          }
        } else {
          setOrder(found);
        }
      } else {
        setOrder(found);
      }
    }
    };
    loadData();
  }, [orderId]);

  if (!order || !order?.batches || order?.batches.length === 0)
    return <div>لا توجد بيانات باتشات.</div>;

  const handlePrint = async (batchId: string) => {
    setPrintingBatchId(batchId);
    setTimeout(() => {
      window.print();
      setPrintingBatchId(null);
    }, 100);
  };

  const handleToggleAccessory = async (batchId: string, accessoryName: string) => {
    const updatedBatches = order?.batches!.map((b) => {
      if (b.id === batchId && b.prepStatus !== "مكتمل") {
        return {
          ...b,
          accessoriesPrep: b.accessoriesPrep.map((a) =>
            a.accessoryName === accessoryName
              ? { ...a, isPrepared: !a.isPrepared }
              : a,
          ),
        };
      }
      return b;
    });

    const result = await Cmd.savePrepData(order, updatedBatches);
    if (result.success && result.data) {
            setOrder(result.data);
          }
  };

  
  const handleUpdateActualAccessory = async (batchId: string, accessoryName: string, actualName: string) => {
    const updatedBatches = order!.batches!.map((b) => {
      if (b.id === batchId && b.prepStatus !== "مكتمل") {
        return {
          ...b,
          accessoriesPrep: b.accessoriesPrep?.map((a) =>
            a.accessoryName === accessoryName
              ? { ...a, actualAccessoryName: actualName }
              : a,
          ) || [],
        };
      }
      return b;
    });
    
    setOrder({ ...order!, batches: updatedBatches });
    
    const result = await Cmd.savePrepData(order!, updatedBatches);
    if (result.success && result.data) {
      setOrder(result.data);
    }
  };

  const handleToggleAllAccessories = async (batchId: string, isPrepared: boolean) => {
    const updatedBatches = order!.batches!.map((b) => {
      if (b.id === batchId && b.prepStatus !== "مكتمل") {
        return {
          ...b,
          accessoriesPrep: b.accessoriesPrep.map((a) => ({
            ...a,
            isPrepared
          })),
        };
      }
      return b;
    });

    const result = await Cmd.savePrepData(order!, updatedBatches);
    if (result.success && result.data) {
            setOrder(result.data);
          }
  };
  const handleApproveBatch = async (batchId: string) => {
    setConfirmConfig({
      isOpen: true,
      message: "هل أنت متأكد من اعتماد التجهيز لهذا الباتش؟ لن تتمكن من تعديل الإكسسوارات بعد الاعتماد.",
      onConfirm: async () => {
        const result = await Cmd.approveBatchPrep(order, batchId);
        if (result.success && result) {
          setConfirmConfig(null);
          if (result.data) setOrder(result.data);
          onSaved();
        } else {
          setConfirmConfig(null);
          setToastConfig({ message: result.error || "حدث خطأ", type: "error" });
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const handleApproveAll = async () => {
    if (!order) return;
    setConfirmConfig({
      isOpen: true,
      message: "هل أنت متأكد من اعتماد مرحلة التجهيز بالكامل لجميع الباتشات؟ لن تتمكن من تعديل تجهيز الإكسسوارات بعد الاعتماد.",
      onConfirm: async () => {
        const result = await Cmd.approveAllPrep(order);
        if (result.success) {
          setConfirmConfig(null);
          if (result.data) setOrder(result.data);
          onSaved();
        } else {
          setConfirmConfig(null);
          setToastConfig({ message: result.error || "حدث خطأ أثناء الاعتماد", type: "error" });
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const totalBatches = order?.batches?.length || 0;
  const approvedBatches = order?.batches?.filter((b) => b.prepStatus === "مكتمل").length || 0;
  const allBatchesApproved = totalBatches > 0 && approvedBatches === totalBatches;
  const isPrepCompleted = order?.status === "التجهيز مكتمل" || allBatchesApproved;

  return (
    <>
      <div className={`space-y-6 p-6 print:hidden ${printingBatchId ? "hidden" : ""}`}>
        <ConfirmDialog
          isOpen={confirmConfig?.isOpen || false}
          message={confirmConfig?.message || ""}
          onConfirm={() => confirmConfig?.onConfirm()}
          onCancel={() => confirmConfig?.onCancel()}
        />
        {toastConfig && (
          <Toast
            message={toastConfig.message}
            type={toastConfig.type}
            onClose={() => setToastConfig(null)}
          />
        )}

        {isPrepCompleted && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-950 text-sm">
                    تم اعتماد مرحلة تجهيز الباتشات والإكسسوارات بالكامل
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                    معتمد بالكامل
                  </span>
                </div>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {order.prepApprovedBy ? `بواسطة: ${order.prepApprovedBy}` : ''}
                  {order.prepApprovedAt ? ` • بتاريخ: ${new Date(order.prepApprovedAt).toLocaleString('ar-EG')}` : ''}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-lg">
              جميع الباتشات مجهزة ومؤهلة لمرحلة الطباعة والتطريز أو الخياطة
            </span>
          </div>
        )}

        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              أوراق التجهيز والطباعة
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              متابعة تجهيز الإكسسوارات لكل باتش تشغيل
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {order?.batches.map((batch) => {
            const allPrepared =
              batch.accessoriesPrep?.every((a) => a.isPrepared) || false;

            return (
              <div
                key={batch.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm break-inside-avoid"
              >
                <div className="border-b border-slate-200 p-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      ورقة تشغيل وتجهيز
                    </h2>
                    <div className="mt-4 grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                      <p>
                        <span className="text-slate-500">رقم الباتش:</span>{" "}
                        <span className="font-bold text-lg">
                          {batch.batchNumber}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-500">أمر الإنتاج:</span>{" "}
                        <span className="font-bold">{order.orderNumber}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">الموديل:</span>{" "}
                        <span className="font-bold">{order.styleName}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">العميل:</span>{" "}
                        <span className="font-bold">{order.customerName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePrint(batch.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة
                    </button>
                    {batch.prepStatus !== "مكتمل" ? (
                      <button
                        onClick={() => handleApproveBatch(batch.id)}
                        disabled={!allPrepared}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                          allPrepared
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        اعتماد التجهيز
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold border border-emerald-200">
                        <Check className="w-5 h-5" />
                        تم الاعتماد
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">
                      تفاصيل المقاسات والألوان
                    </h4>
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="text-slate-500 border-b">
                          <th className="pb-2 font-medium">المقاس</th>
                          <th className="pb-2 font-medium">اللون</th>
                          <th className="pb-2 font-medium">العدد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batch.sizes.map((size) => (
                          <React.Fragment key={size.size}>
                            {size.variants.map((variant, vIdx) => (
                              <tr key={`${size.size}-${variant.color}`}>
                                {vIdx === 0 && (
                                  <td
                                    className="py-2 font-bold text-slate-700"
                                    rowSpan={size.variants.length}
                                  >
                                    {size.size}
                                  </td>
                                )}
                                <td className="py-2 text-slate-600">
                                  {variant.color}
                                </td>
                                <td className="py-2 font-bold">
                                  {variant.quantity}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h4 className="font-bold text-slate-800">
                        تجهيز الإكسسوارات
                      </h4>
                      {batch.prepStatus !== "مكتمل" && batch.accessoriesPrep && batch.accessoriesPrep.length > 0 && (
                        <button
                          onClick={() => {
                            const allChecked = calculateBatchAccessories(order, batch).every(a => a.isPrepared);
                            handleToggleAllAccessories(batch.id, !allChecked);
                          }}
                          className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors border border-indigo-200"
                        >
                          <CheckSquare className="w-4 h-4" />
                          تحديد الكل / تجهيز كامل
                        </button>
                      )}
                    </div>
                    {!batch.accessoriesPrep ||
                    batch.accessoriesPrep.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        لا توجد إكسسوارات مطلوبة.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600">
                              <th className="border border-slate-200 p-2 font-medium">الإكسسوار (المطلوب)</th>
                              <th className="border border-slate-200 p-2 font-medium text-center">الإكسسوار الفعلي (المنصرف)</th>
                              <th className="border border-slate-200 p-2 font-medium text-center">
                                الوحدة
                              </th>
                              <th className="border border-slate-200 p-2 font-medium text-center">
                                المطلوب للقطعة
                              </th>
                              <th className="border border-slate-200 p-2 font-medium text-center">
                                المطلوب للباتش
                              </th>
                              <th className="border border-slate-200 p-2 font-medium text-center">
                                تم التجهيز
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {calculateBatchAccessories(order, batch).map(
                              (acc) => {
                                const roundedRequired =
                                  acc.requiredForBatch % 1 === 0
                                    ? acc.requiredForBatch
                                    : Number(Number(acc.requiredForBatch).toFixed(3));

                                return (
                                  <tr
                                    key={acc.accessoryId || acc.accessoryName}
                                    className={
                                      acc.isPrepared ? "bg-emerald-50" : ""
                                    }
                                  >
                                    <td className="border border-slate-200 p-2 font-medium">
                                      {acc.accessoryName}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-center align-middle w-48">
                                      <select
                                        value={acc.actualAccessoryName || ''}
                                        disabled={batch.prepStatus === "مكتمل"}
                                        onChange={(e) => handleUpdateActualAccessory(batch.id, acc.accessoryName, e.target.value)}
                                        className={`w-full px-2 py-1 border rounded text-xs ${batch.prepStatus === "مكتمل" ? "bg-slate-100" : "bg-white"}`}
                                      >
                                        <option value="">نفس الإكسسوار</option>
                                        {accessories.map(a => (
                                          <option key={a.id} value={a.name}>{a.name}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="border border-slate-200 p-2 text-center text-slate-600">
                                      {acc.unit}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-center text-slate-600">
                                      {acc.standardPerPiece}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-center font-bold text-indigo-700">
                                      {roundedRequired}
                                    </td>
                                    <td className="border border-slate-200 p-2 text-center align-middle">
                                      <button
                                        onClick={() =>
                                          handleToggleAccessory(
                                            batch.id,
                                            acc.accessoryName,
                                          )
                                        }
                                        disabled={batch.prepStatus === "مكتمل"}
                                        className={`inline-flex items-center justify-center p-1 rounded transition-colors ${
                                          acc.isPrepared
                                            ? "text-emerald-600 hover:text-emerald-700"
                                            : "text-slate-400 hover:text-slate-600"
                                        } ${batch.prepStatus === "مكتمل" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                      >
                                        {acc.isPrepared ? (
                                          <CheckSquare className="w-6 h-6" />
                                        ) : (
                                          <Square className="w-6 h-6" />
                                        )}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {batch.prepStatus === "مكتمل" ? (
                  <div className="bg-emerald-50/90 p-4 border-t border-emerald-200 flex justify-between items-center text-sm text-emerald-800">
                    <div className="flex items-center gap-2 font-medium">
                      <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                      <div>
                        <span>
                          تم اعتماد تجهيز هذا الباتش بنجاح
                          {batch.prepApprovedBy ? ` بواسطة: ${batch.prepApprovedBy}` : ''}
                          {batch.prepApprovedAt ? ` بتاريخ: ${new Date(batch.prepApprovedAt).toLocaleString('ar-EG')}` : ''}
                        </span>
                        {batch.prepApprovalCode && (
                          <div className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 w-fit mt-1">
                            كود التوثيق النظامي: {batch.prepApprovalCode}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-300">
                      معتمد بالسجل
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleApproveBatch(batch.id)}
                      disabled={!allPrepared}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-xs ${
                        allPrepared
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      اعتماد تجهيز الباتش {batch.batchNumber}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Overall Approval Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">حالة اعتماد تجهيز الباتشات:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isPrepCompleted 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {approvedBatches} من {totalBatches} باتش معتمد
            </span>
            {!isPrepCompleted && (
              <span className="text-xs text-slate-500">
                (يلزم تجهيز واعتماد جميع الباتشات أولاً لاعتماد كامل مرحلة التجهيز)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isPrepCompleted ? (
              <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg shadow-xs font-bold text-sm">
                <Check className="w-5 h-5 stroke-[2.5]" />
                تم اعتماد مرحلة التجهيز بالكامل
              </div>
            ) : (
              <button
                type="button"
                onClick={handleApproveAll}
                disabled={!allBatchesApproved}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors font-bold shadow-sm text-sm cursor-pointer ${
                  allBatchesApproved
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title={!allBatchesApproved ? `متبقي ${totalBatches - approvedBatches} باتش لم يتم اعتماده` : ''}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                اعتماد مرحلة التجهيز بالكامل ({approvedBatches} من {totalBatches})
              </button>
            )}
          </div>
        </div>
      </div>
      {printingBatchId && order && order.batches && (
        <div className="hidden print:block print:absolute print:inset-0">
          <BatchPreparationWorkOrder
            order={order}
            batch={order.batches.find((b) => b.id === printingBatchId)!}
          />
        </div>
      )}
    </>
  );
}