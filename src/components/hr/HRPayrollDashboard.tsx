import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Coins, 
  CheckCircle2, 
  Calendar, 
  Scissors, 
  Shirt, 
  Sparkles, 
  Printer, 
  CheckSquare, 
  Wallet, 
  Building2, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Layers, 
  Banknote,
  Receipt,
  Download,
  Filter,
  Check
} from 'lucide-react';
import { 
  calculateAccruedWages, 
  getPayrollDisbursements, 
  approveWeeklyPayrollDisbursement, 
  PayrollDisbursement, 
  AccruedWagesBreakdown 
} from '../../lib/hrPayrollStorage';
import { LaborList } from '../accounting/LaborList';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Toast } from '../ui/Toast';

interface HRPayrollDashboardProps {
  onNavigateToJournal?: () => void;
  onNavigateToLedger?: (accountCode: string) => void;
  onNavigateToTreasury?: () => void;
}

export function HRPayrollDashboard({
  onNavigateToJournal,
  onNavigateToLedger,
  onNavigateToTreasury
}: HRPayrollDashboardProps) {
  const [activeTab, setActiveTab] = useState<'payroll' | 'workers'>('payroll');
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<AccruedWagesBreakdown | null>(null);
  const [disbursements, setDisbursements] = useState<PayrollDisbursement[]>([]);
  
  // Modal state
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [disburseAmount, setDisburseAmount] = useState<number>(0);
  const [paymentChannel, setPaymentChannel] = useState<'cash' | 'bank'>('cash');
  const [weekTitle, setWeekTitle] = useState('');
  const [beneficiaryCount, setBeneficiaryCount] = useState<number>(15);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Print/Voucher modal
  const [selectedDisbursement, setSelectedDisbursement] = useState<PayrollDisbursement | null>(null);
  const [toastConfig, setToastConfig] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await calculateAccruedWages();
      setBreakdown(data);
      const list = getPayrollDisbursements();
      setDisbursements(list);
      setDisburseAmount(data.netPendingSettlement);
      
      const now = new Date();
      const weekNumber = Math.ceil((now.getDate() + 6) / 7);
      setWeekTitle(`مسير رواتب الأسبوع رقم ${weekNumber} - ${now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}`);
    } catch (e) {
      console.error('Failed to load HR payroll data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('payroll_disbursements_updated', handleUpdate);
    window.addEventListener('production_order_saved', handleUpdate);
    window.addEventListener('treasury_transactions_updated', handleUpdate);
    return () => {
      window.removeEventListener('payroll_disbursements_updated', handleUpdate);
      window.removeEventListener('production_order_saved', handleUpdate);
      window.removeEventListener('treasury_transactions_updated', handleUpdate);
    };
  }, []);

  const handleOpenDisburseModal = () => {
    if (!breakdown || breakdown.netPendingSettlement <= 0) {
      setToastConfig({
        message: 'لا توجد أجور مستحقة معلقة للصرف حالياً. تم تسوية كافة الأجور المستحقة.',
        type: 'info'
      });
      return;
    }
    setDisburseAmount(breakdown.netPendingSettlement);
    setIsDisburseModalOpen(true);
  };

  const handleConfirmDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disburseAmount <= 0) {
      setToastConfig({ message: 'يرجى إدخال مبلغ صحيح للصرف.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const fundAccountCode = paymentChannel === 'cash' ? '1211' : '1213';
      const fundAccountName = paymentChannel === 'cash' ? 'الخزينة الرئيسية للمصنع' : 'البنك - حساب جاري المصنع';

      const result = await approveWeeklyPayrollDisbursement({
        amount: Number(disburseAmount),
        paymentChannel,
        fundAccountCode,
        fundAccountName,
        weekTitle: weekTitle.trim() || 'مسير الرواتب الأسبوعية',
        beneficiaryCount: Number(beneficiaryCount) || 1,
        notes: notes.trim()
      });

      setIsDisburseModalOpen(false);
      setToastConfig({
        message: `تم اعتماد صرف مسير الرواتب الأسبوعي بمبلغ ${Number(disburseAmount).toLocaleString('ar-EG')} ج.م وتسوية حساب الأجور المستحقة (2131) بنجاح.`,
        type: 'success'
      });
      setSelectedDisbursement(result);
      loadData();
    } catch (err: any) {
      setToastConfig({ message: err.message || 'حدث خطأ أثناء اعتماد الصرف', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toastConfig && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig(null)}
        />
      )}

      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                الموارد البشرية ومستحقات العمال فنيين
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة استحقاق أجور عمال الإنتاج والمصنع واعتماد تسوية وصرف الرواتب الأسبوعية (حساب 2131)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToLedger && (
            <button
              type="button"
              onClick={() => onNavigateToLedger('2131')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              title="عرض كشف حساب الأجور المستحقة 2131 بدفتر الأستاذ"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>أستاذ الأجور المستحقة (2131)</span>
            </button>
          )}

          {onNavigateToJournal && (
            <button
              type="button"
              onClick={onNavigateToJournal}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>قيود اليومية</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenDisburseModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Banknote className="w-4 h-4 stroke-[2.5]" />
            <span>اعتماد صرف الرواتب الأسبوعية وتسوية المستحقات</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Accrued */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">
              إجمالي الأجور المستحقة (من المراحل المعتمدة)
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {breakdown ? breakdown.totalAccrued.toLocaleString('ar-EG') : '0'}{' '}
            <span className="text-xs font-bold text-slate-400">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            تم تحميلها محاسبياً على الإنتاج تحت التشغيل باعتماد كل مرحلة
          </p>
        </div>

        {/* Card 2: Settled / Disbursed */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-700">
              إجمالي الأجور المصروفة والمسواة
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800">
            {breakdown ? breakdown.totalSettled.toLocaleString('ar-EG') : '0'}{' '}
            <span className="text-xs font-bold text-emerald-600">ج.م</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-2">
            تم صرفها بسندات دفع وتسوية حساب 2131 من الخزينة/البنك
          </p>
        </div>

        {/* Card 3: Net Pending Settlement */}
        <div className={`p-5 rounded-2xl border shadow-2xs transition-all ${
          (breakdown?.netPendingSettlement || 0) > 0 
            ? 'bg-amber-50/70 border-amber-200' 
            : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold ${
              (breakdown?.netPendingSettlement || 0) > 0 ? 'text-amber-800' : 'text-slate-600'
            }`}>
              صافي الأجور المستحقة المعلقة (جاهزة للصرف)
            </span>
            <div className={`p-2 rounded-lg ${
              (breakdown?.netPendingSettlement || 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${
            (breakdown?.netPendingSettlement || 0) > 0 ? 'text-amber-900' : 'text-slate-700'
          }`}>
            {breakdown ? breakdown.netPendingSettlement.toLocaleString('ar-EG') : '0'}{' '}
            <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-amber-700 font-medium">
              {(breakdown?.netPendingSettlement || 0) > 0 ? 'بانتظار اعتماد مسير الصرف' : 'كافة المستحقات مسواة بالكامل'}
            </span>
            {(breakdown?.netPendingSettlement || 0) > 0 && (
              <button
                type="button"
                onClick={handleOpenDisburseModal}
                className="text-xs font-black text-amber-800 underline hover:text-amber-900 cursor-pointer"
              >
                صرف الآن
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stage-by-Stage Labor Breakdown Strip */}
      {breakdown && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>تفصيل الأجور المكتسبة حسب مراحل الإنتاج المعتمدة (تحميل على إنتاج تحت التشغيل):</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Cut */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1">
                <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                <span>أجور القص</span>
              </div>
              <div className="text-base font-black text-slate-800">
                {breakdown.cutLabor.toLocaleString('ar-EG')} <span className="text-[10px] text-slate-400">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">حـ/ 12421</span>
            </div>

            {/* Prep */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1">
                <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                <span>أجور التجهيز</span>
              </div>
              <div className="text-base font-black text-slate-800">
                {breakdown.prepLabor.toLocaleString('ar-EG')} <span className="text-[10px] text-slate-400">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">حـ/ 12421</span>
            </div>

            {/* Print */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1">
                <Printer className="w-3.5 h-3.5 text-purple-600" />
                <span>أجور الطباعة</span>
              </div>
              <div className="text-base font-black text-slate-800">
                {breakdown.printLabor.toLocaleString('ar-EG')} <span className="text-[10px] text-slate-400">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">حـ/ 12423</span>
            </div>

            {/* Sewing */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1">
                <Shirt className="w-3.5 h-3.5 text-blue-600" />
                <span>أجور الخياطة</span>
              </div>
              <div className="text-base font-black text-slate-800">
                {breakdown.sewingLabor.toLocaleString('ar-EG')} <span className="text-[10px] text-slate-400">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">حـ/ 12422</span>
            </div>

            {/* Finishing */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>أجور التشطيب</span>
              </div>
              <div className="text-base font-black text-slate-800">
                {breakdown.finishingLabor.toLocaleString('ar-EG')} <span className="text-[10px] text-slate-400">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">حـ/ 12424</span>
            </div>

            {/* Ironing */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>أجور المكواة</span>
              </div>
              <div className="text-base font-black text-slate-800">
                {breakdown.ironingLabor.toLocaleString('ar-EG')} <span className="text-[10px] text-slate-400">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">حـ/ 12424</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>مسير الرواتب الأسبوعية والاستحقاقات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'workers'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>سجل العمال والفنيين وقوة العمل</span>
        </button>
      </div>

      {/* Tab 1: Payroll and Accrued Orders */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Section A: Accrued Wages from Production Orders */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h4 className="font-extrabold text-sm text-slate-800">
                  أوامر الإنتاج والمراحل التي ولدت استحقاقات أجور (المعتمدة فقط)
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                {breakdown?.orderItems.length || 0} أمر إنتاج معتمد
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/60 text-slate-600 font-black border-b border-slate-200">
                    <th className="p-3">رقم الأمر</th>
                    <th className="p-3">الموديل والعميل</th>
                    <th className="p-3 text-center">الكمية المقصوصة</th>
                    <th className="p-3 text-center">أجر القص</th>
                    <th className="p-3 text-center">أجر التجهيز</th>
                    <th className="p-3 text-center">أجر الطباعة</th>
                    <th className="p-3 text-center">أجر الخياطة</th>
                    <th className="p-3 text-center">أجر التشطيب والكي</th>
                    <th className="p-3 text-center">إجمالي أجور الأمر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breakdown && breakdown.orderItems.length > 0 ? (
                    breakdown.orderItems.map((item) => (
                      <tr key={item.orderId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-extrabold text-indigo-700">
                          {item.orderNumber}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">{item.styleName}</span>
                          <span className="text-[11px] text-slate-400">{item.customerName}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {item.totalPieces} قطعة
                        </td>
                        <td className="p-3 text-center">
                          {item.cutApproved ? (
                            <span className="font-bold text-slate-800">
                              {item.cutLabor.toLocaleString('ar-EG')} ج.م
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">غير معتمد</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {item.prepApproved && item.prepLabor > 0 ? (
                            <span className="font-bold text-slate-800">
                              {item.prepLabor.toLocaleString('ar-EG')} ج.م
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">غير مسجل</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {item.printApproved ? (
                            <span className="font-bold text-slate-800">
                              {item.printLabor.toLocaleString('ar-EG')} ج.م
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">غير معتمد</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {item.sewingApproved ? (
                            <span className="font-bold text-slate-800">
                              {item.sewingLabor.toLocaleString('ar-EG')} ج.م
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">غير معتمد</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {(item.finishingApproved || item.ironingApproved) ? (
                            <span className="font-bold text-slate-800">
                              {(item.finishingLabor + item.ironingLabor).toLocaleString('ar-EG')} ج.م
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">غير معتمد</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-black text-indigo-700 text-sm">
                          {item.totalOrderLabor.toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        لا توجد أوامر إنتاج معتمدة ولدت استحقاقات أجور حتى الآن
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Historical Weekly Payroll Disbursements */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-sm text-slate-800">
                  سجل مسيرات الرواتب الأسبوعية المصروفة وسندات التسوية
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-bold">
                {disbursements.length} مسير مسوى
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/60 text-slate-600 font-black border-b border-slate-200">
                    <th className="p-3">رقم المسير</th>
                    <th className="p-3">مسمى الأسبوع</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">المبلغ المصروف</th>
                    <th className="p-3">جهة الصرف</th>
                    <th className="p-3 text-center">العمال المستفيدون</th>
                    <th className="p-3 text-center">كود التحقق والاعتماد</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {disbursements.length > 0 ? (
                    disbursements.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-extrabold text-slate-900">
                          {d.disbursementNumber}
                        </td>
                        <td className="p-3 font-bold text-indigo-700">
                          {d.weekTitle}
                        </td>
                        <td className="p-3 text-slate-600 whitespace-nowrap">
                          {d.date} <span className="text-slate-400 text-[10px]">({d.time})</span>
                        </td>
                        <td className="p-3 font-black text-emerald-700 text-sm">
                          {d.amount.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="p-3 text-slate-700">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            d.paymentChannel === 'cash' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                          }`}>
                            {d.fundAccountName}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {d.beneficiaryCount} عامل
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {d.verificationCode}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedDisbursement(d)}
                            className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            عرض السند
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لم يتم صرف أو اعتماد أي مسيرات رواتب أسبوعية بعد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Workers & Labor Profiles Management */}
      {activeTab === 'workers' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <LaborList />
        </div>
      )}

      {/* MODAL 1: Weekly Payroll Approval & Settlement Form */}
      {isDisburseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                <h3 className="font-black text-base">
                  اعتماد صرف الرواتب الأسبوعية وتسوية المستحقات
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDisburseModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDisbursement} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Accrued Notice Box */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>صافي الأجور المستحقة المعلقة حالياً:</span>
                  <span className="text-sm font-black">
                    {breakdown?.netPendingSettlement.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
                <p className="text-[11px] text-amber-700">
                  عند الاعتماد، سيتم توليد قيد اليومية الآلي وسند الصرف: مدين حساب 2131 (أجور ومرتبات عمال الإنتاج والمصنع المستحقة) ودائن حساب الخزينة/البنك.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مسمى مسير الأسبوع *
                </label>
                <input
                  type="text"
                  required
                  value={weekTitle}
                  onChange={(e) => setWeekTitle(e.target.value)}
                  placeholder="مثال: مسير رواتب الأسبوع رقم 41"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المبلغ المطلوب صرفه (ج.م) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={disburseAmount}
                    onChange={(e) => setDisburseAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-black text-indigo-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عدد العمال والفنيين المستفيدين *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={beneficiaryCount}
                    onChange={(e) => setBeneficiaryCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  قناة صرف الأموال (الخزينة / البنك) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentChannel('cash')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      paymentChannel === 'cash'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <span>الخزينة الرئيسية (1211)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChannel('bank')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      paymentChannel === 'bank'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>حساب البنك الجاري (1213)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات أو توثيق إضافي
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات حول مسير الرواتب أو الخصومات والمكافآت..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Preview Accounting Entry */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1 font-mono">
                <div className="font-bold text-slate-700 font-sans">معاينة القيد المحاسبي المتولد تلقائياً:</div>
                <div className="text-emerald-700">
                  من حـ/ أجور ومرتبات عمال الإنتاج والمصنع المستحقة (2131): {Number(disburseAmount).toLocaleString('ar-EG')} ج.م
                </div>
                <div className="text-indigo-700">
                  إلى حـ/ {paymentChannel === 'cash' ? 'الخزينة الرئيسية للمصنع (1211)' : 'البنك - حساب جاري المصنع (1213)'}: {Number(disburseAmount).toLocaleString('ar-EG')} ج.م
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSubmitting ? 'جاري الاعتماد والتسوية...' : 'تأكيد واعتماد الصرف والتسوية المحاسبية'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Disbursement Voucher */}
      {selectedDisbursement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-base">سند صرف مسير الرواتب الأسبوعية</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDisbursement(null)}
                className="text-white/80 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500 font-bold">رقم السند المرجعي:</span>
                  <span className="font-black text-slate-900 font-mono text-sm">
                    {selectedDisbursement.disbursementNumber}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">مسمى المسير:</span>
                  <span className="font-bold text-indigo-700 text-xs">
                    {selectedDisbursement.weekTitle}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">تاريخ ووقت الصرف:</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {selectedDisbursement.date} - {selectedDisbursement.time}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">المبلغ المسوى:</span>
                  <span className="font-black text-emerald-700 text-base">
                    {selectedDisbursement.amount.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">الجهة المنصرف منها:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedDisbursement.fundAccountName} ({selectedDisbursement.fundAccountCode})
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">الحساب المقفل (المسوى):</span>
                  <span className="text-xs font-bold text-indigo-800">
                    {selectedDisbursement.targetAccountName} ({selectedDisbursement.targetAccountCode})
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">عدد العمال:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedDisbursement.beneficiaryCount} عامل
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">رمز التوثيق والتحقق:</span>
                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {selectedDisbursement.verificationCode}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>تم الاعتماد بواسطة:</span>
                  <span className="font-bold text-slate-700">
                    {selectedDisbursement.approvedBy.userName} ({selectedDisbursement.approvedBy.userRoleLabel || 'المدير المالي'})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة سند الصرف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDisbursement(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRPayrollDashboard;
