import { ProductionOrder, MaterialInstance, CutOrderData } from '../types';

export interface FabricAnalysisForColor {
  color: string;
  plannedPieces: number;
  actualPieces: number;
  standardWeightStr: string; // display string
  requiredFabric: number; // in kg
  actualFabric: number; // in kg
  variance: number | null;
  variancePercentage: number | null;
  standardCostPerPiece: number;
  actualCostPerPiece: number | null;
  costVariance: number | null;
  costVariancePercentage: number | null;
}

export interface FabricAnalysisSummary {
  primaryFabric: MaterialInstance | null;
  colors: FabricAnalysisForColor[];
  totalPlannedPieces: number;
  totalActualPieces: number;
  totalRequiredFabric: number;
  totalActualFabric: number; // Might be from legacy actualWeight if actualWeightByColor is missing
  hasColorLevelActuals: boolean;
  totalVariance: number | null;
  totalVariancePercentage: number | null;
  averageStandardWeightPerPiece: number;
  averageActualWeightPerPiece: number | null;
  pieceWeightVariance: number | null;
  pieceWeightVariancePercentage: number | null;
  fabricPrice: number;
  averageStandardCostPerPiece: number;
  averageActualCostPerPiece: number | null;
  totalCostVariance: number | null;
  totalCostVariancePercentage: number | null;
}

export function getPrimaryFabric(order: ProductionOrder): MaterialInstance | null {
  if (!order.materials || order.materials.length === 0) return null;
  const fabric = order.materials.find(m => m.type.includes('قماش') || m.name.includes('قماش'));
  if (fabric) return fabric;
  return order.materials[0];
}

