export type StageStatus = 'لم يبدأ' | 'جاري' | 'مكتمل';

export interface StageInfo {
  status: StageStatus;
  approvedBy?: string;
  approvedAt?: string;
}

export type OrderStatus = 
  | 'مسودة'
  | 'أمر إنتاج معتمد'
  | 'أمر قص'
  | 'القص الفعلي مدخل'
  | 'القص معتمد'
  | 'تقسيم الباتشات'
  | 'الباتشات مثبتة'
  | 'التجهيز جاري'
  | 'التجهيز مكتمل'
  | 'الطباعة والتطريز جاري'
  | 'الطباعة والتطريز مكتمل'
  | 'الخياطة مكتملة'
  | 'التشطيب جاري'
  | 'التشطيب مكتمل'
  | 'المكواة جاري'
  | 'المكواة مكتملة'
  | 'التغليف معتمد'
  | 'مغلق'
  | 'معتمد'; // keeping معتمد for backwards compatibility if needed, though replaced by 'أمر إنتاج معتمد'

export interface Variant {
  color: string;
  quantity: number;
}

export interface SizeData {
  size: string;
  variants: Variant[];
}

export type StandardMethod = 'موحد' | 'حسب المقاس';

export interface SizeStandard {
  size: string;
  standard: number;
}

export interface MaterialInstance {
  id: string;
  name: string;
  type: string;
  unit: string;
  standardMethod: StandardMethod;
  unifiedStandard: number;
  sizeStandards: SizeStandard[];
  standardPrice?: number;
}

export interface AccessoryInstance {
  id: string;
  name: string;
  type: string;
  unit: string;
  standardMethod: StandardMethod;
  unifiedStandard: number;
  sizeStandards: SizeStandard[];
  standardPrice?: number;
}

export interface CutVariant {
  color: string;
  plannedQuantity: number;
  actualQuantity: number;
}

export interface CutSizeData {
  size: string;
  variants: CutVariant[];
}

export interface CutOrderData {
  cutterName?: string;
  actualFabricName?: string;
  cutOrderNumber: string;
  sizes: CutSizeData[];
  actualWeight: number;
  actualWeightByColor?: Record<string, number>;
  actualCostPerPiece?: number;
  weightUnit: string;
  weightDate?: string;
  weightUser?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type BatchSplitMethod = 'حسب اللون' | 'حسب المقاس';

export interface BatchVariant {
  color: string;
  quantity: number;
}

export interface BatchSizeData {
  size: string;
  variants: BatchVariant[];
}


export type PrintEmbroideryExecutionType = 'بدون طباعة / تطريز' | 'طباعة' | 'تطريز' | 'طباعة + تطريز';

export interface PrintDetails {
  designName: string;
  placement: string;
  colors: string;
  colorCount: number;
  notes: string;
}

export interface EmbroideryDetails {
  designName: string;
  placement: string;
  threadColors: string;
  colorCount: number;
  notes: string;
}

export type BatchPrintEmbroideryStatus = 'لم يبدأ' | 'جاري' | 'مكتمل';

export interface AccessoryPrepItem {
  actualAccessoryName?: string;
  accessoryId: string;
  accessoryName: string;
  unit: string;
  requiredQuantity: number;
  actualPrepared: number;
  waste: number;
  isPrepared: boolean;
  notes?: string;
  preparedBy?: string;
  preparedAt?: string;
}


export type SewingManufacturingType = 'تصنيع داخلي' | 'تصنيع خارجي';

export interface SewingVariantData {
  color: string;
  size: string;
  actualQuantity: number;
}

export interface FinishingVariantData {
  size: string;
  color: string;
  actualQuantity?: number; quantity?: number; // Actual quantity finished
  barcode?: string; // كود الباركود التسلسلي المولد للمقاس واللون (مثال: PM-00001)
}

export interface FinishingData {
  workerName?: string; // for finishing
  status: 'لم يبدأ' | 'جاري' | 'مكتمل';
  actualCostPerPiece?: number;
  actualQuantities: FinishingVariantData[];
  approvedBy?: string;
  approvedAt?: string;
  approvalCode?: string;
}


export interface IroningVariantData {
  size: string;
  color: string;
  actualQuantity?: number; quantity?: number;
}

export interface IroningData {
  workerName?: string; // for ironing
  status: 'لم يبدأ' | 'جاري' | 'مكتمل';
  actualCostPerPiece?: number;
  actualQuantities: IroningVariantData[];
  approvedBy?: string;
  approvedAt?: string;
  approvalCode?: string;
}

export interface SewingData {
  manufacturingType?: SewingManufacturingType;
  sewingGroup?: string;
  externalManufacturer?: string;
  actualCostPerPiece?: number;
  actualQuantities: SewingVariantData[];
  status: 'لم يبدأ' | 'جاري' | 'مكتمل';
  approvedBy?: string;
  approvedAt?: string;
  approvalCode?: string;
}

export interface BatchItem {
  id: string;
  batchNumber: string;
  sizes: BatchSizeData[];
  prepStatus: 'جاري' | 'مكتمل';
  prepApprovedBy?: string;
  prepApprovedAt?: string;
  prepApprovalCode?: string;
  accessoriesPrep: AccessoryPrepItem[];
  printEmbroideryStatus?: BatchPrintEmbroideryStatus;
  printApprovedBy?: string;
  printApprovedAt?: string;
  printApprovalCode?: string;
  executionType?: PrintEmbroideryExecutionType;
  printDetails?: PrintDetails;
  embroideryDetails?: EmbroideryDetails;
  sewingData?: SewingData;
  finishingData?: FinishingData;
  ironingData?: IroningData;
  printEmbroideryCost?: {
    standardCost: number;
    actualCost?: number;
  };
}


export interface PackingInvoiceVariant {
  size: string;
  color: string;
  quantity: number;
}

export interface PackingInvoice {
  id: string;
  date: string;
  customerName: string;
  variants: PackingInvoiceVariant[];
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  styleName: string;
  category: string;
  customerName: string;
  status: OrderStatus;
  sizes: SizeData[];
  createdAt: string;
  updatedAt: string;
  
