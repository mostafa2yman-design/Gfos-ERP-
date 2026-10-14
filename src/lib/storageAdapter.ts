import { ProductionOrder } from '../types';

export interface StorageAdapter {
  getOrders(): Promise<ProductionOrder[]>;
  getOrderById(id: string): Promise<ProductionOrder | undefined>;
  saveOrder(order: ProductionOrder): Promise<{ success: boolean; error?: string }>;
  deleteOrder(id: string): Promise<boolean>;
  deleteAllOrders(): Promise<boolean>;
}

// Local Storage Implementation with Versioning
const STORAGE_KEY = 'production_orders_v0.4';

export class LocalStorageAdapter implements StorageAdapter {
  async getOrders(): Promise<ProductionOrder[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed as ProductionOrder[];
    } catch (error) {
      console.error('Failed to parse production orders from storage:', error);
      return [];
    }
  }

  async getOrderById(id: string): Promise<ProductionOrder | undefined> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === id);
  }

  async saveOrder(order: ProductionOrder): Promise<{ success: boolean; error?: string }> {
    const orders = await this.getOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);
    
    // Optimistic Concurrency Check
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
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      // Notify other tabs if we are using localStorage
      window.dispatchEvent(new Event('gfos_storage_update'));
      return { success: true };
    } catch (error) {
      return { success: false, error: "فشل الحفظ في التخزين المحلي." };
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    const orders = await this.getOrders();
    const updatedOrders = orders.filter(o => o.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      return true;
    } catch {
      return false;
    }
  }

  async deleteAllOrders(): Promise<boolean> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return true;
    } catch {
      return false;
    }
  }
}

// TODO: Implement SupabaseAdapter if environment variables are present
export const storage: StorageAdapter = new LocalStorageAdapter();
