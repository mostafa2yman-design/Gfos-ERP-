import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Users, 
  PackageSearch, 
  HardHat, 
  Building2,
  Settings2,
  ArrowLeft,
  ArrowRight,
  Package,
  BookOpen,
  Scale,
  Factory,
  SlidersHorizontal,
  Coins
} from 'lucide-react';
import { ChartOfAccounts } from './ChartOfAccounts';
import { FinancialConfigView } from './FinancialConfigView';
import { CustomersSuppliersList } from './CustomersSuppliersList';
import { MaterialsList } from './MaterialsList';
import { LaborList } from './LaborList';
import { OperationalGroupsList } from './OperationalGroupsList';
import { DepartmentsList } from './DepartmentsList';

export type AccountingTab = 
  | 'financial_config' 
  | 'accounts' 
  | 'customers' 
  | 'materials' 
  | 'labor' 
  | 'departments' 
  | 'groups';

interface ConfigurationDashboardProps {
  initialTab?: AccountingTab;
  autoOpenAddCustomer?: boolean;
  autoOpenAddMaterial?: boolean;
  returnDestination?: {
    orderId?: string;
    tab?: string;
    orderNumber?: string;
    sourceView?: 'form' | 'purchases' | 'list' | string;
    title?: string;
  } | null;
  onReturn?: () => void;
  onNavigateToJournal?: () => void;
  onNavigateToLedger?: (accountCode?: string) => void;
}

export function ConfigurationDashboard({
  initialTab = 'accounts',
  autoOpenAddCustomer = false,
  autoOpenAddMaterial = false,
  returnDestination,
  onReturn,
  onNavigateToJournal,
  onNavigateToLedger
}: ConfigurationDashboardProps = {}) {
  const [activeTab, setActiveTab] = useState<AccountingTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs = [
    { id: 'accounts', label: 'شجرة الحسابات والدليل المالي', icon: Network, highlight: true },
    { id: 'financial_config', label: 'التكوين والربط المالي وسياسات التكاليف', icon: Settings2, highlight: true },
    { id: 'customers', label: 'العملاء والموردين', icon: Users },
    { id: 'materials', label: 'خامات القماش والاكسسوارات', icon: PackageSearch },
    { id: 'labor', label: 'العمالة ومعدلات الأجور', icon: HardHat },
    { id: 'departments', label: 'الأقسام ومراكز التكلفة', icon: Building2 },
    { id: 'groups', label: 'مجموعات التشغيل', icon: Building2 },
  ];

  const isPurchasesReturn = returnDestination?.sourceView === 'purchases' || returnDestination?.tab === 'purchases';

  return (
    <div className="space-y-6">
      {/* Return to Packing Order or Purchases banner if user was directed here */}
      {returnDestination && onReturn && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-950 text-sm">
                  {isPurchasesReturn ? 'تم الانتقال من شاشة المشتريات' : 'تم الانتقال من شاشة التغليف'}
                </span>
                {returnDestination.orderNumber && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded font-bold border border-indigo-200">
                    أمر رقم: {returnDestination.orderNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-800 mt-0.5">
                {isPurchasesReturn
                  ? 'يمكنك الآن إضافة أو تعديل بيانات الموردين وخامات التكوين الهيكلي، وعند الانتهاء اضغط على زر العودة للرجوع لفواتير المشتريات'
                  : 'يمكنك الآن إضافة أو إدارة بيانات العملاء، وعند الانتهاء اضغط على زر العودة لمتابعة تجهيز الفاتورة'}
              </p>
            </div>
          </div>
          <button
            onClick={onReturn}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all hover:shadow-md whitespace-nowrap self-stretch sm:self-auto justify-center cursor-pointer"
          >
            <span>{isPurchasesReturn ? 'العودة إلى شاشة المشتريات' : 'العودة إلى شاشة التغليف'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-center shrink-0">
             <Settings2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-800">التكوين المالي وشجرة الحسابات</h2>
              <span className="bg-indigo-100 text-indigo-900 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-200 hidden sm:inline-flex items-center gap-1">
                <Factory className="w-3 h-3 text-indigo-700" />
                <span>مصانع وتصنيع الملابس</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              الإدارة المركزية لشجرة الحسابات، سياسات التكاليف والربط المحاسبي، والموردين، الخامات ومراكز التشغيل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToJournal && (
            <button
              type="button"
              onClick={onNavigateToJournal}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>دفتر القيود اليومية</span>
            </button>
          )}

          {onNavigateToLedger && (
            <button
              type="button"
              onClick={() => onNavigateToLedger()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>دفتر الأستاذ العام</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 custom-scrollbar bg-slate-50/50">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AccountingTab)}
                className={`flex items-center gap-2 px-5 py-4 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive 
                    ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'financial_config' && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </button>
            );
          })}
        </div>
        
        <div className="p-5 sm:p-6 bg-slate-50/30">
          {activeTab === 'accounts' && (
            <ChartOfAccounts 
              onNavigateToLedger={onNavigateToLedger} 
              onNavigateToJournal={onNavigateToJournal} 
            />
          )}
          {activeTab === 'financial_config' && (
            <FinancialConfigView 
              onNavigateToAccounts={() => setActiveTab('accounts')} 
            />
          )}
          {activeTab === 'customers' && (
            <CustomersSuppliersList autoOpenAddModal={autoOpenAddCustomer} />
          )}
          {activeTab === 'materials' && (
            <MaterialsList autoOpenAddModal={autoOpenAddMaterial} />
          )}
          {activeTab === 'labor' && (
            <LaborList />
          )}
          {activeTab === 'departments' && (
            <DepartmentsList />
          )}
          {activeTab === 'groups' && (
            <OperationalGroupsList />
          )}
        </div>
      </div>
    </div>
  );
}
