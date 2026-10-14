import { getOrders } from './storage';
import { getTreasuryTransactions, addTreasuryTransaction } from './treasuryStorage';
import { getLabor } from './accountingStorage';
import { recordSystemApproval } from './auditStorage';
import { getActiveSessionUser, ROLE_LABELS } from './usersStorage';
import { ProductionOrder } from '../types';
import {
  calculateActualCuttingLaborDetails,
  calculateActualPrepDetails,
  calculateActualPrintLaborDetails,
  calculateActualSewingLaborDetails,
  calculateActualFinishingLaborDetails
} from './journalEngine';

export interface PayrollDisbursement {
  id: string;
  disbursementNumber: string; // e.g. PAYROLL-2026-W41-001
  weekTitle: string;          // e.g. "مسير رواتب الأسبوع رقم 41"
  date: string;               // YYYY-MM-DD
  time: string;               // HH:MM:SS
  amount: number;             // المبلغ المصروف والمسوى
  paymentChannel: 'cash' | 'bank';
  fundAccountCode: string;    // '1211' (خزينة) أو '1213' (بنك)
  fundAccountName: string;
  targetAccountCode: string;  // '2131' (أجور ومرتبات عمال الإنتاج والمصنع المستحقة)
  targetAccountName: string;
  beneficiaryCount: number;   // عدد العمال والفنيين
  status: 'confirmed' | 'cancelled';
  treasuryVoucherNumber?: string;
  treasuryTransactionId?: string;
  verificationCode: string;
  notes?: string;
  approvedBy: {
    userId?: string;
    userName: string;
    userRole?: string;
    userRoleLabel?: string;
    approvedAt: string;
  };
  createdAt: string;
}

export interface AccruedWagesBreakdown {
  cutLabor: number;
  prepLabor: number;
  sewingLabor: number;
  printLabor: number;
  finishingLabor: number;
  ironingLabor: number;
  totalAccrued: number;
  totalSettled: number;
  netPendingSettlement: number;
  orderItems: Array<{
    orderId: string;
    orderNumber: string;
    styleName: string;
    customerName: string;
    totalPieces: number;
    cutLabor: number;
    cutApproved: boolean;
    cutApprovedAt?: string;
    prepLabor: number;
    prepApproved: boolean;
    prepApprovedAt?: string;
    sewingLabor: number;
    sewingApproved: boolean;
    sewingApprovedAt?: string;
    printLabor: number;
    printApproved: boolean;
    printApprovedAt?: string;
    finishingLabor: number;
    finishingApproved: boolean;
    finishingApprovedAt?: string;
    ironingLabor: number;
    ironingApproved: boolean;
    ironingApprovedAt?: string;
    totalOrderLabor: number;
  }>;
}

const PAYROLL_STORAGE_KEY = 'gfos_hr_weekly_payroll_disbursements_v1';

export function getPayrollDisbursements(): PayrollDisbursement[] {
  try {
    const raw = localStorage.getItem(PAYROLL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load payroll disbursements:', e);
    return [];
  }
}

export function savePayrollDisbursements(items: PayrollDisbursement[]): void {
  localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('payroll_disbursements_updated'));
  window.dispatchEvent(new CustomEvent('journal_entries_updated'));
  window.dispatchEvent(new CustomEvent('treasury_transactions_updated'));
}

