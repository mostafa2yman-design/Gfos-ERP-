import React from "react";
import { ProductionOrder } from "../types";
import { processOrderItem } from "../lib/finishedGoodsUtils";
import {
  X,
  PackageCheck,
  Boxes,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers,
  FileText,
  User,
  Tag,
  CheckCircle2,
  Barcode
} from "lucide-react";

interface WarehouseProductDetailsModalProps {
  order: ProductionOrder | null;
  batchNumber?: string;
  onClose: () => void;
  onNavigateToWarehouse: () => void;
  onNavigateToOrder?: (orderId: string, tab?: string) => void;
}

export const WarehouseProductDetailsModal: React.FC<WarehouseProductDetailsModalProps> = ({
  order,
  batchNumber,
  onClose,
  onNavigateToWarehouse,
  onNavigateToOrder,
}) => {
  if (!order) return null;

  const item = processOrderItem(order);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-white/15 rounded-xl border border-white/20 shadow-inner mt-0.5">
              <PackageCheck className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                  معتمد بالمخزن التام
                </span>
                {(item.primaryBarcode || order.barcode) && (
                  <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-indigo-950/50 text-indigo-200 border border-indigo-300/40 backdrop-blur-xs flex items-center gap-1 shadow-xs" title="كود الباركود التسلسلي المعتمد">
                    <Barcode className="w-3.5 h-3.5" />
                    <span>{item.primaryBarcode || order.barcode}</span>
                  </span>
                )}
                {batchNumber && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-100 border border-emerald-400/30">
                    باتش {batchNumber}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black mt-1">
                تفاصيل المنتج التام: {order.orderNumber}
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5 flex items-center gap-2 flex-wrap font-medium">
                <span>اسم القصة: {order.styleName || "غير محدد"}</span>
                {order.customerName && (
                  <>
                    <span>•</span>
                    <span>العميل: {order.customerName}</span>
                  </>
                )}
                {order.category && (
                  <>
                    <span>•</span>
                    <span>التصنيف: {order.category}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin text-slate-800">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold text-emerald-800 block mb-0.5">
                إجمالي القطع المعتمدة
              </span>
              <span className="text-2xl font-black text-emerald-950">
                {item.totalPieces}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">قطعة جاهزة</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold text-slate-600 block mb-0.5">
                عدد الألوان
              </span>
              <span className="text-2xl font-black text-slate-800">
                {item.colors.length}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">ألوان منفذة</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold text-slate-600 block mb-0.5">
                عدد المقاسات
              </span>
              <span className="text-2xl font-black text-slate-800">
                {item.sizes.length}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">مقاسات مطابقة</span>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold text-blue-800 block mb-0.5">
                تاريخ الاعتماد
              </span>
              <span className="text-xs font-bold text-blue-950 block mt-1">
                {item.receivedDate ? new Date(item.receivedDate).toLocaleDateString("ar-EG") : "معتمد"}
              </span>
              <span className="text-[10px] text-blue-700 block mt-0.5">
                بواسطة: {item.approvedBy}
              </span>
            </div>
          </div>

          {/* Color Breakdown Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>توزيع الألوان والكميات والنسب المئوية</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {item.colorBreakdown.map((c) => (
                <div 
                  key={c.color}
                  className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-300 transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-slate-900">{c.color}</span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {c.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1.5">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>الكمية المعتمدة:</span>
                    <span className="font-bold text-slate-800">{c.totalQuantity} قطعة</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Size vs Color Matrix Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>جدول مصفوفة تفصيل الأعداد لكل لون ومقاس</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                (الأعداد بالأرقام الفعلية المعتمدة)
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-2.5 px-3 text-right">اللون</th>
                      {item.sizes.map((s) => (
                        <th key={s} className="py-2.5 px-3 min-w-[65px] border-r border-slate-200">
                          {s}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 min-w-[75px] bg-emerald-100/60 text-emerald-950 font-black border-r border-slate-200">
                        إجمالي اللون
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {item.colors.map((color) => {
                      const colorTotal = Object.values(item.matrix[color] || {}).reduce((sum, q) => sum + q, 0);
                      return (
                        <tr key={color} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {color}
                          </td>
                          {item.sizes.map((size) => {
                            const qty = item.matrix[color]?.[size] || 0;
                            return (
                              <td 
                                key={size} 
                                className={`py-2 px-3 border-r border-slate-100 font-medium ${qty > 0 ? "text-slate-900 font-bold" : "text-slate-300"}`}
                              >
                                {qty > 0 ? qty : "-"}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 border-r border-slate-100 bg-emerald-50/40 font-black text-emerald-900">
                            {colorTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
                      <td className="py-2.5 px-3 text-right font-extrabold">
                        إجمالي المقاس
                      </td>
                      {item.sizes.map((size) => (
                        <td key={size} className="py-2.5 px-3 border-r border-slate-200 text-slate-900 font-black">
                          {item.sizeTotals[size] || 0}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 border-r border-slate-200 bg-emerald-600 text-white text-sm font-black">
                        {item.totalPieces}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Barcodes Section: Sequential Barcodes attached to order variants */}
          {item.barcodes && item.barcodes.length > 0 && (
            <div className="bg-indigo-50/40 rounded-xl border border-indigo-100 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-800 text-xs">
                    أكواد الباركود التسلسلية المعتمدة (مرافقة للأمر بالمخزن وفواتير البيع):
                  </h4>
                </div>
                <span className="text-[11px] font-mono font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-full">
                  {item.barcodes.length} كود تسلسلي
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {item.colors.map(color => {
                  return item.sizes.map(size => {
                    const qty = item.matrix[color]?.[size] || 0;
                    const code = item.barcodeMap[`${size}_${color}`] || item.primaryBarcode;
                    if (!code && qty === 0) return null;
                    return (
                      <div
                        key={`${color}-${size}`}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center justify-between text-xs"
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
                          <span className="font-mono font-black text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded text-[11px]">
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

          {/* Packing Invoices list if any */}
          {item.invoices && item.invoices.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>إذونات وفواتير تسليم التغليف ({item.invoices.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.invoices.map((inv) => {
                  const invTotal = (inv.variants || []).reduce((s, v) => s + (Number(v.quantity) || 0), 0);
                  return (
                    <div key={inv.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">إذن استلام: {inv.id}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {inv.date ? new Date(inv.date).toLocaleDateString("ar-EG") : "تاريخ غير محدد"} • {inv.customerName || "غير محدد"}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[11px]">
                        {invTotal} قطعة
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Required Shortcut Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Shortcut Button to Finished Goods Warehouse */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToWarehouse();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Boxes className="w-4 h-4" />
              <span>الانتقال إلى مخزن المنتج التام</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            {onNavigateToOrder && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToOrder(order.id, "warehouse");
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>عرض أمر الإنتاج</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer text-center"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
