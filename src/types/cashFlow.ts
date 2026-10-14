export interface CashFlowLineItem {
  id: string;
  code?: string;
  title: string;
  amount: number;
  isPositive: boolean; // التدفق النقدي داخل موجب أم خارج سالب
  category: 'operating' | 'investing' | 'financing';
  notes?: string;
  explanation: string;
  relatedAccountCodes?: string[];
}

export interface CashFlowSection {
  id: 'operating' | 'investing' | 'financing';
  title: string;
  arabicTitle: string;
  description: string;
  netCashFlow: number;
  items: CashFlowLineItem[];
  explanation: string;
}

export interface CashFlowKPIs {
  operatingCashFlowMargin: number;       // نسبة التدفق التشغيلي إلى المبيعات %
  operatingCashToNetIncomeRatio: number; // جودة الأرباح: نسبة التدفق التشغيلي إلى صافي الربح
  freeCashFlow: number;                  // التدفق النقدي الحر (FCF) = التشغيلي - النفقات الرأسمالية
  cashBurnOrBuildRate: number;           // معدل تراكم أو استنزاف النقدية الشهري
  cashFlowCoverageRatio: number;         // نسبة تغطية الالتزامات قصيرة الأجل بالتدفق التشغيلي
}

export interface CashFlowStatementReport {
  dateFrom?: string;
  dateTo?: string;
  periodLabel: string;
  generatedAt: string;

  // 1. Operating Activities (الأنشطة التشغيلية - الطريقة غير المباشرة)
  operatingActivities: {
    netIncomeBeforeTax: number;
    netIncomeAfterTax: number;
    depreciationAndNonCashAdjustments: CashFlowLineItem[];
    workingCapitalAdjustments: CashFlowLineItem[];
    netCashFromOperating: number;
    explanation: string;
  };

  // 2. Investing Activities (الأنشطة الاستثمارية)
  investingActivities: {
    items: CashFlowLineItem[];
    netCashFromInvesting: number;
    explanation: string;
  };

  // 3. Financing Activities (الأنشطة التمويلية)
  financingActivities: {
    items: CashFlowLineItem[];
    netCashFromFinancing: number;
    explanation: string;
  };

  // 4. Net Change and Reconciliation (خلاصة الحركة النقدية ومطابقة الأرصدة)
  netCashChange: number;
  cashAtBeginning: number;
  cashAtEnd: number;

  // Actual cash in accounts (121: 1211 الخزينة + 1212 العهد + 1213 البنوك)
  actualCashInLedger: number;
  isReconciled: boolean;
  reconciliationDifference: number;

  // Cash Flow Metrics & Ratios
  kpis: CashFlowKPIs;

  // Management Analysis & Financial Insights
  analysisNotes: {
    overallHealth: 'ممتازة' | 'جيدة ومستقرة' | 'تحتاج لمراقبة السيولة' | 'حرجة';
    operatingCashAnalysis: string;
    investingCashAnalysis: string;
    financingCashAnalysis: string;
    workingCapitalImpactAnalysis: string;
    financialRecommendations: string[];
  };
}
