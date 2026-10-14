export type TreasuryTransactionType = 
  | 'customer_collection'  // إيراد تحصيل عميل
  | 'other_revenue'        // إيراد آخر
  | 'supplier_payment'     // تسجيل سداد موردين
  | 'other_expense';       // مصروف آخر

export type PaymentChannel = 'cash' | 'bank' | 'cheque';

export interface TreasuryTransaction {
  id: string;
  voucherNumber: string; // e.g. REC-2026-001 (سند قبض) or PAY-2026-001 (سند صرف)
  type: TreasuryTransactionType;
  date: string;          // YYYY-MM-DD
  time?: string;         // HH:MM:SS
  amount: number;
  paymentChannel: PaymentChannel;
  fundAccountCode: string; // '1211' (خزينة رئيسية) | '1212' (عهدة) | '1213' (بنك)
  fundAccountName: string;
  
  // Counterparty / Category
  partyId?: string;       // customer id or supplier id
  partyName?: string;     // customer name or supplier name or beneficiary
  targetAccountCode: string; // e.g. '1221' (عملاء), '2111' (موردون), '431' (إيرادات متنوعة), '521' (كهرباء)...
  targetAccountName: string;
  
  // Document linkage
  relatedInvoiceId?: string;     // Link to SalesInvoice.id or PurchaseInvoice.id
  relatedInvoiceNumber?: string; // e.g. SAL-2026-001 or PUR-2026-001
  referenceNumber?: string;      // رقم إيصال، شيك، تحويل، رقم بنكي
  costCenterId?: string;         // مركز تكلفة أو رقم أمر إنتاج
  
  // Details
  categoryLabel: string;         // تصنيف فرعي (مثل: تحصيل نقدي، إيجار، صيانة، بيع عوادم)
  description: string;           // البيان / الوصف
  notes?: string;                // ملاحظات إضافية
  beneficiary?: string;          // المستلم أو المسلّم
  
  // Tracking & Approval System (منظومة تسجيل الوقت والتاريخ واليوزر المعتمد)
  status: 'confirmed' | 'cancelled';
  createdBy?: {
    userId?: string;
    userName: string;
    userRole?: string;
  };
  approvedBy?: {
    userId?: string;
    userName: string;
    userRole?: string;
    userRoleLabel?: string;
    approvedAt?: string;
  };
  approvedAt?: string;
  approvalDate?: string;
  approvalTime?: string;
  verificationCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TreasuryMetrics {
  totalVaultCash: number;        // رصيد الخزينة الرئيسية (1211)
  totalBankCash: number;         // رصيد البنك الجاري (1213)
  totalCustomerCollections: number; // إجمالي تحصيلات العملاء
  totalOtherRevenues: number;    // إجمالي الإيرادات الأخرى
  totalRevenues: number;         // إجمالي الإيرادات الكلية
  totalSupplierPayments: number; // إجمالي سداد الموردين
  totalOtherExpenses: number;    // إجمالي المصروفات الأخرى
  totalExpenses: number;         // إجمالي المصروفات الكلية
  netCashFlow: number;           // صافي التدفق النقدي
  transactionsCount: number;
}
