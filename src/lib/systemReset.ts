import { getOrders, saveOrders } from './storage';
import { getPurchases, getPurchaseReturns, deleteAllPurchases } from './purchasesStorage';
import { getSalesInvoices, getSalesReturns, deleteAllSales } from './salesStorage';
import { getTreasuryTransactions, deleteAllTreasuryTransactions } from './treasuryStorage';
import { getManualJournalEntries, saveManualJournalEntries } from './journalEngine';
import { getManualStockAdjustments, deleteAllManualStockAdjustments } from './rawMaterialsInventory';
import { getSystemApprovalLogs, deleteAllSystemApprovalLogs, recordSystemApproval } from './auditStorage';
import { 
  getCustomersSuppliers, 
  getMaterials, 
  getLabor, 
  getOperationalGroups, 
  getDepartments,
  deleteAllCustomersSuppliers,
  deleteAllMaterials,
  deleteAllLabor,
  deleteAllOperationalGroups,
  deleteAllDepartments,
  resetAccountsToManufacturingCOA
} from './accountingStorage';
import { getAllBackups, deleteAllBackups } from './backupManager';

export interface SystemDataCounts {
  ordersCount: number;
  salesCount: number;
  purchasesCount: number;
  treasuryCount: number;
  journalCount: number;
  adjustmentsCount: number;
  auditCount: number;
  customersCount: number;
  materialsCount: number;
  laborCount: number;
  groupsCount: number;
  departmentsCount: number;
  backupsCount: number;
  totalOperationalRecords: number;
}

export interface SystemResetOptions {
  resetOrders?: boolean;
  resetSales?: boolean;
  resetPurchases?: boolean;
  resetTreasury?: boolean;
  resetJournalEntries?: boolean;
  resetStockAdjustments?: boolean;
  resetAuditLogs?: boolean;
  resetEventLogs?: boolean;
  resetBackups?: boolean;
  resetMasterData?: boolean;
  resetChartOfAccounts?: boolean;
  resetFactorySettings?: boolean;
}

export const DEFAULT_RESET_OPTIONS: SystemResetOptions = {
  resetOrders: true,
  resetSales: true,
  resetPurchases: true,
  resetTreasury: true,
  resetJournalEntries: true,
  resetStockAdjustments: true,
  resetAuditLogs: true,
  resetEventLogs: true,
  resetBackups: true,
  resetMasterData: true,
  resetChartOfAccounts: true,
  resetFactorySettings: true
};

/**
 * Returns complete snapshot of data counts across all ERP modules
 */
export async function getSystemDataCounts(): Promise<SystemDataCounts> {
  try {
    const [orders, backups] = await Promise.all([
      getOrders(),
      getAllBackups().catch(() => [])
    ]);

    const salesInvoices = getSalesInvoices();
    const salesReturns = getSalesReturns();
    const purchases = getPurchases();
    const purchaseReturns = getPurchaseReturns();
    const treasury = getTreasuryTransactions();
    const manualEntries = getManualJournalEntries();
    const adjustments = getManualStockAdjustments();
    const auditLogs = getSystemApprovalLogs();

    const customers = getCustomersSuppliers();
    const materials = getMaterials();
    const labor = getLabor();
    const groups = getOperationalGroups();
    const depts = getDepartments();

    const ordersCount = orders.length;
    const salesCount = salesInvoices.length + salesReturns.length;
    const purchasesCount = purchases.length + purchaseReturns.length;
    const treasuryCount = treasury.length;
    const journalCount = manualEntries.length;
    const adjustmentsCount = adjustments.length;
    const auditCount = auditLogs.length;

    const totalOperationalRecords = 
      ordersCount + salesCount + purchasesCount + treasuryCount + journalCount + adjustmentsCount + auditCount;

    return {
      ordersCount,
      salesCount,
      purchasesCount,
      treasuryCount,
      journalCount,
      adjustmentsCount,
      auditCount,
      customersCount: customers.length,
      materialsCount: materials.length,
      laborCount: labor.length,
      groupsCount: groups.length,
      departmentsCount: depts.length,
      backupsCount: backups.length,
      totalOperationalRecords
    };
  } catch (err) {
    console.error('Failed to get system data counts:', err);
    return {
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
    };
  }
}

/**
 * Executes a full system zero-out and reset according to options
 */
