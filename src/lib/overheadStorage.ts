import { ProductionOrder } from '../types';

export type OverheadStageKey = 'cut' | 'prep' | 'print' | 'sew' | 'finish' | 'ironing' | 'packing';

export interface StageAllocationPercentages {
  cut: number;      // % for Cutting (مرحلة القص)
  prep: number;     // % for Prep (مرحلة التجهيز)
  print: number;    // % for Print/Embroidery (الطباعة والتطريز)
  sew: number;      // % for Sewing (الخياطة والتجميع)
  finish: number;   // % for Finishing (التشطيب)
  ironing: number;  // % for Ironing (المكواة)
  packing: number;  // % for Packing (التغليف)
}

export interface OverheadCostCategory {
  id: string;
  name: string;
  code: string;
  accountCode: string;
  accountName: string;
  description?: string;
  monthlyAmount: number;
  ratePerPiece: number;
  allocationMethod: 'per_piece' | 'monthly_budget';
  estimatedMonthlyUnits: number;
  isActive: boolean;
  stageAllocations: StageAllocationPercentages;
}

export interface OrderStageOverheadItem {
  stageKey: OverheadStageKey;
  stageName: string;
  standardPerPiece: number;
  standardTotal: number;
  actualPerPiece: number | null;
  actualTotal: number | null;
  isApproved: boolean;
  approvedAt?: string;
  accountCode: string;
}

export interface OrderOverheadAnalysis {
  categories: Array<{
    category: OverheadCostCategory;
    ratePerPiece: number;
    totalStandard: number;
    totalActual: number | null;
  }>;
  stageBreakdown: Record<OverheadStageKey, OrderStageOverheadItem>;
  totalStandardPerPiece: number;
  totalStandardOrder: number;
  totalActualPerPiece: number | null;
  totalActualOrder: number | null;
  absorbedActualOrder: number;
  isFullyAbsorbed: boolean;
}

export const STAGE_NAMES_AR: Record<OverheadStageKey, string> = {
  cut: 'مرحلة القص والتفصيل',
  prep: 'مرحلة التجهيز والمستلزمات',
  print: 'مرحلة الطباعة والتطريز',
  sew: 'مرحلة الخياطة والتجميع',
  finish: 'مرحلة التشطيب وإزالة الزوائد',
  ironing: 'مرحلة المكواة',
  packing: 'مرحلة التعبئة والتغليف'
};

export const STAGE_WIP_ACCOUNTS: Record<OverheadStageKey, { code: string; name: string }> = {
  cut: { code: '12421', name: 'إنتاج تحت التشغيل - مرحلة القص والتجهيز' },
  prep: { code: '12421', name: 'إنتاج تحت التشغيل - مرحلة القص والتجهيز' },
  print: { code: '12423', name: 'إنتاج تحت التشغيل - مرحلة الطباعة والتطريز الخارجي' },
  sew: { code: '12422', name: 'إنتاج تحت التشغيل - مرحلة الخياطة والتجميع' },
  finish: { code: '12424', name: 'إنتاج تحت التشغيل - مرحلة الكي والتشطيب والفنش' },
  ironing: { code: '12424', name: 'إنتاج تحت التشغيل - مرحلة الكي والتشطيب والفنش' },
  packing: { code: '12425', name: 'إنتاج تحت التشغيل - مرحلة التعبئة والتغليف النهائي' }
};

const STORAGE_KEY = 'manufacturing_overhead_categories_v1';

