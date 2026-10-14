import { MaterialItem, PurchaseInvoice, ProductionOrder } from '../types';
import { getMaterials } from './accountingStorage';
import { getPurchases, getPurchaseReturns } from './purchasesStorage';
import { getOrders } from './storage';

export type RawMaterialType = 'fabric' | 'accessory';
export type MovementType = 'in' | 'out' | 'adjustment';
export type MovementSource = 
  | 'purchase_invoice' 
  | 'purchase_return'
  | 'cut_order' 
  | 'batch_prep' 
  | 'manual_adjustment' 
  | 'initial_stock';

export interface RawMaterialMovement {
  id: string;
  materialId: string;
  materialName: string;
  materialType: RawMaterialType;
  date: string;
  type: MovementType;
  source: MovementSource;
  documentNumber: string;
  partnerName: string; // Supplier name or Order Style/Customer
  quantity: number; // positive quantity
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  operator?: string;
  orderId?: string;
  invoiceId?: string;
  balanceAfter?: number; // Calculated running balance
}

export interface ManualStockAdjustment {
  id: string;
  materialId: string;
  materialName: string;
  materialType: RawMaterialType;
  date: string;
  type: 'in' | 'out' | 'adjustment' | 'initial_stock';
  quantity: number;
  unitPrice: number;
  reason: string;
  notes?: string;
  operator?: string;
  createdAt: string;
}

export interface MaterialStockItem {
  id: string;
  name: string;
  code: string;
  type: RawMaterialType;
  unit: string;
  defaultCost: number;
  isActive: boolean;
  totalInQuantity: number;
  totalInValue: number;
  totalOutQuantity: number;
  totalOutValue: number;
  currentStock: number;
  averageCost: number;
  totalStockValue: number;
  reorderPoint: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastMovementDate?: string;
  movementsCount: number;
  movements: RawMaterialMovement[];
}

