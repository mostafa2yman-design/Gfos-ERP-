import { PurchaseInvoice, PurchaseReturn, PurchaseMetrics } from '../types';
import { getActiveSessionUser, ROLE_LABELS } from './usersStorage';
import { recordSystemApproval } from './auditStorage';

const PURCHASES_KEY = 'accounting_purchases_v1';
const PURCHASE_RETURNS_KEY = 'accounting_purchase_returns_v1';

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

const getDefaultPurchases = (): PurchaseInvoice[] => {
  return [
    {
      id: 'pur_1',
      invoiceNumber: 'PUR-2026-001',
      date: '2026-09-20',
      supplierId: 'supp_1',
      supplierName: 'شركة النيل للغزل والمنسوجات',
      supplierPhone: '01012345678',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      referenceNumber: 'REF-7890',
      notes: 'توريد دفعة قماش قطن سنجل جيرسي مع خيوط خياطة خاصة بأمر الإنتاج الجديد',
      receiptStatus: 'received',
      items: [
        {
          id: 'item_1_1',
          materialId: 'mat_1',
          materialName: 'قماش قطن سنجل جيرسي 100%',
          materialType: 'fabric',
          unit: 'كجم',
          quantity: 350,
          unitPrice: 220,
          discount: 1000,
          total: 76000,
          notes: 'صبغة ناصعة البياض درجة أولى',
        },
        {
          id: 'item_1_2',
          materialId: 'mat_6',
          materialName: 'خيط خياطة سبان 40/2 بكرة 5000 ياردة',
          materialType: 'accessory',
          unit: 'بكرة',
          quantity: 40,
          unitPrice: 45,
          discount: 0,
          total: 1800,
          notes: 'لون أبيض وأسود',
        },
      ],
      subtotal: 78800,
      discountTotal: 1000,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: 77800,
      paidAmount: 77800,
      remainingAmount: 0,
      createdAt: '2026-09-20T09:30:00.000Z',
    },
    {
      id: 'pur_2',
      invoiceNumber: 'PUR-2026-002',
      date: '2026-09-18',
      supplierId: 'supp_2',
      supplierName: 'مؤسسة الأهرام لمستلزمات الخياطة والتطريز',
      supplierPhone: '01123456789',
      paymentMethod: 'credit',
      paymentStatus: 'partial',
      referenceNumber: 'INV-4412',
      notes: 'مستلزمات إكسسوارات وسوست وأزرار شتوية - سداد جزئي والباقي آجل 30 يوم',
      receiptStatus: 'received',
      items: [
        {
          id: 'item_2_1',
          materialId: 'mat_7',
          materialName: 'سوستة نحاس معدنية 20 سم بنطلون',
          materialType: 'accessory',
          unit: 'دزينة',
          quantity: 50,
          unitPrice: 120,
          discount: 200,
          total: 5800,
          notes: 'نحاس عتيق ممتاز',
        },
        {
          id: 'item_2_2',
          materialId: 'mat_9',
          materialName: 'أزرار بوليستر قميص 18 ليني (1000 زر)',
          materialType: 'accessory',
          unit: 'باكو',
          quantity: 30,
          unitPrice: 85,
          discount: 100,
          total: 2450,
        },
        {
          id: 'item_2_3',
          materialId: 'mat_13',
          materialName: 'شريط مطاط كمر 4 سم عالي المرونة',
          materialType: 'accessory',
          unit: 'لفة (50 متر)',
          quantity: 25,
          unitPrice: 110,
          discount: 0,
          total: 2750,
        },
      ],
      subtotal: 11300,
      discountTotal: 300,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: 11000,
      paidAmount: 5000,
      remainingAmount: 6000,
      createdAt: '2026-09-18T11:15:00.000Z',
    },
    {
      id: 'pur_3',
      invoiceNumber: 'PUR-2026-003',
      date: '2026-09-12',
      supplierId: 'supp_3',
      supplierName: 'مصنع الإسكندرية للغزول والميلتون',
      supplierPhone: '01234567890',
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      referenceNumber: 'TRF-9021',
      notes: 'خامات موسم الشتاء: ميلتون مبطن وجينز - تحويل بنكي فوري من حساب الشركة',
      receiptStatus: 'received',
      items: [
        {
          id: 'item_3_1',
          materialId: 'mat_2',
          materialName: 'قماش ميلتون مبطن شتوي ثقيل',
          materialType: 'fabric',
          unit: 'كجم',
          quantity: 500,
          unitPrice: 280,
          discount: 4000,
          total: 136000,
          notes: 'ألوان كحلي وأسود وزيتي',
        },
        {
          id: 'item_3_2',
          materialId: 'mat_4',
          materialName: 'قماش جينز قطن 12 أوقية',
          materialType: 'fabric',
          unit: 'متر',
          quantity: 400,
          unitPrice: 165,
          discount: 2000,
          total: 64000,
        },
      ],
      subtotal: 206000,
      discountTotal: 6000,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: 200000,
      paidAmount: 200000,
      remainingAmount: 0,
      createdAt: '2026-09-12T14:20:00.000Z',
    },
    {
      id: 'pur_4',
      invoiceNumber: 'PUR-2026-004',
      date: '2026-09-05',
      supplierId: 'supp_4',
      supplierName: 'شركة الشرق الأوسط للكرتون والتغليف',
      supplierPhone: '01098765432',
      paymentMethod: 'credit',
      paymentStatus: 'unpaid',
      referenceNumber: 'DEL-338',
      notes: 'مستلزمات تعبئة وتغليف لشحن الطلبيات الجاهزة - استحقاق السداد نهاية الشهر',
      receiptStatus: 'received',
      items: [
        {
          id: 'item_4_1',
          materialId: 'mat_11',
          materialName: 'أكياس تغليف بولي بروبلين لاصق ذاتي',
          materialType: 'accessory',
          unit: 'باكو (100 كيس)',
          quantity: 100,
          unitPrice: 60,
          discount: 200,
          total: 5800,
        },
        {
          id: 'item_4_2',
          materialId: 'mat_12',
          materialName: 'كرتون شحن وتصدير 5 طبقات مقوى',
          materialType: 'accessory',
          unit: 'كرتونة',
          quantity: 300,
          unitPrice: 35,
          discount: 300,
          total: 10200,
        },
        {
          id: 'item_4_3',
          materialId: 'mat_10',
          materialName: 'تكت رقبة منسوج ساتان براند',
          materialType: 'accessory',
          unit: '1000 قطعة',
          quantity: 20,
          unitPrice: 350,
          discount: 0,
          total: 7000,
        },
      ],
      subtotal: 23500,
      discountTotal: 500,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: 23000,
      paidAmount: 0,
      remainingAmount: 23000,
      createdAt: '2026-09-05T16:00:00.000Z',
    },
    {
      id: 'pur_5',
      invoiceNumber: 'PUR-2026-005',
      date: '2026-08-25',
      supplierId: 'supp_1',
      supplierName: 'شركة النيل للغزل والمنسوجات',
      supplierPhone: '01012345678',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      referenceNumber: 'INV-7721',
      notes: 'توريدات أقمشة رياضية وبوليستر لشهر أغسطس',
      receiptStatus: 'received',
      items: [
        {
          id: 'item_5_1',
          materialId: 'mat_3',
          materialName: 'قماش بوليستر رياضي معالج ضد العرق',
          materialType: 'fabric',
          unit: 'كجم',
          quantity: 200,
          unitPrice: 190,
          discount: 500,
          total: 37500,
        },
        {
          id: 'item_5_2',
          materialId: 'mat_5',
          materialName: 'قماش ريب ليكرا للأساور والياقات',
          materialType: 'fabric',
          unit: 'كجم',
          quantity: 50,
          unitPrice: 240,
          discount: 0,
          total: 12000,
        },
      ],
      subtotal: 50000,
      discountTotal: 500,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: 49500,
      paidAmount: 49500,
      remainingAmount: 0,
      createdAt: '2026-08-25T10:00:00.000Z',
    },
  ];
};

