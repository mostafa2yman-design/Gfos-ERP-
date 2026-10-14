import { ProductionOrder, PackingInvoice } from "../types";

export interface ProductColorSummary {
  color: string;
  totalQuantity: number;
  percentage: number;
}

export interface FinishedProductItem {
  order: ProductionOrder;
  isApproved: boolean;
  totalPieces: number;
  sizes: string[];
  colors: string[];
  colorBreakdown: ProductColorSummary[];
  matrix: Record<string, Record<string, number>>; // color -> size -> quantity
  sizeTotals: Record<string, number>;
  invoices: PackingInvoice[];
  receivedDate: string;
  approvedBy: string;
  barcodes: string[];
  barcodeMap: Record<string, string>;
  primaryBarcode?: string;
}

export function processOrderItem(order: ProductionOrder): FinishedProductItem {
  const isApproved =
    Boolean(order.packingApprovedAt) ||
    order.status === "التغليف معتمد" ||
    order.packingStatus === "مكتمل";

  const invoices = order.packingInvoices || [];

  // Matrix: color -> size -> quantity
  const matrix: Record<string, Record<string, number>> = {};
  const sizeTotals: Record<string, number> = {};
  let totalPieces = 0;

  // First check if there are actual packing invoice variants recorded
  let hasInvoiceQuantities = false;
  invoices.forEach((inv) => {
    inv.variants?.forEach((v) => {
      const q = Number(v.quantity) || 0;
      if (q > 0) {
        hasInvoiceQuantities = true;
        if (!matrix[v.color]) matrix[v.color] = {};
        matrix[v.color][v.size] = (matrix[v.color][v.size] || 0) + q;
        sizeTotals[v.size] = (sizeTotals[v.size] || 0) + q;
        totalPieces += q;
      }
    });
  });

  // If no invoices or invoice totals are zero, calculate from ironing or cut sizes
  if (!hasInvoiceQuantities) {
    let hasIroning = false;
    order.batches?.forEach((b) => {
      if (b.ironingData?.status === "مكتمل" && b.ironingData.actualQuantities) {
        hasIroning = true;
        b.ironingData.actualQuantities.forEach((q) => {
          const qty = Number((q as any).actualQuantity ?? (q as any).quantity) || 0;
          if (qty > 0) {
            if (!matrix[q.color]) matrix[q.color] = {};
            matrix[q.color][q.size] = (matrix[q.color][q.size] || 0) + qty;
            sizeTotals[q.size] = (sizeTotals[q.size] || 0) + qty;
            totalPieces += qty;
          }
        });
      }
    });

    if (!hasIroning && order.sizes) {
      order.sizes.forEach((s) => {
        s.variants?.forEach((v) => {
          const qty = Number(v.quantity) || 0;
          if (qty > 0) {
            if (!matrix[v.color]) matrix[v.color] = {};
            matrix[v.color][s.size] = (matrix[v.color][s.size] || 0) + qty;
            sizeTotals[s.size] = (sizeTotals[s.size] || 0) + qty;
            totalPieces += qty;
          }
        });
      });
    }
  }

  // Determine all unique sizes and colors
  const colors = Object.keys(matrix);
  const sizesSet = new Set<string>();
  Object.values(matrix).forEach((sizeMap) => {
    Object.keys(sizeMap).forEach((s) => sizesSet.add(s));
  });
  const sizes = Array.from(sizesSet);

  // Color breakdown with percentages
  const colorBreakdown: ProductColorSummary[] = colors
    .map((color) => {
      const colorTotal = Object.values(matrix[color] || {}).reduce(
        (sum, q) => sum + q,
        0
      );
      const percentage =
        totalPieces > 0 ? Math.round((colorTotal / totalPieces) * 100) : 0;
      return {
        color,
        totalQuantity: colorTotal,
        percentage,
      };
    })
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  const receivedDate =
    order.packingApprovedAt || order.updatedAt || order.createdAt;
  const approvedBy = order.packingApprovedBy || "قسم التغليف";

  // Collect barcodes associated with this order and its variants
  const barcodeMap: Record<string, string> = { ...(order.barcodes || {}) };
  const barcodesSet = new Set<string>();
  if (order.barcode) barcodesSet.add(order.barcode);
  Object.values(order.barcodes || {}).forEach(b => { if (b) barcodesSet.add(b); });

  order.batches?.forEach(b => {
    b.finishingData?.actualQuantities?.forEach(q => {
      if (q.barcode) {
        barcodesSet.add(q.barcode);
        barcodeMap[`${q.size}_${q.color}`] = q.barcode;
        barcodeMap[`${b.batchNumber}_${q.size}_${q.color}`] = q.barcode;
      }
    });
  });

  const barcodes = Array.from(barcodesSet);
  const primaryBarcode = barcodes[0] || order.barcode || undefined;

  return {
    order,
    isApproved,
    totalPieces,
    sizes,
    colors,
    colorBreakdown,
    matrix,
    sizeTotals,
    invoices,
    receivedDate,
    approvedBy,
    barcodes,
    barcodeMap,
    primaryBarcode
  };
}