export async function resetEntireSystem(
  userOptions: Partial<SystemResetOptions> = {}
): Promise<{ success: boolean; clearedCounts: SystemDataCounts; error?: string }> {
  const options: SystemResetOptions = {
    ...DEFAULT_RESET_OPTIONS,
    ...userOptions
  };

  try {
    // Snapshot counts before reset
    const countsBefore = await getSystemDataCounts();

    // 1. Reset Orders
    if (options.resetOrders) {
      await saveOrders([]);
    }

    // 2. Reset Purchases (Invoices & Returns)
    if (options.resetPurchases) {
      deleteAllPurchases();
    }

    // 3. Reset Sales (Invoices & Returns)
    if (options.resetSales) {
      deleteAllSales();
    }

    // 4. Reset Treasury (Cash receipts and payments)
    if (options.resetTreasury) {
      deleteAllTreasuryTransactions();
    }

    // 5. Reset Manual Journal Entries
    if (options.resetJournalEntries) {
      saveManualJournalEntries([]);
    }

    // 6. Reset Raw Materials Stock Adjustments
    if (options.resetStockAdjustments) {
      deleteAllManualStockAdjustments();
    }

    // 7. Reset Event Logs
    if (options.resetEventLogs) {
      try {
        localStorage.setItem('gfos_event_log', JSON.stringify([]));
      } catch (e) {
        console.error(e);
      }
    }

    // 8. Reset Custom Sizes & Colors
    try {
      localStorage.removeItem('CUSTOM_SIZES');
      localStorage.removeItem('CUSTOM_COLORS');
    } catch (e) {
      console.error(e);
    }

    // 9. Reset Master Data if requested
    if (options.resetMasterData) {
      deleteAllCustomersSuppliers();
      deleteAllMaterials();
      deleteAllLabor();
      deleteAllOperationalGroups();
      deleteAllDepartments();
    }

    // 10. Reset Chart of Accounts if requested
    if (options.resetChartOfAccounts) {
      resetAccountsToManufacturingCOA();
    }

    // 11. Reset Factory Settings & Configurations if requested
    if (options.resetFactorySettings) {
      try {
        localStorage.removeItem('gfos_factory_settings');
        localStorage.removeItem('gfos_financial_config');
        localStorage.removeItem('gfos_barcode_custom_settings');
      } catch (e) {
        console.error(e);
      }
    }

    // 12. Reset Local Backups in IndexedDB if requested
    if (options.resetBackups) {
      try {
        await deleteAllBackups();
      } catch (e) {
        console.error('Failed to clear backups:', e);
      }
    }

    // 13. Audit Approval Logs: Clear and record initial clean stamp
    if (options.resetAuditLogs) {
      deleteAllSystemApprovalLogs();
      try {
        recordSystemApproval({
          actionType: 'journal_entry',
          documentId: 'INIT-001',
          documentNumber: 'SYS-RESET',
          title: 'تهيئة وتصفير النظام الشامل (System Reset)',
          details: `تم تصفير كافة حركات وأوامر وبيانات النظام بنجاح بواسطة أمر RESET (تم تصفير ${countsBefore.totalOperationalRecords} سجلاً تشغيلياً).`,
          amount: 0
        });
      } catch (e) {
        console.error('Failed to record system reset audit log:', e);
      }
    }

    // 14. Dispatch all synchronization events across the app
    window.dispatchEvent(new Event('gfos_storage_update'));
    window.dispatchEvent(new CustomEvent('purchases_updated'));
    window.dispatchEvent(new CustomEvent('purchase_returns_updated'));
    window.dispatchEvent(new CustomEvent('sales_invoices_updated'));
    window.dispatchEvent(new CustomEvent('sales_returns_updated'));
    window.dispatchEvent(new CustomEvent('treasury_transactions_updated'));
    window.dispatchEvent(new CustomEvent('journal_entries_updated'));
    window.dispatchEvent(new CustomEvent('raw_materials_updated'));
    window.dispatchEvent(new CustomEvent('approval_logged'));
    window.dispatchEvent(new CustomEvent('accounting_accounts_updated'));
    window.dispatchEvent(new Event('storage'));

    return {
      success: true,
      clearedCounts: countsBefore
    };
  } catch (error: any) {
    console.error('Fatal error during system reset:', error);
    return {
      success: false,
      clearedCounts: await getSystemDataCounts(),
      error: error?.message || 'حدث خطأ غير متوقع أثناء تصفير النظام'
    };
  }
}
