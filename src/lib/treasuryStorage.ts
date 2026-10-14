import { TreasuryTransaction, TreasuryTransactionType, TreasuryMetrics } from '../types/treasury';
import { getSalesInvoices, saveSalesInvoices } from './salesStorage';
import { getPurchases, savePurchases } from './purchasesStorage';
import { getActiveSessionUser, ROLE_LABELS } from './usersStorage';
import { recordSystemApproval } from './auditStorage';

const TREASURY_KEY = 'accounting_treasury_transactions_v1';

function getItems<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Failed to parse ${key}:`, error);
    return [];
  }
}

function saveItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

const getDefaultTreasuryTransactions = (): TreasuryTransaction[] => {
  return [
    {
      id: 'trx_init_1',
      voucherNumber: 'REC-2026-001',
      type: 'customer_collection',
      date: '2026-09-22',
      time: '11:30:00',
      amount: 45000,
      paymentChannel: 'cash',
      fundAccountCode: '1211',
      fundAccountName: 'الخزينة الرئيسية للمصنع',
      partyId: 'cust_1',
      partyName: 'سلسلة متاجر النخبة للأزياء',
      targetAccountCode: '1221',
      targetAccountName: 'عملاء مبيعات الملابس الجاهزة',
      relatedInvoiceId: 'sal_inv_1',
      relatedInvoiceNumber: 'SAL-2026-001',
      referenceNumber: 'CHQ-44910',
      categoryLabel: 'تحصيل فاتورة مبيعات',
      description: 'تحصيل دفعة نقدية من حساب فاتورة مبيعات رقم SAL-2026-001',
      beneficiary: 'أ. محمود فوزي - مدير المشتريات',
      status: 'confirmed',
      createdBy: {
        userName: 'أمين الخزينة',
        userRole: 'الخزينة والمقبوضات'
      },
      approvedBy: {
        userId: 'user_accountant',
        userName: 'أ. خالد فؤاد',
        userRole: 'accountant',
        userRoleLabel: 'رئيس الحسابات والتكاليف',
        approvedAt: '2026-09-22T11:30:00.000Z'
      },
      approvedAt: '2026-09-22T11:30:00.000Z',
      approvalDate: '2026-09-22',
      approvalTime: '11:30:00',
      verificationCode: 'APV-20260922-8142',
      createdAt: '2026-09-22T11:30:00.000Z'
    },
    {
      id: 'trx_init_2',
      voucherNumber: 'PAY-2026-001',
      type: 'supplier_payment',
      date: '2026-09-23',
      time: '14:15:00',
      amount: 30000,
      paymentChannel: 'bank',
      fundAccountCode: '1213',
      fundAccountName: 'البنك - حساب جاري المصنع',
      partyId: 'supp_1',
      partyName: 'شركة النيل للغزل والمنسوجات',
      targetAccountCode: '2111',
      targetAccountName: 'موردو الأقمشة والغزول والمنسوجات',
      relatedInvoiceId: 'pur_1',
      relatedInvoiceNumber: 'PUR-2026-001',
      referenceNumber: 'TRF-90218',
      categoryLabel: 'سداد دفعة مورد',
      description: 'سداد تحويل بنكي للمورد شركة النيل عن توريد أقمشة قطن سنجل جيرسي',
      beneficiary: 'شركة النيل للغزل والمنسوجات',
      status: 'confirmed',
      createdBy: {
        userName: 'محاسب المدفوعات',
        userRole: 'الحسابات العامة'
      },
      approvedBy: {
        userId: 'user_admin',
        userName: 'المدير العام للمصنع (Admin)',
        userRole: 'admin',
        userRoleLabel: 'مدير عام النظام (Super Admin)',
        approvedAt: '2026-09-23T14:15:00.000Z'
      },
      approvedAt: '2026-09-23T14:15:00.000Z',
      approvalDate: '2026-09-23',
      approvalTime: '14:15:00',
      verificationCode: 'APV-20260923-3921',
      createdAt: '2026-09-23T14:15:00.000Z'
    },
    {
      id: 'trx_init_3',
      voucherNumber: 'REC-2026-002',
      type: 'other_revenue',
      date: '2026-09-24',
      time: '16:00:00',
      amount: 8500,
      paymentChannel: 'cash',
      fundAccountCode: '1211',
      fundAccountName: 'الخزينة الرئيسية للمصنع',
      targetAccountCode: '413',
      targetAccountName: 'مبيعات عوادم وبواقي قص وهالك أقمشة',
      referenceNumber: 'SCRAP-088',
      categoryLabel: 'بيع عوادم وهالك أقمشة',
      description: 'إيراد بيع بواقي قص وسكراب أقمشة قطن وميلتون من عنبر القص نقداً',
      beneficiary: 'تاجر مخلفات الأقمشة (أبو كريم)',
      status: 'confirmed',
      createdBy: {
        userName: 'مشرف عنبر القص',
        userRole: 'الإنتاج والتشغيل'
      },
      approvedBy: {
        userId: 'user_cutter',
        userName: 'أ. محمود البنا',
        userRole: 'cutter',
        userRoleLabel: 'مسؤول قسم القص والتفصيل',
        approvedAt: '2026-09-24T16:00:00.000Z'
      },
      approvedAt: '2026-09-24T16:00:00.000Z',
      approvalDate: '2026-09-24',
      approvalTime: '16:00:00',
      verificationCode: 'APV-20260924-1184',
      createdAt: '2026-09-24T16:00:00.000Z'
    },
    {
      id: 'trx_init_4',
      voucherNumber: 'PAY-2026-002',
      type: 'other_expense',
      date: '2026-09-25',
      time: '10:45:00',
      amount: 4200,
      paymentChannel: 'cash',
      fundAccountCode: '1211',
      fundAccountName: 'الخزينة الرئيسية للمصنع',
      targetAccountCode: '521',
      targetAccountName: 'قوى محركة وكهرباء ومياه المصنع',
      referenceNumber: 'ELEC-INV-99',
      categoryLabel: 'مصروفات مرافق وطاقة',
      description: 'سداد فاتورة استهلاك الكهرباء لعنابر الإنتاج والماكينات لشهر سبتمبر',
      beneficiary: 'شركة شمال القاهرة لتوزيع الكهرباء',
      status: 'confirmed',
      createdBy: {
        userName: 'أمين الخزينة',
        userRole: 'الخزينة والمقبوضات'
      },
      approvedBy: {
        userId: 'user_accountant',
        userName: 'أ. خالد فؤاد',
        userRole: 'accountant',
        userRoleLabel: 'رئيس الحسابات والتكاليف',
        approvedAt: '2026-09-25T10:45:00.000Z'
      },
      approvedAt: '2026-09-25T10:45:00.000Z',
      approvalDate: '2026-09-25',
      approvalTime: '10:45:00',
      verificationCode: 'APV-20260925-5021',
      createdAt: '2026-09-25T10:45:00.000Z'
    },
    {
      id: 'trx_init_5',
      voucherNumber: 'PAY-2026-003',
      type: 'other_expense',
      date: '2026-09-26',
      time: '13:00:00',
      amount: 2500,
      paymentChannel: 'cash',
      fundAccountCode: '1211',
      fundAccountName: 'الخزينة الرئيسية للمصنع',
      targetAccountCode: '523',
      targetAccountName: 'صيانة وقطع غيار وزيوت ماكينات الإنتاج',
      referenceNumber: 'MAINT-302',
      categoryLabel: 'صيانة وتشغيل ماكينات',
      description: 'شراء زيوت وسير ماكينات أوفر وقطع غيار عاجلة لخط الخياطة',
      beneficiary: 'ورشة الأمل لصيانة ماكينات الملابس',
      status: 'confirmed',
      createdBy: {
        userName: 'مسؤول الصيانة الفنية',
        userRole: 'الصيانة'
      },
      approvedBy: {
        userId: 'user_admin',
        userName: 'المدير العام للمصنع (Admin)',
        userRole: 'admin',
        userRoleLabel: 'مدير عام النظام (Super Admin)',
        approvedAt: '2026-09-26T13:00:00.000Z'
      },
      approvedAt: '2026-09-26T13:00:00.000Z',
      approvalDate: '2026-09-26',
      approvalTime: '13:00:00',
      verificationCode: 'APV-20260926-7281',
      createdAt: '2026-09-26T13:00:00.000Z'
    }
  ];
};

export const getTreasuryTransactions = (): TreasuryTransaction[] => {
  const raw = localStorage.getItem(TREASURY_KEY);
  if (raw === null) {
    const defaults = getDefaultTreasuryTransactions();
    saveItems(TREASURY_KEY, defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse treasury transactions:', error);
    return [];
  }
};

export const saveTreasuryTransactions = (items: TreasuryTransaction[]): void => {
  saveItems(TREASURY_KEY, items);
  window.dispatchEvent(new CustomEvent('treasury_transactions_updated'));
  window.dispatchEvent(new CustomEvent('journal_entries_updated'));
};

export const deleteAllTreasuryTransactions = (): void => {
  saveTreasuryTransactions([]);
};

export const resetTreasuryTransactionsToDefaults = (): void => {
  const defaults = getDefaultTreasuryTransactions();
  saveTreasuryTransactions(defaults);
};

export const generateVoucherNumber = (type: TreasuryTransactionType): string => {
  const transactions = getTreasuryTransactions();
  const year = new Date().getFullYear();
  const isRevenue = type === 'customer_collection' || type === 'other_revenue';
  const prefix = isRevenue ? `REC-${year}-` : `PAY-${year}-`;

  const numbers = transactions
    .filter(t => t.voucherNumber && t.voucherNumber.startsWith(prefix))
    .map(t => {
      const numPart = t.voucherNumber.replace(prefix, '');
      const parsed = parseInt(numPart, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
};

export const addTreasuryTransaction = (
  transaction: Omit<TreasuryTransaction, 'id' | 'createdAt' | 'voucherNumber'> & {
    voucherNumber?: string;
  }
): TreasuryTransaction => {
  const transactions = getTreasuryTransactions();
  const newVoucherNumber = transaction.voucherNumber || generateVoucherNumber(transaction.type);
  const activeUser = getActiveSessionUser();
  const dateStr = transaction.date || new Date().toISOString().split('T')[0];
  const timeStr = transaction.time || new Date().toTimeString().slice(0, 8);
  const nowIso = new Date().toISOString();
  const verificationCode = transaction.verificationCode || `APV-${dateStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const approverInfo = transaction.approvedBy || {
    userId: activeUser.id,
    userName: activeUser.fullName || activeUser.username,
    userRole: activeUser.role,
    userRoleLabel: activeUser.roleTitle || (ROLE_LABELS as any)[activeUser.role]?.title || 'مسؤول معتمد',
    approvedAt: nowIso
  };

  const newRecord: TreasuryTransaction = {
    ...transaction,
    id: `trx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    voucherNumber: newVoucherNumber,
    date: dateStr,
    time: timeStr,
    createdAt: nowIso,
    status: transaction.status || 'confirmed',
    approvedBy: approverInfo,
    approvedAt: transaction.approvedAt || nowIso,
    approvalDate: transaction.approvalDate || dateStr,
    approvalTime: transaction.approvalTime || timeStr,
    verificationCode
  };

  // Centrally record this approval in the system audit trail
  try {
    const isReceipt = transaction.type === 'customer_collection' || transaction.type === 'other_revenue';
    recordSystemApproval({
      actionType: isReceipt ? 'treasury_receipt' : 'treasury_payment',
      documentId: newRecord.id,
      documentNumber: newVoucherNumber,
      title: `${isReceipt ? 'سند قبض' : 'سند صرف'} - ${transaction.categoryLabel || 'معاملة خزينة'}`,
      details: `${transaction.description || ''} | الحساب: ${transaction.targetAccountName} | القناة: ${transaction.fundAccountName}`,
      amount: transaction.amount,
      counterpartyName: transaction.partyName || transaction.beneficiary,
      costCenter: transaction.costCenterId,
      customDate: dateStr,
      customTime: timeStr,
      customUser: {
        id: approverInfo.userId || activeUser.id,
        name: approverInfo.userName,
        role: approverInfo.userRole || activeUser.role,
        roleTitle: approverInfo.userRoleLabel || activeUser.roleTitle
      }
    });
  } catch (err) {
    console.error('Failed to log approval to audit:', err);
  }

  // If transaction settled a sales invoice, update sales invoice paidAmount & status
  if (transaction.type === 'customer_collection' && transaction.relatedInvoiceId) {
    const invoices = getSalesInvoices();
    const invIndex = invoices.findIndex(i => i.id === transaction.relatedInvoiceId);
    if (invIndex >= 0) {
      const inv = invoices[invIndex];
      const newPaid = (Number(inv.paidAmount) || 0) + Number(transaction.amount);
      const grandTotal = Number(inv.grandTotal) || 0;
      const newRemaining = Math.max(0, grandTotal - newPaid);
      const newStatus = newRemaining <= 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid');
      
      invoices[invIndex] = {
        ...inv,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        paymentStatus: newStatus,
        updatedAt: new Date().toISOString()
      };
      saveSalesInvoices([...invoices]);
    }
  }

  // If transaction settled a purchase invoice, update purchase invoice paidAmount & status
  if (transaction.type === 'supplier_payment' && transaction.relatedInvoiceId) {
    const purchases = getPurchases();
    const purIndex = purchases.findIndex(p => p.id === transaction.relatedInvoiceId);
    if (purIndex >= 0) {
      const pur = purchases[purIndex];
      const newPaid = (Number(pur.paidAmount) || 0) + Number(transaction.amount);
      const grandTotal = Number(pur.grandTotal) || 0;
      const newRemaining = Math.max(0, grandTotal - newPaid);
      const newStatus = newRemaining <= 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid');
      
      purchases[purIndex] = {
        ...pur,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        paymentStatus: newStatus,
        updatedAt: new Date().toISOString()
      };
      savePurchases([...purchases]);
    }
  }

  transactions.unshift(newRecord);
  saveTreasuryTransactions(transactions);
  return newRecord;
};

export const deleteTreasuryTransaction = (id: string): void => {
  const transactions = getTreasuryTransactions();
  const filtered = transactions.filter(t => t.id !== id);
  saveTreasuryTransactions(filtered);
};

export const calculateTreasuryMetrics = (transactions: TreasuryTransaction[]): TreasuryMetrics => {
  let totalVaultCash = 0;
  let totalBankCash = 0;
  let totalCustomerCollections = 0;
  let totalOtherRevenues = 0;
  let totalSupplierPayments = 0;
  let totalOtherExpenses = 0;

  transactions.forEach(t => {
    if (t.status === 'cancelled') return;
    const amt = Number(t.amount) || 0;

    const isRevenue = t.type === 'customer_collection' || t.type === 'other_revenue';
    const isExpense = t.type === 'supplier_payment' || t.type === 'other_expense';

    if (t.type === 'customer_collection') totalCustomerCollections += amt;
    if (t.type === 'other_revenue') totalOtherRevenues += amt;
    if (t.type === 'supplier_payment') totalSupplierPayments += amt;
    if (t.type === 'other_expense') totalOtherExpenses += amt;

    // Vault vs Bank calculation
    if (t.fundAccountCode === '1211' || t.fundAccountCode === '1212') {
      if (isRevenue) totalVaultCash += amt;
      if (isExpense) totalVaultCash -= amt;
    } else if (t.fundAccountCode === '1213') {
      if (isRevenue) totalBankCash += amt;
      if (isExpense) totalBankCash -= amt;
    }
  });

  const totalRevenues = totalCustomerCollections + totalOtherRevenues;
  const totalExpenses = totalSupplierPayments + totalOtherExpenses;
  const netCashFlow = totalRevenues - totalExpenses;

  return {
    totalVaultCash,
    totalBankCash,
    totalCustomerCollections,
    totalOtherRevenues,
    totalRevenues,
    totalSupplierPayments,
    totalOtherExpenses,
    totalExpenses,
    netCashFlow,
    transactionsCount: transactions.length
  };
};
