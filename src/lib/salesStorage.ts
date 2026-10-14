import { SalesInvoice, SalesMetrics, SalesReturn } from '../types/sales';
import { getOrders, updateOrder } from './storage';
import { ProductionOrder, PackingInvoice } from '../types';
import { getActiveSessionUser, ROLE_LABELS } from './usersStorage';
import { recordSystemApproval } from './auditStorage';

const SALES_KEY = 'accounting_sales_v1';
const SALES_RETURNS_KEY = 'accounting_sales_returns_v1';

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

const getDefaultSalesInvoices = (): SalesInvoice[] => {
  return [
    {
      id: 'sal_1',
      invoiceNumber: 'SAL-2026-001',
      date: '2026-09-22',
      customerId: 'cust_1',
      customerName: 'سلسلة متاجر النخبة للأزياء',
      customerPhone: '01055544433',
      customerAddress: 'القاهرة - مصر الجديدة / المعادي',
      customerTaxId: '550-123-456',
      relatedOrderNumber: 'GFOS-2026-001',
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      deliveryStatus: 'delivered',
      notes: 'تسليم الدفعة الأولى من تيشرت البولو الصيفي 100% قطن - مسددة بالكامل بتحويل بنكي بنك مصر',
      salesperson: 'أحمد نبيل - مدير مبيعات المعارض',
      items: [
        {
          id: 's_item_1_1',
          styleName: 'تيشرت بولو قطن مطرز فاخر',
          category: 'ملابس كاجوال رجالي',
          size: 'L',
          color: 'أبيض ناصع',
          unit: 'قطعة',
          quantity: 200,
          unitPrice: 280,
          costPrice: 165,
          discount: 1000,
          total: 55000,
          notes: 'تغليف فردي بالباركود'
        },
        {
          id: 's_item_1_2',
          styleName: 'تيشرت بولو قطن مطرز فاخر',
          category: 'ملابس كاجوال رجالي',
          size: 'XL',
          color: 'كحلي داكن',
          unit: 'قطعة',
          quantity: 150,
          unitPrice: 280,
          costPrice: 165,
          discount: 0,
          total: 42000,
          notes: 'تغليف فردي بالباركود'
        }
      ],
      subtotal: 98000,
      discountTotal: 1000,
      taxPercent: 14,
      taxAmount: 13580,
      shippingCost: 500,
      grandTotal: 111080,
      paidAmount: 111080,
      remainingAmount: 0,
      dueDate: '2026-09-22',
      createdAt: '2026-09-22T11:30:00.000Z'
    },
    {
      id: 'sal_2',
      invoiceNumber: 'SAL-2026-002',
      date: '2026-09-21',
      customerId: 'cust_2',
      customerName: 'شركة الأناقة للملابس الجاهزة والتوزيع',
      customerPhone: '01288899900',
      customerAddress: 'الإسكندرية - سموحة شارع فوزي معاذ',
      customerTaxId: '620-789-012',
      relatedOrderNumber: 'GFOS-2026-002',
      paymentMethod: 'credit',
      paymentStatus: 'partial',
      deliveryStatus: 'delivered',
      notes: 'توريد دفعة سويت شيرت هودي شتوي - دفعة مقدمة 50% والباقي يستحق خلال 30 يوم',
      salesperson: 'كريم ممدوح - قطاع الجملة',
      items: [
        {
          id: 's_item_2_1',
          styleName: 'سويت شيرت هودي ميلتون مبطن',
          category: 'ملابس شتوية',
          size: 'M',
          color: 'رمادي ميلانج',
          unit: 'قطعة',
          quantity: 120,
          unitPrice: 420,
          costPrice: 255,
          discount: 0,
          total: 50400,
          notes: 'طباعة وسوستة معدنية'
        },
        {
          id: 's_item_2_2',
          styleName: 'سويت شيرت هودي ميلتون مبطن',
          category: 'ملابس شتوية',
          size: 'L',
          color: 'أسود ملكي',
          unit: 'قطعة',
          quantity: 180,
          unitPrice: 420,
          costPrice: 255,
          discount: 1400,
          total: 74200,
          notes: 'طباعة وسوستة معدنية'
        }
      ],
      subtotal: 126000,
      discountTotal: 1400,
      taxPercent: 0,
      taxAmount: 0,
      shippingCost: 800,
      grandTotal: 125400,
      paidAmount: 60000,
      remainingAmount: 65400,
      dueDate: '2026-10-21',
      createdAt: '2026-09-21T14:15:00.000Z'
    },
    {
      id: 'sal_3',
      invoiceNumber: 'SAL-2026-003',
      date: '2026-09-24',
      customerId: 'cust_3',
      customerName: 'مؤسسة الزهور لتجارة الأقمشة والملابس',
      customerPhone: '01144433322',
      customerAddress: 'طنطا - الغربية',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      deliveryStatus: 'ready',
      notes: 'طلبية عاجلة ملابس منزلية - استلام من مخزن المصنع وسداد كاش بالخزينة',
      salesperson: 'هاني يوسف - مبيعات المصنع المباشرة',
      items: [
        {
          id: 's_item_3_1',
          styleName: 'بنطلون جبردين كاجوال مطاطي',
          category: 'بنطلون كاجوال',
          size: '34',
          color: 'بيج خاكي',
          unit: 'قطعة',
          quantity: 80,
          unitPrice: 320,
          costPrice: 190,
          discount: 0,
          total: 25600,
          notes: 'فرز أول مغلف'
        }
      ],
      subtotal: 25600,
      discountTotal: 0,
      taxPercent: 0,
      taxAmount: 0,
      shippingCost: 0,
      grandTotal: 25600,
      paidAmount: 25600,
      remainingAmount: 0,
      createdAt: '2026-09-24T09:45:00.000Z'
    }
  ];
};

