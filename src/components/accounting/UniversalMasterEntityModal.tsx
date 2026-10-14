import React, { useState, useEffect, useMemo } from 'react';
import {
  CustomerSupplier,
  MaterialItem,
  LaborProfile,
  OperationalGroup,
  Department,
  AccountNode
} from '../../types';
import {
  getAccounts,
  saveAccounts,
  getCustomersSuppliers,
  saveCustomersSuppliers,
  getMaterials,
  saveMaterials,
  getLabor,
  saveLabor,
  getOperationalGroups,
  saveOperationalGroups,
  getDepartments,
  saveDepartments
} from '../../lib/accountingStorage';
import { recordSystemApproval } from '../../lib/auditStorage';
import {
  X,
  Plus,
  CheckCircle2,
  Users,
  Building,
  HardHat,
  PackageSearch,
  Building2,
  Network,
  Factory,
  Tag,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  Hash,
  Coins,
  ShieldCheck,
  Percent,
  Check
} from 'lucide-react';

export type MasterEntityType = 
  | 'customer'
  | 'supplier'
  | 'material'
  | 'labor'
  | 'group'
  | 'department'
  | 'account';

interface UniversalMasterEntityModalProps {
  initialType?: MasterEntityType;
  editingItem?: any;
  onClose: () => void;
  onSuccess?: (type: MasterEntityType, item: any) => void;
}

