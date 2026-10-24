import { AccountNode, CustomerSupplier, MaterialItem, LaborProfile, OperationalGroup, Department } from '../types';
import { MANUFACTURING_CHART_OF_ACCOUNTS, isLegacyOrIncompleteChartOfAccounts } from './manufacturingChartOfAccounts';

const ACCOUNTS_KEY = 'accounting_accounts_v1';
const CUSTOMERS_KEY = 'accounting_customers_v1';
const MATERIALS_KEY = 'accounting_materials_v1';
const LABOR_KEY = 'accounting_labor_v1';
const GROUPS_KEY = 'accounting_groups_v1';
const DEPARTMENTS_KEY = 'accounting_departments_v1';

// Generic CRUD functions for localStorage
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

export const getAccounts = (): AccountNode[] => {
  const items = getItems<AccountNode>(ACCOUNTS_KEY);
  if (items.length === 0 || isLegacyOrIncompleteChartOfAccounts(items)) {
    saveAccounts(MANUFACTURING_CHART_OF_ACCOUNTS);
    return MANUFACTURING_CHART_OF_ACCOUNTS;
  }
  return items;
};

export const saveAccounts = (items: AccountNode[]) => saveItems(ACCOUNTS_KEY, items);

export const resetAccountsToManufacturingCOA = (): AccountNode[] => {
  saveAccounts(MANUFACTURING_CHART_OF_ACCOUNTS);
  return MANUFACTURING_CHART_OF_ACCOUNTS;
};

