export type IncomeStatementRowType = 
  | 'gross_revenue'
  | 'contra_revenue'
  | 'net_revenue'
  | 'direct_material_cost'
  | 'direct_labor_cost'
  | 'subcontracting_cost'
  | 'manufacturing_overhead'
  | 'total_cogs'
  | 'gross_profit'
  | 'selling_expense'
  | 'admin_expense'
  | 'total_opex'
  | 'operating_profit'
  | 'other_income'
  | 'financing_expense'
  | 'net_profit_before_tax'
  | 'tax_expense'
  | 'net_income';

export interface IncomeStatementAccountBreakdown {
  accountCode: string;
  accountName: string;
  amount: number;
  percentageOfNetSales: number;
  notes?: string;
}

export interface IncomeStatementItem {
  id: string;
  rowType: IncomeStatementRowType;
  title: string;
  subtitle?: string;
  amount: number;
  percentageOfNetSales: number;
  isMilestone: boolean;
  isDeduction?: boolean;
  accounts: IncomeStatementAccountBreakdown[];
}

export interface IncomeStatementSection {
  id: string;
  title: string;
  arabicTitle: string;
  description: string;
  total: number;
  percentageOfNetSales: number;
  items: IncomeStatementItem[];
}

export interface IncomeStatementKPIs {
  grossProfitMargin: number;      // هامش مجمل الربح %
  operatingProfitMargin: number;  // هامش الربح التشغيلي %
  netProfitMargin: number;        // هامش صافي الربح %
  materialCostRatio: number;      // نسبة تكلفة الخامات إلى المبيعات %
  laborCostRatio: number;         // نسبة أجور العمالة إلى المبيعات %
  overheadCostRatio: number;      // نسبة التكاليف الصناعية غير المباشرة %
  operatingExpenseRatio: number;  // نسبة المصروفات الإدارية والبيعية %
  breakEvenSales: number;         // نقطة التعادل النقدية التقديرية بالجنيه
}

export interface IncomeStatementReport {
  dateFrom?: string;
  dateTo?: string;
  periodLabel: string;
  generatedAt: string;

  // 1. Revenues
  grossSales: number;
  salesReturns: number;
  salesDiscounts: number;
  netSales: number;

  // 2. Cost of Goods Sold (COGS)
  directMaterials: number;
  directLabor: number;
  subcontracting: number;
  manufacturingOverhead: number;
  totalCogs: number;

  // Milestone 1
  grossProfit: number;

  // 3. Operating Expenses
  sellingExpenses: number;
  adminExpenses: number;
  totalOpex: number;

  // Milestone 2
  operatingProfit: number; // EBIT

  // 4. Other & Tax
  otherIncome: number;
  financingExpenses: number;
  netProfitBeforeTax: number;
  taxRatePercent: number;
  estimatedTaxAmount: number;

  // Milestone 3
  netIncome: number; // Final Net Profit / Loss

  // Sections
  sections: {
    revenues: IncomeStatementSection;
    cogs: IncomeStatementSection;
    opex: IncomeStatementSection;
    other: IncomeStatementSection;
  };

  // KPIs
  kpis: IncomeStatementKPIs;
}
