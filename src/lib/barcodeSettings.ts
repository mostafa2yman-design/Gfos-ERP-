import { BarcodeLabelSettings, BarcodePreset, BarcodePresetId } from '../types/barcode';
import { getFactorySettings } from './storage';
import { ProductionOrder, BatchItem } from '../types';

export const BARCODE_PRESETS: BarcodePreset[] = [
  {
    id: '50x30',
    name: '50 × 30 مم (قياسي حراري للملابس)',
    nameEn: '50x30 mm (Standard Apparel Thermal)',
    widthMm: 50,
    heightMm: 30,
    description: 'المقاس الأكثر شيوعاً واستخداماً لملصقات الملابس والتكت اللاصق'
  },
  {
    id: '50x25',
    name: '50 × 25 مم (مدمج للملصقات الصغيرة)',
    nameEn: '50x25 mm (Compact Thermal)',
    widthMm: 50,
    heightMm: 25,
    description: 'مناسب لملصقات أكياس التعبئة والتغليف الصغيرة'
  },
  {
    id: '40x25',
    name: '40 × 25 مم (صغير الحجم)',
    nameEn: '40x25 mm (Small Label)',
    widthMm: 40,
    heightMm: 25,
    description: 'ملصق صغير للملابس الخفيفة والإكسسوارات'
  },
  {
    id: '60x40',
    name: '60 × 40 مم (متوسط - تفاصيل أكثر)',
    nameEn: '60x40 mm (Medium Label)',
    widthMm: 60,
    heightMm: 40,
    description: 'يسمح بعرض تفاصيل أكبر وخطوط واضحة للمصانع والماركات'
  },
  {
    id: '70x50',
    name: '70 × 50 مم (كبير - كروت التعليق التاج)',
    nameEn: '70x50 mm (Large Hangtag)',
    widthMm: 70,
    heightMm: 50,
    description: 'مثالي لكروت التعليق الورقية والكرتونية للبيع بالتجزئة'
  },
  {
    id: '80x50',
    name: '80 × 50 مم (ملصق كراتين وصناديق الشحن)',
    nameEn: '80x50 mm (Carton / Box Label)',
    widthMm: 80,
    heightMm: 50,
    description: 'ملصق عريض للكراتين والعبوات الإجمالية'
  },
  {
    id: 'custom',
    name: 'مقاس مخصص (أدخل العرض والارتفاع)',
    nameEn: 'Custom Dimensions',
    widthMm: 50,
    heightMm: 30,
    description: 'حدد العرض والارتفاع بالمليمتر حسب نوع ورق الطابعة لديك'
  }
];

const STORAGE_KEY = 'gfos_barcode_label_settings_v2';

export const DEFAULT_BARCODE_SETTINGS: BarcodeLabelSettings = {
  preset: '50x30',
  widthMm: 50,
  heightMm: 30,
  
  // Toggles: المقاس واللون والنوع والرقم والاسم
  showProductName: true,    // الاسم
  showOrderNumber: true,    // الرقم
  showBarcodeNumber: true,  // كود الباركود أسفل الخطوط
  showSize: true,           // المقاس
  showColor: true,          // اللون
  showProductType: true,    // النوع
  showFactoryName: true,    // اسم المصنع
  showBatchNumber: true,    // رقم الباتش
  showPrice: false,         // السعر
  showProductionDate: false, // الغاء التاريخ من الباركود بناء على طلب المستخدم
  
  customHeader: '',
  customFooter: 'صنع في مصر',
  defaultPrice: undefined,
  currencySymbol: 'ج.م',
  
  barcodeFormat: 'CODE128',
  barcodeHeightPx: 38,
  barcodeThickness: 1.5,
  fontSizeLevel: 'sm',
  borderStyle: 'none',
  
  copiesMode: 'actual_qty',
  defaultFixedCopies: 1,

  // Barcode Auto-Sequence Settings (التسلسل التلقائي للباركود)
  sequencePrefix: 'PM',       // بداية التسلسل الافتراضية (مثال: PM)
  lastSequenceNumber: 0,      // آخر رقم تسلسلي تم توليده
  sequencePadding: 5          // عدد خانات الترقيم (5 أصفار: 00001)
};