export function UniversalMasterEntityModal({
  initialType = 'customer',
  editingItem,
  onClose,
  onSuccess
}: UniversalMasterEntityModalProps) {
  const [entityType, setEntityType] = useState<MasterEntityType>(initialType);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'financial' | 'specs' | 'extra'>('basic');

  // Loaded data for references & foreign keys
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<OperationalGroup[]>([]);
  const [suppliers, setSuppliers] = useState<CustomerSupplier[]>([]);

  useEffect(() => {
    try {
      const accList = getAccounts();
      setAccounts(accList);
      setDepartments(getDepartments());
      setGroups(getOperationalGroups());
      setSuppliers(getCustomersSuppliers().filter(c => c.type === 'supplier' || c.type === 'both'));
    } catch (e) {
      console.error('Error loading master references:', e);
    }
  }, []);

  // Filter accounts by type for smart dropdowns
  const customerAccounts = useMemo(() => {
    return accounts.filter(a => a.code.startsWith('122') || a.name.includes('عملاء'));
  }, [accounts]);

  const supplierAccounts = useMemo(() => {
    return accounts.filter(a => a.code.startsWith('211') || a.name.includes('مورد'));
  }, [accounts]);

  const inventoryAccounts = useMemo(() => {
    return accounts.filter(a => a.code.startsWith('124') || a.name.includes('مخزون'));
  }, [accounts]);

  const costAndExpenseAccounts = useMemo(() => {
    return accounts.filter(a => a.code.startsWith('5') || a.code.startsWith('6') || a.type === 'expense');
  }, [accounts]);

  const laborAccounts = useMemo(() => {
    return accounts.filter(a => a.code.startsWith('512') || a.name.includes('أجور'));
  }, [accounts]);

  // Form states per entity type
  // 1. Customer Form Data
  const [customerData, setCustomerData] = useState<Partial<CustomerSupplier>>(() => {
    if (editingItem && (initialType === 'customer' || editingItem.type === 'customer')) {
      return { ...editingItem };
    }
    return {
      type: 'customer',
      name: '',
      code: `CUST-${Math.floor(100 + Math.random() * 900)}`,
      category: 'تجار جملة وتوزيع',
      contactPerson: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      city: 'القاهرة',
      taxId: '',
      commercialReg: '',
      linkedAccountCode: '1221',
      creditLimit: 100000,
      paymentTerms: 'آجل 30 يوم',
      openingBalance: 0,
      openingBalanceType: 'debit',
      salesperson: '',
      notes: '',
      isActive: true
    };
  });

  // 2. Supplier Form Data
  const [supplierData, setSupplierData] = useState<Partial<CustomerSupplier>>(() => {
    if (editingItem && (initialType === 'supplier' || editingItem.type === 'supplier')) {
      return { ...editingItem };
    }
    return {
      type: 'supplier',
      name: '',
      code: `SUPP-${Math.floor(100 + Math.random() * 900)}`,
      category: 'مورد أقمشة وغزول',
      contactPerson: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      city: 'المحلة الكبرى',
      taxId: '',
      commercialReg: '',
      linkedAccountCode: '2111',
      creditLimit: 250000,
      paymentTerms: 'آجل 45 يوم',
      openingBalance: 0,
      openingBalanceType: 'credit',
      bankName: 'البنك الأهلي المصري',
      bankAccount: '',
      iban: '',
      notes: '',
      isActive: true
    };
  });

  // 3. Material Item Form Data
  const [materialData, setMaterialData] = useState<Partial<MaterialItem>>(() => {
    if (editingItem && initialType === 'material') {
      return { ...editingItem };
    }
    return {
      name: '',
      code: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      type: 'fabric',
      subCategory: 'أقمشة قطنية تريكو',
      unit: 'كجم',
      defaultCost: 220,
      linkedAccountId: '12411',
      linkedExpenseAccountId: '5111',
      minStockAlert: 50,
      reorderPoint: 100,
      warehouseLocation: 'عنبر الخامات - ممر أ',
      openingStockQty: 0,
      openingStockValue: 0,
      fabricWeight: 200,
      width: '185 سم',
      color: '',
      notes: '',
      isActive: true
    };
  });

  // 4. Labor Profile Form Data
  const [laborData, setLaborData] = useState<Partial<LaborProfile>>(() => {
    if (editingItem && initialType === 'labor') {
      return { ...editingItem };
    }
    return {
      name: '',
      code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      nationalId: '',
      role: 'عامل خياطة وتجميع',
      departmentId: 'dept_sew',
      operationalGroupId: '',
      skillLevel: 'فني أول',
      phone: '',
      address: '',
      city: 'القاهرة',
      hireDate: new Date().toISOString().split('T')[0],
      baseSalary: 250,
      pieceRate: 4.5,
      salaryType: 'يومية',
      salaryPeriod: 'يومي',
      dailyWorkingHours: 8,
      linkedAccountId: '5122',
      notes: '',
      isActive: true
    };
  });

  // 5. Operational Group Form Data
  const [groupData, setGroupData] = useState<Partial<OperationalGroup>>(() => {
    if (editingItem && initialType === 'group') {
      return { ...editingItem };
    }
    return {
      name: '',
      code: `GRP-${Math.floor(10 + Math.random() * 90)}`,
      type: 'internal',
      specialty: 'خياطة وتجميع خط السنجر والأوفر',
      contactPerson: '',
      phone: '',
      departmentId: 'dept_sew',
      machinesCount: 12,
      dailyCapacity: 450,
      linkedAccountId: '5122',
      notes: '',
      isActive: true
    };
  });

  // 6. Department Form Data
  const [deptData, setDeptData] = useState<Partial<Department>>(() => {
    if (editingItem && initialType === 'department') {
      return { ...editingItem };
    }
    return {
      name: '',
      code: `DEP-${Math.floor(10 + Math.random() * 90)}`,
      type: 'production',
      managerName: '',
      location: 'عنبر التشغيل الرئيسي',
      costCenterCode: 'CC-101',
      linkedAccountId: '521',
      description: 'قسم إنتاجي وتصنيعي مباشر',
      createdAt: new Date().toISOString()
    };
  });

  // 7. Account Node Form Data
  const [accountData, setAccountData] = useState<Partial<AccountNode>>(() => {
    if (editingItem && initialType === 'account') {
      return { ...editingItem };
    }
    return {
      code: '',
      name: '',
      type: 'asset',
      parentId: '',
      level: 3,
      nature: 'debit',
      isWipOrManufacturing: false,
      description: '',
      isActive: true
    };
  });

  // Auto-generate code when switching type
  const handleTypeChange = (newType: MasterEntityType) => {
    setEntityType(newType);
    setActiveFormTab('basic');
  };

  // Submit Handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (entityType === 'customer') {
        if (!customerData.name?.trim()) {
          alert('يرجى إدخال اسم العميل');
          return;
        }
        const existing = getCustomersSuppliers();
        let updated: CustomerSupplier[];
        const recordToSave: CustomerSupplier = {
          ...customerData,
          id: editingItem?.id || `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type: customerData.type || 'customer',
          name: customerData.name.trim(),
          isActive: customerData.isActive !== false,
          createdAt: editingItem?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as CustomerSupplier;

        if (editingItem?.id) {
          updated = existing.map(item => item.id === editingItem.id ? recordToSave : item);
        } else {
          updated = [recordToSave, ...existing];
        }
        saveCustomersSuppliers(updated);
        window.dispatchEvent(new CustomEvent('customers_updated'));

        recordSystemApproval({
          actionType: 'journal_entry',
          documentId: recordToSave.id,
          documentNumber: recordToSave.code || recordToSave.id,
          title: `تسجيل وتحديث بيانات العميل: ${recordToSave.name}`,
          details: `تم اعتماد بيانات العميل في الهيكل المالي: كود ${recordToSave.code} | هاتف ${recordToSave.phone || '-'} | حد ائتماني ${recordToSave.creditLimit?.toLocaleString('ar-EG')} ج.م`,
          counterpartyName: recordToSave.name
        });

        onSuccess?.('customer', recordToSave);
      } 
      else if (entityType === 'supplier') {
        if (!supplierData.name?.trim()) {
          alert('يرجى إدخال اسم المورد');
          return;
        }
        const existing = getCustomersSuppliers();
        let updated: CustomerSupplier[];
        const recordToSave: CustomerSupplier = {
          ...supplierData,
          id: editingItem?.id || `supp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type: supplierData.type || 'supplier',
          name: supplierData.name.trim(),
          isActive: supplierData.isActive !== false,
          createdAt: editingItem?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as CustomerSupplier;

        if (editingItem?.id) {
          updated = existing.map(item => item.id === editingItem.id ? recordToSave : item);
        } else {
          updated = [recordToSave, ...existing];
        }
        saveCustomersSuppliers(updated);
        window.dispatchEvent(new CustomEvent('customers_updated'));

        recordSystemApproval({
          actionType: 'purchase_invoice',
          documentId: recordToSave.id,
          documentNumber: recordToSave.code || recordToSave.id,
          title: `اعتماد مورد خامات جديد: ${recordToSave.name}`,
          details: `تم تسجيل المورد بهيكل الحسابات: كود ${recordToSave.code} | التخصص ${recordToSave.category} | حساب الشجرة ${recordToSave.linkedAccountCode || '2111'}`,
          counterpartyName: recordToSave.name
        });

        onSuccess?.('supplier', recordToSave);
      }
      else if (entityType === 'material') {
        if (!materialData.name?.trim()) {
          alert('يرجى إدخال اسم الخامة أو المستلزم');
          return;
        }
        const existing = getMaterials();
        let updated: MaterialItem[];
        const recordToSave: MaterialItem = {
          ...materialData,
          id: editingItem?.id || `mat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: materialData.name.trim(),
          unit: materialData.unit || 'متر',
          defaultCost: Number(materialData.defaultCost) || 0,
          isActive: materialData.isActive !== false,
          createdAt: editingItem?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as MaterialItem;

        if (editingItem?.id) {
          updated = existing.map(item => item.id === editingItem.id ? recordToSave : item);
        } else {
          updated = [recordToSave, ...existing];
        }
        saveMaterials(updated);
        window.dispatchEvent(new CustomEvent('raw_materials_updated'));

        recordSystemApproval({
          actionType: 'inventory_adjustment',
          documentId: recordToSave.id,
          documentNumber: recordToSave.code || recordToSave.id,
          title: `تسجيل صنف وخامة في الدليل: ${recordToSave.name}`,
          details: `إضافة خامة ${recordToSave.name} (${recordToSave.type === 'fabric' ? 'قماش' : 'إكسسوار'}) بسعر معياري ${recordToSave.defaultCost} ج.م/${recordToSave.unit}`,
          amount: recordToSave.defaultCost
        });

        onSuccess?.('material', recordToSave);
      }
      else if (entityType === 'labor') {
        if (!laborData.name?.trim()) {
          alert('يرجى إدخال اسم العامل / الفني');
          return;
        }
        const existing = getLabor();
        let updated: LaborProfile[];
        const recordToSave: LaborProfile = {
          ...laborData,
          id: editingItem?.id || `labor_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: laborData.name.trim(),
          role: laborData.role || 'عامل خياطة',
          isActive: laborData.isActive !== false,
          createdAt: editingItem?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as LaborProfile;

        if (editingItem?.id) {
          updated = existing.map(item => item.id === editingItem.id ? recordToSave : item);
        } else {
          updated = [recordToSave, ...existing];
        }
        saveLabor(updated);
        window.dispatchEvent(new CustomEvent('labor_updated'));

        onSuccess?.('labor', recordToSave);
      }
      else if (entityType === 'group') {
        if (!groupData.name?.trim()) {
          alert('يرجى إدخال اسم مجموعة التشغيل');
          return;
        }
        const existing = getOperationalGroups();
        let updated: OperationalGroup[];
        const recordToSave: OperationalGroup = {
          ...groupData,
          id: editingItem?.id || `grp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: groupData.name.trim(),
          type: groupData.type || 'internal',
          specialty: groupData.specialty || 'تشغيل عام',
          isActive: groupData.isActive !== false,
          createdAt: editingItem?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as OperationalGroup;

        if (editingItem?.id) {
          updated = existing.map(item => item.id === editingItem.id ? recordToSave : item);
        } else {
          updated = [recordToSave, ...existing];
        }
        saveOperationalGroups(updated);
        window.dispatchEvent(new CustomEvent('groups_updated'));

        onSuccess?.('group', recordToSave);
      }
      else if (entityType === 'department') {
        if (!deptData.name?.trim()) {
          alert('يرجى إدخال اسم القسم');
          return;
        }
        const existing = getDepartments();
        let updated: Department[];
        const recordToSave: Department = {
          ...deptData,
          id: editingItem?.id || `dept_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: deptData.name.trim(),
          createdAt: editingItem?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Department;

        if (editingItem?.id) {
          updated = existing.map(item => item.id === editingItem.id ? recordToSave : item);
        } else {
          updated = [recordToSave, ...existing];
        }
        saveDepartments(updated);
        window.dispatchEvent(new CustomEvent('departments_updated'));

        onSuccess?.('department', recordToSave);
      }
      else if (entityType === 'account') {
        if (!accountData.code?.trim() || !accountData.name?.trim()) {
          alert('يرجى إدخال كود واسم الحساب المحاسبي');
          return;
        }
        const existing = getAccounts();
        let updated: AccountNode[];
        const recordToSave: AccountNode = {
          ...accountData,
          id: editingItem?.id || `acc_${accountData.code.trim()}`,
          code: accountData.code.trim(),
          name: accountData.name.trim(),
          type: accountData.type || 'asset',
          level: Number(accountData.level) || 3,
          nature: accountData.nature || 'debit',
          isWipOrManufacturing: !!accountData.isWipOrManufacturing,
          isActive: accountData.isActive !== false
        } as AccountNode;

        if (editingItem?.id) {
          updated = existing.map(item => item.id === editingItem.id ? recordToSave : item);
        } else {
          // Check uniqueness of code
          if (existing.some(a => a.code === recordToSave.code)) {
            alert(`كود الحساب [${recordToSave.code}] مستخدم بالفعل. يرجى اختيار كود آخر.`);
            return;
          }
          updated = [...existing, recordToSave];
        }
        saveAccounts(updated);
        window.dispatchEvent(new CustomEvent('accounts_updated'));
        window.dispatchEvent(new CustomEvent('journal_entries_updated'));

        recordSystemApproval({
          actionType: 'journal_entry',
          documentId: recordToSave.id,
          documentNumber: recordToSave.code,
          title: `إضافة حساب جديد بالدليل: [${recordToSave.code}] ${recordToSave.name}`,
          details: `تم تأسيس حساب محاسبي جديد برتبة مستوى ${recordToSave.level} (${recordToSave.type} - ${recordToSave.nature})`
        });

        onSuccess?.('account', recordToSave);
      }

      onClose();
    } catch (err: any) {
      console.error('Save failed:', err);
      alert('حدث خطأ أثناء الحفظ: ' + (err.message || 'يرجى مراجعة البيانات'));
    }
  };

  // Helper when parent account is selected for account node
  const handleParentSelect = (pId: string) => {
    const parent = accounts.find(a => a.id === pId);
    if (parent) {
      // Find sub accounts to suggest next serial code
      const subAccounts = accounts.filter(a => a.parentId === parent.id || a.code.startsWith(parent.code));
      let nextCode = `${parent.code}1`;
      if (subAccounts.length > 0) {
        const codes = subAccounts.map(s => parseInt(s.code, 10)).filter(n => !isNaN(n));
        if (codes.length > 0) {
          nextCode = String(Math.max(...codes) + 1);
        }
      }
      setAccountData(prev => ({
        ...prev,
        parentId: parent.id,
        level: (parent.level || 1) + 1,
        type: parent.type,
        nature: parent.nature,
        isWipOrManufacturing: parent.isWipOrManufacturing || false,
        code: nextCode
      }));
    } else {
      setAccountData(prev => ({ ...prev, parentId: '', level: 1 }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  {editingItem ? 'تعديل وتحديث بيانات بالهيكل المالي' : 'إضافة وتأسيس بيان جديد بالهيكل المالي والإداري'}
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  مركزية البيانات القياسية ERP
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد وضبط كافة البيانات الأساسية التي تعتمد عليها شاشات الفواتير، الإنتاج، التكاليف، المخازن، والقيود
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Entity Type Selector (Buttons Bar) */}
        {!editingItem && (
          <div className="px-6 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
            <span className="text-xs font-black text-slate-500 ml-2 whitespace-nowrap">اختر نوع البيان:</span>
            
            <button
              type="button"
              onClick={() => handleTypeChange('customer')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                entityType === 'customer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>عميل مبيعات</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('supplier')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                entityType === 'supplier'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>مورد خامات ومستلزمات</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('material')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                entityType === 'material'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <PackageSearch className="w-3.5 h-3.5" />
              <span>صنف / خامة قياسية</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('labor')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                entityType === 'labor'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>عامل / فني تشغيل</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('group')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                entityType === 'group'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>مجموعة تشغيل / خط إنتاج</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('department')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                entityType === 'department'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>قسم / مركز تكلفة</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('account')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                entityType === 'account'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>حساب بشجرة الحسابات</span>
            </button>
          </div>
        )}

        {/* Dynamic Form Area */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          
          {/* ========================================================================= */}
          {/* 1. CUSTOMER FORM VIEW                                                     */}
          {/* ========================================================================= */}
          {entityType === 'customer' && (
            <div className="space-y-6">
              <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-blue-950">بيانات وتكوين حساب العميل</h3>
                  <p className="text-xs text-blue-800">
                    هذه البيانات تظهر في فواتير المبيعات، عروض الأسعار، وسندات تحصيل الخزينة، وتحدد الحد الائتماني وشروط السداد
                  </p>
                </div>
              </div>

              {/* Group 1: Basic & Category */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>البيانات التعريفية والتصنيف</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اسم العميل / الشركة / المعرض <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: سلسلة متاجر النخبة للأزياء الحديثة"
                      value={customerData.name || ''}
                      onChange={e => setCustomerData({ ...customerData, name: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">كود العميل</label>
                    <input
                      type="text"
                      value={customerData.code || ''}
                      onChange={e => setCustomerData({ ...customerData, code: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">طبيعة الحساب</label>
                    <select
                      value={customerData.type || 'customer'}
                      onChange={e => setCustomerData({ ...customerData, type: e.target.value as any })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="customer">عميل مبيعات فقط</option>
                      <option value="both">عميل ومورد معاً (متبادل)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">تصنيف قطاع العميل</label>
                    <select
                      value={customerData.category || 'تجار جملة وتوزيع'}
                      onChange={e => setCustomerData({ ...customerData, category: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="تجار جملة وتوزيع">تجار جملة وتوزيع مركزي</option>
                      <option value="محلات ومولات ومتاجر قطاعي">محلات ومولات ومتاجر تجزئة</option>
                      <option value="توكيلات وبراندات تجارية">توكيلات وبراندات كبرى</option>
                      <option value="عملاء تصدير وشحن خارجي">عملاء تصدير وشحن خارجي</option>
                      <option value="تشغيل وتصنيع للغير (مصنعيات)">تشغيل وتصنيع للغير (مصنعيات)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">المسؤول المفوض / جهة الاتصال</label>
                    <input
                      type="text"
                      placeholder="مثال: أ. محمود فوزي - مدير المشتريات"
                      value={customerData.contactPerson || ''}
                      onChange={e => setCustomerData({ ...customerData, contactPerson: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Contact & Address */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>بيانات الاتصال والعنوان الجغرافي</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الهاتف المحمول الرئيسي</label>
                    <input
                      type="text"
                      placeholder="010XXXXXXXX"
                      value={customerData.phone || ''}
                      onChange={e => setCustomerData({ ...customerData, phone: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الواتساب للطلبيات</label>
                    <input
                      type="text"
                      placeholder="010XXXXXXXX"
                      value={customerData.whatsapp || ''}
                      onChange={e => setCustomerData({ ...customerData, whatsapp: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                    <input
                      type="email"
                      placeholder="info@client.com"
                      value={customerData.email || ''}
                      onChange={e => setCustomerData({ ...customerData, email: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">المحافظة / المدينة</label>
                    <input
                      type="text"
                      placeholder="مثال: القاهرة - مدينة نصر"
                      value={customerData.city || ''}
                      onChange={e => setCustomerData({ ...customerData, city: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان التفصيلي ومخزن الاستلام</label>
                    <input
                      type="text"
                      placeholder="مثال: المنطقة الحرة - قطعة 14 بجوار مبنى الجمارك"
                      value={customerData.address || ''}
                      onChange={e => setCustomerData({ ...customerData, address: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Financial & GL Integration */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>الربط المحاسبي بشجرة الحسابات والحدود الائتمانية</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الحساب المرتبط بالشجرة (GL)</label>
                    <select
                      value={customerData.linkedAccountCode || '1221'}
                      onChange={e => setCustomerData({ ...customerData, linkedAccountCode: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="1221">[1221] عملاء مبيعات الملابس الجاهزة</option>
                      <option value="1222">[1222] عملاء التشغيل والتصنيع للغير</option>
                      <option value="1223">[1223] أوراق قبض وكمبيالات عملاء</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الحد الائتماني المسموح به (ج.م)</label>
                    <input
                      type="number"
                      placeholder="100000"
                      value={customerData.creditLimit ?? 100000}
                      onChange={e => setCustomerData({ ...customerData, creditLimit: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">شروط وفترة السداد</label>
                    <select
                      value={customerData.paymentTerms || 'آجل 30 يوم'}
                      onChange={e => setCustomerData({ ...customerData, paymentTerms: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="نقدي فوري">نقدي فوري عند الاستلام</option>
                      <option value="آجل 15 يوم">آجل 15 يوم</option>
                      <option value="آجل 30 يوم">آجل 30 يوم</option>
                      <option value="آجل 60 يوم">آجل 60 يوم</option>
                      <option value="شيكات آجلة">شيكات مصرفية مؤجلة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الرقم الضريبي</label>
                    <input
                      type="text"
                      placeholder="XXX-XXX-XXX"
                      value={customerData.taxId || ''}
                      onChange={e => setCustomerData({ ...customerData, taxId: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">السجل التجاري</label>
                    <input
                      type="text"
                      placeholder="رقم السجل"
                      value={customerData.commercialReg || ''}
                      onChange={e => setCustomerData({ ...customerData, commercialReg: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الرصيد الافتتاحي (ج.م)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={customerData.openingBalance || 0}
                        onChange={e => setCustomerData({ ...customerData, openingBalance: Number(e.target.value) })}
                        className="w-2/3 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                      />
                      <select
                        value={customerData.openingBalanceType || 'debit'}
                        onChange={e => setCustomerData({ ...customerData, openingBalanceType: e.target.value as any })}
                        className="w-1/3 text-[11px] font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                      >
                        <option value="debit">مدين (عليه)</option>
                        <option value="credit">دائن (له)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">المندوب / المشرف البيعي المسؤول</label>
                    <input
                      type="text"
                      placeholder="مثال: أ. وائل النجار"
                      value={customerData.salesperson || ''}
                      onChange={e => setCustomerData({ ...customerData, salesperson: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">نسبة الخصم المعتمدة للعميل (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0 %"
                      value={customerData.discountPercentage ?? ''}
                      onChange={e => setCustomerData({ ...customerData, discountPercentage: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات وشروط خاصة بالعميل</label>
                    <textarea
                      rows={2}
                      placeholder="شروط التسليم، مواعيد الاستلام المعتادة، اتفاقيات التسعير..."
                      value={customerData.notes || ''}
                      onChange={e => setCustomerData({ ...customerData, notes: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Notes */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="custActive"
                    checked={customerData.isActive !== false}
                    onChange={e => setCustomerData({ ...customerData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="custActive" className="text-xs font-bold text-slate-800">
                    حساب نشط ومتاح في فواتير المبيعات وتحصيل الخزينة
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. SUPPLIER FORM VIEW                                                     */}
          {/* ========================================================================= */}
          {entityType === 'supplier' && (
            <div className="space-y-6">
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950">بيانات وتكوين حساب المورد</h3>
                  <p className="text-xs text-amber-800">
                    هذه البيانات تظهر في فواتير الشراء، أذون استلام الخامات، وسندات صرف الخزينة والتحويلات البنكية
                  </p>
                </div>
              </div>

              {/* Group 1: Basic */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>البيانات التعريفية والتخصص</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اسم المورد / المصنع / الشركة <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: شركة النيل للغزل والمنسوجات والأقمشة"
                      value={supplierData.name || ''}
                      onChange={e => setSupplierData({ ...supplierData, name: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">كود المورد</label>
                    <input
                      type="text"
                      value={supplierData.code || ''}
                      onChange={e => setSupplierData({ ...supplierData, code: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">تخصص التوريد</label>
                    <select
                      value={supplierData.category || 'مورد أقمشة وغزول'}
                      onChange={e => setSupplierData({ ...supplierData, category: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="مورد أقمشة وغزول">أقمشة وغزول ومنسوجات</option>
                      <option value="مورد إكسسوارات وسوست وأزرار">إكسسوارات وسوست وأزرار</option>
                      <option value="مورد خيوط حياكة وتطريز">خيوط حياكة وتطريز</option>
                      <option value="مورد كرتون ومواد تغليف">كرتون ومواد تغليف وأكياس</option>
                      <option value="مصابغ وتجهيز ومعالجة أقمشة">مصابغ وتجهيز أقمشة</option>
                      <option value="ورش تشغيل خارجي ومقاول باطن">ورش تشغيل خارجي ومقاول باطن</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">مسؤول المبيعات لدى المورد</label>
                    <input
                      type="text"
                      placeholder="مثال: م. أحمد الشناوي - قطاع النسيج"
                      value={supplierData.contactPerson || ''}
                      onChange={e => setSupplierData({ ...supplierData, contactPerson: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الهاتف المحمول</label>
                    <input
                      type="text"
                      placeholder="010XXXXXXXX"
                      value={supplierData.phone || ''}
                      onChange={e => setSupplierData({ ...supplierData, phone: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الواتساب</label>
                    <input
                      type="text"
                      placeholder="010XXXXXXXX"
                      value={supplierData.whatsapp || ''}
                      onChange={e => setSupplierData({ ...supplierData, whatsapp: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                    <input
                      type="email"
                      placeholder="supplier@textile.com"
                      value={supplierData.email || ''}
                      onChange={e => setSupplierData({ ...supplierData, email: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">المحافظة / المدينة</label>
                    <input
                      type="text"
                      placeholder="المحلة الكبرى"
                      value={supplierData.city || ''}
                      onChange={e => setSupplierData({ ...supplierData, city: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-12">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان التفصيلي ومقر المصنع أو المخزن</label>
                    <input
                      type="text"
                      placeholder="المنطقة الصناعية - طريق المحلة طنطا"
                      value={supplierData.address || ''}
                      onChange={e => setSupplierData({ ...supplierData, address: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Financial & Bank Integration */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>الربط المحاسبي والحسابات البنكية للمدفوعات</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الحساب بدليل الحسابات (GL)</label>
                    <select
                      value={supplierData.linkedAccountCode || '2111'}
                      onChange={e => setSupplierData({ ...supplierData, linkedAccountCode: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="2111">[2111] موردو الأقمشة والغزول والمنسوجات</option>
                      <option value="2112">[2112] موردو الإكسسوارات وسوست وأزرار</option>
                      <option value="2113">[2113] موردو مواد التعبئة والتغليف والكرتون</option>
                      <option value="2114">[2114] مقاولو باطن ومصنعيات خارجية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الحد الائتماني الممنوح (ج.م)</label>
                    <input
                      type="number"
                      placeholder="250000"
                      value={supplierData.creditLimit ?? 250000}
                      onChange={e => setSupplierData({ ...supplierData, creditLimit: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">شروط وفترة السداد</label>
                    <select
                      value={supplierData.paymentTerms || 'آجل 45 يوم'}
                      onChange={e => setSupplierData({ ...supplierData, paymentTerms: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="نقدي فوري">نقدي عند التوريد والاستلام</option>
                      <option value="آجل 15 يوم">آجل 15 يوم</option>
                      <option value="آجل 30 يوم">آجل 30 يوم</option>
                      <option value="آجل 45 يوم">آجل 45 يوم</option>
                      <option value="شيكات آجلة">شيكات بنكية مؤجلة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الرقم الضريبي</label>
                    <input
                      type="text"
                      placeholder="XXX-XXX-XXX"
                      value={supplierData.taxId || ''}
                      onChange={e => setSupplierData({ ...supplierData, taxId: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">السجل التجاري</label>
                    <input
                      type="text"
                      placeholder="رقم السجل"
                      value={supplierData.commercialReg || ''}
                      onChange={e => setSupplierData({ ...supplierData, commercialReg: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الرصيد الافتتاحي (ج.م)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={supplierData.openingBalance || 0}
                        onChange={e => setSupplierData({ ...supplierData, openingBalance: Number(e.target.value) })}
                        className="w-2/3 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                      />
                      <select
                        value={supplierData.openingBalanceType || 'credit'}
                        onChange={e => setSupplierData({ ...supplierData, openingBalanceType: e.target.value as any })}
                        className="w-1/3 text-[11px] font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                      >
                        <option value="credit">دائن (له)</option>
                        <option value="debit">مدين (عليه)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم البنك المعتمد للمورد</label>
                    <input
                      type="text"
                      placeholder="مثال: البنك الأهلي المصري"
                      value={supplierData.bankName || ''}
                      onChange={e => setSupplierData({ ...supplierData, bankName: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الحساب البنكي</label>
                    <input
                      type="text"
                      placeholder="رقم الحساب"
                      value={supplierData.bankAccount || ''}
                      onChange={e => setSupplierData({ ...supplierData, bankAccount: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الآيبان الدولي (IBAN)</label>
                    <input
                      type="text"
                      placeholder="EGXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={supplierData.iban || ''}
                      onChange={e => setSupplierData({ ...supplierData, iban: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات وشروط التوريد</label>
                    <textarea
                      rows={2}
                      placeholder="أوقات التوريد، فترات السماح، مواصفات الفحص والاستلام..."
                      value={supplierData.notes || ''}
                      onChange={e => setSupplierData({ ...supplierData, notes: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="suppActive"
                    checked={supplierData.isActive !== false}
                    onChange={e => setSupplierData({ ...supplierData, isActive: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <label htmlFor="suppActive" className="text-xs font-bold text-slate-800">
                    مورد معتمد ونشط متاح في فواتير الشراء وأذون الإضافة وسداد الخزينة
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. MATERIAL / ITEM FORM VIEW                                              */}
          {/* ========================================================================= */}
          {entityType === 'material' && (
            <div className="space-y-6">
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <PackageSearch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950">بيانات وتكوين الصنف والخامة القياسية</h3>
                  <p className="text-xs text-emerald-800">
                    تعتمد عليها أوامر الإنتاج، استهلاك القص، أذون صرف الإكسسوارات، فواتير الشراء، وتسويات المخزن
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>المواصفات الأساسية والوحدات</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اسم الخامة / المستلزم <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: قماش قطن سنجل جيرسي 100% معالج"
                      value={materialData.name || ''}
                      onChange={e => setMaterialData({ ...materialData, name: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">كود الصنف الداخلي</label>
                    <input
                      type="text"
                      placeholder="FAB-COT-01"
                      value={materialData.code || ''}
                      onChange={e => setMaterialData({ ...materialData, code: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الباركود الدولي / المصنعي</label>
                    <input
                      type="text"
                      placeholder="622XXXXXXXXXX"
                      value={materialData.barcode || ''}
                      onChange={e => setMaterialData({ ...materialData, barcode: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">التصنيف الرئيسي</label>
                    <select
                      value={materialData.type || 'fabric'}
                      onChange={e => {
                        const newType = e.target.value;
                        setMaterialData({
                          ...materialData,
                          type: newType,
                          unit: newType === 'fabric' ? 'كجم' : 'قطعة',
                          linkedAccountId: newType === 'fabric' ? '12411' : '12412'
                        });
                      }}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="fabric">أقمشة وغزول (Fabric)</option>
                      <option value="accessory">إكسسوارات ومستلزمات خياطة</option>
                      <option value="packaging">تعبئة وتغليف وكرتون</option>
                      <option value="operating_supply">مهمات تشغيل وصيانة</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">التصنيف الفرعي</label>
                    <input
                      type="text"
                      placeholder="سنجل جيرسي / سوست معدنية..."
                      value={materialData.subCategory || ''}
                      onChange={e => setMaterialData({ ...materialData, subCategory: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">وحدة القياس المخزنية</label>
                    <select
                      value={materialData.unit || 'كجم'}
                      onChange={e => setMaterialData({ ...materialData, unit: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="كجم">كيلوجرام (كجم)</option>
                      <option value="متر">متر طولي (متر)</option>
                      <option value="طوبة (رول)">طوبة (رول قماش كامل)</option>
                      <option value="قطعة">قطعة فردية</option>
                      <option value="دزينة">دزينة (12 قطعة)</option>
                      <option value="باكو">باكو / كيس</option>
                      <option value="1000 قطعة">1000 قطعة (ألفية)</option>
                      <option value="بكرة">بكرة خيط</option>
                      <option value="كرتونة">كرتونة شحن</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">تكلفة الشراء المعيارية (ج.م)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="220.00"
                      value={materialData.defaultCost || ''}
                      onChange={e => setMaterialData({ ...materialData, defaultCost: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر البيع التقديري (ج.م)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={materialData.sellingPrice || ''}
                      onChange={e => setMaterialData({ ...materialData, sellingPrice: Number(e.target.value) })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">حد الأمان والطلب الأدنى</label>
                    <input
                      type="number"
                      placeholder="50"
                      value={materialData.minStockAlert || ''}
                      onChange={e => setMaterialData({ ...materialData, minStockAlert: Number(e.target.value) })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: GL & Warehouse */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>الربط المحاسبي بشجرة الحسابات وموقع المخزن</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">حساب المخزون بالشجرة (GL Asset)</label>
                    <select
                      value={materialData.linkedAccountId || '12411'}
                      onChange={e => setMaterialData({ ...materialData, linkedAccountId: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="12411">[12411] مخزون الأقمشة والغزول والمنسوجات</option>
                      <option value="12412">[12412] مخزون مستلزمات الإنتاج والإكسسوارات</option>
                      <option value="12413">[12413] مخزون مواد التعبئة والتغليف والكرتون</option>
                      <option value="12414">[12414] مخزون مهمات وقطع غيار وزيوت</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">حساب استهلاك التشغيل بالشجرة (GL Cost)</label>
                    <select
                      value={materialData.linkedExpenseAccountId || '5111'}
                      onChange={e => setMaterialData({ ...materialData, linkedExpenseAccountId: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="5111">[5111] تكلفة استهلاك الأقمشة والغزول المباشرة</option>
                      <option value="5112">[5112] تكلفة استهلاك مستلزمات الإنتاج والإكسسوارات</option>
                      <option value="5113">[5113] تكلفة مواد التعبئة والتغليف المباشرة</option>
                      <option value="527">[527] مهمات ووقود ومستهلكات الورش</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">موقع التخزين بالمستودع</label>
                    <input
                      type="text"
                      placeholder="عنبر الخامات - رف B-04"
                      value={materialData.warehouseLocation || ''}
                      onChange={e => setMaterialData({ ...materialData, warehouseLocation: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الرصيد الافتتاحي (كمية)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={materialData.openingStockQty || ''}
                      onChange={e => setMaterialData({ ...materialData, openingStockQty: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">إجمالي قيمة الرصيد الافتتاحي (ج.م)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={materialData.openingStockValue || ''}
                      onChange={e => setMaterialData({ ...materialData, openingStockValue: Number(e.target.value) })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-12">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">المورد المفضل / المعتمد للخامة</label>
                    <select
                      value={materialData.preferredSupplierId || ''}
                      onChange={e => setMaterialData({ ...materialData, preferredSupplierId: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="">-- بدون مورد محدد --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 3: Technical Specs & Fabric Properties */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>المواصفات الفنية للنسيج والخامات (Technical Specs)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">وزن القماش (GSM جرام/م2)</label>
                    <input
                      type="number"
                      placeholder="200"
                      value={materialData.fabricWeight || ''}
                      onChange={e => setMaterialData({ ...materialData, fabricWeight: Number(e.target.value) })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">عرض القماش</label>
                    <input
                      type="text"
                      placeholder="185 سم أو 72 بوصة"
                      value={materialData.width || ''}
                      onChange={e => setMaterialData({ ...materialData, width: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اللون / كود اللون</label>
                    <input
                      type="text"
                      placeholder="أسود داكن / #000000"
                      value={materialData.color || ''}
                      onChange={e => setMaterialData({ ...materialData, color: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">التركيب النسيجي</label>
                    <input
                      type="text"
                      placeholder="100% قطن أو 65% بوليستر"
                      value={materialData.composition || ''}
                      onChange={e => setMaterialData({ ...materialData, composition: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات واشتراطات الجودة والمواصفات القياسية</label>
                    <textarea
                      rows={2}
                      placeholder="تعليمات الانكماش، ثبات الصباغة، تعليمات الغسيل، شروط التخزين..."
                      value={materialData.notes || ''}
                      onChange={e => setMaterialData({ ...materialData, notes: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="matActive"
                    checked={materialData.isActive !== false}
                    onChange={e => setMaterialData({ ...materialData, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="matActive" className="text-xs font-bold text-slate-800">
                    صنف قياسي نشط ومتاح في فواتير الشراء، بطاقة الصنف (BOM)، والإنتاج
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. LABOR PROFILE FORM VIEW                                                */}
          {/* ========================================================================= */}
          {entityType === 'labor' && (
            <div className="space-y-6">
              <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-indigo-950">بيانات وتكوين العامل والفني ونظام الأجور</h3>
                  <p className="text-xs text-indigo-800">
                    ترتبط بحسابات تكلفة القطعة في أوامر الإنتاج، استحقاقات عمال القص، الخياطة، الكي، والتشطيب
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-indigo-600" />
                  <span>البيانات الشخصية والمهنية</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اسم الفني / العامل الكامل <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد عبد الله السيد"
                      value={laborData.name || ''}
                      onChange={e => setLaborData({ ...laborData, name: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">كود الموظف</label>
                    <input
                      type="text"
                      value={laborData.code || ''}
                      onChange={e => setLaborData({ ...laborData, code: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الرقم القومي</label>
                    <input
                      type="text"
                      placeholder="14 رقم قومي"
                      value={laborData.nationalId || ''}
                      onChange={e => setLaborData({ ...laborData, nationalId: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">مرحلة الإنتاج / التخصص</label>
                    <select
                      value={laborData.role || 'عامل خياطة وتجميع'}
                      onChange={e => {
                        const r = e.target.value;
                        let acc = '5122';
                        if (r.includes('قص')) acc = '5121';
                        else if (r.includes('تشطيب') || r.includes('كي')) acc = '5123';
                        else if (r.includes('مشرف') || r.includes('جودة')) acc = '526';
                        setLaborData({ ...laborData, role: r, linkedAccountId: acc });
                      }}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="عامل قص وتفصيل">عامل قص وتفصيل (عنبر القص)</option>
                      <option value="عامل تجهيز مستلزمات">عامل تجهيز وصرف مستلزمات</option>
                      <option value="عامل خياطة وتجميع">عامل خياطة وتجميع (ماكينات سنجر/أوفر)</option>
                      <option value="فني تطريز وطباعة">فني تطريز وطباعة</option>
                      <option value="عامل تشطيب وفنش">عامل تشطيب وتنظيف وفنش</option>
                      <option value="عامل مكواة وبخار">عامل مكواة وبخار</option>
                      <option value="مراقب جودة (QC)">مراقب وفاحص جودة (QC)</option>
                      <option value="عامل تعبئة وتغليف">عامل تعبئة وتغليف وباركود</option>
                      <option value="مشرف خط إنتاج">مشرف خط إنتاج / رئيس عنبر</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">القسم التابع له</label>
                    <select
                      value={laborData.departmentId || ''}
                      onChange={e => setLaborData({ ...laborData, departmentId: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="">-- اختر القسم --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">خط الإنتاج / مجموعة التشغيل</label>
                    <select
                      value={laborData.operationalGroupId || ''}
                      onChange={e => setLaborData({ ...laborData, operationalGroupId: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="">-- بدون مجموعة محددة --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.type === 'internal' ? 'داخلي' : 'خارجي'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">مستوى الخبرة والمهارة</label>
                    <select
                      value={laborData.skillLevel || 'فني أول'}
                      onChange={e => setLaborData({ ...laborData, skillLevel: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="مبتدئ / تحت التدريب">مبتدئ / تحت التدريب</option>
                      <option value="فني تشغيل">فني تشغيل</option>
                      <option value="فني أول">فني أول</option>
                      <option value="أسطى / رئيس خط">أسطى / رئيس خط إنتاج</option>
                      <option value="مشرف جودة ومعاينة">مشرف جودة ومعاينة</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">نظام احتساب الأجر</label>
                    <select
                      value={laborData.salaryType || 'يومية'}
                      onChange={e => setLaborData({ ...laborData, salaryType: e.target.value as any })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="يومية">أجر يومية ثابتة (Day Rate)</option>
                      <option value="بالقطعة">أجر بالقطعة المنتجة (Piece Rate)</option>
                      <option value="شهري">راتب شهري ثابت</option>
                      <option value="بالساعة">أجر بالساعة</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {laborData.salaryType === 'بالقطعة' ? 'سعر القطعة المعياري (ج.م)' : 'قيمة الأجر / الراتب (ج.م)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="250"
                      value={laborData.baseSalary || ''}
                      onChange={e => setLaborData({ ...laborData, baseSalary: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الحساب المحاسبي للأجور (GL)</label>
                    <select
                      value={laborData.linkedAccountId || '5122'}
                      onChange={e => setLaborData({ ...laborData, linkedAccountId: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="5121">[5121] أجور وعمالة القص والتفصيل المباشرة</option>
                      <option value="5122">[5122] أجور وعمالة الخياطة والتجميع المباشرة</option>
                      <option value="5123">[5123] أجور وعمالة الكي والتشطيب والفنش</option>
                      <option value="526">[526] مرتبات المشرفين ومراقبي الجودة</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ التعيين / الالتحاق</label>
                    <input
                      type="date"
                      value={laborData.hireDate || ''}
                      onChange={e => setLaborData({ ...laborData, hireDate: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ساعات العمل اليومية الرسمية</label>
                    <input
                      type="number"
                      value={laborData.dailyWorkingHours || 8}
                      onChange={e => setLaborData({ ...laborData, dailyWorkingHours: Number(e.target.value) })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهاتف للتواصل</label>
                    <input
                      type="text"
                      placeholder="01XXXXXXXXX"
                      value={laborData.phone || ''}
                      onChange={e => setLaborData({ ...laborData, phone: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">المدينة / المحافظة</label>
                    <input
                      type="text"
                      placeholder="القاهرة / المحلة"
                      value={laborData.city || ''}
                      onChange={e => setLaborData({ ...laborData, city: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان ومحل الإقامة</label>
                    <input
                      type="text"
                      placeholder="الشارع والحي"
                      value={laborData.address || ''}
                      onChange={e => setLaborData({ ...laborData, address: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-12">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات وسجل الكفاءة الإنتاجية</label>
                    <textarea
                      rows={2}
                      placeholder="ماكينات يجيد العمل عليها، سرعة الإنجاز، ملاحظات الجودة..."
                      value={laborData.notes || ''}
                      onChange={e => setLaborData({ ...laborData, notes: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="laborActive"
                    checked={laborData.isActive !== false}
                    onChange={e => setLaborData({ ...laborData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="laborActive" className="text-xs font-bold text-slate-800">
                    عامل على رأس العمل ونشط في جداول وأوامر التشغيل ومسيرات الأجور
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. OPERATIONAL GROUP FORM VIEW                                            */}
          {/* ========================================================================= */}
          {entityType === 'group' && (
            <div className="space-y-6">
              <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-purple-950">بيانات وتكوين مجموعة التشغيل / خط الإنتاج</h3>
                  <p className="text-xs text-purple-800">
                    تستخدم لجدولة أوامر التشغيل، توزيع الباتشات، ومتابعة كفاءة خطوط الخياطة والورش الخارجية
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اسم مجموعة التشغيل / الخط <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: خط الخياطة A - بولو شيرت وهودي"
                      value={groupData.name || ''}
                      onChange={e => setGroupData({ ...groupData, name: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">كود المجموعة</label>
                    <input
                      type="text"
                      value={groupData.code || ''}
                      onChange={e => setGroupData({ ...groupData, code: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">طبيعة المجموعة</label>
                    <select
                      value={groupData.type || 'internal'}
                      onChange={e => setGroupData({ ...groupData, type: e.target.value as any })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="internal">خط إنتاج داخلي بالمصنع</option>
                      <option value="external">ورشة خارجية / مقاول باطن</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">التخصص والعمليات الفنية</label>
                    <input
                      type="text"
                      placeholder="مثال: ماكينات سنجر وأوفر وفلات لوك وعراوي"
                      value={groupData.specialty || ''}
                      onChange={e => setGroupData({ ...groupData, specialty: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">مشرف الخط / جهة الاتصال</label>
                    <input
                      type="text"
                      placeholder="أ. هاني سليم"
                      value={groupData.contactPerson || ''}
                      onChange={e => setGroupData({ ...groupData, contactPerson: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">هاتف المشرف / الورشة</label>
                    <input
                      type="text"
                      placeholder="01XXXXXXXXX"
                      value={groupData.phone || ''}
                      onChange={e => setGroupData({ ...groupData, phone: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">القسم التابع له</label>
                    <select
                      value={groupData.departmentId || ''}
                      onChange={e => setGroupData({ ...groupData, departmentId: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="">-- بدون قسم محدد --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد الماكينات / المعدات</label>
                    <input
                      type="number"
                      value={groupData.machinesCount || 10}
                      onChange={e => setGroupData({ ...groupData, machinesCount: Number(e.target.value) })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الطاقة المعيارية (قطعة/يوم)</label>
                    <input
                      type="number"
                      placeholder="450"
                      value={groupData.dailyCapacity || ''}
                      onChange={e => setGroupData({ ...groupData, dailyCapacity: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-12">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الحساب المحاسبي المرتبط بالشجرة (GL)</label>
                    <select
                      value={groupData.linkedAccountId || '5122'}
                      onChange={e => setGroupData({ ...groupData, linkedAccountId: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="5122">[5122] أجور عمال الخياطة والتجميع</option>
                      <option value="5133">[5133] تكاليف ورش خياطة خارجية (مقاول باطن)</option>
                      <option value="5131">[5131] تكاليف تطريز وطباعة خارجية</option>
                    </select>
                  </div>

                  <div className="sm:col-span-12">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات ومواصفات الخط والتشغيل</label>
                    <textarea
                      rows={2}
                      placeholder="بيان القدرات التشغيلية والموديلات المخصصة للخط..."
                      value={groupData.notes || ''}
                      onChange={e => setGroupData({ ...groupData, notes: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="grpActive"
                    checked={groupData.isActive !== false}
                    onChange={e => setGroupData({ ...groupData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <label htmlFor="grpActive" className="text-xs font-bold text-slate-800">
                    مجموعة وخط إنتاج نشط وجاهز لاستلام وتوزيع أوامر التشغيل
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. DEPARTMENT FORM VIEW                                                   */}
          {/* ========================================================================= */}
          {entityType === 'department' && (
            <div className="space-y-6">
              <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-teal-950">بيانات وتكوين القسم / مركز التكلفة</h3>
                  <p className="text-xs text-teal-800">
                    تقسيم المصنع إلى مراكز تكلفة وأقسام تشغيلية وإدارية لتحليل الإنتاجية والمصاريف
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اسم القسم / مركز التكلفة <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: عنبر القص والتفصيل الآلي"
                      value={deptData.name || ''}
                      onChange={e => setDeptData({ ...deptData, name: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">كود القسم الداخلي</label>
                    <input
                      type="text"
                      value={deptData.code || ''}
                      onChange={e => setDeptData({ ...deptData, code: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">كود مركز التكلفة (CC)</label>
                    <input
                      type="text"
                      placeholder="CC-101"
                      value={deptData.costCenterCode || ''}
                      onChange={e => setDeptData({ ...deptData, costCenterCode: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">طبيعة ونوع القسم</label>
                    <select
                      value={deptData.type || 'production'}
                      onChange={e => setDeptData({ ...deptData, type: e.target.value as any })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="production">قسم إنتاجي وتصنيعي مباشر</option>
                      <option value="service">قسم خدمات إنتاجية وصيانة وعنابر</option>
                      <option value="sales">قسم مبيعات وتسويق ومعارض</option>
                      <option value="admin">قسم إدارة عامة وتكاليف وحسابات</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">مدير أو رئيس القسم</label>
                    <input
                      type="text"
                      placeholder="م. حسن عبد الرحمن"
                      value={deptData.managerName || ''}
                      onChange={e => setDeptData({ ...deptData, managerName: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الموقع الجغرافي داخل المصنع</label>
                    <input
                      type="text"
                      placeholder="عنبر الإنتاج الشمالي - الطابق الأول"
                      value={deptData.location || ''}
                      onChange={e => setDeptData({ ...deptData, location: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-12">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الحساب المحاسبي المرتبط للتكاليف والمصروفات (GL)</label>
                    <select
                      value={deptData.linkedAccountId || '521'}
                      onChange={e => setDeptData({ ...deptData, linkedAccountId: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="521">[521] إيجار عنابر ومباني المصنع</option>
                      <option value="522">[522] كهرباء وإنارة المصنع والورش</option>
                      <option value="523">[523] مياه ومرافق التشغيل</option>
                      <option value="524">[524] صيانة وقطع غيار ماكينات الإنتاج</option>
                      <option value="525">[525] إهلاك الآلات والمعدات وخطوط الإنتاج</option>
                      <option value="526">[526] مرتبات المشرفين ومراقبي الجودة</option>
                      <option value="527">[527] مهمات ووقود ومستهلكات الورش</option>
                    </select>
                  </div>

                  <div className="sm:col-span-12">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف واختصاصات القسم والمهام المسندة</label>
                    <textarea
                      rows={2}
                      placeholder="بيان العمليات والمهام المسندة للقسم..."
                      value={deptData.description || ''}
                      onChange={e => setDeptData({ ...deptData, description: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. CHART OF ACCOUNTS NODE FORM VIEW                                       */}
          {/* ========================================================================= */}
          {entityType === 'account' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">تأسيس حساب جديد بشجرة الحسابات والدليل المحاسبي</h3>
                  <p className="text-xs text-slate-400">
                    إنشاء حساب مالي رئيسي أو فرعي ضمن الهيكل الهرمي القياسي لمصانع وتصنيع الملابس
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-12">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      الحساب الأب (الحساب الرئيسي المتفرع منه)
                    </label>
                    <select
                      value={accountData.parentId || ''}
                      onChange={(e) => handleParentSelect(e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- بدون حساب أب (حساب رئيسي مستوى 1) --</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>
                          [{a.code}] {a.name} (مستوى {a.level || 1} - {a.nature === 'debit' ? 'مدين' : 'دائن'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      كود الحساب (رقمي فريد) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 12421"
                      value={accountData.code || ''}
                      onChange={e => setAccountData({ ...accountData, code: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-8">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اسم الحساب المحاسبي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: إنتاج تحت التشغيل - مرحلة الخياطة والتجميع"
                      value={accountData.name || ''}
                      onChange={e => setAccountData({ ...accountData, name: e.target.value })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الحساب في القوائم</label>
                    <select
                      value={accountData.type || 'asset'}
                      onChange={e => setAccountData({ ...accountData, type: e.target.value as any })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="asset">أصول (Assets)</option>
                      <option value="liability">خصوم والتزامات (Liabilities)</option>
                      <option value="equity">حقوق ملكية ورأس مال (Equity)</option>
                      <option value="revenue">إيرادات ومبيعات (Revenues)</option>
                      <option value="expense">مصروفات وتكاليف تصنيع (Expenses/Costs)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">طبيعة الحساب</label>
                    <select
                      value={accountData.nature || 'debit'}
                      onChange={e => setAccountData({ ...accountData, nature: e.target.value as any })}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    >
                      <option value="debit">مدين (Debit - يزيد بالمدين وينقص بالدائن)</option>
                      <option value="credit">دائن (Credit - يزيد بالدائن وينقص بالمدين)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">المستوى الهرمي (1-6)</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={accountData.level || 3}
                      onChange={e => setAccountData({ ...accountData, level: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-12 p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="accountIsWip"
                      checked={accountData.isWipOrManufacturing || false}
                      onChange={e => setAccountData({ ...accountData, isWipOrManufacturing: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <label htmlFor="accountIsWip" className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-amber-600" />
                      <span>حساب مرتبط بالنشاط الصناعي والتصنيع / إنتاج تحت التشغيل (WIP) أو تكاليف مباشرة</span>
                    </label>
                  </div>

                  <div className="sm:col-span-12">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الوصف والملاحظات المحاسبية</label>
                    <textarea
                      rows={2}
                      placeholder="بيان استخدام الحساب والتوجيه المحاسبي..."
                      value={accountData.description || ''}
                      onChange={e => setAccountData({ ...accountData, description: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>البيانات المدخلة يتم حفظها مركزياً وتنعكس فورياً على كافة شاشات وعمليات المصنع</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingItem ? 'تحديث وتطبيق التعديلات' : 'حفظ واعتماد البيان بالهيكل'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