export const DEFAULT_OVERHEAD_CATEGORIES: OverheadCostCategory[] = [
  {
    id: 'oh_elec',
    name: 'كهرباء وقوى محركة المصنع',
    code: 'MOH-01',
    accountCode: '521',
    accountName: 'قوى محركة وكهرباء ومياه المصنع',
    description: 'استهلاك التيار الكهربائي وتشغيل محركات ماكينات الخياطة والمكواة والإنارة الصناعية',
    monthlyAmount: 45000,
    ratePerPiece: 4.5,
    allocationMethod: 'per_piece',
    estimatedMonthlyUnits: 10000,
    isActive: true,
    stageAllocations: {
      cut: 15,
      prep: 5,
      print: 10,
      sew: 40,
      finish: 5,
      ironing: 20,
      packing: 5
    }
  },
  {
    id: 'oh_rent',
    name: 'إيجار عنابر ومباني المصنع',
    code: 'MOH-02',
    accountCode: '525',
    accountName: 'إيجار هناجر ومباني ورش التصنيع',
    description: 'القيمة الإيجارية الشهرية لهناجر الإنتاج ومستودعات التجهيز وصالات التشغيل',
    monthlyAmount: 35000,
    ratePerPiece: 3.5,
    allocationMethod: 'per_piece',
    estimatedMonthlyUnits: 10000,
    isActive: true,
    stageAllocations: {
      cut: 20,
      prep: 10,
      print: 10,
      sew: 35,
      finish: 10,
      ironing: 5,
      packing: 10
    }
  },
  {
    id: 'oh_deprec',
    name: 'إهلاك الآلات وخطوط الإنتاج',
    code: 'MOH-03',
    accountCode: '524',
    accountName: 'إهلاك خطوط وآلات ومعدات المصنع',
    description: 'القسط الشهري لإهلاك ماكينات الأورليه، السنجر، الأوفر، مقصات القماش، ومحطات الكي',
    monthlyAmount: 30000,
    ratePerPiece: 3.0,
    allocationMethod: 'per_piece',
    estimatedMonthlyUnits: 10000,
    isActive: true,
    stageAllocations: {
      cut: 20,
      prep: 5,
      print: 10,
      sew: 45,
      finish: 5,
      ironing: 15,
      packing: 0
    }
  },
  {
    id: 'oh_maint',
    name: 'صيانة وقطع غيار وزيوت الماكينات',
    code: 'MOH-04',
    accountCode: '523',
    accountName: 'صيانة وقطع غيار وزيوت ماكينات الإنتاج',
    description: 'عقود الصيانة الدورية وشراء الإبر، الكروشيهات، وسيور التشغيل وزيوت التزييت',
    monthlyAmount: 15000,
    ratePerPiece: 1.5,
    allocationMethod: 'per_piece',
    estimatedMonthlyUnits: 10000,
    isActive: true,
    stageAllocations: {
      cut: 20,
      prep: 5,
      print: 5,
      sew: 50,
      finish: 5,
      ironing: 15,
      packing: 0
    }
  },
  {
    id: 'oh_super',
    name: 'إشراف ومراقبة جودة الإنتاج',
    code: 'MOH-05',
    accountCode: '526',
    accountName: 'مرتبات المشرفين ومراقبي الجودة ومديري الإنتاج',
    description: 'تكاليف الإشراف الفني الميداني ومفتشي الجودة بين مراحل التشغيل',
    monthlyAmount: 25000,
    ratePerPiece: 2.5,
    allocationMethod: 'per_piece',
    estimatedMonthlyUnits: 10000,
    isActive: true,
    stageAllocations: {
      cut: 15,
      prep: 10,
      print: 15,
      sew: 35,
      finish: 15,
      ironing: 5,
      packing: 5
    }
  }
];

export function getOverheadCategories(): OverheadCostCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_OVERHEAD_CATEGORIES));
      return DEFAULT_OVERHEAD_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_OVERHEAD_CATEGORIES));
      return DEFAULT_OVERHEAD_CATEGORIES;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load overhead categories:', e);
    return DEFAULT_OVERHEAD_CATEGORIES;
  }
}

export function saveOverheadCategories(items: OverheadCostCategory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('overhead_categories_updated'));
}

export function resetOverheadCategoriesToDefault(): void {
  saveOverheadCategories(DEFAULT_OVERHEAD_CATEGORIES);
}

/**
 * Calculates manufacturing overhead costs for a given production order,
 * broken down per stage and reflecting approvals.
 */
