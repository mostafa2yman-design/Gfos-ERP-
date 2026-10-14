import React, { useState, useEffect, useMemo } from 'react';
import { 
  FinancialConfiguration, 
  DEFAULT_FINANCIAL_CONFIG, 
  AccountMapping 
} from '../../types/financialConfig';
import { 
  getFinancialConfig, 
  saveFinancialConfig, 
  resetFinancialConfigToDefaults 
} from '../../lib/financialConfigStorage';
import { 
  getAccounts,
  getCustomersSuppliers,
  getMaterials,
  getLabor,
  getOperationalGroups,
  getDepartments
} from '../../lib/accountingStorage';
import { AccountNode } from '../../types';
import {
  UniversalMasterEntityModal,
  MasterEntityType
} from './UniversalMasterEntityModal';
import {
  Settings2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Factory,
  Layers,
  ShoppingBag,
  TrendingUp,
  Coins,
  ShieldCheck,
  FileCheck2,
  HelpCircle,
  Hash,
  Download,
  Upload,
  Lock,
  Calendar,
  Sparkles,
  ArrowRight,
  Network,
  Users,
  Building,
  HardHat,
  PackageSearch,
  Building2,
  SlidersHorizontal,
  Plus,
  ExternalLink,
  ChevronLeft,
  Gauge
} from 'lucide-react';

interface FinancialConfigViewProps {
  onNavigateToAccounts?: () => void;
}

