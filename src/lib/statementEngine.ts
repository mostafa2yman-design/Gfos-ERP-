import { CustomerSupplier } from '../types';
import { getCustomersSuppliers } from './accountingStorage';
import { getSalesInvoices, getSalesReturns } from './salesStorage';
import { getPurchases, getPurchaseReturns } from './purchasesStorage';
import { getTreasuryTransactions } from './treasuryStorage';
import { getAllJournalEntries } from './journalEngine';

export type StatementDocumentType =
  | 'opening_balance'
  | 'sales_invoice'
  | 'sales_return'
  | 'customer_collection'
  | 'purchase_invoice'
  | 'purchase_return'
  | 'supplier_payment'
  | 'journal_entry';

export interface StatementMovement {
  id: string;
  date: string;
  time?: string;
  documentNumber: string;
  documentType: StatementDocumentType;
  documentTypeLabel: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  paymentMethod?: string;
  status?: string;
  referenceId?: string;
  rawItem?: any;
}

export interface StatementAging {
  current: number; // 0-30 days
  days30to60: number; // 31-60 days
  days60to90: number; // 61-90 days
  over90: number; // 90+ days
}

export interface CustomerStatementReport {
  customer: CustomerSupplier;
  dateFrom?: string;
  dateTo?: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  netChange: number;
  endingBalance: number;
  balanceNature: 'debit' | 'credit' | 'settled';
  balanceStatusLabel: string;
  creditLimit?: number;
  creditRemaining?: number;
  creditUtilizationPercent?: number;
  movements: StatementMovement[];
  counts: {
    invoices: number;
    returns: number;
    collections: number;
    journalEntries: number;
    total: number;
  };
  aging: StatementAging;
}

export interface SupplierStatementReport {
  supplier: CustomerSupplier;
  dateFrom?: string;
  dateTo?: string;
  openingBalance: number;
  totalCredit: number;
  totalDebit: number;
  netChange: number;
  endingBalance: number;
  balanceNature: 'payable' | 'receivable' | 'settled';
  balanceStatusLabel: string;
  movements: StatementMovement[];
  counts: {
    invoices: number;
    returns: number;
    payments: number;
    journalEntries: number;
    total: number;
  };
  aging: StatementAging;
}

// Calculate aging buckets based on unpaid movements
function calculateAging(movements: StatementMovement[], targetNature: 'customer' | 'supplier'): StatementAging {
  const today = new Date();
  const aging: StatementAging = {
    current: 0,
    days30to60: 0,
    days60to90: 0,
    over90: 0
  };

  movements.forEach(m => {
    const value = targetNature === 'customer' ? m.debit : m.credit;
    if (value <= 0) return;

    const moveDate = new Date(m.date);
    const diffTime = Math.abs(today.getTime() - moveDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      aging.current += value;
    } else if (diffDays <= 60) {
      aging.days30to60 += value;
    } else if (diffDays <= 90) {
      aging.days60to90 += value;
    } else {
      aging.over90 += value;
    }
  });

  return aging;
}

/**
 * Generate full statement of account for a specific customer
 */