export function getBarcodeSettings(): BarcodeLabelSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to guarantee all fields exist (مع التأكيد على إلغاء التاريخ دائماً بناء على طلب المستخدم)
      return {
        ...DEFAULT_BARCODE_SETTINGS,
        ...parsed,
        sequencePrefix: parsed.sequencePrefix || DEFAULT_BARCODE_SETTINGS.sequencePrefix,
        lastSequenceNumber: Number(parsed.lastSequenceNumber ?? DEFAULT_BARCODE_SETTINGS.lastSequenceNumber),
        sequencePadding: Number(parsed.sequencePadding || DEFAULT_BARCODE_SETTINGS.sequencePadding),
        showProductionDate: false
      };
    }
  } catch (err) {
    console.error('Failed to parse barcode settings:', err);
  }
  return { ...DEFAULT_BARCODE_SETTINGS };
}

export function saveBarcodeSettings(settings: Partial<BarcodeLabelSettings>): BarcodeLabelSettings {
  try {
    const current = getBarcodeSettings();
    const updated: BarcodeLabelSettings = {
      ...current,
      ...settings
    };
    
    // If preset changed to a known one, sync width and height unless custom
    if (settings.preset && settings.preset !== 'custom') {
      const p = BARCODE_PRESETS.find(x => x.id === settings.preset);
      if (p) {
        updated.widthMm = p.widthMm;
        updated.heightMm = p.heightMm;
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save barcode settings:', err);
    return DEFAULT_BARCODE_SETTINGS;
  }
}

/**
 * Formats a sequence number with a prefix and zero-padding
 * Example: formatBarcodeSequence('PM', 1, 5) => 'PM-00001'
 */
export function formatBarcodeSequence(prefix?: string, seqNum: number = 1, padding: number = 5): string {
  const rawPrefix = (prefix || 'PM').trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'PM';
  const numStr = String(Math.max(1, seqNum)).padStart(padding, '0');
  return `${rawPrefix}-${numStr}`;
}

/**
 * Gets the next barcode sequence code and increments the sequence counter in settings.
 * Saves the updated counter in settings so subsequent calls get the next number.
 */
export function allocateNextBarcode(prefix?: string): string {
  const current = getBarcodeSettings();
  const nextNum = (Number(current.lastSequenceNumber) || 0) + 1;
  const effPrefix = prefix || current.sequencePrefix || 'PM';
  const padding = current.sequencePadding || 5;
  const barcode = formatBarcodeSequence(effPrefix, nextNum, padding);
  
  // Persist the incremented lastSequenceNumber
  saveBarcodeSettings({
    lastSequenceNumber: nextNum
  });
  
  return barcode;
}

/**
 * Allocates a batch of sequential barcodes and increments the sequence counter once.
 */
export function allocateNextBarcodes(count: number, prefix?: string): string[] {
  if (count <= 0) return [];
  const current = getBarcodeSettings();
  const startNum = (Number(current.lastSequenceNumber) || 0) + 1;
  const effPrefix = prefix || current.sequencePrefix || 'PM';
  const padding = current.sequencePadding || 5;
  
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(formatBarcodeSequence(effPrefix, startNum + i, padding));
  }
  
  saveBarcodeSettings({
    lastSequenceNumber: startNum + count - 1
  });
  
  return codes;
}

/**
 * Peeks the next barcode code that will be generated without incrementing the counter.
 */
export function peekNextBarcode(prefix?: string, offset: number = 1): string {
  const current = getBarcodeSettings();
  const nextNum = (Number(current.lastSequenceNumber) || 0) + offset;
  const effPrefix = prefix || current.sequencePrefix || 'PM';
  const padding = current.sequencePadding || 5;
  return formatBarcodeSequence(effPrefix, nextNum, padding);
}

/**
 * Ensures that all finished items in an order have sequential barcodes assigned.
 * Auto-increments from the last sequence number and persists to settings and order.
 * Keeps barcodes associated with the order in warehouse and sales invoices.
 */
export function ensureOrderFinishingBarcodes(
  order: ProductionOrder,
  batches?: BatchItem[]
): { order: ProductionOrder; didAllocateNew: boolean } {
  const current = getBarcodeSettings();
  let nextSeq = Number(current.lastSequenceNumber) || 0;
  const prefix = current.sequencePrefix || 'PM';
  const padding = current.sequencePadding || 5;
  let didAllocateNew = false;
  const orderBarcodesMap: Record<string, string> = { ...(order.barcodes || {}) };

  const targetBatches = (batches && batches.length > 0) ? batches : (order.batches || []);
  
  const updatedBatches = targetBatches.map(b => {
    const finishingQuantities = b.finishingData?.actualQuantities;
    if (!finishingQuantities || finishingQuantities.length === 0) return b;

    const updatedActualQuantities = finishingQuantities.map(q => {
      const keyBatch = `${b.batchNumber}_${q.size}_${q.color}`;
      const keySimple = `${q.size}_${q.color}`;
      let barcodeVal = q.barcode || orderBarcodesMap[keyBatch] || orderBarcodesMap[keySimple];

      if (!barcodeVal) {
        nextSeq += 1;
        barcodeVal = formatBarcodeSequence(prefix, nextSeq, padding);
        didAllocateNew = true;
      }

      orderBarcodesMap[keyBatch] = barcodeVal;
      orderBarcodesMap[keySimple] = barcodeVal;

      return {
        ...q,
        barcode: barcodeVal
      };
    });

    return {
      ...b,
      finishingData: {
        ...b.finishingData!,
        actualQuantities: updatedActualQuantities
      }
    };
  });

  if (didAllocateNew) {
    saveBarcodeSettings({ lastSequenceNumber: nextSeq });
  }

  const primaryBarcode = order.barcode || Object.values(orderBarcodesMap)[0] || '';

  const updatedOrder: ProductionOrder = {
    ...order,
    barcode: primaryBarcode,
    barcodes: orderBarcodesMap,
    batches: updatedBatches
  };

  return { order: updatedOrder, didAllocateNew };
}

/**
 * Generates an alphanumeric barcode string for Code128 encoding
 * If existingBarcode is provided, it is returned. Otherwise generates standard code.
 */
export function generateBarcodeValue(
  orderNumber: string,
  size: string,
  color: string,
  batchNumber?: string,
  existingBarcode?: string
): string {
  if (existingBarcode && existingBarcode.trim().length > 0) {
    return existingBarcode.trim().toUpperCase();
  }
  // Clean order number (remove non-alphanumeric except hyphen)
  const cleanOrder = (orderNumber || 'ORD').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase() || 'ORD';
  const cleanBatch = batchNumber ? `B${batchNumber.replace(/[^0-9]/g, '') || '1'}` : '';
  const cleanSize = (size || 'U').replace(/\s+/g, '').toUpperCase();
  
  // Convert color to short Latin or transliterated or hash for standard scanner readability
  const colorCode = transliterateArabicColor(color);
  
  const parts = [cleanOrder];
  if (cleanBatch) parts.push(cleanBatch);
  parts.push(cleanSize);
  if (colorCode) parts.push(colorCode);

  return parts.join('-');
}

function transliterateArabicColor(color: string): string {
  if (!color) return '';
  const trimmed = color.trim().toLowerCase();
  
  const map: Record<string, string> = {
    'أسود': 'BLK',
    'اسود': 'BLK',
    'أبيض': 'WHT',
    'ابيض': 'WHT',
    'كحلي': 'NVY',
    'أزرق': 'BLU',
    'ازرق': 'BLU',
    'أحمر': 'RED',
    'احمر': 'RED',
    'أخضر': 'GRN',
    'اخضر': 'GRN',
    'رمادي': 'GRY',
    'رصاصي': 'GRY',
    'بيج': 'BEG',
    'أصفر': 'YEL',
    'اصفر': 'YEL',
    'بني': 'BRN',
    'نبيتي': 'BUR',
    'زيتي': 'OLV',
    'وردي': 'PNK',
    'بنفسجي': 'PUR',
    'برتقالي': 'ORG'
  };

  if (map[trimmed]) return map[trimmed];
  
  // If latin already
  if (/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return trimmed.substring(0, 4).toUpperCase();
  }

  // Fallback 2-digit code
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) - hash) + trimmed.charCodeAt(i);
    hash |= 0;
  }
  return `C${Math.abs(hash % 99) + 10}`;
}
