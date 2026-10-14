import { calculateFabricAnalysis, getPrimaryFabric } from './fabricUtils';
import { ProductionOrder } from '../types';
import { calculateOrderOverheadAnalysis, OrderOverheadAnalysis } from './overheadStorage';

export interface GlobalCostMetrics {
  totalStandardCost: number;
  totalStandardQty: number;
  averageStandardUnitCost: number;
  isActualComplete: boolean;
}

export function calculateGlobalCostMetrics(orders: ProductionOrder[]): GlobalCostMetrics {
  let totalStandardCost = 0;
  let totalStandardQty = 0;

  orders.forEach(order => {
    // 1. Calculate Standard Quantities per size for the order
    const sizeQuantities: Record<string, number> = {};
    order.sizes?.forEach(s => {
      let sQty = 0;
      s.variants?.forEach(v => {
        sQty += v.quantity;
        totalStandardQty += v.quantity;
      });
      sizeQuantities[s.size] = sQty;
    });

    // 2. Calculate Standard Materials Cost
    order.materials?.forEach(mat => {
      const price = mat.standardPrice || 0;
      order.sizes?.forEach(s => {
        const sQty = sizeQuantities[s.size] || 0;
        const std = mat.standardMethod === 'موحد' 
          ? (mat.unifiedStandard || 0)
          : (mat.sizeStandards?.find(ss => ss.size === s.size)?.standard || 0);
        totalStandardCost += (sQty * std * price);
      });
    });

    // 3. Calculate Standard Accessories Cost
    order.accessories?.forEach(acc => {
      const price = acc.standardPrice || 0;
      order.sizes?.forEach(s => {
        const sQty = sizeQuantities[s.size] || 0;
        const std = acc.standardMethod === 'موحد' 
          ? (acc.unifiedStandard || 0)
          : (acc.sizeStandards?.find(ss => ss.size === s.size)?.standard || 0);
        totalStandardCost += (sQty * std * price);
      });
    });

    // 4. Calculate Standard Print/Embroidery Cost
    let orderTotalQty = 0;
    order.sizes?.forEach(s => {
      s.variants?.forEach(v => { orderTotalQty += v.quantity; });
    });
    totalStandardCost += (order.printEmbroideryStandardCost || 0) * orderTotalQty;

    // 5. Calculate Standard Sewing Cost
    totalStandardCost += (order.standardSewingCostPerPiece || 0) * orderTotalQty;

    // 6. Calculate Standard Finishing Cost
    totalStandardCost += (order.standardFinishingCostPerPiece || 0) * orderTotalQty;


  });

  const averageStandardUnitCost = totalStandardQty > 0 ? (totalStandardCost / totalStandardQty) : 0;

  return {
    totalStandardCost,
    totalStandardQty,
    averageStandardUnitCost,
    isActualComplete: false // We don't have actual prices or full actual consumption in the current system
  };
}

export interface CostComponent {
  standardTotal: number;
  standardPerPiece: number;
  actualTotal: number | null;
  actualPerPiece: number | null;
  isActualAvailable: boolean;
}

export interface OrderCostAnalysis {
  standardQty: number;
  actualQty: number;
  
  fabric: CostComponent;
  accessories: CostComponent;
  printEmbroidery: CostComponent;
  sewing: CostComponent;
  cutting: CostComponent;
  finishing: CostComponent;
  ironing: CostComponent;
  overhead: CostComponent;
  overheadAnalysis: OrderOverheadAnalysis;
  
  totalStandardPerPiece: number;
  totalActualPerPiece: number | null;
  
  deviationValue: number | null;
  deviationPercentage: number | null;
  isActualComplete: boolean;
}


