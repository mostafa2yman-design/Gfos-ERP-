import React from 'react';
import { 
  X, 
  FileText, 
  Printer, 
  ExternalLink, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  User, 
  Building, 
  Hash,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { StatementMovement } from '../../lib/statementEngine';

interface StatementTransactionModalProps {
  movement: StatementMovement | null;
  onClose: () => void;
  onNavigateToInvoice?: (invoiceId: string) => void;
}

export const StatementTransactionModal: React.FC<StatementTransactionModalProps> = ({
  movement,
  onClose,
  onNavigateToInvoice
}) => {
  if (!movement) return null;

  const raw = movement.rawItem || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-[#180a2c] w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-purple-900/60 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-purple-950/80 bg-slate-50/80 dark:bg-[#1f1038] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-[#2C1151] dark:text-amber-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  تفاصيل المستند ({movement.documentTypeLabel})
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 font-bold">
                  {movement.documentNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تاريخ الحركة: {movement.date} {movement.time ? `· ${movement.time}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Key Amount Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-[#140824] rounded-xl border border-slate-200 dark:border-purple-950/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mb-1">
                القيمة المدينة (Debit)
              </span>
              <span className={`text-base font-black font-mono tabular-nums ${movement.debit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                {movement.debit > 0 ? `${movement.debit.toLocaleString('ar-EG')} ج.م` : '—'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#140824] rounded-xl border border-slate-200 dark:border-purple-950/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mb-1">
                القيمة الدائنة (Credit)
              </span>
              <span className={`text-base font-black font-mono tabular-nums ${movement.credit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {movement.credit > 0 ? `${movement.credit.toLocaleString('ar-EG')} ج.م` : '—'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#140824] rounded-xl border border-slate-200 dark:border-purple-950/60 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mb-1">
                الرصيد التراكمي للحساب
              </span>
              <span className={`text-base font-black font-mono tabular-nums ${
                movement.balance > 0 
                  ? 'text-indigo-600 dark:text-amber-400' 
                  : movement.balance < 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-slate-500'
              }`}>
                {movement.balance.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          </div>

          {/* Description & Notes */}
          <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              البيان والوصف المحاسبي:
            </span>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
              {movement.description}
            </p>
          </div>

          {/* Additional details depending on item type */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-purple-950/60">
              <span className="text-slate-500 dark:text-slate-400">طريقة الدفع / القناة:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{movement.paymentMethod || 'آجل / حساب جاري'}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-purple-950/60">
              <span className="text-slate-500 dark:text-slate-400">حالة المستند في النظام:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {movement.status || 'معتمد رسمياً'}
              </span>
            </div>

            {raw.approvedBy && (
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-purple-950/60">
                <span className="text-slate-500 dark:text-slate-400">جهة الاعتماد:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {raw.approvedBy.userName || raw.approvedBy.name || 'الإدارة المالية'}
                  {raw.approvedBy.userRoleLabel ? ` (${raw.approvedBy.userRoleLabel})` : ''}
                </span>
              </div>
            )}

            {/* If Items list exists (Invoice) */}
            {raw.items && Array.isArray(raw.items) && raw.items.length > 0 && (
              <div className="mt-4 pt-2">
                <h4 className="font-black text-xs text-slate-800 dark:text-slate-200 mb-2">
                  جدول بنود وأصناف المستند ({raw.items.length} بند):
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-purple-950/60">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-slate-100 dark:bg-[#140824] text-slate-600 dark:text-slate-400 font-bold">
                      <tr>
                        <th className="p-2">الصنف / الموديل</th>
                        <th className="p-2 text-center">الكمية</th>
                        <th className="p-2 text-center">سعر الوحدة</th>
                        <th className="p-2 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-purple-950/60">
                      {raw.items.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-purple-950/30">
                          <td className="p-2 font-bold text-slate-800 dark:text-slate-200">
                            {it.styleName || it.materialName || it.name || it.description || 'بند غير محدد'}
                          </td>
                          <td className="p-2 text-center font-mono tabular-nums">
                            {it.quantity} {it.unit || 'قطعة'}
                          </td>
                          <td className="p-2 text-center font-mono tabular-nums">
                            {(it.unitPrice || it.price || 0).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-2 text-left font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                            {(it.total || (it.quantity * (it.unitPrice || 0))).toLocaleString('ar-EG')} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-purple-950/80 bg-slate-50/60 dark:bg-[#1f1038] flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-purple-800 hover:bg-slate-100 dark:hover:bg-purple-900/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-amber-400" />
            <span>طباعة المستند</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2C1151] hover:bg-[#3d1870] text-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
