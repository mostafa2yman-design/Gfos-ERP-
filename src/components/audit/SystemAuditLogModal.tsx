import React, { useState, useEffect, useMemo } from 'react';
import { SystemApprovalLog, ApprovalActionType } from '../../types/audit';
import { getSystemApprovalLogs, getAuditMetrics } from '../../lib/auditStorage';
import { getStoredUsers } from '../../lib/usersStorage';
import {
  ShieldCheck,
  CheckCircle2,
  Search,
  Calendar,
  User,
  Filter,
  Download,
  Printer,
  X,
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  Building,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Hash
} from 'lucide-react';

interface SystemAuditLogModalProps {
  onClose: () => void;
  filterDocumentNumber?: string;
}

export function SystemAuditLogModal({
  onClose,
  filterDocumentNumber
}: SystemAuditLogModalProps) {
  const [logs, setLogs] = useState<SystemApprovalLog[]>([]);
  const [searchTerm, setSearchTerm] = useState(filterDocumentNumber || '');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<SystemApprovalLog | null>(null);

  const loadData = () => {
    setLogs(getSystemApprovalLogs());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('approval_logged', handleUpdate);
    return () => window.removeEventListener('approval_logged', handleUpdate);
  }, []);

  const metrics = useMemo(() => getAuditMetrics(), [logs]);
  const systemUsers = useMemo(() => getStoredUsers(), []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchDoc = log.documentNumber.toLowerCase().includes(term);
        const matchTitle = log.title.toLowerCase().includes(term);
        const matchDetails = log.details.toLowerCase().includes(term);
        const matchUser = log.userName.toLowerCase().includes(term);
        const matchParty = log.counterpartyName?.toLowerCase().includes(term);
        const matchCode = log.verificationCode.toLowerCase().includes(term);
        const matchBatch = log.batchNumber ? log.batchNumber.toLowerCase().includes(term) : false;
        const matchStage = log.stageName ? log.stageName.toLowerCase().includes(term) : false;
        if (!matchDoc && !matchTitle && !matchDetails && !matchUser && !matchParty && !matchCode && !matchBatch && !matchStage) {
          return false;
        }
      }

      // Action type
      if (selectedActionType !== 'all') {
        if (log.actionType !== selectedActionType) return false;
      }

      // User filter
      if (selectedUser !== 'all') {
        if (log.userId !== selectedUser && log.userName !== selectedUser) return false;
      }

      // Date range
      if (startDate && log.date < startDate) return false;
      if (endDate && log.date > endDate) return false;

      return true;
    });
  }, [logs, searchTerm, selectedActionType, selectedUser, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['رقم السجل', 'تاريخ الاعتماد', 'وقت الاعتماد', 'كود التحقق', 'المستخدم المعتمد', 'الصفة الوظيفية', 'نوع الحركة', 'رقم المستند', 'البيان', 'الطرف', 'المبلغ', 'الحالة'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.date,
      l.time,
      l.verificationCode,
      l.userName,
      l.userRoleLabel,
      l.actionTypeLabel,
      l.documentNumber,
      `"${l.details.replace(/"/g, '""')}"`,
      l.counterpartyName || '-',
      l.amount || 0,
      l.status
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Audit_Approvals_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (type: ApprovalActionType) => {
    switch (type) {
      case 'treasury_receipt':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'treasury_payment':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'sales_invoice':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'purchase_invoice':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'production_order':
      case 'production_stage_cut':
      case 'production_stage_batches':
      case 'production_stage_prep':
      case 'production_stage_print':
      case 'production_stage_sewing':
      case 'production_stage_finish':
      case 'production_stage_iron':
      case 'production_stage_pack':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'inventory_adjustment':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'journal_entry':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">منظومة تسجيل وتوثيق اعتمادات حركات النظام</h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  تدقيق آلي نشط 100%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                سجل إلكتروني معتمد يوثق الوقت بالثانية، التاريخ، واسم ورتبة اليوزر الذي قام باعتماد أي حركة مالية أو إنتاجية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="تصدير السجل إلى Excel / CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="طباعة تقرير الاعتمادات"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">إجمالي الحركات المعتمدة</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {metrics.totalApprovalsCount}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">سجل موثق بالكامل</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">معتمد اليوم</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-900 font-mono">
                {metrics.todayApprovalsCount}
              </div>
              <div className="text-[11px] text-blue-600 font-bold">تحديث فوري لليوم الحالي</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">معتمد خلال الشهر</span>
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-900 font-mono">
                {metrics.thisMonthApprovalsCount}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">دورة التدقيق الشهرية</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">القيمة المالية المعتمدة</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-700 font-mono">
                {metrics.totalApprovedFinancialValue.toLocaleString('ar-EG')} <span className="text-xs font-bold">ج.م</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-bold">سندات وفواتير مطابقة</div>
            </div>
          </div>

          {/* Search & Filters Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4 relative">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="ابحث برقم المستند، اسم المستخدم، العميل/المورد، كود التحقق..."
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedActionType}
                  onChange={e => setSelectedActionType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white"
                >
                  <option value="all">كل أنواع الحركات المعتمدة</option>
                  <option value="treasury_receipt">سندات قبض وتحصيل إيراد</option>
                  <option value="treasury_payment">سندات صرف وسداد موردين ومصروف</option>
                  <option value="sales_invoice">فواتير مبيعات صادرة</option>
                  <option value="purchase_invoice">فواتير مشتريات خامات</option>
                  <option value="production_order">اعتماد أوامر التشغيل والإنتاج</option>
                  <option value="production_stage_cut">اعتماد مرحلة القص الفعلي</option>
                  <option value="production_stage_batches">اعتماد وتثبيت تشغيلات الباتشات</option>
                  <option value="production_stage_prep">اعتماد تجهيز مستلزمات الباتشات</option>
                  <option value="production_stage_print">اعتماد الطباعة والتطريز للباتشات</option>
                  <option value="production_stage_sewing">اعتماد إنتاجية الخياطة للباتشات</option>
                  <option value="production_stage_finish">اعتماد التشطيب والفنش للباتشات</option>
                  <option value="production_stage_iron">اعتماد المكواة والبخار للباتشات</option>
                  <option value="production_stage_pack">اعتماد التعبئة والتغليف للمخزن</option>
                  <option value="inventory_adjustment">تسويات مخزنية جردية</option>
                  <option value="journal_entry">قيود يومية محاسبية</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white"
                >
                  <option value="all">كل المستخدمين المعتمدين</option>
                  {systemUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.username} ({u.roleTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700"
                  title="من تاريخ"
                />
              </div>
            </div>
          </div>

          {/* Audit Trail Registry Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">سجل الاعتمادات الرسمي</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold font-mono">
                  {filteredLogs.length} حركة مطابقة
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                التسجيل دائم وتلقائي ويشمل البصمة الزمنية وهوية المستخدم
              </span>
            </div>

            {filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100/70 text-slate-700 font-black border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">تاريخ ووقت الاعتماد</th>
                      <th className="py-3 px-4">المستخدم المعتمد والصفة</th>
                      <th className="py-3 px-4">نوع الحركة</th>
                      <th className="py-3 px-4">رقم المستند والتحقق</th>
                      <th className="py-3 px-4">الطرف الثاني والبيان</th>
                      <th className="py-3 px-4 text-center">المبلغ / القيمة</th>
                      <th className="py-3 px-4 text-center">حالة الاعتماد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        {/* Date & Time */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-black text-slate-900 text-xs">{log.date}</div>
                          <div className="text-[11px] font-mono text-indigo-700 font-bold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>{log.time}</span>
                          </div>
                        </td>

                        {/* Approver User */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-xs">{log.userName}</div>
                              <span className="text-[10px] text-slate-500 font-bold block">{log.userRoleLabel}</span>
                            </div>
                          </div>
                        </td>

                        {/* Action Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-black border ${getActionBadgeColor(log.actionType)}`}>
                            {log.actionTypeLabel}
                          </span>
                        </td>

                        {/* Document Number & Verification Code */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-blue-900 text-xs">{log.documentNumber}</span>
                            {log.batchNumber && (
                              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">
                                {log.batchNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                              {log.verificationCode}
                            </span>
                            {log.stageName && (
                              <span className="text-[10px] font-bold text-slate-500">
                                ({log.stageName})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Party & Description */}
                        <td className="py-3 px-4 max-w-xs">
                          {log.counterpartyName && (
                            <div className="font-bold text-slate-900 truncate">
                              {log.counterpartyName}
                            </div>
                          )}
                          <p className="text-slate-600 text-[11px] truncate" title={log.details}>
                            {log.details}
                          </p>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                          {log.amount !== undefined ? (
                            <span className="font-black text-slate-900 text-xs">
                              {log.amount.toLocaleString('ar-EG')} <span className="text-[10px] font-bold text-slate-500">ج.م</span>
                            </span>
                          ) : log.quantity !== undefined ? (
                            <span className="font-bold text-indigo-700 text-xs">
                              {log.quantity.toLocaleString('ar-EG')} <span className="text-[10px]">قطعة</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>

                        {/* Status Stamp */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>معتمد رسمياً</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <ShieldCheck className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">لا توجد حركات معتمدة مطابقة لمعايير البحث</p>
                <p className="text-xs text-slate-400">جرب تغيير فلاتر التاريخ، المستخدم أو نوع الحركة</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>نظام الاعتماد والرقابة الإدارية والمالية شغال ومربوط بكل العمليات</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}