export function calculateOrderCostAnalysis(order: ProductionOrder): OrderCostAnalysis {
  let standardQty = 0;
  const sizeQuantities: Record<string, number> = {};
  order.sizes?.forEach(s => {
    let sQty = 0;
    s.variants?.forEach(v => {
      sQty += v.quantity;
      standardQty += v.quantity;
    });
    sizeQuantities[s.size] = sQty;
  });

  let actualQty = 0;
  if (order.cutData) {
    order.cutData.sizes?.forEach(s => {
      s.variants?.forEach(v => {
        actualQty += v.actualQuantity || 0;
      });
    });
  }

  // 1. Fabric
  let fabricStdTotal = 0;
  order.materials?.forEach(mat => {
    const price = mat.standardPrice || 0;
    order.sizes?.forEach(s => {
      const sQty = sizeQuantities[s.size] || 0;
      const std = mat.standardMethod === 'موحد' 
        ? (mat.unifiedStandard || 0)
        : (mat.sizeStandards?.find(ss => ss.size === s.size)?.standard || 0);
      fabricStdTotal += (sQty * std * price);
    });
  });

  const fabricAnalysis = calculateFabricAnalysis(order, order.cutData);
  const isFabricActualAvailable = !!(fabricAnalysis && fabricAnalysis.hasColorLevelActuals && fabricAnalysis.totalActualFabric > 0);
  
  let fabricActualTotal: number | null = null;
  let primaryFabricId = getPrimaryFabric(order)?.id;
  
  if (isFabricActualAvailable && fabricAnalysis) {
     let actualFabricCost = 0;
     // Primary fabric cost based on actual cut weights
     actualFabricCost += fabricAnalysis.totalActualFabric * fabricAnalysis.fabricPrice;

     // Add secondary materials (assuming standard consumption for the actual cut pieces)
     order.materials?.forEach(mat => {
       if (mat.id !== primaryFabricId) {
         const price = mat.standardPrice || 0;
         order.cutData?.sizes?.forEach(s => {
           const sQty = (s.variants || []).reduce((sum, v) => sum + (v.actualQuantity || 0), 0);
           const std = mat.standardMethod === 'موحد' 
             ? (mat.unifiedStandard || 0)
             : (mat.sizeStandards?.find(ss => ss.size === s.size)?.standard || 0);
           actualFabricCost += (sQty * std * price);
         });
       }
     });
     fabricActualTotal = actualFabricCost;
  }

  const fabric: CostComponent = {
    standardTotal: fabricStdTotal,
    standardPerPiece: standardQty > 0 ? (fabricStdTotal / standardQty) : 0,
    actualTotal: fabricActualTotal,
    actualPerPiece: (fabricActualTotal !== null && actualQty > 0) ? (fabricActualTotal / actualQty) : null,
    isActualAvailable: isFabricActualAvailable
  };

  
  // 1.5 Cutting
  let cutStdTotal = (order.standardCutCostPerPiece || 0) * standardQty;
  let cutActualTotal = 0;
  let hasIncompleteActualCut = false;
  let hasCutData = !!order.cutData;
  if (hasCutData) {
    if (order.cutData!.actualCostPerPiece !== undefined && order.cutData!.actualCostPerPiece !== null) {
      cutActualTotal = order.cutData!.actualCostPerPiece * actualQty;
    } else if (order.status !== 'مسودة') { // Wait, cutting is not 'مسودة'
       hasIncompleteActualCut = true;
    }
  }

  const isCutActualAvailable = hasCutData && !hasIncompleteActualCut;
  const cutting: CostComponent = {
    standardTotal: cutStdTotal,
    standardPerPiece: order.standardCutCostPerPiece || 0,
    actualTotal: isCutActualAvailable ? cutActualTotal : null,
    actualPerPiece: isCutActualAvailable ? order.cutData!.actualCostPerPiece || 0 : null,
    isActualAvailable: isCutActualAvailable
  };


  // 2. Accessories
  let accStdTotal = 0;
  let accActualTotal = 0;
  let hasAnyPreppedBatch = false;

  order.accessories?.forEach(acc => {
    const price = acc.standardPrice || 0;
    // Standard total
    order.sizes?.forEach(s => {
      const sQty = sizeQuantities[s.size] || 0;
      const std = acc.standardMethod === 'موحد' 
        ? (acc.unifiedStandard || 0)
        : (acc.sizeStandards?.find(ss => ss.size === s.size)?.standard || 0);
      accStdTotal += (sQty * std * price);
    });

    // Actual total based on PREPPED batches (as per requirements: الاكسسوارات يتم اضافتها بمجرد اعتماد التجهيز)
    order.batches?.forEach(b => {
      if (b.prepStatus === 'مكتمل') {
        hasAnyPreppedBatch = true;
        b.sizes?.forEach(bs => {
          const sQty = (bs.variants || []).reduce((sum, v) => sum + v.quantity, 0);
          const std = acc.standardMethod === 'موحد' 
            ? (acc.unifiedStandard || 0)
            : (acc.sizeStandards?.find(ss => ss.size === bs.size)?.standard || 0);
          accActualTotal += (sQty * std * price);
        });
      }
    });
  });

  const accessories: CostComponent = {
    standardTotal: accStdTotal,
    standardPerPiece: standardQty > 0 ? (accStdTotal / standardQty) : 0,
    actualTotal: hasAnyPreppedBatch ? accActualTotal : null,
    actualPerPiece: hasAnyPreppedBatch && actualQty > 0 ? (accActualTotal / actualQty) : null,
    isActualAvailable: hasAnyPreppedBatch || (order.accessories?.length === 0)
  };

  // 3. Print / Embroidery
  let peStdTotal = (order.printEmbroideryStandardCost || 0) * standardQty;
  let peActualTotal = 0;
  let peActualPieces = 0;
  let hasIncompleteActualPrint = false;
  let hasPrintBatches = false;

  order.batches?.forEach(b => {
    if (b.executionType && b.executionType !== 'بدون طباعة / تطريز') {
      hasPrintBatches = true;
      let batchQty = 0;
      b.sizes.forEach(bs => {
        bs.variants.forEach(bv => {
          batchQty += bv.quantity;
        });
      });
      
      const actCost = b.printEmbroideryCost?.actualCost;
      if (actCost !== undefined && actCost !== null && !isNaN(actCost)) {
        peActualTotal += (batchQty * actCost);
        peActualPieces += batchQty;
      } else {
        hasIncompleteActualPrint = true;
      }
    }
  });

  const isPrintActualAvailable = hasPrintBatches && !hasIncompleteActualPrint;
  const printEmbroidery: CostComponent = {
    standardTotal: peStdTotal,
    standardPerPiece: order.printEmbroideryStandardCost || 0,
    actualTotal: isPrintActualAvailable ? peActualTotal : null,
    actualPerPiece: (isPrintActualAvailable && actualQty > 0) ? (peActualTotal / actualQty) : null,
    isActualAvailable: isPrintActualAvailable || (!hasPrintBatches && order.batches && order.batches.length > 0)
  };

  if (!hasPrintBatches && order.batches && order.batches.length > 0) {
     printEmbroidery.actualTotal = 0;
     printEmbroidery.actualPerPiece = 0;
     printEmbroidery.isActualAvailable = true;
  }

  // 4. Sewing
  let sewingStdTotal = (order.standardSewingCostPerPiece || 0) * standardQty;
  let sewingActualTotal = 0;
  let sewingActualPieces = 0;
  let hasIncompleteActualSewing = false;
  let hasSewingBatches = false;

  // 5. Finishing
  let finishingStdTotal = (order.standardFinishingCostPerPiece || 0) * standardQty;
  let finishingActualTotal = 0;
  let finishingActualPieces = 0;
  let hasIncompleteActualFinishing = false;
  let hasFinishingBatches = false;

  
  // 6. Ironing
  let ironingStdTotal = (order.standardIroningCostPerPiece || 0) * standardQty;
  let ironingActualTotal = 0;
  let ironingActualPieces = 0;
  let hasIncompleteActualIroning = false;
  let hasIroningBatches = false;

  order.batches?.forEach(b => {
    if (b.sewingData) {
      hasSewingBatches = true;
      let batchActualQty = 0;
      b.sewingData.actualQuantities?.forEach(q => {
        batchActualQty += q.actualQuantity;
      });
      
      const actCost = b.sewingData.actualCostPerPiece;
      if (actCost !== undefined && actCost !== null && !isNaN(actCost) && batchActualQty > 0) {
        sewingActualTotal += (batchActualQty * actCost);
        sewingActualPieces += batchActualQty;
      } else if (b.sewingData.status !== 'مكتمل') {
        hasIncompleteActualSewing = true;
      }
    } else {
       hasIncompleteActualSewing = true;
    }
    if (b.finishingData) {
      hasFinishingBatches = true;
      let batchActualQty = 0;
      b.finishingData.actualQuantities?.forEach(q => {
        batchActualQty += (q as any).actualQuantity || q.quantity || 0;
      });
      const actCost = b.finishingData.actualCostPerPiece;
      if (actCost !== undefined && actCost !== null && !isNaN(actCost) && batchActualQty > 0) {
        finishingActualTotal += (batchActualQty * actCost);
        finishingActualPieces += batchActualQty;
      } else if (b.finishingData.status !== 'مكتمل') {
        hasIncompleteActualFinishing = true;
      }
    } else {
       hasIncompleteActualFinishing = true;
    }

    if (b.ironingData) {
      hasIroningBatches = true;
      let batchActualQty = 0;
      b.ironingData.actualQuantities?.forEach(q => {
        batchActualQty += (q as any).actualQuantity || (q as any).quantity || 0;
      });
      const actCost = b.ironingData.actualCostPerPiece;
      if (actCost !== undefined && actCost !== null && !isNaN(actCost) && batchActualQty > 0) {
        ironingActualTotal += (batchActualQty * actCost);
        ironingActualPieces += batchActualQty;
      } else if (b.ironingData.status !== 'مكتمل') {
        hasIncompleteActualIroning = true;
      }
    } else {
       hasIncompleteActualIroning = true;
    }
  });


  const isSewingActualAvailable = hasSewingBatches && !hasIncompleteActualSewing;
  const sewing: CostComponent = {
    standardTotal: sewingStdTotal,
    standardPerPiece: order.standardSewingCostPerPiece || 0,
    actualTotal: isSewingActualAvailable ? sewingActualTotal : null,
    actualPerPiece: (isSewingActualAvailable && sewingActualPieces > 0) ? (sewingActualTotal / sewingActualPieces) : null,
    isActualAvailable: isSewingActualAvailable || (!hasSewingBatches && order.batches && order.batches.length > 0)
  };

  if (!hasSewingBatches && order.batches && order.batches.length > 0) {
    sewing.actualTotal = 0;
    sewing.actualPerPiece = 0;
    sewing.isActualAvailable = true;
  }
  const isFinishingActualAvailable = hasFinishingBatches && !hasIncompleteActualFinishing;
  const finishing: CostComponent = {
    standardTotal: finishingStdTotal,
    standardPerPiece: order.standardFinishingCostPerPiece || 0,
    actualTotal: isFinishingActualAvailable ? finishingActualTotal : null,
    actualPerPiece: (isFinishingActualAvailable && finishingActualPieces > 0) ? (finishingActualTotal / finishingActualPieces) : null,
    isActualAvailable: isFinishingActualAvailable || (!hasFinishingBatches && order.batches && order.batches.length > 0)
  };
  if (!hasFinishingBatches && order.batches && order.batches.length > 0) {
    finishing.actualTotal = 0;
    finishing.actualPerPiece = 0;
    finishing.isActualAvailable = true;
  }

  

  // Totals

  const isIroningActualAvailable = hasIroningBatches && !hasIncompleteActualIroning;
  const ironing: CostComponent = {
    standardTotal: ironingStdTotal,
    standardPerPiece: order.standardIroningCostPerPiece || 0,
    actualTotal: isIroningActualAvailable ? ironingActualTotal : null,
    actualPerPiece: (isIroningActualAvailable && ironingActualPieces > 0) ? (ironingActualTotal / ironingActualPieces) : null,
    isActualAvailable: isIroningActualAvailable || (!hasIroningBatches && order.batches && order.batches.length > 0)
  };
  if (!hasIroningBatches && order.batches && order.batches.length > 0) {
    ironing.actualTotal = 0;
    ironing.actualPerPiece = 0;
    ironing.isActualAvailable = true;
  }

  // 4. Manufacturing Overhead (التكاليف الصناعية غير المباشرة: كهرباء، إيجار، إهلاك)
  const overheadAnalysis = calculateOrderOverheadAnalysis(order);
  const overheadActualPerPiece = actualQty > 0 
    ? (overheadAnalysis.absorbedActualOrder / actualQty)
    : overheadAnalysis.totalStandardPerPiece;

  const overhead: CostComponent = {
    standardTotal: overheadAnalysis.totalStandardOrder,
    standardPerPiece: overheadAnalysis.totalStandardPerPiece,
    actualTotal: overheadAnalysis.absorbedActualOrder > 0 ? overheadAnalysis.absorbedActualOrder : null,
    actualPerPiece: overheadAnalysis.absorbedActualOrder > 0 ? overheadActualPerPiece : null,
    isActualAvailable: overheadAnalysis.isFullyAbsorbed || overheadAnalysis.absorbedActualOrder > 0
  };

  const totalStandardPerPiece = fabric.standardPerPiece + cutting.standardPerPiece + accessories.standardPerPiece + printEmbroidery.standardPerPiece + sewing.standardPerPiece + finishing.standardPerPiece + ironing.standardPerPiece + overhead.standardPerPiece;
  
  const isActualComplete = fabric.isActualAvailable && cutting.isActualAvailable && accessories.isActualAvailable && printEmbroidery.isActualAvailable && sewing.isActualAvailable && finishing.isActualAvailable && ironing.isActualAvailable && overheadAnalysis.isFullyAbsorbed;
  
  let totalActualPerPiece: number | null = null;
  let deviationValue: number | null = null;
  let deviationPercentage: number | null = null;

  if (isActualComplete) {
    totalActualPerPiece = (fabric.actualPerPiece || 0) + (cutting.actualPerPiece || 0) + (accessories.actualPerPiece || 0) + (printEmbroidery.actualPerPiece || 0) + (sewing.actualPerPiece || 0) + (finishing.actualPerPiece || 0) + (ironing.actualPerPiece || 0) + (overhead.actualPerPiece || 0);
    deviationValue = totalActualPerPiece - totalStandardPerPiece;
    deviationPercentage = totalStandardPerPiece > 0 ? (deviationValue / totalStandardPerPiece) * 100 : 0;
  }

  return {
    standardQty,
    actualQty,
    fabric,
    accessories,
    printEmbroidery,
    sewing,
    cutting,
    finishing,
    ironing,
    overhead,
    overheadAnalysis,
    totalStandardPerPiece,
    totalActualPerPiece,
    deviationValue,
    deviationPercentage,
    isActualComplete
  };
}