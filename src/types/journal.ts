export type JournalEntryType = 
  | 'automated'      // قيد آلي عام
  | 'manual'         // قيد يومية يدوي
  | 'purchase'       // قيد آلي - مشتريات وتوريد خامات
  | 'purchase_return'// قيد آلي - مردودات ومردودات مشتريات
  | 'sales'          // قيد آلي - مبيعات وتسليم منتجات تامة
  | 'sales_return'   // قيد آلي - مردودات مبيعات مرتجعة
  | 'production_wip' // قيد آلي - صرف خامات للتشغيل (WIP)
  | 'production_cut' // قيد آلي - اعتماد مرحلة القص وتكاليف التفصيل
  | 'production_prep'// قيد آلي - صرف مستلزمات وتجهيز الباتشات
  | 'production_print'// قيد آلي - تشغيل خارجي / طباعة وتطريز
  | 'production_sew' // قيد آلي - اعتماد مرحلة الخياطة والتجميع
  | 'production_finish' // قيد آلي - اعتماد مرحلة التشطيب والكي
  | 'production_overhead' // قيد آلي - تحميل وتوزيع التكاليف الصناعية غير المباشرة (MOH)
  | 'manufacturing'  // قيد آلي - أجور وتكاليف تصنيع
  | 'finished_goods' // قيد آلي - إيداع إنتاج تام بالمخزن
  | 'cogs'           // قيد آلي - إثبات تكلفة البضاعة المباعة
  | 'inventory_adj'  // قيد آلي - تسوية مخزنية أو رصيد افتتاحي
  | 'treasury_receipt' // قيد آلي - سند قبض / تحصيل إيراد
  | 'treasury_payment'; // قيد آلي - سند صرف / سداد مصروفات

export interface JournalEntryLine {
  id: string;
  accountId: string;       // معرف الحساب في شجرة الحسابات
  accountCode: string;     // كود الحساب المالي (e.g. '12411')
  accountName: string;     // اسم الحساب في شجرة الحسابات
  debit: number;           // مدين (EGP)
  credit: number;          // دائن (EGP)
  description?: string;    // بيان السطر
  costCenterId?: string;   // مركز التكلفة أو رقم أمر الإنتاج
  costCenterName?: string; // اسم مركز التكلفة
}

export interface JournalEntry {
  id: string;
  entryNumber: string;     // رقم القيد، مثل JV-2026-0001
  date: string;            // تاريخ القيد YYYY-MM-DD
  time?: string;           // وقت التسجيل HH:mm:ss
  createdAt: string;       // طابع زمني كامل ISO
  type: JournalEntryType;  // نوع القيد
  typeLabel: string;       // المسمى العربي للنوع
  description: string;     // البيان العام للقيد
  reference?: string;      // رقم المستند المرجعي (فاتورة، أمر إنتاج، إذن تسوية)
  sourceDocumentType?: 'purchase_invoice' | 'purchase_return' | 'sales_invoice' | 'sales_return' | 'production_order' | 'manual_adjustment' | 'manual_entry' | 'finished_goods' | 'treasury_voucher';
  sourceDocumentId?: string;
  lines: JournalEntryLine[];
  totalDebit: number;      // إجمالي المدين
  totalCredit: number;     // إجمالي الدائن
  isBalanced: boolean;     // هل القيد متوازن (مدين = دائن)
  status: 'posted' | 'draft'; // حالة الترحيل
  createdBy: {
    userId: string;
    userName: string;
    userRole?: string;
  };
  isManual?: boolean;      // هل القيد مدخل يدوياً
  notes?: string;          // ملاحظات إضافية
}

export interface LedgerMovement {
  id: string;
  journalEntryId: string;
  entryNumber: string;
  date: string;
  time?: string;
  entryType: JournalEntryType;
  entryTypeLabel: string;
  reference?: string;
  description: string;
  debit: number;
  credit: number;
  balanceAfter: number;    // الرصيد بعد الحركة
  balanceNature: 'debit' | 'credit' | 'zero'; // طبيعة الرصيد (مدين أو دائن أو صفر)
  userName: string;
  costCenter?: string;
}

export interface AccountLedgerSummary {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  normalNature: 'debit' | 'credit';
  openingBalance: number;
  openingBalanceNature: 'debit' | 'credit';
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  closingBalanceNature: 'debit' | 'credit' | 'zero';
  movements: LedgerMovement[];
}

export interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  level: number;
  isParent: boolean;
  normalNature: 'debit' | 'credit';
  // 1. Opening balances (أرصدة بداية الفترة)
  openingDebit: number;
  openingCredit: number;
  // 2. Period movements (حركات الفترة)
  periodDebit: number;
  periodCredit: number;
  // 3. Totals (المجاميع الكلية)
  totalDebit: number;
  totalCredit: number;
  // 4. Ending balances (أرصدة نهاية الفترة)
  closingDebit: number;
  closingCredit: number;
}

export interface TrialBalanceReport {
  dateFrom?: string;
  dateTo?: string;
  items: TrialBalanceItem[];
  totals: {
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    totalDebit: number;
    totalCredit: number;
    closingDebit: number;
    closingCredit: number;
  };
  isBalanced: boolean;
  difference: number;
}
