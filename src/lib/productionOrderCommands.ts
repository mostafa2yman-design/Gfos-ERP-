import { eventBus } from "./events";
import { ProductionOrder, SizeData, Variant, CutOrderData, BatchItem } from '../types';
import { saveOrder as persistOrder, getOrderById, deleteOrder as removeOrderFromStorage, getOrders } from './storage';
import { ensureOrderFinishingBarcodes } from './barcodeSettings';
import { recordSystemApproval } from './auditStorage';
import { getActiveSessionUser } from './usersStorage';

function getApprover(user?: string) {
  const activeUser = getActiveSessionUser();
  const userName = user && user !== 'المستخدم الحالي' ? user : (activeUser.fullName || activeUser.username || 'المسؤول المعتمد');
  return {
    name: userName,
    activeUser
  };
}

export type CommandResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function canEditProductionOrder(order: ProductionOrder): boolean {
  return order.status === 'مسودة';
}

export function canDeleteProductionOrder(order: ProductionOrder): boolean {
  return ['مسودة', 'أمر إنتاج معتمد', 'أمر قص', 'القص الفعلي مدخل'].includes(order.status);
}

export async function deleteProductionOrder(order: ProductionOrder): Promise<CommandResult<null>> {
  if (!canDeleteProductionOrder(order)) {
    return { success: false, error: 'لا يمكن حذف أمر الإنتاج في حالته الحالية.' };
  }
  const deleted = await removeOrderFromStorage(order.id);
  if (!deleted) {
    return { success: false, error: 'تعذر حذف أمر الإنتاج، حاول مرة أخرى.' };
  }
  
  const verifiedOrder = await getOrderById(order.id);
  if (verifiedOrder) {
    return { success: false, error: 'تمت محاولة الحذف لكن الأمر لا يزال موجوداً.' };
  }
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "ProductionOrderDeleted",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { orderNumber: order.orderNumber }
  });
  return { success: true, data: null };
}

