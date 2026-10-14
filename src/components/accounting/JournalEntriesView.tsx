import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Layers,
  Printer,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Scale,
  RefreshCw,
  Trash2,
  Tag,
  Eye,
  X,
  FileCheck,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { JournalEntry, JournalEntryLine, JournalEntryType } from '../../types/journal';
import { getAllJournalEntries, addManualJournalEntry, deleteManualJournalEntry } from '../../lib/journalEngine';
import { getAccounts } from '../../lib/accountingStorage';
import { AccountNode } from '../../types';
import { getPeriodDateRange } from '../../lib/periodUtils';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

interface JournalEntriesViewProps {
  onNavigateToLedger?: (accountCode?: string) => void;
  onNavigateToTrialBalance?: () => void;
  onNavigateToIncomeStatement?: () => void;
  onNavigateToBalanceSheet?: () => void;
  onNavigateToCashFlow?: () => void;
}

export function JournalEntriesView({
  onNavigateToLedger,
  onNavigateToTrialBalance,
  onNavigateToIncomeStatement,
  onNavigateToBalanceSheet,
  onNavigateToCashFlow
}: JournalEntriesViewProps) {
  const { notifySuccess, notifyError, notifyInfo } = useNotification();
  const { currentUser } = useAuth();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [periodPreset, setPeriodPreset] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const applyPeriodPreset = (preset: string) => {
    setPeriodPreset(preset);
    const range = getPeriodDateRange(preset);
    setDateFrom(range.startDate);
    setDateTo(range.endDate);
  };

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState<JournalEntry | null>(null);

  // Manual Entry Form State
  const [newEntryDate, setNewEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newEntryRef, setNewEntryRef] = useState('');
  const [newEntryDesc, setNewEntryDesc] = useState('');
  const [newEntryNotes, setNewEntryNotes] = useState('');
  const [newEntryLines, setNewEntryLines] = useState<Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: number | '';
    credit: number | '';
    description: string;
  }>>([
    { accountId: '', accountCode: '', accountName: '', debit: '', credit: '', description: '' },
    { accountId: '', accountCode: '', accountName: '', debit: '', credit: '', description: '' }
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Load entries and accounts
  const loadData = async () => {
    setLoading(true);
    try {
      const allAccs = getAccounts();
      setAccounts(allAccs);
      const allEntries = await getAllJournalEntries();
      setEntries(allEntries);
    } catch (err) {
      console.error('Error loading journal entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('journal_entries_updated', handleUpdate);
    window.addEventListener('purchases_updated', handleUpdate);
    window.addEventListener('raw_materials_updated', handleUpdate);
    window.addEventListener('gfos_storage_update', handleUpdate);

    return () => {
      window.removeEventListener('journal_entries_updated', handleUpdate);
      window.removeEventListener('purchases_updated', handleUpdate);
      window.removeEventListener('raw_materials_updated', handleUpdate);
      window.removeEventListener('gfos_storage_update', handleUpdate);
    };
  }, []);

  // Filtered and Sorted Entries
  const filteredEntries = useMemo(() => {
    let result = entries.filter((e) => {
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesNumber = e.entryNumber.toLowerCase().includes(term);
        const matchesDesc = e.description.toLowerCase().includes(term);
        const matchesRef = e.reference?.toLowerCase().includes(term);
        const matchesUser = e.createdBy.userName.toLowerCase().includes(term);
        const matchesAccount = e.lines.some(
          (l) => l.accountCode.includes(term) || l.accountName.toLowerCase().includes(term)
        );
        if (!matchesNumber && !matchesDesc && !matchesRef && !matchesUser && !matchesAccount) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'all') {
        if (selectedType === 'automated' && e.type === 'manual') return false;
        if (selectedType === 'manual' && e.type !== 'manual') return false;
        if (selectedType !== 'automated' && selectedType !== 'manual' && e.type !== selectedType) {
          return false;
        }
      }

      // Date Range filter
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
      const timeB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [entries, searchTerm, selectedType, dateFrom, dateTo, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = entries.length;
    const manualCount = entries.filter((e) => e.type === 'manual').length;
    const automatedCount = totalCount - manualCount;
    const totalDebits = entries.reduce((sum, e) => sum + e.totalDebit, 0);
    const totalCredits = entries.reduce((sum, e) => sum + e.totalCredit, 0);
    const allBalanced = entries.every((e) => e.isBalanced);

    return {
      totalCount,
      manualCount,
      automatedCount,
      totalDebits,
      totalCredits,
      allBalanced
    };
  }, [entries]);

  // Manual Form Helpers
  const handleAccountSelect = (index: number, accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;

    setNewEntryLines((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name
      };
      return next;
    });
  };

  const handleLineAmountChange = (index: number, field: 'debit' | 'credit', val: string) => {
    const num = val === '' ? '' : Math.max(0, Number(val));
    setNewEntryLines((prev) => {
      const next = [...prev];
      if (field === 'debit') {
        next[index] = { ...next[index], debit: num, credit: num !== '' && Number(num) > 0 ? '' : next[index].credit };
      } else {
        next[index] = { ...next[index], credit: num, debit: num !== '' && Number(num) > 0 ? '' : next[index].debit };
      }
      return next;
    });
  };

  const handleLineDescChange = (index: number, val: string) => {
    setNewEntryLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], description: val };
      return next;
    });
  };

  const handleAddLine = () => {
    setNewEntryLines((prev) => [
      ...prev,
      { accountId: '', accountCode: '', accountName: '', debit: '', credit: '', description: '' }
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (newEntryLines.length <= 2) {
      setFormError('يجب أن يحتوي القيد المزدوج على سطرين على الأقل');
      return;
    }
    setNewEntryLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Form balance calculations
  const formTotals = useMemo(() => {
    let deb = 0;
    let cred = 0;
    newEntryLines.forEach((l) => {
      deb += Number(l.debit) || 0;
      cred += Number(l.credit) || 0;
    });
    deb = Math.round(deb * 100) / 100;
    cred = Math.round(cred * 100) / 100;
    const diff = Math.round(Math.abs(deb - cred) * 100) / 100;
    const isBalanced = deb > 0 && cred > 0 && diff === 0;
    return { totalDebit: deb, totalCredit: cred, diff, isBalanced };
  }, [newEntryLines]);

  // Submit Manual Entry
  const handleSaveManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newEntryDesc.trim()) {
      setFormError('يرجى كتابة البيان العام للقيد اليومي');
      return;
    }

    if (!formTotals.isBalanced) {
      setFormError(`القيد غير متوازن! الفارق بين المدين والدائن: ${formTotals.diff.toLocaleString('ar-EG')} ج.م`);
      return;
    }

    const linesPayload = newEntryLines.map((l) => ({
      accountId: l.accountId,
      accountCode: l.accountCode,
      accountName: l.accountName,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      description: l.description.trim() || newEntryDesc.trim()
    }));

    const result = await addManualJournalEntry({
      date: newEntryDate,
      description: newEntryDesc.trim(),
      reference: newEntryRef.trim(),
      notes: newEntryNotes.trim(),
      lines: linesPayload
    });

    if (result.success && result.entry) {
      notifySuccess(`تم حفظ وترحيل القيد اليومي (${result.entry.entryNumber}) بنجاح`, 'القيود اليومية');
      setShowAddModal(false);
      // Reset form
      setNewEntryDesc('');
      setNewEntryRef('');
      setNewEntryNotes('');
      setNewEntryLines([
        { accountId: '', accountCode: '', accountName: '', debit: '', credit: '', description: '' },
        { accountId: '', accountCode: '', accountName: '', debit: '', credit: '', description: '' }
      ]);
      loadData();
    } else {
      setFormError(result.error || 'حدث خطأ أثناء حفظ القيد');
      notifyError(result.error || 'حدث خطأ أثناء حفظ القيد', 'فشل الحفظ');
    }
  };

  const handleDeleteManual = (id: string, number: string) => {
    if (confirm(`هل أنت متأكد من حذف القيد اليومي اليدوي رقم ${number}؟`)) {
      const res = deleteManualJournalEntry(id);
      if (res.success) {
        notifyInfo(`تم حذف القيد ${number}`, 'القيود اليومية');
        loadData();
      } else {
        notifyError(res.error || 'تعذر الحذف', 'خطأ');
      }
    }
  };

  // Badge styler for entry type
  const getTypeBadge = (type: JournalEntryType) => {
    switch (type) {
      case 'purchase':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
          label: 'مشتريات خامات (آلي)'
        };
      case 'purchase_return':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
          label: 'مرتجع مشتريات (آلي)'
        };
      case 'sales':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300',
          label: 'مبيعات منتجات تامة (آلي)'
        };
      case 'sales_return':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300',
          label: 'مردودات مبيعات (آلي)'
        };
      case 'cogs':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
          label: 'تكلفة بضاعة مباعة COGS (آلي)'
        };
      case 'production_cut':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 font-bold',
          label: 'قص وقماش فعلي وأجور (آلي)'
        };
      case 'production_prep':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 font-bold',
          label: 'تجهيز وإكسسوارات فعلية (آلي)'
        };
      case 'production_print':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 font-bold',
          label: 'طباعة وتطريز فعلي (آلي)'
        };
      case 'production_sew':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 font-bold',
          label: 'خياطة وأجور فعلية (آلي)'
        };
      case 'production_finish':
        return {
          bg: 'bg-pink-50 text-pink-800 border-pink-300 dark:bg-pink-950/60 dark:text-pink-300 font-bold',
          label: 'تشطيب ومكواة فعلي (آلي)'
        };
      case 'production_overhead':
        return {
          bg: 'bg-violet-50 text-violet-800 border-violet-300 dark:bg-violet-950/60 dark:text-violet-300 font-bold',
          label: 'تكاليف غير مباشرة MOH (آلي)'
        };
      case 'production_wip':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300',
          label: 'إنتاج تحت التشغيل WIP (آلي)'
        };
      case 'manufacturing':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
          label: 'أجور وتكاليف تصنيع (آلي)'
        };
      case 'finished_goods':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold',
          label: 'إيداع منتج تام فعلي (آلي)'
        };
      case 'inventory_adj':
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300',
          label: 'تسوية مخزنية (آلي)'
        };
      case 'treasury_receipt':
        return {
          bg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300',
          label: 'سند قبض وتحصيل (آلي)'
        };
      case 'treasury_payment':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
          label: 'سند صرف وسداد (آلي)'
        };
      case 'manual':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300',
          label: 'قيد يومية يدوي'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          label: 'قيد آلي عام'
        };
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-300">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>منظومة القيود اليومية المزدوجة</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Double-Entry Journal
                  </span>
                </h2>
                <p className="text-sm text-slate-300 mt-0.5">
                  سجل متكامل للقيود الآلية المترتبة على حركات المشتريات، المخازن، والإنتاج تحت التشغيل (WIP) مع إمكانية إضافة قيود يدوية
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قيد يومي يدوي</span>
            </button>

            {onNavigateToCashFlow && (
              <button
                onClick={() => onNavigateToCashFlow()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-teal-300" />
                <span>التدفقات النقدية</span>
              </button>
            )}

            {onNavigateToBalanceSheet && (
              <button
                onClick={() => onNavigateToBalanceSheet()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                <Scale className="w-4 h-4 text-cyan-300" />
                <span>المركز المالي</span>
              </button>
            )}

            {onNavigateToIncomeStatement && (
              <button
                onClick={() => onNavigateToIncomeStatement()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                <span>قائمة الدخل</span>
              </button>
            )}

            {onNavigateToTrialBalance && (
              <button
                onClick={() => onNavigateToTrialBalance()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>ميزان المراجعة</span>
              </button>
            )}

            {onNavigateToLedger && (
              <button
                onClick={() => onNavigateToLedger()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>دفتر الأستاذ</span>
              </button>
            )}

            <button
              onClick={loadData}
              title="تحديث البيانات"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-xs text-slate-400 font-medium">إجمالي القيود</span>
            <div className="text-xl font-black text-white mt-0.5 tabular-nums">
              {stats.totalCount} <span className="text-xs font-normal text-slate-400">قيد</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-xs text-indigo-300 font-medium">قيود آلية من النظام</span>
            <div className="text-xl font-black text-indigo-200 mt-0.5 tabular-nums">
              {stats.automatedCount} <span className="text-xs font-normal text-slate-400">حركة</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-xs text-purple-300 font-medium">قيود يدوية</span>
            <div className="text-xl font-black text-purple-200 mt-0.5 tabular-nums">
              {stats.manualCount} <span className="text-xs font-normal text-slate-400">قيد</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-xs text-emerald-300 font-medium">إجمالي المدين (EGP)</span>
            <div className="text-xl font-black text-emerald-300 mt-0.5 tabular-nums">
              {stats.totalDebits.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-xs text-emerald-300 font-medium">إجمالي الدائن (EGP)</span>
            <div className="text-xl font-black text-emerald-300 mt-0.5 tabular-nums">
              {stats.totalCredits.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col justify-center">
            <span className="text-xs text-slate-300 font-medium">حالة التوازن</span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-400 mt-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>متوازنة 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم القيد، البيان، المرجع، كود الحساب..."
              className="w-full pr-10 pl-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">كافة أنواع القيود (الكل)</option>
              <option value="automated">جميع القيود الآلية فقط</option>
              <option value="manual">القيود اليومية اليدوية فقط</option>
              <option value="purchase">مشتريات وتوريد خامات</option>
              <option value="sales">مبيعات وفواتير العملاء</option>
              <option value="sales_return">مردودات ومرتجعات المبيعات</option>
              <option value="production_wip">صرف خامات للتشغيل (WIP)</option>
              <option value="manufacturing">أجور وتكاليف تصنيع</option>
              <option value="finished_goods">إيداع منتجات تامة بالمخزن</option>
              <option value="inventory_adj">تسويات مخزنية وأرصدة افتتاحية</option>
            </select>
          </div>

          {/* Date from */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">من:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date to */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">إلى:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-slate-400 font-medium">فترات سريعة:</span>
            <button
              type="button"
              onClick={() => applyPeriodPreset('this_week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                periodPreset === 'this_week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
              }`}
            >
              <span>هذا الأسبوع (أسبوع المصنع)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('last_week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'last_week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              الأسبوع السابق
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('today')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('this_month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'this_month'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              هذا الشهر
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('this_year')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'this_year'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              العام الحالي
            </button>
            <button
              type="button"
              onClick={() => applyPeriodPreset('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                periodPreset === 'all' && !dateFrom && !dateTo
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              كافة الفترات
            </button>
          </div>
        </div>

        {/* Quick clear & sort */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div>
            عرض <span className="font-bold text-slate-800 dark:text-slate-200">{filteredEntries.length}</span> من أصل{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{entries.length}</span> قيد
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors font-medium cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>الترتيب: {sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
            </button>

            {(searchTerm || selectedType !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
              >
                إلغاء التصفية
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Journal Entries List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
            <p className="font-bold text-base">جاري تحميل وتجميع القيود اليومية المزدوجة...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300 text-lg">لا توجد قيود يومية مطابقة لخيارات البحث</p>
            <p className="text-xs text-slate-400 mt-1">جرّب تغيير كلمات البحث أو إلغاء تصفية التواريخ والأنواع</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs md:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-3.5 px-4 text-center">رقم القيد</th>
                  <th className="py-3.5 px-4">التاريخ والوقت</th>
                  <th className="py-3.5 px-4">نوع القيد</th>
                  <th className="py-3.5 px-4">المستند المرجعي</th>
                  <th className="py-3.5 px-4">البيان العام للقيد</th>
                  <th className="py-3.5 px-4">المستخدم المسؤول</th>
                  <th className="py-3.5 px-4 text-left">إجمالي المدين</th>
                  <th className="py-3.5 px-4 text-left">إجمالي الدائن</th>
                  <th className="py-3.5 px-4 text-center">التوازن</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEntries.map((entry) => {
                  const badge = getTypeBadge(entry.type);
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedEntryForDetails(entry)}
                    >
                      {/* Entry Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-center whitespace-nowrap">
                        {entry.entryNumber}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{entry.date}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{entry.time || '12:00:00'}</span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Reference Document */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {entry.reference ? (
                          <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300">
                            {entry.reference}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {entry.description}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {entry.lines.length} أطراف قيد ({entry.lines.filter(l => l.debit > 0).length} مدين / {entry.lines.filter(l => l.credit > 0).length} دائن)
                        </div>
                      </td>

                      {/* Created By User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry.createdBy.userName}</span>
                        </div>
                        {entry.createdBy.userRole && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {entry.createdBy.userRole}
                          </div>
                        )}
                      </td>

                      {/* Total Debit */}
                      <td className="py-3.5 px-4 text-left font-mono font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                        {entry.totalDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Total Credit */}
                      <td className="py-3.5 px-4 text-left font-mono font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                        {entry.totalCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Balance status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {entry.isBalanced ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>متوازن</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-bold">
                            <AlertCircle className="w-4 h-4" />
                            <span>غير متوازن</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedEntryForDetails(entry)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="عرض تفاصيل القيد كاملاً"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {entry.isManual && (
                            <button
                              onClick={() => handleDeleteManual(entry.id, entry.entryNumber)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="حذف القيد اليدوي"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: View Entry Details (سند قيد اليومية الرسمي) */}
      {/* ========================================================= */}
      {selectedEntryForDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/30">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    سند قيد اليومية رقم: <span className="font-mono text-indigo-300">{selectedEntryForDetails.entryNumber}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedEntryForDetails.typeLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة السند</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEntryForDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Summary Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">تاريخ القيد:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEntryForDetails.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">وقت التسجيل:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedEntryForDetails.time || '12:00:00'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">المستند المرجعي:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedEntryForDetails.reference || 'لا يوجد مرجع'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">المسؤول / المدخل:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedEntryForDetails.createdBy.userName}
                  </span>
                </div>
              </div>

              {/* General Statement / Description */}
              <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl p-3.5">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block mb-1">البيان العام للقيد:</span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {selectedEntryForDetails.description}
                </p>
              </div>

              {/* Lines Table */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                  <span>أطراف القيد المحاسبي المزدوج</span>
                  <span className="text-xs text-slate-400 font-normal">عدد الأسطر: {selectedEntryForDetails.lines.length}</span>
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs md:text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-12">#</th>
                        <th className="py-2.5 px-3 w-28 text-center">كود الحساب</th>
                        <th className="py-2.5 px-3">اسم الحساب في الدليل</th>
                        <th className="py-2.5 px-3 text-left w-32">مدين (Debit)</th>
                        <th className="py-2.5 px-3 text-left w-32">دائن (Credit)</th>
                        <th className="py-2.5 px-3">بيان السطر / مركز التكلفة</th>
                        {onNavigateToLedger && <th className="py-2.5 px-3 text-center w-24">دفتر الأستاذ</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedEntryForDetails.lines.map((line, idx) => (
                        <tr key={line.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {line.accountCode}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {line.accountName}
                          </td>
                          <td className="py-3 px-3 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {line.debit > 0
                              ? line.debit.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : '—'}
                          </td>
                          <td className="py-3 px-3 text-left font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                            {line.credit > 0
                              ? line.credit.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : '—'}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs">
                            {line.description || '—'}
                            {line.costCenterName && (
                              <span className="block text-[11px] text-indigo-500 font-medium mt-0.5">
                                [مركز: {line.costCenterName}]
                              </span>
                            )}
                          </td>
                          {onNavigateToLedger && (
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEntryForDetails(null);
                                  onNavigateToLedger(line.accountCode);
                                }}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                              >
                                <span>عرض</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-left font-black">
                          الإجمالي الكلي للقيد:
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-emerald-600 dark:text-emerald-400 font-black tabular-nums">
                          {selectedEntryForDetails.totalDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-rose-600 dark:text-rose-400 font-black tabular-nums">
                          {selectedEntryForDetails.totalCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td colSpan={onNavigateToLedger ? 2 : 1} className="py-3 px-3 text-center">
                          {selectedEntryForDetails.isBalanced ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>متوازن تماماً (الفارق: 0.00)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>قيد غير متوازن</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3.5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
              <div>
                طابع زمني للنظام: <span className="font-mono">{selectedEntryForDetails.createdAt}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntryForDetails(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Add New Manual Journal Entry (إضافة قيد يومي يدوي) */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-400/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">تسجيل قيد يومية يدوي جديد</h3>
                  <p className="text-xs text-slate-400">إدخال قيد مزدوج متوازن مع تحديد الحسابات المدينة والدائنة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveManualEntry} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-3.5 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-semibold">{formError}</p>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    تاريخ القيد <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newEntryDate}
                    onChange={(e) => setNewEntryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    المستند المرجعي (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newEntryRef}
                    onChange={(e) => setNewEntryRef(e.target.value)}
                    placeholder="رقم إيصال، شيك، محضر جرد..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    المستخدم المسؤول
                  </label>
                  <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300">
                    {currentUser.fullName || currentUser.username} ({currentUser.roleTitle || currentUser.role})
                  </div>
                </div>
              </div>

              {/* General Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  البيان العام للقيد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEntryDesc}
                  onChange={(e) => setNewEntryDesc(e.target.value)}
                  placeholder="مثال: إثبات سداد مصاريف صيانة ماكينات الخياطة نقداً من الخزينة الرئيسية..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              {/* Journal Entry Lines Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    أطراف القيد المحاسبي (مدين / دائن)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة طرف / سطر جديد</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs md:text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">#</th>
                        <th className="py-2.5 px-3 min-w-[200px]">الحساب المالي (من شجرة الحسابات)</th>
                        <th className="py-2.5 px-3 w-32">مدين (EGP)</th>
                        <th className="py-2.5 px-3 w-32">دائن (EGP)</th>
                        <th className="py-2.5 px-3">بيان السطر (اختياري)</th>
                        <th className="py-2.5 px-2 text-center w-12">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {newEntryLines.map((line, idx) => (
                        <tr key={idx} className="bg-white dark:bg-slate-900">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              required
                              value={line.accountId}
                              onChange={(e) => handleAccountSelect(idx, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                            >
                              <option value="">-- اختر الحساب من الدليل --</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.code} - {a.name} ({a.nature === 'debit' ? 'مدين' : 'دائن'})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.debit}
                              onChange={(e) => handleLineAmountChange(idx, 'debit', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-left focus:ring-1 focus:ring-emerald-500 outline-none text-emerald-600"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.credit}
                              onChange={(e) => handleLineAmountChange(idx, 'credit', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-left focus:ring-1 focus:ring-rose-500 outline-none text-rose-600"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => handleLineDescChange(idx, e.target.value)}
                              placeholder="شرح فرعي لهذا السطر..."
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              disabled={newEntryLines.length <= 2}
                              className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Live totals footer */}
                    <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-600">
                      <tr>
                        <td colSpan={2} className="py-3 px-3 text-left font-black">
                          الإجمالي المحسوب:
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-emerald-600 font-black tabular-nums">
                          {formTotals.totalDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-rose-600 font-black tabular-nums">
                          {formTotals.totalCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td colSpan={2} className="py-3 px-3 text-center">
                          {formTotals.isBalanced ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>القيد متوازن تماماً</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-xs">
                              <AlertCircle className="w-4 h-4" />
                              <span>غير متوازن (الفارق: {formTotals.diff.toFixed(2)} ج.م)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={newEntryNotes}
                  onChange={(e) => setNewEntryNotes(e.target.value)}
                  placeholder="أي ملاحظات تدقيق أو موافقات إدارية..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-sm cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!formTotals.isBalanced}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  حفظ وترحيل القيد اليومي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default JournalEntriesView;
