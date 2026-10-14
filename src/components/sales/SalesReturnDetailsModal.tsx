import React, { useRef } from 'react';
import { SalesReturn, SalesReturnReason } from '../../types/sales';
import {
  X,
  Printer,
  Calendar,
  Building,
  RotateCcw,
  Boxes,
  CheckCircle2,
  DollarSign,
  User,
  BookOpen,
  FileText,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface SalesReturnDetailsModalProps {
  salesReturn: SalesReturn;
  onClose: () => void;
  onNavigateToJournal?: () => void;
}

const REASON_LABELS: Record<SalesReturnReason, string> = {
  defective: 'عيوب صناعة أو قماش (تالف)',
  wrong_size: 'مقاس غير مطابق للطلب',
  wrong_color: 'لون مختلف عن المتفق عليه',
  surplus: 'فائض عن حاجة العميل / لم يتم بيعه',
  delayed: 'تأخر في موعد التسليم',
  other: 'سبب آخر'
};

export function SalesReturnDetailsModal({
  salesReturn,
  onClose,
  onNavigateToJournal
}: SalesReturnDetailsModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const totalPieces = salesReturn.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  const getRefundMethodLabel = () => {
    switch (salesReturn.refundMethod) {
      case 'credit_deduction':
        return 'خصم ومقاصة من رصيد العميل الآجل';
      case 'cash':
        return 'رد نقدي من خزينة المصنع';
      case 'bank':
        return 'تحويل بنكي لحساب العميل';
      default:
        return salesReturn.refundMethod;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black">{salesReturn.returnNumber}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
                  إذن مردودات مبيعات معتمد
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {salesReturn.originalInvoiceNumber ? (
                  <>مرتجع لفاتورة المبيعات رقم: <strong className="text-white">{salesReturn.originalInvoiceNumber}</strong></>
                ) : (
                  <strong className="text-amber-300">مرتجع مبيعات حر مباشر (بدون فاتورة سابقة)</strong>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة إذن المرتجع</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Return Sheet */}
        <div ref={printableRef} className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
            <div>
              <span className="text-xs font-black tracking-wider text-orange-600 uppercase">
                مصنع الأمل للملابس الجاهزة والتصنيع
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">إذن استلام مردودات مبيعات</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إدارة المخازن والمبيعات · مستند إثبات ارتجاع وتسوية مالية
              </p>
            </div>

            <div className="text-left sm:text-right bg-orange-50/60 p-4 rounded-xl border border-orange-200 min-w-[220px]">
              <div className="text-xs text-slate-500">رقم إذن المرتجع:</div>
              <div className="text-lg font-black text-orange-900">{salesReturn.returnNumber}</div>
              <div className="text-xs text-slate-500 mt-2">تاريخ الارتجاع:</div>
              <div className="text-xs font-black text-slate-800">{salesReturn.date}</div>
              <div className="mt-2 pt-2 border-t border-orange-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">الفاتورة الأصلية:</span>
                <span className="font-black text-blue-900">{salesReturn.originalInvoiceNumber || 'بدون فاتورة (مباشر)'}</span>
              </div>
            </div>
          </div>

          {/* Details Banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-black text-slate-700 block">بيانات العميل:</span>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="text-sm font-black text-slate-900">{salesReturn.customerName}</span>
              </div>
              {salesReturn.customerPhone && (
                <div className="text-xs text-slate-500">الهاتف: {salesReturn.customerPhone}</div>
              )}
              {salesReturn.customerAddress && (
                <div className="text-xs text-slate-500">العنوان: {salesReturn.customerAddress}</div>
              )}
            </div>

            <div className="p-4 bg-orange-50/40 rounded-xl border border-orange-200 space-y-2">
              <span className="text-[11px] font-black text-orange-900 block">حالة التسوية والمخزن:</span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">طريقة رد القيمة:</span>
                <span className="font-bold text-slate-900">{getRefundMethodLabel()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">تحديث رصيد المخزن:</span>
                <span className="font-black text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تمت إعادة القطع السليمة لرصيد المنتجات التامة
                </span>
              </div>
              {salesReturn.receivedByWarehouseUser && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-orange-200">
                  <span className="text-slate-500">مستلم المخزن:</span>
                  <span className="font-bold text-slate-800">{salesReturn.receivedByWarehouseUser}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-slate-800">الأصناف المرتجعة المستلمة بالمخزن:</h4>
              <span className="text-xs font-bold text-slate-500">
                إجمالي: {salesReturn.items.length} صنف · {totalPieces.toLocaleString('ar-EG')} قطعة
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">اسم الموديل / الصنف</th>
                    <th className="py-2.5 px-3">المقاس</th>
                    <th className="py-2.5 px-3">اللون</th>
                    <th className="py-2.5 px-3 text-center">الكمية المرتجعة</th>
                    <th className="py-2.5 px-3 text-center">سعر الوحدة</th>
                    <th className="py-2.5 px-3">سبب الإرجاع</th>
                    <th className="py-2.5 px-3">حالة البضاعة</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesReturn.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-black text-slate-900">{item.styleName}</td>
                      <td className="py-3 px-3 font-black text-indigo-700">{item.size}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{item.color}</td>
                      <td className="py-3 px-3 text-center font-black text-orange-950">
                        {Number(item.quantity).toLocaleString('ar-EG')} {item.unit || 'قطعة'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {Number(item.unitPrice).toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {REASON_LABELS[item.reason] || item.reason}
                      </td>
                      <td className="py-3 px-3">
                        {item.condition === 'good' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            سليمة بالمخزن
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            معيبة تحتاج فحص
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-left font-black text-slate-900 whitespace-nowrap">
                        {Number(item.total).toLocaleString('ar-EG')} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              {salesReturn.notes && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-black text-slate-700 block mb-1">ملاحظات الإذن:</span>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{salesReturn.notes}</p>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-700 mb-8">مندوب / عميل الإرجاع:</p>
                  <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto" />
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-8">أمين مخزن المنتجات التامة:</p>
                  <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto" />
                </div>
              </div>
            </div>

            {/* Totals Box */}
            <div className="p-5 bg-orange-50/60 rounded-2xl border border-orange-200 space-y-2.5">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>إجمالي قيمة الأصناف المرتجعة:</span>
                <span>{Number(salesReturn.subtotal).toLocaleString('ar-EG')} ج.م</span>
              </div>

              {salesReturn.taxAmount > 0 && (
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>تسوية ضريبة القيمة المضافة ({salesReturn.taxPercent}%):</span>
                  <span>+{Number(salesReturn.taxAmount).toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}

              <div className="pt-2 border-t border-orange-300 flex justify-between text-base font-black text-slate-900">
                <span>إجمالي المبلغ المسترد:</span>
                <span className="text-orange-700 text-lg">
                  {Number(salesReturn.grandTotal).toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              <div className="pt-2 border-t border-orange-200 flex justify-between text-xs font-bold text-slate-700">
                <span>المبلغ المسدد / المحول:</span>
                <span>{Number(salesReturn.refundedAmount).toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between no-print">
          {onNavigateToJournal && (
            <button
              type="button"
              onClick={() => {
                onNavigateToJournal();
                onClose();
              }}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>عرض قيد اليومية الآلي للمرتجع</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer mr-auto"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}

export default SalesReturnDetailsModal;
