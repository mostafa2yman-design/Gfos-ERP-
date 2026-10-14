export interface AccountMapping {
  // مخازن وخامات
  fabricInventoryAccountCode: string; // 12411 مخزن الأقمشة والغزول
  accessoriesInventoryAccountCode: string; // 12412 مخزن الإكسسوارات
  packagingInventoryAccountCode: string; // 12413 مخزن مواد التعبئة والتغليف
  wipAccountCode: string; // 1242 مخزون الإنتاج تحت التشغيل
  finishedGoodsAccountCode: string; // 12431 مخزن الملابس الجاهزة والمنتجات التامة

  // مشتريات وموردين
  suppliersPayableAccountCode: string; // 2111 موردو الأقمشة والغزول
  accessoriesSuppliersAccountCode: string; // 2112 موردو الإكسسوارات
  subcontractorsPayableAccountCode: string; // 2114 مقاولو باطن وورش تطريز وخياطة خارجية
  purchaseVatAccountCode: string; // 1232 ضريبة القيمة المضافة على المدخلات
  purchaseDiscountsAccountCode: string; // 422 خصم مكتسب على المشتريات

  // مبيعات وعملاء
  salesRevenueAccountCode: string; // 411 مبيعات الملابس الجاهزة
  jobOrderRevenueAccountCode: string; // 412 إيرادات تشغيل وتصنيع للغير (مصنعيات)
  salesReturnAccountCode: string; // 421 مردودات مبيعات ملابس جاهزة
  customersReceivableAccountCode: string; // 1221 عملاء مبيعات الملابس الجاهزة
  salesVatAccountCode: string; // 2133 ضريبة القيمة المضافة المستحقة

  // تكاليف تصنيع وعمالة
  cogsAccountCode: string; // 511 تكلفة الخامات المباشرة المنصرفة للتشغيل
  directLaborAccountCode: string; // 512 الأجور والعمالة الإنتاجية المباشرة
  subcontractorsCostAccountCode: string; // 513 خدمات تصنيع وتشغيل خارجية (مقاولو باطن)
  manufacturingOverheadAccountCode: string; // 52 التكاليف الصناعية غير المباشرة

  // نقدية وبنوك
  mainCashAccountCode: string; // 1211 الخزينة الرئيسية للمصنع
  pettyCashAccountCode: string; // 1212 عهد التشغيل النقدية بالورش
  bankAccountCode: string; // 1213 البنك - حساب جاري المصنع
}

export interface FinancialPolicies {
  currency: string; // 'EGP'
  currencySymbol: string; // 'ج.م'
  vatRate: number; // 14
  vatEnabled: boolean; // true
  inventoryValuationMethod: 'weighted_average' | 'fifo'; // 'weighted_average'
  fiscalYearStartMonth: number; // 1
  periodLockDate?: string; // YYYY-MM-DD
  allowNegativeInventory: boolean; // false
  autoPostPurchasesToLedger: boolean; // true
  autoPostSalesToLedger: boolean; // true
  autoPostProductionWipToLedger: boolean; // true
  roundingDecimals: number; // 2
}

export interface DocumentSequenceConfig {
  journalEntryPrefix: string; // 'JV-'
  purchaseInvoicePrefix: string; // 'PUR-'
  purchaseReturnPrefix: string; // 'PRET-'
  salesInvoicePrefix: string; // 'INV-'
  salesReturnPrefix: string; // 'SRET-'
  productionOrderPrefix: string; // 'PO-'
  wipTransferPrefix: string; // 'WIP-'
}

export interface FinancialConfiguration {
  updatedAt: string;
  mappings: AccountMapping;
  policies: FinancialPolicies;
  sequences: DocumentSequenceConfig;
}

export const DEFAULT_FINANCIAL_CONFIG: FinancialConfiguration = {
  updatedAt: new Date().toISOString(),
  mappings: {
    // مخازن وخامات
    fabricInventoryAccountCode: '12411',
    accessoriesInventoryAccountCode: '12412',
    packagingInventoryAccountCode: '12413',
    wipAccountCode: '1242',
    finishedGoodsAccountCode: '12431',

    // مشتريات وموردين
    suppliersPayableAccountCode: '2111',
    accessoriesSuppliersAccountCode: '2112',
    subcontractorsPayableAccountCode: '2114',
    purchaseVatAccountCode: '1232',
    purchaseDiscountsAccountCode: '422',

    // مبيعات وعملاء
    salesRevenueAccountCode: '411',
    jobOrderRevenueAccountCode: '412',
    salesReturnAccountCode: '421',
    customersReceivableAccountCode: '1221',
    salesVatAccountCode: '2133',

    // تكاليف تصنيع وعمالة
    cogsAccountCode: '511',
    directLaborAccountCode: '512',
    subcontractorsCostAccountCode: '513',
    manufacturingOverheadAccountCode: '52',

    // نقدية وبنوك
    mainCashAccountCode: '1211',
    pettyCashAccountCode: '1212',
    bankAccountCode: '1213'
  },
  policies: {
    currency: 'EGP',
    currencySymbol: 'ج.م',
    vatRate: 14,
    vatEnabled: true,
    inventoryValuationMethod: 'weighted_average',
    fiscalYearStartMonth: 1,
    periodLockDate: '',
    allowNegativeInventory: false,
    autoPostPurchasesToLedger: true,
    autoPostSalesToLedger: true,
    autoPostProductionWipToLedger: true,
    roundingDecimals: 2
  },
  sequences: {
    journalEntryPrefix: 'JV-',
    purchaseInvoicePrefix: 'PUR-',
    purchaseReturnPrefix: 'PRET-',
    salesInvoicePrefix: 'INV-',
    salesReturnPrefix: 'SRET-',
    productionOrderPrefix: 'PO-',
    wipTransferPrefix: 'WIP-'
  }
};