export const getCustomersSuppliers = (): CustomerSupplier[] => {
  const raw = localStorage.getItem(CUSTOMERS_KEY);
  if (raw === null) {
    const defaults: CustomerSupplier[] = [
      {
        id: 'supp_1',
        name: 'شركة النيل للغزل والمنسوجات',
        type: 'supplier',
        phone: '01012345678',
        contactPerson: 'م. أحمد الشناوي',
        address: 'المحلة الكبرى - المنطقة الصناعية',
        taxId: '100-234-567',
        isActive: true,
      },
      {
        id: 'supp_2',
        name: 'مؤسسة الأهرام لمستلزمات الخياطة والتطريز',
        type: 'supplier',
        phone: '01123456789',
        contactPerson: 'أ. طارق عبد الرحمن',
        address: 'القاهرة - العتبة',
        taxId: '200-345-678',
        isActive: true,
      },
      {
        id: 'supp_3',
        name: 'مصنع الإسكندرية للغزول والميلتون',
        type: 'supplier',
        phone: '01234567890',
        contactPerson: 'حاج مصطفى عثمان',
        address: 'برج العرب - الإسكندرية',
        taxId: '300-456-789',
        isActive: true,
      },
      {
        id: 'supp_4',
        name: 'شركة الشرق الأوسط للكرتون والتغليف',
        type: 'supplier',
        phone: '01098765432',
        contactPerson: 'م. خالد فاروق',
        address: 'مدينة العاشر من رمضان',
        taxId: '400-567-890',
        isActive: true,
      },
      {
        id: 'cust_1',
        name: 'سلسلة متاجر النخبة للأزياء',
        type: 'customer',
        phone: '01055544433',
        contactPerson: 'أ. محمود فوزي',
        address: 'القاهرة - مدينة نصر',
        taxId: '500-678-901',
        isActive: true,
      },
      {
        id: 'both_1',
        name: 'مجموعة الفجر للأقمشة والملابس الجاهزة',
        type: 'both',
        phone: '01288877766',
        contactPerson: 'م. سامح الجيار',
        address: 'شبرا الخيمة',
        taxId: '600-789-012',
        isActive: true,
      }
    ];
    saveItems(CUSTOMERS_KEY, defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
export const saveCustomersSuppliers = (items: CustomerSupplier[]) => saveItems(CUSTOMERS_KEY, items);

export const getMaterials = (): MaterialItem[] => {
  const raw = localStorage.getItem(MATERIALS_KEY);
  if (raw === null) {
    const defaults: MaterialItem[] = [
      { id: 'mat_1', name: 'قماش قطن سنجل جيرسي 100%', type: 'fabric', unit: 'كجم', defaultCost: 220, isActive: true, code: 'FAB-COT-01' },
      { id: 'mat_2', name: 'قماش ميلتون مبطن شتوي ثقيل', type: 'fabric', unit: 'كجم', defaultCost: 280, isActive: true, code: 'FAB-MEL-02' },
      { id: 'mat_3', name: 'قماش بوليستر رياضي معالج ضد العرق', type: 'fabric', unit: 'كجم', defaultCost: 190, isActive: true, code: 'FAB-POL-03' },
      { id: 'mat_4', name: 'قماش جينز قطن 12 أوقية', type: 'fabric', unit: 'متر', defaultCost: 165, isActive: true, code: 'FAB-DEN-04' },
      { id: 'mat_5', name: 'قماش ريب ليكرا للأساور والياقات', type: 'fabric', unit: 'كجم', defaultCost: 240, isActive: true, code: 'FAB-RIB-05' },
      { id: 'mat_6', name: 'خيط خياطة سبان 40/2 بكرة 5000 ياردة', type: 'accessory', unit: 'بكرة', defaultCost: 45, isActive: true, code: 'ACC-THR-01' },
      { id: 'mat_7', name: 'سوستة نحاس معدنية 20 سم بنطلون', type: 'accessory', unit: 'دزينة', defaultCost: 120, isActive: true, code: 'ACC-ZIP-01' },
      { id: 'mat_8', name: 'سوستة عظم بلاستيك 65 سم جاكيت', type: 'accessory', unit: 'قطعة', defaultCost: 18, isActive: true, code: 'ACC-ZIP-02' },
      { id: 'mat_9', name: 'أزرار بوليستر قميص 18 ليني (1000 زر)', type: 'accessory', unit: 'باكو', defaultCost: 85, isActive: true, code: 'ACC-BUT-01' },
      { id: 'mat_10', name: 'تكت رقبة منسوج ساتان براند', type: 'accessory', unit: '1000 قطعة', defaultCost: 350, isActive: true, code: 'ACC-LBL-01' },
      { id: 'mat_11', name: 'أكياس تغليف بولي بروبلين لاصق ذاتي', type: 'accessory', unit: 'باكو (100 كيس)', defaultCost: 60, isActive: true, code: 'ACC-BAG-01' },
      { id: 'mat_12', name: 'كرتون شحن وتصدير 5 طبقات مقوى', type: 'accessory', unit: 'كرتونة', defaultCost: 35, isActive: true, code: 'ACC-BOX-01' },
      { id: 'mat_13', name: 'شريط مطاط كمر 4 سم عالي المرونة', type: 'accessory', unit: 'لفة (50 متر)', defaultCost: 110, isActive: true, code: 'ACC-ELAS-01' },
    ];
    saveItems(MATERIALS_KEY, defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
export const saveMaterials = (items: MaterialItem[]) => {
  saveItems(MATERIALS_KEY, items);
  window.dispatchEvent(new CustomEvent('raw_materials_updated'));
};

export const getLabor = (): LaborProfile[] => {
  const raw = localStorage.getItem(LABOR_KEY);
  if (raw === null) {
    const defaults: LaborProfile[] = [
      {
        id: 'labor_1',
        name: 'محمود عبد الفتاح السيد',
        code: 'LAB-101',
        nationalId: '28910151203456',
        role: 'عامل قص وتفصيل',
        departmentId: 'dept_cut',
        skillLevel: 'فني أول',
        phone: '01012345671',
        city: 'المحلة الكبرى',
        address: 'منطقة الجمهورية',
        hireDate: '2023-01-15',
        salaryType: 'أسبوعي',
        salaryPeriod: 'أسبوعي',
        baseSalary: 1800,
        weeklySalary: 1800,
        dailyWorkingHours: 8,
        linkedAccountId: '5121',
        isActive: true,
        notes: 'مسؤول طاولة القص الرئيسية والمقصات الكهربائية'
      },
      {
        id: 'labor_2',
        name: 'أحمد إبراهيم شلبي',
        code: 'LAB-102',
        nationalId: '29204011604321',
        role: 'عامل خياطة وتجميع',
        departmentId: 'dept_sew',
        skillLevel: 'أسطى / رئيس خط',
        phone: '01123456782',
        city: 'طنطا',
        address: 'شارع البحر',
        hireDate: '2022-06-01',
        salaryType: 'أسبوعي',
        salaryPeriod: 'أسبوعي',
        baseSalary: 2200,
        weeklySalary: 2200,
        dailyWorkingHours: 8,
        linkedAccountId: '5122',
        isActive: true,
        notes: 'أسطى خط التيشيرت والقميص والمراحل الحرجة'
      },
      {
        id: 'labor_3',
        name: 'محمد صابر حسن',
        code: 'LAB-103',
        nationalId: '29508121805678',
        role: 'عامل خياطة وتجميع',
        departmentId: 'dept_sew',
        skillLevel: 'فني تشغيل',
        phone: '01234567893',
        city: 'المحلة الكبرى',
        address: 'شارع سعد زغلول',
        hireDate: '2023-09-10',
        salaryType: 'يومية',
        salaryPeriod: 'أسبوعي',
        baseSalary: 280,
        weeklySalary: 1680,
        dailyWorkingHours: 8,
        linkedAccountId: '5122',
        isActive: true,
        notes: 'ماكينة أوفر لوك 5 فتلة وماكينة أورليه'
      },
      {
        id: 'labor_4',
        name: 'كريم عادل الدسوقي',
        code: 'LAB-104',
        nationalId: '29712051206789',
        role: 'فني تطريز وطباعة',
        departmentId: 'dept_prep',
        skillLevel: 'فني أول',
        phone: '01512345674',
        city: 'المنصورة',
        address: 'حي الجامعة',
        hireDate: '2023-03-20',
        salaryType: 'أسبوعي',
        salaryPeriod: 'أسبوعي',
        baseSalary: 2000,
        weeklySalary: 2000,
        dailyWorkingHours: 8,
        linkedAccountId: '5121',
        isActive: true,
        notes: 'فني شبلونات وطباعة سلك سكرين ومكبس حراري'
      },
      {
        id: 'labor_5',
        name: 'سعيد عبد العال مرسي',
        code: 'LAB-105',
        nationalId: '29003251407890',
        role: 'عامل تشطيب وفنش',
        departmentId: 'dept_finish',
        skillLevel: 'فني تشغيل',
        phone: '01098765435',
        city: 'كفر الدوار',
        address: 'منطقة السكة',
        hireDate: '2023-11-01',
        salaryType: 'بالقطعة',
        salaryPeriod: 'أسبوعي',
        baseSalary: 1500,
        weeklySalary: 1500,
        pieceRate: 3.5,
        dailyWorkingHours: 8,
        linkedAccountId: '5123',
        isActive: true,
        notes: 'تنظيف خيوط وتطبيق وتجهيز التعبئة'
      },
      {
        id: 'labor_6',
        name: 'حسن متولي النجار',
        code: 'LAB-106',
        nationalId: '28807181508901',
        role: 'عامل مكواة وبخار',
        departmentId: 'dept_iron',
        skillLevel: 'فني تشغيل',
        phone: '01187654326',
        city: 'المحلة الكبرى',
        address: 'ميدان الشون',
        hireDate: '2023-05-18',
        salaryType: 'أسبوعي',
        salaryPeriod: 'أسبوعي',
        baseSalary: 1750,
        weeklySalary: 1750,
        dailyWorkingHours: 8,
        linkedAccountId: '5123',
        isActive: true,
        notes: 'مكواة بخار صناعية ومانيكان كبس'
      }
    ];
    saveItems(LABOR_KEY, defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Ensure all existing items have weeklySalary defined
    return parsed.map((item: LaborProfile) => {
      const weekly = item.weeklySalary || (
        item.salaryType === 'أسبوعي' ? (item.baseSalary || 1800) :
        item.salaryType === 'يومية' && item.baseSalary ? (item.baseSalary * 6) :
        item.salaryType === 'شهري' && item.baseSalary ? Math.round(item.baseSalary / 4.33) :
        (item.baseSalary || 1500)
      );
      return {
        ...item,
        weeklySalary: weekly,
        salaryPeriod: item.salaryPeriod || 'أسبوعي'
      };
    });
  } catch {
    return [];
  }
};
export const saveLabor = (items: LaborProfile[]) => saveItems(LABOR_KEY, items);

export const getOperationalGroups = (): OperationalGroup[] => {
  const raw = localStorage.getItem(GROUPS_KEY);
  if (raw === null) {
    const defaults: OperationalGroup[] = [
      { id: 'grp_cut', name: 'عنبر وطاولة القص الآلي', code: 'GRP-CUT-01', type: 'internal', specialty: 'قص وتفصيل', machinesCount: 4, dailyCapacity: 1200, isActive: true },
      { id: 'grp_sew_1', name: 'خط إنتاج خياطة التيشيرت (A)', code: 'GRP-SEW-01', type: 'internal', specialty: 'خياطة وتجميع', machinesCount: 16, dailyCapacity: 800, isActive: true },
      { id: 'grp_sew_2', name: 'خط إنتاج خياطة البنطلون (B)', code: 'GRP-SEW-02', type: 'internal', specialty: 'خياطة وتجميع', machinesCount: 12, dailyCapacity: 500, isActive: true },
      { id: 'grp_finish', name: 'عنبر التشطيب والكي النهائي', code: 'GRP-FIN-01', type: 'internal', specialty: 'تشطيب ومكواة', machinesCount: 6, dailyCapacity: 1500, isActive: true },
      { id: 'grp_out_print', name: 'مطبعة النور الحديثة (تشغيل خارجي)', code: 'GRP-EXT-01', type: 'external', specialty: 'طباعة وتطريز خارجي', contactPerson: 'أ. محمود سامي', phone: '01065432100', isActive: true }
    ];
    saveItems(GROUPS_KEY, defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
export const saveOperationalGroups = (items: OperationalGroup[]) => saveItems(GROUPS_KEY, items);

export const getDepartments = (): Department[] => {
  const raw = localStorage.getItem(DEPARTMENTS_KEY);
  if (raw === null) {
    // Default departments
    const defaults: Department[] = [
      { id: 'dept_cut', name: 'عامل قص', createdAt: new Date().toISOString() },
      { id: 'dept_prep', name: 'عامل تجهيز', createdAt: new Date().toISOString() },
      { id: 'dept_sew', name: 'عامل خياطة', createdAt: new Date().toISOString() },
      { id: 'dept_finish', name: 'عامل تشطيب', createdAt: new Date().toISOString() },
      { id: 'dept_iron', name: 'عامل مكواة', createdAt: new Date().toISOString() },
      { id: 'dept_pack', name: 'عامل تعبئة', createdAt: new Date().toISOString() },
      { id: 'dept_supervisor', name: 'مشرف', createdAt: new Date().toISOString() },
      { id: 'dept_other', name: 'أخرى', createdAt: new Date().toISOString() }
    ];
    saveItems(DEPARTMENTS_KEY, defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
export const saveDepartments = (items: Department[]) => saveItems(DEPARTMENTS_KEY, items);

export const deleteAllCustomersSuppliers = () => saveCustomersSuppliers([]);
export const deleteAllMaterials = () => saveMaterials([]);
export const deleteAllLabor = () => saveLabor([]);
export const deleteAllOperationalGroups = () => saveOperationalGroups([]);
export const deleteAllDepartments = () => saveDepartments([]);