export async function getCustomerStatement(
  customerId: string,
  dateFrom?: string,
  dateTo?: string,
  movementTypeFilter: string = 'all'
): Promise<CustomerStatementReport | null> {
  const allParties = getCustomersSuppliers();
  const customer = allParties.find(p => p.id === customerId);
  if (!customer) return null;

  // 1. Initial Opening Balance
  let initialOpening = 0;
  if (customer.openingBalance && customer.openingBalance > 0) {
    initialOpening = customer.openingBalanceType === 'credit' 
      ? -customer.openingBalance 
      : customer.openingBalance;
  }

  // 2. Fetch all related documents
  const allSalesInvoices = getSalesInvoices().filter(inv => inv.customerId === customerId);
  const allSalesReturns = getSalesReturns().filter(ret => ret.customerId === customerId);
  const allCollections = getTreasuryTransactions().filter(
    trx => trx.partyId === customerId && trx.type === 'customer_collection' && trx.status === 'confirmed'
  );
  let allJournals: any[] = [];
  try {
    allJournals = await getAllJournalEntries();
  } catch (e) {
    console.error('Failed to load journals for customer statement:', e);
  }

  interface RawEvent {
    id: string;
    date: string;
    time?: string;
    documentNumber: string;
    documentType: StatementDocumentType;
    documentTypeLabel: string;
    description: string;
    debit: number;
    credit: number;
    paymentMethod?: string;
    status?: string;
    referenceId?: string;
    rawItem?: any;
  }

  const rawEvents: RawEvent[] = [];

  // A. Sales Invoices -> Debit (مدين)
  allSalesInvoices.forEach(inv => {
    const payMethod = 
      inv.paymentMethod === 'cash' ? 'نقدي' : 
      inv.paymentMethod === 'bank' ? 'تحويل بنكي' : 
      inv.paymentMethod === 'cheque' ? 'شيك' : 'آجل';

    rawEvents.push({
      id: inv.id,
      date: inv.date,
      time: (inv as any).approvalTime || '10:00:00',
      documentNumber: inv.invoiceNumber,
      documentType: 'sales_invoice',
      documentTypeLabel: 'فاتورة مبيعات',
      description: `فاتورة بيع ملابس جاهزة #${inv.invoiceNumber} - عدد ${inv.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0} قطعة`,
      debit: inv.grandTotal || 0,
      credit: 0,
      paymentMethod: payMethod,
      status: inv.paymentStatus === 'paid' ? 'مسددة' : inv.paymentStatus === 'partial' ? 'مسددة جزئياً' : 'غير مسددة',
      referenceId: inv.id,
      rawItem: inv
    });
  });

  // B. Sales Returns -> Credit (دائن)
  allSalesReturns.forEach(ret => {
    const refMethod = 
      ret.refundMethod === 'cash' ? 'نقدي' : 
      ret.refundMethod === 'bank' ? 'تحويل بنكي' : 'خصم من الرصيد';

    rawEvents.push({
      id: ret.id,
      date: ret.date,
      time: '12:00:00',
      documentNumber: ret.returnNumber,
      documentType: 'sales_return',
      documentTypeLabel: 'مردودات مبيعات',
      description: `إشعار دائن مردودات مبيعات #${ret.returnNumber}${ret.originalInvoiceNumber ? ` (فاتورة ${ret.originalInvoiceNumber})` : ''}`,
      debit: 0,
      credit: ret.grandTotal || 0,
      paymentMethod: refMethod,
      status: 'معتمد',
      referenceId: ret.id,
      rawItem: ret
    });
  });

  // C. Treasury Collections -> Credit (دائن)
  allCollections.forEach(trx => {
    const chanMethod = 
      trx.paymentChannel === 'cash' ? 'نقدية بالخزينة' : 
      trx.paymentChannel === 'bank' ? 'تحويل بنكي' : 'شيك بنكي';

    rawEvents.push({
      id: trx.id,
      date: trx.date,
      time: trx.time || '14:00:00',
      documentNumber: trx.voucherNumber,
      documentType: 'customer_collection',
      documentTypeLabel: 'سند قبض خزينة',
      description: trx.description || `سند قبض نقدية/شيك من العميل (${trx.voucherNumber})`,
      debit: 0,
      credit: trx.amount || 0,
      paymentMethod: chanMethod,
      status: 'معتمد ومحصل',
      referenceId: trx.id,
      rawItem: trx
    });
  });

  // D. Related Journal Entries
  allJournals.forEach(entry => {
    if (entry.status !== 'posted' || !entry.lines) return;
    entry.lines.forEach((line: any) => {
      const matchesParty = 
        (line.description && line.description.includes(customer.name)) ||
        (entry.description && entry.description.includes(customer.name));
      if (matchesParty && (line.accountCode === '1221' || line.accountCode?.startsWith('122'))) {
        rawEvents.push({
          id: `${entry.id}_${line.id}`,
          date: entry.date,
          time: '16:00:00',
          documentNumber: entry.entryNumber,
          documentType: 'journal_entry',
          documentTypeLabel: 'قيد يومية تسوية',
          description: line.description || entry.description,
          debit: line.debit || 0,
          credit: line.credit || 0,
          status: 'مرحل',
          referenceId: entry.id,
          rawItem: entry
        });
      }
    });
  });

  // Sort chronologically ascending
  rawEvents.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return (a.time || '').localeCompare(b.time || '');
  });

  // Calculate opening balance before `dateFrom`
  let calculatedOpening = initialOpening;
  const filteredEvents: RawEvent[] = [];

  rawEvents.forEach(evt => {
    if (dateFrom && evt.date < dateFrom) {
      calculatedOpening += (evt.debit - evt.credit);
    } else {
      if (!dateTo || evt.date <= dateTo) {
        filteredEvents.push(evt);
      }
    }
  });

  // Apply movement type filter
  const finalFilteredEvents = filteredEvents.filter(evt => {
    if (movementTypeFilter === 'all') return true;
    if (movementTypeFilter === 'sales_invoice') return evt.documentType === 'sales_invoice';
    if (movementTypeFilter === 'sales_return') return evt.documentType === 'sales_return';
    if (movementTypeFilter === 'customer_collection') return evt.documentType === 'customer_collection';
    if (movementTypeFilter === 'journal_entry') return evt.documentType === 'journal_entry';
    return true;
  });

  // Compute running balance for each movement
  let runningBalance = calculatedOpening;
  let totalDebit = 0;
  let totalCredit = 0;

  const movements: StatementMovement[] = finalFilteredEvents.map(evt => {
    runningBalance += (evt.debit - evt.credit);
    totalDebit += evt.debit;
    totalCredit += evt.credit;
    return {
      ...evt,
      balance: runningBalance
    };
  });

  const endingBalance = runningBalance;
  const netChange = totalDebit - totalCredit;

  let balanceNature: 'debit' | 'credit' | 'settled' = 'settled';
  let balanceStatusLabel = 'الحساب مطابق ومسدد (رصيد صفر)';
  if (endingBalance > 0.001) {
    balanceNature = 'debit';
    balanceStatusLabel = `مستحق على العميل (مدين) بمبلغ ${endingBalance.toLocaleString('ar-EG')} ج.م`;
  } else if (endingBalance < -0.001) {
    balanceNature = 'credit';
    balanceStatusLabel = `رصيد دائن لصالح العميل بمبلغ ${Math.abs(endingBalance).toLocaleString('ar-EG')} ج.م`;
  }

  // Credit limit calculations
  const creditLimit = customer.creditLimit || 0;
  const creditRemaining = creditLimit > 0 ? Math.max(0, creditLimit - Math.max(0, endingBalance)) : undefined;
  const creditUtilizationPercent = creditLimit > 0 ? Math.min(100, Math.round((Math.max(0, endingBalance) / creditLimit) * 100)) : undefined;

  const aging = calculateAging(movements, 'customer');

  return {
    customer,
    dateFrom,
    dateTo,
    openingBalance: calculatedOpening,
    totalDebit,
    totalCredit,
    netChange,
    endingBalance,
    balanceNature,
    balanceStatusLabel,
    creditLimit,
    creditRemaining,
    creditUtilizationPercent,
    movements,
    counts: {
      invoices: movements.filter(m => m.documentType === 'sales_invoice').length,
      returns: movements.filter(m => m.documentType === 'sales_return').length,
      collections: movements.filter(m => m.documentType === 'customer_collection').length,
      journalEntries: movements.filter(m => m.documentType === 'journal_entry').length,
      total: movements.length
    },
    aging
  };
}

