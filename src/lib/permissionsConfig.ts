import { 
  UserRole, 
  ScreenId, 
  StandardAction, 
  SensitiveDataKey, 
  ScreenPermissionConfig, 
  AppUser 
} from '../types';

export interface ScreenMeta {
  id: ScreenId;
  title: string;
  category: 'admin' | 'production' | 'warehouse' | 'sales_purchases' | 'finance' | 'hr';
  categoryLabel: string;
  description: string;
  supportedActions: StandardAction[];
}

export const ALL_SCREENS_METADATA: ScreenMeta[] = [
  // 1. Admin & Core
  {
    id: 'dashboard',
    title: 'لوحة القيادة والمؤشرات العامة',
    category: 'admin',
    categoryLabel: 'الإدارة العليا وشاشات التحكم',
    description: 'متابعة مؤشرات أداء المصنع، ملخص الإنتاج، التنبيهات الإدارية، وتوزيع الطلبات',
    supportedActions: ['view', 'export', 'print']
  },
  {
    id: 'users',
    title: 'إدارة المستخدمين والصلاحيات (RBAC)',
    category: 'admin',
    categoryLabel: 'الإدارة العليا وشاشات التحكم',
    description: 'التحكم في حسابات الموظفين، الأدوار الوظيفية، مصفوفة الصلاحيات، وسجل التدقيق',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  },
  {
    id: 'settings',
    title: 'إعدادات النظام والتهيئة',
    category: 'admin',
    categoryLabel: 'الإدارة العليا وشاشات التحكم',
    description: 'تخصيص ثيم النظام، النسخ الاحتياطي، وإعدادات باركود المصنع',
    supportedActions: ['view', 'edit']
  },

  // 2. Production & Operations
  {
    id: 'list',
    title: 'أوامر الإنتاج والتشغيل',
    category: 'production',
    categoryLabel: 'التخطيط وأوامر التشغيل',
    description: 'استعراض جدول أوامر التشغيل، التوزيع على خطوط الإنتاج، ومتابعة المراحل',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  },
  {
    id: 'form',
    title: 'إدارة أمر التشغيل والباتشات',
    category: 'production',
    categoryLabel: 'التخطيط وأوامر التشغيل',
    description: 'إدخال المقاسات والألوان، جداول القص، صرف الخامات، الخياطة، ومراقبة الجودة',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  },
  {
    id: 'operator_station',
    title: 'مراحل تشغيل أوامر الإنتاج',
    category: 'production',
    categoryLabel: 'التخطيط وأوامر التشغيل',
    description: 'شاشة مبسطة سريعة لعمال ومشرفي الخطوط لتسجيل إنجاز الباتشات والفرز',
    supportedActions: ['view', 'edit', 'approve']
  },
  {
    id: 'factory_floor_monitor',
    title: 'غرفة التحكم اللحظية للإنتاج',
    category: 'production',
    categoryLabel: 'التخطيط وأوامر التشغيل',
    description: 'عرض مباشر على شاشات العرض الكبيرة لمعدلات إنجاز الخطوط والباتشات اللحظية',
    supportedActions: ['view']
  },

  // 3. Warehouses
  {
    id: 'raw_materials_warehouse',
    title: 'مخزن الأقمشة والإكسسوارات',
    category: 'warehouse',
    categoryLabel: 'إدارة المخازن والمستودعات',
    description: 'أرصدة الأثواب، بواقي القماش، السوست والخيوط، وأذون الإضافة والصرف والتسويات',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  },
  {
    id: 'finished_goods_warehouse',
    title: 'مخزن المنتجات التامة',
    category: 'warehouse',
    categoryLabel: 'إدارة المخازن والمستودعات',
    description: 'أرصدة بضاعة الفرز الأول والثاني الجاهزة للشحن والكراتين المسلسلة',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  },

  // 4. Sales & Purchases
  {
    id: 'purchases',
    title: 'إدارة المشتريات وفواتير الشراء',
    category: 'sales_purchases',
    categoryLabel: 'المبيعات والمشتريات وتدفق النقدية',
    description: 'طلبات الشراء، فواتير توريد الأقمشة، حسابات الموردين، ومردودات المشتريات',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  },
  {
    id: 'sales',
    title: 'إدارة المبيعات وفواتير العملاء',
    category: 'sales_purchases',
    categoryLabel: 'المبيعات والمشتريات وتدفق النقدية',
    description: 'عروض الأسعار، فواتير بيع الملابس الجاهزة، كشوف حسابات العملاء والتحصيل',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  },
  {
    id: 'treasury',
    title: 'إدارة الخزينة وحركة السيولة',
    category: 'sales_purchases',
    categoryLabel: 'المبيعات والمشتريات وتدفق النقدية',
    description: 'سندات القبض، سندات الصرف للموردين، المصروفات النثرية، وأرصدة الصناديق',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  },

  // 5. Costing & Finance
  {
    id: 'overhead_costing',
    title: 'التكاليف الصناعية غير المباشرة (MOH)',
    category: 'finance',
    categoryLabel: 'المحاسبة المالية والتكاليف',
    description: 'توزيع مصروفات الطاقة والإيجارات واستهلاك الآلات على وحدات الإنتاج',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  },
  {
    id: 'accounting_config',
    title: 'شجرة الحسابات والتكوين المالي',
    category: 'finance',
    categoryLabel: 'المحاسبة المالية والتكاليف',
    description: 'الدليل المحاسبي الصناعي، مراكز التكلفة، كتالوج الخامات القياسية ومصفوفة الأجور',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  },
  {
    id: 'journal_entries',
    title: 'دفتر القيود اليومية (المزدوجة)',
    category: 'finance',
    categoryLabel: 'المحاسبة المالية والتكاليف',
    description: 'قيود التوريد والمبيعات، صرف الخامات، تسويات الجرد، والقيود اليدوية',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  },
  {
    id: 'general_ledger',
    title: 'دفتر الأستاذ العام',
    category: 'finance',
    categoryLabel: 'المحاسبة المالية والتكاليف',
    description: 'حركات الحسابات التفصيلية والأرصدة الافتتاحية والمتحركة ومطابقة الحسابات',
    supportedActions: ['view', 'export', 'print']
  },
  {
    id: 'trial_balance',
    title: 'ميزان المراجعة (بالمجاميع والأرصدة)',
    category: 'finance',
    categoryLabel: 'المحاسبة المالية والتكاليف',
    description: 'مطابقة توازن الحسابات، الأرصدة المدينة والدائنة للفترات المالية',
    supportedActions: ['view', 'export', 'print']
  },
  {
    id: 'income_statement',
    title: 'قائمة الدخل والأرباح والخسائر (P&L)',
    category: 'finance',
    categoryLabel: 'المحاسبة المالية والتكاليف',
    description: 'إيرادات المبيعات، تكلفة البضاعة المباعة (COGS)، وهامش الربح الإجمالي والصافي',
    supportedActions: ['view', 'export', 'print']
  },
  {
    id: 'balance_sheet',
    title: 'قائمة المركز المالي (الميزانية العمومية)',
    category: 'finance',
    categoryLabel: 'المحاسبة المالية والتكاليف',
    description: 'الأصول المتداولة والثابتة، التزامات الموردين، وحقوق الملكية للمصنع',
    supportedActions: ['view', 'export', 'print']
  },
  {
    id: 'cash_flow',
    title: 'قائمة التدفقات النقدية (Cash Flow)',
    category: 'finance',
    categoryLabel: 'المحاسبة المالية والتكاليف',
    description: 'تحليل التدفق النقدي التشغيلي والاستثماري والتمويلي وصافي السيولة',
    supportedActions: ['view', 'export', 'print']
  },

  // 6. HR & Payroll
  {
    id: 'hr_payroll',
    title: 'الموارد البشرية ومستحقات العمال',
    category: 'hr',
    categoryLabel: 'الموارد البشرية والأجور',
    description: 'تسجيل الفنيين والعمال، حساب إنتاجية القطعة، الحوافز، والخصومات الشهرية',
    supportedActions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']
  }
];

