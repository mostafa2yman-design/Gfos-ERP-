import { ProductionOrder } from '../types';
import { getPurchases, getPurchaseReturns, savePurchases, savePurchaseReturns } from './purchasesStorage';
import { getSalesInvoices, getSalesReturns, saveSalesInvoices, saveSalesReturns } from './salesStorage';
import { getTreasuryTransactions, saveTreasuryTransactions } from './treasuryStorage';
import { getManualJournalEntries, saveManualJournalEntries } from './journalEngine';
import { getManualStockAdjustments } from './rawMaterialsInventory';
import { 
  getCustomersSuppliers, 
  saveCustomersSuppliers, 
  getMaterials, 
  saveMaterials, 
  getLabor, 
  saveLabor, 
  getOperationalGroups, 
  saveOperationalGroups, 
  getDepartments, 
  saveDepartments 
} from './accountingStorage';

const STORAGE_KEY = 'production_orders_v0.4';

export const getOrders = async (): Promise<ProductionOrder[]> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    
    // Sanitize corrupted orderNumber (was saved as {} due to unhandled Promise)
    return parsed.map((order: any) => {
      if (order.orderNumber && typeof order.orderNumber === 'object') {
        order.orderNumber = `GFOS-FIXED-${Math.floor(Math.random() * 10000)}`;
      }
      return order as ProductionOrder;
    });
  } catch (error) {
    console.error('Failed to parse production orders from storage:', error);
    return [];
  }
};

export const saveOrders = async (orders: ProductionOrder[]): Promise<boolean> => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error('Failed to save production orders to storage:', error);
    return false;
  }
};

export const saveOrder = async (order: ProductionOrder): Promise<{ success: boolean; error?: string }> => {
  const orders = await getOrders();
  const existingIndex = orders.findIndex(o => o.id === order.id);
  
  if (existingIndex >= 0) {
    const existingOrder = orders[existingIndex];
    const incomingVersion = order.version || 0;
    const existingVersion = existingOrder.version || 0;
    
    if (incomingVersion < existingVersion) {
      return { success: false, error: "تم تعديل هذا الأمر من مستخدم أو جهاز آخر. يجب تحديث البيانات قبل الحفظ." };
    }
  }

  const updatedOrder: ProductionOrder = {
    ...order,
    version: (order.version || 0) + 1,
    updatedAt: new Date().toISOString()
  };
  
  let updatedOrders: ProductionOrder[];
  if (existingIndex >= 0) {
    updatedOrders = [...orders];
    updatedOrders[existingIndex] = updatedOrder;
  } else {
    updatedOrders = [...orders, updatedOrder];
  }
  
  const saved = await saveOrders(updatedOrders);
  if (!saved) return { success: false, error: "فشل الحفظ" };
  
  // Dispatch custom event for cross-tab sync if necessary
  window.dispatchEvent(new Event('gfos_storage_update'));
  return { success: true };
};

export const updateOrder = saveOrder;

export const getOrderById = async (id: string): Promise<ProductionOrder | undefined> => {
  const orders = await getOrders();
  return orders.find(o => o.id === id);
};

export const deleteOrder = async (id: string): Promise<boolean> => {
  const orders = await getOrders();
  const updatedOrders = orders.filter(o => o.id !== id);
  return await saveOrders(updatedOrders);
};

