import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from "../contexts/ThemeContext";
import { FONT_SIZE_OPTIONS } from "../lib/theme";
import {
  Settings as SettingsIcon,
  Palette,
  Type,
  AlertTriangle,
  Download,
  Database,
  Building2,
  Upload,
  FolderOpen,
  Check,
  ShieldCheck,
  Users,
  Barcode,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  X,
  Info,
  CheckCircle2,
  Lock,
  Layers,
  FileSpreadsheet,
  Trash2,
  RotateCcw,
  Receipt,
  ShoppingCart,
  Wallet,
  FileText,
  Boxes
} from "lucide-react";
import { getOrders, exportData, importData, getFactorySettings, saveFactorySettings } from '../lib/storage';
import { getAllBackups, BackupRecord, setBackupDirectoryHandle, getBackupDirectoryHandle, verifyDirectoryPermission } from '../lib/backupManager';
import { 
  getSystemDataCounts, 
  resetEntireSystem, 
  SystemDataCounts, 
  SystemResetOptions, 
  DEFAULT_RESET_OPTIONS 
} from '../lib/systemReset';
import { BarcodeSettingsSection } from './barcode/BarcodeSettingsSection';

interface SettingsProps {
  onBack?: () => void;
  onNavigateToUsers?: () => void;
}

type SectionKey = 'factory' | 'users' | 'barcode' | 'backup' | 'theme' | 'danger';

