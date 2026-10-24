import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Printer,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  User,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Receipt,
  Scale,
  RefreshCw,
  PlusCircle,
  Eye,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { CustomerSupplier } from '../../types';
import { getCustomersSuppliers } from '../../lib/accountingStorage';
import { 
  getCustomerStatement, 
  CustomerStatementReport, 
  StatementMovement 
} from '../../lib/statementEngine';
import { StatementTransactionModal } from './StatementTransactionModal';
import { useTheme } from '../../contexts/ThemeContext';
import { getPrimaryBg, getPrimaryText, getRadiusClass } from '../../lib/theme';

interface CustomerAccountStatementProps {
  initialCustomerId?: string;
  onNavigateToLedger?: (accountCode?: string) => void;
  onNavigateToTreasury?: () => void;
  onNavigateToSales?: () => void;
  onNavigateToSupplierStatement?: (supplierId?: string) => void;
  onBack?: () => void;
}

export const CustomerAccountStatement: React.FC<CustomerAccountStatementProps> = ({
  initialCustomerId,
  onNavigateToLedger,
  onNavigateToTreasury,
  onNavigateToSales,
  onNavigateToSupplierStatement,
  onBack
}) => {
  const { color, radius } = useTheme();
  const primaryBg = getPrimaryBg(color);
  const primaryText = getPrimaryText(color);
  const radiusClass = getRadiusClass(radius);

  const [customers, setCustomers] = useState<CustomerSupplier[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);

  // Filters
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [movementType, setMovementType] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Report state
  const [report, setReport] = useState<CustomerStatementReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected movement for modal inspection
  const [inspectMovement, setInspectMovement] = useState<StatementMovement | null>(null);

  // Load customer list
  const loadCustomers = () => {
    const list = getCustomersSuppliers();
    const customerList = list.filter(p => p.type === 'customer' || p.type === 'both');
    setCustomers(customerList);

    if (!selectedCustomerId && customerList.length > 0) {
      setSelectedCustomerId(customerList[0].id);
    }
  };

  useEffect(() => {
    loadCustomers();

    const handleStorageUpdate = () => {
      loadCustomers();
    };

    window.addEventListener('customers_updated', handleStorageUpdate);
    window.addEventListener('sales_invoices_updated', handleStorageUpdate);
    window.addEventListener('treasury_updated', handleStorageUpdate);
    window.addEventListener('journal_entries_updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('customers_updated', handleStorageUpdate);
      window.removeEventListener('sales_invoices_updated', handleStorageUpdate);
      window.removeEventListener('treasury_updated', handleStorageUpdate);
      window.removeEventListener('journal_entries_updated', handleStorageUpdate);
    };
  }, []);

  // Sync initialCustomerId
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  // Recalculate statement
  const calculateStatement = async () => {
    if (!selectedCustomerId) {
      setReport(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getCustomerStatement(
        selectedCustomerId,
        dateFrom || undefined,
        dateTo || undefined,
        movementType
      );
      setReport(data);
    } catch (err) {
      console.error('Failed to compute customer statement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateStatement();
  }, [selectedCustomerId, dateFrom, dateTo, movementType]);

  // Selected customer object
  const currentCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Filtered customer list for search dropdown
  const filteredCustomerList = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, customerSearch]);

  // Filtered movements for table search
  const visibleMovements = useMemo(() => {
    if (!report) return [];
    if (!tableSearch.trim()) return report.movements;
    const q = tableSearch.toLowerCase();
    return report.movements.filter(
      m =>
        m.documentNumber.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.documentTypeLabel.toLowerCase().includes(q)
    );
  }, [report, tableSearch]);

  // Quick Date Presets
  const handleDatePreset = (preset: 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'all') => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 6 ? 0 : -1); // Saturday as start of week
      const startOfWeek = new Date(now.setDate(diff));
      setDateFrom(startOfWeek.toISOString().split('T')[0]);
      setDateTo(new Date().toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      setDateFrom(start.toISOString().split('T')[0]);
      setDateTo(end.toISOString().split('T')[0]);
    } else if (preset === 'this_quarter') {
      const quarterStartMonth = Math.floor(m / 3) * 3;
      const start = new Date(y, quarterStartMonth, 1);
      const end = new Date(y, quarterStartMonth + 3, 0);
      setDateFrom(start.toISOString().split('T')[0]);
      setDateTo(end.toISOString().split('T')[0]);
    } else if (preset === 'this_year') {
      setDateFrom(`${y}-01-01`);
      setDateTo(`${y}-12-31`);
    } else if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!report || !currentCustomer) return;

    const headers = ['م', 'التاريخ', 'رقم المستند', 'نوع الحركة', 'البيان', 'مدين (+)', 'دائن (-)', 'الرصيد التراكمي', 'طريقة الدفع', 'الحالة'];
    const rows = report.movements.map((m, idx) => [
      idx + 1,
      m.date,
      `"${m.documentNumber}"`,
      `"${m.documentTypeLabel}"`,
      `"${m.description.replace(/"/g, '""')}"`,
      m.debit,
      m.credit,
      m.balance,
      `"${m.paymentMethod || ''}"`,
      `"${m.status || ''}"`
    ]);

    const csvContent = [
      `"كشف حساب عميل: ${currentCustomer.name}"`,
      `"الفترة من: ${dateFrom || 'البداية'} إلى: ${dateTo || 'تاريخ اليوم'}"`,
      `"الرصيد الافتتاحي: ${report.openingBalance}"`,
      `"إجمالي المدين: ${report.totalDebit}"`,
      `"إجمالي الدائن: ${report.totalCredit}"`,
      `"الرصيد الختامي: ${report.endingBalance}"`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Customer_Statement_${currentCustomer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-16 font-sans" dir="rtl">
      {/* Top Header & Party Picker Banner */}
      <div className={`bg-white dark:bg-[#140a22] border border-slate-200 dark:border-purple-950/80 p-4 sm:p-5 ${radiusClass} shadow-xs print:hidden`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Title / Icon */}
          <div className="flex items-center gap-3.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-purple-900/60 hover:bg-slate-100 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-300 transition-colors shrink-0 shadow-2xs"
                title="رجوع"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            <div className={`w-12 h-12 rounded-xl ${primaryBg} text-amber-300 flex items-center justify-center shadow-xs shrink-0 border border-amber-500/30`}>
              <User className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  كشف حساب عميل تفصيلي
                </h1>
                <span className="px-2.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded-lg font-bold">
                  إدارة العملاء والموردين
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-purple-50 dark:bg-purple-950/60 text-[#2C1151] dark:text-amber-300 border border-purple-200 dark:border-purple-800/40 rounded-md font-bold">
                  حسابات العملاء (1221)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                استعراض ومطابقة فواتير بيع الملابس الجاهزة، مردودات المبيعات، سندات التحصيل، والرصيد التراكمي
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!report}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1f1338] dark:hover:bg-[#2c1b4d] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-purple-900/60 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="طباعة كشف حساب رسمي معتمد A4"
            >
              <Printer className="w-4 h-4 text-purple-600 dark:text-amber-400" />
              <span>طباعة كشف الحساب</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!report}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1f1338] dark:hover:bg-[#2c1b4d] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-purple-900/60 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="تصدير كملف إكسيل CSV"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>تصدير Excel/CSV</span>
            </button>

            {onNavigateToTreasury && (
              <button
                type="button"
                onClick={onNavigateToTreasury}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2C1151] hover:bg-[#3b176d] text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="تسجيل سند تحصيل / قبض جديد في الخزينة"
              >
                <PlusCircle className="w-4 h-4" />
                <span>سند قبض خزينة</span>
              </button>
            )}

            {onNavigateToLedger && (
              <button
                type="button"
                onClick={() => onNavigateToLedger('1221')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-bold transition-colors cursor-pointer"
                title="فتح الأستاذ العام لحساب العملاء"
              >
                <Scale className="w-4 h-4" />
                <span>دفتر الأستاذ (1221)</span>
              </button>
            )}
          </div>
        </div>

        {/* Customer Selector & Quick Info Strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-purple-950/70 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Customer Dropdown with Search */}
          <div className="lg:col-span-5 relative">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              اختر العميل لاستعراض كشف الحساب:
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-[#1c0f33] border border-slate-300 dark:border-purple-900/60 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer text-right shadow-2xs hover:border-purple-500 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="w-4 h-4 text-purple-600 dark:text-amber-400 shrink-0" />
                  <span className="truncate">
                    {currentCustomer ? `${currentCustomer.name} ${currentCustomer.code ? `(${currentCustomer.code})` : ''}` : 'اختر عميل...'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {showCustomerDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowCustomerDropdown(false)}
                  />
                  <div className="absolute top-full right-0 mt-1.5 w-full bg-white dark:bg-[#1a0e30] border border-slate-200 dark:border-purple-900/80 rounded-xl shadow-2xl z-40 p-2 space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ابحث بالاسم، الكود، الهاتف..."
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 bg-slate-100 dark:bg-[#120722] border border-slate-200 dark:border-purple-900/60 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                        autoFocus
                      />
                    </div>
                    {filteredCustomerList.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setShowCustomerDropdown(false);
                          setCustomerSearch('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-right transition-colors cursor-pointer ${
                          c.id === selectedCustomerId
                            ? 'bg-purple-100 dark:bg-purple-900/60 text-[#2C1151] dark:text-amber-300'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-purple-950/50'
                        }`}
                      >
                        <div className="truncate">
                          <div>{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {c.phone ? `هاتف: ${c.phone}` : ''} {c.taxId ? `· ضريبي: ${c.taxId}` : ''}
                          </div>
                        </div>
                        {c.type === 'both' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-normal">
                            عميل ومورد
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Party Summary Details */}
          {currentCustomer && (
            <div className="lg:col-span-7 flex items-center gap-3 flex-wrap text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#1c0f33] p-3 rounded-xl border border-slate-200 dark:border-purple-950/60">
              {currentCustomer.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentCustomer.phone}</span>
                </div>
              )}
              {currentCustomer.taxId && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">بطاقة ضريبية:</span>
                  <span className="font-mono">{currentCustomer.taxId}</span>
                </div>
              )}
              {currentCustomer.contactPerson && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">مسؤول الاتصال:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentCustomer.contactPerson}</span>
                </div>
              )}
              {currentCustomer.creditLimit && currentCustomer.creditLimit > 0 && (
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  <span>حد الائتمان: <strong className="font-mono">{currentCustomer.creditLimit.toLocaleString('ar-EG')}</strong> ج.م</span>
                </div>
              )}
              {currentCustomer.type === 'both' && onNavigateToSupplierStatement && (
                <button
                  type="button"
                  onClick={() => onNavigateToSupplierStatement(currentCustomer.id)}
                  className="mr-auto text-[11px] font-bold text-purple-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض كشف حساب التوريد (كمورد)</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar: Date presets, Range & Movement Type */}
      <div className={`bg-white dark:bg-[#140a22] border border-slate-200 dark:border-purple-950/80 p-4 ${radiusClass} shadow-xs print:hidden space-y-3`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>فترة الحساب:</span>
            </span>
            <button
              type="button"
              onClick={() => handleDatePreset('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                !dateFrom && !dateTo
                  ? 'bg-[#2C1151] text-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              كل الفترات
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('today')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('this_week')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              هذا الأسبوع
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('this_month')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              هذا الشهر
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('this_quarter')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              الربع الحالي
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('this_year')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              السنة الحالية
            </button>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">من:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-[#1a0e30] border border-slate-300 dark:border-purple-900/60 rounded-lg text-xs text-slate-800 dark:text-slate-200 font-mono focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">إلى:</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-[#1a0e30] border border-slate-300 dark:border-purple-900/60 rounded-lg text-xs text-slate-800 dark:text-slate-200 font-mono focus:ring-1 focus:ring-purple-500"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
              >
                مسح التواريخ
              </button>
            )}
          </div>
        </div>

        {/* Movement Type Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-purple-950/60">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setMovementType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                movementType === 'all'
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-[#2C1151] dark:text-amber-300 border border-purple-200 dark:border-purple-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-purple-950/40'
              }`}
            >
              جميع الحركات {report ? `(${report.counts.total})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setMovementType('sales_invoice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                movementType === 'sales_invoice'
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-[#2C1151] dark:text-amber-300 border border-purple-200 dark:border-purple-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-purple-950/40'
              }`}
            >
              فواتير المبيعات {report ? `(${report.counts.invoices})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setMovementType('customer_collection')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                movementType === 'customer_collection'
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-[#2C1151] dark:text-amber-300 border border-purple-200 dark:border-purple-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-purple-950/40'
              }`}
            >
              سندات التحصيل {report ? `(${report.counts.collections})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setMovementType('sales_return')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                movementType === 'sales_return'
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-[#2C1151] dark:text-amber-300 border border-purple-200 dark:border-purple-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-purple-950/40'
              }`}
            >
              مردودات المبيعات {report ? `(${report.counts.returns})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setMovementType('journal_entry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                movementType === 'journal_entry'
                  ? 'bg-purple-100 dark:bg-purple-900/60 text-[#2C1151] dark:text-amber-300 border border-purple-200 dark:border-purple-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-purple-950/40'
              }`}
            >
              قيود التسوية
            </button>
          </div>

          {/* Quick Table Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في كشف الحساب..."
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-[#1c0f33] border border-slate-200 dark:border-purple-900/60 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Opening Balance */}
          <div className={`p-4 bg-white dark:bg-[#140a22] border border-slate-200 dark:border-purple-950/70 ${radiusClass} shadow-2xs`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">رصيد أول المدة</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-purple-950/60 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {report.openingBalance.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-400">ج.م</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {report.openingBalance > 0 ? 'رصيد مرحل سابق (مدين)' : report.openingBalance < 0 ? 'رصيد دائن للعميل' : 'رصيد افتتاحي متزن (صفر)'}
            </div>
          </div>

          {/* 2. Total Debits (Sales) */}
          <div className={`p-4 bg-white dark:bg-[#140a22] border border-slate-200 dark:border-purple-950/70 ${radiusClass} shadow-2xs`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">إجمالي المبيعات (مدين +)</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-black font-mono tabular-nums text-blue-700 dark:text-blue-400">
              {report.totalDebit.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-400">ج.م</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              عدد الفواتير والقيود: {report.counts.invoices} حركة
            </div>
          </div>

          {/* 3. Total Credits (Collections & Returns) */}
          <div className={`p-4 bg-white dark:bg-[#140a22] border border-slate-200 dark:border-purple-950/70 ${radiusClass} shadow-2xs`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">إجمالي المسدد والمردودات (دائن -)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-black font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              {report.totalCredit.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-400">ج.م</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              تحصيلات: {report.counts.collections} · مردودات: {report.counts.returns}
            </div>
          </div>

          {/* 4. Net Ending Balance */}
          <div className={`p-4 bg-white dark:bg-[#140a22] border-2 ${
            report.endingBalance > 0 
              ? 'border-indigo-500/50 dark:border-amber-500/50' 
              : 'border-emerald-500/50'
          } ${radiusClass} shadow-xs`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-amber-400">الرصيد الصافي المستحق</span>
              <div className="w-8 h-8 rounded-lg bg-[#2C1151] text-amber-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className={`mt-2 text-xl font-black font-mono tabular-nums ${
              report.endingBalance > 0 
                ? 'text-[#2C1151] dark:text-amber-300' 
                : report.endingBalance < 0 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-slate-600 dark:text-slate-300'
            }`}>
              {report.endingBalance.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-400">ج.م</span>
            </div>
            <div className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-300 truncate">
              {report.balanceStatusLabel}
            </div>
          </div>
        </div>
      )}

      {/* Main Account Statement Table */}
      <div className={`bg-white dark:bg-[#140a22] border border-slate-200 dark:border-purple-950/80 ${radiusClass} shadow-xs overflow-hidden`}>
        {/* Table Title Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-purple-950/80 bg-slate-50/70 dark:bg-[#1a0e30] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-600 dark:text-amber-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              دفتر حركات كشف الحساب التفصيلي ({visibleMovements.length} حركة)
            </h3>
          </div>

          {currentCustomer && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              حساب العميل: <span className="font-bold text-slate-800 dark:text-slate-200">{currentCustomer.name}</span>
            </div>
          )}
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600 dark:text-amber-400" />
            جاري احتساب كشف الحساب ومطابقة الأرصدة...
          </div>
        ) : visibleMovements.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            لا توجد حركات مسجلة لهذا العميل خلال الفترة المحددة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-[#180b2a] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-purple-950/80 font-bold">
                <tr>
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-3 w-28">التاريخ</th>
                  <th className="py-3 px-3 w-36">رقم المستند</th>
                  <th className="py-3 px-3 w-32">نوع الحركة</th>
                  <th className="py-3 px-4">البيان والتفاصيل</th>
                  <th className="py-3 px-3 text-left w-32 text-blue-700 dark:text-blue-400">مدين (+)</th>
                  <th className="py-3 px-3 text-left w-32 text-emerald-700 dark:text-emerald-400">دائن (-)</th>
                  <th className="py-3 px-4 text-left w-36 text-indigo-700 dark:text-amber-300">الرصيد التراكمي</th>
                  <th className="py-3 px-3 w-28 text-center print:hidden">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-purple-950/60 font-medium">
                {/* Initial Balance Row */}
                {report && report.openingBalance !== 0 && (
                  <tr className="bg-slate-50/70 dark:bg-[#170a2b]/70 font-bold text-slate-600 dark:text-slate-300">
                    <td className="py-2.5 px-3 text-center text-slate-400">—</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{dateFrom || 'السابق'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">OP-BAL</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-purple-950/80 text-slate-700 dark:text-slate-300">
                        رصيد افتتاحي
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">رصيد أول المدة المنقول للحساب</td>
                    <td className="py-2.5 px-3 text-left font-mono tabular-nums text-blue-600 dark:text-blue-400">
                      {report.openingBalance > 0 ? report.openingBalance.toLocaleString('ar-EG') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      {report.openingBalance < 0 ? Math.abs(report.openingBalance).toLocaleString('ar-EG') : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono font-black tabular-nums text-[#2C1151] dark:text-amber-300">
                      {report.openingBalance.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-2.5 px-3 text-center print:hidden text-slate-400">—</td>
                  </tr>
                )}

                {/* Movements Rows */}
                {visibleMovements.map((move, index) => (
                  <tr 
                    key={move.id}
                    className="hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {move.date}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setInspectMovement(move)}
                        className="hover:text-purple-600 dark:hover:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>{move.documentNumber}</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        move.documentType === 'sales_invoice'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40'
                          : move.documentType === 'customer_collection'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                          : move.documentType === 'sales_return'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                          : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40'
                      }`}>
                        {move.documentTypeLabel}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                      <div>{move.description}</div>
                      {move.paymentMethod && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          القناة: {move.paymentMethod} {move.status ? `· الحالة: ${move.status}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono font-bold tabular-nums text-blue-700 dark:text-blue-400 whitespace-nowrap">
                      {move.debit > 0 ? `${move.debit.toLocaleString('ar-EG')}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {move.credit > 0 ? `${move.credit.toLocaleString('ar-EG')}` : '—'}
                    </td>
                    <td className={`py-2.5 px-4 text-left font-mono font-black tabular-nums whitespace-nowrap ${
                      move.balance > 0 
                        ? 'text-indigo-700 dark:text-amber-300' 
                        : move.balance < 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-slate-500'
                    }`}>
                      {move.balance.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-2.5 px-3 text-center print:hidden whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setInspectMovement(move)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-purple-900/40 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                        title="معاينة تفاصيل المستند"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Table Footer with Totals */}
              {report && (
                <tfoot className="bg-slate-100 dark:bg-[#180b2a] border-t-2 border-slate-300 dark:border-purple-900 font-black text-slate-900 dark:text-white">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 text-left">
                      الإجماليات وصافي رصيد الحساب المستحق:
                    </td>
                    <td className="py-3 px-3 text-left font-mono tabular-nums text-blue-700 dark:text-blue-400">
                      {report.totalDebit.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-3 px-3 text-left font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      {report.totalCredit.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-3 px-4 text-left font-mono text-sm tabular-nums text-[#2C1151] dark:text-amber-300">
                      {report.endingBalance.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-3 px-3 print:hidden"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Official Printable Statement Section (Formatted for A4 Print) */}
      {report && currentCustomer && (
        <div className="hidden print:block font-sans text-black p-6 bg-white space-y-4" dir="rtl">
          {/* Print Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
            <div className="text-right">
              <h2 className="text-xl font-black">مصنع GFOS للملابس الجاهزة</h2>
              <p className="text-xs text-slate-600">نظام إدارة الإنتاج والحسابات الصناعية المتكامل</p>
              <p className="text-xs text-slate-600">سجل تجاري: 449102 · بطاقة ضريبية: 991-234-881</p>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-wide border-b border-black pb-1">
                كشف حساب عميل
              </h1>
              <p className="text-xs mt-1 font-mono">
                الفترة: {dateFrom || 'من البداية'} إلى {dateTo || 'تاريخ اليوم'}
              </p>
            </div>
            <div className="text-left font-mono text-xs text-slate-600">
              <p>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
              <p>الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
            </div>
          </div>

          {/* Customer Meta */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 text-xs">
            <div>
              <p><strong>اسم العميل:</strong> {currentCustomer.name}</p>
              <p><strong>كود العميل:</strong> {currentCustomer.code || '—'}</p>
              <p><strong>العنوان:</strong> {currentCustomer.address || '—'}</p>
            </div>
            <div>
              <p><strong>الهاتف:</strong> {currentCustomer.phone || '—'}</p>
              <p><strong>البطاقة الضريبية:</strong> {currentCustomer.taxId || '—'}</p>
              <p><strong>حد الائتمان:</strong> {currentCustomer.creditLimit ? `${currentCustomer.creditLimit.toLocaleString('ar-EG')} ج.م` : 'غير محدد'}</p>
            </div>
          </div>

          {/* Statement Table for Print */}
          <table className="w-full text-right text-xs border border-slate-400">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-400 font-bold">
                <th className="p-2 border-l border-slate-400">التاريخ</th>
                <th className="p-2 border-l border-slate-400">رقم المستند</th>
                <th className="p-2 border-l border-slate-400">نوع الحركة</th>
                <th className="p-2 border-l border-slate-400">البيان</th>
                <th className="p-2 border-l border-slate-400 text-left">مدين (+)</th>
                <th className="p-2 border-l border-slate-400 text-left">دائن (-)</th>
                <th className="p-2 text-left">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {visibleMovements.map((m, idx) => (
                <tr key={idx} className="border-b border-slate-300">
                  <td className="p-2 border-l border-slate-300 font-mono">{m.date}</td>
                  <td className="p-2 border-l border-slate-300 font-mono">{m.documentNumber}</td>
                  <td className="p-2 border-l border-slate-300">{m.documentTypeLabel}</td>
                  <td className="p-2 border-l border-slate-300">{m.description}</td>
                  <td className="p-2 border-l border-slate-300 text-left font-mono">{m.debit > 0 ? m.debit.toLocaleString('ar-EG') : '—'}</td>
                  <td className="p-2 border-l border-slate-300 text-left font-mono">{m.credit > 0 ? m.credit.toLocaleString('ar-EG') : '—'}</td>
                  <td className="p-2 text-left font-mono font-bold">{m.balance.toLocaleString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-slate-100 border-t-2 border-slate-500">
                <td colSpan={4} className="p-2 border-l border-slate-400">الإجمالي:</td>
                <td className="p-2 border-l border-slate-400 text-left font-mono">{report.totalDebit.toLocaleString('ar-EG')}</td>
                <td className="p-2 border-l border-slate-400 text-left font-mono">{report.totalCredit.toLocaleString('ar-EG')}</td>
                <td className="p-2 text-left font-mono text-sm">{report.endingBalance.toLocaleString('ar-EG')} ج.م</td>
              </tr>
            </tfoot>
          </table>

          {/* Official Signatures */}
          <div className="grid grid-cols-4 gap-4 pt-12 text-center text-xs font-bold border-t border-slate-300 mt-8">
            <div>
              <p>إعداد الحسابات</p>
              <div className="mt-8 border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
            </div>
            <div>
              <p>المراجع المالي</p>
              <div className="mt-8 border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
            </div>
            <div>
              <p>اعتماد المدير المالي</p>
              <div className="mt-8 border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
            </div>
            <div>
              <p>توقيع وختم العميل بالمطابقة</p>
              <div className="mt-8 border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {inspectMovement && (
        <StatementTransactionModal
          movement={inspectMovement}
          onClose={() => setInspectMovement(null)}
        />
      )}
    </div>
  );
};
