import React, { useState, useEffect } from "react";
import {
  Calculator,
  Factory,
  LayoutDashboard,
  ListPlus,
  FileText,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Users,
  DollarSign,
  Briefcase,
  ShieldCheck,
  Grid,
  Menu,
  X,
  PackageCheck,
  ShoppingCart,
  Boxes,
  BookOpen,
  Scale,
  TrendingUp,
  Building,
  Tv,
  Sun,
  Moon,
  Globe,
  Sliders,
  Type,
  Check,
  PanelRightOpen,
  PanelRightClose,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { getPrimaryBg, getPrimaryText, getRadiusClass, FONT_SIZE_OPTIONS, ThemeFontSize } from "../lib/theme";
import { UserNavDropdown } from "./users/UserNavDropdown";
import { SystemAuditLogModal } from "./audit/SystemAuditLogModal";
import { useAuth } from "../context/AuthContext";

export type LayoutViewType = 
  | "dashboard" 
  | "list" 
  | "form" 
  | "settings" 
  | "accounting_config" 
  | "finished_goods_warehouse" 
  | "purchases" 
  | "sales" 
  | "raw_materials_warehouse" 
  | "users" 
  | "journal_entries" 
  | "general_ledger" 
  | "trial_balance" 
  | "income_statement" 
  | "balance_sheet" 
  | "cash_flow" 
  | "treasury" 
  | "hr_payroll" 
  | "overhead_costing"
  | "factory_floor_monitor"
  | "operator_station";

interface LayoutProps {
  children: React.ReactNode;
  currentView: LayoutViewType;
  onNavigate: (view: LayoutViewType) => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

export function Layout({ children, currentView, onNavigate, onGoBack, canGoBack = true }: LayoutProps) {
  const { color, radius, isDark, toggleDarkMode, language, toggleLanguage, fontSize, setFontSize } = useTheme();
  const { hasScreenAccess } = useAuth();
  
  const [expandedSection, setExpandedSection] = useState<string>("factory");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);

  // User request: جعل الاسلايد الجانبى غير ظاهر الا عند الضغط عليه لزياده مساحه العرض
  // By default, sidebar is collapsed/hidden to maximize screen space!
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem("ui-sidebar-open");
    return saved === "true"; // Default to false (hidden) to expand screen area!
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem("ui-sidebar-open", String(next));
      return next;
    });
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setIsMobileMenuOpen(false);
    localStorage.setItem("ui-sidebar-open", "false");
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
    localStorage.setItem("ui-sidebar-open", "true");
  };

  const hasAdminSection = hasScreenAccess('dashboard') || hasScreenAccess('users');
  const hasFactorySection = hasScreenAccess('list') || hasScreenAccess('form') || hasScreenAccess('operator_station') || hasScreenAccess('factory_floor_monitor');
  const hasFinanceSection = hasScreenAccess('journal_entries') || hasScreenAccess('general_ledger') || hasScreenAccess('trial_balance') || hasScreenAccess('income_statement') || hasScreenAccess('cash_flow') || hasScreenAccess('balance_sheet') || hasScreenAccess('accounting_config') || hasScreenAccess('treasury');
  const hasSalesWarehouseSection = hasScreenAccess('sales') || hasScreenAccess('purchases') || hasScreenAccess('raw_materials_warehouse') || hasScreenAccess('finished_goods_warehouse');
  const hasOverheadSection = hasScreenAccess('overhead_costing');
  const hasHrSection = hasScreenAccess('hr_payroll');
  const hasSettings = hasScreenAccess('settings');

  const handleNavClick = (view: LayoutViewType) => {
    onNavigate(view);
    closeSidebar();
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? "" : section);
  };

  const primaryBg = getPrimaryBg(color);
  const radiusClass = getRadiusClass(radius);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#0c0617] flex-col overflow-hidden relative">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-[#180a2c] p-4 text-white print:hidden border-b border-purple-950/60 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-md hover:bg-purple-900/60 transition-colors cursor-pointer">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2C1151] border border-amber-500/40 flex items-center justify-center">
              <Factory className="w-4 h-4 text-amber-400" />
            </div>
            <h1 className="text-lg font-black leading-tight text-white tracking-wide">GFOS ERP</h1>
          </div>
        </div>
      </div>

      {/* Floating Side Button on screen edge to easily reveal sidebar anytime */}
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={openSidebar}
          onMouseEnter={openSidebar}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-40 bg-[#180a2c] hover:bg-[#2C1151] text-amber-400 py-4 px-2 rounded-l-2xl shadow-2xl border-y border-l border-amber-500/40 transition-all flex flex-col items-center gap-2 cursor-pointer group hover:px-3 print:hidden"
          title="مرر الماوس أو انقر لفتح القائمة الرئيسية"
        >
          <PanelRightOpen className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-black [writing-mode:vertical-rl] tracking-widest text-slate-300 group-hover:text-amber-300 select-none">
            القائمة الرئيسية
          </span>
        </button>
      )}

      {/* Backdrop when sidebar is active */}
      {(isSidebarOpen || isMobileMenuOpen) && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity print:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Collapsible Slide-over Sidebar Drawer */}
      <aside 
        onMouseLeave={closeSidebar}
        className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-[#180a2c] text-slate-300 flex flex-col flex-shrink-0 print:hidden overflow-y-auto transform transition-transform duration-300 ease-in-out border-l border-purple-950/70 shadow-2xl ${
          (isSidebarOpen || isMobileMenuOpen) ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="p-5 pb-2 border-b border-purple-950/60">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={closeSidebar} 
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-purple-900/50 transition-colors flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-purple-800 cursor-pointer"
              title="طي القائمة لتوسيع مساحة الشاشة"
            >
              <X className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] text-slate-300">طي القائمة</span>
            </button>

            <div className="flex items-center gap-2.5 justify-end flex-1">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <h1 className="text-lg font-black text-white leading-tight tracking-wider">GFOS</h1>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">غرفة قيادة مصانع الملابس</p>
              </div>
              <div className={`w-10 h-10 flex items-center justify-center shrink-0 bg-[#2C1151] border border-amber-500/40 ${radiusClass} shadow-2xs`}>
                <Factory className="text-amber-400 w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3.5 py-3 space-y-2 overflow-y-auto custom-scrollbar">
          {/* Section 1: Admin */}
          {hasAdminSection && (
            <div>
              <button 
                onClick={() => toggleSection('admin')}
                className="w-full flex items-center justify-between py-2.5 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {expandedSection === 'admin' ? <ChevronUp className={`w-4 h-4 ${getPrimaryText(color)}`} /> : <ChevronDown className="w-4 h-4" />}
                <div className="flex items-center gap-2.5">
                  <span>نظام الإدارة وشاشات التحكم</span>
                  <Grid className={`w-4 h-4 ${expandedSection === 'admin' ? getPrimaryText(color) : 'text-slate-500'}`} />
                </div>
              </button>
              {expandedSection === 'admin' && (
                <div className="mt-1 space-y-1 mb-2">
                  {hasScreenAccess('dashboard') && (
                    <button
                      onClick={() => handleNavClick("dashboard")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "dashboard"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>لوحة التحكم الرئيسية</span>
                      <LayoutDashboard className="w-4 h-4" />
                    </button>
                  )}
                  {hasScreenAccess('users') && (
                    <button
                      onClick={() => handleNavClick("users")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "users"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                          RBAC
                        </span>
                        <span>المستخدمين والصلاحيات المؤسسية</span>
                      </span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Factory & Planning */}
          {hasFactorySection && (
            <div>
              <button 
                onClick={() => toggleSection('factory')}
                className="w-full flex items-center justify-between py-2.5 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {expandedSection === 'factory' ? <ChevronUp className={`w-4 h-4 ${getPrimaryText(color)}`} /> : <ChevronDown className="w-4 h-4" />}
                <div className="flex items-center gap-2.5">
                  <span>التخطيط وأوامر التشغيل</span>
                  <Factory className={`w-4 h-4 ${expandedSection === 'factory' ? getPrimaryText(color) : 'text-slate-500'}`} />
                </div>
              </button>
              {expandedSection === 'factory' && (
                <div className="mt-1 space-y-1 mb-2">
                  {hasScreenAccess('list') && (
                    <button
                      onClick={() => handleNavClick("list")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "list"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>أوامر الإنتاج</span>
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                  {hasScreenAccess('form') && (
                    <button
                      onClick={() => handleNavClick("form")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "form"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>أمر إنتاج أولي</span>
                      <ListPlus className="w-4 h-4" />
                    </button>
                  )}
                  {hasScreenAccess('operator_station') && (
                    <button
                      onClick={() => handleNavClick("operator_station")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "operator_station"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>مراحل تشغيل أوامر الإنتاج</span>
                      <Sliders className="w-4 h-4 text-amber-400" />
                    </button>
                  )}
                  {hasScreenAccess('factory_floor_monitor') && (
                    <button
                      onClick={() => handleNavClick("factory_floor_monitor")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "factory_floor_monitor"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>غرفة التحكم اللحظية للإنتاج</span>
                      </span>
                      <Tv className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Accounting & Finance */}
          {hasFinanceSection && (
            <div>
              <button 
                onClick={() => toggleSection('accounting')}
                className="w-full flex items-center justify-between py-2.5 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {expandedSection === 'accounting' ? <ChevronUp className={`w-4 h-4 ${getPrimaryText(color)}`} /> : <ChevronDown className="w-4 h-4" />}
                <div className="flex items-center gap-2.5">
                  <span>المحاسبة والمالية واليومية</span>
                  <Scale className={`w-4 h-4 ${expandedSection === 'accounting' ? getPrimaryText(color) : 'text-slate-500'}`} />
                </div>
              </button>
              {expandedSection === 'accounting' && (
                <div className="mt-1 space-y-1 mb-2">
                  {hasScreenAccess('journal_entries') && (
                    <button
                      onClick={() => handleNavClick("journal_entries")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "journal_entries"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>دفتر القيود اليومية المحاسبية</span>
                      <BookOpen className="w-4 h-4 text-amber-400" />
                    </button>
                  )}
                  {hasScreenAccess('general_ledger') && (
                    <button
                      onClick={() => handleNavClick("general_ledger")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "general_ledger"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>دفتر الأستاذ العام للحسابات</span>
                      <Scale className="w-4 h-4" />
                    </button>
                  )}
                  {hasScreenAccess('trial_balance') && (
                    <button
                      onClick={() => handleNavClick("trial_balance")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "trial_balance"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>ميزان المراجعة (بالمجاميع والأرصدة)</span>
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                  {hasScreenAccess('income_statement') && (
                    <button
                      onClick={() => handleNavClick("income_statement")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "income_statement"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>قائمة الدخل والأرباح والخسائر (P&L)</span>
                      </span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}
                  {hasScreenAccess('cash_flow') && (
                    <button
                      onClick={() => handleNavClick("cash_flow")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "cash_flow"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>قائمة التدفقات النقدية (Cash Flow)</span>
                      </span>
                      <DollarSign className="w-4 h-4 text-teal-400" />
                    </button>
                  )}
                  {hasScreenAccess('balance_sheet') && (
                    <button
                      onClick={() => handleNavClick("balance_sheet")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "balance_sheet"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>قائمة المركز المالي (الميزانية العمومية)</span>
                      </span>
                      <Building className="w-4 h-4 text-indigo-400" />
                    </button>
                  )}
                  {hasScreenAccess('accounting_config') && (
                    <button
                      onClick={() => handleNavClick("accounting_config")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "accounting_config"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>شجرة الحسابات والتكوين المالي</span>
                      <Grid className="w-4 h-4" />
                    </button>
                  )}
                  {hasScreenAccess('treasury') && (
                    <button
                      onClick={() => handleNavClick("treasury")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "treasury"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>إيرادات ومصروفات (الخزينة)</span>
                      </span>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 4: Sales, Purchases & Warehouses */}
          {hasSalesWarehouseSection && (
            <div>
              <button 
                onClick={() => toggleSection('sales')}
                className="w-full flex items-center justify-between py-2.5 px-2 text-sm font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {expandedSection === 'sales' ? <ChevronUp className={`w-4 h-4 ${getPrimaryText(color)}`} /> : <ChevronDown className="w-4 h-4" />}
                <div className="flex items-center gap-2.5">
                  <span>المبيعات والمشتريات والمخازن</span>
                  <Briefcase className={`w-4 h-4 ${expandedSection === 'sales' ? getPrimaryText(color) : 'text-slate-500'}`} />
                </div>
              </button>
              {expandedSection === 'sales' && (
                <div className="mt-1 space-y-1 mb-2">
                  {hasScreenAccess('sales') && (
                    <button
                      onClick={() => handleNavClick("sales")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "sales"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>إدارة المبيعات وفواتير العملاء</span>
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  )}
                  {hasScreenAccess('purchases') && (
                    <button
                      onClick={() => handleNavClick("purchases")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "purchases"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>إدارة المشتريات وفواتير الشراء</span>
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  )}
                  {hasScreenAccess('raw_materials_warehouse') && (
                    <button
                      onClick={() => handleNavClick("raw_materials_warehouse")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "raw_materials_warehouse"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>مخزن الأقمشة والإكسسوارات</span>
                      <Boxes className="w-4 h-4" />
                    </button>
                  )}
                  {hasScreenAccess('finished_goods_warehouse') && (
                    <button
                      onClick={() => handleNavClick("finished_goods_warehouse")}
                      className={`w-full flex items-center justify-end gap-3 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                        currentView === "finished_goods_warehouse"
                          ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                          : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                      }`}
                    >
                      <span>مخزن المنتجات التامة (الملابس الجاهزة)</span>
                      <PackageCheck className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 5: Costing & Manufacturing Overhead */}
          {hasOverheadSection && (
            <div>
              <button
                onClick={() => handleNavClick("overhead_costing")}
                className={`w-full flex items-center justify-between py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                  currentView === "overhead_costing"
                    ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calculator className={`w-4 h-4 ${currentView === "overhead_costing" ? "text-current" : "text-emerald-400"}`} />
                  <span>التكاليف الصناعية غير المباشرة (MOH)</span>
                </div>
              </button>
            </div>
          )}

          {/* Section 6: HR */}
          {hasHrSection && (
            <div>
              <button
                onClick={() => handleNavClick("hr_payroll")}
                className={`w-full flex items-center justify-between py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                  currentView === "hr_payroll"
                    ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className={`w-4 h-4 ${currentView === "hr_payroll" ? "text-current" : "text-indigo-400"}`} />
                  <span>الموارد البشرية ومستحقات العمال فنيين</span>
                </div>
              </button>
            </div>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto border-t border-slate-800/80 pt-3 pb-2 px-3.5">
          {hasSettings && (
            <button
              onClick={() => handleNavClick("settings")}
              className={`w-full flex items-center justify-end gap-2.5 px-3.5 py-2.5 mb-2 text-xs font-bold transition-all cursor-pointer ${radiusClass} ${
                currentView === "settings"
                  ? `${primaryBg} ${color === 'orange' ? 'text-slate-900' : 'text-white'}`
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <span>إعدادات النظام</span>
              <SettingsIcon className="w-4 h-4" />
            </button>
          )}
          
          <div className="flex justify-between items-center px-2 py-2 text-[#334155] border-t border-[#1e293b]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#475569]" />
            <span className="text-[10px] text-[#64748b]">GFOS Enterprise RBAC v2.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Full width maximized */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0c0617] relative flex flex-col w-full">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-[#140a22] border-b border-slate-200 dark:border-purple-950/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Fixed Back Button across all screens */}
            {onGoBack && (
              <button
                type="button"
                onClick={onGoBack}
                disabled={!canGoBack}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs shrink-0 select-none ${
                  canGoBack
                    ? "bg-slate-100 hover:bg-slate-200 dark:bg-[#1f1338] dark:hover:bg-[#2c1b4d] text-slate-800 dark:text-amber-400 border-slate-200 dark:border-purple-900/60 cursor-pointer hover:shadow-xs active:scale-95"
                    : "opacity-40 bg-slate-50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600 border-slate-200/50 dark:border-slate-800 cursor-not-allowed"
                }`}
                title={canGoBack ? "الرجوع خطوة للشاشة السابقة" : "أنت في الشاشة الرئيسية الأولى"}
              >
                {language === "ar" ? (
                  <ArrowRight className="w-4 h-4 text-purple-600 dark:text-amber-400" />
                ) : (
                  <ArrowLeft className="w-4 h-4 text-purple-600 dark:text-amber-400" />
                )}
                <span>رجوع</span>
              </button>
            )}

            <span className="text-xs font-black text-[#2C1151] dark:text-amber-400 shrink-0">GFOS ERP /</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {currentView === "dashboard" && "لوحة القيادة الرئيسية"}
              {currentView === "list" && "أوامر الإنتاج والتصنيع"}
              {currentView === "form" && "إدارة أمر التشغيل والباتشات"}
              {currentView === "operator_station" && "مراحل تشغيل أوامر الإنتاج"}
              {currentView === "factory_floor_monitor" && "غرفة التحكم اللحظية للإنتاج"}
              {currentView === "users" && "إدارة المستخدمين والصلاحيات (RBAC)"}
              {currentView === "purchases" && "إدارة المشتريات وفواتير الشراء"}
              {currentView === "raw_materials_warehouse" && "مخزن الأقمشة والإكسسوارات"}
              {currentView === "finished_goods_warehouse" && "مخزن المنتجات التامة"}
              {currentView === "accounting_config" && "التكوين الهيكلي والمالي"}
              {currentView === "treasury" && "إدارة الإيرادات والمصروفات وحركة الخزينة والسيولة"}
              {currentView === "settings" && "إعدادات النظام والتخصيص"}
              {currentView === "overhead_costing" && "التكاليف الصناعية غير المباشرة (MOH)"}
              {currentView === "hr_payroll" && "الموارد البشرية ومستحقات الفنيين"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick 5-Level Font Size & Display Scale Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFontMenu(!showFontMenu)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1f1338] dark:hover:bg-[#2c1b4d] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-purple-900/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="تغيير مقياس حجم الخط وعرض الشاشة (5 مستويات)"
              >
                <Type className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-mono text-[11px] font-black">{FONT_SIZE_OPTIONS.find(o => o.id === fontSize)?.shortLabel || '100%'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showFontMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowFontMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-[#1a0e30] border border-slate-200 dark:border-purple-900/60 rounded-xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 text-right">
                    <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-purple-900/40 text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>حجم الخط ومقياس العرض (5 مستويات)</span>
                      <Type className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    {FONT_SIZE_OPTIONS.map(opt => {
                      const isSelected = fontSize === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setFontSize(opt.id);
                            setShowFontMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer text-right ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-purple-900/60 text-indigo-700 dark:text-amber-300 border border-indigo-200 dark:border-purple-700/60'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-purple-950/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] w-9 font-black text-slate-900 dark:text-white">{opt.shortLabel}</span>
                            <span>{opt.label.split(' ')[0]}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-amber-400 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Quick TV Mode Button */}
            {hasScreenAccess('factory_floor_monitor') && (
              <button
                type="button"
                onClick={() => handleNavClick("factory_floor_monitor")}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                  currentView === "factory_floor_monitor"
                    ? "bg-[#2C1151] text-amber-300 border-amber-500/40"
                    : "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800/60"
                }`}
                title="عرض غرفة التحكم اللحظية للإنتاج"
              >
                <Tv className="w-3.5 h-3.5 text-amber-500" />
                <span>شاشة المصنع TV</span>
              </button>
            )}

            {/* Quick Operator Station Button */}
            {hasScreenAccess('operator_station') && (
              <button
                type="button"
                onClick={() => handleNavClick("operator_station")}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                  currentView === "operator_station"
                    ? "bg-[#2C1151] text-amber-300 border-amber-500/40"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-[#1f1338] dark:hover:bg-[#2c1b4d] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-purple-900/40"
                }`}
                title="مراحل تشغيل أوامر الإنتاج"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                <span>محطة التشغيل</span>
              </button>
            )}

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1f1338] dark:hover:bg-[#2c1b4d] text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-purple-900/40 transition-colors cursor-pointer"
              title={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن الصناعي"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language / Direction Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1f1338] dark:hover:bg-[#2c1b4d] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-purple-900/40 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="تغيير لغة العرض (العربية / English)"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{language === "ar" ? "EN" : "عربي"}</span>
            </button>

            {/* Audit Log Button */}
            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-[#1f1338] dark:hover:bg-[#2c1b4d] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-purple-900/40 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="سجل وتوثيق اعتمادات وحركات النظام"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>سجل الاعتمادات</span>
            </button>

            <UserNavDropdown onNavigateToUsers={() => handleNavClick("users")} />
          </div>
        </header>

        {/* Content Container - Expanded to full width without max-w-7xl constraint to maximize display area */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5 print:p-0 print:m-0 flex-1">
          {children}
        </div>
      </main>

      {/* System Audit & Approvals Log Modal */}
      {showAuditModal && (
        <SystemAuditLogModal onClose={() => setShowAuditModal(false)} />
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
      `}} />
    </div>
  );
}
