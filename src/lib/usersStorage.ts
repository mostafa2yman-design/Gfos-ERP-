import { AppUser, UserRole, PermissionKey, ScreenId, StandardAction, SensitiveDataKey } from '../types';
import {
  ENTERPRISE_ROLES,
  getDefaultScreenPermissionsForRole,
  getDefaultSensitivePermissionsForRole,
  canUserAccessScreen,
  canUserPerformAction,
  canUserViewSensitiveData,
  ALL_SCREENS_METADATA,
  ALL_SENSITIVE_DATA_METADATA
} from './permissionsConfig';

export interface PermissionMeta {
  key: PermissionKey;
  label: string;
  category: string;
  description: string;
}

export const ALL_PERMISSIONS_METADATA: PermissionMeta[] = [
  // Dashboard
  { key: 'dashboard.view', label: 'عرض لوحة التحكم والإحصائيات', category: 'لوحة التحكم', description: 'الاطلاع على ملخص الإنتاج ومؤشرات الأداء العامة' },

  // Production Orders
  { key: 'production.view', label: 'عرض أوامر الإنتاج', category: 'أوامر الإنتاج', description: 'الاطلاع على جدول وقائمة أوامر التشغيل والباتشات' },
  { key: 'production.create', label: 'إنشاء أمر إنتاج جديد', category: 'أوامر الإنتاج', description: 'فتح أمر شغل وتحديد الكميات والمقاسات والألوان' },
  { key: 'production.edit', label: 'تعديل أوامر الإنتاج والباتشات', category: 'أوامر الإنتاج', description: 'تعديل بيانات التشغيل ومسارات المراحل والعمالة' },
  { key: 'production.delete', label: 'حذف أوامر الإنتاج', category: 'أوامر الإنتاج', description: 'حذف أمر شغل نهائياً من النظام' },
  { key: 'production.print', label: 'طباعة كروت وتذاكر التشغيل', category: 'أوامر الإنتاج', description: 'طباعة تذكرة التشغيل، كروت الباتش، وأوامر القص' },
  { key: 'production.approve', label: 'اعتماد أوامر التشغيل والباتشات', category: 'أوامر الإنتاج', description: 'التوقيع والختم الإداري على أوامر التشغيل' },

  // Stages
  { key: 'stage.cut', label: 'اعتماد وتسجيل مرحلة القص', category: 'مراحل التشغيل', description: 'إدخال أوزان القماش الفعلية واعتماد كارت القص' },
  { key: 'stage.prep', label: 'تجهيز وصرف مستلزمات التشغيل', category: 'مراحل التشغيل', description: 'صرف الإكسسوارات والخيوط والسوست للباتشات' },
  { key: 'stage.sewing', label: 'تسجيل واعتماد مرحلة الخياطة', category: 'مراحل التشغيل', description: 'متابعة خطوط التجميع والخياطة واعتماد الكميات' },
  { key: 'stage.finishing', label: 'تسجيل مرحلة الفنش والكي', category: 'مراحل التشغيل', description: 'متابعة الكي والتشطيب النهائي والمراجعة' },
  { key: 'stage.quality', label: 'فحص ومراقبة الجودة (QC)', category: 'مراحل التشغيل', description: 'تسجيل المعيب والفرز الأول والثاني واعتماد الجودة' },
  { key: 'stage.packing', label: 'التعبئة والتغليف والباركود', category: 'مراحل التشغيل', description: 'توليد أرقام السيريال وطباعة الباركود وتعبئة الكراتين' },

  // Warehouses
  { key: 'warehouse.raw_materials.view', label: 'عرض مخزن الأقمشة والإكسسوارات', category: 'المخازن', description: 'الاطلاع على أرصدة الخامات والأقمشة والمستلزمات' },
  { key: 'warehouse.raw_materials.manage', label: 'إدارة وحركات مخزن الخامات', category: 'المخازن', description: 'تسجيل تسويات جردية وإذن صرف أو إضافة خامات' },
  { key: 'warehouse.finished_goods.view', label: 'عرض مخزن المنتجات التامة', category: 'المخازن', description: 'متابعة بضاعة الفرز الأول والثاني الجاهزة للتسليم' },
  { key: 'warehouse.finished_goods.manage', label: 'إدارة وتسليم المنتجات التامة', category: 'المخازن', description: 'تسجيل تسليمات العملاء وأذون صرف المنتج التام' },

  // Purchases
  { key: 'purchases.view', label: 'عرض فواتير المشتريات والتوريد', category: 'المشتريات', description: 'الاطلاع على فواتير شراء الخامات وحسابات الموردين' },
  { key: 'purchases.create', label: 'تسجيل فواتير شراء جديدة', category: 'المشتريات', description: 'إدخال فواتير توريد الأقمشة والإكسسوارات وتأثيرها المخزني' },
  { key: 'purchases.edit', label: 'تعديل فواتير الشراء', category: 'المشتريات', description: 'تعديل أسعار وبنود فواتير الشراء المسجلة' },
  { key: 'purchases.delete', label: 'حذف فواتير الشراء', category: 'المشتريات', description: 'إلغاء وحذف فواتير الشراء' },
  { key: 'purchases.approve', label: 'اعتماد فواتير الشراء والموردين', category: 'المشتريات', description: 'الموافقة الرسمية على استحقاق فواتير التوريد' },

  // Sales
  { key: 'sales.view', label: 'عرض فواتير المبيعات ومسحوبات العملاء', category: 'المبيعات', description: 'الاطلاع على فواتير بيع الملابس والمنتجات التامة والذمم' },
  { key: 'sales.create', label: 'إصدار فواتير بيع جديدة', category: 'المبيعات', description: 'إنشاء فواتير بيع للمنتجات التامة والخصومات والتحصيل' },
  { key: 'sales.edit', label: 'تعديل فواتير البيع', category: 'المبيعات', description: 'تعديل بنود وأسعار فواتير المبيعات' },
  { key: 'sales.delete', label: 'حذف فواتير البيع', category: 'المبيعات', description: 'إلغاء وحذف فواتير المبيعات' },
  { key: 'sales.approve', label: 'اعتماد فواتير المبيعات والائتمان', category: 'المبيعات', description: 'اعتماد تخفيضات الأسعار وأوامر صرف المبيعات' },

  // Accounting & Costing
  { key: 'accounting.chart_of_accounts', label: 'إدارة شجرة الحسابات ودليل التكاليف', category: 'الحسابات والتكاليف', description: 'الاطلاع وتعديل شجرة الحسابات الصناعية والإنتاج تحت التشغيل' },
  { key: 'accounting.customers_suppliers', label: 'إدارة دليل العملاء والموردين', category: 'الحسابات والتكاليف', description: 'تسجيل وتعديل بيانات العملاء والموردين' },
  { key: 'accounting.materials_catalog', label: 'إدارة كتالوج الخامات القياسية', category: 'الحسابات والتكاليف', description: 'تحديد الأسعار المعيارية للأقمشة والإكسسوارات' },
  { key: 'accounting.labor_rates', label: 'إدارة مصفوفة أجور العمالة والأقسام', category: 'الحسابات والتكاليف', description: 'تحديد سعر القطعة والدقيقة للمراحل الإنتاجية' },
  { key: 'accounting.view_financials', label: 'الاطلاع على القيم المالية والتكاليف والأرباح', category: 'الحسابات والتكاليف', description: 'رؤية تكاليف الإنتاج، هوامش الربح، والتقارير المالية الحساسة' },
  { key: 'accounting.journal_entries', label: 'القيود اليومية المحاسبية', category: 'الحسابات والتكاليف', description: 'إدخال ومراجعة قيود اليومية العامة المزدوجة' },
  { key: 'accounting.financial_statements', label: 'القوائم المالية والختامية', category: 'الحسابات والتكاليف', description: 'قائمة الدخل، الميزانية العمومية، وتدفق النقدية' },
  { key: 'accounting.treasury', label: 'حركة الخزينة والسيولة', category: 'الحسابات والتكاليف', description: 'سندات القبض والصرف وإدارة الصناديق' },

  // Operations & HR
  { key: 'factory.operator_station', label: 'محطة تشغيل الأقسام والمشغلين', category: 'تشغيل الصالة', description: 'تسجيل الإنتاجية المباشرة من خطوط الخياطة والقص' },
  { key: 'factory.floor_monitor', label: 'شاشة صالة المصنع (TV Mode)', category: 'تشغيل الصالة', description: 'عرض مؤشرات إنجاز الصالة على شاشات المتابعة' },
  { key: 'hr.view_payroll', label: 'عرض رواتب ومستحقات العمال', category: 'الموارد البشرية', description: 'الاطلاع على إنتاجية ومستحقات الفنيين والعمال' },
  { key: 'hr.manage_payroll', label: 'إدارة الرواتب والبدلات والخصومات', category: 'الموارد البشرية', description: 'تعديل وصرف مستحقات العمالة وحوافز الإنتاج' },

  // Admin & System
  { key: 'admin.users_management', label: 'إدارة المستخدمين والصلاحيات (RBAC)', category: 'إدارة النظام', description: 'إنشاء المستخدمين، تحديد كلمات المرور، وضبط الصلاحيات' },
  { key: 'admin.system_settings', label: 'إعدادات النظام والمظهر', category: 'إدارة النظام', description: 'تخصيص ألوان وتفضيلات النظام والنسخ الاحتياطي' },
  { key: 'admin.audit_logs', label: 'سجل الرقابة والتدقيق الإداري', category: 'إدارة النظام', description: 'مراجعة كافة العمليات وتغييرات الصلاحيات وحركات الاعتماد' }
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = ALL_PERMISSIONS_METADATA.map(p => p.key);

// Helper to generate full permissions for admin
export function getAdminPermissions(): Record<PermissionKey, boolean> {
  const perm: Partial<Record<PermissionKey, boolean>> = {};
  ALL_PERMISSION_KEYS.forEach(key => {
    perm[key] = true;
  });
  return perm as Record<PermissionKey, boolean>;
}

// Generate legacy permission map based on role
export function getDefaultPermissionsForRole(role: UserRole): Record<PermissionKey, boolean> {
  const perm: Record<PermissionKey, boolean> = {} as any;
  ALL_PERMISSION_KEYS.forEach(k => {
    perm[k] = false;
  });

  if (role === 'admin' || role === 'general_manager') {
    ALL_PERMISSION_KEYS.forEach(k => {
      perm[k] = true;
    });
    return perm;
  }

  // Base permission
  perm['dashboard.view'] = true;
  perm['production.view'] = true;

  if (role === 'factory_manager') {
    ALL_PERMISSION_KEYS.forEach(k => {
      if (k !== 'admin.users_management') perm[k] = true;
    });
    return perm;
  }

  if (role === 'production_manager') {
    perm['production.create'] = true;
    perm['production.edit'] = true;
    perm['production.delete'] = true;
    perm['production.print'] = true;
    perm['production.approve'] = true;
    perm['stage.cut'] = true;
    perm['stage.prep'] = true;
    perm['stage.sewing'] = true;
    perm['stage.finishing'] = true;
    perm['stage.quality'] = true;
    perm['stage.packing'] = true;
    perm['warehouse.raw_materials.view'] = true;
    perm['warehouse.finished_goods.view'] = true;
    perm['warehouse.finished_goods.manage'] = true;
    perm['accounting.customers_suppliers'] = true;
    perm['accounting.materials_catalog'] = true;
    perm['accounting.labor_rates'] = true;
    perm['accounting.view_financials'] = true;
    perm['factory.operator_station'] = true;
    perm['factory.floor_monitor'] = true;
    perm['hr.view_payroll'] = true;
  } else if (role === 'warehouse_keeper') {
    perm['warehouse.raw_materials.view'] = true;
    perm['warehouse.raw_materials.manage'] = true;
    perm['warehouse.finished_goods.view'] = true;
    perm['warehouse.finished_goods.manage'] = true;
    perm['stage.prep'] = true;
    perm['purchases.view'] = true;
    perm['purchases.create'] = true;
    perm['production.print'] = true;
  } else if (role === 'purchasing_officer') {
    perm['purchases.view'] = true;
    perm['purchases.create'] = true;
    perm['purchases.edit'] = true;
    perm['purchases.delete'] = true;
    perm['purchases.approve'] = true;
    perm['warehouse.raw_materials.view'] = true;
    perm['accounting.customers_suppliers'] = true;
  } else if (role === 'sales_officer') {
    perm['sales.view'] = true;
    perm['sales.create'] = true;
    perm['sales.edit'] = true;
    perm['sales.delete'] = true;
    perm['sales.approve'] = true;
    perm['warehouse.finished_goods.view'] = true;
    perm['accounting.customers_suppliers'] = true;
  } else if (role === 'cutting_supervisor' || role === 'cutter') {
    perm['stage.cut'] = true;
    perm['production.print'] = true;
    perm['warehouse.raw_materials.view'] = true;
    perm['factory.operator_station'] = true;
    perm['factory.floor_monitor'] = true;
  } else if (role === 'sewing_supervisor') {
    perm['stage.sewing'] = true;
    perm['production.print'] = true;
    perm['factory.operator_station'] = true;
    perm['factory.floor_monitor'] = true;
  } else if (role === 'finishing_packing_supervisor') {
    perm['stage.finishing'] = true;
    perm['stage.packing'] = true;
    perm['production.print'] = true;
    perm['warehouse.finished_goods.view'] = true;
    perm['warehouse.finished_goods.manage'] = true;
  } else if (role === 'quality_supervisor') {
    perm['stage.quality'] = true;
    perm['stage.finishing'] = true;
    perm['stage.packing'] = true;
    perm['production.print'] = true;
  } else if (role === 'accountant') {
    perm['purchases.view'] = true;
    perm['purchases.create'] = true;
    perm['purchases.edit'] = true;
    perm['sales.view'] = true;
    perm['sales.create'] = true;
    perm['sales.edit'] = true;
    perm['accounting.chart_of_accounts'] = true;
    perm['accounting.customers_suppliers'] = true;
    perm['accounting.materials_catalog'] = true;
    perm['accounting.labor_rates'] = true;
    perm['accounting.view_financials'] = true;
    perm['accounting.journal_entries'] = true;
    perm['accounting.financial_statements'] = true;
    perm['accounting.treasury'] = true;
    perm['hr.view_payroll'] = true;
    perm['hr.manage_payroll'] = true;
    perm['warehouse.raw_materials.view'] = true;
    perm['warehouse.finished_goods.view'] = true;
  } else if (role === 'financial_auditor') {
    perm['accounting.chart_of_accounts'] = true;
    perm['accounting.customers_suppliers'] = true;
    perm['accounting.materials_catalog'] = true;
    perm['accounting.labor_rates'] = true;
    perm['accounting.view_financials'] = true;
    perm['accounting.journal_entries'] = true;
    perm['accounting.financial_statements'] = true;
    perm['accounting.treasury'] = true;
    perm['purchases.view'] = true;
    perm['sales.view'] = true;
    perm['warehouse.raw_materials.view'] = true;
    perm['warehouse.finished_goods.view'] = true;
    perm['admin.audit_logs'] = true;
  }

  return perm;
}

export { ROLE_LABELS } from './permissionsConfig';

// Pre-seeded enterprise factory team covering all core positions
export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user_admin',
    username: 'admin',
    fullName: 'المدير العام لمصنع الملابس (Admin)',
    employeeCode: 'EMP-001',
    role: 'admin',
    roleTitle: 'مدير عام النظام (Super Admin)',
    department: 'الإدارة العامة وتكنولوجيا المعلومات',
    email: 'admin@factory.com',
    phone: '01000000001',
    password: 'admin',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getAdminPermissions(),
    screenPermissions: getDefaultScreenPermissionsForRole('admin'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('admin'),
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user_gm',
    username: 'general_mgr',
    fullName: 'أ. عبد الرحمن الشريف',
    employeeCode: 'EMP-002',
    role: 'general_manager',
    roleTitle: 'المدير العام التنفيذي',
    department: 'الإدارة العليا والتنفيذية',
    email: 'gm@factory.com',
    phone: '01001112222',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('general_manager'),
    screenPermissions: getDefaultScreenPermissionsForRole('general_manager'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('general_manager'),
    createdAt: '2026-01-02T00:00:00.000Z'
  },
  {
    id: 'user_factory_mgr',
    username: 'factory_mgr',
    fullName: 'م. إبراهيم الدسوقي',
    employeeCode: 'EMP-003',
    role: 'factory_manager',
    roleTitle: 'مدير المصنع والعمليات',
    department: 'إدارة تشغيل المصنع',
    email: 'factory.manager@factory.com',
    phone: '01005554433',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('factory_manager'),
    screenPermissions: getDefaultScreenPermissionsForRole('factory_manager'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('factory_manager'),
    createdAt: '2026-01-03T00:00:00.000Z'
  },
  {
    id: 'user_prod_mgr',
    username: 'eng_hassan',
    fullName: 'م. حسن عبد الرحمن',
    employeeCode: 'EMP-004',
    role: 'production_manager',
    roleTitle: 'مدير الإنتاج والتشغيل',
    department: 'إدارة الإنتاج والتصنيع',
    email: 'hassan@factory.com',
    phone: '01011112233',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('production_manager'),
    screenPermissions: getDefaultScreenPermissionsForRole('production_manager'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('production_manager'),
    createdAt: '2026-01-05T00:00:00.000Z'
  },
  {
    id: 'user_cut_sup',
    username: 'cut_mahmoud',
    fullName: 'أ. محمود رضوان',
    employeeCode: 'EMP-005',
    role: 'cutting_supervisor',
    roleTitle: 'مشرف قسم القص والفرش',
    department: 'قسم القص والتفصيل',
    email: 'cutting@factory.com',
    phone: '01155556677',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('cutting_supervisor'),
    screenPermissions: getDefaultScreenPermissionsForRole('cutting_supervisor'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('cutting_supervisor'),
    createdAt: '2026-01-08T00:00:00.000Z'
  },
  {
    id: 'user_sew_sup',
    username: 'sew_sayed',
    fullName: 'أ. سيد عبد الرحيم',
    employeeCode: 'EMP-006',
    role: 'sewing_supervisor',
    roleTitle: 'مشرف خطوط الخياطة والتجميع',
    department: 'خطوط الخياطة والتجميع',
    email: 'sewing@factory.com',
    phone: '01288889900',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('sewing_supervisor'),
    screenPermissions: getDefaultScreenPermissionsForRole('sewing_supervisor'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('sewing_supervisor'),
    createdAt: '2026-01-09T00:00:00.000Z'
  },
  {
    id: 'user_pack_sup',
    username: 'pack_ashraf',
    fullName: 'أ. أشرف النجار',
    employeeCode: 'EMP-007',
    role: 'finishing_packing_supervisor',
    roleTitle: 'مشرف التشطيب والمكواة والتعبئة',
    department: 'التشطيب والكي والتعبئة',
    email: 'packing@factory.com',
    phone: '01099998877',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('finishing_packing_supervisor'),
    screenPermissions: getDefaultScreenPermissionsForRole('finishing_packing_supervisor'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('finishing_packing_supervisor'),
    createdAt: '2026-01-09T00:00:00.000Z'
  },
  {
    id: 'user_wh_keeper',
    username: 'tarek_store',
    fullName: 'أ. طارق محمود',
    employeeCode: 'EMP-008',
    role: 'warehouse_keeper',
    roleTitle: 'أمين المخازن والمستودعات',
    department: 'إدارة المخازن والمستودعات',
    email: 'tarek@factory.com',
    phone: '01122223344',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('warehouse_keeper'),
    screenPermissions: getDefaultScreenPermissionsForRole('warehouse_keeper'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('warehouse_keeper'),
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'user_purchases',
    username: 'purchase_mostafa',
    fullName: 'أ. مصطفى كمال',
    employeeCode: 'EMP-009',
    role: 'purchasing_officer',
    roleTitle: 'مسؤول المشتريات وتوريد الخامات',
    department: 'إدارة المشتريات والتوريدات',
    email: 'purchases@factory.com',
    phone: '01511223344',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('purchasing_officer'),
    screenPermissions: getDefaultScreenPermissionsForRole('purchasing_officer'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('purchasing_officer'),
    createdAt: '2026-01-12T00:00:00.000Z'
  },
  {
    id: 'user_sales',
    username: 'sales_omar',
    fullName: 'أ. عمر نبيل',
    employeeCode: 'EMP-010',
    role: 'sales_officer',
    roleTitle: 'مسؤول المبيعات والعملاء',
    department: 'إدارة المبيعات والتسويق',
    email: 'sales@factory.com',
    phone: '01222334455',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('sales_officer'),
    screenPermissions: getDefaultScreenPermissionsForRole('sales_officer'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('sales_officer'),
    createdAt: '2026-01-14T00:00:00.000Z'
  },
  {
    id: 'user_accountant',
    username: 'khaled_acc',
    fullName: 'أ. خالد فؤاد',
    employeeCode: 'EMP-011',
    role: 'accountant',
    roleTitle: 'رئيس الحسابات والتكاليف',
    department: 'الإدارة المالية والحسابات',
    email: 'khaled@factory.com',
    phone: '01233334455',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('accountant'),
    screenPermissions: getDefaultScreenPermissionsForRole('accountant'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('accountant'),
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'user_auditor',
    username: 'auditor_yasser',
    fullName: 'أ. ياسر حمدي',
    employeeCode: 'EMP-012',
    role: 'financial_auditor',
    roleTitle: 'المراجع المالي والرقابي',
    department: 'المراجعة والرقابة المالية',
    email: 'auditor@factory.com',
    phone: '01033445566',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('financial_auditor'),
    screenPermissions: getDefaultScreenPermissionsForRole('financial_auditor'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('financial_auditor'),
    createdAt: '2026-01-18T00:00:00.000Z'
  },
  {
    id: 'user_qc_supervisor',
    username: 'samir_qc',
    fullName: 'أ. سمير عبد العال',
    employeeCode: 'EMP-013',
    role: 'quality_supervisor',
    roleTitle: 'مشرف ومراقب الجودة (QC)',
    department: 'إدارة توكيد ومراقبة الجودة',
    email: 'samir@factory.com',
    phone: '01544445566',
    password: '123',
    isActive: true,
    status: 'active',
    language: 'ar',
    permissions: getDefaultPermissionsForRole('quality_supervisor'),
    screenPermissions: getDefaultScreenPermissionsForRole('quality_supervisor'),
    sensitivePermissions: getDefaultSensitivePermissionsForRole('quality_supervisor'),
    createdAt: '2026-02-01T00:00:00.000Z'
  }
];

const USERS_STORAGE_KEY = 'factory_users_v2';
const CURRENT_SESSION_KEY = 'factory_current_session_user_v2';

// Ensure user has valid structure and permissions
function normalizeUser(user: AppUser): AppUser {
  const role = user.role || 'custom';
  const screenPermissions = user.screenPermissions || getDefaultScreenPermissionsForRole(role);
  const sensitivePermissions = user.sensitivePermissions || getDefaultSensitivePermissionsForRole(role);
  const permissions = user.permissions || getDefaultPermissionsForRole(role);

  return {
    ...user,
    role,
    isActive: user.isActive !== undefined ? user.isActive : true,
    status: user.status || (user.isActive ? 'active' : 'inactive'),
    language: user.language || 'ar',
    permissions,
    screenPermissions,
    sensitivePermissions
  };
}

export function getStoredUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      // Check legacy key
      const legacyRaw = localStorage.getItem('factory_users_v1');
      if (legacyRaw) {
        try {
          const parsedLegacy: AppUser[] = JSON.parse(legacyRaw);
          const migrated = parsedLegacy.map(normalizeUser);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        } catch {
          // Fall through to defaults
        }
      }
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }

    const users: AppUser[] = JSON.parse(raw);
    const normalized = users.map(normalizeUser);

    // Ensure admin exists and has all permissions
    const adminIndex = normalized.findIndex(u => u.username === 'admin' || u.role === 'admin');
    if (adminIndex === -1) {
      normalized.unshift(DEFAULT_USERS[0]);
    } else {
      normalized[adminIndex].permissions = getAdminPermissions();
      normalized[adminIndex].screenPermissions = getDefaultScreenPermissionsForRole('admin');
      normalized[adminIndex].sensitivePermissions = getDefaultSensitivePermissionsForRole('admin');
      normalized[adminIndex].isActive = true;
      normalized[adminIndex].status = 'active';
    }

    return normalized;
  } catch (e) {
    console.error('Failed to load users from storage:', e);
    return DEFAULT_USERS;
  }
}

export function saveStoredUsers(users: AppUser[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  
  // Real-time broadcast for all components & tabs
  window.dispatchEvent(new CustomEvent('users_updated'));
  window.dispatchEvent(new CustomEvent('permission_updated'));
}

/**
 * Gets the current active user.
 * CRITICAL REQUIREMENT: "اجعل اليوزر الافتراضي هو الادمن"
 * If no session is saved yet, defaults to the ADMIN user!
 */
export function getActiveSessionUser(): AppUser {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY);
    const users = getStoredUsers();
    const adminUser = users.find(u => u.username === 'admin' || u.role === 'admin') || DEFAULT_USERS[0];

    if (!raw) {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(adminUser));
      return adminUser;
    }

    const current: AppUser = JSON.parse(raw);
    // Match against latest user list to get updated permissions immediately!
    const matched = users.find(u => u.id === current.id || u.username === current.username);
    if (!matched || !matched.isActive || matched.status === 'suspended') {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(adminUser));
      return adminUser;
    }
    return matched;
  } catch (e) {
    console.error('Failed to read session user:', e);
    return DEFAULT_USERS[0];
  }
}

export function setActiveSessionUser(user: AppUser): void {
  const normalized = normalizeUser(user);
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('auth_changed'));
  window.dispatchEvent(new CustomEvent('permission_updated'));
}

export function createStoredUser(data: Omit<AppUser, 'id' | 'createdAt'>): AppUser {
  const users = getStoredUsers();
  
  // Check username uniqueness
  if (users.some(u => u.username.toLowerCase() === data.username.toLowerCase())) {
    throw new Error('اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم مستخدم آخر');
  }

  const role = data.role || 'custom';
  const newUser: AppUser = normalizeUser({
    ...data,
    id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    role,
    isActive: data.isActive !== undefined ? data.isActive : true,
    status: data.status || 'active',
    screenPermissions: data.screenPermissions || getDefaultScreenPermissionsForRole(role),
    sensitivePermissions: data.sensitivePermissions || getDefaultSensitivePermissionsForRole(role),
    permissions: data.permissions || getDefaultPermissionsForRole(role),
    createdAt: new Date().toISOString()
  });

  users.push(newUser);
  saveStoredUsers(users);
  return newUser;
}

export function updateStoredUser(userId: string, data: Partial<AppUser>): AppUser {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) {
    throw new Error('المستخدم غير موجود');
  }

  // Prevent changing admin username to something else or deactivating admin
  if (users[index].username === 'admin') {
    if (data.isActive === false || data.status === 'suspended') {
      throw new Error('لا يمكن تعطيل أو إيقاف حساب مدير النظام الرئيسي');
    }
    if (data.role && data.role !== 'admin') {
      throw new Error('لا يمكن تغيير دور مدير النظام الرئيسي');
    }
  }

  const updated: AppUser = normalizeUser({
    ...users[index],
    ...data
  });

  users[index] = updated;
  saveStoredUsers(users);

  // If currently active user was updated, refresh session immediately (Live Permission Sync)
  const currentSession = getActiveSessionUser();
  if (currentSession.id === userId) {
    setActiveSessionUser(updated);
  }

  return updated;
}

export function deleteStoredUser(userId: string): void {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;

  if (user.username === 'admin' || user.role === 'admin') {
    throw new Error('لا يمكن حذف حساب مدير النظام الرئيسي');
  }

  const filtered = users.filter(u => u.id !== userId);
  saveStoredUsers(filtered);

  // If deleted user was active, switch to admin
  const currentSession = getActiveSessionUser();
  if (currentSession.id === userId) {
    const admin = filtered.find(u => u.username === 'admin') || DEFAULT_USERS[0];
    setActiveSessionUser(admin);
  }
}

export function resetUsersToDefaults(): AppUser[] {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  setActiveSessionUser(DEFAULT_USERS[0]);
  window.dispatchEvent(new CustomEvent('users_updated'));
  window.dispatchEvent(new CustomEvent('permission_updated'));
  return DEFAULT_USERS;
}

export function hasUserPermission(user: AppUser | null, permission: PermissionKey): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'admin') return true;
  return !!user.permissions[permission];
}

export {
  canUserAccessScreen,
  canUserPerformAction,
  canUserViewSensitiveData
};