export const getPurchases = (): PurchaseInvoice[] => {
  const raw = localStorage.getItem(PURCHASES_KEY);
  if (raw === null) {
    const defaults = getDefaultPurchases();
    saveItems(PURCHASES_KEY, defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse purchases:', error);
    return [];
  }
};

export const savePurchases = (items: PurchaseInvoice[]): void => {
  saveItems(PURCHASES_KEY, items);
  window.dispatchEvent(new CustomEvent('purchases_updated'));
};

export const addPurchase = (invoice: PurchaseInvoice): void => {
  const current = getPurchases();
  const activeUser = getActiveSessionUser();
  const dateStr = invoice.date || new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().slice(0, 8);
  const nowIso = new Date().toISOString();
  const verificationCode = invoice.verificationCode || `APV-${dateStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const stampedInvoice: PurchaseInvoice = {
    ...invoice,
    approvedBy: invoice.approvedBy || {
      userId: activeUser.id,
      userName: activeUser.fullName || activeUser.username,
      userRole: activeUser.role,
      userRoleLabel: activeUser.roleTitle || (ROLE_LABELS as any)[activeUser.role]?.title || 'مسؤول المشتريات',
      approvedAt: nowIso
    },
    approvedAt: invoice.approvedAt || nowIso,
    approvalDate: invoice.approvalDate || dateStr,
    approvalTime: invoice.approvalTime || timeStr,
    verificationCode
  };

  const updated = [stampedInvoice, ...current];
  savePurchases(updated);

  // Centrally record this approval in the system audit trail
  try {
    const approverName = typeof stampedInvoice.approvedBy === 'object' ? stampedInvoice.approvedBy?.userName : (stampedInvoice.approvedBy || activeUser.fullName);
    const approverRole = typeof stampedInvoice.approvedBy === 'object' ? stampedInvoice.approvedBy?.userRoleLabel : activeUser.roleTitle;
    recordSystemApproval({
      actionType: 'purchase_invoice',
      documentId: stampedInvoice.id,
      documentNumber: stampedInvoice.invoiceNumber,
      title: `اعتماد وإدخال فاتورة مشتريات خامات - ${stampedInvoice.supplierName}`,
      details: `فاتورة شراء رقم ${stampedInvoice.invoiceNumber} من المورد ${stampedInvoice.supplierName} بقيمة ${stampedInvoice.grandTotal?.toLocaleString('ar-EG')} ج.م`,
      amount: stampedInvoice.grandTotal,
      counterpartyName: stampedInvoice.supplierName,
      customDate: dateStr,
      customTime: timeStr,
      customUser: {
        id: activeUser.id,
        name: approverName || activeUser.fullName || activeUser.username,
        role: activeUser.role,
        roleTitle: approverRole || activeUser.roleTitle
      }
    });
  } catch (err) {
    console.error('Failed to log purchase approval:', err);
  }
};

export const updatePurchase = (invoice: PurchaseInvoice): void => {
  const current = getPurchases();
  const updated = current.map(item => item.id === invoice.id ? invoice : item);
  savePurchases(updated);
};

export const deletePurchase = (id: string): void => {
  const current = getPurchases();
  const updated = current.filter(item => item.id !== id);
  savePurchases(updated);
};

export const generateNextPurchaseInvoiceNumber = (): string => {
  const purchases = getPurchases();
  const year = new Date().getFullYear();
  const pattern = new RegExp(`PUR-${year}-(\\d+)`);
  let maxSeq = 0;
  for (const p of purchases) {
    const match = p.invoiceNumber?.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  }
  return `PUR-${year}-${String(maxSeq + 1).padStart(3, '0')}`;
};

// ==========================================
// --- Purchase Returns (مرتجعات ومردودات المشتريات) ---
// ==========================================

const getDefaultPurchaseReturns = (): PurchaseReturn[] => {
  return [
    {
      id: 'pret_1',
      returnNumber: 'PRET-2026-001',
      date: '2026-09-22',
      originalInvoiceId: 'pur_1',
      originalInvoiceNumber: 'PUR-2026-001',
      supplierId: 'supp_1',
      supplierName: 'شركة النيل للغزل والمنسوجات',
      supplierPhone: '01012345678',
      items: [
        {
          id: 'pret_item_1',
          originalItemId: 'item_1_1',
          materialId: 'mat_1',
          materialName: 'قماش قطن سنجل جيرسي 100%',
          materialType: 'fabric',
          unit: 'كجم',
          quantity: 25,
          unitPrice: 220,
          total: 5500,
          reason: 'defective',
          condition: 'defect_vendor',
          notes: 'وجود بقع وتفاوت في درجة الصباغة بالثوب رقم 4، تم إثباتها وردها للمورد'
        }
      ],
      subtotal: 5500,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: 5500,
      refundMethod: 'credit_deduction',
      refundedAmount: 5500,
      stockReturned: true,
      returnReasonGeneral: 'عيوب في درجة الصباغة بثوب القماش وتم خصم القيمة من رصيد المورد',
      issuedByWarehouseUser: 'عمرو إبراهيم - أمين مخزن الخامات',
      notes: 'تم تسليم الثوب التالف لمندوب شركة النيل مع توقيع إذن الاستلام وتعديل رصيد المخزن',
      createdAt: '2026-09-22T13:40:00.000Z'
    }
  ];
};

export const getPurchaseReturns = (): PurchaseReturn[] => {
  const raw = localStorage.getItem(PURCHASE_RETURNS_KEY);
  if (raw === null) {
    const defaults = getDefaultPurchaseReturns();
    savePurchaseReturns(defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse purchase returns:', error);
    return [];
  }
};

export const savePurchaseReturns = (items: PurchaseReturn[]): void => {
  saveItems(PURCHASE_RETURNS_KEY, items);
  window.dispatchEvent(new CustomEvent('purchase_returns_updated'));
  window.dispatchEvent(new CustomEvent('raw_materials_updated'));
  window.dispatchEvent(new CustomEvent('purchases_updated'));
  window.dispatchEvent(new CustomEvent('journal_entries_updated'));
};

export const deleteAllPurchases = (): void => {
  savePurchases([]);
  savePurchaseReturns([]);
};

export const resetPurchasesToDefaults = (): void => {
  const defaults = getDefaultPurchases();
  savePurchases(defaults);
  const returnDefaults = getDefaultPurchaseReturns();
  savePurchaseReturns(returnDefaults);
};

export const generateNextPurchaseReturnNumber = (): string => {
  const returns = getPurchaseReturns();
  const year = new Date().getFullYear();
  const prefix = `PRET-${year}-`;

  const numbers = returns
    .map((ret) => {
      if (ret.returnNumber && ret.returnNumber.startsWith(prefix)) {
        const numPart = ret.returnNumber.replace(prefix, '');
        const parsed = parseInt(numPart, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    })
    .filter((n) => n > 0);

  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  const next = max + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
};

/**
 * Adjusts original purchase invoice remaining and payment status if refund method is credit deduction
 */
export const adjustPurchaseInvoiceForReturn = (purchaseReturn: PurchaseReturn): void => {
  const purchases = getPurchases();
  const inv = purchases.find((i) => i.id === purchaseReturn.originalInvoiceId);
  if (!inv) return;

  if (purchaseReturn.refundMethod === 'credit_deduction') {
    const curRemaining = Number(inv.remainingAmount) || 0;
    inv.remainingAmount = Math.max(0, curRemaining - purchaseReturn.grandTotal);
    if (inv.remainingAmount <= 0) {
      inv.paymentStatus = 'paid';
    }
    updatePurchase(inv);
  }
};

export const addPurchaseReturn = async (purchaseReturn: PurchaseReturn): Promise<void> => {
  const current = getPurchaseReturns();
  const updated = [purchaseReturn, ...current];
  savePurchaseReturns(updated);

  // 1. Adjust original purchase invoice credit if credit deduction
  adjustPurchaseInvoiceForReturn(purchaseReturn);

  // 2. Dispatch events
  window.dispatchEvent(new CustomEvent('purchase_returns_updated'));
  window.dispatchEvent(new CustomEvent('purchases_updated'));
  window.dispatchEvent(new CustomEvent('raw_materials_updated'));
  window.dispatchEvent(new CustomEvent('journal_entries_updated'));
};

export const updatePurchaseReturn = async (purchaseReturn: PurchaseReturn): Promise<void> => {
  const current = getPurchaseReturns();
  const index = current.findIndex((r) => r.id === purchaseReturn.id);
  if (index >= 0) {
    current[index] = {
      ...purchaseReturn,
      updatedAt: new Date().toISOString()
    };
    savePurchaseReturns([...current]);
  } else {
    await addPurchaseReturn(purchaseReturn);
  }
};

export const deletePurchaseReturn = (id: string): void => {
  const current = getPurchaseReturns();
  const filtered = current.filter((r) => r.id !== id);
  savePurchaseReturns(filtered);
};

export const calculatePurchaseMetrics = (invoices: PurchaseInvoice[]): PurchaseMetrics => {
  let totalPurchasesValue = 0;
  let totalPaidAmount = 0;
  let totalRemainingAmount = 0;
  let paidInvoicesCount = 0;
  let partialInvoicesCount = 0;
  let unpaidInvoicesCount = 0;
  let totalItemsQuantity = 0;

  invoices.forEach((inv) => {
    const grand = Number(inv.grandTotal) || 0;
    const paid = Number(inv.paidAmount) || 0;
    const remaining = Number(inv.remainingAmount) || Math.max(0, grand - paid);

    totalPurchasesValue += grand;
    totalPaidAmount += paid;
    totalRemainingAmount += remaining;

    if (inv.paymentStatus === 'paid') paidInvoicesCount++;
    else if (inv.paymentStatus === 'partial') partialInvoicesCount++;
    else unpaidInvoicesCount++;

    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach((it) => {
        totalItemsQuantity += Number(it.quantity) || 0;
      });
    }
  });

  const totalInvoicesCount = invoices.length;
  const paymentRate = totalPurchasesValue > 0 ? (totalPaidAmount / totalPurchasesValue) * 100 : 0;
  const averageInvoiceValue = totalInvoicesCount > 0 ? totalPurchasesValue / totalInvoicesCount : 0;

  return {
    totalPurchasesValue: Math.round(totalPurchasesValue * 100) / 100,
    totalInvoicesCount,
    totalPaidAmount: Math.round(totalPaidAmount * 100) / 100,
    totalRemainingAmount: Math.round(totalRemainingAmount * 100) / 100,
    paidInvoicesCount,
    partialInvoicesCount,
    unpaidInvoicesCount,
    paymentRate: Math.round(paymentRate * 10) / 10,
    averageInvoiceValue: Math.round(averageInvoiceValue * 100) / 100,
    totalItemsQuantity: Math.round(totalItemsQuantity * 100) / 100
  };
};
