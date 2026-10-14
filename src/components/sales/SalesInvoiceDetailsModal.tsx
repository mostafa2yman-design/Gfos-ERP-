import React, { useRef, useState } from 'react';
import { SalesInvoice } from '../../types/sales';
import {
  X,
  Printer,
  Calendar,
  Building,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
  BookOpen,
  DollarSign,
  Tag,
  RotateCcw,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';

interface SalesInvoiceDetailsModalProps {
  invoice: SalesInvoice;
  onClose: () => void;
  onEdit?: (invoice: SalesInvoice) => void;
  onOpenReturn?: (invoice: SalesInvoice) => void;
  onNavigateToJournal?: () => void;
  onNavigateToOrder?: (orderId: string) => void;
}

export function SalesInvoiceDetailsModal({
  invoice,
  onClose,
  onEdit,
  onOpenReturn,
  onNavigateToJournal,
  onNavigateToOrder
}: SalesInvoiceDetailsModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState<boolean>(invoice.showDetails !== false);

  const handlePrint = () => {
    window.print();
  };

  const getPaymentStatusBadge = (status: SalesInvoice['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>مدفوع بالكامل</span>
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>سداد جزئي (متبقي رصيد)</span>
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>آجل غير مسدد</span>
          </span>
        );
    }
  };

  const getDeliveryStatusBadge = (status: SalesInvoice['deliveryStatus']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>تم التسليم وخروج من المخزن التام</span>
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>جاهز للتسليم بالمخزن</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>قيد التجهيز والتعبئة</span>
          </span>
        );
    }
  };

  const getPaymentMethodLabel = (method: SalesInvoice['paymentMethod']) => {
    switch (method) {
      case 'cash':
        return 'نقداً (خزينة المصنع)';
      case 'bank':
        return 'تحويل بنكي / شيك إيداع';
      case 'credit':
        return 'آجل (حساب العميل)';
      case 'cheque':
        return 'شيك بنكي مؤجل';
      default:
        return method;
    }
  };

  const totalPieces = invoice.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black">{invoice.invoiceNumber}</h3>
                {getPaymentStatusBadge(invoice.paymentStatus)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                فاتورة بيع ملابس جاهزة وتوريد منتجات تامة للعميل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReturn && (
              <button
                onClick={() => {
                  onOpenReturn(invoice);
                  onClose();
                }}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إصدار مرتجع مبيعات</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة</span>
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(invoice);
                  onClose();
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                تعديل الفاتورة
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={printableRef} className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Factory Brand & Invoice Meta */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
            <div>
              <span className="text-xs font-black tracking-wider text-blue-600 uppercase">
                مصنع الأمل للملابس الجاهزة والتصنيع
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">فاتورة مبيعات وتسليم عميل</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                سجل تجاري: 104523 · بطاقة ضريبية: 334-889-012 · المنطقة الصناعية
              </p>
            </div>

            <div className="text-left sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[220px]">
              <div className="text-xs text-slate-500">رقم الفاتورة:</div>
              <div className="text-lg font-black text-blue-900">{invoice.invoiceNumber}</div>
              <div className="text-xs text-slate-500 mt-2">تاريخ الإصدار:</div>
              <div className="text-xs font-black text-slate-800">{invoice.date}</div>
              {invoice.relatedOrderNumber && (
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">أمر الإنتاج:</span>
                  <span className="font-black text-indigo-700">{invoice.relatedOrderNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer & Payment Info Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
              <span className="text-[11px] font-black text-blue-800 block">بيانات العميل / المشتري:</span>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-sm font-black text-slate-900">{invoice.customerName}</span>
              </div>
              {invoice.customerPhone && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{invoice.customerPhone}</span>
                </div>
              )}
              {invoice.customerAddress && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{invoice.customerAddress}</span>
                </div>
              )}
              {invoice.customerTaxId && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>رقم ضريبي: {invoice.customerTaxId}</span>
                </div>
              )}
            </div>

            {/* Payment & Logistics Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-black text-slate-700 block">شروط السداد وحالة الشحن:</span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span className="font-bold text-slate-900">{getPaymentMethodLabel(invoice.paymentMethod)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">حالة السداد:</span>
                <div>{getPaymentStatusBadge(invoice.paymentStatus)}</div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">حالة الشحن والتسليم:</span>
                <div>{getDeliveryStatusBadge(invoice.deliveryStatus)}</div>
              </div>
              {invoice.dueDate && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-500">تاريخ الاستحقاق:</span>
                  <span className="font-bold text-rose-700">{invoice.dueDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Approval System Audit Box */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-right">
                <div className="flex items-center gap-2">
                  <span className="font-black text-emerald-950">فاتورة معتمدة ومسجلة رسمياً بالنظام</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                    {invoice.verificationCode || 'APV-VERIFIED'}
                  </span>
                </div>
                <div className="text-slate-700">
                  المعتمد: <span className="font-black text-slate-900">{typeof invoice.approvedBy === 'object' ? invoice.approvedBy?.userName : (invoice.approvedBy || invoice.salesperson || 'مدير عام النظام')}</span>
                  {' '}(<span className="text-slate-600 font-bold">{typeof invoice.approvedBy === 'object' ? invoice.approvedBy?.userRoleLabel : 'إدارة المبيعات'}</span>)
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  تاريخ وتوقيت الاعتماد: <span className="font-bold text-slate-800">{invoice.approvalDate || invoice.date}</span> {invoice.approvalTime ? `الساعة ${invoice.approvalTime}` : ''}
                </div>
              </div>
            </div>
            <div className="text-right sm:text-left shrink-0">
              <span className="inline-block px-3 py-1 rounded-lg bg-emerald-100/80 text-emerald-800 text-[11px] font-black border border-emerald-300">
                توثيق واعتماد رقمي ✓
              </span>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="text-xs font-black text-slate-800">بنود الملابس والمنتجات التامة:</h4>
                <span className="text-[11px] text-slate-500">
                  إجمالي: {invoice.items.length} صنف · {totalPieces.toLocaleString('ar-EG')} قطعة
                </span>
              </div>

              {/* Show / Hide Details Toggle */}
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer no-print shadow-2xs ${
                  showDetails
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
                title="التبديل بين إظهار تفاصيل أعداد وألوان الموديل أو إخفاء التفاصيل لإظهار الإجمالي فقط"
              >
                {showDetails ? <Eye className="w-3.5 h-3.5 text-blue-100" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                <span>{showDetails ? 'إظهار تفاصيل الموديل (أعداد وألوان)' : 'إخفاء التفاصيل (الإجمالي فقط للصنف)'}</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3 text-center">كود الباركود</th>
                    <th className="py-2.5 px-3">اسم الموديل / المنتج</th>
                    {showDetails && <th className="py-2.5 px-3">المقاس</th>}
                    {showDetails && <th className="py-2.5 px-3">اللون</th>}
                    <th className="py-2.5 px-3 text-center">
                      {showDetails ? 'الكمية' : 'إجمالي الكمية للصنف'}
                    </th>
                    <th className="py-2.5 px-3 text-center">الوحدة</th>
                    <th className="py-2.5 px-3 text-center">سعر الوحدة</th>
                    <th className="py-2.5 px-3 text-center">الخصم</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => {
                    const hasVariants = Boolean(item.variants && item.variants.length > 0);

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 text-center">
                          {item.barcode ? (
                            <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded" dir="ltr">
                              {item.barcode}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-black text-slate-900">{item.styleName}</div>
                          {item.category && (
                            <span className="text-[10px] text-slate-500 font-medium">{item.category}</span>
                          )}
                          {item.notes && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{item.notes}</div>
                          )}

                          {/* Show variants breakdown badges when showDetails is true */}
                          {showDetails && hasVariants && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5 text-indigo-600" />
                                <span>تفاصيل المقاسات والألوان:</span>
                              </span>
                              {item.variants!.map((v, vIdx) => (
                                <span
                                  key={vIdx}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-800 border border-slate-200 flex items-center gap-1"
                                >
                                  <span className="text-indigo-800">{v.size}</span>
                                  <span className="text-slate-400">/</span>
                                  <span className="text-slate-700">{v.color}:</span>
                                  <strong className="text-blue-700">{v.quantity} ق</strong>
                                  {v.barcode && (
                                    <span className="text-[9px] font-mono text-slate-400">({v.barcode})</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {showDetails && (
                          <td className="py-3 px-3 font-black text-indigo-700">{item.size || '-'}</td>
                        )}
                        {showDetails && (
                          <td className="py-3 px-3 text-slate-700 font-medium">{item.color || '-'}</td>
                        )}

                        <td className="py-3 px-3 text-center font-black text-slate-900">
                          {Number(item.quantity).toLocaleString('ar-EG')}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500 font-medium">{item.unit || 'قطعة'}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {Number(item.unitPrice).toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3 px-3 text-center text-rose-600 font-medium">
                          {item.discount > 0 ? `${Number(item.discount).toLocaleString('ar-EG')} ج.م` : '-'}
                        </td>
                        <td className="py-3 px-3 text-left font-black text-slate-900">
                          {Number(item.total).toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary & Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Notes & Salesperson */}
            <div className="space-y-4">
              {invoice.notes && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-black text-slate-700 block mb-1">ملاحظات الفاتورة:</span>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}

              {invoice.salesperson && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>مسؤول البيع والتسليم: <strong>{invoice.salesperson}</strong></span>
                </div>
              )}

              {/* Signatures for Print */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-700 mb-8">توقيع المستلم / العميل:</p>
                  <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto" />
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-8">إدارة المبيعات والمخزن:</p>
                  <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto" />
                </div>
              </div>
            </div>

            {/* Totals Calculation Box */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>إجمالي البنود (قبل الخصم):</span>
                <span>{Number(invoice.subtotal).toLocaleString('ar-EG')} ج.م</span>
              </div>

              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-xs font-bold text-rose-600">
                  <span>إجمالي الخصم التجاري:</span>
                  <span>- {Number(invoice.discountTotal).toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}

              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>ضريبة القيمة المضافة ({invoice.taxPercent}%):</span>
                  <span>+ {Number(invoice.taxAmount).toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}

              {invoice.shippingCost > 0 && (
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>مصاريف الشحن والنقل:</span>
                  <span>+ {Number(invoice.shippingCost).toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-300 flex justify-between text-base font-black text-slate-900">
                <span>الصافي الإجمالي النهائي:</span>
                <span className="text-blue-700">{Number(invoice.grandTotal).toLocaleString('ar-EG')} ج.م</span>
              </div>

              <div className="flex justify-between text-xs font-bold text-emerald-700 pt-1">
                <span>المبلغ المسدد / المحصل:</span>
                <span>{Number(invoice.paidAmount).toLocaleString('ar-EG')} ج.م</span>
              </div>

              <div className="flex justify-between text-xs font-bold text-rose-700">
                <span>المتبقي الآجل على العميل:</span>
                <span>{Number(invoice.remainingAmount).toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
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
                <span>عرض القيد الآلي بدفتر اليومية</span>
              </button>
            )}

            {onOpenReturn && (
              <button
                type="button"
                onClick={() => {
                  onOpenReturn(invoice);
                  onClose();
                }}
                className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-4 h-4 text-orange-600" />
                <span>تسجيل مرتجع لهذه الفاتورة</span>
              </button>
            )}

            {invoice.relatedOrderId && onNavigateToOrder && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToOrder(invoice.relatedOrderId!);
                  onClose();
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح أمر الإنتاج المرتبط</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}

export default SalesInvoiceDetailsModal;