/**
 * Generate full statement of account for a specific supplier
 */
export async function getSupplierStatement(
  supplierId: string,
  dateFrom?: string,
  dateTo?: string,
  movementTypeFilter: string = 'all'
): Promise<SupplierStatementReport | null> {
  const allParties = getCustomersSuppliers();
  const supplier = allParties.find(p => p.id === supplierId);
  if (!supplier) return null;

  // 1. Initial Opening Balance (Credit is normal liability: we owe supplier)
  let initialOpening = 0;
  if (supplier.openingBalance && supplier.openingBalance > 0) {
    initialOpening = supplier.openingBalanceType === 'debit' 
      ? -supplier.openingBalance 
      : supplier.openingBalance;
  }

  // 2. Fetch all related documents
  const allPurchases = getPurchases().filter(p => p.supplierId === supplierId);
  const allPurchaseReturns = getPurchaseReturns().filter(ret => ret.supplierId === supplierId);
  const allPayments = getTreasuryTransactions().filter(
    trx => trx.partyId === supplierId && trx.type === 'supplier_payment' && trx.status === 'confirmed'
  );
  let allJournals: any[] = [];
  try {
    allJournals = await getAllJournalEntries();
  } catch (e) {
    console.error('Failed to load journals for supplier statement:', e);
  }

  interface RawEvent {
    id: string;
    date: string;
    time?: string;
    documentNumber: string;
    documentType: StatementDocumentType;
    documentTypeLabel: string;
    description: string;
    debit: number;
    credit: number;
    paymentMethod?: string;
    status?: string;
    referenceId?: string;
    rawItem?: any;
  }

  const rawEvents: RawEvent[] = [];

  // A. Purchase Invoices -> Credit (دائن: يزيد المستحق للمورد)
  allPurchases.forEach(inv => {
    const payMethod = 
      inv.paymentMethod === 'cash' ? 'نقدي' : 
      inv.paymentMethod === 'bank' ? 'تحويل بنكي' : 
      inv.paymentMethod === 'cheque' ? 'شيك' : 'آجل';

    rawEvents.push({
      id: inv.id,
      date: inv.date,
      time: (inv as any).time || '09:30:00',
      documentNumber: inv.invoiceNumber,
      documentType: 'purchase_invoice',
      documentTypeLabel: 'فاتورة مشتريات خامات',
      description: `فاتورة توريد خامات #${inv.invoiceNumber} - عدد أصناف: ${inv.items?.length || 0}`,
      debit: 0,
      credit: inv.grandTotal || 0,
      paymentMethod: payMethod,
      status: inv.paymentStatus === 'paid' ? 'مسددة' : inv.paymentStatus === 'partial' ? 'مسددة جزئياً' : 'مستحقة السداد',
      referenceId: inv.id,
      rawItem: inv
    });
  });

  // B. Purchase Returns -> Debit (مدين: يقلل المستحق للمورد)
  allPurchaseReturns.forEach(ret => {
    const refMethod = 
      ret.refundMethod === 'cash' ? 'نقدي' : 
      ret.refundMethod === 'bank' ? 'تحويل بنكي' : 'خصم من الرصيد';

    rawEvents.push({
      id: ret.id,
      date: ret.date,
      time: '11:00:00',
      documentNumber: ret.returnNumber,
      documentType: 'purchase_return',
      documentTypeLabel: 'مردودات مشتريات',
      description: `إشعار مدين مردودات مشتريات #${ret.returnNumber}${ret.originalInvoiceNumber ? ` (فاتورة ${ret.originalInvoiceNumber})` : ''}`,
      debit: ret.grandTotal || 0,
      credit: 0,
      paymentMethod: refMethod,
      status: 'معتمد',
      referenceId: ret.id,
      rawItem: ret
    });
  });

  // C. Treasury Payments to Supplier -> Debit (مدين: سداد يقلل المستحق للمورد)
  allPayments.forEach(trx => {
    const chanMethod = 
      trx.paymentChannel === 'cash' ? 'نقدية بالخزينة' : 
      trx.paymentChannel === 'bank' ? 'تحويل بنكي' : 'شيك بنكي';

    rawEvents.push({
      id: trx.id,
      date: trx.date,
      time: trx.time || '15:00:00',
      documentNumber: trx.voucherNumber,
      documentType: 'supplier_payment',
      documentTypeLabel: 'سند صرف خزينة للمورد',
      description: trx.description || `سند صرف نقدية/شيك للمورد (${trx.voucherNumber})`,
      debit: trx.amount || 0,
      credit: 0,
      paymentMethod: chanMethod,
      status: 'معتمد ومصروف',
      referenceId: trx.id,
      rawItem: trx
    });
  });

  // D. Related Journal Entries
  allJournals.forEach(entry => {
    if (entry.status !== 'posted' || !entry.lines) return;
    entry.lines.forEach((line: any) => {
      const matchesParty = 
        (line.description && line.description.includes(supplier.name)) ||
        (entry.description && entry.description.includes(supplier.name));
      if (matchesParty && (line.accountCode === '2111' || line.accountCode?.startsWith('211'))) {
        rawEvents.push({
          id: `${entry.id}_${line.id}`,
          date: entry.date,
          time: '16:00:00',
          documentNumber: entry.entryNumber,
          documentType: 'journal_entry',
          documentTypeLabel: 'قيد يومية تسوية',
          description: line.description || entry.description,
          debit: line.debit || 0,
          credit: line.credit || 0,
          status: 'مرحل',
          referenceId: entry.id,
          rawItem: entry
        });
      }
    });
  });

  // Sort chronologically ascending
  rawEvents.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return (a.time || '').localeCompare(b.time || '');
  });

  // Calculate opening balance before `dateFrom`
  let calculatedOpening = initialOpening;
  const filteredEvents: RawEvent[] = [];

  rawEvents.forEach(evt => {
    if (dateFrom && evt.date < dateFrom) {
      calculatedOpening += (evt.credit - evt.debit);
    } else {
      if (!dateTo || evt.date <= dateTo) {
        filteredEvents.push(evt);
      }
    }
  });

  // Apply movement type filter
  const finalFilteredEvents = filteredEvents.filter(evt => {
    if (movementTypeFilter === 'all') return true;
    if (movementTypeFilter === 'purchase_invoice') return evt.documentType === 'purchase_invoice';
    if (movementTypeFilter === 'purchase_return') return evt.documentType === 'purchase_return';
    if (movementTypeFilter === 'supplier_payment') return evt.documentType === 'supplier_payment';
    if (movementTypeFilter === 'journal_entry') return evt.documentType === 'journal_entry';
    return true;
  });

  // Compute running balance for supplier: Balance = Previous + Credit - Debit
  let runningBalance = calculatedOpening;
  let totalCredit = 0;
  let totalDebit = 0;

  const movements: StatementMovement[] = finalFilteredEvents.map(evt => {
    runningBalance += (evt.credit - evt.debit);
    totalCredit += evt.credit;
    totalDebit += evt.debit;
    return {
      ...evt,
      balance: runningBalance
    };
  });

  const endingBalance = runningBalance;
  const netChange = totalCredit - totalDebit;

  let balanceNature: 'payable' | 'receivable' | 'settled' = 'settled';
  let balanceStatusLabel = 'الحساب مطابق ومسدد بالكامل (رصيد صفر)';
  if (endingBalance > 0.001) {
    balanceNature = 'payable';
    balanceStatusLabel = `مستحق للمورد (دائن) بمبلغ ${endingBalance.toLocaleString('ar-EG')} ج.م`;
  } else if (endingBalance < -0.001) {
    balanceNature = 'receivable';
    balanceStatusLabel = `رصيد مدين على المورد (لنا طرفه) بمبلغ ${Math.abs(endingBalance).toLocaleString('ar-EG')} ج.م`;
  }

  const aging = calculateAging(movements, 'supplier');

  return {
    supplier,
    dateFrom,
    dateTo,
    openingBalance: calculatedOpening,
    totalCredit,
    totalDebit,
    netChange,
    endingBalance,
    balanceNature,
    balanceStatusLabel,
    movements,
    counts: {
      invoices: movements.filter(m => m.documentType === 'purchase_invoice').length,
      returns: movements.filter(m => m.documentType === 'purchase_return').length,
      payments: movements.filter(m => m.documentType === 'supplier_payment').length,
      journalEntries: movements.filter(m => m.documentType === 'journal_entry').length,
      total: movements.length
    },
    aging
  };
}