export function Settings({ onBack, onNavigateToUsers }: SettingsProps) {
  const { color, setColor, radius, setRadius, fontSize, setFontSize } = useTheme();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Selected category filter (قائمة منسدلة لاختيار نوع الإعداد)
  const [selectedCategory, setSelectedCategory] = useState<SectionKey | 'all'>('all');

  // Dropdown accordions state (كل نوع إعداد في قائمة منسدلة)
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    factory: true,
    users: false,
    barcode: false,
    backup: false,
    theme: false,
    danger: false
  });

  // Danger zone reset modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Notifications
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // System stats & comprehensive counts
  const [ordersCount, setOrdersCount] = useState(0);
  const [systemCounts, setSystemCounts] = useState<SystemDataCounts>({
    ordersCount: 0,
    salesCount: 0,
    purchasesCount: 0,
    treasuryCount: 0,
    journalCount: 0,
    adjustmentsCount: 0,
    auditCount: 0,
    customersCount: 0,
    materialsCount: 0,
    laborCount: 0,
    groupsCount: 0,
    departmentsCount: 0,
    backupsCount: 0,
    totalOperationalRecords: 0
  });

  // Reset options (Customizable in modal)
  const [resetOptions, setResetOptions] = useState<SystemResetOptions>(DEFAULT_RESET_OPTIONS);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [hasExternalFolder, setHasExternalFolder] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Factory Profile State
  const [factoryName, setFactoryName] = useState('');
  const [factoryAddress, setFactoryAddress] = useState('');
  const [factoryPhones, setFactoryPhones] = useState('');
  const [factoryLogo, setFactoryLogo] = useState<string | null>(null);

  const loadSystemStats = async () => {
    try {
      const counts = await getSystemDataCounts();
      setSystemCounts(counts);
      setOrdersCount(counts.ordersCount);
    } catch (e) {
      console.error('Failed to load system stats:', e);
    }
  };

  useEffect(() => {
    loadSystemStats();
    loadBackups();
    checkExternalFolder();

    const settings = getFactorySettings();
    if (settings) {
      setFactoryName(settings.name || '');
      setFactoryAddress(settings.address || '');
      setFactoryPhones(settings.phones || '');
      setFactoryLogo(settings.logoUrl || null);
    }

    const handleSync = () => {
      loadSystemStats();
      loadBackups();
    };

    window.addEventListener('gfos_storage_update', handleSync);
    window.addEventListener('purchases_updated', handleSync);
    window.addEventListener('purchase_returns_updated', handleSync);
    window.addEventListener('sales_invoices_updated', handleSync);
    window.addEventListener('sales_returns_updated', handleSync);
    window.addEventListener('treasury_transactions_updated', handleSync);
    window.addEventListener('journal_entries_updated', handleSync);
    window.addEventListener('raw_materials_updated', handleSync);
    window.addEventListener('approval_logged', handleSync);

    return () => {
      window.removeEventListener('gfos_storage_update', handleSync);
      window.removeEventListener('purchases_updated', handleSync);
      window.removeEventListener('purchase_returns_updated', handleSync);
      window.removeEventListener('sales_invoices_updated', handleSync);
      window.removeEventListener('sales_returns_updated', handleSync);
      window.removeEventListener('treasury_transactions_updated', handleSync);
      window.removeEventListener('journal_entries_updated', handleSync);
      window.removeEventListener('raw_materials_updated', handleSync);
      window.removeEventListener('approval_logged', handleSync);
    };
  }, []);

  // When search changes, expand matching sections
  useEffect(() => {
    if (!searchTerm.trim()) return;
    const term = searchTerm.toLowerCase();

    const matches: Record<SectionKey, boolean> = {
      factory: 'مصنع اسم هوية لوجو عنوان هاتف'.includes(term),
      users: 'مستخدمين صلاحيات أمان دخول rbac أدوار'.includes(term),
      barcode: 'باركود ملصقات حرارية طابعة مقاس تسلسل'.includes(term),
      backup: 'نسخ احتياطي مجلد ديسك قاعدة بيانات استيراد تصدير ملفات'.includes(term),
      theme: 'مظهر ألوان ستايل ثيم حواف شكل تصميم'.includes(term),
      danger: 'مسح تهيئة حذف تصفير خطر reset'.includes(term)
    };

    setOpenSections(prev => ({
      ...prev,
      ...matches
    }));
  }, [searchTerm]);

  const toggleSection = (key: SectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCategoryChange = (key: SectionKey | 'all') => {
    setSelectedCategory(key);
    if (key !== 'all') {
      setOpenSections(prev => ({
        ...prev,
        [key]: true
      }));
    }
  };

  const expandAll = () => {
    setOpenSections({
      factory: true,
      users: true,
      barcode: true,
      backup: true,
      theme: true,
      danger: true
    });
  };

  const collapseAll = () => {
    setOpenSections({
      factory: false,
      users: false,
      barcode: false,
      backup: false,
      theme: false,
      danger: false
    });
  };

  const checkExternalFolder = async () => {
    try {
      const handle = await getBackupDirectoryHandle();
      if (handle) {
        setHasExternalFolder(true);
        verifyDirectoryPermission(handle, 'readwrite').then(granted => {
          if (!granted) {
            setMessage({
              text: 'تم إعداد مجلد للنسخ الاحتياطي سابقاً، يرجى إعادة السماح بالوصول إليه من زر "تحديث الصلاحية".',
              type: 'error'
            });
          }
        });
      } else {
        setHasExternalFolder(false);
      }
    } catch {
      setHasExternalFolder(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        setMessage({
          text: 'متصفحك لا يدعم اختيار مجلد للنسخ التلقائي للديسك. يرجى استخدام متصفح جوجل كروم أو مايكروسوفت إيدج.',
          type: 'error'
        });
        return;
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await setBackupDirectoryHandle(handle);
      setHasExternalFolder(true);
      setMessage({ text: 'تم تحديد مجلد النسخ الاحتياطي التلقائي على جهازك بنجاح.', type: 'success' });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessage({ text: 'حدث خطأ أثناء تحديد المجلد.', type: 'error' });
      }
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importData(text);
      if (result.success) {
        setMessage({ text: `تم استيراد ${result.count} أمر إنتاج بنجاح وتحديث قاعدة البيانات.`, type: 'success' });
        getOrders().then(data => setOrdersCount(data.length));
        loadBackups();
      } else {
        setMessage({ text: result.error || 'فشل استيراد النسخة الاحتياطية.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.', type: 'error' });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadBackups = async () => {
    try {
      const records = await getAllBackups();
      records.sort((a, b) => b.timestamp - a.timestamp);
      setBackups(records);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      setFactoryLogo(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleSaveFactorySettings = () => {
    const success = saveFactorySettings({
      name: factoryName,
      address: factoryAddress,
      phones: factoryPhones,
      logoUrl: factoryLogo
    });
    if (success) {
      setMessage({ text: '✓ تم حفظ بيانات وهوية المصنع بنجاح.', type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage({ text: 'فشل حفظ بيانات المصنع. قد يكون حجم الشعار كبيراً جداً.', type: 'error' });
    }
  };

  const handleManualExport = async () => {
    try {
      const data = await exportData();
      downloadJSON(data, `gfos_manual_backup_${new Date().toISOString().split('T')[0]}.json`);
      setMessage({ text: '✓ تم تصدير النسخة الاحتياطية بنجاح إلى ملف JSON.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'فشل تصدير البيانات.', type: 'error' });
    }
  };

  const downloadBackup = (record: BackupRecord) => {
    downloadJSON(record.data, `gfos_auto_backup_${record.date}.json`);
  };

  const downloadJSON = (jsonString: string, filename: string) => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenResetModal = async () => {
    await loadSystemStats();
    setResetOptions({ ...DEFAULT_RESET_OPTIONS });
    setShowConfirm(true);
    setConfirmText('');
    setMessage(null);
  };

  const confirmReset = async () => {
    if (confirmText !== 'RESET' || isDeleting) return;
    setIsDeleting(true);
    setMessage(null);

    try {
      const result = await resetEntireSystem(resetOptions);
      setIsDeleting(false);

      if (result.success) {
        setShowConfirm(false);
        setConfirmText('');
        await loadSystemStats();
        await loadBackups();

        setMessage({
          text: `✓ تم تصفير وإعادة ضبط البرنامج بالكامل بنجاح بواسطة أمر RESET! تم تصفير (${result.clearedCounts.totalOperationalRecords}) حركة وسجل تشغيلي ومحاسبي وتصفير كافة الأرصدة وشجرة الحسابات إلى الصفر. جاري إعادة تحميل النظام...`,
          type: 'success'
        });

        // Instant refresh after 1.2s to guarantee a completely clean UI in-memory state
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setMessage({
          text: result.error || 'تعذر استكمال عملية تصفير النظام.',
          type: 'error'
        });
      }
    } catch (err: any) {
      setIsDeleting(false);
      setMessage({
        text: 'حدث خطأ غير متوقع أثناء تصفير النظام.',
        type: 'error'
      });
    }
  };

  const cancelReset = () => {
    setShowConfirm(false);
    setConfirmText('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Color options for Appearance settings
  const colorOptions = [
    { id: 'indigo', name: 'نيلي ملكي', bg: 'bg-indigo-600', text: 'text-indigo-600', ring: 'ring-indigo-600' },
    { id: 'blue', name: 'أزرق كلاسيك', bg: 'bg-blue-600', text: 'text-blue-600', ring: 'ring-blue-600' },
    { id: 'emerald', name: 'زمردي عصري', bg: 'bg-emerald-600', text: 'text-emerald-600', ring: 'ring-emerald-600' },
    { id: 'orange', name: 'برتقالي صناعي', bg: 'bg-orange-600', text: 'text-orange-600', ring: 'ring-orange-600' },
    { id: 'slate', name: 'رمادي احترافي', bg: 'bg-slate-700', text: 'text-slate-700', ring: 'ring-slate-700' }
  ];

  const radiusOptions = [
    { id: 'none', name: 'مستطيل حاد', class: 'rounded-none' },
    { id: 'sm', name: 'خفيف (sm)', class: 'rounded-sm' },
    { id: 'md', name: 'متوسط (md)', class: 'rounded-md' },
    { id: 'lg', name: 'عصري (lg)', class: 'rounded-xl' },
    { id: 'full', name: 'دائري (full)', class: 'rounded-full' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16" dir="rtl">
      {/* Modern Header Banner */}
      <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
              <SettingsIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-white">إعدادات وتخصيص النظام</h1>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  لوحة التحكم المركزية
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                تنظيم كامل لإعدادات وهوية المصنع، الباركود، النسخ الاحتياطي، المستخدمين والصلاحيات ومظهر التطبيق
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={expandAll}
              className="flex-1 md:flex-none px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <ChevronDown className="w-4 h-4" />
              <span>توسيع الكل</span>
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="flex-1 md:flex-none px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <ChevronUp className="w-4 h-4" />
              <span>طي الكل</span>
            </button>
          </div>
        </div>

        {/* Quick System KPI Badges Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">اسم المصنع المسجل:</span>
            <div className="text-xs font-black text-white truncate" title={factoryName || 'غير مسجل'}>
              {factoryName || 'مصنع الملابس (افتراضي)'}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">أوامر الإنتاج المسجلة:</span>
            <div className="text-xs font-black text-amber-300">
              {ordersCount.toLocaleString('ar-EG')} أمر شغل
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">النسخ الاحتياطية:</span>
            <div className="text-xs font-black text-emerald-400">
              {backups.length} نسخ بالمتصفح
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">مجلد النسخ التلقائي:</span>
            <div className="text-xs font-black flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${hasExternalFolder ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className={hasExternalFolder ? 'text-emerald-300' : 'text-slate-400'}>
                {hasExternalFolder ? 'متصل بالديسك' : 'غير محدد'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Notifications */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between shadow-xs animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="ابحث داخل قوائم الإعدادات (مثال: باركود، لوجو المصنع، نسخ احتياطي، مستخدمين، ألوان)..."
          className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Dropdown Selector & Quick Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-black text-slate-800">قائمة اختيار نوع الإعداد (عرض مخصص):</span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <select
              value={selectedCategory}
              onChange={e => handleCategoryChange(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white shadow-2xs cursor-pointer transition-colors"
            >
              <option value="all">📁 عرض كافة أنواع الإعدادات (قوائم منسدلة متعددة)</option>
              <option value="factory">🏢 بيانات وهوية المصنع والشعار (Factory Profile)</option>
              <option value="users">🛡️ منظومة المستخدمين والصلاحيات والأمان (RBAC)</option>
              <option value="barcode">🏷️ إعدادات وطباعة الباركود والملصقات الحرارية</option>
              <option value="backup">💾 النسخ الاحتياطي وحفظ الديسك وقاعدة البيانات</option>
              <option value="theme">🎨 المظهر وألوان وتصميم التطبيق (Appearance)</option>
              <option value="danger">⚠️ منطقة الخطر وتصفير النظام (Danger Zone)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange('factory')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === 'factory'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            🏢 هوية المصنع
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === 'users'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            🛡️ المستخدمين والصلاحيات
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange('barcode')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === 'barcode'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            🏷️ الباركود والملصقات
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange('backup')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === 'backup'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            💾 النسخ والديسك
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange('theme')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === 'theme'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            🎨 المظهر والألوان
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange('danger')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === 'danger'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            ⚠️ منطقة الخطر
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. قائمة منسدلة: بيانات وهوية المصنع                                      */}
      {/* ========================================================================= */}
      {(selectedCategory === 'all' || selectedCategory === 'factory') && (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('factory')}
          className="w-full p-5 flex items-center justify-between text-right hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900">بيانات وهوية المصنع والعلامة التجارية</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {factoryName ? 'بيانات مكتملة' : 'قيد الإعداد'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                تظهر هذه البيانات على ترويسة أوامر الشغل، تقارير التشغيل، الملصقات وفواتير البيع
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {factoryLogo && (
              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                <img src={factoryLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <div className={`p-1.5 rounded-xl bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.factory ? 'rotate-180 bg-indigo-100 text-indigo-800' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {openSections.factory && (
          <div className="p-6 border-t border-slate-100 space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المصنع / المنشأة</label>
                <input
                  type="text"
                  value={factoryName}
                  onChange={e => setFactoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: مصنع الأمل للملابس الجاهزة والتصدير"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">أرقام التواصل والفاكس</label>
                <input
                  type="text"
                  value={factoryPhones}
                  onChange={e => setFactoryPhones(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: 01000000000 - 0222222222"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان المصنع والمنطقة الصناعية</label>
                <input
                  type="text"
                  value={factoryAddress}
                  onChange={e => setFactoryAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثال: المنطقة الصناعية الأولى، قطعة 15، العاشر من رمضان / القاهرة"
                />
              </div>

              <div className="md:col-span-2 p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-black text-slate-800">شعار المصنع (اللوجو الرسمي)</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {factoryLogo ? (
                    <div className="w-24 h-24 bg-white border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center p-2 shadow-2xs shrink-0">
                      <img src={factoryLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-white border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-2 text-center shrink-0">
                      <Building2 className="w-6 h-6 mb-1 text-slate-300" />
                      <span className="text-[10px]">لا يوجد شعار</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-center sm:text-right">
                    <input
                      type="file"
                      accept="image/*"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <span>اختيار صورة الشعار</span>
                      </button>

                      {factoryLogo && (
                        <button
                          type="button"
                          onClick={() => setFactoryLogo(null)}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        >
                          إزالة الشعار
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      يفضل استخدام صورة مربعة (PNG أو JPEG) بخلفية شفافة وحجم أقل من 1 ميجابايت.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveFactorySettings}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ بيانات وهوية المصنع</span>
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ========================================================================= */}
      {/* 2. قائمة منسدلة: منظومة المستخدمين والصلاحيات (RBAC)                     */}
      {/* ========================================================================= */}
      {(selectedCategory === 'all' || selectedCategory === 'users') && (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('users')}
          className="w-full p-5 flex items-center justify-between text-right hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900">منظومة المستخدمين والصلاحيات والأدوار (RBAC)</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                  أمان وصلاحيات متقدمة
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                إدارة حسابات العاملين، كلمات المرور، صلاحيات الإدارات ومراحل التشغيل والاعتمادات
              </p>
            </div>
          </div>

          <div className={`p-1.5 rounded-xl bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.users ? 'rotate-180 bg-purple-100 text-purple-800' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {openSections.users && (
          <div className="p-6 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
            <div className="p-5 rounded-2xl bg-gradient-to-l from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black text-purple-200">التحكم في وصول المستخدمين</span>
                </div>
                <h4 className="text-sm font-bold text-white">إدارة الحسابات وتخصيص صلاحيات العمليات والمخازن</h4>
                <p className="text-xs text-slate-300 max-w-lg">
                  يمكنك إضافة مستخدمين جدد، تعيين الأدوار (مدير مصنع، مسؤول قص، مشرف خياطة، أمين مخزن، محاسب)، وتحديد الشاشات المسموح بالوصول إليها.
                </p>
              </div>

              {onNavigateToUsers && (
                <button
                  type="button"
                  onClick={onNavigateToUsers}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Users className="w-4 h-4" />
                  <span>فتح شاشة إدارة المستخدمين</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-0.5">صلاحيات المراحل</div>
                <div className="text-[11px] text-slate-500">حصر صلاحية اعتماد الباتشات والتسليم لكل قسم</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-0.5">المخازن والمبيعات</div>
                <div className="text-[11px] text-slate-500">صلاحيات الجرد وإصدار فواتير البيع والمردودات</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-0.5">الحسابات والمالية</div>
                <div className="text-[11px] text-slate-500">حماية القيود اليومية والحسابات الختامية للشركة</div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ========================================================================= */}
      {/* 3. قائمة منسدلة: إعدادات الباركود والملصقات الحرارية                     */}
      {/* ========================================================================= */}
      {(selectedCategory === 'all' || selectedCategory === 'barcode') && (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('barcode')}
          className="w-full p-5 flex items-center justify-between text-right hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900">إعدادات الباركود وطباعة الملصقات الحرارية</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  توليد تسلسلي وقارئ الباركود
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                تخصيص بادئة الكود، مقاس الاستيكر الحراري، وإعدادات ربط الباركود بمراحل التشغيل والبيع
              </p>
            </div>
          </div>

          <div className={`p-1.5 rounded-xl bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.barcode ? 'rotate-180 bg-blue-100 text-blue-800' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {openSections.barcode && (
          <div className="p-6 border-t border-slate-100 animate-in fade-in duration-150">
            <BarcodeSettingsSection />
          </div>
        )}
      </div>
      )}

      {/* ========================================================================= */}
      {/* 4. قائمة منسدلة: النسخ الاحتياطي وقاعدة البيانات                         */}
      {/* ========================================================================= */}
      {(selectedCategory === 'all' || selectedCategory === 'backup') && (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('backup')}
          className="w-full p-5 flex items-center justify-between text-right hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900">النسخ الاحتياطي التلقائي ومجلد الديسك</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {backups.length} نسخة متوفرة
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                حفظ نسخ احتياطية دورية، الربط المباشر مع مجلد بالكمبيوتر، واستيراد وتصدير قواعد البيانات
              </p>
            </div>
          </div>

          <div className={`p-1.5 rounded-xl bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.backup ? 'rotate-180 bg-emerald-100 text-emerald-800' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {openSections.backup && (
          <div className="p-6 border-t border-slate-100 space-y-6 animate-in fade-in duration-150">
            {/* Auto-Folder Sync Card */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-black text-emerald-900">مجلد الحفظ التلقائي على جهازك (Local Disk)</span>
                </div>
                <p className="text-xs text-slate-600 max-w-xl">
                  حدد مجلداً على جهاز الكمبيوتر لحفظ نسخة يومية تلقائياً بصيغة JSON دون تدخل يدوي (يعمل على متصفحات كروم وإيدج).
                </p>
                <div className="text-[11px] font-bold text-slate-500">
                  الحالة الحالية: {hasExternalFolder ? '✓ متصل بمجلد محلي بنجاح' : 'لم يتم تحديد مجلد بعد'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSelectFolder}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center gap-2 shadow-2xs whitespace-nowrap cursor-pointer ${
                  hasExternalFolder
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>{hasExternalFolder ? 'تحديث صلاحية المجلد / تغييره' : 'اختيار مجلد للنسخ التلقائي'}</span>
              </button>
            </div>

            {/* Manual Actions Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <h4 className="text-xs font-black text-slate-900">إجراءات النسخ اليدوي والاستيراد</h4>
                <p className="text-[11px] text-slate-500">تنزيل ملف النسخة الاحتياطية الحالية أو استرجاع بيانات سابقة</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImportBackup}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>استيراد نسخة سابقة</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualExport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير نسخة فورية للديسك</span>
                </button>
              </div>
            </div>

            {/* Backups Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">
                  سجل النسخ الاحتياطية المحفوظة بالمتصفح (آخر 30 يوماً):
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  إجمالي {backups.length} نسخة
                </span>
              </div>

              {backups.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <span>لا توجد نسخ احتياطية مسجلة بعد. سيتم أخذ أول نسخة تلقائياً، أو يمكنك الضغط على «تصدير نسخة فورية».</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">التاريخ</th>
                        <th className="py-2.5 px-4">وقت الحفظ</th>
                        <th className="py-2.5 px-4">حجم الملف</th>
                        <th className="py-2.5 px-4 text-center">إجراء التحميل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {backups.map(record => {
                        const d = new Date(record.timestamp);
                        return (
                          <tr key={record.date} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900" dir="ltr">
                              {record.date}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              {d.toLocaleTimeString('ar-EG')}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 font-mono" dir="ltr">
                              {formatSize(record.size)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => downloadBackup(record)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>تحميل للكمبيوتر</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* ========================================================================= */}
      {/* 5. قائمة منسدلة: مظهر وسمة النظام والتخصيص                                */}
      {/* ========================================================================= */}
      {(selectedCategory === 'all' || selectedCategory === 'theme') && (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('theme')}
          className="w-full p-5 flex items-center justify-between text-right hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900">مظهر وسمة النظام والتخصيص البصري</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  ألوان وتصميم الواجهة
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                تغيير لون النظام الأساسي، درجة استدارة الحواف، ومعاينة بطاقات الواجهة
              </p>
            </div>
          </div>

          <div className={`p-1.5 rounded-xl bg-slate-100 text-slate-600 transition-transform duration-200 ${openSections.theme ? 'rotate-180 bg-amber-100 text-amber-800' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {openSections.theme && (
          <div className="p-6 border-t border-slate-100 space-y-6 animate-in fade-in duration-150">
            {/* Color Palette Choices */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-800">
                اختر لون السمة الرئيسي للنظام (Primary Accent Color):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {colorOptions.map(c => {
                  const isSelected = color === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id as any)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center text-white shadow-2xs`}>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Corner Radius Choices */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-black text-slate-800">
                درجة استدارة حواف البطاقات والأزرار (Border Radius):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {radiusOptions.map(r => {
                  const isSelected = radius === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRadius(r.id as any)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-10 h-8 bg-slate-200 border-2 border-slate-400 ${r.class} flex items-center justify-center`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-700 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5-Level Font Size / Screen Scale Choices */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-indigo-600" />
                  <span>حجم الخط ومقياس عرض الشاشة عموماً (5 مستويات):</span>
                </label>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {FONT_SIZE_OPTIONS.find(o => o.id === fontSize)?.label || 'قياسي (100%)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                يتحكم في تكبير أو تصغير حجم الخطوط وكثافة عرض الشاشات والجداول لزيادة مساحة العمل المتاحة أو تحسين القراءة
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {FONT_SIZE_OPTIONS.map(opt => {
                  const isSelected = fontSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFontSize(opt.id)}
                      className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-2.5 cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="h-10 flex items-center justify-center w-full bg-slate-50 rounded-xl border border-slate-100">
                        <span 
                          className="font-black text-slate-900 leading-none"
                          style={{ fontSize: `${opt.scalePercent}%` }}
                        >
                          خط {opt.shortLabel}
                        </span>
                      </div>
                      <div className="w-full text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1 leading-tight">{opt.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-black text-slate-600 block">معاينة مباشرة لمظهر الأزرار والبطاقات:</span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-2xs"
                >
                  زر رئيسي
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                >
                  زر ثانوي
                </button>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                  شارة حالة معتمدة
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                  شارة مبيعات
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ========================================================================= */}
      {/* 6. قائمة منسدلة: منطقة الخطر وإعادة تهيئة وتصفير النظام الشامل (RESET)    */}
      {/* ========================================================================= */}
      {(selectedCategory === 'all' || selectedCategory === 'danger') && (
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('danger')}
          className="w-full p-5 flex items-center justify-between text-right hover:bg-red-50/40 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-red-700">إعادة ضبط وتصفير شامل للنظام (أمر RESET)</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                  تصفير البرنامج بالكامل
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                تصفير كافة أوامر التشغيل، فواتير المبيعات، المشتريات، الخزينة، المخازن، والقيود للبدء على بياض
              </p>
            </div>
          </div>

          <div className={`p-1.5 rounded-xl bg-red-50 text-red-700 transition-transform duration-200 ${openSections.danger ? 'rotate-180 bg-red-100' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {openSections.danger && (
          <div className="p-6 border-t border-red-100 bg-red-50/20 space-y-6 animate-in fade-in duration-150">
            {/* Warning Callout Box */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-red-900">
                  تصفير حركات البرنامج كاملة وتصفير كافة الحسابات والمخازن
                </h4>
                <p className="text-xs text-red-800 leading-relaxed">
                  يُمكّنك هذا الإجراء من تفريغ النظام وتصفير كافة الحركات التجريبية السابقة (أوامر تشغيل، فواتير مبيعات، فواتير مشتريات، سندات الخزينة، تسويات المخازن، وقيود اليومية) والبدء من الصفر بدورة تصنيع ومحاسبة حقيقية ونظيفة تماماً.
                </p>
              </div>
            </div>

            {/* Live Data Snapshot Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>سجل البيانات والحركات المسجلة حالياً في النظام:</span>
                <span className="text-red-700 font-mono font-black">
                  إجمالي {systemCounts.totalOperationalRecords} حركة وسجل
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">أوامر الإنتاج والتشغيل</span>
                  <span className="text-base font-black text-slate-900">{systemCounts.ordersCount}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">فواتير ومردودات المبيعات</span>
                  <span className="text-base font-black text-slate-900">{systemCounts.salesCount}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">فواتير ومردودات المشتريات</span>
                  <span className="text-base font-black text-slate-900">{systemCounts.purchasesCount}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">سندات وحركات الخزينة</span>
                  <span className="text-base font-black text-slate-900">{systemCounts.treasuryCount}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">قيود اليومية المحاسبية</span>
                  <span className="text-base font-black text-slate-900">{systemCounts.journalCount}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">تسويات مخزون الخامات</span>
                  <span className="text-base font-black text-slate-900">{systemCounts.adjustmentsCount}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">سجلات الاعتماد والتدقيق</span>
                  <span className="text-base font-black text-slate-900">{systemCounts.auditCount}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">النسخ الاحتياطية</span>
                  <span className="text-base font-black text-slate-900">{systemCounts.backupsCount}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-white rounded-2xl border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-red-800">
                  بدء إجراء التصفير الكامل وإعادة الضبط
                </h4>
                <p className="text-xs text-slate-600 max-w-xl">
                  اضغط على الزر التالي لفتح نافذة تأكيد التصفير وكتابة أمر <code className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono font-bold">RESET</code>. يُنصح بأخذ نسخة احتياطية أولاً قبل المتابعة.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleManualExport}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="تصدير نسخة احتياطية كاملة إلى ملف JSON"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>تصدير نسخة احتياطية أولاً</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl font-black text-xs bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2 shadow-2xs whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>تصفير وإعادة تهيئة البرنامج (RESET)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Confirmation Modal for Complete System Reset */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 max-h-[92vh] flex flex-col">
            <div className="p-6 overflow-y-auto space-y-5 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto border border-red-200 text-red-600 shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 mb-1">
                  تأكيد تصفير وإعادة ضبط البرنامج بالكامل
                </h3>
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full inline-block">
                  أمر التصفير الشامل: RESET
                </span>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed text-right bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                سيؤدي هذا الإجراء إلى <strong>تصفير كافة الحركات والبيانات في النظام بالكامل</strong> وتصفير جميع الأرصدة إلى صفر (إجمالي <strong>{systemCounts.totalOperationalRecords}</strong> حركة وسجل تشغيلي ومحاسبي). لا يمكن التراجع عن هذا الإجراء إلا باسترجاع نسخة احتياطية سابقة.
              </p>

              {/* Quick Backup Export Action */}
              <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl text-right">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-900">
                    لحماية بياناتك، ننصح بتحميل نسخة احتياطية الآن:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleManualExport}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  تحميل نسخة JSON
                </button>
              </div>

              {/* Reset Scope Customization Options */}
              <div className="text-right space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <span className="font-black text-slate-800 block mb-1">نطاق التصفير وإعادة التهيئة:</span>

                <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-800 font-bold">
                  <input
                    type="checkbox"
                    checked={resetOptions.resetOrders && resetOptions.resetSales && resetOptions.resetPurchases && resetOptions.resetTreasury}
                    disabled
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-not-allowed"
                  />
                  <span>تصفير كافة الحركات التشغيلية والمالية (أوامر الإنتاج، المبيعات، المشتريات، الخزينة، المخازن، والقيود)</span>
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black mr-auto">إلزامي</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700 font-medium hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={!!resetOptions.resetChartOfAccounts}
                    onChange={e => setResetOptions(prev => ({ ...prev, resetChartOfAccounts: e.target.checked }))}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                  />
                  <span>إعادة تهيئة شجرة الحسابات المحاسبية إلى الدليل الصناعي الافتراضي النظيف</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700 font-medium hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={!!resetOptions.resetMasterData}
                    onChange={e => setResetOptions(prev => ({ ...prev, resetMasterData: e.target.checked }))}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                  />
                  <span>تصفير وحذف سجلات العملاء والموردين والخامات وقوائم العمال والمجموعات الأساسية</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700 font-medium hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={!!resetOptions.resetBackups}
                    onChange={e => setResetOptions(prev => ({ ...prev, resetBackups: e.target.checked }))}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                  />
                  <span>حذف سجل النسخ الاحتياطية المؤقتة المحفوظة بالمتصفح ({systemCounts.backupsCount} نسخة)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700 font-medium hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={!!resetOptions.resetFactorySettings}
                    onChange={e => setResetOptions(prev => ({ ...prev, resetFactorySettings: e.target.checked }))}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                  />
                  <span>إعادة ضبط إعدادات المصنع والتهيئة المالية وقوالب الباركود إلى الوضع الافتراضي</span>
                </label>
              </div>

              {/* Confirmation Input Box */}
              <div className="text-right bg-red-50/50 p-4 rounded-2xl border border-red-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  لتأكيد تصفير البرنامج بالكامل، يرجى كتابة الكلمة التالية <span className="font-mono font-black text-red-700 bg-red-100 px-2 py-0.5 rounded">RESET</span> في المربع:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="RESET"
                  className="w-full border border-red-300 rounded-xl px-4 py-2.5 text-center text-base tracking-widest font-mono font-black text-red-800 bg-white focus:ring-2 focus:ring-red-500 uppercase shadow-inner"
                  dir="ltr"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={cancelReset}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="button"
                  onClick={confirmReset}
                  disabled={confirmText !== 'RESET' || isDeleting}
                  className={`flex-1 px-4 py-3 rounded-xl font-black text-xs text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                    confirmText !== 'RESET' || isDeleting
                      ? 'bg-red-300 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 shadow-md ring-2 ring-red-500/30'
                  }`}
                >
                  <RotateCcw className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
                  <span>{isDeleting ? 'جاري تصفير النظام كاملاً...' : 'تأكيد التصفير الشامل (RESET)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
