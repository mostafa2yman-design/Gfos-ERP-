import { SystemApprovalLog, ApprovalActionType, AuditMetrics } from '../types/audit';
import { getActiveSessionUser, ROLE_LABELS } from './usersStorage';

const AUDIT_STORAGE_KEY = 'factory_audit_approvals_v1';

const ACTION_TYPE_LABELS: Record<ApprovalActionType, string> = {
  treasury_receipt: 'اعتماد سند قبض / تحصيل إيراد',
  treasury_payment: 'اعتماد سند صرف / سداد مورد ومصروف',
  sales_invoice: 'اعتماد وإصدار فاتورة مبيعات',
  sales_return: 'اعتماد إشعار مردودات مبيعات',
  purchase_invoice: 'اعتماد وإدخال فاتورة مشتريات خامات',
  purchase_return: 'اعتماد إشعار مردودات مشتريات',
  production_order: 'اعتماد أمر تشغيل وإنتاج جديد',
  production_stage_cut: 'اعتماد مرحلة القص الفعلي واستهلاك القماش',
  production_stage_batches: 'اعتماد وتثبيت تشغيلات الباتشات',
  production_stage_prep: 'اعتماد صرف وتجهيز إكسسوارات الباتشات',
  production_stage_print: 'اعتماد مرحلة الطباعة والتطريز الخارجي',
  production_stage_sewing: 'اعتماد إنتاجية مرحلة الخياطة والتجميع',
  production_stage_finish: 'اعتماد مرحلة التشطيب والفنش النهائي',
  production_stage_iron: 'اعتماد مرحلة المكواة والبخار',
  production_stage_pack: 'اعتماد التعبئة والتغليف والباركود للمخزن',
  inventory_adjustment: 'اعتماد تسوية جردية لمخزن الخامات',
  journal_entry: 'اعتماد قيد يومية محاسبي رسمي'
};

export function getActionTypeLabel(actionType: ApprovalActionType): string {
  return ACTION_TYPE_LABELS[actionType] || actionType;
}

// Generate verification hash / code
function generateVerificationCode(dateStr: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `APV-${cleanDate}-${rand}`;
}

export function getSystemApprovalLogs(): SystemApprovalLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw === null) {
      const initialSeed = seedInitialAuditLogs();
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(initialSeed));
      return initialSeed;
    }
    const parsed: SystemApprovalLog[] = JSON.parse(raw);
    return Array.isArray(parsed) 
      ? parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      : [];
  } catch (err) {
    console.error('Failed to parse approval audit logs:', err);
    return [];
  }
}

export function saveSystemApprovalLogs(logs: SystemApprovalLog[]): void {
  try {
    // Keep max 2000 logs in local storage
    const trimmed = logs.slice(0, 2000);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent('approval_logged', { detail: trimmed[0] }));
  } catch (err) {
    console.error('Failed to save approval audit logs:', err);
  }
}

export function deleteAllSystemApprovalLogs(): void {
  saveSystemApprovalLogs([]);
}

export interface RecordApprovalInput {
  actionType: ApprovalActionType;
  documentId: string;
  documentNumber: string;
  title: string;
  details: string;
  amount?: number;
  quantity?: number;
  counterpartyName?: string;
  costCenter?: string;
  batchId?: string;
  batchNumber?: string;
  stageName?: string;
  notes?: string;
  customDate?: string;
  customTime?: string;
  customUser?: {
    id: string;
    name: string;
    role: string;
    roleTitle?: string;
  };
}

/**
 * Centrally records an approved transaction/action in the factory audit trail
 */