export interface SensitiveDataMeta {
  key: SensitiveDataKey;
  label: string;
  category: 'production_cost' | 'inventory_price' | 'materials_price' | 'sales_margin';
  categoryLabel: string;
  description: string;
}

export const ALL_SENSITIVE_DATA_METADATA: SensitiveDataMeta[] = [
  // أ. تكلفة الإنتاج
  {
    key: 'costs.view_unit_cost',
    label: 'عرض تكلفة القطعة الواحدة',
    category: 'production_cost',
    categoryLabel: 'تكاليف الإنتاج والتصنيع',
    description: 'الاطلاع على التكلفة الفعلية أو المخططة لإنتاج القطعة الواحدة'
  },
  {
    key: 'costs.view_bom_cost',
    label: 'عرض تكلفة الخامات داخل المنتج (BOM Cost)',
    category: 'production_cost',
    categoryLabel: 'تكاليف الإنتاج والتصنيع',
    description: 'تكلفة القماش والإكسسوارات والمستلزمات في جدول المكونات'
  },
  {
    key: 'costs.view_labor_cost',
    label: 'عرض أجور التشغيل والتكاليف الصناعية المباشرة',
    category: 'production_cost',
    categoryLabel: 'تكاليف الإنتاج والتصنيع',
    description: 'أجور عمال القص والخياطة والتشطيب والمكواة للقطعة والباتش'
  },
  {
    key: 'costs.view_overhead',
    label: 'عرض المصروفات غير المباشرة وتوزيعاتها (MOH)',
    category: 'production_cost',
    categoryLabel: 'تكاليف الإنتاج والتصنيع',
    description: 'نصيب القطعة والطلب من إيجار المصنع والكهرباء والصيانة'
  },
  {
    key: 'costs.view_order_cost',
    label: 'عرض إجمالي تكلفة أمر التشغيل والباتش',
    category: 'production_cost',
    categoryLabel: 'تكاليف الإنتاج والتصنيع',
    description: 'التكلفة الكلية المجمعة لأمر الإنتاج بكافة عناصره'
  },
  {
    key: 'costs.edit_cost',
    label: 'تعديل وحفظ بيانات التكلفة والأسعار المعيارية',
    category: 'production_cost',
    categoryLabel: 'تكاليف الإنتاج والتصنيع',
    description: 'إمكانية إدخال أو تغيير أسعار التكلفة أو النسب المعيارية'
  },
  {
    key: 'costs.export_cost',
    label: 'تصدير وطباعة تقارير التكلفة والربحية',
    category: 'production_cost',
    categoryLabel: 'تكاليف الإنتاج والتصنيع',
    description: 'تنزيل ملفات Excel أو PDF أو طباعة بيانات التكلفة الحساسة'
  },

  // ب. أسعار المخزون
  {
    key: 'inventory.view_quantities_only',
    label: 'عرض كميات المخزون فقط (دون إظهار الأسعار)',
    category: 'inventory_price',
    categoryLabel: 'أسعار وتقييم المخزون',
    description: 'تمكين المستخدم من جرد وحصر القطع والأثواب دون معرفة تقييمها المالي'
  },
  {
    key: 'inventory.view_valuation',
    label: 'عرض أسعار تقييم وقيمة المخزون الإجمالية',
    category: 'inventory_price',
    categoryLabel: 'أسعار وتقييم المخزون',
    description: 'إظهار قيمة رأس المال المخزون، متوسطات التكلفة، وقيمة بضاعة أول وآخر المدة'
  },

  // ج. أسعار الخامات والإكسسوارات
  {
    key: 'materials.view_prices',
    label: 'عرض أسعار شراء الخامات وتكلفة المتر/الكيلو',
    category: 'materials_price',
    categoryLabel: 'أسعار الخامات والمشتريات',
    description: 'الاطلاع على سعر شراء القماش والسوست والأزرار وتكلفة الوحدة'
  },
  {
    key: 'materials.view_supplier_prices',
    label: 'عرض بيانات الموردين المقترنة بالأسعار وفواتيرهم',
    category: 'materials_price',
    categoryLabel: 'أسعار الخامات والمشتريات',
    description: 'الاطلاع على عروض أسعار الموردين وشروط الدفع والخصومات التجارية'
  },

  // د. البيانات المالية وهوامش الربح
  {
    key: 'sales.view_prices',
    label: 'عرض أسعار البيع والخصومات الممنوحة للعملاء',
    category: 'sales_margin',
    categoryLabel: 'المبيعات وهوامش الربحية',
    description: 'الاطلاع على قوائم أسعار البيع وقيم فواتير العملاء'
  },
  {
    key: 'sales.view_margins',
    label: 'عرض هوامش الربح ونسب الربحية التشغيلية',
    category: 'sales_margin',
    categoryLabel: 'المبيعات وهوامش الربحية',
    description: 'معرفة الفارق بين سعر البيع وتكلفة الإنتاج وصافي هامش الربح'
  }
];

