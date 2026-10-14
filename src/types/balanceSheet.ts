export interface BalanceSheetAccountLine {
  accountCode: string;
  accountName: string;
  amount: number;
  percentageOfSection: number;
  percentageOfTotal: number;
  nature: 'debit' | 'credit';
  note?: string;
  explanation?: string;
}

export interface BalanceSheetSubGroup {
  id: string;
  codePrefix: string;
  title: string;
  arabicTitle: string;
  description: string;
  total: number;
  percentageOfSection: number;
  accounts: BalanceSheetAccountLine[];
  explanation: string;
}

export interface BalanceSheetSection {
  id: 'assets' | 'liabilities' | 'equity';
  title: string;
  arabicTitle: string;
  description: string;
  total: number;
  subGroups: BalanceSheetSubGroup[];
}

export interface BalanceSheetKPIs {
  currentRatio: number;          // نسبة التداول = الأصول المتداولة / الخصوم المتداولة
  quickRatio: number;            // نسبة السيولة السريعة = (نقدية + عملاء) / خصوم متداولة
  cashRatio: number;             // نسبة السيولة النقدية = النقدية / خصوم متداولة
  workingCapital: number;        // رأس المال العامل الصافي = الأصول المتداولة - الخصوم المتداولة
  debtToEquityRatio: number;     // نسبة المديونية إلى حقوق الملكية = إجمالي الالتزامات / حقوق الملكية
  debtToAssetsRatio: number;     // نسبة الديون إلى الأصول = إجمالي الالتزامات / إجمالي الأصول
  equityRatio: number;           // نسبة التمويل الذاتي = حقوق الملكية / إجمالي الأصول
  inventoryToWorkingCapital: number; // نسبة المخزون إلى رأس المال العامل %
}

export interface BalanceSheetReport {
  asOfDate: string;
  periodLabel: string;
  generatedAt: string;

  // 1. Assets
  nonCurrentAssets: {
    grossPropertyPlantEquipment: number;
    accumulatedDepreciation: number;
    netPropertyPlantEquipment: number;
    intangibleAndOtherAssets: number;
    total: number;
    subGroups: BalanceSheetSubGroup[];
  };

  currentAssets: {
    cashAndEquivalents: number;
    accountsReceivable: number;
    otherReceivablesAndPrepayments: number;
    rawMaterialsInventory: number;
    wipInventory: number;
    finishedGoodsInventory: number;
    totalInventory: number;
    total: number;
    subGroups: BalanceSheetSubGroup[];
  };

  totalAssets: number;

  // 2. Liabilities
  currentLiabilities: {
    accountsPayableSuppliers: number;
    notesPayable: number;
    accruedExpensesAndLabor: number;
    taxesAndVatPayable: number;
    customerAdvances: number;
    total: number;
    subGroups: BalanceSheetSubGroup[];
  };

  nonCurrentLiabilities: {
    longTermBankLoans: number;
    total: number;
    subGroups: BalanceSheetSubGroup[];
  };

  totalLiabilities: number;

  // 3. Equity
  equity: {
    paidInCapital: number;
    retainedEarnings: number;
    partnersCurrentAccount: number;
    currentPeriodNetIncome: number; // المنقول من قائمة الدخل
    total: number;
    subGroups: BalanceSheetSubGroup[];
  };

  totalLiabilitiesAndEquity: number;

  // Balance Check & Verification
  isBalanced: boolean;
  difference: number; // totalAssets - totalLiabilitiesAndEquity (يجب أن يكون 0.00)

  // Financial Health Metrics & Ratios
  kpis: BalanceSheetKPIs;

  // Educational & Managerial Explanations
  analysisNotes: {
    liquidityAnalysis: string;
    solvencyAnalysis: string;
    inventoryStructureAnalysis: string;
    workingCapitalAnalysis: string;
    auditorRecommendations: string[];
  };
}
