import React, { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ProductionOrdersList } from "./components/ProductionOrdersList";
import { OrderManager } from "./components/OrderManager";
import { Settings } from "./components/Settings";
import { ConfigurationDashboard, AccountingTab } from "./components/accounting/ConfigurationDashboard";
import { FinishedGoodsWarehouse } from "./components/FinishedGoodsWarehouse";
import { PurchasesDashboard } from "./components/purchases/PurchasesDashboard";
import { SalesDashboard } from "./components/sales/SalesDashboard";
import { RawMaterialsWarehouse } from "./components/RawMaterialsWarehouse";
import { UsersManagement } from "./components/users/UsersManagement";
import { JournalEntriesView } from "./components/accounting/JournalEntriesView";
import { GeneralLedgerView } from "./components/accounting/GeneralLedgerView";
import { TrialBalanceView } from "./components/accounting/TrialBalanceView";
import { IncomeStatementView } from "./components/accounting/IncomeStatementView";
import { BalanceSheetView } from "./components/accounting/BalanceSheetView";
import { CashFlowStatementView } from "./components/accounting/CashFlowStatementView";
import { TreasuryDashboard } from "./components/treasury/TreasuryDashboard";
import { HRPayrollDashboard } from "./components/hr/HRPayrollDashboard";
import { OverheadCostManagement } from "./components/costing/OverheadCostManagement";
import { FactoryFloorMonitor } from "./components/production/FactoryFloorMonitor";
import { DepartmentOperatorStation } from "./components/production/DepartmentOperatorStation";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationToastContainer } from "./components/ui/NotificationToast";
import { AccessDenied } from "./components/common/AccessDenied";
import { ALL_SCREENS_METADATA } from "./lib/permissionsConfig";

type ViewState = 
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


interface ReturnDestination {
  orderId?: string;
  tab?: string;
  orderNumber?: string;
  sourceView?: "form" | "purchases" | "list" | string;
}