export function FinancialConfigView({ onNavigateToAccounts }: FinancialConfigViewProps) {
  const [config, setConfig] = useState<FinancialConfiguration>(getFinancialConfig());
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [activeTab, setActiveTab] = useState<'structure' | 'mappings' | 'policies' | 'sequences' | 'audit'>('structure');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [masterModalType, setMasterModalType] = useState<MasterEntityType | null>(null);

  const [entityCounts, setEntityCounts] = useState({
    customers: 0,
    suppliers: 0,
    materials: 0,
    fabrics: 0,
    accessories: 0,
    labor: 0,
    groups: 0,
    departments: 0,
    totalAccounts: 0
  });

  const loadAllData = () => {
    try {
      const accList = getAccounts();
      const custSupp = getCustomersSuppliers();
      const mats = getMaterials();
      const labs = getLabor();
      const grps = getOperationalGroups();
      const depts = getDepartments();

      setAccounts(accList);
      setEntityCounts({
        customers: custSupp.filter(c => c.type === 'customer' || c.type === 'both').length,
        suppliers: custSupp.filter(c => c.type === 'supplier' || c.type === 'both').length,
        materials: mats.length,
        fabrics: mats.filter(m => m.type === 'fabric').length,
        accessories: mats.filter(m => m.type === 'accessory').length,
        labor: labs.length,
        groups: grps.length,
        departments: depts.length,
        totalAccounts: accList.length
      });
    } catch (err) {
      console.error('Error loading master counts:', err);
    }
  };

  useEffect(() => {
    loadAllData();
    setConfig(getFinancialConfig());

    const handleUpdate = () => loadAllData();
    window.addEventListener('customers_updated', handleUpdate);
    window.addEventListener('raw_materials_updated', handleUpdate);
    window.addEventListener('labor_updated', handleUpdate);
    window.addEventListener('groups_updated', handleUpdate);
    window.addEventListener('departments_updated', handleUpdate);
    window.addEventListener('accounts_updated', handleUpdate);

    return () => {
      window.removeEventListener('customers_updated', handleUpdate);
      window.removeEventListener('raw_materials_updated', handleUpdate);
      window.removeEventListener('labor_updated', handleUpdate);
      window.removeEventListener('groups_updated', handleUpdate);
      window.removeEventListener('departments_updated', handleUpdate);
      window.removeEventListener('accounts_updated', handleUpdate);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleMappingChange = (key: keyof AccountMapping, value: string) => {
    setConfig(prev => ({
      ...prev,
      mappings: {
        ...prev.mappings,
        [key]: value
      }
    }));
    setIsDirty(true);
  };

  const handlePolicyChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      policies: {
        ...prev.policies,
        [key]: value
      }
    }));
    setIsDirty(true);
  };

  const handleSequenceChange = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      sequences: {
        ...prev.sequences,
        [key]: value
      }
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    saveFinancialConfig(config);
    setIsDirty(false);
    showToast('تم حفظ التكوين والربط المالي وسياسات التكاليف بنجاح');
  };

  const handleResetToDefaults = () => {
    if (confirm('هل ترغب في إعادة ضبط التكوين والربط المالي إلى الإعدادات القياسية المعتمدة لمصانع الملابس؟')) {
      const standard = resetFinancialConfigToDefaults();
      setConfig(standard);
      setIsDirty(false);
      showToast('تمت استعادة الإعدادات القياسية للمصانع بنجاح');
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `financial_config_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تصدير ملف التكوين المالي بنجاح');
  };

  // Integrity Check / Audit
  const auditResults = useMemo(() => {
    const keys = Object.keys(config.mappings) as (keyof AccountMapping)[];
    const missing: { key: keyof AccountMapping; code: string; label: string }[] = [];
    const valid: { key: keyof AccountMapping; code: string; account: AccountNode }[] = [];

    const fieldLabels: Record<keyof AccountMapping, string> = {
      fabricInventoryAccountCode: 'مخزن الأقمشة والغزول',
      accessoriesInventoryAccountCode: 'مخزن الإكسسوارات ومستلزمات الخياطة',
      packagingInventoryAccountCode: 'مخزن مواد التعبئة والتغليف',
      wipAccountCode: 'مخزون الإنتاج تحت التشغيل (WIP)',
      finishedGoodsAccountCode: 'مخزن الإنتاج التام والملابس الجاهزة',
      suppliersPayableAccountCode: 'موردو الأقمشة والغزول',
      accessoriesSuppliersAccountCode: 'موردو الإكسسوارات ومستلزمات الإنتاج',
      subcontractorsPayableAccountCode: 'مقاولو باطن وورش خياطة وتطريز خارجية',
      purchaseVatAccountCode: 'ضريبة القيمة المضافة على المدخلات',
      purchaseDiscountsAccountCode: 'خصم مكتسب على المشتريات',
      salesRevenueAccountCode: 'مبيعات الملابس الجاهزة والمنتجات التامة',
      jobOrderRevenueAccountCode: 'إيرادات تشغيل وتصنيع للغير (مصنعيات)',
      salesReturnAccountCode: 'مردودات مبيعات ملابس جاهزة',
      customersReceivableAccountCode: 'عملاء مبيعات الملابس الجاهزة',
      salesVatAccountCode: 'ضريبة القيمة المضافة المستحقة (مخرجات)',
      cogsAccountCode: 'تكلفة الخامات المباشرة المنصرفة للتشغيل',
      directLaborAccountCode: 'الأجور والعمالة الإنتاجية المباشرة',
      subcontractorsCostAccountCode: 'خدمات تصنيع وتشغيل خارجية (مقاولو باطن)',
      manufacturingOverheadAccountCode: 'التكاليف الصناعية غير المباشرة',
      mainCashAccountCode: 'الخزينة الرئيسية للمصنع',
      pettyCashAccountCode: 'عهد التشغيل النقدية بالورش',
      bankAccountCode: 'البنك - حساب جاري المصنع'
    };

    keys.forEach(key => {
      const code = config.mappings[key];
      const found = accounts.find(a => a.code === code);
      if (!found) {
        missing.push({ key, code, label: fieldLabels[key] || key });
      } else {
        valid.push({ key, code, account: found });
      }
    });

    const completionRate = Math.round((valid.length / keys.length) * 100);

    return {
      totalMappings: keys.length,
      validCount: valid.length,
      missingCount: missing.length,
      completionRate,
      missing,
      valid,
      fieldLabels
    };
  }, [config.mappings, accounts]);

  // Account Selector Component
  const renderAccountSelect = (
    label: string, 
    mappingKey: keyof AccountMapping, 
    hint?: string,
    filterPredicate?: (acc: AccountNode) => boolean,
    quickAction?: { type: MasterEntityType; label: string }
  ) => {
    const currentCode = config.mappings[mappingKey];
    const targetAccount = accounts.find(a => a.code === currentCode);
    const isValid = !!targetAccount;

    const filteredAccounts = filterPredicate ? accounts.filter(filterPredicate) : accounts;

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-indigo-200 transition-colors">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span>{label}</span>
          </label>
          <div className="flex items-center gap-1.5">
            {quickAction && (
              <button
                type="button"
                onClick={() => setMasterModalType(quickAction.type)}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer border border-indigo-200"
                title={`إضافة ${quickAction.label} جديد بهيكل الحسابات`}
              >
                <Plus className="w-3 h-3" />
                <span>{quickAction.label}</span>
              </button>
            )}
            {isValid ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>مربوط ومعتمد</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>غير موجود بالدليل</span>
              </span>
            )}
          </div>
        </div>

        {hint && (
          <p className="text-[11px] text-slate-500">{hint}</p>
        )}

        <div className="flex items-center gap-2">
          <select
            value={currentCode}
            onChange={(e) => handleMappingChange(mappingKey, e.target.value)}
            className={`w-full text-xs font-bold rounded-lg p-2.5 border transition-colors focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white ${
              isValid ? 'border-slate-300' : 'border-rose-300 bg-rose-50/50'
            }`}
          >
            <option value="">-- اختر الحساب من شجرة الحسابات --</option>
            {filteredAccounts.map(acc => (
              <option key={acc.id} value={acc.code}>
                [{acc.code}] {acc.name} ({acc.nature === 'debit' ? 'مدين' : 'دائن'} - مستوى {acc.level || 1})
              </option>
            ))}
          </select>
        </div>

        {targetAccount && (
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
            <span className="font-mono font-bold text-indigo-700">كود: {targetAccount.code}</span>
            <span>طبيعة: {targetAccount.nature === 'debit' ? 'مدين (Debit)' : 'دائن (Credit)'}</span>
            <span>مستوى: {targetAccount.level || 1}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-right pb-10" dir="rtl">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 left-5 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-slideUp ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl shadow-md">
            <Settings2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900">
                التكوين والربط المالي وسياسات التكاليف
              </h2>
              <span className="bg-indigo-100 text-indigo-900 text-xs font-black px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                <Factory className="w-3.5 h-3.5 text-indigo-700" />
                <span>الربط المحاسبي الآلي</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              التهيئة المركزية للربط الآلي بين شاشات المصنع (المشتريات، المبيعات، صرف وتشغيل الأوامر WIP) ودفاتر القيود اليومية وشجرة الحسابات
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="إعادة ضبط إلى الإعدادات القياسية للمصانع"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة القياسي</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="تصدير الإعدادات كملف JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير JSON</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer ${
              isDirty 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse' 
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>حفظ التعديلات</span>
          </button>
        </div>
      </div>

      {/* Central Structure Hub & Quick Master Entity Add Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-white">الإدارة المركزية للتكوين وشجرة الحسابات ERP</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  بيانات أساسية موحدة
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                تأسيس أطراف وبيانات الهيكل المالي (عملاء، موردين، أصناف ومخازن، أجور، خطوط إنتاج، مراكز تكلفة، حسابات)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
            {onNavigateToAccounts && (
              <button
                type="button"
                onClick={onNavigateToAccounts}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ml-1"
                title="عرض شجرة الحسابات الكاملة"
              >
                <Network className="w-3.5 h-3.5" />
                <span>شجرة الحسابات</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMasterModalType('customer')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>+ عميل</span>
            </button>

            <button
              type="button"
              onClick={() => setMasterModalType('supplier')}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Building className="w-3.5 h-3.5" />
              <span>+ مورد</span>
            </button>

            <button
              type="button"
              onClick={() => setMasterModalType('material')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PackageSearch className="w-3.5 h-3.5" />
              <span>+ خامة / صنف</span>
            </button>

            <button
              type="button"
              onClick={() => setMasterModalType('labor')}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>+ عامل / فني</span>
            </button>

            <button
              type="button"
              onClick={() => setMasterModalType('group')}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Factory className="w-3.5 h-3.5" />
              <span>+ خط / مجموعة</span>
            </button>

            <button
              type="button"
              onClick={() => setMasterModalType('department')}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>+ قسم / مركز</span>
            </button>

            <button
              type="button"
              onClick={() => setMasterModalType('account')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 shadow-xs cursor-pointer"
            >
              <Network className="w-3.5 h-3.5" />
              <span>+ حساب بالشجرة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Mapping Health Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-between">
            <span>صحة الربط الآلي</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {auditResults.completionRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {auditResults.validCount} من أصل {auditResults.totalMappings} حساب معتمد
          </div>
        </div>

        {/* Inventory Valuation Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-between">
            <span>طريقة تقييم المخزون</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-black text-slate-800">
            {config.policies.inventoryValuationMethod === 'weighted_average' ? 'المتوسط المرجح (WAC)' : 'الوارد أولاً صادر أولاً'}
          </div>
          <div className="text-[10px] text-amber-700 font-bold mt-1">
            تحديث تلقائي مع كل توريد
          </div>
        </div>

        {/* VAT Rate Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-between">
            <span>ضريبة القيمة المضافة</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-800 font-mono">
            {config.policies.vatEnabled ? `${config.policies.vatRate}%` : 'معطلة'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            مفعلة على الفواتير المعتمدة
          </div>
        </div>

        {/* Period Lock Status Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-between">
            <span>قفل الدفاتر المالية</span>
            <Lock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-800">
            {config.policies.periodLockDate ? `مقفل حتى ${config.policies.periodLockDate}` : 'الفترات مفتوحة'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {config.policies.currency} ({config.policies.currencySymbol})
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'structure'
                ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>خريطة الهيكل والبيانات الأساسية ERP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mappings')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'mappings'
                ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>الربط المحاسبي التلقائي للعمليات ({auditResults.validCount}/{auditResults.totalMappings})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'policies'
                ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>السياسات المالية ومحددات التكاليف</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sequences')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'sequences'
                ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>ترقيم وبادئات المستندات والقيود</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>فحص وتدقيق سلامة التكوين</span>
            {auditResults.missingCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {auditResults.missingCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab 0: Structure Hub (خريطة الهيكل المالي وشجرة الحسابات والبيانات الأساسية) */}
        {activeTab === 'structure' && (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Architectural Overview Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-base font-black text-white">
                    خريطة الربط الهيكلي بين شجرة الحسابات والبيانات الأساسية للنظام
                  </h3>
                </div>
                <p className="text-xs text-indigo-200 leading-relaxed max-w-2xl">
                  هنا تتجمع كافة أطراف وبيانات النظام (عملاء، موردين، خامات، عمال، خطوط إنتاج، أقسام) وترتبط مباشرة بالحسابات المالية المعتمدة في شجرة الحسابات. أي بيان يتم تأسيسه هنا يحتوي على كافة التفاصيل المعتمدة لشاشات الفواتير والإنتاج والمخازن.
                </p>
              </div>

              {onNavigateToAccounts && (
                <button
                  type="button"
                  onClick={onNavigateToAccounts}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer whitespace-nowrap"
                >
                  <Network className="w-4 h-4" />
                  <span>فتح شجرة الحسابات التفاعلية</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Master Entities Structural Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Customers */}
              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs hover:shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                      {entityCounts.customers} عميل مسجل
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">عملاء مبيعات الملابس</h4>
                  <div className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-200 my-2 inline-block">
                    الحساب المالي: 1221 (عملاء تجاريين)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    بيانات السجل التجاري، البطاقة الضريبية، جهات الاتصال، حد الائتمان، وفترات السداد لفواتير المبيعات.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMasterModalType('customer')}
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة عميل بالهيكل</span>
                </button>
              </div>

              {/* 2. Suppliers */}
              <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs hover:shadow-sm hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Building className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
                      {entityCounts.suppliers} مورد معتمد
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">موردي الخامات والتوريدات</h4>
                  <div className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-200 my-2 inline-block">
                    الحساب المالي: 2111 (موردي أقمشة ومستلزمات)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    بيانات الحساب البنكي، الـ IBAN، تخصص التوريد، والبطاقة الضريبية المعتمدة في فواتير المشتريات.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMasterModalType('supplier')}
                  className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة مورد بالهيكل</span>
                </button>
              </div>

              {/* 3. Fabrics & Materials */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <PackageSearch className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                      {entityCounts.fabrics} خامة قماش
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">مخازن الأقمشة والغزول</h4>
                  <div className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-200 my-2 inline-block">
                    الحساب المالي: 12411 (مخزن خامات أقمشة)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    مواصفات النسيج (وزن GSM، العرض، التركيب)، التكلفة المعيارية، وموقع التخزين والحد الأدنى للطلب.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMasterModalType('material')}
                  className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة خامة قماش</span>
                </button>
              </div>

              {/* 4. Accessories & Packaging */}
              <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-2xs hover:shadow-sm hover:border-cyan-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-mono">
                      {entityCounts.accessories} مستلزم وإكسسوار
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">مخازن الإكسسوارات والتعبئة</h4>
                  <div className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-200 my-2 inline-block">
                    الحساب المالي: 12412 (إكسسوارات وسوست)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    السوست، الأزرار، خيوط الحياكة، والكراتين والأكياس لحساب تكلفة أمر التشغيل BOM بدقة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMasterModalType('material')}
                  className="mt-4 w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة مستلزم / إكسسوار</span>
                </button>
              </div>

              {/* 5. Labor */}
              <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs hover:shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <HardHat className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono">
                      {entityCounts.labor} عامل وفني
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">العمالة والفنيين والأجور</h4>
                  <div className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-200 my-2 inline-block">
                    الحساب المالي: 5122 (أجور إنتاجية مباشرة)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    أنظمة الأجر باليومية والإنتاجية بالقطعة، الرتب الفنية، وساعات العمل اليومية لترحيل تكلفة الأجور.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMasterModalType('labor')}
                  className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة عامل / فني</span>
                </button>
              </div>

              {/* 6. Operational Groups */}
              <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs hover:shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Factory className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono">
                      {entityCounts.groups} خط تشغيل
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">خطوط ومجموعات التشغيل</h4>
                  <div className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-200 my-2 inline-block">
                    مراكز التشغيل الداخلي والخارجي
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    خطوط السنجر، الأوفر، الأورليه، مشرف الخط، عدد الماكينات، والطاقة الإنتاجية القصوى بالقطع يومياً.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMasterModalType('group')}
                  className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة خط / مجموعة</span>
                </button>
              </div>

              {/* 7. Departments & Cost Centers */}
              <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono">
                      {entityCounts.departments} أقسام صناعية
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">الأقسام ومراكز التكلفة</h4>
                  <div className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-200 my-2 inline-block">
                    الحساب المالي: 521 (تكاليف صناعية غير مباشرة)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    مراكز التكلفة (قص، تجميع، تطريز، كوي وتغليف)، مدير القسم، وموقع العنبر لتحميل الأعباء غير المباشرة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMasterModalType('department')}
                  className="mt-4 w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة قسم / مركز</span>
                </button>
              </div>

              {/* 8. Full Chart of Accounts */}
              <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-2xs hover:shadow-sm hover:border-slate-500 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                      <Network className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-mono">
                      {entityCounts.totalAccounts} حساب بالدليل
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">شجرة الحسابات العامة ERP</h4>
                  <div className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 my-2 inline-block">
                    دليل حسابات مصانع الملابس المعتمد
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    الدليل المحاسبي الشجري الكامل: الأصول 1، الالتزامات 2، حقوق الملكية 3، الإيرادات 4، وتكاليف التصنيع 5.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMasterModalType('account')}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ حساب</span>
                  </button>
                  {onNavigateToAccounts && (
                    <button
                      type="button"
                      onClick={onNavigateToAccounts}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center cursor-pointer"
                      title="عرض الشجرة"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Manufacturing Accounting Workflow Flowchart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-black text-sm text-slate-800">
                    الدورة المحاسبية الآلية لتصنيع الملابس (من شراء الخامات وحتى تسليم المبيعات)
                  </h4>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-200">
                  قيود مزدوجة آلية ERP
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-[10px]">المرحلة 1</span>
                    <ShoppingBag className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="font-bold text-slate-900">شراء وتوريد الخامات</div>
                  <div className="text-[11px] text-slate-600 font-mono space-y-0.5 pt-1">
                    <div className="text-blue-700 font-bold">من حـ/ مخزن الخامات (1241)</div>
                    <div className="text-amber-700 font-bold">إلى حـ/ الموردين (2111)</div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-[10px]">المرحلة 2</span>
                    <Layers className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="font-bold text-slate-900">صرف خامات للتشغيل</div>
                  <div className="text-[11px] text-slate-600 font-mono space-y-0.5 pt-1">
                    <div className="text-amber-800 font-bold">من حـ/ تشغيل WIP (1242)</div>
                    <div className="text-blue-700 font-bold">إلى حـ/ مخزن الخامات (1241)</div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-[10px]">المرحلة 3</span>
                    <HardHat className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="font-bold text-slate-900">تحميل الأجور ومصنعيات</div>
                  <div className="text-[11px] text-slate-600 font-mono space-y-0.5 pt-1">
                    <div className="text-amber-800 font-bold">من حـ/ تشغيل WIP (1242)</div>
                    <div className="text-indigo-700 font-bold">إلى حـ/ الأجور المباشرة (512)</div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-[10px]">المرحلة 4</span>
                    <PackageSearch className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="font-bold text-slate-900">إتمام الإنتاج التام</div>
                  <div className="text-[11px] text-slate-600 font-mono space-y-0.5 pt-1">
                    <div className="text-emerald-700 font-bold">من حـ/ مخزن التام (1243)</div>
                    <div className="text-amber-800 font-bold">إلى حـ/ تشغيل WIP (1242)</div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-[10px]">المرحلة 5</span>
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="font-bold text-slate-900">البيع وإثبات الإيراد</div>
                  <div className="text-[11px] text-slate-600 font-mono space-y-0.5 pt-1">
                    <div className="text-blue-700 font-bold">من حـ/ العملاء (1221)</div>
                    <div className="text-emerald-700 font-bold">إلى حـ/ المبيعات (411)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Account Mappings */}
        {activeTab === 'mappings' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 text-xs text-indigo-900 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">كيف يعمل الربط المحاسبي التلقائي؟</span>
                <span>
                  عند إنشاء أي فاتورة مشتريات خامات، أو فاتورة بيع للمنتجات، أو صرف خامات لأمر تشغيل، يقوم محرك القيود المحاسبي الآلي بقراءة الحسابات المحددة أدناه لإنشاء قيود يومية مزدوجة متوازنة تلقائياً وترحيلها لدفتر الأستاذ العام دون الحاجة لأي تدخل يدوي.
                </span>
              </div>
            </div>

            {/* Section 1: Raw Materials & Manufacturing Inventory */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <Factory className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  1. مخازن الخامات ومراحل الإنتاج تحت التشغيل (WIP) والمنتج التام
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderAccountSelect(
                  'حساب مخزن الأقمشة والغزول', 
                  'fabricInventoryAccountCode', 
                  'حساب الأصول المدين عند توريد واستلام الأقمشة في المشتريات (كود 12411)',
                  a => a.type === 'asset' || a.code.startsWith('124'),
                  { type: 'material', label: '+ خامة قماش' }
                )}
                {renderAccountSelect(
                  'حساب مخزن الإكسسوارات ومستلزمات الخياطة', 
                  'accessoriesInventoryAccountCode', 
                  'حساب الأصول المدين عند استلام السوست، الخيوط، والأزرار (كود 12412)',
                  a => a.type === 'asset' || a.code.startsWith('124'),
                  { type: 'material', label: '+ إكسسوار' }
                )}
                {renderAccountSelect(
                  'حساب مخزن مواد التعبئة والتغليف', 
                  'packagingInventoryAccountCode', 
                  'حساب الأكياس، الكراتين، والاستيكرات (كود 12413)',
                  a => a.type === 'asset' || a.code.startsWith('124'),
                  { type: 'material', label: '+ مواد تغليف' }
                )}
                {renderAccountSelect(
                  'حساب مخزون الإنتاج تحت التشغيل (WIP)', 
                  'wipAccountCode', 
                  'الحساب الوسيط لمراحل التشغيل الميداني: قص، خياطة، طباعة، تشطيب (كود 1242)',
                  a => a.type === 'asset' || a.code.startsWith('1242') || a.isWipOrManufacturing === true
                )}
                {renderAccountSelect(
                  'حساب مخزن الملابس الجاهزة (الإنتاج التام)', 
                  'finishedGoodsAccountCode', 
                  'الحساب المدين عند تحويل الباتشات تامة الصنع لمخزن البيع (كود 12431)',
                  a => a.type === 'asset' || a.code.startsWith('1243')
                )}
              </div>
            </div>

            {/* Section 2: Purchases & Suppliers */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  2. المشتريات والتوريدات والموردين
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderAccountSelect(
                  'حساب موردي الأقمشة والمنسوجات (دائن)', 
                  'suppliersPayableAccountCode', 
                  'الحساب الدائن عند إصدار فواتير شراء الأقمشة آجل (كود 2111)',
                  a => a.type === 'liability' || a.code.startsWith('211'),
                  { type: 'supplier', label: '+ مورد أقمشة' }
                )}
                {renderAccountSelect(
                  'حساب موردي الإكسسوارات والمستلزمات (دائن)', 
                  'accessoriesSuppliersAccountCode', 
                  'الحساب الدائن عند شراء مستلزمات الخياطة آجل (كود 2112)',
                  a => a.type === 'liability' || a.code.startsWith('211'),
                  { type: 'supplier', label: '+ مورد مستلزمات' }
                )}
                {renderAccountSelect(
                  'حساب مقاولي الباطن وورش التطريز الخارجية', 
                  'subcontractorsPayableAccountCode', 
                  'حساب مستحقات ورش الطباعة والتطريز والغسيل الخارجية (كود 2114)',
                  a => a.type === 'liability' || a.code.startsWith('211'),
                  { type: 'group', label: '+ ورشة خارجية' }
                )}
                {renderAccountSelect(
                  'حساب ضريبة القيمة المضافة على المدخلات', 
                  'purchaseVatAccountCode', 
                  'حساب الأصول المدين للضريبة المخصومة على فواتير المشتريات (كود 1232)',
                  a => a.type === 'asset' || a.code.startsWith('123')
                )}
                {renderAccountSelect(
                  'حساب خصم مكتسب على المشتريات', 
                  'purchaseDiscountsAccountCode', 
                  'الحساب الدائن للخصومات النقدية والتجارية الممنوحة من الموردين (كود 422)',
                  a => a.type === 'revenue' || a.code.startsWith('4')
                )}
              </div>
            </div>

            {/* Section 3: Sales & Customers */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  3. المبيعات وإيرادات التشغيل والعملاء
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderAccountSelect(
                  'حساب مبيعات الملابس الجاهزة والمنتجات التامة', 
                  'salesRevenueAccountCode', 
                  'حساب الإيراد الدائن عند إصدار فواتير بيع الملابس الجاهزة (كود 411)',
                  a => a.type === 'revenue' || a.code.startsWith('41')
                )}
                {renderAccountSelect(
                  'حساب إيرادات تشغيل وتصنيع للغير (مصنعيات)', 
                  'jobOrderRevenueAccountCode', 
                  'حساب إيراد مصنعيات القص والخياطة للعملاء الخارجيين (كود 412)',
                  a => a.type === 'revenue' || a.code.startsWith('41')
                )}
                {renderAccountSelect(
                  'حساب مردودات مبيعات ملابس جاهزة (مدين)', 
                  'salesReturnAccountCode', 
                  'حساب مردودات ومسموحات المبيعات المقابل للإيراد (كود 421)',
                  a => a.type === 'revenue' || a.code.startsWith('42')
                )}
                {renderAccountSelect(
                  'حساب عملاء مبيعات الملابس الجاهزة (مدين)', 
                  'customersReceivableAccountCode', 
                  'حساب الأصول المدين للعملاء التجاريين في فواتير الآجل (كود 1221)',
                  a => a.type === 'asset' || a.code.startsWith('122'),
                  { type: 'customer', label: '+ عميل مبيعات' }
                )}
                {renderAccountSelect(
                  'حساب ضريبة القيمة المضافة المستحقة (مخرجات)', 
                  'salesVatAccountCode', 
                  'حساب الالتزامات الدائن لضريبة المبيعات المستحقة لمصلحة الضرائب (كود 2133)',
                  a => a.type === 'liability' || a.code.startsWith('213')
                )}
              </div>
            </div>

            {/* Section 4: Costing, Labor & Cash */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <Coins className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  4. تكاليف التصنيع، العمالة، والخزينة والبنوك
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderAccountSelect(
                  'حساب تكلفة الخامات المباشرة المنصرفة للتشغيل (COGS)', 
                  'cogsAccountCode', 
                  'حساب تكلفة الإنتاج الصناعي عند صرف الأقمشة والمستلزمات (كود 511)',
                  a => a.type === 'expense' || a.code.startsWith('51')
                )}
                {renderAccountSelect(
                  'حساب الأجور والعمالة الإنتاجية المباشرة', 
                  'directLaborAccountCode', 
                  'أجور عمال القص والخياطة والكي والتعبئة (كود 512)',
                  a => a.type === 'expense' || a.code.startsWith('512'),
                  { type: 'labor', label: '+ عامل / فني' }
                )}
                {renderAccountSelect(
                  'حساب خدمات تصنيع خارجية ومقاولو باطن', 
                  'subcontractorsCostAccountCode', 
                  'تكاليف الطباعة والتطريز والغسيل الخارجي (كود 513)',
                  a => a.type === 'expense' || a.code.startsWith('513'),
                  { type: 'group', label: '+ ورشة تطريز' }
                )}
                {renderAccountSelect(
                  'حساب التكاليف الصناعية غير المباشرة (MOH)', 
                  'manufacturingOverheadAccountCode', 
                  'قوى محركة وكهرباء المصنع وإهلاك الآلات وصيانتها (كود 52)',
                  a => a.type === 'expense' || a.code.startsWith('52'),
                  { type: 'department', label: '+ قسم / مركز' }
                )}
                {renderAccountSelect(
                  'حساب الخزينة الرئيسية للمصنع', 
                  'mainCashAccountCode', 
                  'الصندوق النقدي الرئيسي للمعاملات النقدية (كود 1211)',
                  a => a.type === 'asset' || a.code.startsWith('121')
                )}
                {renderAccountSelect(
                  'حساب البنك - حساب جاري المصنع', 
                  'bankAccountCode', 
                  'الحساب البنكي لتحويلات العملاء وشيكات الموردين (كود 1213)',
                  a => a.type === 'asset' || a.code.startsWith('121')
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Financial Policies */}
        {activeTab === 'policies' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Currency & Presentation */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Coins className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-800">العملة والتقريب الحسابي</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">رمز العملة (Code)</label>
                    <input
                      type="text"
                      value={config.policies.currency}
                      onChange={(e) => handlePolicyChange('currency', e.target.value)}
                      className="w-full text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                      placeholder="مثال: EGP"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المسمى العربي للعملة</label>
                    <input
                      type="text"
                      value={config.policies.currencySymbol}
                      onChange={(e) => handlePolicyChange('currencySymbol', e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                      placeholder="مثال: ج.م"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التقريب العشري في القيود والفواتير</label>
                  <select
                    value={config.policies.roundingDecimals}
                    onChange={(e) => handlePolicyChange('roundingDecimals', parseInt(e.target.value, 10))}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                  >
                    <option value={2}>رقمين عشريين (مثال: 125.50 ج.م) - قياسي</option>
                    <option value={3}>3 أرقام عشرية (مثال: 125.500 ج.م) - دقة عالية للأقمشة</option>
                    <option value={0}>بدون كسور (تقريب لأقرب جنيه صحيح)</option>
                  </select>
                </div>
              </div>

              {/* Inventory Costing Method */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Layers className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-sm text-slate-800">طريقة تقييم المخزون وتكلفة الخامات</h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">طريقة تسعير المخزون المستهلك في التصنيع</label>
                  <select
                    value={config.policies.inventoryValuationMethod}
                    onChange={(e) => handlePolicyChange('inventoryValuationMethod', e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                  >
                    <option value="weighted_average">المتوسط المرجح للتكلفة (Weighted Average Cost - WAC) [موصى به للمصانع]</option>
                    <option value="fifo">الوارد أولاً صادر أولاً (First In, First Out - FIFO)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    طريقة المتوسط المرجح تضمن استقرار تكلفة القطعة المنتجة عند تذبذب أسعار الغزول والأقمشة في السوق المصري.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.policies.allowNegativeInventory}
                      onChange={(e) => handlePolicyChange('allowNegativeInventory', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                    />
                    <span>السماح بالأرصدة السالبة في مخازن الخامات (غير مستحسن صناعياً)</span>
                  </label>
                </div>
              </div>

              {/* VAT & Taxes */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-800">ضريبة القيمة المضافة (VAT)</h4>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">تفعيل ضريبة القيمة المضافة في النظام</label>
                  <input
                    type="checkbox"
                    checked={config.policies.vatEnabled}
                    onChange={(e) => handlePolicyChange('vatEnabled', e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                </div>

                {config.policies.vatEnabled && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">النسبة المئوية العامة لضريبة القيمة المضافة (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={config.policies.vatRate}
                        onChange={(e) => handlePolicyChange('vatRate', parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white pl-8"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">النسبة المطبقة في مصر هي 14% لقطاع الملابس والمنسوجات الجاهزة.</span>
                  </div>
                )}
              </div>

              {/* Fiscal Period Locking & Automated Ledger Posting */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Lock className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-sm text-slate-800">إغلاق الفترات والترحيل الآلي</h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ إغلاق الفترة المالية (Period Lock Date)</label>
                  <input
                    type="date"
                    value={config.policies.periodLockDate || ''}
                    onChange={(e) => handlePolicyChange('periodLockDate', e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    لن يُسمح بتعديل أو إضافة فواتير أو قيود يومية قبل هذا التاريخ لحماية الدفاتر المقفلة.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.policies.autoPostPurchasesToLedger}
                      onChange={(e) => handlePolicyChange('autoPostPurchasesToLedger', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                    />
                    <span>إنشاء وترحيل قيود المشتريات تلقائياً عند حفظ الفاتورة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.policies.autoPostSalesToLedger}
                      onChange={(e) => handlePolicyChange('autoPostSalesToLedger', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                    />
                    <span>إنشاء وترحيل قيود المبيعات تلقائياً عند إصدار الفاتورة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.policies.autoPostProductionWipToLedger}
                      onChange={(e) => handlePolicyChange('autoPostProductionWipToLedger', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                    />
                    <span>إنشاء قيود صرف الخامات وتشغيل أوامر الإنتاج WIP آلياً</span>
                  </label>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Document Sequences */}
        {activeTab === 'sequences' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
              يمكنك تخصيص البادئات الرقمية للمستندات والقيود اليومية لتتناسب مع الترقيم الداخلي المعتمد بمصنعك:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">بادئة قيود اليومية المحاسبية</label>
                <input
                  type="text"
                  value={config.sequences.journalEntryPrefix}
                  onChange={(e) => handleSequenceChange('journalEntryPrefix', e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                  placeholder="مثال: JV-"
                />
                <span className="text-[10px] text-slate-400 block">نموذج: {config.sequences.journalEntryPrefix}2026-0001</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">بادئة فواتير المشتريات</label>
                <input
                  type="text"
                  value={config.sequences.purchaseInvoicePrefix}
                  onChange={(e) => handleSequenceChange('purchaseInvoicePrefix', e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                  placeholder="مثال: PUR-"
                />
                <span className="text-[10px] text-slate-400 block">نموذج: {config.sequences.purchaseInvoicePrefix}1001</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">بادئة مردودات المشتريات</label>
                <input
                  type="text"
                  value={config.sequences.purchaseReturnPrefix}
                  onChange={(e) => handleSequenceChange('purchaseReturnPrefix', e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                  placeholder="مثال: PRET-"
                />
                <span className="text-[10px] text-slate-400 block">نموذج: {config.sequences.purchaseReturnPrefix}1001</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">بادئة فواتير المبيعات</label>
                <input
                  type="text"
                  value={config.sequences.salesInvoicePrefix}
                  onChange={(e) => handleSequenceChange('salesInvoicePrefix', e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                  placeholder="مثال: INV-"
                />
                <span className="text-[10px] text-slate-400 block">نموذج: {config.sequences.salesInvoicePrefix}2026-001</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">بادئة مردودات المبيعات</label>
                <input
                  type="text"
                  value={config.sequences.salesReturnPrefix}
                  onChange={(e) => handleSequenceChange('salesReturnPrefix', e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                  placeholder="مثال: SRET-"
                />
                <span className="text-[10px] text-slate-400 block">نموذج: {config.sequences.salesReturnPrefix}2026-001</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">بادئة أوامر الإنتاج والتشغيل</label>
                <input
                  type="text"
                  value={config.sequences.productionOrderPrefix}
                  onChange={(e) => handleSequenceChange('productionOrderPrefix', e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                  placeholder="مثال: PO-"
                />
                <span className="text-[10px] text-slate-400 block">نموذج: {config.sequences.productionOrderPrefix}2026-001</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Audit & Diagnostics */}
        {activeTab === 'audit' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">تقرير تشخيص سلامة التكوين والربط المالي</h3>
                <p className="text-xs text-slate-500 mt-0.5">فحص تطابق الحسابات المربوطة مع شجرة الحسابات الحالية</p>
              </div>

              {onNavigateToAccounts && (
                <button
                  type="button"
                  onClick={onNavigateToAccounts}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-colors"
                >
                  <span>فتح شجرة الحسابات</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Diagnostics Summary Banner */}
            {auditResults.missingCount === 0 ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-black text-sm">جميع الحسابات المربوطة سليمة ومعتمدة (100%)</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    النظام جاهز تماماً للترحيل الآلي لقيود المشتريات، المبيعات، ومخزون التشغيل تحت التشغيل (WIP) دون أي تعارض.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 flex items-start gap-3 text-rose-900">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-black text-sm">تنبيه: يوجد {auditResults.missingCount} حساب مربوط غير موجود بشجرة الحسابات!</h4>
                  <p className="text-xs text-rose-800 mt-1">
                    يرجى مراجعة وتحديث الحسابات المفقودة أو إعادة ضبط التكوين إلى الإعدادات القياسية للمصانع.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetToDefaults}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      إصلاح تلقائي واستعادة القياسي
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">البند المالي المربوط</th>
                    <th className="py-3 px-3 text-center">كود الحساب المحدد</th>
                    <th className="py-3 px-4">الحساب في شجرة الحسابات</th>
                    <th className="py-3 px-3 text-center">الطبيعة</th>
                    <th className="py-3 px-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {Object.keys(config.mappings).map(keyStr => {
                    const key = keyStr as keyof AccountMapping;
                    const code = config.mappings[key];
                    const account = accounts.find(a => a.code === code);
                    const label = auditResults.fieldLabels[key] || key;

                    return (
                      <tr key={key} className={account ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-2.5 px-4 font-bold text-slate-800">{label}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{code || '-'}</td>
                        <td className="py-2.5 px-4">
                          {account ? (
                            <span className="text-slate-800 font-bold">{account.name}</span>
                          ) : (
                            <span className="text-rose-600 font-bold">غير معرف في دليل الحسابات</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {account ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              account.nature === 'debit' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                            }`}>
                              {account.nature === 'debit' ? 'مدين' : 'دائن'}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {account ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>صحيح</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>مفقود</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Universal Master Entity Modal */}
      {masterModalType && (
        <UniversalMasterEntityModal
          initialType={masterModalType}
          onClose={() => setMasterModalType(null)}
          onSuccess={(type) => {
            setMasterModalType(null);
            loadAllData();
            showToast(`تم حفظ وتأسيس ${
              type === 'customer' ? 'بيانات العميل' :
              type === 'supplier' ? 'بيانات المورد' :
              type === 'material' ? 'الخامة والصنف' :
              type === 'labor' ? 'بيانات العامل' :
              type === 'group' ? 'مجموعة التشغيل' :
              type === 'department' ? 'القسم' : 'الحساب'
            } بنجاح`);
          }}
        />
      )}
    </div>
  );
}
