import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AccountNode } from '../../types';
import {
  getAccounts,
  saveAccounts,
  resetAccountsToManufacturingCOA,
  getCustomersSuppliers,
  getMaterials,
  getLabor,
  getOperationalGroups,
  getDepartments
} from '../../lib/accountingStorage';
import { getAllJournalEntries } from '../../lib/journalEngine';
import { JournalEntry } from '../../types/journal';
import {
  UniversalMasterEntityModal,
  MasterEntityType
} from './UniversalMasterEntityModal';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Network,
  Factory,
  ChevronRight,
  ChevronDown,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Table as TableIcon,
  Layers,
  Sparkles,
  Info,
  SlidersHorizontal,
  X,
  Scale,
  Download,
  ShieldCheck,
  Eye,
  EyeOff,
  Activity,
  ArrowUpDown,
  BookOpen,
  Users,
  Building,
  HardHat,
  PackageSearch,
  Building2,
  Tag
} from 'lucide-react';

interface ChartOfAccountsProps {
  onNavigateToLedger?: (accountCode?: string) => void;
  onNavigateToJournal?: () => void;
}

interface AccountBalanceInfo {
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
  nature: 'debit' | 'credit' | 'zero';
}

export function ChartOfAccounts({ onNavigateToLedger, onNavigateToJournal }: ChartOfAccountsProps = {}) {
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'wip_manufacturing' | 'asset' | 'liability' | 'equity' | 'revenue' | 'manufacturing_cost' | 'expense'>('all');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [nonZeroOnly, setNonZeroOnly] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set(['1', '11', '12', '124', '1241', '1242', '2', '21', '3', '4', '41', '5', '51', '6']));
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Master Entity Modal states (الإدارة المركزية لشجرة الحسابات والهيكل المالي)
  const [masterModalType, setMasterModalType] = useState<MasterEntityType | null>(null);
  const [editingMasterItem, setEditingMasterItem] = useState<any>(null);

  // Linked sub-ledger counts map per account code
  const [linkedCounts, setLinkedCounts] = useState<{
    customers: Map<string, number>;
    suppliers: Map<string, number>;
    materials: Map<string, number>;
    labor: Map<string, number>;
    departments: Map<string, number>;
    groups: Map<string, number>;
  }>({
    customers: new Map(),
    suppliers: new Map(),
    materials: new Map(),
    labor: new Map(),
    departments: new Map(),
    groups: new Map()
  });

  const [formData, setFormData] = useState<Partial<AccountNode>>({
    code: '',
    name: '',
    type: 'asset',
    parentId: '',
    level: 2,
    nature: 'debit',
    isWipOrManufacturing: false,
    description: '',
    isActive: true
  });

  const loadData = useCallback(async () => {
    setIsLoadingBalances(true);
    const list = getAccounts();
    setAccounts(list);
    try {
      const entries = await getAllJournalEntries();
      setJournalEntries(entries);
    } catch (e) {
      console.error('Failed to load journal entries for COA balances:', e);
    }

    try {
      const custSupps = getCustomersSuppliers();
      const cMap = new Map<string, number>();
      const sMap = new Map<string, number>();
      custSupps.forEach(c => {
        const code = c.linkedAccountCode || (c.type === 'supplier' ? '2111' : '1221');
        if (c.type === 'customer' || c.type === 'both') {
          cMap.set(code, (cMap.get(code) || 0) + 1);
        }
        if (c.type === 'supplier' || c.type === 'both') {
          sMap.set(code, (sMap.get(code) || 0) + 1);
        }
      });

      const mats = getMaterials();
      const mMap = new Map<string, number>();
      mats.forEach(m => {
        const code = m.linkedAccountId || (m.type === 'fabric' ? '12411' : '12412');
        mMap.set(code, (mMap.get(code) || 0) + 1);
      });

      const labors = getLabor();
      const lMap = new Map<string, number>();
      labors.forEach(l => {
        const code = l.linkedAccountId || '5122';
        lMap.set(code, (lMap.get(code) || 0) + 1);
      });

      const depts = getDepartments();
      const dMap = new Map<string, number>();
      depts.forEach(d => {
        const code = d.linkedAccountId || '521';
        dMap.set(code, (dMap.get(code) || 0) + 1);
      });

      const grps = getOperationalGroups();
      const gMap = new Map<string, number>();
      grps.forEach(g => {
        const code = g.linkedAccountId || '5122';
        gMap.set(code, (gMap.get(code) || 0) + 1);
      });

      setLinkedCounts({
        customers: cMap,
        suppliers: sMap,
        materials: mMap,
        labor: lMap,
        departments: dMap,
        groups: gMap
      });
    } catch (e) {
      console.error('Failed to compute linked master counts:', e);
    } finally {
      setIsLoadingBalances(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('journal_entries_updated', handleUpdate);
    window.addEventListener('purchases_updated', handleUpdate);
    window.addEventListener('sales_updated', handleUpdate);
    window.addEventListener('customers_updated', handleUpdate);
    window.addEventListener('raw_materials_updated', handleUpdate);
    window.addEventListener('labor_updated', handleUpdate);
    window.addEventListener('groups_updated', handleUpdate);
    window.addEventListener('departments_updated', handleUpdate);
    window.addEventListener('accounts_updated', handleUpdate);

    return () => {
      window.removeEventListener('journal_entries_updated', handleUpdate);
      window.removeEventListener('purchases_updated', handleUpdate);
      window.removeEventListener('sales_updated', handleUpdate);
      window.removeEventListener('customers_updated', handleUpdate);
      window.removeEventListener('raw_materials_updated', handleUpdate);
      window.removeEventListener('labor_updated', handleUpdate);
      window.removeEventListener('groups_updated', handleUpdate);
      window.removeEventListener('departments_updated', handleUpdate);
      window.removeEventListener('accounts_updated', handleUpdate);
    };
  }, [loadData]);

  const openMasterModal = (type: MasterEntityType, defaultItem?: any) => {
    setEditingMasterItem(defaultItem || null);
    setMasterModalType(type);
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleResetToFactoryCOA = () => {
    if (confirm('هل ترغب في إعادة ضبط وتحديث شجرة الحسابات لتكون شجرة المصانع والتصنيع القياسية (شاملة مخزون الإنتاج تحت التشغيل WIP وتكاليف التصنيع المباشرة والآلات)؟')) {
      const standardList = resetAccountsToManufacturingCOA();
      setAccounts(standardList);
      setExpandedNodeIds(new Set(['1', '12', '124', '1242', '5', '51']));
      showToast('تم تحديث شجرة الحسابات بنجاح إلى شجرة حسابات المصانع والتصنيع المعتمدة');
    }
  };

  const toggleNode = (id: string) => {
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(accounts.map(a => a.id));
    setExpandedNodeIds(allIds);
  };

  const collapseAll = () => {
    setExpandedNodeIds(new Set());
  };

  // Build tree hierarchy map
  const { childrenMap, rootAccounts, parentIdsSet } = useMemo(() => {
    const map = new Map<string, AccountNode[]>();
    const roots: AccountNode[] = [];
    const parentSet = new Set<string>();

    accounts.forEach(acc => {
      if (!acc.parentId) {
        roots.push(acc);
      } else {
        parentSet.add(acc.parentId);
        const existing = map.get(acc.parentId) || [];
        existing.push(acc);
        map.set(acc.parentId, existing);
      }
    });

    roots.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

    map.forEach(list => {
      list.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    });

    return { childrenMap: map, rootAccounts: roots, parentIdsSet: parentSet };
  }, [accounts]);

  // Compute live account balances from journal entries (both leaf accounts and rolled-up parent totals)
  const balancesMap = useMemo(() => {
    const directDebits = new Map<string, number>();
    const directCredits = new Map<string, number>();

    // Sum debits and credits posted to each account code
    journalEntries.forEach(entry => {
      if (entry.status === 'draft') return;
      (entry.lines || []).forEach(line => {
        if (!line.accountCode) return;
        directDebits.set(line.accountCode, (directDebits.get(line.accountCode) || 0) + (Number(line.debit) || 0));
        directCredits.set(line.accountCode, (directCredits.get(line.accountCode) || 0) + (Number(line.credit) || 0));
      });
    });

    const resultMap = new Map<string, AccountBalanceInfo>();

    // For any account (whether parent or leaf), accumulate all postings whose code starts with account.code
    accounts.forEach(acc => {
      let sumDebit = 0;
      let sumCredit = 0;

      directDebits.forEach((deb, code) => {
        if (code === acc.code || code.startsWith(acc.code)) {
          sumDebit += deb;
        }
      });

      directCredits.forEach((cred, code) => {
        if (code === acc.code || code.startsWith(acc.code)) {
          sumCredit += cred;
        }
      });

      const normalDebit = acc.nature === 'debit';
      const net = normalDebit ? (sumDebit - sumCredit) : (sumCredit - sumDebit);

      let nature: 'debit' | 'credit' | 'zero' = 'zero';
      if (Math.abs(net) < 0.005) {
        nature = 'zero';
      } else if (normalDebit) {
        nature = net > 0 ? 'debit' : 'credit';
      } else {
        nature = net > 0 ? 'credit' : 'debit';
      }

      resultMap.set(acc.code, {
        totalDebit: Math.round(sumDebit * 100) / 100,
        totalCredit: Math.round(sumCredit * 100) / 100,
        netBalance: Math.round(Math.abs(net) * 100) / 100,
        nature
      });
    });

    return resultMap;
  }, [accounts, journalEntries]);

  // Handle Parent Selection in Add/Edit modal
  const handleParentSelect = (parentId: string) => {
    if (!parentId) {
      setFormData(prev => ({
        ...prev,
        parentId: '',
        level: 1,
        nature: 'debit'
      }));
      return;
    }

    const parent = accounts.find(a => a.id === parentId);
    if (!parent) return;

    const siblings = accounts.filter(a => a.parentId === parentId);
    let suggestedCode = `${parent.code}1`;
    if (siblings.length > 0) {
      const siblingNumbers = siblings
        .map(s => parseInt(s.code, 10))
        .filter(n => !isNaN(n));
      if (siblingNumbers.length > 0) {
        suggestedCode = (Math.max(...siblingNumbers) + 1).toString();
      }
    }

    const nextLevel = (parent.level || 1) + 1;
    setFormData(prev => ({
      ...prev,
      parentId,
      code: suggestedCode,
      type: parent.type,
      nature: parent.nature || (parent.type === 'asset' || parent.type === 'expense' ? 'debit' : 'credit'),
      level: nextLevel,
      isWipOrManufacturing: parent.isWipOrManufacturing || parent.code.startsWith('1242') || parent.code.startsWith('5')
    }));
  };

  const handleSave = () => {
    if (!formData.code?.trim() || !formData.name?.trim()) {
      alert('يرجى إدخال كود الحساب واسمه بشكل صحيح');
      return;
    }

    const trimmedCode = formData.code!.trim();
    // Validate duplicate code if new or editing
    const duplicate = accounts.find(a => a.code === trimmedCode && a.id !== editingId);
    if (duplicate) {
      alert(`كود الحساب [${trimmedCode}] مستخدم بالفعل لحساب: "${duplicate.name}". يرجى اختيار كود فريد.`);
      return;
    }

    let updated = [...accounts];
    if (editingId) {
      updated = updated.map(a => a.id === editingId ? { ...a, ...formData } as AccountNode : a);
      showToast('تم تحديث بيانات الحساب بنجاح');
    } else {
      const newAcc: AccountNode = {
        ...formData,
        id: `acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        code: trimmedCode,
        name: formData.name!.trim(),
        type: formData.type || 'asset',
        isActive: formData.isActive !== false,
        level: formData.level || 2,
        nature: formData.nature || 'debit'
      } as AccountNode;
      updated.push(newAcc);
      if (newAcc.parentId) {
        setExpandedNodeIds(prev => new Set(prev).add(newAcc.parentId!));
      }
      showToast('تمت إضافة الحساب الجديد بنجاح');
    }

    updated.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

    setAccounts(updated);
    saveAccounts(updated);
    setShowModal(false);
  };

  const handleEdit = (acc: AccountNode) => {
    setEditingId(acc.id);
    setFormData({
      ...acc
    });
    setShowModal(true);
  };

  const handleDelete = (acc: AccountNode) => {
    const hasChildren = accounts.some(a => a.parentId === acc.id);
    if (hasChildren) {
      alert(`لا يمكن حذف الحساب "${acc.name}" لوجود حسابات فرعية تابعة له. يرجى حذف أو نقل الحسابات الفرعية أولاً.`);
      return;
    }

    // Check if account has journal movements
    const bal = balancesMap.get(acc.code);
    if (bal && (bal.totalDebit > 0 || bal.totalCredit > 0)) {
      alert(`لا يمكن حذف الحساب "${acc.name}" لأن عليه حركات وقيود محاسبية مسجلة (مدين: ${bal.totalDebit}، دائن: ${bal.totalCredit}). يمكنك تعطيل الحساب بجعله غير نشط بدلاً من حذفه.`);
      return;
    }

    if (confirm(`هل أنت متأكد من حذف الحساب [${acc.code}] ${acc.name}؟`)) {
      const updated = accounts.filter(a => a.id !== acc.id);
      setAccounts(updated);
      saveAccounts(updated);
      showToast('تم حذف الحساب بنجاح', 'info');
    }
  };

  const openNewModal = (parentAcc?: AccountNode) => {
    setEditingId(null);
    if (parentAcc) {
      const siblings = accounts.filter(a => a.parentId === parentAcc.id);
      let suggestedCode = `${parentAcc.code}1`;
      if (siblings.length > 0) {
        const siblingNumbers = siblings
          .map(s => parseInt(s.code, 10))
          .filter(n => !isNaN(n));
        if (siblingNumbers.length > 0) {
          suggestedCode = (Math.max(...siblingNumbers) + 1).toString();
        }
      }
      setFormData({
        code: suggestedCode,
        name: '',
        type: parentAcc.type,
        parentId: parentAcc.id,
        level: (parentAcc.level || 1) + 1,
        nature: parentAcc.nature || (parentAcc.type === 'asset' || parentAcc.type === 'expense' ? 'debit' : 'credit'),
        isWipOrManufacturing: parentAcc.isWipOrManufacturing || parentAcc.code.startsWith('1242') || parentAcc.code.startsWith('5'),
        description: '',
        isActive: true
      });
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'asset',
        parentId: '',
        level: 1,
        nature: 'debit',
        isWipOrManufacturing: false,
        description: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  // Filtered accounts for display
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      // Category filter
      if (activeFilter === 'wip_manufacturing') {
        const isWip = acc.code.startsWith('1242') || acc.name.includes('تحت التشغيل');
        const isRaw = acc.code.startsWith('1241') || acc.name.includes('مخزن الأقمشة') || acc.name.includes('مخزن الإكسسوارات');
        const isMfgCost = acc.code.startsWith('5') || acc.name.includes('تكاليف الإنتاج') || acc.name.includes('تكاليف التصنيع');
        const isMfgEquip = acc.code.startsWith('112') || acc.name.includes('الآلات والمعدات');
        if (!isWip && !isRaw && !isMfgCost && !isMfgEquip && !acc.isWipOrManufacturing) {
          return false;
        }
      } else if (activeFilter === 'asset' && acc.type !== 'asset') {
        return false;
      } else if (activeFilter === 'liability' && acc.type !== 'liability') {
        return false;
      } else if (activeFilter === 'equity' && acc.type !== 'equity') {
        return false;
      } else if (activeFilter === 'revenue' && acc.type !== 'revenue') {
        return false;
      } else if (activeFilter === 'manufacturing_cost') {
        if (!acc.code.startsWith('5') && !acc.name.includes('تكاليف الإنتاج')) return false;
      } else if (activeFilter === 'expense') {
        if (acc.type !== 'expense' || acc.code.startsWith('5')) return false;
      }

      // Level filter
      if (levelFilter !== 'all' && acc.level !== levelFilter) {
        return false;
      }

      // Non-zero balance filter
      if (nonZeroOnly) {
        const bal = balancesMap.get(acc.code);
        if (!bal || bal.netBalance === 0) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesCode = acc.code.includes(q);
        const matchesDesc = acc.description?.toLowerCase().includes(q);
        return matchesName || matchesCode || matchesDesc;
      }

      return true;
    });
  }, [accounts, activeFilter, levelFilter, nonZeroOnly, balancesMap, search]);

  // Statistics
  const stats = useMemo(() => {
    const wipAccounts = accounts.filter(a => a.code.startsWith('1242') || a.name.includes('تحت التشغيل'));
    const mfgCostAccounts = accounts.filter(a => a.code.startsWith('5'));

    // Sum balances for main categories
    const getRootBalance = (rootCode: string) => {
      const bal = balancesMap.get(rootCode);
      return bal ? bal.netBalance : 0;
    };

    return {
      total: accounts.length,
      wipCount: wipAccounts.length,
      mfgCostCount: mfgCostAccounts.length,
      assets: accounts.filter(a => a.type === 'asset').length,
      liabilities: accounts.filter(a => a.type === 'liability').length,
      equity: accounts.filter(a => a.type === 'equity').length,
      revenue: accounts.filter(a => a.type === 'revenue').length,
      expenses: accounts.filter(a => a.type === 'expense').length,
      totalAssetBalance: getRootBalance('1'),
      totalLiabilityBalance: getRootBalance('2'),
      totalEquityBalance: getRootBalance('3'),
      totalRevenueBalance: getRootBalance('4'),
      totalCostBalance: getRootBalance('5'),
    };
  }, [accounts, balancesMap]);

  // Audit / Integrity Diagnostics Check
  const auditReport = useMemo(() => {
    const orphanedAccounts: AccountNode[] = [];
    const duplicateCodes: string[] = [];
    const codeCounts = new Map<string, number>();

    accounts.forEach(acc => {
      codeCounts.set(acc.code, (codeCounts.get(acc.code) || 0) + 1);
      if (acc.parentId) {
        const parent = accounts.find(a => a.id === acc.parentId);
        if (!parent) {
          orphanedAccounts.push(acc);
        }
      }
    });

    codeCounts.forEach((count, code) => {
      if (count > 1) duplicateCodes.push(code);
    });

    const isHealthy = orphanedAccounts.length === 0 && duplicateCodes.length === 0;

    return {
      isHealthy,
      orphanedAccounts,
      duplicateCodes,
      totalAccounts: accounts.length
    };
  }, [accounts]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['كود الحساب', 'اسم الحساب', 'المستوى', 'النوع', 'الطبيعة', 'التصنيف الصناعي', 'الحساب الأب', 'الرصيد الصافي (ج.م)', 'طبيعة الرصيد', 'الحالة'];
    
    const rows = accounts.map(acc => {
      const bal = balancesMap.get(acc.code);
      const isParent = parentIdsSet.has(acc.id);
      const parent = acc.parentId ? accounts.find(a => a.id === acc.parentId) : null;
      
      const typeLabel = 
        acc.type === 'asset' ? 'أصول' :
        acc.type === 'liability' ? 'خصوم' :
        acc.type === 'equity' ? 'حقوق ملكية' :
        acc.type === 'revenue' ? 'إيرادات' : 'مصروفات/تكاليف';

      const industrial = 
        acc.code.startsWith('1242') ? 'إنتاج تحت التشغيل WIP' :
        acc.code.startsWith('5') ? 'تكاليف تصنيع' :
        acc.code.startsWith('1241') ? 'مخزن خامات' :
        acc.code.startsWith('112') ? 'آلات ومعدات' : 'عام';

      return [
        `"${acc.code}"`,
        `"${acc.name}"`,
        acc.level || 1,
        `"${typeLabel}"`,
        acc.nature === 'debit' ? 'مدين' : 'دائن',
        `"${industrial}"`,
        parent ? `"[${parent.code}] ${parent.name}"` : 'رئيسي',
        bal ? bal.netBalance : 0,
        bal ? (bal.nature === 'debit' ? 'مدين' : bal.nature === 'credit' ? 'دائن' : 'صفر') : 'صفر',
        acc.isActive ? 'نشط' : 'موقوف'
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `شجرة_الحسابات_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('تم تصدير دليل الحسابات بنجاح إلى ملف CSV');
  };

  // Format Currency
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: AccountNode, depth: number = 0) => {
    const children = childrenMap.get(node.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodeIds.has(node.id);
    const isParent = parentIdsSet.has(node.id);

    const isMatching = filteredAccounts.some(a => a.id === node.id);
    const hasMatchingDescendant = (n: AccountNode): boolean => {
      const ch = childrenMap.get(n.id) || [];
      return ch.some(c => filteredAccounts.some(fa => fa.id === c.id) || hasMatchingDescendant(c));
    };

    if (search.trim() || activeFilter !== 'all' || levelFilter !== 'all' || nonZeroOnly) {
      if (!isMatching && !hasMatchingDescendant(node)) {
        return null;
      }
    }

    const isWip = node.code.startsWith('1242') || node.name.includes('تحت التشغيل');
    const isMfgCost = node.code.startsWith('5');
    const isInventory = node.code.startsWith('124');
    const balInfo = balancesMap.get(node.code);

    return (
      <div key={node.id} className="select-none">
        <div
          className={`group flex items-center justify-between py-2 px-3 rounded-xl transition-all border my-1 ${
            isWip
              ? 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 text-amber-950 font-bold'
              : isMfgCost
              ? 'bg-indigo-50/50 hover:bg-indigo-100/50 border-indigo-100 text-indigo-950'
              : depth === 0
              ? 'bg-slate-100/90 hover:bg-slate-200/90 border-slate-300 text-slate-900 font-black'
              : depth === 1
              ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 font-bold'
              : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
          }`}
          style={{ marginRight: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Expand / Collapse Toggle */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="p-1 hover:bg-slate-200 text-slate-600 rounded-md transition-colors cursor-pointer"
                title={isExpanded ? 'طي الحساب' : 'توسيع الحساب'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-indigo-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </button>
            ) : (
              <span className="w-6 h-4 inline-block" />
            )}

            {/* Code Badge */}
            <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${
              isWip
                ? 'bg-amber-200/70 text-amber-900 border-amber-300'
                : isMfgCost
                ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}>
              {node.code}
            </span>

            {/* Account Name */}
            <span className={`text-xs sm:text-sm truncate ${depth === 0 ? 'font-black text-sm' : depth === 1 ? 'font-bold' : 'font-medium'}`}>
              {node.name}
            </span>

            {/* Account Level / Type Badge */}
            {isParent ? (
              <span className="hidden sm:inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold border border-slate-300">
                تجميعي
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                حساب حركة
              </span>
            )}

            {/* Special Badges */}
            {isWip && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                <Factory className="w-3 h-3" />
                <span>WIP تشغيل</span>
              </span>
            )}

            {isMfgCost && node.level === 1 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                <span>تكاليف تصنيع</span>
              </span>
            )}

            {/* Nature Badge */}
            <span className={`hidden md:inline-flex text-[10px] px-1.5 py-0.5 rounded font-bold ${
              node.nature === 'debit' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
            }`}>
              {node.nature === 'debit' ? 'مدين' : 'دائن'}
            </span>

            {/* Linked Master Entities Badges */}
            {(() => {
              const custCount = linkedCounts.customers.get(node.code) || (node.code === '1221' ? Array.from(linkedCounts.customers.values()).reduce((a: number, b: any) => a + Number(b || 0), 0) : 0);
              const suppCount = linkedCounts.suppliers.get(node.code) || (node.code === '2111' ? Array.from(linkedCounts.suppliers.values()).reduce((a: number, b: any) => a + Number(b || 0), 0) : 0);
              const matCount = linkedCounts.materials.get(node.code);
              const laborCount = linkedCounts.labor.get(node.code);
              const deptCount = linkedCounts.departments.get(node.code);
              const grpCount = linkedCounts.groups.get(node.code);

              return (
                <div className="hidden lg:flex items-center gap-1">
                  {custCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMasterModal('customer', { linkedAccountCode: node.code });
                      }}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                      title={`${custCount} عملاء مرتبطين بهذا الحساب - اضغط للإضافة`}
                    >
                      <Users className="w-3 h-3 text-blue-600" />
                      <span>{custCount} عميل</span>
                    </button>
                  )}

                  {suppCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMasterModal('supplier', { linkedAccountCode: node.code });
                      }}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                      title={`${suppCount} موردين مرتبطين بهذا الحساب - اضغط للإضافة`}
                    >
                      <Building className="w-3 h-3 text-amber-600" />
                      <span>{suppCount} مورد</span>
                    </button>
                  )}

                  {matCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMasterModal('material', { linkedAccountId: node.code });
                      }}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                      title={`${matCount} أصناف وخامات مرتبطة بهذا المخزن - اضغط للإضافة`}
                    >
                      <PackageSearch className="w-3 h-3 text-emerald-600" />
                      <span>{matCount} خامة</span>
                    </button>
                  )}

                  {laborCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMasterModal('labor', { linkedAccountId: node.code });
                      }}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                      title={`${laborCount} عمال وفنيين مرتبطين بهذا الحساب - اضغط للإضافة`}
                    >
                      <HardHat className="w-3 h-3 text-indigo-600" />
                      <span>{laborCount} فني</span>
                    </button>
                  )}

                  {deptCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMasterModal('department', { linkedAccountId: node.code });
                      }}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
                      title={`${deptCount} أقسام ومراكز تكلفة`}
                    >
                      <Building2 className="w-3 h-3 text-teal-600" />
                      <span>{deptCount} قسم</span>
                    </button>
                  )}

                  {grpCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMasterModal('group', { linkedAccountId: node.code });
                      }}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                      title={`${grpCount} خطوط ومجموعات تشغيل`}
                    >
                      <Factory className="w-3 h-3 text-purple-600" />
                      <span>{grpCount} خط</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right Section: Balance & Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Balance Display */}
            {showBalances && balInfo && (
              <div className="text-left font-mono pl-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border inline-block ${
                  balInfo.nature === 'zero'
                    ? 'bg-slate-50 text-slate-500 border-slate-200'
                    : balInfo.nature === 'debit'
                    ? 'bg-blue-50 text-blue-800 border-blue-200 font-black'
                    : 'bg-purple-50 text-purple-800 border-purple-200 font-black'
                }`}>
                  {formatMoney(balInfo.netBalance)} ج.م
                  <span className="text-[10px] mr-1 opacity-75 font-sans">
                    {balInfo.nature === 'debit' ? 'مدين' : balInfo.nature === 'credit' ? 'دائن' : 'متزن'}
                  </span>
                </span>
              </div>
            )}

            {/* Actions on hover */}
            <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
              {/* Contextual Smart Add for Sub-Ledgers */}
              {node.code.startsWith('122') && (
                <button
                  type="button"
                  onClick={() => openMasterModal('customer', { linkedAccountCode: node.code })}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title={`إضافة عميل مبيعات جديد مرتبط بالحساب [${node.code}]`}
                >
                  <Users className="w-3.5 h-3.5" />
                </button>
              )}

              {node.code.startsWith('211') && (
                <button
                  type="button"
                  onClick={() => openMasterModal('supplier', { linkedAccountCode: node.code })}
                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                  title={`إضافة مورد خامات ومستلزمات مرتبط بالحساب [${node.code}]`}
                >
                  <Building className="w-3.5 h-3.5" />
                </button>
              )}

              {node.code.startsWith('124') && (
                <button
                  type="button"
                  onClick={() => openMasterModal('material', { linkedAccountId: node.code })}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  title={`إضافة صنف / خامة قياسية مرتبطة بهذا المخزن [${node.code}]`}
                >
                  <PackageSearch className="w-3.5 h-3.5" />
                </button>
              )}

              {node.code.startsWith('512') && (
                <button
                  type="button"
                  onClick={() => openMasterModal('labor', { linkedAccountId: node.code })}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  title={`إضافة عامل أو فني مرتبط بهذا الحساب [${node.code}]`}
                >
                  <HardHat className="w-3.5 h-3.5" />
                </button>
              )}

              {node.code.startsWith('52') && (
                <button
                  type="button"
                  onClick={() => openMasterModal('department', { linkedAccountId: node.code })}
                  className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                  title={`إضافة قسم أو مركز تكلفة مرتبط بهذا الحساب [${node.code}]`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Jump to General Ledger */}
              {onNavigateToLedger && (
                <button
                  type="button"
                  onClick={() => onNavigateToLedger(node.code)}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  title={`عرض كشف حساب [${node.code}] في دفتر الأستاذ العام`}
                >
                  <Scale className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Quick Add Sub Account */}
              <button
                type="button"
                onClick={() => openNewModal(node)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                title={`إضافة حساب فرعي تحت [${node.code}] ${node.name}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {/* Edit */}
              <button
                type="button"
                onClick={() => handleEdit(node)}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="تعديل الحساب"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => handleDelete(node)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="حذف الحساب"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Render Children if expanded */}
        {hasChildren && isExpanded && (
          <div className="pr-1 border-r border-dashed border-slate-200 mr-3">
            {children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 text-right pb-10" dir="rtl">
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
            <Network className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900">
                شجرة الحسابات ودليل التكاليف الصناعية
              </h2>
              <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                <Factory className="w-3.5 h-3.5 text-amber-700" />
                <span>مهيأة للمصانع والإنتاج</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              هيكل محاسبي معتمد للمنشآت الصناعية يشمل مخزون الإنتاج تحت التشغيل (WIP) بمراحله، ومخازن الخامات، وتكاليف التصنيع المباشرة وغير المباشرة مع الأرصدة اللحظية
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Health Check Button */}
          <button
            type="button"
            onClick={() => setShowAuditModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              auditReport.isHealthy
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 animate-pulse'
            }`}
            title="فحص وتدقيق سلامة الدليل المحاسبي"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>تدقيق الدليل</span>
            {!auditReport.isHealthy && (
              <span className="w-2 h-2 rounded-full bg-rose-600" />
            )}
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="تصدير شجرة الحسابات إلى ملف Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير CSV</span>
          </button>

          {/* Reset standard */}
          <button
            type="button"
            onClick={handleResetToFactoryCOA}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition-all cursor-pointer shadow-2xs"
            title="إعادة ضبط وتحديث دليل الحسابات إلى شجرة حسابات المصانع والتصنيع القياسية"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>شجرة المصنع القياسية</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="طباعة دليل الحسابات"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة</span>
          </button>

          {/* Add Master Entity to Structure */}
          <button
            type="button"
            onClick={() => openMasterModal('customer')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-600 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer border border-indigo-500/30"
            title="إضافة أي بيان أو طرف أساسي داخل الهيكل المالي (عميل، مورد، صنف، عامل، مجموعة، قسم، حساب)"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>إضافة بيان داخل الهيكل</span>
          </button>

          {/* Add Account */}
          <button
            type="button"
            onClick={() => openNewModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حساب جديد</span>
          </button>
        </div>
      </div>

      {/* Centralized Master Entity Management Bar (الإدارة المركزية للهيكل المالي والدليل المحاسبي) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-white">الإدارة المركزية لشجرة الحسابات وبيانات الهيكل الأساسية</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  تأسيس معتمد ERP
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                إضافة وتأسيس أي طرف أو بيان داخل الهيكل المالي مع ضبط كافة البيانات الأساسية المعتمدة لشاشات الفواتير والمخازن والإنتاج
              </p>
            </div>
          </div>

          {/* The 7 Entity Quick Add Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
            <button
              type="button"
              onClick={() => openMasterModal('customer')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="إضافة عميل مبيعات جديد وربطه بحسابات العملاء 1221"
            >
              <Users className="w-3.5 h-3.5" />
              <span>+ عميل</span>
            </button>

            <button
              type="button"
              onClick={() => openMasterModal('supplier')}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="إضافة مورد خامات ومستلزمات وربطه بحسابات الموردين 2111"
            >
              <Building className="w-3.5 h-3.5" />
              <span>+ مورد</span>
            </button>

            <button
              type="button"
              onClick={() => openMasterModal('material')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="إضافة صنف / خامة قياسية وربطها بالمخازن وتكلفة الإنتاج 1241"
            >
              <PackageSearch className="w-3.5 h-3.5" />
              <span>+ خامة / صنف</span>
            </button>

            <button
              type="button"
              onClick={() => openMasterModal('labor')}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="إضافة عامل أو فني وربطه بحسابات الأجور 512"
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>+ عامل / فني</span>
            </button>

            <button
              type="button"
              onClick={() => openMasterModal('group')}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="إضافة خط إنتاج أو مجموعة تشغيل"
            >
              <Factory className="w-3.5 h-3.5" />
              <span>+ خط / مجموعة</span>
            </button>

            <button
              type="button"
              onClick={() => openMasterModal('department')}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="إضافة قسم أو مركز تكلفة صناعي"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>+ قسم / مركز</span>
            </button>

            <button
              type="button"
              onClick={() => openMasterModal('account')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 shadow-xs cursor-pointer"
              title="إضافة حساب جديد بالدليل المحاسبي"
            >
              <Network className="w-3.5 h-3.5" />
              <span>+ حساب بالشجرة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Industrial Key Accounting Summary Cards with Live Balances */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Assets & Inventory */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1">1 - الأصول والمخزون</div>
          <div className="text-lg font-black text-slate-900 font-mono">
            {formatMoney(stats.totalAssetBalance)} <span className="text-[10px] font-sans">ج.م</span>
          </div>
          <div className="text-[10px] text-indigo-600 mt-1 font-bold">
            {stats.assets} حساب • خامات ومخازن
          </div>
        </div>

        {/* 2. WIP Work in Process (HIGHLIGHTED) */}
        <div className="bg-amber-50/80 p-3.5 rounded-xl border-2 border-amber-300 shadow-2xs">
          <div className="flex items-center gap-1 text-[11px] font-black text-amber-900 mb-1">
            <Factory className="w-3.5 h-3.5 text-amber-700" />
            <span>إنتاج تحت التشغيل (WIP)</span>
          </div>
          <div className="text-lg font-black text-amber-950 font-mono">
            {stats.wipCount} <span className="text-xs font-normal">مراحل تشغيل</span>
          </div>
          <div className="text-[10px] text-amber-800 mt-1 font-bold">
            قص • خياطة • طباعة • تشطيب
          </div>
        </div>

        {/* 3. Liabilities */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1">2 - الخصوم والالتزامات</div>
          <div className="text-lg font-black text-slate-900 font-mono">
            {formatMoney(stats.totalLiabilityBalance)} <span className="text-[10px] font-sans">ج.م</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {stats.liabilities} حساب • موردون وأجور
          </div>
        </div>

        {/* 4. Equity */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1">3 - حقوق الملكية</div>
          <div className="text-lg font-black text-slate-900 font-mono">
            {formatMoney(stats.totalEquityBalance)} <span className="text-[10px] font-sans">ج.م</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {stats.equity} حساب • رأس المال
          </div>
        </div>

        {/* 5. Revenues */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1">4 - الإيرادات والمبيعات</div>
          <div className="text-lg font-black text-emerald-800 font-mono">
            {formatMoney(stats.totalRevenueBalance)} <span className="text-[10px] font-sans">ج.م</span>
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">
            {stats.revenue} حساب • مبيعات ومصنعيات
          </div>
        </div>

        {/* 6. Manufacturing Costs */}
        <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 shadow-2xs">
          <div className="text-[11px] font-bold text-indigo-900 mb-1">5 - تكاليف التصنيع</div>
          <div className="text-lg font-black text-indigo-950 font-mono">
            {formatMoney(stats.totalCostBalance)} <span className="text-[10px] font-sans">ج.م</span>
          </div>
          <div className="text-[10px] text-indigo-700 mt-1 font-bold">
            {stats.mfgCostCount} حساب • خامات وأجور
          </div>
        </div>
      </div>

      {/* Filter and View Mode Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث بالكود (مثل 1242) أو بالاسم (مثل أقمشة، خياطة)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Level filter, Non-zero toggle, Show balances toggle, View toggle */}
          <div className="flex items-center justify-between lg:justify-end gap-2 flex-wrap">
            {/* Level filter select */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:bg-white"
            >
              <option value="all">جميع المستويات</option>
              <option value={1}>مستوى 1 (رئيسي)</option>
              <option value={2}>مستوى 2 (عام)</option>
              <option value={3}>مستوى 3 (مساعد)</option>
              <option value={4}>مستوى 4 (فرعي / تحليلي)</option>
              <option value={5}>مستوى 5 (حسابات حركة دقيقة)</option>
            </select>

            {/* Non-zero balance toggle */}
            <button
              type="button"
              onClick={() => setNonZeroOnly(!nonZeroOnly)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                nonZeroOnly
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
              }`}
              title="عرض الحسابات ذات الأرصدة والحركات فقط"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>أرصدة نشطة فقط</span>
            </button>

            {/* Show / Hide Balances toggle */}
            <button
              type="button"
              onClick={() => setShowBalances(!showBalances)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                showBalances
                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                  : 'bg-slate-200 text-slate-500 border-slate-300'
              }`}
              title="إظهار / إخفاء الأرصدة اللحظية"
            >
              {showBalances ? <Eye className="w-3.5 h-3.5 text-indigo-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              <span>{showBalances ? 'الأرصدة معروضة' : 'الأرصدة مخفية'}</span>
            </button>

            {/* Expand / Collapse in tree mode */}
            {viewMode === 'tree' && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2 py-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
                >
                  توسيع الكل
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2 py-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
                >
                  طي الكل
                </button>
              </div>
            )}

            {/* Tree vs Table Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'tree' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                <span>شجري</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                <span>جدول</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع الحسابات ({accounts.length})
          </button>

          {/* Highlighted WIP and Manufacturing Filter */}
          <button
            type="button"
            onClick={() => setActiveFilter('wip_manufacturing')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeFilter === 'wip_manufacturing'
                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>حسابات التصنيع والإنتاج تحت التشغيل (WIP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('manufacturing_cost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'manufacturing_cost'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            5 - تكاليف الإنتاج والتصنيع
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('asset')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'asset'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            1 - الأصول
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('liability')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'liability'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            2 - الخصوم
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('equity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'equity'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            3 - حقوق الملكية
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('revenue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'revenue'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            4 - الإيرادات
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'expense'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            6 - المصروفات البيعية والعمومية
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'tree' ? (
        /* Hierarchical Tree View */
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          {rootAccounts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">لا توجد حسابات مسجلة</div>
          ) : (
            <div className="space-y-1">
              {rootAccounts.map(root => renderTreeNode(root, 0))}
            </div>
          )}
        </div>
      ) : (
        /* Organized Table View */
        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-28">كود الحساب</th>
                <th className="py-3 px-4">اسم الحساب</th>
                <th className="py-3 px-3 text-center">المستوى</th>
                <th className="py-3 px-3 text-center">الرتبة</th>
                <th className="py-3 px-3 text-center">الطبيعة</th>
                <th className="py-3 px-3 text-center">النوع</th>
                <th className="py-3 px-4 text-center">التصنيف الصناعي</th>
                {showBalances && (
                  <th className="py-3 px-4 text-left font-mono">الرصيد الصافي</th>
                )}
                <th className="py-3 px-3 text-center">الحالة</th>
                <th className="py-3 px-4 text-center w-36">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAccounts.map(acc => {
                const isWip = acc.code.startsWith('1242') || acc.name.includes('تحت التشغيل');
                const isMfgCost = acc.code.startsWith('5');
                const isParent = parentIdsSet.has(acc.id);
                const bal = balancesMap.get(acc.code);

                return (
                  <tr
                    key={acc.id}
                    className={`hover:bg-indigo-50/30 transition-colors ${
                      isWip ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {/* Code */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded border text-xs ${
                        isWip
                          ? 'bg-amber-100 text-amber-900 border-amber-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {acc.code}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Network className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className={`font-bold ${isWip ? 'text-amber-950 font-black' : 'text-slate-900'}`}>
                          {acc.name}
                        </span>
                      </div>
                      {acc.description && (
                        <div className="text-[10px] text-slate-400 mt-0.5 pr-5">
                          {acc.description}
                        </div>
                      )}
                    </td>

                    {/* Level */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                        مستوى {acc.level || 1}
                      </span>
                    </td>

                    {/* Role (Parent or Leaf) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isParent ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
                          تجميعي
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          حساب حركة
                        </span>
                      )}
                    </td>

                    {/* Nature */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        acc.nature === 'debit'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {acc.nature === 'debit' ? 'مدين' : 'دائن'}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="text-slate-600 font-bold">
                        {acc.type === 'asset'
                          ? 'أصول'
                          : acc.type === 'liability'
                          ? 'خصوم'
                          : acc.type === 'equity'
                          ? 'حقوق ملكية'
                          : acc.type === 'revenue'
                          ? 'إيرادات'
                          : 'مصروفات'}
                      </span>
                    </td>

                    {/* Industrial Tag */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isWip ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Factory className="w-3 h-3 text-amber-700" />
                          <span>إنتاج تحت التشغيل (WIP)</span>
                        </span>
                      ) : isMfgCost ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <span>تكاليف تشغيل وتصنيع</span>
                        </span>
                      ) : acc.code.startsWith('1241') ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span>مخزن خامات ومستلزمات</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">عام</span>
                      )}
                    </td>

                    {/* Balance */}
                    {showBalances && (
                      <td className="py-3 px-4 text-left whitespace-nowrap font-mono font-bold">
                        {bal ? (
                          <span className={`${
                            bal.nature === 'zero'
                              ? 'text-slate-400 font-normal'
                              : bal.nature === 'debit'
                              ? 'text-blue-700'
                              : 'text-purple-700'
                          }`}>
                            {formatMoney(bal.netBalance)} ج.م
                          </span>
                        ) : '-'}
                      </td>
                    )}

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {acc.isActive ? 'نشط' : 'موقوف'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* Jump to General Ledger */}
                        {onNavigateToLedger && (
                          <button
                            type="button"
                            onClick={() => onNavigateToLedger(acc.code)}
                            className="p-1 text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="كشف حساب في دفتر الأستاذ"
                          >
                            <Scale className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openNewModal(acc)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="إضافة حساب فرعي"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(acc)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="تعديل الحساب"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(acc)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  {editingId ? 'تعديل بيانات الحساب المحاسبي' : 'إضافة حساب جديد في شجرة الحسابات'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Parent Account */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الحساب الأب (الحساب الرئيسي المتفرع منه)
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => handleParentSelect(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- بدون حساب أب (حساب رئيسي مستوى 1) --</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      [{a.code}] {a.name} (مستوى {a.level || 1})
                    </option>
                  ))}
                </select>
              </div>

              {/* Code and Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    كود الحساب (رقمي)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 12421"
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم الحساب
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: إنتاج تحت التشغيل - مرحلة الخياطة"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Type, Nature and Level */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الحساب</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="asset">أصول</option>
                    <option value="liability">خصوم</option>
                    <option value="equity">حقوق ملكية</option>
                    <option value="revenue">إيرادات</option>
                    <option value="expense">مصروفات / تكاليف</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">طبيعة الحساب</label>
                  <select
                    value={formData.nature || 'debit'}
                    onChange={e => setFormData({ ...formData, nature: e.target.value as any })}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="debit">مدين (Debit)</option>
                    <option value="credit">دائن (Credit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المستوى الهرمي</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.level || 1}
                    onChange={e => setFormData({ ...formData, level: parseInt(e.target.value, 10) || 1 })}
                    className="w-full text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Checkboxes: WIP / Manufacturing flag & Active */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isWipOrManufacturing"
                    checked={formData.isWipOrManufacturing || false}
                    onChange={e => setFormData({ ...formData, isWipOrManufacturing: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <label htmlFor="isWipOrManufacturing" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-amber-600" />
                    <span>حساب مرتبط بالنشاط الصناعي والتصنيع / إنتاج تحت التشغيل (WIP)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive !== false}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-slate-700">
                    حساب نشط ومتاح في العمليات والقيود
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الوصف والملاحظات المحاسبية (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="بيان استخدام الحساب أو المعالجة المحاسبية له..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ الحساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit & Integrity Diagnostics Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">فحص وتدقيق سلامة دليل الحسابات</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {auditReport.isHealthy ? (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 flex items-center gap-3 text-emerald-900">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-black text-sm">شجرة الحسابات سليمة ومتوازنة 100%</h4>
                    <p className="text-emerald-800 mt-1">
                      تم فحص {auditReport.totalAccounts} حساباً. لا توجد أي أكواد مكررة، ولا توجد حسابات معلقة بدون أب، والهيكل الهرمي سليم تماماً.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 space-y-3 text-rose-900">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>تم رصد بعض المشاكل الهيكلية في شجرة الحسابات</span>
                  </div>
                  {auditReport.duplicateCodes.length > 0 && (
                    <div>
                      <span className="font-bold">أكواد حسابات مكررة:</span>
                      <ul className="list-disc list-inside mt-1 font-mono">
                        {auditReport.duplicateCodes.map(c => <li key={c}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                  {auditReport.orphanedAccounts.length > 0 && (
                    <div>
                      <span className="font-bold">حسابات يتيمة (بدون حساب أب صالح):</span>
                      <ul className="list-disc list-inside mt-1">
                        {auditReport.orphanedAccounts.map(a => <li key={a.id}>[{a.code}] {a.name}</li>)}
                      </ul>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleResetToFactoryCOA();
                      setShowAuditModal(false);
                    }}
                    className="w-full mt-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
                  >
                    إصلاح واستعادة شجرة المصنع القياسية المعتمدة
                  </button>
                </div>
              )}

              <div className="space-y-2 border-t border-slate-100 pt-3 text-slate-600">
                <div className="flex justify-between items-center">
                  <span>إجمالي الحسابات المسجلة:</span>
                  <span className="font-bold font-mono">{auditReport.totalAccounts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>حسابات الإنتاج والتصنيع (WIP & Costs):</span>
                  <span className="font-bold font-mono">{stats.wipCount + stats.mfgCostCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>الحسابات الرئيسية التجميعية:</span>
                  <span className="font-bold font-mono">{parentIdsSet.size}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>حسابات الحركة الفرعية:</span>
                  <span className="font-bold font-mono">{auditReport.totalAccounts - parentIdsSet.size}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Master Entity Modal (الإدارة المركزية للهيكل والمساعدات) */}
      {masterModalType && (
        <UniversalMasterEntityModal
          initialType={masterModalType}
          editingItem={editingMasterItem}
          onClose={() => {
            setMasterModalType(null);
            setEditingMasterItem(null);
          }}
          onSuccess={(type, item) => {
            setMasterModalType(null);
            setEditingMasterItem(null);
            loadData();
            showToast(`تم حفظ واعتماد ${
              type === 'customer' ? 'بيانات العميل' :
              type === 'supplier' ? 'بيانات المورد' :
              type === 'material' ? 'الخامة والصنف' :
              type === 'labor' ? 'بيانات العامل والفني' :
              type === 'group' ? 'مجموعة التشغيل' :
              type === 'department' ? 'القسم ومركز التكلفة' : 'الحساب بالدليل'
            } بنجاح`);
          }}
        />
      )}
    </div>
  );
}
