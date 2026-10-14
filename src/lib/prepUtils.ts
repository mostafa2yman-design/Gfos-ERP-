import { ProductionOrder, BatchItem, AccessoryInstance } from '../types';

export interface AccessoryPrepCalculation {
  actualAccessoryName?: string;
  accessoryId: string;
  accessoryName: string;
  unit: string;
  standardPerPiece: number | string; // could be unified or varies
  requiredForBatch: number;
  isPrepared: boolean;
}

export function calculateBatchAccessories(order: ProductionOrder, batch: BatchItem): AccessoryPrepCalculation[] {
  if (!order.accessories || order.accessories.length === 0) return [];

  return order.accessories.map(acc => {
    let requiredForBatch = 0;
    
    // We calculate based on the actual quantity in the batch sizes
    batch.sizes.forEach(sizeData => {
      let sizeQty = 0;
      sizeData.variants.forEach(v => {
        sizeQty += v.quantity;
      });

      let standard = 0;
      if (acc.standardMethod === 'موحد') {
        standard = acc.unifiedStandard || 0;
      } else {
        const sizeStd = acc.sizeStandards?.find(s => s.size === sizeData.size);
        standard = sizeStd ? sizeStd.standard : 0;
      }
      
      requiredForBatch += (sizeQty * standard);
    });

    const standardPerPieceStr = acc.standardMethod === 'موحد' 
      ? acc.unifiedStandard?.toString() 
      : 'حسب المقاس';

    const prepItem = batch.accessoriesPrep?.find(p => p.accessoryId === acc.id || p.accessoryName === acc.name);
    
    return {
      accessoryId: acc.id,
      accessoryName: acc.name,
      actualAccessoryName: prepItem?.actualAccessoryName,
      unit: acc.unit || "قطعة",
      standardPerPiece: standardPerPieceStr,
      requiredForBatch,
      isPrepared: prepItem?.isPrepared || false
    };
  });
}
