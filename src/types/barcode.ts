export type BarcodeFormat = 'CODE128' | 'EAN13' | 'QR';

export type BarcodePresetId = 
  | '50x30' 
  | '50x25' 
  | '40x25' 
  | '60x40' 
  | '70x50' 
  | '80x50' 
  | 'a4_3x8'
  | 'custom';

export interface BarcodePreset {
  id: BarcodePresetId;
  name: string;
  nameEn: string;
  widthMm: number;
  heightMm: number;
  description: string;
}

export interface BarcodeLabelSettings {
  preset: BarcodePresetId;
  widthMm: number;
  heightMm: number;
  
  // Toggles for elements to show on label
  showProductName: boolean;    // الاسم (اسم الموديل/المنتج)
  showOrderNumber: boolean;    // الرقم (رقم أمر التشغيل/الإنتاج)
  showBarcodeNumber: boolean;  // رقم الباركود المقروء تحت الخطوط
  showSize: boolean;           // المقاس (XL, L, M...)
  showColor: boolean;          // اللون (كحلي، أسود...)
  showProductType: boolean;    // النوع / التصنيف (تيشيرت، بنطلون...)
  showFactoryName: boolean;    // اسم المصنع / البراند
  showBatchNumber: boolean;    // رقم الباتش
  showPrice: boolean;          // السعر
  showProductionDate: boolean; // تاريخ الإنتاج
  
  // Custom texts
  customHeader?: string;
  customFooter?: string;
  defaultPrice?: number;
  currencySymbol?: string;
  
  // Barcode appearance
  barcodeFormat: BarcodeFormat;
  barcodeHeightPx: number;     // ارتفاع خطوط الباركود بالبكسل
  barcodeThickness: number;    // سمك الخطوط (1, 2, 3)
  fontSizeLevel: 'xs' | 'sm' | 'base'; // حجم الخطوط
  borderStyle: 'solid' | 'dashed' | 'none'; // إطار الملصق
  
  // Print settings
  copiesMode: 'actual_qty' | 'single_each' | 'custom_fixed'; // وضع عدد النسخ
  defaultFixedCopies: number;

  // Barcode Auto-Sequence Settings (التسلسل التلقائي للباركود)
  sequencePrefix: string;       // بداية التسلسل / البادئة (مثال: PM)
  lastSequenceNumber: number;   // آخر رقم تسلسلي تم توليده في النظام
  sequencePadding?: number;     // عدد خانات الترقيم (افتراضي 5 -> 00001)
}

export interface BarcodePrintItem {
  id: string;
  batchId?: string;
  batchNumber?: string;
  orderNumber: string;        // الرقم
  productName: string;        // الاسم
  productType: string;        // النوع
  size: string;               // المقاس
  color: string;              // اللون
  barcodeValue: string;       // كود الباركود المشفر
  actualQuantity: number;     // الكمية الفعلية المشطبة
  printQuantity: number;      // عدد الملصقات المطلوب طباعتها
  price?: number;             // السعر إن وجد
  factoryName?: string;       // اسم المصنع
  date?: string;              // تاريخ الإنتاج
  customFooter?: string;      // نص تذييل الملصق المخصص
  notes?: string;             // ملاحظات إضافية
}