export function generatePayrollDisbursementNumber(): string {
  const list = getPayrollDisbursements();
  const year = new Date().getFullYear();
  const prefix = `PAYROLL-${year}-`;
  const nums = list
    .filter(p => p.disbursementNumber?.startsWith(prefix))
    .map(p => {
      const part = p.disbursementNumber.replace(prefix, '');
      const parsed = parseInt(part, 10);
      return isNaN(parsed) ? 0 : parsed;
    });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

/**
 * Calculates current accrued wages earned from approved production stages,
 * and matches against payroll disbursements already made.
 */
export async function calculateAccruedWages(): Promise<AccruedWagesBreakdown> {
  const orders = await getOrders();
  const disbursements = getPayrollDisbursements();

  let totalCutLabor = 0;
  let totalPrepLabor = 0;
  let totalSewingLabor = 0;
  let totalPrintLabor = 0;
  let totalFinishingLabor = 0;
  let totalIroningLabor = 0;

  const cutStatuses = ['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];
  const prepStatuses = ['التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];
  const printStatuses = ['الطباعة والتطريز مكتمل', 'الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];
  const sewStatuses = ['الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];
  const finishStatuses = ['التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];
  const ironStatuses = ['المكواة مكتملة', 'التغليف معتمد', 'مغلق'];

  const orderItems = orders.map((order: ProductionOrder) => {
    const plannedPieces = (order.sizes || []).reduce((acc: number, s) => {
      return acc + (s.variants || []).reduce((vAcc, v) => vAcc + (Number(v.quantity) || 0), 0);
    }, 0);

    const actualCutPieces = order.cutData?.sizes 
      ? order.cutData.sizes.reduce((acc, s) => acc + (s.variants || []).reduce((vAcc, v) => vAcc + (Number(v.actualQuantity) || 0), 0), 0)
      : plannedPieces;

    const actualPieces = actualCutPieces > 0 ? actualCutPieces : plannedPieces;

    // 1. Cut stage labor (الأجر الفعلي المسجل بشاشة القص)
    const cutApproved = !!(order.cutApprovedAt || order.cutData?.approvedAt || cutStatuses.includes(order.status));
    const { cutLaborVal } = calculateActualCuttingLaborDetails(order);
    const cutLabor = cutApproved ? cutLaborVal : 0;
    if (cutApproved) totalCutLabor += cutLabor;

    // 2. Prep stage labor (أجور التجهيز الفعلية)
    const prepApproved = !!(order.prepApprovedAt || prepStatuses.includes(order.status) || (order.batches && order.batches.some(b => b.prepStatus === 'مكتمل' || (b as any).prepApprovedAt)));
    const { prepLaborVal } = calculateActualPrepDetails(order);
    const prepLabor = prepApproved ? prepLaborVal : 0;
    if (prepApproved) totalPrepLabor += prepLabor;

    // 3. Print stage labor (أجور الطباعة والتطريز الفعلية من الباتشات)
    const printApproved = !!(order.printEmbroideryApprovedAt || printStatuses.includes(order.status) || (order.batches && order.batches.some(b => b.printEmbroideryStatus === 'مكتمل' || (b as any).printEmbroideryApprovedAt)));
    const { totalPrintCost } = calculateActualPrintLaborDetails(order);
    const printLabor = printApproved ? totalPrintCost : 0;
    if (printApproved) totalPrintLabor += printLabor;

    // 4. Sewing stage labor (أجور عمالة خطوط الخياطة الفعلية)
    const sewApproved = !!(order.sewingApprovedAt || sewStatuses.includes(order.status) || (order.batches && order.batches.some(b => b.sewingData?.status === 'مكتمل' || b.sewingData?.approvedAt)));
    const { totalLaborCost, internalLaborCost } = calculateActualSewingLaborDetails(order);
    // الأجور المستحقة لعمال المصنع (الداخلي، أو الإجمالي إذا كان الأمر تشغيل داخلي بالكامل)
    const sewLabor = sewApproved ? (internalLaborCost > 0 ? internalLaborCost : totalLaborCost) : 0;
    if (sewApproved) totalSewingLabor += sewLabor;

    // 5. Finishing & 6. Ironing labor (أجور التشطيب والمكواة الفعلية المسجلة بالباتشات)
    const finishApproved = !!(order.finishingApprovedAt || finishStatuses.includes(order.status) || (order.batches && order.batches.some(b => b.finishingData?.status === 'مكتمل' || b.finishingData?.approvedAt)));
    const ironApproved = !!(order.ironingApprovedAt || ironStatuses.includes(order.status) || (order.batches && order.batches.some(b => b.ironingData?.status === 'مكتمل' || b.ironingData?.approvedAt)));
    const { totalActualFinishingLabor, totalActualIroningLabor } = calculateActualFinishingLaborDetails(order);
    
    const finishLabor = finishApproved ? totalActualFinishingLabor : 0;
    if (finishApproved) totalFinishingLabor += finishLabor;

    const ironLabor = ironApproved ? totalActualIroningLabor : 0;
    if (ironApproved) totalIroningLabor += ironLabor;

    const totalOrderLabor = Math.round((cutLabor + prepLabor + printLabor + sewLabor + finishLabor + ironLabor) * 100) / 100;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      styleName: order.styleName || 'غير محدد',
      customerName: order.customerName || 'عميل عام',
      totalPieces: actualPieces,
      cutLabor,
      cutApproved,
      cutApprovedAt: order.cutApprovedAt || order.cutData?.approvedAt,
      prepLabor,
      prepApproved,
      prepApprovedAt: order.prepApprovedAt,
      sewingLabor: sewLabor,
      sewingApproved: sewApproved,
      sewingApprovedAt: order.sewingApprovedAt,
      printLabor,
      printApproved,
      printApprovedAt: order.printEmbroideryApprovedAt,
      finishingLabor: finishLabor,
      finishingApproved: finishApproved,
      finishingApprovedAt: order.finishingApprovedAt,
      ironingLabor: ironLabor,
      ironingApproved: ironApproved,
      ironingApprovedAt: order.ironingApprovedAt,
      totalOrderLabor
    };
  });

  const totalAccrued = Math.round((totalCutLabor + totalPrepLabor + totalSewingLabor + totalPrintLabor + totalFinishingLabor + totalIroningLabor) * 100) / 100;

  // Calculate settlements: disbursements made via payroll
  const totalSettledFromPayroll = disbursements
    .filter(d => d.status !== 'cancelled')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Also check if any treasury transactions were directly posted to 2131
  const treasuryTrxs = getTreasuryTransactions();
  const directWagesTrxTotal = treasuryTrxs
    .filter(t => t.status !== 'cancelled' && t.targetAccountCode === '2131' && !t.voucherNumber?.startsWith('PAYROLL-'))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalSettled = Math.round((totalSettledFromPayroll + directWagesTrxTotal) * 100) / 100;
  const netPendingSettlement = Math.max(0, Math.round((totalAccrued - totalSettled) * 100) / 100);

  return {
    cutLabor: totalCutLabor,
    prepLabor: totalPrepLabor,
    sewingLabor: totalSewingLabor,
    printLabor: totalPrintLabor,
    finishingLabor: totalFinishingLabor,
    ironingLabor: totalIroningLabor,
    totalAccrued,
    totalSettled,
    netPendingSettlement,
    orderItems: orderItems.filter(o => o.totalOrderLabor > 0)
  };
}

/**
 * Approve and disburse weekly payroll, settling accrued wages (حساب 2131).
 */
export async function approveWeeklyPayrollDisbursement(data: {
  amount: number;
  paymentChannel: 'cash' | 'bank';
  fundAccountCode: string;
  fundAccountName: string;
  weekTitle: string;
  notes?: string;
  beneficiaryCount?: number;
}): Promise<PayrollDisbursement> {
  const nowIso = new Date().toISOString();
  const dateStr = nowIso.split('T')[0];
  const timeStr = new Date().toTimeString().slice(0, 8);
  const activeUser = getActiveSessionUser();
  const disbursementNumber = generatePayrollDisbursementNumber();
  const verificationCode = `APV-PAY-${dateStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const activeWorkers = getLabor().filter(w => w.isActive !== false);
  const beneficiaryCount = data.beneficiaryCount || activeWorkers.length || 15;

  // 1. Create Treasury Cash Outflow / Payment Voucher targeting 2131 (Accrued Wages)
  const treasuryTrx = addTreasuryTransaction({
    voucherNumber: disbursementNumber.replace('PAYROLL-', 'PAY-W-'),
    type: 'other_expense',
    date: dateStr,
    time: timeStr,
    amount: data.amount,
    paymentChannel: data.paymentChannel,
    fundAccountCode: data.fundAccountCode,
    fundAccountName: data.fundAccountName,
    targetAccountCode: '2131',
    targetAccountName: 'أجور ومرتبات عمال الإنتاج والمصنع المستحقة',
    categoryLabel: 'صرف وتسوية مسير الرواتب الأسبوعية',
    description: `صرف وتسوية مسير رواتب وأجور عمال الإنتاج والمصنع (${data.weekTitle}) - إقفال الأجور المستحقة`,
    beneficiary: `عمال وفنيو الإنتاج والتصنيع (${beneficiaryCount} عامل)`,
    notes: data.notes || `اعتماد مسير صرف أجور العمال الأسبوعي وتسوية رصيد الأجور المستحقة بحساب 2131`,
    status: 'confirmed',
    verificationCode
  });

  // 2. Centrally record in system audit log
  recordSystemApproval({
    actionType: 'treasury_payment',
    documentId: disbursementNumber,
    documentNumber: disbursementNumber,
    title: `اعتماد صرف وتسوية مسير الرواتب الأسبوعية - ${data.weekTitle}`,
    details: `تم اعتماد صرف مبلغ ${data.amount.toLocaleString('ar-EG')} ج.م وتسوية حساب أجور ومرتبات عمال الإنتاج (2131) من ${data.fundAccountName} لعدد ${beneficiaryCount} عامل.`,
    amount: data.amount,
    counterpartyName: `عمال الإنتاج والمصنع (${beneficiaryCount} عامل)`,
    costCenter: 'صالة تصنيع وعنابر الإنتاج',
    stageName: 'الموارد البشرية والرواتب الأسبوعية',
    notes: `تم توليد سند الصرف ${treasuryTrx.voucherNumber} والقيد المحاسبي المزدوج التلقائي لتسوية الأجور المستحقة.`
  });

  // 3. Save to payroll disbursements list
  const newDisbursement: PayrollDisbursement = {
    id: `payroll_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    disbursementNumber,
    weekTitle: data.weekTitle,
    date: dateStr,
    time: timeStr,
    amount: data.amount,
    paymentChannel: data.paymentChannel,
    fundAccountCode: data.fundAccountCode,
    fundAccountName: data.fundAccountName,
    targetAccountCode: '2131',
    targetAccountName: 'أجور ومرتبات عمال الإنتاج والمصنع المستحقة',
    beneficiaryCount,
    status: 'confirmed',
    treasuryVoucherNumber: treasuryTrx.voucherNumber,
    treasuryTransactionId: treasuryTrx.id,
    verificationCode,
    notes: data.notes,
    approvedBy: {
      userId: activeUser.id,
      userName: activeUser.fullName || activeUser.username,
      userRole: activeUser.role,
      userRoleLabel: (ROLE_LABELS as any)[activeUser.role]?.title || 'المدير المالي والمسؤول المعتمد',
      approvedAt: nowIso
    },
    createdAt: nowIso
  };

  const list = getPayrollDisbursements();
  list.unshift(newDisbursement);
  savePayrollDisbursements(list);

  return newDisbursement;
}