export const getSalesInvoices = (): SalesInvoice[] => {
  const raw = localStorage.getItem(SALES_KEY);
  if (raw === null) {
    const defaults = getDefaultSalesInvoices();
    saveSalesInvoices(defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse sales invoices:', error);
    return [];
  }
};

export const saveSalesInvoices = (items: SalesInvoice[]): void => {
  saveItems(SALES_KEY, items);
  window.dispatchEvent(new CustomEvent('sales_invoices_updated'));
};

export const addSalesInvoice = (invoice: SalesInvoice): void => {
  const invoices = getSalesInvoices();
  const activeUser = getActiveSessionUser();
  const dateStr = invoice.date || new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().slice(0, 8);
  const nowIso = new Date().toISOString();
  const verificationCode = invoice.verificationCode || `APV-${dateStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const stampedInvoice: SalesInvoice = {
    ...invoice,
    approvedBy: invoice.approvedBy || {
      userId: activeUser.id,
      userName: activeUser.fullName || activeUser.username,
      userRole: activeUser.role,
      userRoleLabel: activeUser.roleTitle || (ROLE_LABELS as any)[activeUser.role]?.title || 'مسؤول المبيعات',
      approvedAt: nowIso
    },
    approvedAt: invoice.approvedAt || nowIso,
    approvalDate: invoice.approvalDate || dateStr,
    approvalTime: invoice.approvalTime || timeStr,
    verificationCode
  };

  const updated = [stampedInvoice, ...invoices];
  saveSalesInvoices(updated);

  // Centrally record this approval in the system audit trail
  try {
    const approverName = typeof stampedInvoice.approvedBy === 'object' ? stampedInvoice.approvedBy?.userName : (stampedInvoice.approvedBy || activeUser.fullName);
    const approverRole = typeof stampedInvoice.approvedBy === 'object' ? stampedInvoice.approvedBy?.userRoleLabel : activeUser.roleTitle;
    recordSystemApproval({
      actionType: 'sales_invoice',
      documentId: stampedInvoice.id,
      documentNumber: stampedInvoice.invoiceNumber,
      title: `إصدار واعتماد فاتورة مبيعات - ${stampedInvoice.customerName}`,
      details: `فاتورة مبيعات رقم ${stampedInvoice.invoiceNumber} للعميل ${stampedInvoice.customerName} بإجمالي ${stampedInvoice.grandTotal?.toLocaleString('ar-EG')} ج.م`,
      amount: stampedInvoice.grandTotal,
      counterpartyName: stampedInvoice.customerName,
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
    console.error('Failed to log sales approval:', err);
  }
};

export const updateSalesInvoice = (invoice: SalesInvoice): void => {
  const invoices = getSalesInvoices();
  const index = invoices.findIndex((i) => i.id === invoice.id);
  if (index >= 0) {
    invoices[index] = {
      ...invoice,
      updatedAt: new Date().toISOString()
    };
    saveSalesInvoices([...invoices]);
  } else {
    addSalesInvoice(invoice);
  }
};

export const deleteSalesInvoice = (id: string): void => {
  const invoices = getSalesInvoices();
  const filtered = invoices.filter((i) => i.id !== id);
  saveSalesInvoices(filtered);
};

export const generateNextSalesInvoiceNumber = (): string => {
  const invoices = getSalesInvoices();
  const year = new Date().getFullYear();
  const prefix = `SAL-${year}-`;

  const numbers = invoices
    .map((inv) => {
      if (inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)) {
        const numPart = inv.invoiceNumber.replace(prefix, '');
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

export const calculateSalesMetrics = (invoices: SalesInvoice[]): SalesMetrics => {
  let totalSalesValue = 0;
  let totalPiecesSold = 0;
  let totalPaidAmount = 0;
  let totalRemainingAmount = 0;
  let paidInvoicesCount = 0;
  let partialInvoicesCount = 0;
  let unpaidInvoicesCount = 0;

  invoices.forEach((inv) => {
    totalSalesValue += Number(inv.grandTotal) || 0;
    totalPaidAmount += Number(inv.paidAmount) || 0;
    totalRemainingAmount += Number(inv.remainingAmount) || 0;

    if (inv.paymentStatus === 'paid') paidInvoicesCount++;
    else if (inv.paymentStatus === 'partial') partialInvoicesCount++;
    else unpaidInvoicesCount++;

    inv.items?.forEach((item) => {
      totalPiecesSold += Number(item.quantity) || 0;
    });
  });

  const totalInvoicesCount = invoices.length;
  const collectionRate =
    totalSalesValue > 0 ? Math.round((totalPaidAmount / totalSalesValue) * 100) : 0;
  const averageInvoiceValue =
    totalInvoicesCount > 0 ? Math.round(totalSalesValue / totalInvoicesCount) : 0;

  return {
    totalSalesValue,
    totalInvoicesCount,
    totalPiecesSold,
    totalPaidAmount,
    totalRemainingAmount,
    paidInvoicesCount,
    partialInvoicesCount,
    unpaidInvoicesCount,
    collectionRate,
    averageInvoiceValue
  };
};

// ==========================================
// SALES RETURNS (مرتجعات ومردودات المبيعات)
// ==========================================

const getDefaultSalesReturns = (): SalesReturn[] => {
  return [
    {
      id: 'ret_1',
      returnNumber: 'RET-2026-001',
      date: '2026-09-24',
      originalInvoiceId: 'sal_1',
      originalInvoiceNumber: 'SAL-2026-001',
      customerId: 'cust_1',
      customerName: 'سلسلة متاجر النخبة للأزياء',
      customerPhone: '01055544433',
      customerAddress: 'القاهرة - مصر الجديدة / المعادي',
      items: [
        {
          id: 'ret_item_1',
          styleName: 'تيشرت بولو قطن مطرز فاخر',
          category: 'ملابس كاجوال رجالي',
          size: 'L',
          color: 'أبيض ناصع',
          unit: 'قطعة',
          quantity: 10,
          unitPrice: 280,
          costPrice: 165,
          total: 2800,
          reason: 'defective',
          condition: 'good',
          notes: 'استبدال مقاس بناء على طلب المعرض وتم فحصها وإعادتها لمخزن التام'
        }
      ],
      subtotal: 2800,
      taxPercent: 14,
      taxAmount: 392,
      grandTotal: 3192,
      refundMethod: 'bank',
      refundedAmount: 3192,
      stockReturned: true,
      returnReasonGeneral: 'عيوب في المقاس المطلوب وإعادة للمخزن',
      receivedByWarehouseUser: 'محمود عبد السلام - أمين مخزن التام',
      notes: 'تم فحص الـ 10 قطع وإعادتها للمخزن صالحة وتم رد القيمة بتحويل بنكي',
      createdAt: '2026-09-24T12:00:00.000Z'
    }
  ];
};

export const getSalesReturns = (): SalesReturn[] => {
  const raw = localStorage.getItem(SALES_RETURNS_KEY);
  if (raw === null) {
    const defaults = getDefaultSalesReturns();
    saveSalesReturns(defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse sales returns:', error);
    return [];
  }
};

export const saveSalesReturns = (items: SalesReturn[]): void => {
  saveItems(SALES_RETURNS_KEY, items);
  window.dispatchEvent(new CustomEvent('sales_returns_updated'));
};

export const deleteAllSales = (): void => {
  saveSalesInvoices([]);
  saveSalesReturns([]);
};

export const resetSalesToDefaults = (): void => {
  const defaults = getDefaultSalesInvoices();
  saveSalesInvoices(defaults);
  const returnDefaults = getDefaultSalesReturns();
  saveSalesReturns(returnDefaults);
};

export const generateNextSalesReturnNumber = (): string => {
  const returns = getSalesReturns();
  const year = new Date().getFullYear();
  const prefix = `RET-${year}-`;

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
 * Updates finished goods warehouse inventory when sales items are returned.
 * Adds the returned quantities back to the production order's packing invoices/batches,
 * and notifies all warehouse subscribers.
 */
export const updateInventoryForSalesReturn = async (salesReturn: SalesReturn): Promise<void> => {
  try {
    const allOrders = await getOrders();
    let hasChanges = false;

    // Group items by order (if orderNumber or orderId exists) or match by styleName & customer
    for (const item of salesReturn.items) {
      if (item.condition !== 'good' && item.quantity <= 0) continue;

      let targetOrder = allOrders.find(
        (o) =>
          (item.orderId && o.id === item.orderId) ||
          (item.orderNumber && o.orderNumber === item.orderNumber)
      );

      // If not directly matched by ID/number, match by styleName
      if (!targetOrder) {
        targetOrder = allOrders.find(
          (o) =>
            o.styleName &&
            item.styleName &&
            o.styleName.trim().toLowerCase() === item.styleName.trim().toLowerCase()
        );
      }

      if (targetOrder) {
        const packingInvoices = targetOrder.packingInvoices || [];
        const returnDate = salesReturn.date || new Date().toISOString().split('T')[0];

        // Create or append to a return packing invoice in finished goods
        const returnInvTitle = `مرتجع مبيعات ${salesReturn.returnNumber} - ${salesReturn.customerName}`;
        let existingReturnInv = packingInvoices.find(
          (inv) => inv.customerName === returnInvTitle
        );

        if (!existingReturnInv) {
          existingReturnInv = {
            id: `ret_inv_${salesReturn.id}_${Date.now()}`,
            date: returnDate,
            customerName: returnInvTitle,
            variants: []
          };
          packingInvoices.push(existingReturnInv);
        }

        // Add or update variant in this invoice
        const variantIndex = existingReturnInv.variants.findIndex(
          (v) => v.size === item.size && v.color === item.color
        );

        if (variantIndex >= 0) {
          existingReturnInv.variants[variantIndex].quantity += item.quantity;
        } else {
          existingReturnInv.variants.push({
            size: item.size,
            color: item.color,
            quantity: item.quantity
          });
        }

        targetOrder.packingInvoices = packingInvoices;
        targetOrder.packingStatus = 'مكتمل';
        targetOrder.packingApprovedAt = targetOrder.packingApprovedAt || new Date().toISOString();
        targetOrder.packingApprovedBy =
          salesReturn.receivedByWarehouseUser || targetOrder.packingApprovedBy || 'أمين مخزن التام (إذن ارتجاع)';

        await updateOrder(targetOrder);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      window.dispatchEvent(new Event('gfos_storage_update'));
      window.dispatchEvent(new CustomEvent('finished_goods_updated'));
    }
  } catch (error) {
    console.error('Failed to update inventory for sales return:', error);
  }
};

/**
 * Reverts or updates original sales invoice remaining and paid amounts if refund method is credit deduction
 */
export const adjustSalesInvoiceForReturn = (salesReturn: SalesReturn): void => {
  const invoices = getSalesInvoices();
  const inv = invoices.find((i) => i.id === salesReturn.originalInvoiceId);
  if (!inv) return;

  // If refunded via credit deduction, deduct from the customer's remaining balance
  if (salesReturn.refundMethod === 'credit_deduction') {
    const curRemaining = Number(inv.remainingAmount) || 0;
    inv.remainingAmount = Math.max(0, curRemaining - salesReturn.grandTotal);
    if (inv.remainingAmount <= 0) {
      inv.paymentStatus = 'paid';
    }
  }

  updateSalesInvoice(inv);
};

export const addSalesReturn = async (salesReturn: SalesReturn): Promise<void> => {
  const returns = getSalesReturns();
  const updated = [salesReturn, ...returns];
  saveSalesReturns(updated);

  // 1. Update finished goods inventory if requested
  if (salesReturn.stockReturned) {
    await updateInventoryForSalesReturn(salesReturn);
  }

  // 2. Adjust original invoice credit if deduction
  adjustSalesInvoiceForReturn(salesReturn);

  // 3. Dispatch events
  window.dispatchEvent(new CustomEvent('sales_returns_updated'));
  window.dispatchEvent(new CustomEvent('sales_invoices_updated'));
};

export const updateSalesReturn = async (salesReturn: SalesReturn): Promise<void> => {
  const returns = getSalesReturns();
  const index = returns.findIndex((r) => r.id === salesReturn.id);
  if (index >= 0) {
    returns[index] = {
      ...salesReturn,
      updatedAt: new Date().toISOString()
    };
    saveSalesReturns([...returns]);
  } else {
    await addSalesReturn(salesReturn);
  }
};

export const deleteSalesReturn = (id: string): void => {
  const returns = getSalesReturns();
  const filtered = returns.filter((r) => r.id !== id);
  saveSalesReturns(filtered);
};