export function recordSystemApproval(input: RecordApprovalInput): SystemApprovalLog {
  const now = new Date();
  const date = input.customDate || now.toISOString().split('T')[0];
  const time = input.customTime || now.toTimeString().slice(0, 8);
  const timestamp = `${date}T${time}.000Z`;

  const activeUser = getActiveSessionUser();
  const userId = input.customUser?.id || activeUser.id;
  const userName = input.customUser?.name || activeUser.fullName || activeUser.username;
  const userRole = input.customUser?.role || activeUser.role;
  const userRoleLabel = input.customUser?.roleTitle || activeUser.roleTitle || (ROLE_LABELS as any)[userRole]?.title || 'مسؤول معتمد';

  const newLog: SystemApprovalLog = {
    id: `audit_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    timestamp,
    date,
    time,
    actionType: input.actionType,
    actionTypeLabel: ACTION_TYPE_LABELS[input.actionType] || input.actionType,
    documentId: input.documentId,
    documentNumber: input.documentNumber,
    title: input.title,
    details: input.details,
    amount: input.amount,
    quantity: input.quantity,
    counterpartyName: input.counterpartyName,
    costCenter: input.costCenter,
    batchId: input.batchId,
    batchNumber: input.batchNumber,
    stageName: input.stageName,
    userId,
    userName,
    userRole,
    userRoleLabel,
    status: 'معتمد',
    verificationCode: generateVerificationCode(date),
    notes: input.notes
  };

  const logs = getSystemApprovalLogs();
  logs.unshift(newLog);
  saveSystemApprovalLogs(logs);

  return newLog;
}

export function getApprovalsByDocument(documentNumber: string): SystemApprovalLog[] {
  const logs = getSystemApprovalLogs();
  return logs.filter(l => l.documentNumber.toLowerCase() === documentNumber.toLowerCase() || l.documentId === documentNumber);
}

export function getAuditMetrics(): AuditMetrics {
  const logs = getSystemApprovalLogs();
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);

  let todayCount = 0;
  let monthCount = 0;
  let totalFinancial = 0;
  const approvalsByAction: Record<string, number> = {};
  const approvalsByUser: Record<string, number> = {};

  logs.forEach(log => {
    if (log.date === todayStr) todayCount++;
    if (log.date.startsWith(currentMonthStr)) monthCount++;
    if (log.amount && !isNaN(log.amount)) {
      totalFinancial += Number(log.amount);
    }

    const actionLbl = log.actionTypeLabel;
    approvalsByAction[actionLbl] = (approvalsByAction[actionLbl] || 0) + 1;

    const userKey = `${log.userName} (${log.userRoleLabel})`;
    approvalsByUser[userKey] = (approvalsByUser[userKey] || 0) + 1;
  });

  return {
    totalApprovalsCount: logs.length,
    todayApprovalsCount: todayCount,
    thisMonthApprovalsCount: monthCount,
    approvalsByAction,
    approvalsByUser,
    totalApprovedFinancialValue: Math.round(totalFinancial * 100) / 100
  };
}

// Initial seeder for historical audit records
function seedInitialAuditLogs(): SystemApprovalLog[] {
  return [
    {
      id: 'audit_init_01',
      timestamp: '2026-03-27T10:15:20.000Z',
      date: '2026-03-27',
      time: '10:15:20',
      actionType: 'treasury_receipt',
      actionTypeLabel: 'اعتماد سند قبض / تحصيل إيراد',
      documentId: 'rec_init_01',
      documentNumber: 'REC-2026-001',
      title: 'تحصيل دفعة نقدية من شركة الأمل للتجارة',
      details: 'تحصيل نقدي بالخزينة الرئيسية بقيمة 45,000 ج.م لحساب فاتورة مبيعات SAL-2026-001',
      amount: 45000,
      counterpartyName: 'شركة الأمل للتجارة والتوكيلات',
      userId: 'user_accountant',
      userName: 'أ. خالد فؤاد',
      userRole: 'accountant',
      userRoleLabel: 'رئيس الحسابات والتكاليف',
      status: 'معتمد',
      verificationCode: 'APV-20260327-4182',
      notes: 'تم فحص النقدية وتوريدها للخزينة الرئيسية وإصدار السند آلياً'
    },
    {
      id: 'audit_init_02',
      timestamp: '2026-03-26T14:40:10.000Z',
      date: '2026-03-26',
      time: '14:40:10',
      actionType: 'sales_invoice',
      actionTypeLabel: 'اعتماد وإصدار فاتورة مبيعات',
      documentId: 'sal_init_01',
      documentNumber: 'SAL-2026-001',
      title: 'إصدار فاتورة مبيعات ملابس جاهزة للموزع الرئيسي',
      details: 'فاتورة مبيعات رقم SAL-2026-001 - تيشرت قطن أوفر سايز (500 قطعة) بإجمالي 150,000 ج.م',
      amount: 150000,
      quantity: 500,
      counterpartyName: 'شركة النور للملابس الجاهزة',
      userId: 'user_admin',
      userName: 'المدير العام للمصنع (Admin)',
      userRole: 'admin',
      userRoleLabel: 'مدير عام النظام (Super Admin)',
      status: 'معتمد',
      verificationCode: 'APV-20260326-9031'
    },
    {
      id: 'audit_init_03',
      timestamp: '2026-03-25T11:20:00.000Z',
      date: '2026-03-25',
      time: '11:20:00',
      actionType: 'treasury_payment',
      actionTypeLabel: 'اعتماد سند صرف / سداد مورد ومصروف',
      documentId: 'pay_init_01',
      documentNumber: 'PAY-2026-001',
      title: 'سداد دفعة نقدية لمورد الأقمشة والغزول',
      details: 'سداد نقدي من الخزينة الرئيسية للمورد شركة الإسكندرية للغزل والنسيج عن فاتورة توريد PUR-2026-001',
      amount: 60000,
      counterpartyName: 'شركة الإسكندرية للغزل والنسيج',
      userId: 'user_admin',
      userName: 'المدير العام للمصنع (Admin)',
      userRole: 'admin',
      userRoleLabel: 'مدير عام النظام (Super Admin)',
      status: 'معتمد',
      verificationCode: 'APV-20260325-1102'
    },
    {
      id: 'audit_init_04',
      timestamp: '2026-03-24T09:30:15.000Z',
      date: '2026-03-24',
      time: '09:30:15',
      actionType: 'production_stage_cut',
      actionTypeLabel: 'اعتماد مرحلة القص الفعلي واستهلاك القماش',
      documentId: 'ord_101',
      documentNumber: 'ORD-101',
      title: 'اعتماد أوزان القص الفعلي لأمر تشغيل بولو شيرت صيفي',
      details: 'تم اعتماد تفصيل 1200 قطعة بوزن قماش فعلي 285 كجم ومطابقة الماركر ونسبة الهالك المسموح بها',
      quantity: 1200,
      costCenter: 'خط الإنتاج أ - عنبر القص',
      userId: 'user_cutter',
      userName: 'أ. محمود البنا',
      userRole: 'cutter',
      userRoleLabel: 'مسؤول قسم القص والتفصيل',
      status: 'معتمد',
      verificationCode: 'APV-20260324-7741'
    },
    {
      id: 'audit_init_05',
      timestamp: '2026-03-23T16:10:45.000Z',
      date: '2026-03-23',
      time: '16:10:45',
      actionType: 'purchase_invoice',
      actionTypeLabel: 'اعتماد وإدخال فاتورة مشتريات خامات',
      documentId: 'pur_init_01',
      documentNumber: 'PUR-2026-001',
      title: 'اعتماد فاتورة توريد أقمشة سنجل ليكرا قطن',
      details: 'توريد 15 طوبة قماش قطن سنجل ليكرا (إجمالي 320 كجم) بقيمة 96,000 ج.م مع الفحص المخزني',
      amount: 96000,
      counterpartyName: 'مصانع المحلة للغزول والأنسجة',
      userId: 'user_accountant',
      userName: 'أ. خالد فؤاد',
      userRole: 'accountant',
      userRoleLabel: 'رئيس الحسابات والتكاليف',
      status: 'معتمد',
      verificationCode: 'APV-20260323-5592'
    }
  ];
}