export interface RoleDefinition {
  role: UserRole;
  title: string;
  department: string;
  description: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
}

export const ENTERPRISE_ROLES: RoleDefinition[] = [
  {
    role: 'admin',
    title: 'مدير النظام (System Admin)',
    department: 'الإدارة العامة وتكنولوجيا المعلومات',
    description: 'صلاحيات إدارية مطلقة لإدارة المستخدمين، البنية التحتية، الأمان، وإعدادات النظام',
    badgeStyle: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800' }
  },
  {
    role: 'general_manager',
    title: 'المدير العام (General Manager)',
    department: 'الإدارة العليا والتنفيذية',
    description: 'إشراف كامل على كافة المؤشرات والتقارير المالية والإنتاجية مع اعتماد القرارات الكبرى',
    badgeStyle: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-800' }
  },
  {
    role: 'factory_manager',
    title: 'مدير المصنع (Factory Manager)',
    department: 'إدارة تشغيل المصنع',
    description: 'التحكم الشامل في صالة الإنتاج، خطط التشغيل، مراقبة المخازن، ومطابقة تكاليف التشغيل',
    badgeStyle: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-800' }
  },
  {
    role: 'production_manager',
    title: 'مدير الإنتاج (Production Manager)',
    department: 'إدارة الإنتاج والتشغيل',
    description: 'إصدار أوامر الإنتاج، توزيع الباتشات، متابعة خطوط التجميع ومعدلات الإنجاز ومحطة المشغلين',
    badgeStyle: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-800' }
  },
  {
    role: 'cutting_supervisor',
    title: 'مشرف القص (Cutting Supervisor)',
    department: 'قسم القص والتفصيل',
    description: 'تسجيل استهلاك الأقمشة، الأوزان، طباعة كروت القص، واعتماد مراحل القص الميدانية',
    badgeStyle: { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-800' }
  },
  {
    role: 'sewing_supervisor',
    title: 'مشرف الخياطة (Sewing Supervisor)',
    department: 'خطوط الخياطة والتجميع',
    description: 'متابعة خطوط الخياطة، تسجيل إنتاجية المشغلين، والتنقل بين مراحل الباتشات',
    badgeStyle: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-800' }
  },
  {
    role: 'finishing_packing_supervisor',
    title: 'مسؤول التشطيب والتعبئة',
    department: 'التشطيب والكي والتعبئة',
    description: 'متابعة الفنش، الكي بالبخار، توليد الباركود وتعبئة الكراتين وتحويلها للمخزن التام',
    badgeStyle: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' }
  },
  {
    role: 'warehouse_keeper',
    title: 'أمين المخزن (Warehouse Keeper)',
    department: 'المخازن والمستودعات',
    description: 'إدارة مخزن الخامات والمنتج التام، أذون الاستلام والصرف الجردي، رؤية كميات المخزون دون الأسعار',
    badgeStyle: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' }
  },
  {
    role: 'purchasing_officer',
    title: 'مسؤول المشتريات (Purchasing Officer)',
    department: 'إدارة المشتريات والتوريدات',
    description: 'فواتير الشراء، طلبات عروض أسعار الخامات، كشوف حسابات الموردين، وإدخال الخامات',
    badgeStyle: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-800' }
  },
  {
    role: 'sales_officer',
    title: 'مسؤول المبيعات (Sales Officer)',
    department: 'إدارة المبيعات والتسويق',
    description: 'إصدار فواتير بيع الملابس الجاهزة، تسجيل أوامر الشحن، ومتابعة رصيد العملاء',
    badgeStyle: { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-800' }
  },
  {
    role: 'accountant',
    title: 'المحاسب (Accountant)',
    department: 'الإدارة المالية والحسابات',
    description: 'إدارة اليومية العامة، قيود الأستاذ، سندات الخزينة، التكاليف، والتسويات المالية',
    badgeStyle: { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-800' }
  },
  {
    role: 'financial_auditor',
    title: 'المراجع المالي (Financial Auditor)',
    department: 'المراجعة والرقابة المالية',
    description: 'فحص الحسابات، مراجعة القوائم المالية، تدقيق أسعار التكلفة والمخزون، وسجل الرقابة',
    badgeStyle: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-300 dark:border-fuchsia-800' }
  },
  {
    role: 'quality_supervisor',
    title: 'مشرف ومراقب الجودة (QC)',
    department: 'توكيد وضمان الجودة',
    description: 'فحص العيوب، فرز الإنتاج (أول وثاني)، واعتماد مطابقة المواصفات القياسية',
    badgeStyle: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' }
  },
  {
    role: 'cutter',
    title: 'فني قسم القص (Cutter)',
    department: 'قسم القص والتفصيل',
    description: 'تسجيل أوزان الرولات وطباعة كروت القص ومتابعة الباتشات المسندة',
    badgeStyle: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' }
  },
  {
    role: 'custom',
    title: 'مستخدم مخصص (Custom User)',
    department: 'هيكل مخصص',
    description: 'تخصيص يدوي دقيق للشاشات والعمليات والبيانات الحساسة حسب الحاجة',
    badgeStyle: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-300', border: 'border-zinc-300 dark:border-zinc-700' }
  }
];

export const ROLE_LABELS: Record<UserRole, { title: string; desc: string; color: string }> = ENTERPRISE_ROLES.reduce(
  (acc, curr) => {
    acc[curr.role] = {
      title: curr.title,
      desc: curr.description,
      color: `${curr.badgeStyle.bg} ${curr.badgeStyle.text} ${curr.badgeStyle.border}`
    };
    return acc;
  },
  {} as Record<UserRole, { title: string; desc: string; color: string }>
);

export function getDefaultScreenPermissionsForRole(role: UserRole): Record<ScreenId, ScreenPermissionConfig> {
  const result: Record<ScreenId, ScreenPermissionConfig> = {} as any;

  ALL_SCREENS_METADATA.forEach(screen => {
    result[screen.id] = {
      allowed: false,
      actions: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
        export: false,
        print: false
      }
    };
  });

  const allowAllActionsFor = (screenId: ScreenId, actions: StandardAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print']) => {
    if (!result[screenId]) return;
    result[screenId].allowed = true;
    actions.forEach(act => {
      result[screenId].actions[act] = true;
    });
  };

  const allowViewOnly = (screenId: ScreenId, print: boolean = false) => {
    if (!result[screenId]) return;
    result[screenId].allowed = true;
    result[screenId].actions.view = true;
    if (print) result[screenId].actions.print = true;
  };

  if (role === 'admin') {
    // Admin has access to everything
    ALL_SCREENS_METADATA.forEach(screen => {
      allowAllActionsFor(screen.id);
    });
    return result;
  }

  if (role === 'general_manager') {
    ALL_SCREENS_METADATA.forEach(screen => {
      // General manager can view and approve everything, can export and print, cannot edit users directly
      if (screen.id === 'users' || screen.id === 'settings') {
        allowViewOnly(screen.id, true);
      } else {
        allowAllActionsFor(screen.id, ['view', 'approve', 'export', 'print']);
      }
    });
    return result;
  }

  if (role === 'factory_manager') {
    allowAllActionsFor('dashboard');
    allowAllActionsFor('list');
    allowAllActionsFor('form');
    allowAllActionsFor('operator_station');
    allowAllActionsFor('factory_floor_monitor');
    allowAllActionsFor('raw_materials_warehouse');
    allowAllActionsFor('finished_goods_warehouse');
    allowAllActionsFor('purchases', ['view', 'approve', 'print']);
    allowAllActionsFor('sales', ['view', 'print']);
    allowAllActionsFor('overhead_costing');
    allowAllActionsFor('hr_payroll', ['view', 'approve', 'print']);
    return result;
  }

  if (role === 'production_manager') {
    allowAllActionsFor('dashboard');
    allowAllActionsFor('list');
    allowAllActionsFor('form');
    allowAllActionsFor('operator_station');
    allowAllActionsFor('factory_floor_monitor');
    allowAllActionsFor('raw_materials_warehouse', ['view', 'print']);
    allowAllActionsFor('finished_goods_warehouse', ['view', 'print']);
    allowAllActionsFor('hr_payroll', ['view']);
    return result;
  }

  if (role === 'cutting_supervisor' || role === 'cutter') {
    allowViewOnly('dashboard');
    allowAllActionsFor('list', ['view', 'print']);
    allowAllActionsFor('form', ['view', 'edit', 'approve', 'print']);
    allowAllActionsFor('operator_station');
    allowAllActionsFor('factory_floor_monitor');
    allowAllActionsFor('raw_materials_warehouse', ['view', 'print']);
    return result;
  }

  if (role === 'sewing_supervisor') {
    allowViewOnly('dashboard');
    allowAllActionsFor('list', ['view', 'print']);
    allowAllActionsFor('form', ['view', 'edit', 'approve', 'print']);
    allowAllActionsFor('operator_station');
    allowAllActionsFor('factory_floor_monitor');
    return result;
  }

  if (role === 'finishing_packing_supervisor' || role === 'quality_supervisor') {
    allowViewOnly('dashboard');
    allowAllActionsFor('list', ['view', 'print']);
    allowAllActionsFor('form', ['view', 'edit', 'approve', 'print']);
    allowAllActionsFor('operator_station');
    allowAllActionsFor('factory_floor_monitor');
    allowAllActionsFor('finished_goods_warehouse', ['view', 'create', 'print']);
    return result;
  }

  if (role === 'warehouse_keeper') {
    allowViewOnly('dashboard');
    allowAllActionsFor('raw_materials_warehouse', ['view', 'create', 'edit', 'print']);
    allowAllActionsFor('finished_goods_warehouse', ['view', 'create', 'edit', 'print']);
    allowAllActionsFor('purchases', ['view', 'create', 'print']);
    allowAllActionsFor('sales', ['view', 'print']);
    return result;
  }

  if (role === 'purchasing_officer') {
    allowViewOnly('dashboard');
    allowAllActionsFor('purchases');
    allowAllActionsFor('raw_materials_warehouse', ['view', 'print']);
    allowAllActionsFor('treasury', ['view', 'print']);
    return result;
  }

  if (role === 'sales_officer') {
    allowViewOnly('dashboard');
    allowAllActionsFor('sales');
    allowAllActionsFor('finished_goods_warehouse', ['view', 'print']);
    allowAllActionsFor('treasury', ['view', 'print']);
    return result;
  }

  if (role === 'accountant') {
    allowAllActionsFor('dashboard');
    allowAllActionsFor('purchases');
    allowAllActionsFor('sales');
    allowAllActionsFor('treasury');
    allowAllActionsFor('overhead_costing');
    allowAllActionsFor('accounting_config');
    allowAllActionsFor('journal_entries');
    allowAllActionsFor('general_ledger');
    allowAllActionsFor('trial_balance');
    allowAllActionsFor('income_statement');
    allowAllActionsFor('balance_sheet');
    allowAllActionsFor('cash_flow');
    allowAllActionsFor('hr_payroll');
    allowAllActionsFor('raw_materials_warehouse', ['view', 'print']);
    allowAllActionsFor('finished_goods_warehouse', ['view', 'print']);
    return result;
  }

  if (role === 'financial_auditor') {
    allowViewOnly('dashboard', true);
    allowAllActionsFor('purchases', ['view', 'export', 'print']);
    allowAllActionsFor('sales', ['view', 'export', 'print']);
    allowAllActionsFor('treasury', ['view', 'export', 'print']);
    allowAllActionsFor('overhead_costing', ['view', 'export', 'print']);
    allowAllActionsFor('accounting_config', ['view', 'export', 'print']);
    allowAllActionsFor('journal_entries', ['view', 'export', 'print']);
    allowAllActionsFor('general_ledger', ['view', 'export', 'print']);
    allowAllActionsFor('trial_balance', ['view', 'export', 'print']);
    allowAllActionsFor('income_statement', ['view', 'export', 'print']);
    allowAllActionsFor('balance_sheet', ['view', 'export', 'print']);
    allowAllActionsFor('cash_flow', ['view', 'export', 'print']);
    allowAllActionsFor('hr_payroll', ['view', 'export', 'print']);
    allowAllActionsFor('raw_materials_warehouse', ['view', 'export', 'print']);
    allowAllActionsFor('finished_goods_warehouse', ['view', 'export', 'print']);
    return result;
  }

  return result;
}

export function getDefaultSensitivePermissionsForRole(role: UserRole): Record<SensitiveDataKey, boolean> {
  const result: Record<SensitiveDataKey, boolean> = {} as any;
  ALL_SENSITIVE_DATA_METADATA.forEach(item => {
    result[item.key] = false;
  });

  if (role === 'admin' || role === 'general_manager') {
    ALL_SENSITIVE_DATA_METADATA.forEach(item => {
      result[item.key] = true;
    });
    return result;
  }

  if (role === 'accountant' || role === 'financial_auditor') {
    ALL_SENSITIVE_DATA_METADATA.forEach(item => {
      // Auditor has view/export, accountant has all
      result[item.key] = true;
    });
    if (role === 'financial_auditor') {
      result['costs.edit_cost'] = false;
    }
    return result;
  }

  if (role === 'factory_manager') {
    result['costs.view_unit_cost'] = true;
    result['costs.view_bom_cost'] = true;
    result['costs.view_labor_cost'] = true;
    result['costs.view_overhead'] = true;
    result['costs.view_order_cost'] = true;
    result['inventory.view_quantities_only'] = false;
    result['inventory.view_valuation'] = true;
    result['materials.view_prices'] = true;
    result['sales.view_prices'] = true;
    return result;
  }

  if (role === 'purchasing_officer') {
    result['materials.view_prices'] = true;
    result['materials.view_supplier_prices'] = true;
    result['inventory.view_quantities_only'] = true;
    return result;
  }

  if (role === 'sales_officer') {
    result['sales.view_prices'] = true;
    result['inventory.view_quantities_only'] = true;
    return result;
  }

  if (role === 'warehouse_keeper') {
    // CRITICAL: Warehouse keeper sees quantities ONLY, prices are hidden!
    result['inventory.view_quantities_only'] = true;
    result['inventory.view_valuation'] = false;
    result['materials.view_prices'] = false;
    result['sales.view_prices'] = false;
    return result;
  }

  // Workshop supervisors (cutting, sewing, packing, QC, cutter) see quantities and technical info only
  result['inventory.view_quantities_only'] = true;
  return result;
}

export function canUserAccessScreen(user: AppUser | null, screenId: ScreenId): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'admin') return true;

  // Check custom user override or screenPermissions
  if (user.screenPermissions && user.screenPermissions[screenId]) {
    return !!user.screenPermissions[screenId]?.allowed;
  }

  // Fallback to role defaults
  const roleDefaults = getDefaultScreenPermissionsForRole(user.role);
  return !!roleDefaults[screenId]?.allowed;
}

export function canUserPerformAction(
  user: AppUser | null, 
  screenId: ScreenId, 
  action: StandardAction
): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'admin') return true;

  if (user.screenPermissions && user.screenPermissions[screenId]) {
    const config = user.screenPermissions[screenId];
    if (!config?.allowed) return false;
    return !!config.actions[action];
  }

  const roleDefaults = getDefaultScreenPermissionsForRole(user.role);
  const config = roleDefaults[screenId];
  if (!config?.allowed) return false;
  return !!config.actions[action];
}

export function canUserViewSensitiveData(
  user: AppUser | null, 
  dataKey: SensitiveDataKey
): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'admin') return true;

  if (user.sensitivePermissions && user.sensitivePermissions[dataKey] !== undefined) {
    return !!user.sensitivePermissions[dataKey];
  }

  const roleDefaults = getDefaultSensitivePermissionsForRole(user.role);
  return !!roleDefaults[dataKey];
}