export interface WarehouseStatsSummary {
  totalItemsCount: number;
  totalStockQuantity: number;
  totalStockValue: number;
  totalInQuantity: number;
  totalInValue: number;
  totalOutQuantity: number;
  totalOutValue: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface RawMaterialsInventoryState {
  allMaterials: MaterialStockItem[];
  fabrics: MaterialStockItem[];
  accessories: MaterialStockItem[];
  overallStats: WarehouseStatsSummary;
  fabricsStats: WarehouseStatsSummary;
  accessoriesStats: WarehouseStatsSummary;
}

const ADJUSTMENTS_KEY = 'raw_materials_adjustments_v1';

export function getManualStockAdjustments(): ManualStockAdjustment[] {
  try {
    const raw = localStorage.getItem(ADJUSTMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load raw material adjustments:', e);
    return [];
  }
}

export function saveManualStockAdjustment(adj: Omit<ManualStockAdjustment, 'id' | 'createdAt'>): ManualStockAdjustment {
  const list = getManualStockAdjustments();
  const newAdj: ManualStockAdjustment = {
    ...adj,
    id: `adj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString()
  };
  list.unshift(newAdj);
  localStorage.setItem(ADJUSTMENTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('raw_materials_updated'));

  const typeText = adj.type === 'initial_stock' 
    ? 'رصيد افتتاحي' 
    : adj.type === 'in' 
    ? 'إذن إضافة وارد' 
    : adj.type === 'out' 
    ? 'إذن صرف' 
    : 'تسوية جردية';

  window.dispatchEvent(new CustomEvent('inventory_stock_updated', {
    detail: {
      message: `تم تحديث رصيد المخزون بنجاح (${typeText} - ${adj.materialName} بمقدار ${adj.quantity})`,
      title: 'تحديث المخزون'
    }
  }));

  return newAdj;
}

export function deleteManualStockAdjustment(id: string): void {
  const list = getManualStockAdjustments();
  const filtered = list.filter(item => item.id !== id);
  localStorage.setItem(ADJUSTMENTS_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('raw_materials_updated'));
  window.dispatchEvent(new CustomEvent('inventory_stock_updated', {
    detail: {
      message: 'تم حذف حركة تسوية المخزون وتحديث الأرصدة بنجاح',
      title: 'تحديث المخزون'
    }
  }));
}

export function deleteAllManualStockAdjustments(): void {
  localStorage.setItem(ADJUSTMENTS_KEY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('raw_materials_updated'));
  window.dispatchEvent(new CustomEvent('inventory_stock_updated', {
    detail: {
      message: 'تم تصفير كافة تسويات المخزون بنجاح',
      title: 'تحديث المخزون'
    }
  }));
}

/**
 * Calculates complete warehouse inventory, inbound and outbound transactions,
 * unit costs, values, and separated statistics for fabrics and accessories.
 */
export async function calculateRawMaterialsInventory(): Promise<RawMaterialsInventoryState> {
  const catalog = getMaterials();
  const purchases = getPurchases();
  const purchaseReturns = getPurchaseReturns();
  const orders = await getOrders();
  const adjustments = getManualStockAdjustments();

  // Create dictionary for materials
  const materialMap = new Map<string, MaterialStockItem>();

  // Initialize catalog materials
  catalog.forEach(cat => {
    const rawType: RawMaterialType = cat.type === 'fabric' ? 'fabric' : 'accessory';
    materialMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      code: cat.code || (rawType === 'fabric' ? `FAB-${cat.id.substring(4)}` : `ACC-${cat.id.substring(4)}`),
      type: rawType,
      unit: cat.unit || (rawType === 'fabric' ? 'كجم' : 'قطعة'),
      defaultCost: Number(cat.defaultCost || 0),
      isActive: cat.isActive !== false,
      totalInQuantity: 0,
      totalInValue: 0,
      totalOutQuantity: 0,
      totalOutValue: 0,
      currentStock: 0,
      averageCost: Number(cat.defaultCost || 0),
      totalStockValue: 0,
      reorderPoint: rawType === 'fabric' ? 50 : 20, // default alert thresholds
      status: 'in_stock',
      movementsCount: 0,
      movements: []
    });
  });

  // Helper to ensure a material exists in map (if referenced by invoice/order but not yet in catalog)
  const getOrCreateMaterial = (id: string, name: string, type: string, unit: string, defaultPrice: number = 0): MaterialStockItem => {
    let existing = materialMap.get(id);
    if (!existing) {
      // Try finding by name
      for (const item of materialMap.values()) {
        if (item.name.trim().toLowerCase() === name.trim().toLowerCase()) {
          return item;
        }
      }
      const rawType: RawMaterialType = type === 'fabric' || name.includes('قماش') ? 'fabric' : 'accessory';
      existing = {
        id: id || `mat_custom_${Date.now()}`,
        name: name,
        code: rawType === 'fabric' ? `FAB-GEN` : `ACC-GEN`,
        type: rawType,
        unit: unit || (rawType === 'fabric' ? 'كجم' : 'قطعة'),
        defaultCost: defaultPrice,
        isActive: true,
        totalInQuantity: 0,
        totalInValue: 0,
        totalOutQuantity: 0,
        totalOutValue: 0,
        currentStock: 0,
        averageCost: defaultPrice,
        totalStockValue: 0,
        reorderPoint: rawType === 'fabric' ? 50 : 20,
        status: 'in_stock',
        movementsCount: 0,
        movements: []
      };
      materialMap.set(existing.id, existing);
    }
    return existing;
  };

  // 1. Process INBOUND movements from Purchase Invoices
  purchases.forEach(inv => {
    // Only process invoices that have items
    if (!inv.items || inv.items.length === 0) return;

    inv.items.forEach(item => {
      const mat = getOrCreateMaterial(
        item.materialId, 
        item.materialName, 
        item.materialType, 
        item.unit, 
        item.unitPrice
      );

      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const total = Number(item.total) || (qty * unitPrice);

      mat.movements.push({
        id: `mov_in_${inv.id}_${item.id}`,
        materialId: mat.id,
        materialName: mat.name,
        materialType: mat.type,
        date: inv.date || inv.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        type: 'in',
        source: 'purchase_invoice',
        documentNumber: inv.invoiceNumber || `PUR-${inv.id}`,
        partnerName: inv.supplierName || 'مورد عام',
        quantity: qty,
        unit: item.unit || mat.unit,
        unitPrice: unitPrice,
        totalPrice: total,
        notes: item.notes || inv.notes,
        invoiceId: inv.id,
      });
    });
  });

  // 1.B Process OUTBOUND movements from Purchase Returns (ارتجاع خامات ومستلزمات للموردين)
  purchaseReturns.forEach(ret => {
    if (!ret.stockReturned || !ret.items || ret.items.length === 0) return;

    ret.items.forEach(item => {
      const mat = getOrCreateMaterial(
        item.materialId,
        item.materialName,
        item.materialType,
        item.unit,
        item.unitPrice
      );

      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const total = Number(item.total) || (qty * unitPrice);

      mat.movements.push({
        id: `mov_out_pret_${ret.id}_${item.id}`,
        materialId: mat.id,
        materialName: mat.name,
        materialType: mat.type,
        date: ret.date || ret.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        type: 'out',
        source: 'purchase_return',
        documentNumber: ret.returnNumber || `PRET-${ret.id}`,
        partnerName: ret.supplierName || 'مورد عام',
        quantity: qty,
        unit: item.unit || mat.unit,
        unitPrice: unitPrice,
        totalPrice: total,
        notes: item.notes || ret.notes || `إذن مرتجع مشتريات للمورد - فاتورة ${ret.originalInvoiceNumber}`,
        invoiceId: ret.originalInvoiceId
      });
    });
  });

  // 2. Process OUTBOUND movements from Production Orders
  orders.forEach(order => {
    // A. Fabrics consumed in Cut Orders (يتم الخصم فقط عند اعتماد القص الفعلي)
    const isCutApproved = Boolean(
      order.cutApprovedAt || 
      order.cutData?.approvedAt || 
      ['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'].includes(order.status)
    );

    if (isCutApproved && order.cutData) {
      const cutDate = order.cutData.weightDate || 
                      order.cutApprovedAt?.split('T')[0] || 
                      order.orderDate || 
                      order.createdAt?.split('T')[0] || 
                      new Date().toISOString().split('T')[0];

      // Find which fabric was used
      const targetFabricName = order.cutData.actualFabricName || 
                               (order.materials && order.materials[0]?.name) || 
                               'قماش قطن سنجل جيرسي 100%';

      const mat = getOrCreateMaterial(
        order.materials?.[0]?.id || 'mat_1',
        targetFabricName,
        'fabric',
        order.cutData.weightUnit || 'كجم',
        order.materials?.[0]?.standardPrice || 0
      );

      // Check if actual weight by color exists
      if (order.cutData.actualWeightByColor && Object.keys(order.cutData.actualWeightByColor).length > 0) {
        Object.entries(order.cutData.actualWeightByColor).forEach(([color, weight]) => {
          const qty = Number(weight) || 0;
          if (qty > 0) {
            const unitPrice = mat.defaultCost || order.materials?.[0]?.standardPrice || 200;
            mat.movements.push({
              id: `mov_cut_${order.id}_${color}`,
              materialId: mat.id,
              materialName: mat.name,
              materialType: 'fabric',
              date: cutDate,
              type: 'out',
              source: 'cut_order',
              documentNumber: `أمر قص ${order.cutData?.cutOrderNumber || order.orderNumber}`,
              partnerName: `${order.orderNumber} - ${order.styleName} (${color})`,
              quantity: qty,
              unit: order.cutData?.weightUnit || mat.unit,
              unitPrice: unitPrice,
              totalPrice: qty * unitPrice,
              notes: `صرف وخصم قماش فعلي معتمد للقص: لون ${color} بموديل ${order.styleName}`,
              operator: order.cutData?.cutterName || order.cutData?.weightUser || order.cutApprovedBy,
              orderId: order.id
            });
          }
        });
      } else if (Number(order.cutData.actualWeight) > 0) {
        const qty = Number(order.cutData.actualWeight);
        const unitPrice = mat.defaultCost || order.materials?.[0]?.standardPrice || 200;
        mat.movements.push({
          id: `mov_cut_${order.id}`,
          materialId: mat.id,
          materialName: mat.name,
          materialType: 'fabric',
          date: cutDate,
          type: 'out',
          source: 'cut_order',
          documentNumber: `أمر قص ${order.cutData?.cutOrderNumber || order.orderNumber}`,
          partnerName: `${order.orderNumber} - ${order.styleName}`,
          quantity: qty,
          unit: order.cutData?.weightUnit || mat.unit,
          unitPrice: unitPrice,
          totalPrice: qty * unitPrice,
          notes: `صرف وخصم قماش فعلي معتمد للقص لأمر الإنتاج ${order.orderNumber}`,
          operator: order.cutData?.cutterName || order.cutData?.weightUser || order.cutApprovedBy,
          orderId: order.id
        });
      }
    }

    // B. Accessories consumed in Batches / Prep (يتم الخصم فقط عند اعتماد التجهيز)
    const isPrepApproved = Boolean(
      order.prepApprovedAt || 
      ['التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'الخياطة مكتملة', 'التشطيب جاري', 'التشطيب مكتمل', 'المكواة جاري', 'المكواة مكتملة', 'التغليف معتمد', 'مغلق'].includes(order.status) ||
      (order.batches && order.batches.some(b => b.prepApprovedAt || b.prepStatus === 'مكتمل'))
    );

    if (isPrepApproved && order.batches && order.batches.length > 0) {
      order.batches.forEach(batch => {
        if (batch.accessoriesPrep && batch.accessoriesPrep.length > 0) {
          batch.accessoriesPrep.forEach(prepItem => {
            let consumedQty = Number(prepItem.actualPrepared);
            if (!consumedQty || consumedQty <= 0) {
              if (prepItem.isPrepared || batch.prepStatus === 'مكتمل' || batch.prepApprovedAt || order.prepApprovedAt) {
                const matchedAcc = (order.accessories || []).find((a: any) => a.id === prepItem.accessoryId || a.name === prepItem.accessoryName);
                if (matchedAcc) {
                  let batchCalculated = 0;
                  (batch.sizes || []).forEach((sData: any) => {
                    let sizePieces = (sData.variants || []).reduce((sum: number, v: any) => sum + (Number(v.quantity) || 0), 0);
                    let std = 0;
                    if (matchedAcc.standardMethod === 'موحد') {
                      std = Number(matchedAcc.unifiedStandard) || 0;
                    } else {
                      const sStd = (matchedAcc.sizeStandards || []).find((ss: any) => ss.size === sData.size);
                      std = Number(sStd?.standard) || 0;
                    }
                    batchCalculated += (sizePieces * std);
                  });
                  consumedQty = batchCalculated > 0 ? batchCalculated : (Number(prepItem.requiredQuantity) || 1);
                } else {
                  consumedQty = Number(prepItem.requiredQuantity) || 1;
                }
              }
            }

            if (consumedQty > 0) {
              const matchedAcc = (order.accessories || []).find((a: any) => a.id === prepItem.accessoryId || a.name === prepItem.accessoryName);
              const actualAccName = prepItem.actualAccessoryName || prepItem.accessoryName;
              const mat = getOrCreateMaterial(
                prepItem.accessoryId,
                actualAccName,
                'accessory',
                prepItem.unit || 'قطعة',
                Number((matchedAcc as any)?.unitPrice) || Number(matchedAcc?.standardPrice) || 15
              );

              const prepDate = prepItem.preparedAt?.split('T')[0] || 
                               batch.prepApprovedAt?.split('T')[0] || 
                               order.orderDate || 
                               new Date().toISOString().split('T')[0];

              const unitPrice = mat.defaultCost || Number((matchedAcc as any)?.unitPrice) || Number(matchedAcc?.standardPrice) || 15;

              mat.movements.push({
                id: `mov_acc_${order.id}_${batch.id}_${prepItem.accessoryId}`,
                materialId: mat.id,
                materialName: mat.name,
                materialType: 'accessory',
                date: prepDate,
                type: 'out',
                source: 'batch_prep',
                documentNumber: `أمر إنتاج ${order.orderNumber}`,
                partnerName: `باتش ${batch.batchNumber} (${order.styleName})`,
                quantity: consumedQty,
                unit: prepItem.unit || mat.unit,
                unitPrice: unitPrice,
                totalPrice: Math.round(consumedQty * unitPrice * 100) / 100,
                notes: `صرف وتجهيز إكسسوارات فعلية لباتش ${batch.batchNumber}${prepItem.waste ? ` (هالك: ${prepItem.waste})` : ''}`,
                operator: prepItem.preparedBy || batch.prepApprovedBy || order.prepApprovedBy,
                orderId: order.id
              });
            }
          });
        }
      });
    }
  });

  // 3. Process Manual Stock Adjustments and Initial Stock
  adjustments.forEach(adj => {
    const mat = getOrCreateMaterial(
      adj.materialId,
      adj.materialName,
      adj.materialType,
      'قطعة',
      adj.unitPrice
    );

    const isOut = adj.type === 'out';
    const isIn = adj.type === 'in' || adj.type === 'initial_stock';

    mat.movements.push({
      id: `mov_adj_${adj.id}`,
      materialId: mat.id,
      materialName: mat.name,
      materialType: mat.type,
      date: adj.date,
      type: isOut ? 'out' : 'in',
      source: adj.type === 'initial_stock' ? 'initial_stock' : 'manual_adjustment',
      documentNumber: adj.type === 'initial_stock' ? 'رصيد افتتاحي' : `إذن تسوية #${adj.id.slice(-4)}`,
      partnerName: adj.reason || (adj.type === 'initial_stock' ? 'مخزون أول المدة' : 'تسوية مخزنية'),
      quantity: Number(adj.quantity) || 0,
      unit: mat.unit,
      unitPrice: Number(adj.unitPrice) || mat.defaultCost,
      totalPrice: (Number(adj.quantity) || 0) * (Number(adj.unitPrice) || mat.defaultCost),
      notes: adj.notes || adj.reason,
      operator: adj.operator || 'أمين المخزن'
    });
  });

  // 4. Calculate Running Balances, Totals, and Weighted Average Costs for Each Material
  const allMaterialsList: MaterialStockItem[] = [];

  materialMap.forEach(mat => {
    // Sort movements chronologically (earliest first for running balance)
    mat.movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    let sumInQty = 0;
    let sumInVal = 0;
    let sumOutQty = 0;
    let sumOutVal = 0;

    mat.movements.forEach(mov => {
      if (mov.type === 'in') {
        runningBalance += mov.quantity;
        sumInQty += mov.quantity;
        sumInVal += mov.totalPrice;
      } else {
        runningBalance -= mov.quantity;
        sumOutQty += mov.quantity;
        sumOutVal += mov.totalPrice;
      }
      mov.balanceAfter = runningBalance;
    });

    // Invert movements array for UI presentation (latest movements first)
    mat.movements.reverse();

    mat.totalInQuantity = sumInQty;
    mat.totalInValue = sumInVal;
    mat.totalOutQuantity = sumOutQty;
    mat.totalOutValue = sumOutVal;
    mat.currentStock = runningBalance;

    // Weighted average cost from inbound, or fallback to default catalog cost
    if (sumInQty > 0 && sumInVal > 0) {
      mat.averageCost = Math.round((sumInVal / sumInQty) * 100) / 100;
    } else {
      mat.averageCost = mat.defaultCost || 0;
    }

    mat.totalStockValue = Math.max(0, Math.round(mat.currentStock * mat.averageCost));
    mat.movementsCount = mat.movements.length;
    mat.lastMovementDate = mat.movements[0]?.date;

    if (mat.currentStock <= 0) {
      mat.status = 'out_of_stock';
    } else if (mat.currentStock <= mat.reorderPoint) {
      mat.status = 'low_stock';
    } else {
      mat.status = 'in_stock';
    }

    allMaterialsList.push(mat);
  });

  // Separate Fabrics vs Accessories
  const fabrics = allMaterialsList.filter(m => m.type === 'fabric');
  const accessories = allMaterialsList.filter(m => m.type === 'accessory');

  // Helper to build warehouse stats
  const buildStats = (list: MaterialStockItem[]): WarehouseStatsSummary => {
    return {
      totalItemsCount: list.length,
      totalStockQuantity: list.reduce((acc, m) => acc + Math.max(0, m.currentStock), 0),
      totalStockValue: list.reduce((acc, m) => acc + m.totalStockValue, 0),
      totalInQuantity: list.reduce((acc, m) => acc + m.totalInQuantity, 0),
      totalInValue: list.reduce((acc, m) => acc + m.totalInValue, 0),
      totalOutQuantity: list.reduce((acc, m) => acc + m.totalOutQuantity, 0),
      totalOutValue: list.reduce((acc, m) => acc + m.totalOutValue, 0),
      inStockCount: list.filter(m => m.status === 'in_stock').length,
      lowStockCount: list.filter(m => m.status === 'low_stock').length,
      outOfStockCount: list.filter(m => m.status === 'out_of_stock').length,
    };
  };

  const overallStats = buildStats(allMaterialsList);
  const fabricsStats = buildStats(fabrics);
  const accessoriesStats = buildStats(accessories);

  return {
    allMaterials: allMaterialsList,
    fabrics,
    accessories,
    overallStats,
    fabricsStats,
    accessoriesStats
  };
}
