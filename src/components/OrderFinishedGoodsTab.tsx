import React from "react";
import { ProductionOrder } from "../types";
import { processOrderItem } from "../lib/finishedGoodsUtils";
import {
  PackageCheck,
  Boxes,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  Calendar,
  User,
  Tag,
  FileText,
  AlertCircle,
  Layers,
  Sparkles,
  PackageOpen,
} from "lucide-react";
import { PrintDocument, PrintHeader, PrintSection, PrintSignatures } from "./print/layout";

interface OrderFinishedGoodsTabProps {
  order: ProductionOrder;
  onSaved?: () => void;
  onNavigateToWarehouse?: () => void;
  onNavigateToPacking?: () => void;
}

export const OrderFinishedGoodsTab: React.FC<OrderFinishedGoodsTabProps> = ({
  order,
  onNavigateToWarehouse,
  onNavigateToPacking,
}) => {
  const item = processOrderItem(order);
  const isApproved = item.isApproved;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="p-6 space-y-6 print:hidden">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
              isApproved
                ? "bg-emerald-600 text-white"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                مخزن المنتجات التامة للموديل
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {isApproved
                  ? "معتمد ومرحل إلى المخزن التام"
                  : "بانتظار اعتماد التغليف"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              متابعة وجرد المنتج التام بعد اعتماده في مرحلة التغليف بالتفصيل
              (أعداد وألوان)
            </p>
          </div>
        </div>

        {/* Shortcut Button to Main Finished Goods Warehouse */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {onNavigateToWarehouse && (
            <button
              type="button"
              onClick={onNavigateToWarehouse}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
              title="الانتقال إلى شاشة مخزن المنتجات التامة العامة"
            >
              <Boxes className="w-4 h-4" />
              <span>الانتقال لمخزن المنتج التام</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="طباعة تقرير المخزن التام"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      </div>

      {/* If Not Approved: Alert & Redirect CTA */}
      {!isApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">
                لم يتم اعتماد التغليف لهذا الأمر حتى الآن
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                المنتج ينتقل تلقائياً إلى شاشة المخزن التام وخريطة التشغيل
                بمجرد اعتماد مرحلة التغليف. يمكنك الانتقال الآن لمرحلة التغليف
                والضغط على "اعتماد التغليف" لترحيل الكميات التامة.
              </p>
            </div>
          </div>
          {onNavigateToPacking && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onNavigateToPacking}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <PackageOpen className="w-4 h-4" />
                <span>الانتقال إلى مرحلة التغليف لاعتماد المنتج</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>إجمالي الكمية التامة:</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {item.totalPieces}{" "}
            <span className="text-xs font-normal text-slate-500">قطعة</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Tag className="w-4 h-4 text-indigo-600" />
            <span>اسم الموديل / القصة:</span>
          </div>
          <div className="text-sm font-black text-slate-900 truncate">
            {order.styleName || "غير محدد"}
          </div>
          {order.category && (
            <span className="text-[10px] text-slate-500 font-medium">
              التصنيف: {order.category}
            </span>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <User className="w-4 h-4 text-blue-600" />
            <span>العميل:</span>
          </div>
          <div className="text-sm font-black text-slate-900 truncate">
            {order.customerName || "غير محدد"}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            أمر: {order.orderNumber}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>تاريخ الاعتماد:</span>
          </div>
          <div className="text-xs font-bold text-slate-800">
            {item.receivedDate ? item.receivedDate.split("T")[0] : "—"}
          </div>
          <span className="text-[10px] text-slate-500 font-medium truncate block">
            بواسطة: {item.approvedBy}
          </span>
        </div>
      </div>

      {/* تفاصيل المنتج: أعداد وألوان (Numbers & Colors Section) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-4">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800">
              تفاصيل المنتج: توزيع الأعداد والألوان
            </h3>
          </div>
          <span className="text-xs font-bold bg-white text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            {item.colors.length} ألوان • {item.sizes.length} مقاسات
          </span>
        </div>

        {/* Color Summary Badges / Progress */}
        <div className="px-4">
          <div className="text-xs font-bold text-slate-600 mb-2">
            حصر وتوزيع الألوان بالمخزن التام:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {item.colorBreakdown.map((cb) => (
              <div
                key={cb.color}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="truncate">{cb.color}</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                    {cb.percentage}%
                  </span>
                </div>
                <div className="mt-2 text-base font-black text-slate-900">
                  {cb.totalQuantity}{" "}
                  <span className="text-[10px] font-normal text-slate-500">
                    قطعة
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sizes × Colors Matrix Table */}
        <div className="p-4 pt-1">
          <div className="text-xs font-bold text-slate-600 mb-2">
            مصفوفة تفصيل المقاسات مقابل الألوان (Pieces Breakdown):
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2.5 border-l border-slate-200 w-32">
                    اللون
                  </th>
                  {item.sizes.map((s) => (
                    <th
                      key={s}
                      className="p-2.5 text-center border-l border-slate-200 font-black min-w-[70px]"
                    >
                      {s}
                    </th>
                  ))}
                  <th className="p-2.5 text-center bg-slate-200/80 font-black w-24 text-slate-900">
                    إجمالي اللون
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {item.colors.map((color) => {
                  const rowTotal = Object.values(item.matrix[color] || {}).reduce(
                    (sum, q) => sum + q,
                    0
                  );
                  return (
                    <tr
                      key={color}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="p-2.5 font-bold text-slate-800 border-l border-slate-200 bg-slate-50/40">
                        {color}
                      </td>
                      {item.sizes.map((s) => {
                        const q = item.matrix[color]?.[s] || 0;
                        return (
                          <td
                            key={s}
                            className={`p-2.5 text-center border-l border-slate-100 font-bold ${
                              q > 0
                                ? "text-slate-900 bg-white font-black"
                                : "text-slate-300"
                            }`}
                          >
                            {q > 0 ? q : "—"}
                          </td>
                        );
                      })}
                      <td className="p-2.5 text-center font-black bg-emerald-50/50 text-emerald-900">
                        {rowTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
                  <td className="p-2.5 border-l border-slate-200">
                    إجمالي المقاس
                  </td>
                  {item.sizes.map((s) => (
                    <td
                      key={s}
                      className="p-2.5 text-center border-l border-slate-200 font-black"
                    >
                      {item.sizeTotals[s] || 0}
                    </td>
                  ))}
                  <td className="p-2.5 text-center bg-emerald-600 text-white font-black text-sm">
                    {item.totalPieces}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Packing Invoices & Deliveries (if present) */}
      {item.invoices && item.invoices.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-3 p-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-sm text-slate-800">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>أذون التسليم وفواتير التغليف الصادرة للمنتج</span>
          </div>

          <div className="space-y-2">
            {item.invoices.map((inv, idx) => {
              const invTotal = (inv.variants || []).reduce(
                (sum, v) => sum + (Number(v.quantity) || 0),
                0
              );
              return (
                <div
                  key={inv.id || idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">
                        إذن تسليم: {inv.id}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        العميل: {inv.customerName || order.customerName} • التاريخ:{" "}
                        {inv.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">
                      الكمية المسلمة:
                    </span>
                    <span className="px-2.5 py-1 bg-white border border-blue-200 text-blue-800 font-black rounded-md">
                      {invTotal} قطعة
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* A4 Print Layout */}
    <div className="hidden print:block print:w-full" dir="rtl">
      <PrintDocument>
        <PrintHeader
          orderNumber={order.orderNumber}
          title="بيان تسليم واستلام المنتجات التامة"
          subtitle={`الموديل: ${order.styleName || '—'}`}
          documentType="إذن مخزن منتج تام"
          classification="مخزن المنتجات التامة"
          metaItems={[
            { label: 'العميل', value: order.customerName || 'غير محدد' },
            { label: 'حالة الاستلام', value: isApproved ? 'معتمد بالمخزن' : 'قيد التغليف' },
            { label: 'إجمالي القطع التامة', value: `${item.totalPieces.toLocaleString('ar-EG')} قطعة`, highlight: true },
            { label: 'تاريخ الاعتماد', value: order.packingApprovedAt ? new Date(order.packingApprovedAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG') },
          ]}
        />

        <PrintSection title="جدول تفاصيل المنتجات التامة بالمقاسات والألوان">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="border border-slate-300 p-2 text-right">اللون</th>
                {item.sizes.map((s) => (
                  <th key={s} className="border border-slate-300 p-2 text-center">
                    {s}
                  </th>
                ))}
                <th className="border border-slate-300 p-2 text-center font-black">إجمالي اللون</th>
              </tr>
            </thead>
            <tbody>
              {item.colors.length === 0 ? (
                <tr>
                  <td colSpan={item.sizes.length + 2} className="border border-slate-300 p-3 text-center text-slate-500">
                    لا توجد بيانات تفصيلية
                  </td>
                </tr>
              ) : (
                item.colors.map((color) => {
                  const colorTotal = item.colorBreakdown.find((c) => c.color === color)?.totalQuantity || 0;
                  return (
                    <tr key={color} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-2 font-bold text-slate-800">{color}</td>
                      {item.sizes.map((s) => (
                        <td key={s} className="border border-slate-300 p-2 text-center">
                          {item.matrix[color]?.[s] || 0}
                        </td>
                      ))}
                      <td className="border border-slate-300 p-2 text-center font-bold text-slate-900 bg-slate-50">
                        {colorTotal}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold">
                <td className="border border-slate-300 p-2 text-right font-black">إجمالي المقاس:</td>
                {item.sizes.map((s) => (
                  <td key={s} className="border border-slate-300 p-2 text-center font-black">
                    {item.sizeTotals[s] || 0}
                  </td>
                ))}
                <td className="border border-slate-300 p-2 text-center font-black text-slate-900 bg-slate-200">
                  {item.totalPieces} قطعة
                </td>
              </tr>
            </tfoot>
          </table>
        </PrintSection>

        {item.invoices && item.invoices.length > 0 && (
          <PrintSection title="بيانات أذون التسليم وفواتير التغليف المعتمدة">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-300 p-2 text-center w-12">#</th>
                  <th className="border border-slate-300 p-2 text-right">رقم إذن التسليم</th>
                  <th className="border border-slate-300 p-2 text-right">الجهة المستلمة</th>
                  <th className="border border-slate-300 p-2 text-center">تاريخ الإذن</th>
                  <th className="border border-slate-300 p-2 text-center">الكمية المسلمة</th>
                </tr>
              </thead>
              <tbody>
                {item.invoices.map((inv, idx) => {
                  const invTotal = (inv.variants || []).reduce(
                    (sum, v) => sum + (Number(v.quantity) || 0),
                    0
                  );
                  return (
                    <tr key={inv.id || idx}>
                      <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-mono font-bold">{inv.id}</td>
                      <td className="border border-slate-300 p-2">{inv.customerName || order.customerName}</td>
                      <td className="border border-slate-300 p-2 text-center">{inv.date}</td>
                      <td className="border border-slate-300 p-2 text-center font-black">{invTotal} قطعة</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </PrintSection>
        )}

        <PrintSignatures
          signatures={[
            { role: 'مسئول التغليف والفرز', name: 'التسليم' },
            { role: 'أمين مخزن المنتجات التامة', name: 'الاستلام المخزني' },
            { role: 'العميل / مندوب الاستلام', name: 'التوقيع بالاستلام' },
          ]}
        />
      </PrintDocument>
    </div>
  </>
  );
};