export async function saveDraft(order: ProductionOrder): Promise<CommandResult<ProductionOrder>> {
  if (!canEditProductionOrder(order)) {
    return { success: false, error: 'لا يمكن حفظ التعديلات لأن الأمر ليس مسودة.' };
  }
  
  // Check if it's new
  const existing = await getOrderById(order.id);
  const isNew = !existing;

  // Guarantee no approval fields are set when saving as a draft
  const orderToSave: ProductionOrder = { 
    ...order, 
    status: 'مسودة' as const,
    productionApprovedBy: undefined,
    productionApprovedAt: undefined,
    materialsApprovedBy: undefined,
    materialsApprovedAt: undefined
  };
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) {
    return { success: false, error: savedResult.error || 'تعذر حفظ الأمر كمسودة، حاول مرة أخرى.' };
  }
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) {
    return { success: false, error: 'تم الحفظ لكن تعذر استرجاع البيانات المؤكدة.' };
  }
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: isNew ? "ProductionOrderCreated" : "ProductionOrderSaved",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export async function approveProductionOrder(order: ProductionOrder, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  if (order.status !== 'مسودة') {
    return { success: false, error: 'لا يمكن الاعتماد إلا إذا كان مسودة.' };
  }
  
  if (!order.sizes || order.sizes.length === 0) {
    return { success: false, error: 'يجب إضافة مقاس واحد على الأقل للاعتماد.' };
  }
  
  const approver = getApprover(user);
  const now = new Date().toISOString();
  const orderToSave: ProductionOrder = {
    ...order,
    status: 'أمر إنتاج معتمد',
    productionApprovedBy: approver.name,
    productionApprovedAt: now,
    materialsApprovedBy: approver.name,
    materialsApprovedAt: now
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) {
    return { success: false, error: savedResult.error || 'تعذر حفظ الاعتماد.' };
  }
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) {
    return { success: false, error: 'تم الاعتماد لكن تعذر استرجاع البيانات المؤكدة.' };
  }
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "ProductionOrderApproved",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  try {
    recordSystemApproval({
      actionType: 'production_order',
      documentId: order.id,
      documentNumber: order.orderNumber,
      title: `اعتماد أمر إنتاج جديد ${order.orderNumber}`,
      details: `تم اعتماد أمر التشغيل وقائمة المواد والمقاسات للموديل "${order.styleName}" للعميل "${order.customerName}" بواسطة ${approver.name}`,
      counterpartyName: order.customerName,
      costCenter: order.styleName || 'تخطيط الإنتاج',
      stageName: 'أمر الإنتاج والخامات',
      notes: `حالة أمر الإنتاج: أمر إنتاج معتمد`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  return { success: true, data: verifiedOrder };
}

// Cut commands
export async function saveCutData(order: ProductionOrder, cutData: CutOrderData): Promise<CommandResult<ProductionOrder>> {
  if (['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'مغلق'].includes(order.status)) {
    return { success: false, error: 'لا يمكن تعديل القص الفعلي بعد الاعتماد.' };
  }
  
  const orderToSave: ProductionOrder = {
    ...order,
    cutData,
    status: order.status === 'أمر إنتاج معتمد' || order.status === 'أمر قص' ? 'القص الفعلي مدخل' : order.status
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ أمر القص.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "CutActualEntered",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export async function approveCutOrder(order: ProductionOrder, cutData: CutOrderData, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  const approver = getApprover(user);
  const now = new Date().toISOString();
  const orderToSave: ProductionOrder = {
    ...order,
    cutApprovedBy: approver.name,
    cutApprovedAt: now,
    cutData: {
      ...cutData,
      approvedBy: approver.name,
      approvedAt: now
    },
    status: 'القص معتمد'
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ اعتماد أمر القص.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "CutOrderApproved",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  const totalCutPieces = (cutData.sizes || []).reduce((acc, s) => acc + (s.variants || []).reduce((vAcc, v) => vAcc + (Number(v.actualQuantity) || 0), 0), 0);
  try {
    recordSystemApproval({
      actionType: 'production_stage_cut',
      documentId: order.id,
      documentNumber: order.orderNumber,
      title: `اعتماد كارت القص الفعلي لأمر الإنتاج ${order.orderNumber}`,
      details: `تم اعتماد كميات القص الفعلي بإجمالي ${totalCutPieces} قطعة واستهلاك الأقمشة للموديل "${order.styleName}" بواسطة ${approver.name}`,
      quantity: totalCutPieces,
      counterpartyName: order.customerName,
      costCenter: order.styleName || 'عنبر القص',
      stageName: 'القص الفعلي',
      notes: `رقم كارت القص: ${order.orderNumber}`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  return { success: true, data: verifiedOrder };
}

// Batches commands
export async function saveBatches(order: ProductionOrder, batches: BatchItem[], splitMethod: string): Promise<CommandResult<ProductionOrder>> {
  const orderToSave: ProductionOrder = {
    ...order,
    batches,
    batchSplitMethod: splitMethod as any
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ الباتشات.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "BatchSplitCompleted",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export async function lockBatches(order: ProductionOrder, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  const approver = getApprover(user);
  const orderToSave: ProductionOrder = {
    ...order,
    batchesLockedBy: approver.name,
    batchesLockedAt: new Date().toISOString(),
    status: 'الباتشات مثبتة'
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ تثبيت الباتشات.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  
  eventBus.publish({
    id: crypto.randomUUID(),
    type: "BatchesLocked",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  const totalPieces = (order.batches || []).reduce((acc, b) => {
    return acc + (b.sizes || []).reduce((sAcc, s) => sAcc + (s.variants || []).reduce((vAcc, v) => vAcc + (Number(v.quantity) || 0), 0), 0);
  }, 0);

  try {
    recordSystemApproval({
      actionType: 'production_stage_batches',
      documentId: order.id,
      documentNumber: order.orderNumber,
      title: `اعتماد وتثبيت تشغيلات الباتشات للأمر ${order.orderNumber}`,
      details: `تم اعتماد وتثبيت خطة تشغيل عدد ${order.batches?.length || 0} باتش بإجمالي كمية ${totalPieces} قطعة بواسطة ${approver.name}`,
      quantity: totalPieces,
      counterpartyName: order.customerName,
      costCenter: order.styleName || 'تخطيط وتشغيل الباتشات',
      stageName: 'تقسيم الباتشات',
      notes: `طريقة التقسيم: ${order.batchSplitMethod || 'افتراضي'}`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  return { success: true, data: verifiedOrder };
}

export function addSize(order: ProductionOrder, sizeName: string): ProductionOrder {
  const newSize: SizeData = {
    size: sizeName,
    variants: []
  };
  
  const updatedOrder = {
    ...order,
    sizes: [...order.sizes, newSize]
  };
  
  return updatedOrder;
}

export function removeSize(order: ProductionOrder, sizeName: string): ProductionOrder {
  const updatedOrder = {
    ...order,
    sizes: order.sizes.filter(s => s.size !== sizeName)
  };
  return updatedOrder;
}

export function copySize(order: ProductionOrder, sourceSizeName: string, targetSizeName: string): ProductionOrder {
  const sourceSize = order.sizes.find(s => s.size === sourceSizeName);
  if (!sourceSize) return order;
  
  const copiedVariants: Variant[] = sourceSize.variants.map(v => ({
    ...v,
  }));
  
  const newSize: SizeData = {
    size: targetSizeName,
    variants: copiedVariants
  };
  
  const updatedOrder = {
    ...order,
    sizes: [...order.sizes, newSize]
  };
  return updatedOrder;
}

export function addVariant(order: ProductionOrder, sizeName: string, color: string, quantity: number): ProductionOrder {
  return {
    ...order,
    sizes: order.sizes.map(size => {
      if (size.size === sizeName) {
        const newVariant: Variant = {
          color,
          quantity
        };
        return { ...size, variants: [...size.variants, newVariant] };
      }
      return size;
    })
  };
}

export function removeVariant(order: ProductionOrder, sizeName: string, variantIndex: number): ProductionOrder {
  return {
    ...order,
    sizes: order.sizes.map(size => {
      if (size.size === sizeName) {
        return { ...size, variants: size.variants.filter((_, idx) => idx !== variantIndex) };
      }
      return size;
    })
  };
}

export function updateVariantQuantity(order: ProductionOrder, sizeName: string, variantIndex: number, quantity: number): ProductionOrder {
  return {
    ...order,
    sizes: order.sizes.map(size => {
      if (size.size === sizeName) {
        return {
          ...size,
          variants: size.variants.map((v, idx) => {
            if (idx === variantIndex) {
              return { ...v, quantity };
            }
            return v;
          })
        };
      }
      return size;
    })
  };
}

export function updateVariantColor(order: ProductionOrder, sizeName: string, variantIndex: number, color: string): ProductionOrder {
  return {
    ...order,
    sizes: order.sizes.map(size => {
      if (size.size === sizeName) {
        return {
          ...size,
          variants: size.variants.map((v, idx) => {
            if (idx === variantIndex) {
              return { ...v, color };
            }
            return v;
          })
        };
      }
      return size;
    })
  };
}

// Prep Commands
export async function savePrepData(order: ProductionOrder, updatedBatches: BatchItem[]): Promise<CommandResult<ProductionOrder>> {
  const allCompleted = updatedBatches.every(b => b.prepStatus === 'مكتمل');
  const anyStarted = updatedBatches.some(b => b.prepStatus !== 'جاري' || b.accessoriesPrep.some(a => a.isPrepared));
  
  let newStatus = order.status;
  if (allCompleted) newStatus = 'التجهيز مكتمل';
  else if (anyStarted && order.status === 'الباتشات مثبتة') newStatus = 'التجهيز جاري';

  const orderToSave: ProductionOrder = {
    ...order,
    batches: updatedBatches,
    status: newStatus as any
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ بيانات التجهيز.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  // Only publish if status changed
  if (order.status !== newStatus) {
    eventBus.publish({
      id: crypto.randomUUID(),
      type: newStatus === 'التجهيز مكتمل' ? 'PreparationCompleted' : 'PreparationStarted',
      occurredAt: new Date().toISOString(),
      aggregateType: "ProductionOrder",
      aggregateId: order.id,
      payload: { status: verifiedOrder.status }
    });
  }
  return { success: true, data: verifiedOrder };
}

export async function approveBatchPrep(order: ProductionOrder, batchId: string, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  const approver = getApprover(user);
  const now = new Date().toISOString();
  
  const targetBatch = order.batches?.find(b => b.id === batchId);
  const batchNum = targetBatch?.batchNumber || 'باتش';
  const batchPieces = targetBatch ? targetBatch.sizes.reduce((acc, s) => acc + (s.variants || []).reduce((vAcc, v) => vAcc + (Number(v.quantity) || 0), 0), 0) : 0;
  const prepAccCount = targetBatch?.accessoriesPrep?.length || 0;

  let approvalLog;
  try {
    approvalLog = recordSystemApproval({
      actionType: 'production_stage_prep',
      documentId: batchId,
      documentNumber: `${order.orderNumber} - ${batchNum}`,
      title: `اعتماد تجهيز مستلزمات الباتش ${batchNum} (${order.orderNumber})`,
      details: `تم فحص واعتماد صرف وتجهيز كافة المستلزمات والإكسسوارات (${prepAccCount} بند) لباتش التشغيل ${batchNum} بكمية ${batchPieces} قطعة للموديل "${order.styleName}" بواسطة ${approver.name}`,
      quantity: batchPieces,
      counterpartyName: order.customerName,
      costCenter: order.styleName || 'عنبر التجهيز والملحقات',
      batchId,
      batchNumber: batchNum,
      stageName: 'التجهيز والملحقات',
      notes: `حالة الباتش: مكتمل التجهيز`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  const updatedBatches = order.batches!.map(b => {
    if (b.id === batchId) {
      return {
        ...b,
        prepStatus: 'مكتمل' as const,
        prepApprovedBy: approver.name,
        prepApprovedAt: now,
        prepApprovalCode: approvalLog?.verificationCode
      };
    }
    return b;
  });

  const allCompleted = updatedBatches.every(b => b.prepStatus === 'مكتمل');
  
  const orderToSave: ProductionOrder = {
    ...order,
    batches: updatedBatches,
    status: allCompleted ? 'التجهيز مكتمل' : 'التجهيز جاري'
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر اعتماد التجهيز.' };

  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: "BatchPreparationCompleted",
    occurredAt: now,
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { batchId, status: verifiedOrder.status }
  });
  
  if (allCompleted) {
    eventBus.publish({
      id: crypto.randomUUID(),
      type: "PreparationCompleted",
      occurredAt: now,
      aggregateType: "ProductionOrder",
      aggregateId: order.id,
      payload: { status: verifiedOrder.status }
    });
  }
  return { success: true, data: verifiedOrder };
}

export async function approveAllPrep(order: ProductionOrder, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات للاعتماد.' };
  }

  const unapprovedBatches = order.batches.filter(b => b.prepStatus !== 'مكتمل' && !b.prepApprovedBy);
  if (unapprovedBatches.length > 0) {
    return { 
      success: false, 
      error: `لا يمكن اعتماد مرحلة التجهيز بالكامل قبل اعتماد جميع باتشاتها أولاً (متبقي ${unapprovedBatches.length} باتش لم يعتمد).` 
    };
  }

  const approver = getApprover(user);
  const now = new Date().toISOString();
  const orderToSave: ProductionOrder = {
    ...order,
    prepApprovedBy: approver.name,
    prepApprovedAt: now,
    status: 'التجهيز مكتمل'
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر اعتماد التجهيز بالكامل.' };

  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: "PreparationCompleted",
    occurredAt: now,
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  const totalBatches = order.batches?.length || 0;
  const totalPieces = (order.batches || []).reduce((acc, b) => {
    return acc + (b.sizes || []).reduce((sAcc, s) => sAcc + (s.variants || []).reduce((vAcc, v) => vAcc + (Number(v.quantity) || 0), 0), 0);
  }, 0);

  try {
    recordSystemApproval({
      actionType: 'production_stage_prep',
      documentId: order.id,
      documentNumber: order.orderNumber,
      title: `اعتماد مرحلة تجهيز المستلزمات بالكامل لأمر الإنتاج ${order.orderNumber}`,
      details: `تم اعتماد صرف وتجهيز كافة المستلزمات والخيوط والإكسسوارات لجميع الباتشات (${totalBatches} باتش بإجمالي ${totalPieces} قطعة) للموديل "${order.styleName}" بواسطة ${approver.name}`,
      quantity: totalPieces,
      counterpartyName: order.customerName,
      costCenter: order.styleName || 'عنبر التجهيز',
      stageName: 'التجهيز والملحقات',
      notes: `حالة أمر الإنتاج: ${verifiedOrder.status}`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  return { success: true, data: verifiedOrder };
}

// Print & Embroidery Commands
export async function savePrintEmbroideryData(order: ProductionOrder, updatedBatches: BatchItem[]): Promise<CommandResult<ProductionOrder>> {
  let newStatus = order.status;
  // If previously it was 'التجهيز مكتمل', it might move to 'الطباعة والتطريز جاري' if any batch started
  const anyStarted = updatedBatches.some(b => b.printEmbroideryStatus === 'جاري' || b.printEmbroideryStatus === 'مكتمل');
  const allCompleted = updatedBatches.every(b => b.printEmbroideryStatus === 'مكتمل');

  if (allCompleted) newStatus = 'الطباعة والتطريز مكتمل';
  else if (anyStarted && (order.status === 'التجهيز مكتمل' || order.status === 'الطباعة والتطريز جاري')) newStatus = 'الطباعة والتطريز جاري';

  const orderToSave: ProductionOrder = {
    ...order,
    batches: updatedBatches,
    status: newStatus as any
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ بيانات الطباعة والتطريز.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: "PrintEmbroiderySaved",
    occurredAt: new Date().toISOString(),
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export async function approveBatchPrintEmbroidery(order: ProductionOrder, batchId: string, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  const approver = getApprover(user);
  const now = new Date().toISOString();

  const targetBatch = order.batches?.find(b => b.id === batchId);
  const batchNum = targetBatch?.batchNumber || 'باتش';
  const batchPieces = targetBatch ? targetBatch.sizes.reduce((acc, s) => acc + (s.variants || []).reduce((vAcc, v) => vAcc + (Number(v.quantity) || 0), 0), 0) : 0;
  const execType = targetBatch?.executionType || 'مواصفة طباعة وتطريز';

  let approvalLog;
  try {
    approvalLog = recordSystemApproval({
      actionType: 'production_stage_print',
      documentId: batchId,
      documentNumber: `${order.orderNumber} - ${batchNum}`,
      title: `اعتماد الطباعة والتطريز للباتش ${batchNum} (${order.orderNumber})`,
      details: `تم فحص واعتماد مواصفات وتنفيذ الطباعة/التطريز (${execType}) لباتش التشغيل ${batchNum} بكمية ${batchPieces} قطعة للموديل "${order.styleName}" بواسطة ${approver.name}`,
      quantity: batchPieces,
      counterpartyName: order.customerName,
      costCenter: order.styleName || 'قسم الطباعة والتطريز',
      batchId,
      batchNumber: batchNum,
      stageName: 'الطباعة والتطريز',
      notes: `نوع التنفيذ: ${execType}`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  const updatedBatches = order.batches!.map(b => {
    if (b.id === batchId) {
      return {
        ...b,
        printEmbroideryStatus: 'مكتمل' as const,
        printApprovedBy: approver.name,
        printApprovedAt: now,
        printApprovalCode: approvalLog?.verificationCode
      };
    }
    return b;
  });

  const allCompleted = updatedBatches.every(b => b.printEmbroideryStatus === 'مكتمل');
  const orderToSave: ProductionOrder = {
    ...order,
    batches: updatedBatches,
    status: allCompleted ? 'الطباعة والتطريز مكتمل' : 'الطباعة والتطريز جاري'
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر اعتماد طباعة وتطريز الباتش.' };

  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: "BatchPrintEmbroideryCompleted",
    occurredAt: now,
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { batchId, status: verifiedOrder.status }
  });

  if (allCompleted) {
    eventBus.publish({
      id: crypto.randomUUID(),
      type: "PrintEmbroideryCompleted",
      occurredAt: now,
      aggregateType: "ProductionOrder",
      aggregateId: order.id,
      payload: { status: verifiedOrder.status }
    });
  }

  return { success: true, data: verifiedOrder };
}

export async function approvePrintEmbroidery(order: ProductionOrder, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات للاعتماد.' };
  }

  const unapprovedBatches = order.batches.filter(b => b.printEmbroideryStatus !== 'مكتمل' && !b.printApprovedBy);
  if (unapprovedBatches.length > 0) {
    return { 
      success: false, 
      error: `لا يمكن اعتماد مرحلة الطباعة والتطريز بالكامل قبل اعتماد جميع باتشاتها أولاً (متبقي ${unapprovedBatches.length} باتش لم يعتمد).` 
    };
  }

  const approver = getApprover(user);
  const now = new Date().toISOString();
  const orderToSave: ProductionOrder = {
    ...order,
    printEmbroideryApprovedBy: approver.name,
    printEmbroideryApprovedAt: now,
    status: 'الطباعة والتطريز مكتمل'
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر اعتماد الطباعة والتطريز.' };

  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: "PrintEmbroideryCompleted",
    occurredAt: now,
    aggregateType: "ProductionOrder",
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  const totalBatches = order.batches?.length || 0;
  const totalPieces = (order.batches || []).reduce((acc, b) => {
    return acc + (b.sizes || []).reduce((sAcc, s) => sAcc + (s.variants || []).reduce((vAcc, v) => vAcc + (Number(v.quantity) || 0), 0), 0);
  }, 0);

  try {
    recordSystemApproval({
      actionType: 'production_stage_print',
      documentId: order.id,
      documentNumber: order.orderNumber,
      title: `اعتماد مرحلة الطباعة والتطريز بالكامل لأمر الإنتاج ${order.orderNumber}`,
      details: `تم اعتماد اكتمال مواصفات الطباعة والتطريز لكافة باتشات الأمر (${totalBatches} باتش بإجمالي ${totalPieces} قطعة) للموديل "${order.styleName}" بواسطة ${approver.name}`,
      quantity: totalPieces,
      counterpartyName: order.customerName,
      costCenter: order.styleName || 'قسم الطباعة والتطريز',
      stageName: 'الطباعة والتطريز',
      notes: `حالة أمر الإنتاج: ${verifiedOrder.status}`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  return { success: true, data: verifiedOrder };
}

export async function saveSewingData(order: ProductionOrder, updatedBatches: BatchItem[]): Promise<CommandResult<ProductionOrder>> {
  const orderToSave: ProductionOrder = {
    ...order,
    batches: updatedBatches,
    updatedAt: new Date().toISOString()
  };
  
  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر حفظ بيانات الخياطة.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: 'SewingSaved',
    occurredAt: new Date().toISOString(),
    aggregateType: 'ProductionOrder',
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  return { success: true, data: verifiedOrder };
}

export async function approveSewing(order: ProductionOrder, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات للاعتماد' };
  }
  
  const unapprovedBatches = order.batches.filter(b => b.sewingData?.status !== 'مكتمل');
  if (unapprovedBatches.length > 0) {
    return { 
      success: false, 
      error: `لا يمكن اعتماد مرحلة الخياطة بالكامل قبل اعتماد جميع باتشاتها أولاً (متبقي ${unapprovedBatches.length} باتش لم يعتمد).` 
    };
  }

  const approver = getApprover(user);
  const now = new Date().toISOString();
  const orderToSave: ProductionOrder = {
    ...order,
    status: 'الخياطة مكتملة' as any,
    sewingApprovedBy: approver.name,
    sewingApprovedAt: now,
    updatedAt: now
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر اعتماد الخياطة.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  eventBus.publish({
    id: crypto.randomUUID(),
    type: 'SewingCompleted',
    occurredAt: now,
    aggregateType: 'ProductionOrder',
    aggregateId: order.id,
    payload: { status: verifiedOrder.status }
  });

  const totalBatches = order.batches?.length || 0;
  let totalSewn = 0;
  let totalSewnCost = 0;
  (order.batches || []).forEach(b => {
    const sewn = (b.sewingData?.actualQuantities || []).reduce((acc, q) => acc + (Number(q.actualQuantity) || 0), 0);
    totalSewn += sewn;
    totalSewnCost += sewn * (Number(b.sewingData?.actualCostPerPiece) || 0);
  });

  try {
    recordSystemApproval({
      actionType: 'production_stage_sewing',
      documentId: order.id,
      documentNumber: order.orderNumber,
      title: `اعتماد مرحلة الخياطة والتجميع بالكامل لأمر الإنتاج ${order.orderNumber}`,
      details: `تم اعتماد اكتمال إنتاجية خطوط الخياطة لجميع باتشات الأمر (${totalBatches} باتش بإجمالي ${totalSewn} قطعة وتكلفة مصنعيات ${totalSewnCost} ج.م) للموديل "${order.styleName}" بواسطة ${approver.name}`,
      amount: totalSewnCost,
      quantity: totalSewn,
      counterpartyName: order.customerName,
      costCenter: order.styleName || 'عنبر الخياطة والتجميع',
      stageName: 'الخياطة والتجميع',
      notes: `حالة أمر الإنتاج: ${verifiedOrder.status}`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  return { success: true, data: verifiedOrder };
}

export async function approveBatchSewing(order: ProductionOrder, batchId: string, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات' };
  }
  
  const b = order.batches.find(b => b.id === batchId);
  if (!b) return { success: false, error: 'الباتش غير موجود' };

  if (!b.sewingData) {
    return { success: false, error: `بيانات الخياطة مفقودة للباتش ${b.batchNumber}` };
  }
  const s = b.sewingData;
  if (!s.manufacturingType) {
    return { success: false, error: `نوع التصنيع مفقود للباتش ${b.batchNumber}` };
  }
  if (s.manufacturingType === 'تصنيع داخلي' && !s.sewingGroup) {
    return { success: false, error: `مجموعة الخياطة مفقودة للباتش ${b.batchNumber}` };
  }
  if (s.manufacturingType === 'تصنيع خارجي' && !s.externalManufacturer) {
    return { success: false, error: `جهة التصنيع الخارجي مفقودة للباتش ${b.batchNumber}` };
  }
  if (s.actualCostPerPiece === undefined || s.actualCostPerPiece === null) {
    return { success: false, error: `سعر التصنيع الفعلي مفقود للباتش ${b.batchNumber}` };
  }
  if (!s.actualQuantities || s.actualQuantities.length === 0) {
    return { success: false, error: `الكميات الفعلية مفقودة للباتش ${b.batchNumber}` };
  }

  const approver = getApprover(user);
  const now = new Date().toISOString();

  const batchNum = b.batchNumber || 'باتش';
  const totalSewnPieces = (s.actualQuantities || []).reduce((acc, q) => acc + (Number(q.actualQuantity) || 0), 0);
  const mfgParty = s.manufacturingType === 'تصنيع خارجي' ? s.externalManufacturer : s.sewingGroup;
  const costPerPiece = Number(s.actualCostPerPiece) || 0;
  const totalSewingCost = totalSewnPieces * costPerPiece;

  let approvalLog;
  try {
    approvalLog = recordSystemApproval({
      actionType: 'production_stage_sewing',
      documentId: batchId,
      documentNumber: `${order.orderNumber} - ${batchNum}`,
      title: `اعتماد إنتاجية خياطة وتجميع الباتش ${batchNum} (${order.orderNumber})`,
      details: `تم اعتماد إنتاجية خطوط الخياطة للباتش ${batchNum} بكمية ${totalSewnPieces} قطعة (${s.manufacturingType || 'خياطة'} - ${mfgParty || 'الورشة'}) بسعر ${costPerPiece} ج.م للقطعة للموديل "${order.styleName}" بواسطة ${approver.name}`,
      amount: totalSewingCost,
      quantity: totalSewnPieces,
      counterpartyName: mfgParty || order.customerName,
      costCenter: s.sewingGroup || order.styleName || 'خطوط الخياطة والتجميع',
      batchId,
      batchNumber: batchNum,
      stageName: 'الخياطة والتجميع',
      notes: `نوع التصنيع: ${s.manufacturingType} | إجمالي تكلفة تشغيل الباتش: ${totalSewingCost} ج.م`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  const updatedBatches = order.batches.map(batch => {
    if (batch.id === batchId) {
      return {
        ...batch,
        sewingData: {
          ...batch.sewingData!,
          status: 'مكتمل' as const,
          approvedBy: approver.name,
          approvedAt: now,
          approvalCode: approvalLog?.verificationCode
        }
      };
    }
    return batch;
  });

  const allSewingCompleted = updatedBatches.every(b => b.sewingData?.status === 'مكتمل');

  const orderToSave: ProductionOrder = {
    ...order,
    status: allSewingCompleted ? 'الخياطة مكتملة' : order.status,
    batches: updatedBatches,
    updatedAt: now
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر اعتماد الخياطة.' };
  
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  if (allSewingCompleted) {
    eventBus.publish({
      id: crypto.randomUUID(),
      type: 'SewingCompleted',
      occurredAt: now,
      aggregateType: 'ProductionOrder',
      aggregateId: order.id,
      payload: { 
        orderId: order.id, 
        approvedBy: approver.name,
        batches: updatedBatches.map(b => b.id)
      }
    });
  }

  return { success: true, data: verifiedOrder };
}

export async function approveBatchFinishing(order: ProductionOrder, batchId: string, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات' };
  }
  
  const approver = getApprover(user);
  const now = new Date().toISOString();

  // Ensure sequential barcodes for finished variants
  const { order: barcodedOrder } = ensureOrderFinishingBarcodes(order);

  const targetBatch = (barcodedOrder.batches || []).find(b => b.id === batchId);
  const batchNum = targetBatch?.batchNumber || 'باتش';
  const finishing = targetBatch?.finishingData;
  const totalFinishedPieces = (finishing?.actualQuantities || []).reduce((acc, q) => acc + (Number(q.actualQuantity || q.quantity) || 0), 0);
  const worker = finishing?.workerName || 'عنبر التشطيب';

  let approvalLog;
  try {
    approvalLog = recordSystemApproval({
      actionType: 'production_stage_finish',
      documentId: batchId,
      documentNumber: `${order.orderNumber} - ${batchNum}`,
      title: `اعتماد تشطيب وفنش الباتش ${batchNum} (${order.orderNumber})`,
      details: `تم فحص واعتماد تشطيب وفنش الباتش ${batchNum} بكمية ${totalFinishedPieces} قطعة وتوليد الباركود التسلسلي (المسؤول: ${worker}) للموديل "${order.styleName}" بواسطة ${approver.name}`,
      quantity: totalFinishedPieces,
      counterpartyName: worker,
      costCenter: order.styleName || 'عنبر التشطيب والفنش',
      batchId,
      batchNumber: batchNum,
      stageName: 'التشطيب والفنش',
      notes: `حالة التشطيب: معتمد مع الباركود`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  const updatedBatches = (barcodedOrder.batches || []).map(batch => {
    if (batch.id === batchId) {
      if (!batch.finishingData) throw new Error('بيانات التشطيب مفقودة');
      return {
        ...batch,
        finishingData: {
          ...batch.finishingData,
          status: 'مكتمل' as const,
          approvedBy: approver.name,
          approvedAt: now,
          approvalCode: approvalLog?.verificationCode
        }
      };
    }
    return batch;
  });

  const allCompleted = updatedBatches.every(b => b.finishingData?.status === 'مكتمل');
  
  const updatedOrder = { 
    ...barcodedOrder, 
    batches: updatedBatches,
    status: allCompleted ? ('التشطيب مكتمل' as import('../types').OrderStatus) : ('التشطيب جاري' as import('../types').OrderStatus)
  };
  
  const savedResult = await persistOrder(updatedOrder);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر الاعتماد.' };
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  return { success: true, data: verifiedOrder };
}

export async function approveAllFinishing(order: ProductionOrder, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات للاعتماد' };
  }
  
  const unapprovedBatches = order.batches.filter(b => b.finishingData?.status !== 'مكتمل');
  if (unapprovedBatches.length > 0) {
    return { 
      success: false, 
      error: `لا يمكن اعتماد مرحلة التشطيب بالكامل قبل اعتماد جميع باتشاتها أولاً (متبقي ${unapprovedBatches.length} باتش لم يعتمد).` 
    };
  }

  const approver = getApprover(user);
  const now = new Date().toISOString();

  // Ensure sequential barcodes for finished variants
  const { order: barcodedOrder } = ensureOrderFinishingBarcodes(order);
  
  const updatedOrder = { 
    ...barcodedOrder, 
    finishingApprovedBy: approver.name,
    finishingApprovedAt: now,
    status: 'التشطيب مكتمل' as import('../types').OrderStatus
  };
  
  const savedResult = await persistOrder(updatedOrder);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر الاعتماد.' };
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  const totalBatches = order.batches?.length || 0;
  let totalFinished = 0;
  (order.batches || []).forEach(b => {
    const fin = (b.finishingData?.actualQuantities || []).reduce((acc, q) => acc + (Number(q.actualQuantity || q.quantity) || 0), 0);
    totalFinished += fin;
  });

  try {
    recordSystemApproval({
      actionType: 'production_stage_finish',
      documentId: order.id,
      documentNumber: order.orderNumber,
      title: `اعتماد مرحلة التشطيب والفنش بالكامل لأمر الإنتاج ${order.orderNumber}`,
      details: `تم اعتماد اكتمال مرحلة التشطيب وتوليد الباركود لكافة باتشات الأمر (${totalBatches} باتش بإجمالي ${totalFinished} قطعة) للموديل "${order.styleName}" بواسطة ${approver.name}`,
      quantity: totalFinished,
      counterpartyName: order.customerName,
      costCenter: order.styleName || 'عنبر التشطيب',
      stageName: 'التشطيب والفنش',
      notes: `حالة أمر الإنتاج: ${verifiedOrder.status}`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  return { success: true, data: verifiedOrder };
}

export async function saveFinishingData(order: ProductionOrder, updatedBatches: BatchItem[]): Promise<CommandResult<ProductionOrder>> {
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات' };
  }

  // Ensure sequential barcodes for finished variants
  const { order: barcodedOrder } = ensureOrderFinishingBarcodes(order, updatedBatches);

  const orderToSave = {
    ...barcodedOrder,
    updatedAt: new Date().toISOString()
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر الحفظ.' };
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  return { success: true, data: verifiedOrder };
}


// ==================== Ironing Commands ====================
function checkBatchReadyForIroning(batch) {
  if (batch.prepStatus !== 'مكتمل') {
    return `الباتش ${batch.batchNumber} لم يتم اعتماد التجهيز له`;
  }
  
  const needsPrintEmb = batch.executionType && batch.executionType !== "بدون طباعة / تطريز";
  if (needsPrintEmb && batch.printEmbroideryStatus !== 'مكتمل' && batch.printEmbroideryStatus !== 'تم التخطي') {
    return `الباتش ${batch.batchNumber} لم يتم اعتماد الطباعة/التطريز له`;
  }
  
  if (batch.sewingData?.status !== 'مكتمل') {
    return `الباتش ${batch.batchNumber} لم يتم اعتماد الخياطة له`;
  }
  
  if (batch.finishingData?.status !== 'مكتمل') {
    return `الباتش ${batch.batchNumber} لم يتم اعتماد التشطيب له`;
  }
  
  return null;
}

export async function approveBatchIroning(order: ProductionOrder, batchId: string, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  const b = order.batches?.find(x => x.id === batchId);
  if (b) {
    const err = checkBatchReadyForIroning(b);
    if (err) return { success: false, error: err };
  }
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات' };
  }

  const approver = getApprover(user);
  const now = new Date().toISOString();

  const batchNum = b?.batchNumber || 'باتش';
  const ironing = b?.ironingData;
  const totalIronedPieces = (ironing?.actualQuantities || []).reduce((acc, q) => acc + (Number(q.actualQuantity || q.quantity) || 0), 0);
  const worker = ironing?.workerName || 'عنبر المكواة';

  let approvalLog;
  try {
    approvalLog = recordSystemApproval({
      actionType: 'production_stage_iron',
      documentId: batchId,
      documentNumber: `${order.orderNumber} - ${batchNum}`,
      title: `اعتماد كي ومكواة الباتش ${batchNum} (${order.orderNumber})`,
      details: `تم فحص واعتماد مكواة وبخار الباتش ${batchNum} بكمية ${totalIronedPieces} قطعة (المسؤول: ${worker}) للموديل "${order.styleName}" بواسطة ${approver.name}`,
      quantity: totalIronedPieces,
      counterpartyName: worker,
      costCenter: order.styleName || 'عنبر المكواة والبخار',
      batchId,
      batchNumber: batchNum,
      stageName: 'المكواة والبخار',
      notes: `حالة المكواة: معتمدة`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}
  
  const updatedBatches = order.batches.map(batch => {
    if (batch.id === batchId) {
      if (!batch.ironingData) throw new Error('بيانات المكواة مفقودة');
      return {
        ...batch,
        ironingData: {
          ...batch.ironingData,
          status: 'مكتمل' as const,
          approvedBy: approver.name,
          approvedAt: now,
          approvalCode: approvalLog?.verificationCode
        }
      };
    }
    return batch;
  });

  const allCompleted = updatedBatches.every(b => b.ironingData?.status === 'مكتمل');
  
  const updatedOrder = { 
    ...order, 
    batches: updatedBatches,
    status: allCompleted ? ('المكواة مكتملة' as import('../types').OrderStatus) : ('المكواة جاري' as import('../types').OrderStatus)
  };
  
  const savedResult = await persistOrder(updatedOrder);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر الاعتماد.' };
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  return { success: true, data: verifiedOrder };
}

export async function approveAllIroning(order: ProductionOrder, user: string = 'المستخدم الحالي'): Promise<CommandResult<ProductionOrder>> {
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات للاعتماد' };
  }
  
  const unapprovedBatches = order.batches.filter(b => b.ironingData?.status !== 'مكتمل');
  if (unapprovedBatches.length > 0) {
    return { 
      success: false, 
      error: `لا يمكن اعتماد مرحلة المكواة بالكامل قبل اعتماد جميع باتشاتها أولاً (متبقي ${unapprovedBatches.length} باتش لم يعتمد).` 
    };
  }

  const approver = getApprover(user);
  const now = new Date().toISOString();
  
  const updatedOrder = { 
    ...order, 
    ironingApprovedBy: approver.name,
    ironingApprovedAt: now,
    status: 'المكواة مكتملة' as import('../types').OrderStatus
  };
  
  const savedResult = await persistOrder(updatedOrder);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر الاعتماد.' };
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  const totalBatches = order.batches?.length || 0;
  let totalIroned = 0;
  (order.batches || []).forEach(b => {
    const ir = (b.ironingData?.actualQuantities || []).reduce((acc, q) => acc + (Number(q.actualQuantity || q.quantity) || 0), 0);
    totalIroned += ir;
  });

  try {
    recordSystemApproval({
      actionType: 'production_stage_iron',
      documentId: order.id,
      documentNumber: order.orderNumber,
      title: `اعتماد مرحلة المكواة والبخار بالكامل لأمر الإنتاج ${order.orderNumber}`,
      details: `تم اعتماد اكتمال مرحلة الكي والبخار لجميع باتشات الأمر (${totalBatches} باتش بإجمالي ${totalIroned} قطعة) للموديل "${order.styleName}" بواسطة ${approver.name}`,
      quantity: totalIroned,
      counterpartyName: order.customerName,
      costCenter: order.styleName || 'عنبر المكواة',
      stageName: 'المكواة والبخار',
      notes: `حالة أمر الإنتاج: ${verifiedOrder.status}`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  return { success: true, data: verifiedOrder };
}

export async function saveIroningData(order: ProductionOrder, updatedBatches: BatchItem[]): Promise<CommandResult<ProductionOrder>> {
  if (!order.batches || order.batches.length === 0) {
    return { success: false, error: 'لا توجد باتشات' };
  }

  const orderToSave = {
    ...order,
    batches: updatedBatches,
    updatedAt: new Date().toISOString()
  };

  const savedResult = await persistOrder(orderToSave);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر الحفظ.' };
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  return { success: true, data: verifiedOrder };
}

export async function approvePacking(
  order: ProductionOrder,
  invoices: import('../types').PackingInvoice[],
  user: string = 'المستخدم الحالي'
): Promise<CommandResult<ProductionOrder>> {
  const approver = getApprover(user);
  const now = new Date().toISOString();

  const updatedOrder: ProductionOrder = {
    ...order,
    packingInvoices: invoices,
    packingStatus: 'مكتمل',
    packingApprovedBy: approver.name,
    packingApprovedAt: now,
    status: 'التغليف معتمد',
    updatedAt: now
  };

  const savedResult = await persistOrder(updatedOrder);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر اعتماد التغليف.' };
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };

  const totalPackedPieces = invoices.reduce((acc, inv) => {
    return acc + (inv.variants || []).reduce((vAcc, v) => vAcc + (Number(v.quantity) || 0), 0);
  }, 0);

  try {
    recordSystemApproval({
      actionType: 'production_stage_pack',
      documentId: order.id,
      documentNumber: order.orderNumber,
      title: `اعتماد مرحلة التعبئة والتغليف والباركود لأمر ${order.orderNumber}`,
      details: `تم اعتماد تغليف المنتجات التامة (${invoices.length} فواتير/طرود بإجمالي ${totalPackedPieces} قطعة) وتوليد الباركود ونقلها لمخزن المنتجات الجاهزة للموديل "${order.styleName}" بواسطة ${approver.name}`,
      quantity: totalPackedPieces,
      counterpartyName: order.customerName,
      costCenter: order.styleName || 'قسم التعبئة والتغليف',
      stageName: 'التعبئة والتغليف والباركود',
      notes: `عدد طرود/فواتير التعبئة: ${invoices.length}`,
      customUser: {
        id: approver.activeUser.id,
        name: approver.name,
        role: approver.activeUser.role,
        roleTitle: approver.activeUser.roleTitle
      }
    });
  } catch (err) {}

  return { success: true, data: verifiedOrder };
}

export async function unapprovePacking(
  order: ProductionOrder
): Promise<CommandResult<ProductionOrder>> {
  const updatedOrder: ProductionOrder = {
    ...order,
    packingStatus: 'جاري',
    packingApprovedBy: undefined,
    packingApprovedAt: undefined,
    status: 'المكواة مكتملة',
    updatedAt: new Date().toISOString()
  };

  const savedResult = await persistOrder(updatedOrder);
  if (!savedResult.success) return { success: false, error: savedResult.error || 'تعذر إلغاء اعتماد التغليف.' };
  const verifiedOrder = await getOrderById(order.id);
  if (!verifiedOrder) return { success: false, error: 'فشل استرجاع الأمر.' };
  return { success: true, data: verifiedOrder };
}