  barcode?: string; // كود الباركود الرئيسي للمنتج/الأمر
  barcodes?: Record<string, string>; // خريطة أكواد الباركود للمقاسات والألوان (variantId -> barcode)
  
  // V0.4 Versioning and Independent Stages
  version?: number;
  stageStatuses?: {
    production?: StageInfo;
    cut?: StageInfo;
    batches?: StageInfo;
    prep?: StageInfo;
    print?: StageInfo;
    sewing?: StageInfo;
  };
  // V0.2 extensions
  materials?: MaterialInstance[];
  accessories?: AccessoryInstance[];
  
  productionApprovedBy?: string;
  productionApprovedAt?: string;
  materialsApprovedBy?: string;
  materialsApprovedAt?: string;
  cutApprovedBy?: string;
  cutApprovedAt?: string;
  prepApprovedBy?: string;
  prepApprovedAt?: string;
  printEmbroideryApprovedBy?: string;
  printEmbroideryApprovedAt?: string;
  sewingApprovedBy?: string;
  sewingApprovedAt?: string;
  finishingApprovedBy?: string;
  finishingApprovedAt?: string;
  ironingApprovedBy?: string;
  ironingApprovedAt?: string;
  printEmbroideryStandardCost?: number;
  standardSewingCostPerPiece?: number;
  standardFinishingCostPerPiece?: number;
  standardCutCostPerPiece?: number;
  standardIroningCostPerPiece?: number;
  sellingPrice?: number;
  cuttingInstructions?: string;
  sewingInstructions?: string;
  finishingInstructions?: string;
  ironingInstructions?: string;
  packingInstructions?: string;
  packingInvoices?: PackingInvoice[];
  packingStatus?: 'لم يبدأ' | 'جاري' | 'مكتمل';
  packingApprovedBy?: string;
  packingApprovedAt?: string;

  
  cutData?: CutOrderData;
  
  batchSplitMethod?: BatchSplitMethod;
  batches?: BatchItem[];
  batchesLockedBy?: string;
  batchesLockedAt?: string;
}

export const PREDEFINED_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  '4', '6', '8', '10', '12', '14', '16'
];

export const PREDEFINED_COLORS = [
  'أسود', 'أبيض', 'كحلي', 'رمادي', 'أحمر', 'بيج', 'أخضر'
];

export const CATEGORIES = [
  'رجالي', 'حريمي', 'أطفال', 'أخرى'
];

export interface FactorySettings {
  name: string;
  address: string;
  phones: string;
  logoUrl: string | null;
}

// --- Accounting Configuration Types ---

export interface AccountNode {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  description?: string;
  isActive: boolean;
  level?: number;
  nature?: 'debit' | 'credit';
  isWipOrManufacturing?: boolean;
}

