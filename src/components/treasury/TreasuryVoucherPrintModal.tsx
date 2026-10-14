import React, { useRef } from 'react';
import { TreasuryTransaction } from '../../types/treasury';
import { tafqeetArabic } from '../../lib/tafqeet';
import { getFactorySettings } from '../../lib/storage';
import {
  X,
  Printer,
  FileText,
  DollarSign,
  Calendar,
  Building,
  User,
  CheckCircle2,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Layers
} from 'lucide-react';

interface TreasuryVoucherPrintModalProps {
  transaction: TreasuryTransaction;
  onClose: () => void;
  onNavigateToJournal?: () => void;
}

export function TreasuryVoucherPrintModal({
  transaction,
  onClose,
  onNavigateToJournal
}: TreasuryVoucherPrintModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);
  const factorySettings = getFactorySettings();

  const handlePrint = () => {
    window.print();
  };

  const isReceipt = transaction.type === 'customer_collection' || transaction.type === 'other_revenue';
  const voucherTitle = isReceipt ? 'سند قبض نقدية وشيكات' : 'سند صرف نقدية وشيكات';
  const voucherSubTitle = isReceipt ? 'Receipt Voucher (CRV)' : 'Payment Voucher (CPV)';
  const amountWords = tafqeetArabic(transaction.amount);

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'cash':
        return 'نقداً من الخزينة';
      case 'bank':
        return 'تحويل / شيك بنكي';
      case 'cheque':
        return 'شيك تجاري / كمبيالة';
      default:
        return 'نقداً';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto no-print-backdrop">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isReceipt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isReceipt ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <span>{voucherTitle}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {transaction.voucherNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                معاينة السند الرسمي للطباعة والأرشفة المحاسبية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToJournal && (
              <button
                type="button"
                onClick={onNavigateToJournal}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="عرض القيد المحاسبي في دفتر القيود"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">القيد المحاسبي</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50/50" dir="rtl" ref={printableRef}>
          {/* Formal Voucher Card */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 sm:p-8 shadow-xs relative">
            {/* Stamp watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none text-slate-900 font-black text-8xl rotate-[-25deg]">
              {isReceipt ? 'مقبوض' : 'مدفوع'}
            </div>

            {/* Header: Company & Serial */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-200 gap-4">
              <div className="flex items-center gap-3">
                {factorySettings?.logoUrl ? (
                  <img
                    src={factorySettings.logoUrl}
                    alt="Logo"
                    className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-1"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    نسيج
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {factorySettings?.name || 'مصنع الملابس المتكامل (نسيج ERP)'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {factorySettings?.address || 'المنطقة الصناعية الكبرى - مصانع الملابس الجاهزة'}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    هاتف: {factorySettings?.phones || '01000000000'} · بطاقة ضريبية: 334-889-012
                  </p>
                </div>
              </div>

              {/* Voucher Badge Box */}
              <div className="text-left sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-300 min-w-[200px]">
                <div className="text-[11px] font-bold text-slate-500">رقم السند المالي:</div>
                <div className="text-lg font-black text-blue-900 font-mono">{transaction.voucherNumber}</div>
                <div className="text-[11px] font-bold text-slate-500 mt-1">تاريخ المعاملة:</div>
                <div className="text-xs font-black text-slate-800 font-mono">
                  {transaction.date} {transaction.time ? `· ${transaction.time}` : ''}
                </div>
              </div>
            </div>

            {/* Title Banner */}
            <div className="text-center py-4 my-2">
              <span className={`inline-block px-6 py-2 rounded-xl text-base font-black border ${
                isReceipt
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}>
                {voucherTitle} ({voucherSubTitle})
              </span>
            </div>

            {/* Amount Box */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 sm:p-5 my-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 block">المبلغ بالحروف والتفقيط:</span>
                <span className="text-sm font-black text-slate-900 block leading-relaxed">
                  {amountWords}
                </span>
              </div>
              <div className="bg-white px-5 py-3 rounded-xl border border-slate-300 text-center shrink-0 w-full sm:w-auto shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block mb-0.5">المبلغ رقماً:</span>
                <span className="text-2xl font-black text-blue-900 font-mono">
                  {transaction.amount.toLocaleString('ar-EG')} <span className="text-sm font-bold">ج.م</span>
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-600 block">
                  {isReceipt ? 'وصلنا من السيد / الجهة:' : 'اصرفوا إلى السيد / الجهة:'}
                </span>
                <div className="text-sm font-black text-slate-900">
                  {transaction.partyName || transaction.beneficiary || 'عميل / مورد نقدي'}
                </div>
                {transaction.beneficiary && transaction.partyName && (
                  <div className="text-[11px] text-slate-600">
                    المفوض بالاستلام/التسليم: <span className="font-bold">{transaction.beneficiary}</span>
                  </div>
                )}
                {transaction.relatedInvoiceNumber && (
                  <div className="text-[11px] text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 inline-block font-bold">
                    مرتبط بالفاتورة رقم: {transaction.relatedInvoiceNumber}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-600 block">طريقة وقناة الدفع والصندوق:</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">حساب الصندوق / البنك:</span>
                  <span className="font-bold text-slate-900">{transaction.fundAccountName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">طريقة التحصيل / السداد:</span>
                  <span className="font-bold text-indigo-700">{getChannelLabel(transaction.paymentChannel)}</span>
                </div>
                {transaction.referenceNumber && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">رقم الشيك / الإيصال المرجعي:</span>
                    <span className="font-mono font-bold text-slate-900">{transaction.referenceNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Statement & Description */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 my-4 text-xs space-y-1">
              <span className="font-black text-slate-700 block">وذلك نظير (بيان السند المالي):</span>
              <p className="text-slate-800 text-sm font-bold leading-relaxed whitespace-pre-wrap">
                {transaction.description || 'تسوية حسابات جارية بالخزينة'}
              </p>
              {transaction.notes && (
                <p className="text-slate-500 text-[11px] mt-2 pt-2 border-t border-slate-200 italic">
                  ملاحظات: {transaction.notes}
                </p>
              )}
            </div>

            {/* Accounting Distribution Table */}
            <div className="my-6">
              <div className="text-xs font-black text-slate-800 mb-2">التوجيه المحاسبي المزدوج (قيد السند):</div>
              <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-100 font-black text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">رقم الحساب</th>
                      <th className="py-2.5 px-3">اسم الحساب في شجرة الحسابات</th>
                      <th className="py-2.5 px-3 text-center">مدين (ج.م)</th>
                      <th className="py-2.5 px-3 text-center">دائن (ج.م)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {isReceipt ? (
                      <>
                        <tr className="bg-white">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{transaction.fundAccountCode}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{transaction.fundAccountName}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-700">
                            {transaction.amount.toLocaleString('ar-EG')}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">0.00</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{transaction.targetAccountCode}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {transaction.targetAccountName} {transaction.partyName ? `(${transaction.partyName})` : ''}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">0.00</td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-blue-700">
                            {transaction.amount.toLocaleString('ar-EG')}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr className="bg-white">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{transaction.targetAccountCode}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {transaction.targetAccountName} {transaction.partyName ? `(${transaction.partyName})` : ''}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-blue-700">
                            {transaction.amount.toLocaleString('ar-EG')}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">0.00</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{transaction.fundAccountCode}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{transaction.fundAccountName}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">0.00</td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-rose-700">
                            {transaction.amount.toLocaleString('ar-EG')}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Electronic Approval Badge & Verification Stamp */}
            <div className="my-6 p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-0.5 text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-900">حركة معتمدة رسمياً وموثقة رقمياً</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold font-mono">
                      {transaction.verificationCode || 'APV-VERIFIED'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700">
                    تم الاعتماد والمراجعة بواسطة: <span className="font-black text-slate-900">{transaction.approvedBy?.userName || transaction.createdBy?.userName || 'مدير عام النظام'}</span>
                    {' '}(<span className="text-slate-600 font-bold">{transaction.approvedBy?.userRoleLabel || 'الإدارة المالية'}</span>)
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    تاريخ وتوقيت الاعتماد: <span className="font-bold text-slate-800">{transaction.approvalDate || transaction.date}</span> الساعة <span className="font-bold text-slate-800">{transaction.approvalTime || transaction.time || '12:00:00'}</span>
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-left shrink-0">
                <div className="inline-block border-2 border-emerald-600 rounded-xl px-4 py-2 text-emerald-800 font-black text-xs uppercase tracking-wider bg-emerald-50">
                  ختم الاعتماد المالي
                </div>
              </div>
            </div>

            {/* Signatures Footer */}
            <div className="grid grid-cols-3 gap-6 pt-6 mt-4 border-t-2 border-slate-200 text-center text-xs">
              <div className="space-y-4">
                <span className="font-black text-slate-700 block">
                  {isReceipt ? 'المُسلِّم / المودع' : 'المُستلِم'}
                </span>
                <div className="text-xs font-bold text-slate-800">
                  {transaction.partyName || transaction.beneficiary || '........................'}
                </div>
                <div className="text-[10px] text-slate-400">التوقيع بالاستلام / التسليم</div>
              </div>

              <div className="space-y-4">
                <span className="font-black text-slate-700 block">أمين الخزينة والصندوق</span>
                <div className="text-xs text-slate-900 font-black">
                  {transaction.createdBy?.userName || 'أمين الخزينة'}
                </div>
                <div className="text-[10px] text-slate-400">التوقيع / العهدة</div>
              </div>

              <div className="space-y-4">
                <span className="font-black text-slate-700 block">اعتماد الإدارة والمدير المالي</span>
                <div className="text-xs text-emerald-900 font-black">
                  {transaction.approvedBy?.userName || 'مدير الحسابات والمالية'}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">معتمد إلكترونياً بالنظام ✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
