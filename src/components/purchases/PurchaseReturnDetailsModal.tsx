import React, { useRef } from 'react';
import { PurchaseReturn, PurchaseReturnReason } from '../../types/purchases';
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

interface PurchaseReturnDetailsModalProps {
  purchaseReturn: PurchaseReturn;
  onClose: () => void;
  onNavigateToJournal?: () => void;
}

const REASON_LABELS: Record<PurchaseReturnReason, string> = {
  defective: 'عيوب غزل أو صباغة أو نسيج (تالف)',
  wrong_spec: 'مواصفات أو وزن خامة غير مطابق',
  wrong_color: 'لون أو درجة صبغة مختلفة عن العينة',
  surplus: 'فائض عن حاجة خطوط الإنتاج والتشغيل',
  delayed: 'تأخر في موعد التوريد المتفق عليه',
  damaged: 'تلفيات وكسور أثناء النقل والتفريغ',
  other: 'سبب آخر'
};

export function PurchaseReturnDetailsModal({
  purchaseReturn,
  onClose,
  onNavigateToJournal
}: PurchaseReturnDetailsModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const totalQuantity = purchaseReturn.items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0),
    0
  );

  const getRefundMethodLabel = () => {
    switch (purchaseReturn.refundMethod) {
      case 'credit_deduction':
        return 'خصم ومقاصة من رصيد المورد الآجل';
      case 'cash':
        return 'رد واسترداد نقدي بخزينة المصنع';
      case 'bank':
        return 'تحويل بنكي مسترد لحساب المصنع';
      default:
        return purchaseReturn.refundMethod;
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
                <h3 className="text-lg font-black">{purchaseReturn.returnNumber}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
                  إذن مردودات مشتريات خامات معتمد
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {purchaseReturn.originalInvoiceNumber ? (
                  <>مرتجع لفاتورة الشراء رقم: <strong className="text-white">{purchaseReturn.originalInvoiceNumber}</strong></>
                ) : (
                  <strong className="text-amber-300">مرتجع مشتريات خامات مباشر (بدون فاتورة شراء سابقة)</strong>
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
          {/* Print Letterhead (Only visible in print or clean on screen) */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-black text-slate-900">مصنع الملابس الجاهزة المتكامل</h1>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  إدارة المشتريات والمخازن العامة | نظام نسيج ERP
                </p>
              </div>
              <div className="text-left font-mono">
                <div className="text-sm font-black text-indigo-900">{purchaseReturn.returnNumber}</div>
                <div className="text-xs text-slate-500">{purchaseReturn.date}</div>
              </div>
            </div>
            <div className="text-center mt-3">
              <span className="inline-block px-5 py-1 rounded-full bg-slate-900 text-white text-sm font-black tracking-wider">
                إذن مردودات وارتجاع خامات ومستلزمات إنتاج لمورد
              </span>
            </div>
          </div>

          {/* Supplier and Voucher Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-bold block mb-1">المورد:</span>
              <p className="font-black text-slate-900 flex items-center gap-1.5 text-sm">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>{purchaseReturn.supplierName}</span>
              </p>
              {purchaseReturn.supplierPhone && (
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{purchaseReturn.supplierPhone}</p>
              )}
            </div>

            <div>
              <span className="text-slate-400 font-bold block mb-1">فاتورة الشراء الأصلية:</span>
              <p className="font-bold text-indigo-700 font-mono text-sm">
                {purchaseReturn.originalInvoiceNumber || 'بدون فاتورة (مباشر)'}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-bold block mb-1">تاريخ إذن الارتجاع:</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{purchaseReturn.date}</span>
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-bold block mb-1">طريقة التسوية المالية:</span>
              <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-indigo-100 text-indigo-800 border border-indigo-200">
                {getRefundMethodLabel()}
              </span>
            </div>
          </div>

          {/* Returned Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-indigo-600" />
              <span>بيان الخامات والمستلزمات المرتجعة للمورد:</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">اسم الخامة / المستلزم</th>
                    <th className="p-3 w-20 text-center">الوحدة</th>
                    <th className="p-3 w-28 text-center">الكمية المرتجعة</th>
                    <th className="p-3 w-28 text-left">سعر الشراء</th>
                    <th className="p-3 w-32 text-left">إجمالي القيمة</th>
                    <th className="p-3 min-w-[150px]">سبب الإرجاع</th>
                    <th className="p-3 min-w-[140px]">ملاحظات الفحص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseReturn.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">
                        <div>{item.materialName}</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {item.materialType === 'fabric' ? 'أقمشة وغزول' : 'إكسسوار ومستلزمات خياطة'}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-600 font-medium">{item.unit}</td>
                      <td className="p-3 text-center font-bold font-mono text-indigo-700 text-sm">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-700">
                        {Number(item.unitPrice).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td className="p-3 text-left font-mono font-black text-slate-900 text-sm">
                        {Number(item.total).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {REASON_LABELS[item.reason] || item.reason}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals and Status Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status & Inventory Note */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">
                  حالة المخزون: {purchaseReturn.stockReturned ? 'تم خصم وتعديل رصيد المخزن' : 'لم يتم الخصم'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                المسؤول القائم بالصرف المخزني: <strong className="text-slate-700">{purchaseReturn.issuedByWarehouseUser || 'أمين مخزن الخامات'}</strong>
              </p>
              {purchaseReturn.returnReasonGeneral && (
                <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  <strong>السبب العام للارتجاع:</strong> {purchaseReturn.returnReasonGeneral}
                </p>
              )}
              {purchaseReturn.notes && (
                <p className="text-[11px] text-slate-500 italic">
                  <strong>ملاحظات:</strong> {purchaseReturn.notes}
                </p>
              )}
            </div>

            {/* Financial Card */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>إجمالي الخامات المرتجعة:</span>
                <span className="font-mono font-bold text-slate-900">
                  {Number(purchaseReturn.subtotal).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                </span>
              </div>

              {purchaseReturn.taxAmount > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>ضريبة القيمة المضافة ({purchaseReturn.taxPercent}%):</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +{Number(purchaseReturn.taxAmount).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-indigo-200 flex justify-between items-center text-indigo-950">
                <span className="font-black text-sm">صافي قيمة المرتجع المستحق:</span>
                <span className="text-lg font-black font-mono text-indigo-700">
                  {Number(purchaseReturn.grandTotal).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                </span>
              </div>

              <div className="text-[11px] text-indigo-600 font-bold pt-1">
                طريقة السداد / المقاصة: {getRefundMethodLabel()}
              </div>
            </div>
          </div>

          {/* Official Signatures Section (Always visible in print) */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-4 gap-4 text-center text-xs text-slate-600 font-bold">
            <div>
              <p>أمين مخزن الخامات (المسلم)</p>
              <p className="mt-8 font-mono text-slate-400">.............................</p>
            </div>
            <div>
              <p>مسؤول المشتريات والتوريدات</p>
              <p className="mt-8 font-mono text-slate-400">.............................</p>
            </div>
            <div>
              <p>الحسابات العامة والمدير المالي</p>
              <p className="mt-8 font-mono text-slate-400">.............................</p>
            </div>
            <div>
              <p>مندوب / ممثل المورد (المستلم)</p>
              <p className="mt-8 font-mono text-slate-400">.............................</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            {onNavigateToJournal && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToJournal();
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>عرض القيد المحاسبي لمرتجع المشتريات</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
