export type SalesPaymentMethod = 'cash' | 'credit' | 'bank' | 'cheque';
export type SalesPaymentStatus = 'paid' | 'partial' | 'unpaid';
export type SalesDeliveryStatus = 'delivered' | 'ready' | 'pending';

export interface SalesInvoiceItemVariant {
  size: string;
  color: string;
  quantity: number;
  barcode?: string;
  remainingStock?: number;
}

export interface SalesInvoiceItem {
  id: string;
  orderId?: string;
  orderNumber?: string;
  barcode?: string; // كود الباركود التسلسلي للمنتج (مثل PM-00001)
  styleName: string;
  category?: string;
  size: string;
  color: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  discount: number;
  total: number;
  notes?: string;
  variants?: SalesInvoiceItemVariant[]; // تفاصيل المقاسات والألوان المنبثقة
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerTaxId?: string;
  relatedOrderId?: string;
  relatedOrderNumber?: string;
  showDetails?: boolean; // إظهار أو إخفاء تفاصيل الفاتورة (أعداد وألوان الموديل) في العرض والطباعة
  items: SalesInvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxPercent: number;
  taxAmount: number;
  shippingCost: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: SalesPaymentMethod;
  paymentStatus: SalesPaymentStatus;
  deliveryStatus: SalesDeliveryStatus;
  dueDate?: string;
  notes?: string;
  salesperson?: string;
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

export interface SalesMetrics {
  totalSalesValue: number;
  totalInvoicesCount: number;
  totalPiecesSold: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  paidInvoicesCount: number;
  partialInvoicesCount: number;
  unpaidInvoicesCount: number;
  collectionRate: number;
  averageInvoiceValue: number;
}

export type SalesReturnReason =
  | 'defective'      // عيوب تصنيع أو قماش
  | 'wrong_size'     // مقاس غير مطابق
  | 'wrong_color'    // لون مختلف عن المطلوب
  | 'surplus'        // فائض عن حاجة العميل
  | 'delayed'        // تأخر في موعد التسليم
  | 'other';         // أسباب أخرى

export type ReturnRefundMethod = 'cash' | 'bank' | 'credit_deduction'; // نقداً أو تحويل أو خصم من رصيد العميل الآجل

export interface SalesReturnItem {
  id: string;
  originalItemId?: string;
  orderId?: string;
  orderNumber?: string;
  styleName: string;
  category?: string;
  size: string;
  color: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  total: number;
  reason: SalesReturnReason;
  condition: 'good' | 'damaged'; // حالة البضاعة المرتجعة (صالحة لإعادة البيع / تالفة تحتاج إصلاح)
  notes?: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string; // e.g. RET-2026-001
  date: string; // YYYY-MM-DD
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: SalesReturnItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  refundMethod: ReturnRefundMethod;
  refundedAmount: number; // المبلغ المصروف للعميل (نقداً أو بنكاً أو مقاصة من حسابه)
  stockReturned: boolean; // هل تم إيداع وتحديث المخزون
  returnReasonGeneral?: string;
  receivedByWarehouseUser?: string; // أمين المخزن المستلم
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