export function calculateOrderOverheadAnalysis(order: ProductionOrder): OrderOverheadAnalysis {
  const categories = getOverheadCategories().filter(c => c.isActive !== false);

  // Determine standard and actual quantities
  let standardQty = (order.sizes || []).reduce((acc: number, s) => {
    return acc + (s.variants || []).reduce((vAcc, v) => vAcc + (Number(v.quantity) || 0), 0);
  }, 0) || 1;

  let actualCutPieces = 0;
  if (order.cutData?.sizes) {
    order.cutData.sizes.forEach((s: any) => {
      (s.variants || []).forEach((v: any) => {
        actualCutPieces += (Number(v.actualQuantity) || 0);
      });
    });
  }
  const effectiveActualQty = actualCutPieces > 0 ? actualCutPieces : standardQty;

  // Determine stage approval status
  const cutStatuses = ['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];
  const prepStatuses = ['التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];
  const printStatuses = ['الطباعة والتطريز مكتمل', 'الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];
  const sewStatuses = ['الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];
  const finishStatuses = ['التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'];
  const ironStatuses = ['المكواة مكتملة', 'التغليف معتمد', 'مغلق'];
  const packStatuses = ['التغليف معتمد', 'مغلق'];

  const isCutApproved = Boolean(order.cutApprovedAt || order.cutData?.approvedAt || cutStatuses.includes(order.status));
  const isPrepApproved = Boolean(order.prepApprovedAt || prepStatuses.includes(order.status) || (order.batches && order.batches.some(b => b.prepApprovedAt || b.prepStatus === 'مكتمل')));
  const isPrintApproved = Boolean(order.printEmbroideryApprovedAt || printStatuses.includes(order.status) || (order.batches && order.batches.some(b => (b as any).printEmbroideryApprovedAt || b.printEmbroideryStatus === 'مكتمل')));
  const isSewApproved = Boolean(order.sewingApprovedAt || sewStatuses.includes(order.status) || (order.batches && order.batches.some(b => (b.sewingData as any)?.approvedAt || b.sewingData?.status === 'مكتمل')));
  const isFinishApproved = Boolean(order.finishingApprovedAt || finishStatuses.includes(order.status) || (order.batches && order.batches.some(b => (b.finishingData as any)?.approvedAt || b.finishingData?.status === 'مكتمل')));
  const isIronApproved = Boolean(order.ironingApprovedAt || ironStatuses.includes(order.status) || (order.batches && order.batches.some(b => (b.ironingData as any)?.approvedAt || b.ironingData?.status === 'مكتمل')));
  const isPackApproved = Boolean(order.packingApprovedAt || packStatuses.includes(order.status) || order.status === 'مغلق');

  const stageApprovalMap: Record<OverheadStageKey, { isApproved: boolean; approvedAt?: string }> = {
    cut: { isApproved: isCutApproved, approvedAt: order.cutApprovedAt || order.cutData?.approvedAt },
    prep: { isApproved: isPrepApproved, approvedAt: order.prepApprovedAt },
    print: { isApproved: isPrintApproved, approvedAt: order.printEmbroideryApprovedAt },
    sew: { isApproved: isSewApproved, approvedAt: order.sewingApprovedAt },
    finish: { isApproved: isFinishApproved, approvedAt: order.finishingApprovedAt },
    ironing: { isApproved: isIronApproved, approvedAt: order.ironingApprovedAt },
    packing: { isApproved: isPackApproved, approvedAt: order.packingApprovedAt }
  };

  // Initialize stage breakdown
  const stageKeys: OverheadStageKey[] = ['cut', 'prep', 'print', 'sew', 'finish', 'ironing', 'packing'];
  const stageBreakdown: Record<OverheadStageKey, OrderStageOverheadItem> = {} as any;

  stageKeys.forEach(key => {
    stageBreakdown[key] = {
      stageKey: key,
      stageName: STAGE_NAMES_AR[key],
      standardPerPiece: 0,
      standardTotal: 0,
      actualPerPiece: null,
      actualTotal: null,
      isApproved: stageApprovalMap[key].isApproved,
      approvedAt: stageApprovalMap[key].approvedAt,
      accountCode: STAGE_WIP_ACCOUNTS[key].code
    };
  });

  // Calculate rate per piece and stage allocations across all active categories
  let totalStandardPerPiece = 0;

  const categoryResults = categories.map(cat => {
    const ratePerPiece = cat.allocationMethod === 'monthly_budget' && cat.estimatedMonthlyUnits > 0
      ? (cat.monthlyAmount / cat.estimatedMonthlyUnits)
      : cat.ratePerPiece;

    totalStandardPerPiece += ratePerPiece;

    // Distribute to stages according to percentages
    stageKeys.forEach(stageKey => {
      const pct = (cat.stageAllocations[stageKey] || 0) / 100;
      const stageRate = ratePerPiece * pct;
      stageBreakdown[stageKey].standardPerPiece += stageRate;
    });

    return {
      category: cat,
      ratePerPiece,
      totalStandard: Math.round(ratePerPiece * standardQty * 100) / 100,
      totalActual: null as number | null
    };
  });

  // Finalize stage breakdown totals & apply actuals for approved stages
  let absorbedActualOrder = 0;
  let allStagesApproved = true;

  stageKeys.forEach(stageKey => {
    const item = stageBreakdown[stageKey];
    item.standardPerPiece = Math.round(item.standardPerPiece * 100) / 100;
    item.standardTotal = Math.round(item.standardPerPiece * standardQty * 100) / 100;

    if (item.isApproved) {
      item.actualPerPiece = item.standardPerPiece;
      item.actualTotal = Math.round(item.actualPerPiece * effectiveActualQty * 100) / 100;
      absorbedActualOrder += item.actualTotal;
    } else {
      allStagesApproved = false;
      item.actualPerPiece = null;
      item.actualTotal = null;
    }
  });

  const totalStandardOrder = Math.round(totalStandardPerPiece * standardQty * 100) / 100;
  const isFullyAbsorbed = allStagesApproved;
  const totalActualOrder = isFullyAbsorbed ? Math.round(totalStandardPerPiece * effectiveActualQty * 100) / 100 : null;
  const totalActualPerPiece = isFullyAbsorbed ? Math.round(totalStandardPerPiece * 100) / 100 : null;

  return {
    categories: categoryResults,
    stageBreakdown,
    totalStandardPerPiece: Math.round(totalStandardPerPiece * 100) / 100,
    totalStandardOrder,
    totalActualPerPiece,
    totalActualOrder,
    absorbedActualOrder: Math.round(absorbedActualOrder * 100) / 100,
    isFullyAbsorbed
  };
}
