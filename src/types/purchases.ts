export type PurchasePaymentMethod = 'cash' | 'credit' | 'bank' | 'cheque';
export type PurchasePaymentStatus = 'paid' | 'partial' | 'unpaid';
export type PurchaseReceiptStatus = 'received' | 'pending' | 'partial';

export interface PurchaseInvoiceItem {
  id: string;
  materialId: string;
  materialName: string;
  materialType: 'fabric' | 'accessory' | 'packaging' | 'other' | string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  notes?: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  paymentMethod: PurchasePaymentMethod;
  paymentStatus: PurchasePaymentStatus;
  receiptStatus?: PurchaseReceiptStatus;
  referenceNumber?: string;
  notes?: string;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  approvedBy?: {
    userId?: string;
    userName: string;
    userRole?: string;
    userRoleLabel?: string;
    approvedAt?: string;
  } | string;
  approvedAt?: string;
  approvalDate?: string;
  approvalTime?: string;
  verificationCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseMetrics {
  totalPurchasesValue: number;
  totalInvoicesCount: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  paidInvoicesCount: number;
  partialInvoicesCount: number;
  unpaidInvoicesCount: number;
  paymentRate: number;
  averageInvoiceValue: number;
  totalItemsQuantity: number;
}

export type PurchaseReturnReason =
  | 'defective'    // عيوب غزل أو صباغة أو نسيج
  | 'wrong_spec'   // مواصفات أو وزن غير مطابق
  | 'wrong_color'  // لون أو درجة صبغة مختلفة
  | 'surplus'      // فائض عن حاجة التشغيل
  | 'delayed'      // تأخر في موعد التوريد
  | 'damaged'      // تلفيات أثناء الشحن والتفريغ
  | 'other';       // أسباب أخرى

export type PurchaseReturnRefundMethod = 'credit_deduction' | 'cash' | 'bank'; // خصم من حساب المورد الآجل، استرداد نقدي، تحويل بنكي

export interface PurchaseReturnItem {
  id: string;
  originalItemId?: string;
  materialId: string;
  materialName: string;
  materialType: 'fabric' | 'accessory' | 'packaging' | 'other' | string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  reason: PurchaseReturnReason;
  condition?: 'defect_vendor' | 'scrap' | 'intact'; // مسؤولية المورد / كسر وتلفيات / سليمة فائضة
  notes?: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string; // e.g. PRET-2026-001
  date: string; // YYYY-MM-DD
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  items: PurchaseReturnItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  refundMethod: PurchaseReturnRefundMethod;
  refundedAmount: number; // المبلغ المسترد أو المخصوم من رصيد المورد
  stockReturned: boolean; // هل تم خصم الكميات من مخزن الخامات
  returnReasonGeneral?: string;
  issuedByWarehouseUser?: string; // أمين مخزن الخامات الصادر منه الارتجاع
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