export const generateOrderNumber = async (): Promise<string> => {
  try {
    const orders = await getOrders();
    const year = new Date().getFullYear();
    const yearPrefix = `PO-${year}-`;
    
    let maxSeq = 0;
    orders.forEach(o => {
      if (o.orderNumber && o.orderNumber.startsWith(yearPrefix)) {
        const seqStr = o.orderNumber.substring(yearPrefix.length);
        const seqNum = parseInt(seqStr, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${yearPrefix}${nextSeq.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Failed to generate order number:', error);
    const year = new Date().getFullYear();
    return `PO-${year}-0001`;
  }
};

export const deleteAllOrders = async (): Promise<boolean> => {
  return await saveOrders([]);
};

export const exportData = async (): Promise<string> => {
  const [
    orders, 
    purchases, 
    purchaseReturns, 
    salesInvoices, 
    salesReturns, 
    treasury, 
    manualEntries, 
    adjustments,
    customers,
    materials,
    labor,
    groups,
    departments,
    factorySettings
  ] = await Promise.all([
    getOrders(),
    Promise.resolve(getPurchases()),
    Promise.resolve(getPurchaseReturns()),
    Promise.resolve(getSalesInvoices()),
    Promise.resolve(getSalesReturns()),
    Promise.resolve(getTreasuryTransactions()),
    Promise.resolve(getManualJournalEntries()),
    Promise.resolve(getManualStockAdjustments()),
    Promise.resolve(getCustomersSuppliers()),
    Promise.resolve(getMaterials()),
    Promise.resolve(getLabor()),
    Promise.resolve(getOperationalGroups()),
    Promise.resolve(getDepartments()),
    Promise.resolve(getFactorySettings())
  ]);

  return JSON.stringify({
    schemaVersion: '1.0.0',
    applicationVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    orders,
    purchases,
    purchaseReturns,
    salesInvoices,
    salesReturns,
    treasury,
    manualEntries,
    adjustments,
    customers,
    materials,
    labor,
    groups,
    departments,
    factorySettings
  });
};

export const importData = async (jsonData: string): Promise<{ success: boolean; count?: number; error?: string }> => {
  try {
    const data = JSON.parse(jsonData);
    if (!data.orders || !Array.isArray(data.orders)) {
      return { success: false, error: "تنسيق الملف غير صحيح." };
    }
    
    // Restore orders
    const orders = data.orders as ProductionOrder[];
    await saveOrders(orders);

    // Restore other ERP modules if present in backup
    if (data.purchases && Array.isArray(data.purchases)) {
      savePurchases(data.purchases);
    }
    if (data.purchaseReturns && Array.isArray(data.purchaseReturns)) {
      savePurchaseReturns(data.purchaseReturns);
    }
    if (data.salesInvoices && Array.isArray(data.salesInvoices)) {
      saveSalesInvoices(data.salesInvoices);
    }
    if (data.salesReturns && Array.isArray(data.salesReturns)) {
      saveSalesReturns(data.salesReturns);
    }
    if (data.treasury && Array.isArray(data.treasury)) {
      saveTreasuryTransactions(data.treasury);
    }
    if (data.manualEntries && Array.isArray(data.manualEntries)) {
      saveManualJournalEntries(data.manualEntries);
    }
    if (data.adjustments && Array.isArray(data.adjustments)) {
      try {
        localStorage.setItem('raw_materials_adjustments_v1', JSON.stringify(data.adjustments));
      } catch (e) {
        console.error(e);
      }
    }
    if (data.customers && Array.isArray(data.customers)) {
      saveCustomersSuppliers(data.customers);
    }
    if (data.materials && Array.isArray(data.materials)) {
      saveMaterials(data.materials);
    }
    if (data.labor && Array.isArray(data.labor)) {
      saveLabor(data.labor);
    }
    if (data.groups && Array.isArray(data.groups)) {
      saveOperationalGroups(data.groups);
    }
    if (data.departments && Array.isArray(data.departments)) {
      saveDepartments(data.departments);
    }
    if (data.factorySettings) {
      saveFactorySettings(data.factorySettings);
    }
    
    window.dispatchEvent(new Event('gfos_storage_update'));
    window.dispatchEvent(new CustomEvent('purchases_updated'));
    window.dispatchEvent(new CustomEvent('purchase_returns_updated'));
    window.dispatchEvent(new CustomEvent('sales_invoices_updated'));
    window.dispatchEvent(new CustomEvent('sales_returns_updated'));
    window.dispatchEvent(new CustomEvent('treasury_transactions_updated'));
    window.dispatchEvent(new CustomEvent('journal_entries_updated'));
    window.dispatchEvent(new CustomEvent('raw_materials_updated'));

    return { success: true, count: orders.length };
  } catch (e) {
    return { success: false, error: "فشل استيراد الملف." };
  }
};

const FACTORY_SETTINGS_KEY = 'gfos_factory_settings';

export const getFactorySettings = (): import('../types').FactorySettings | null => {
  try {
    const data = localStorage.getItem(FACTORY_SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to parse factory settings:', error);
    return null;
  }
};

export const saveFactorySettings = (settings: import('../types').FactorySettings): boolean => {
  try {
    localStorage.setItem(FACTORY_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save factory settings:', error);
    return false;
  }
};