export function calculateFabricAnalysis(order: ProductionOrder, cutData?: CutOrderData): FabricAnalysisSummary | null {
  const fabric = getPrimaryFabric(order);
  if (!fabric) return null;

  const isUnified = fabric.standardMethod === 'موحد';
  const sizeStandards = new Map<string, number>();
  if (!isUnified && fabric.sizeStandards) {
    fabric.sizeStandards.forEach(s => sizeStandards.set(s.size, s.standard));
  }

  const getStandardForSize = (size: string) => {
    if (isUnified) return fabric.unifiedStandard || 0;
    return sizeStandards.get(size) || 0;
  };

  const fabricPrice = fabric.standardPrice || 0;

  const colorMap = new Map<string, { planned: number, actualPieces: number, requiredFabric: number, actualFabric: number }>();

  order.sizes.forEach(sizeData => {
    const sizeStd = getStandardForSize(sizeData.size);
    sizeData.variants.forEach(v => {
      if (!colorMap.has(v.color)) {
        colorMap.set(v.color, { planned: 0, actualPieces: 0, requiredFabric: 0, actualFabric: 0 });
      }
      const data = colorMap.get(v.color)!;
      data.planned += v.quantity;
      data.requiredFabric += (v.quantity * sizeStd);
    });
  });

  const hasColorLevelActuals = !!(cutData && cutData.actualWeightByColor && Object.keys(cutData.actualWeightByColor).length > 0);
  
  if (cutData) {
    cutData.sizes.forEach(sizeData => {
      sizeData.variants.forEach(v => {
        if (colorMap.has(v.color)) {
          const data = colorMap.get(v.color)!;
          data.actualPieces += (v.actualQuantity || 0);
        }
      });
    });
    
    if (hasColorLevelActuals && cutData.actualWeightByColor) {
      Object.entries(cutData.actualWeightByColor).forEach(([color, weight]) => {
        if (colorMap.has(color)) {
          colorMap.get(color)!.actualFabric = weight || 0;
        }
      });
    }
  }

  const colorsAnalysis: FabricAnalysisForColor[] = [];
  let totalPlannedPieces = 0;
  let totalActualPieces = 0;
  let totalRequiredFabric = 0;
  let totalActualFabric = 0;

  Array.from(colorMap.entries()).forEach(([color, data]) => {
    const variance = hasColorLevelActuals && data.actualFabric > 0 ? (data.actualFabric - data.requiredFabric) : null;
    const variancePercentage = hasColorLevelActuals && data.requiredFabric > 0 && data.actualFabric > 0 ? (variance! / data.requiredFabric) * 100 : null;
    
    const avgStdWeight = data.planned > 0 ? (data.requiredFabric / data.planned) : 0;
    
    const standardCostPerPiece = avgStdWeight * fabricPrice;
    let actualCostPerPiece = null;
    let costVariance = null;
    let costVariancePercentage = null;

    if (hasColorLevelActuals && data.actualFabric > 0 && data.actualPieces > 0) {
      const avgActWeight = data.actualFabric / data.actualPieces;
      actualCostPerPiece = avgActWeight * fabricPrice;
      costVariance = actualCostPerPiece - standardCostPerPiece;
      costVariancePercentage = standardCostPerPiece > 0 ? (costVariance / standardCostPerPiece) * 100 : 0;
    }

    colorsAnalysis.push({
      color,
      plannedPieces: data.planned,
      actualPieces: data.actualPieces,
      standardWeightStr: isUnified ? fabric.unifiedStandard.toString() : Number(avgStdWeight).toFixed(3),
      requiredFabric: data.requiredFabric,
      actualFabric: data.actualFabric,
      variance,
      variancePercentage,
      standardCostPerPiece,
      actualCostPerPiece,
      costVariance,
      costVariancePercentage
    });

    totalPlannedPieces += data.planned;
    totalActualPieces += data.actualPieces;
    totalRequiredFabric += data.requiredFabric;
    if (hasColorLevelActuals) {
      totalActualFabric += data.actualFabric;
    }
  });

  // Handle legacy total
  if (cutData && !hasColorLevelActuals && cutData.actualWeight > 0) {
    totalActualFabric = cutData.actualWeight;
  }

  const totalVariance = totalActualFabric > 0 ? (totalActualFabric - totalRequiredFabric) : null;
  const totalVariancePercentage = totalVariance !== null && totalRequiredFabric > 0 ? (totalVariance / totalRequiredFabric) * 100 : null;

  const averageStandardWeightPerPiece = totalPlannedPieces > 0 ? (totalRequiredFabric / totalPlannedPieces) : 0;
  
  let averageActualWeightPerPiece: number | null = null;
  let pieceWeightVariance: number | null = null;
  let pieceWeightVariancePercentage: number | null = null;

  const averageStandardCostPerPiece = averageStandardWeightPerPiece * fabricPrice;
  let averageActualCostPerPiece: number | null = null;
  let totalCostVariance: number | null = null;
  let totalCostVariancePercentage: number | null = null;

  if (totalActualFabric > 0 && totalActualPieces > 0) {
    averageActualWeightPerPiece = totalActualFabric / totalActualPieces;
    pieceWeightVariance = averageActualWeightPerPiece - averageStandardWeightPerPiece;
    pieceWeightVariancePercentage = averageStandardWeightPerPiece > 0 ? (pieceWeightVariance / averageStandardWeightPerPiece) * 100 : 0;
    
    averageActualCostPerPiece = averageActualWeightPerPiece * fabricPrice;
    totalCostVariance = averageActualCostPerPiece - averageStandardCostPerPiece;
    totalCostVariancePercentage = averageStandardCostPerPiece > 0 ? (totalCostVariance / averageStandardCostPerPiece) * 100 : 0;
  }

  return {
    primaryFabric: fabric,
    colors: colorsAnalysis,
    totalPlannedPieces,
    totalActualPieces,
    totalRequiredFabric,
    totalActualFabric,
    hasColorLevelActuals,
    totalVariance,
    totalVariancePercentage,
    averageStandardWeightPerPiece,
    averageActualWeightPerPiece,
    pieceWeightVariance,
    pieceWeightVariancePercentage,
    fabricPrice,
    averageStandardCostPerPiece,
    averageActualCostPerPiece,
    totalCostVariance,
    totalCostVariancePercentage
  };
}