export interface CustomerSupplier {
  id: string;
  type: 'customer' | 'supplier' | 'both';
  name: string;
  code?: string;
  category?: string;
  contactPerson?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  taxId?: string;
  commercialReg?: string;
  isActive: boolean;
  linkedAccountId?: string;
  linkedAccountCode?: string;
  creditLimit?: number;
  paymentTerms?: string;
  openingBalance?: number;
  openingBalanceType?: 'debit' | 'credit';
  bankName?: string;
  bankAccount?: string;
  iban?: string;
  salesperson?: string;
  discountPercentage?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaterialItem {
  id: string;
  type: 'fabric' | 'accessory' | 'packaging' | 'operating_supply' | string;
  name: string;
  code?: string;
  barcode?: string;
  subCategory?: string;
  unit: string;
  defaultCost?: number;
  sellingPrice?: number;
  isActive: boolean;
  linkedAccountId?: string;
  linkedExpenseAccountId?: string;
  minStockAlert?: number;
  reorderPoint?: number;
  warehouseLocation?: string;
  openingStockQty?: number;
  openingStockValue?: number;
  fabricWeight?: number;
  width?: string;
  color?: string;
  composition?: string;
  preferredSupplierId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LaborProfile {
  id: string;
  name: string;
  code?: string;
  nationalId?: string;
  role: string;
  departmentId?: string;
  operationalGroupId?: string;
  skillLevel?: string;
  phone?: string;
  address?: string;
  city?: string;
  hireDate?: string;
  baseSalary?: number;
  weeklySalary?: number;
  pieceRate?: number;
  salaryType?: 'يومية' | 'أسبوعي' | 'بالقطعة' | 'شهري' | 'بالساعة';
  salaryPeriod?: 'يومي' | 'أسبوعي' | 'شهري';
  dailyWorkingHours?: number;
  isActive: boolean;
  linkedAccountId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OperationalGroup {
  id: string;
  name: string;
  code?: string;
  type: 'internal' | 'external';
  specialty: string;
  contactPerson?: string;
  phone?: string;
  departmentId?: string;
  machinesCount?: number;
  dailyCapacity?: number;
  isActive: boolean;
  linkedAccountId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  type?: 'production' | 'service' | 'sales' | 'admin' | string;
  managerName?: string;
  location?: string;
  costCenterCode?: string;
  linkedAccountId?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

// --- Purchases & Procurement Types ---
export * from './types/purchases';

// --- Enterprise Identity & Access Control (RBAC) Types ---

export type UserRole = 
  | 'admin'                         // مدير النظام العام
  | 'general_manager'               // المدير العام
  | 'factory_manager'               // مدير المصنع
  | 'production_manager'            // مدير الإنتاج
  | 'cutting_supervisor'            // مشرف القص
  | 'sewing_supervisor'             // مشرف الخياطة
  | 'finishing_packing_supervisor'  // مسؤول التشطيب والتعبئة
  | 'warehouse_keeper'              // أمين المخزن
  | 'purchasing_officer'            // مسؤول المشتريات
  | 'sales_officer'                 // مسؤول المبيعات
  | 'accountant'                    // المحاسب
  | 'financial_auditor'             // المراجع المالي
  | 'quality_supervisor'            // مشرف الجودة (متوافق)
  | 'cutter'                        // فني القص (متوافق)
  | 'custom';                       // مستخدم مخصص

export type UserAccountStatus = 'active' | 'inactive' | 'suspended';

export type StandardAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'print';

export type ScreenId = 
  | 'dashboard'
  | 'list'
  | 'form'
  | 'operator_station'
  | 'factory_floor_monitor'
  | 'raw_materials_warehouse'
  | 'finished_goods_warehouse'
  | 'purchases'
  | 'sales'
  | 'overhead_costing'
  | 'accounting_config'
  | 'journal_entries'
  | 'general_ledger'
  | 'trial_balance'
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'treasury'
  | 'hr_payroll'
  | 'users'
  | 'settings'
  | 'customer_statement'
  | 'supplier_statement';

export type SensitiveDataKey =
  // Costs & Manufacturing
  | 'costs.view_unit_cost'         // عرض تكلفة القطعة
  | 'costs.view_bom_cost'          // عرض تكلفة الخامات داخل المنتج
  | 'costs.view_labor_cost'        // عرض أجور التشغيل والتكاليف الصناعية
  | 'costs.view_overhead'          // عرض المصروفات غير المباشرة وتوزيعاتها
  | 'costs.view_order_cost'        // عرض إجمالي تكلفة أمر التشغيل
  | 'costs.edit_cost'              // تعديل بيانات التكلفة
  | 'costs.export_cost'            // تصدير أو طباعة تقارير التكلفة
  // Inventory
  | 'inventory.view_quantities_only' // عرض كميات المخزون دون الأسعار
  | 'inventory.view_valuation'     // عرض أسعار تقييم وقيمة المخزون
  // Materials & Suppliers
  | 'materials.view_prices'        // عرض أسعار شراء الخامات وتكلفة الوحدة
  | 'materials.view_supplier_prices' // عرض بيانات وأسعار الموردين
  // Sales & Profitability
  | 'sales.view_prices'            // عرض أسعار البيع والخصومات
  | 'sales.view_margins';          // عرض هوامش الربح والربحية

export type PermissionKey =
  // Dashboard
  | 'dashboard.view'
  // Production Orders
  | 'production.view'
  | 'production.create'
  | 'production.edit'
  | 'production.delete'
  | 'production.print'
  | 'production.approve'
  // Stages
  | 'stage.cut'
  | 'stage.prep'
  | 'stage.sewing'
  | 'stage.finishing'
  | 'stage.quality'
  | 'stage.packing'
  // Warehouses
  | 'warehouse.raw_materials.view'
  | 'warehouse.raw_materials.manage'
  | 'warehouse.finished_goods.view'
  | 'warehouse.finished_goods.manage'
  // Purchases
  | 'purchases.view'
  | 'purchases.create'
  | 'purchases.edit'
  | 'purchases.delete'
  | 'purchases.approve'
  // Sales
  | 'sales.view'
  | 'sales.create'
  | 'sales.edit'
  | 'sales.delete'
  | 'sales.approve'
  // Accounting & Costing
  | 'accounting.chart_of_accounts'
  | 'accounting.customers_suppliers'
  | 'accounting.materials_catalog'
  | 'accounting.labor_rates'
  | 'accounting.view_financials'
  | 'accounting.journal_entries'
  | 'accounting.financial_statements'
  | 'accounting.treasury'
  // Factory Operations & HR
  | 'factory.operator_station'
  | 'factory.floor_monitor'
  | 'hr.view_payroll'
  | 'hr.manage_payroll'
  // Admin & Settings
  | 'admin.users_management'
  | 'admin.system_settings'
  | 'admin.audit_logs';

export interface ScreenPermissionConfig {
  allowed: boolean;
  actions: Record<StandardAction, boolean>;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  employeeCode?: string;
  email?: string;
  phone?: string;
  password?: string;
  avatar?: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  isActive: boolean;
  status?: UserAccountStatus;
  language?: 'ar' | 'en';
  permissions: Record<PermissionKey, boolean>;
  screenPermissions?: Partial<Record<ScreenId, ScreenPermissionConfig>>;
  sensitivePermissions?: Partial<Record<SensitiveDataKey, boolean>>;
  customPermissionsOverrides?: Record<string, boolean>;
  createdAt: string;
  lastLogin?: string;
  notes?: string;
}

export interface ApprovalStamp {
  userId: string;
  userName: string;
  userRole?: string;
  roleTitle?: string;
  department?: string;
  approvedAt: string; // ISO string
  approvedDate: string; // YYYY-MM-DD
  approvedTime: string; // HH:mm:ss
  notes?: string;
}

export type AuditActionCategory = 
  | 'production'  // إنتاج وتشغيل
  | 'cut'         // قص وتفصيل
  | 'prep'        // تجهيز مستلزمات
  | 'print'       // طباعة وتطريز
  | 'sew'         // خياطة وتجميع
  | 'finish'      // فنش وكي
  | 'packing'     // تغليف ومخازن
  | 'sales'       // مبيعات وتسليم
  | 'purchases'   // مشتريات وتوريد
  | 'treasury'    // إيرادات ومصروفات
  | 'accounting'  // قيود وحسابات
  | 'admin';      // إدارة وأمان

export interface AuditLogEntry {
  id: string;
  actionKey: string;
  actionTitle: string;
  category: AuditActionCategory;
  categoryLabel: string;
  entityType: 'order' | 'batch' | 'sales_invoice' | 'sales_return' | 'purchase_invoice' | 'purchase_return' | 'treasury' | 'journal' | 'warehouse' | 'user' | 'system';
  entityId?: string;
  entityNumber?: string;
  timestamp: string; // ISO format
  date: string;      // YYYY-MM-DD
  time: string;      // HH:mm:ss
  user: {
    userId: string;
    userName: string;
    userRole: UserRole | string;
    roleTitle: string;
    department: string;
  };
  details: string;
  notes?: string;
  status: 'approved' | 'completed' | 'cancelled';
}

export * from './types/sales';
export * from './types/incomeStatement';
