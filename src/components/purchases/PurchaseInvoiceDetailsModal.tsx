import React from 'react';
import { X, Printer, Calendar, Building, Phone, MapPin, FileText, CheckCircle2, Clock, AlertCircle, ShoppingCart } from 'lucide-react';
import { PurchaseInvoice } from '../../types';

interface PurchaseInvoiceDetailsModalProps {
  invoice: PurchaseInvoice;
  onClose: () => void;
  onEdit?: (invoice: PurchaseInvoice) => void;
}

export function PurchaseInvoiceDetailsModal({ invoice, onClose, onEdit }: PurchaseInvoiceDetailsModalProps) {
  const getStatusBadge = (status: PurchaseInvoice['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مدفوع بالكامل</span>
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>مدفوع جزئياً</span>
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>آجل / غير مدفوع</span>
          </span>
        );
    }
  };

  const getPaymentMethodLabel = (method: PurchaseInvoice['paymentMethod']) => {
    switch (method) {
      case 'cash':
        return 'نقدي (خزينة)';
      case 'bank':
        return 'تحويل بنكي';
      case 'credit':
        return 'آجل (ذمم دائنة)';
      case 'cheque':
        return 'شيك مصرفي';
      default:
        return method;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
        {/* Header - Screen only */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">فاتورة شراء: {invoice.invoiceNumber}</h3>
                {getStatusBadge(invoice.paymentStatus)}
              </div>
              <p className="text-xs text-slate-500">تفاصيل مشتريات الأصناف وتوريدات الخامات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة</span>
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(invoice);
                }}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                تعديل الفاتورة
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Viewable Content */}
        <div className="gfos-print-document p-6 md:p-8 space-y-6 overflow-y-auto print:p-0 print:overflow-visible text-right">
          {/* Print Header */}
          <div className="border-b border-slate-200 pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">فاتورة مشتريات خامات</h1>
                <p className="text-xs text-slate-500 mt-1">نسيج ERP - إدارة المشتريات والتوريدات الصناعية</p>
              </div>
              <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-[200px]">
                <div className="text-xs text-slate-500">رقم الفاتورة:</div>
                <div className="text-lg font-black text-indigo-700">{invoice.invoiceNumber}</div>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1 justify-end">
                  <span>{new Date(invoice.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Supplier and Invoice Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">بيانات المورد</span>
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>{invoice.supplierName}</span>
                </div>
                {invoice.supplierPhone && (
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{invoice.supplierPhone}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">طريقة السداد والاستلام</span>
                <div className="font-bold text-slate-800 text-sm">{getPaymentMethodLabel(invoice.paymentMethod)}</div>
                <div className="text-xs text-slate-600 mt-1">
                  حالة الاستلام: {invoice.receiptStatus === 'received' ? 'تم الاستلام بالمخزن' : 'قيد التوريد'}
                </div>
                {invoice.referenceNumber && (
                  <div className="text-xs text-slate-500 mt-0.5">مرجع المورد: {invoice.referenceNumber}</div>
                )}
              </div>

              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">حالة الدفع والمتبقي</span>
                <div className="mt-0.5">{getStatusBadge(invoice.paymentStatus)}</div>
                <div className="text-xs font-semibold text-slate-700 mt-1.5">
                  المسدد: {invoice.paidAmount.toLocaleString('ar-EG')} جنيه
                </div>
                {invoice.remainingAmount > 0 && (
                  <div className="text-xs font-bold text-rose-600">
                    المتبقي: {invoice.remainingAmount.toLocaleString('ar-EG')} جنيه
                  </div>
                )}
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-4 p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold ml-1">ملاحظات:</span>
                {invoice.notes}
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>تفاصيل بنود الفاتورة ({invoice.items.length} صنف)</span>
              </h4>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-3 font-black text-center w-10">#</th>
                    <th className="p-3 font-black">الصنف (التكوين الهيكلي)</th>
                    <th className="p-3 font-black text-center">النوع</th>
                    <th className="p-3 font-black text-center">الوحدة</th>
                    <th className="p-3 font-black text-center">الكمية</th>
                    <th className="p-3 font-black text-center">سعر الوحدة</th>
                    <th className="p-3 font-black text-center">الخصم</th>
                    <th className="p-3 font-black text-left">إجمالي البند</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{item.materialName}</span>
                        {item.notes && <span className="text-[10px] text-slate-500 block mt-0.5">{item.notes}</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.materialType === 'fabric' ? 'قماش' : 'إكسسوار'}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-600">{item.unit}</td>
                      <td className="p-3 text-center font-bold text-slate-900">{item.quantity.toLocaleString('ar-EG')}</td>
                      <td className="p-3 text-center text-slate-700">{item.unitPrice.toLocaleString('ar-EG')} ج.م</td>
                      <td className="p-3 text-center text-slate-500">
                        {item.discount > 0 ? `${item.discount.toLocaleString('ar-EG')} ج.م` : '—'}
                      </td>
                      <td className="p-3 text-left font-black text-slate-900">
                        {item.total.toLocaleString('ar-EG')} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-xs text-slate-500 space-y-1 sm:max-w-xs">
              <p>• جميع الأسعار خاضعة للتسوية والمراجعة المخزنية عند التوريد.</p>
              <p>• يتم إثبات مدفوعات الموردين في سجلات الحسابات وتدفق النقدية.</p>
            </div>

            <div className="w-full sm:w-80 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>إجمالي الأصناف:</span>
                <span className="font-bold text-slate-800">{invoice.subtotal.toLocaleString('ar-EG')} ج.م</span>
              </div>
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>إجمالي الخصم:</span>
                  <span className="font-bold">-{invoice.discountTotal.toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>ضريبة القيمة المضافة ({invoice.taxPercent}%):</span>
                  <span className="font-bold">+{invoice.taxAmount.toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>صافي الفاتورة الكلي:</span>
                <span className="text-indigo-700 text-base">{invoice.grandTotal.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="border-t border-slate-200 pt-2 space-y-1.5">
                <div className="flex justify-between text-slate-700">
                  <span>المسدد:</span>
                  <span className="font-bold text-emerald-700">{invoice.paidAmount.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>المتبقي (الآجل):</span>
                  <span className={`font-bold ${invoice.remainingAmount > 0 ? 'text-rose-600 font-black' : 'text-slate-500'}`}>
                    {invoice.remainingAmount.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Approval System Audit Box */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-right">
                <div className="flex items-center gap-2">
                  <span className="font-black text-emerald-950">فاتورة شراء معتمدة ومسجلة رسمياً بالنظام</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                    {invoice.verificationCode || 'APV-PUR-VERIFIED'}
                  </span>
                </div>
                <div className="text-slate-700">
                  المعتمد: <span className="font-black text-slate-900">{typeof invoice.approvedBy === 'object' ? invoice.approvedBy?.userName : (invoice.approvedBy || 'رئيس الحسابات والتكاليف')}</span>
                  {' '}(<span className="text-slate-600 font-bold">{typeof invoice.approvedBy === 'object' ? invoice.approvedBy?.userRoleLabel : 'إدارة المشتريات والحسابات'}</span>)
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  تاريخ وتوقيت الاعتماد: <span className="font-bold text-slate-800">{invoice.approvalDate || invoice.date}</span> {invoice.approvalTime ? `الساعة ${invoice.approvalTime}` : ''}
                </div>
              </div>
            </div>
            <div className="text-right sm:text-left shrink-0">
              <span className="inline-block px-3 py-1 rounded-lg bg-emerald-100/80 text-emerald-800 text-[11px] font-black border border-emerald-300">
                اعتماد وتدقيق رقمي ✓
              </span>
            </div>
          </div>

          {/* Print Signatures */}
          <div className="hidden print:grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-800 text-center text-xs break-inside-avoid">
            <div className="border border-slate-300 rounded p-2 bg-slate-50">
              <p className="font-bold text-slate-800 mb-6">مسئول المشتريات والتوريدات</p>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
              <p className="text-[9px] text-slate-500">التوقيع والاعتماد</p>
            </div>
            <div className="border border-slate-300 rounded p-2 bg-slate-50">
              <p className="font-bold text-slate-800 mb-6">أمين مخزن الخامات (الاستلام)</p>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
              <p className="text-[9px] text-slate-500">التوقيع ورقم إذن الإضافة</p>
            </div>
            <div className="border border-slate-300 rounded p-2 bg-slate-50">
              <p className="font-bold text-slate-800 mb-6">المراجعة المالية والحسابات</p>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
              <p className="text-[9px] text-slate-500">التوقيع وتاريخ الصرف</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