function AppContent() {
  const { hasScreenAccess, currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("production");
  const [accountingTab, setAccountingTab] = useState<AccountingTab>("accounts");
  const [accountingAutoOpenAdd, setAccountingAutoOpenAdd] = useState<boolean>(false);
  const [accountingAutoOpenAddMaterial, setAccountingAutoOpenAddMaterial] = useState<boolean>(false);
  const [returnDestination, setReturnDestination] = useState<ReturnDestination | null>(null);
  const [selectedLedgerAccountCode, setSelectedLedgerAccountCode] = useState<string>('12411');

  const handleNavigateToFirstAllowed = () => {
    const firstAllowed = ALL_SCREENS_METADATA.find(s => hasScreenAccess(s.id));
    if (firstAllowed) {
      handleNavigate(firstAllowed.id as ViewState);
    } else {
      handleNavigate("dashboard");
    }
  };

  // Ensure active view is authorized when switching users or roles
  React.useEffect(() => {
    if (!hasScreenAccess(currentView as any)) {
      handleNavigateToFirstAllowed();
    }
  }, [currentUser.id, currentUser.role]);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    if (view !== "form") {
      setSelectedOrderId(null);
    }
    if (view !== "accounting_config") {
      setAccountingAutoOpenAdd(false);
      setAccountingAutoOpenAddMaterial(false);
    }
  };

  const handleNavigateToOrder = (id: string, tab: string = "production") => {
    setSelectedOrderId(id);
    setSelectedTab(tab);
    setCurrentView("form");
  };

  const handleNavigateToAccounting = (
    tab: AccountingTab = "customers",
    returnInfo?: ReturnDestination,
    autoOpenAdd: boolean = false
  ) => {
    setAccountingTab(tab);
    if (tab === "materials") {
      setAccountingAutoOpenAddMaterial(autoOpenAdd);
      setAccountingAutoOpenAdd(false);
    } else {
      setAccountingAutoOpenAdd(autoOpenAdd);
      setAccountingAutoOpenAddMaterial(false);
    }
    if (returnInfo) {
      setReturnDestination(returnInfo);
    }
    setCurrentView("accounting_config");
  };

  const handleEditOrder = (id: string) => {
    setSelectedOrderId(id);
    setSelectedTab("production");
    setCurrentView("form");
  };

  const handleViewOrder = (id: string) => {
    setSelectedOrderId(id);
    setCurrentView("form");
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
    setCurrentView("list");
  };

  const isCurrentViewAllowed = hasScreenAccess(currentView as any);

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {!isCurrentViewAllowed ? (
        <AccessDenied
          screenId={currentView as any}
          onNavigateHome={() => {
            if (hasScreenAccess("dashboard")) {
              handleNavigate("dashboard");
            } else {
              handleNavigateToFirstAllowed();
            }
          }}
          onNavigateToFirstAllowed={handleNavigateToFirstAllowed}
        />
      ) : (
        <>
          {currentView === "dashboard" && <Dashboard onNavigate={handleNavigate} onNavigateToOrder={handleNavigateToOrder} />}
          {currentView === "list" && (
            <ProductionOrdersList
              onEdit={handleEditOrder}
              onView={handleViewOrder}
          onNavigateToOrder={handleNavigateToOrder}
        />
      )}
      {currentView === "form" && (
        <OrderManager
          key={`${selectedOrderId}_${selectedTab}`}
          orderId={selectedOrderId}
          onBack={handleBackToList}
          initialTab={selectedTab}
          onNavigateToWarehouse={() => handleNavigate("finished_goods_warehouse")}
          onNavigateToAccounting={handleNavigateToAccounting}
        />
      )}
      {currentView === "settings" && (
        <Settings
          onBack={handleBackToList}
          onNavigateToUsers={() => handleNavigate("users")}
        />
      )}
      {currentView === "sales" && (
        <SalesDashboard
          onNavigateToJournal={() => handleNavigate("journal_entries")}
          onNavigateToLedger={(code) => {
            if (code) setSelectedLedgerAccountCode(code);
            handleNavigate("general_ledger");
          }}
          onNavigateToWarehouse={() => handleNavigate("finished_goods_warehouse")}
          onNavigateToTreasury={() => handleNavigate("treasury")}
          onNavigateToCustomers={() =>
            handleNavigateToAccounting(
              "customers",
              { sourceView: "sales", tab: "customers" },
              true
            )
          }
          onNavigateToOrder={(orderId) => handleNavigateToOrder(orderId, "packing")}
        />
      )}
      {currentView === "purchases" && (
        <PurchasesDashboard
          onNavigateToAccounting={(tab, autoOpenAdd = true) =>
            handleNavigateToAccounting(
              tab,
              { sourceView: "purchases", tab: "purchases" },
              autoOpenAdd
            )
          }
          onNavigateToWarehouse={() => handleNavigate("raw_materials_warehouse")}
          onNavigateToTreasury={() => handleNavigate("treasury")}
          onNavigateToJournal={() => handleNavigate("journal_entries")}
        />
      )}
      {currentView === "raw_materials_warehouse" && (
        <RawMaterialsWarehouse
          onNavigateToPurchases={() => handleNavigate("purchases")}
          onNavigateToAccountingMaterials={() =>
            handleNavigateToAccounting(
              "materials",
              { sourceView: "raw_materials_warehouse", tab: "materials" },
              true
            )
          }
        />
      )}
      {currentView === "finished_goods_warehouse" && (
        <FinishedGoodsWarehouse
          onNavigateToOrder={(orderId, tab) => handleNavigateToOrder(orderId, tab || "packing")}
          onNavigateToSales={() => handleNavigate("sales")}
        />
      )}
      {currentView === "accounting_config" && (
        <ConfigurationDashboard
          initialTab={accountingTab}
          autoOpenAddCustomer={accountingAutoOpenAdd}
          autoOpenAddMaterial={accountingAutoOpenAddMaterial}
          returnDestination={returnDestination}
          onNavigateToJournal={() => handleNavigate("journal_entries")}
          onNavigateToLedger={() => handleNavigate("general_ledger")}
          onReturn={() => {
            if (returnDestination) {
              if (returnDestination.sourceView === "sales" || returnDestination.tab === "sales") {
                setCurrentView("sales");
                setReturnDestination(null);
              } else if (returnDestination.sourceView === "purchases" || returnDestination.tab === "purchases") {
                setCurrentView("purchases");
                setReturnDestination(null);
              } else if (returnDestination.sourceView === "raw_materials_warehouse") {
                setCurrentView("raw_materials_warehouse");
                setReturnDestination(null);
              } else if (returnDestination.orderId) {
                handleNavigateToOrder(returnDestination.orderId, returnDestination.tab || "packing");
                setReturnDestination(null);
              } else {
                handleNavigate("purchases");
                setReturnDestination(null);
              }
            } else {
              handleNavigate("list");
            }
          }}
        />
      )}
      {currentView === "users" && <UsersManagement />}
      {currentView === "journal_entries" && (
        <JournalEntriesView
          onNavigateToLedger={(accountCode) => {
            if (accountCode) setSelectedLedgerAccountCode(accountCode);
            handleNavigate("general_ledger");
          }}
          onNavigateToTrialBalance={() => {
            handleNavigate("trial_balance");
          }}
          onNavigateToIncomeStatement={() => {
            handleNavigate("income_statement");
          }}
          onNavigateToBalanceSheet={() => {
            handleNavigate("balance_sheet");
          }}
          onNavigateToCashFlow={() => {
            handleNavigate("cash_flow");
          }}
        />
      )}
      {currentView === "general_ledger" && (
        <GeneralLedgerView
          initialAccountCode={selectedLedgerAccountCode}
          onNavigateToJournal={() => {
            handleNavigate("journal_entries");
          }}
          onNavigateToTrialBalance={() => {
            handleNavigate("trial_balance");
          }}
          onNavigateToIncomeStatement={() => {
            handleNavigate("income_statement");
          }}
          onNavigateToBalanceSheet={() => {
            handleNavigate("balance_sheet");
          }}
          onNavigateToCashFlow={() => {
            handleNavigate("cash_flow");
          }}
        />
      )}
      {currentView === "trial_balance" && (
        <TrialBalanceView
          onNavigateToLedger={(accountCode) => {
            if (accountCode) setSelectedLedgerAccountCode(accountCode);
            handleNavigate("general_ledger");
          }}
          onNavigateToJournal={() => {
            handleNavigate("journal_entries");
          }}
          onNavigateToIncomeStatement={() => {
            handleNavigate("income_statement");
          }}
          onNavigateToBalanceSheet={() => {
            handleNavigate("balance_sheet");
          }}
          onNavigateToCashFlow={() => {
            handleNavigate("cash_flow");
          }}
        />
      )}
      {currentView === "income_statement" && (
        <IncomeStatementView
          onNavigateToLedger={(accountCode) => {
            if (accountCode) setSelectedLedgerAccountCode(accountCode);
            handleNavigate("general_ledger");
          }}
          onNavigateToJournal={() => {
            handleNavigate("journal_entries");
          }}
          onNavigateToTrialBalance={() => {
            handleNavigate("trial_balance");
          }}
          onNavigateToBalanceSheet={() => {
            handleNavigate("balance_sheet");
          }}
          onNavigateToCashFlow={() => {
            handleNavigate("cash_flow");
          }}
          onBack={() => {
            handleNavigate("dashboard");
          }}
        />
      )}
      {currentView === "balance_sheet" && (
        <BalanceSheetView
          onNavigateToLedger={(accountCode) => {
            if (accountCode) setSelectedLedgerAccountCode(accountCode);
            handleNavigate("general_ledger");
          }}
          onNavigateToJournal={() => {
            handleNavigate("journal_entries");
          }}
          onNavigateToTrialBalance={() => {
            handleNavigate("trial_balance");
          }}
          onNavigateToIncomeStatement={() => {
            handleNavigate("income_statement");
          }}
          onNavigateToCashFlow={() => {
            handleNavigate("cash_flow");
          }}
          onNavigateToChartOfAccounts={() => {
            handleNavigate("accounting_config");
          }}
          onBack={() => {
            handleNavigate("dashboard");
          }}
        />
      )}
      {currentView === "cash_flow" && (
        <CashFlowStatementView
          onNavigateToLedger={(accountCode) => {
            if (accountCode) setSelectedLedgerAccountCode(accountCode);
            handleNavigate("general_ledger");
          }}
          onNavigateToJournal={() => {
            handleNavigate("journal_entries");
          }}
          onNavigateToTrialBalance={() => {
            handleNavigate("trial_balance");
          }}
          onNavigateToIncomeStatement={() => {
            handleNavigate("income_statement");
          }}
          onNavigateToBalanceSheet={() => {
            handleNavigate("balance_sheet");
          }}
          onNavigateToChartOfAccounts={() => {
            handleNavigate("accounting_config");
          }}
          onBack={() => {
            handleNavigate("dashboard");
          }}
        />
      )}
      {currentView === "treasury" && (
        <TreasuryDashboard
          onNavigateToJournal={() => handleNavigate("journal_entries")}
          onNavigateToLedger={(accountCode) => {
            if (accountCode) setSelectedLedgerAccountCode(accountCode);
            handleNavigate("general_ledger");
          }}
          onNavigateToSales={() => handleNavigate("sales")}
          onNavigateToPurchases={() => handleNavigate("purchases")}
          onNavigateToCashFlow={() => handleNavigate("cash_flow")}
        />
      )}
      {currentView === "hr_payroll" && (
        <HRPayrollDashboard
          onNavigateToJournal={() => handleNavigate("journal_entries")}
          onNavigateToLedger={(accountCode) => {
            if (accountCode) setSelectedLedgerAccountCode(accountCode);
            handleNavigate("general_ledger");
          }}
          onNavigateToTreasury={() => handleNavigate("treasury")}
        />
      )}
      {currentView === "overhead_costing" && (
        <OverheadCostManagement
          onNavigateToOrder={(orderId, tab) => handleNavigateToOrder(orderId, tab || "production")}
          onNavigateToLedger={(accountCode) => {
            if (accountCode) setSelectedLedgerAccountCode(accountCode);
            handleNavigate("general_ledger");
          }}
          onNavigateToJournal={() => handleNavigate("journal_entries")}
        />
      )}
      {currentView === "factory_floor_monitor" && (
        <FactoryFloorMonitor
          onBack={() => handleNavigate("dashboard")}
          onNavigateToOrder={(orderId, tab) => handleNavigateToOrder(orderId, tab || "production")}
        />
      )}
      {currentView === "operator_station" && (
        <DepartmentOperatorStation
          onBack={() => handleNavigate("dashboard")}
          onNavigateToOrder={(orderId, tab) => handleNavigateToOrder(orderId, tab)}
        />
      )}
        </>
      )}
      <NotificationToastContainer />
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
