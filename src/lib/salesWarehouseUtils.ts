import { ProductionOrder, PackingInvoice } from '../types';
import { SalesInvoice, SalesReturn } from '../types/sales';
import { getOrders, saveOrders } from './storage';
import { getSalesInvoices, getSalesReturns } from './salesStorage';
import { processOrderItem } from './finishedGoodsUtils';

export interface OrderVariantStock {
  size: string;
  color: string;
  produced: number;
  sold: number;
  returned: number;
  remaining: number;
  barcode?: string;
}

export interface CompletedOrderStock {
  orderId: string;
  orderNumber: string;
  styleName: string;
  customerName: string;
  category: string;
  totalProduced: number;
  totalSold: number;
  totalReturned: number;
  remainingStock: number;
  primaryBarcode?: string;
  barcodeMap: Record<string, string>;
  variants: OrderVariantStock[];
  receivedDate: string;
  order: ProductionOrder;
}

export interface WarehouseVariantStock {
  size: string;
  color: string;
  remaining: number;
  barcode?: string;
  orderNumber?: string;
  orderId?: string;
}

export interface WarehouseProductStock {
  styleName: string;
  category: string;
  totalStock: number;
  primaryBarcode?: string;
  availableSizes: string[];
  availableColors: string[];
  suggestedPrice: number;
  orders: {
    orderId: string;
    orderNumber: string;
    customerName?: string;
    remaining: number;
  }[];
  variants: WarehouseVariantStock[];
}

/**
 * Initializes default completed production orders matching default sales invoices
 * if the orders storage is currently empty.
 */
export async function ensureDefaultOrdersIfEmpty(): Promise<ProductionOrder[]> {
  const existing = await getOrders();
  if (existing.length > 0) return existing;

  const defaultSeedOrders: ProductionOrder[] = [
    {
      id: 'ord_seed_1',
      orderNumber: 'GFOS-2026-001',
      orderDate: '2026-09-15',
      styleName: 'تيشرت بولو قطن مطرز فاخر',
      customerName: 'سلسلة متاجر النخبة للأزياء',
      category: 'ملابس كاجوال رجالي',
      status: 'التغليف معتمد',
      packingStatus: 'مكتمل',
      packingApprovedAt: '2026-09-20T10:00:00.000Z',
      packingApprovedBy: 'محمود عبد السلام - أمين مخزن التام',
      barcode: 'PM-00001',
      barcodes: {
        'L_أبيض ناصع': 'PM-00001',
        'XL_كحلي داكن': 'PM-00002',
        'M_أبيض ناصع': 'PM-00003'
      },
      packingInvoices: [
        {
          id: 'pack_inv_1',
          customerName: 'سلسلة متاجر النخبة للأزياء',
          date: '2026-09-20',
          variants: [
            { size: 'L', color: 'أبيض ناصع', quantity: 300 },
            { size: 'XL', color: 'كحلي داكن', quantity: 200 },
            { size: 'M', color: 'أبيض ناصع', quantity: 100 }
          ]
        }
      ],
      sizes: [
        {
          size: 'L',
          variants: [{ color: 'أبيض ناصع', quantity: 300 }]
        },
        {
          size: 'XL',
          variants: [{ color: 'كحلي داكن', quantity: 200 }]
        },
        {
          size: 'M',
          variants: [{ color: 'أبيض ناصع', quantity: 100 }]
        }
      ],
      createdAt: '2026-09-15T08:00:00.000Z',
      updatedAt: '2026-09-20T10:00:00.000Z'
    },
    {
      id: 'ord_seed_2',
      orderNumber: 'GFOS-2026-002',
      orderDate: '2026-09-16',
      styleName: 'سويت شيرت هودي ميلتون مبطن',
      customerName: 'شركة الأناقة للملابس الجاهزة والتوزيع',
      category: 'ملابس شتوية',
      status: 'التغليف معتمد',
      packingStatus: 'مكتمل',
      packingApprovedAt: '2026-09-21T09:00:00.000Z',
      packingApprovedBy: 'محمود عبد السلام - أمين مخزن التام',
      barcode: 'PM-00004',
      barcodes: {
        'M_رمادي ميلانج': 'PM-00004',
        'L_أسود ملكي': 'PM-00005',
        'XL_أسود ملكي': 'PM-00006'
      },
      packingInvoices: [
        {
          id: 'pack_inv_2',
          customerName: 'شركة الأناقة للملابس الجاهزة والتوزيع',
          date: '2026-09-21',
          variants: [
            { size: 'M', color: 'رمادي ميلانج', quantity: 250 },
            { size: 'L', color: 'أسود ملكي', quantity: 300 },
            { size: 'XL', color: 'أسود ملكي', quantity: 150 }
          ]
        }
      ],
      sizes: [
        {
          size: 'M',
          variants: [{ color: 'رمادي ميلانج', quantity: 250 }]
        },
        {
          size: 'L',
          variants: [{ color: 'أسود ملكي', quantity: 300 }]
        },
        {
          size: 'XL',
          variants: [{ color: 'أسود ملكي', quantity: 150 }]
        }
      ],
      createdAt: '2026-09-16T08:00:00.000Z',
      updatedAt: '2026-09-21T09:00:00.000Z'
    },
    {
      id: 'ord_seed_3',
      orderNumber: 'GFOS-2026-003',
      orderDate: '2026-09-18',
      styleName: 'بنطلون جبردين كاجوال مطاطي',
      customerName: 'مؤسسة الزهور لتجارة الأقمشة والملابس',
      category: 'بنطلون كاجوال',
      status: 'التغليف معتمد',
      packingStatus: 'مكتمل',
      packingApprovedAt: '2026-09-23T11:00:00.000Z',
      packingApprovedBy: 'محمود عبد السلام - أمين مخزن التام',
      barcode: 'PM-00007',
      barcodes: {
        '32_بيج خاكي': 'PM-00007',
        '34_بيج خاكي': 'PM-00008',
        '36_زيتي داكن': 'PM-00009'
      },
      packingInvoices: [
        {
          id: 'pack_inv_3',
          customerName: 'مؤسسة الزهور لتجارة الأقمشة والملابس',
          date: '2026-09-23',
          variants: [
            { size: '32', color: 'بيج خاكي', quantity: 100 },
            { size: '34', color: 'بيج خاكي', quantity: 150 },
            { size: '36', color: 'زيتي داكن', quantity: 100 }
          ]
        }
      ],
      sizes: [
        {
          size: '32',
          variants: [{ color: 'بيج خاكي', quantity: 100 }]
        },
        {
          size: '34',
          variants: [{ color: 'بيج خاكي', quantity: 150 }]
        },
        {
          size: '36',
          variants: [{ color: 'زيتي داكن', quantity: 100 }]
        }
      ],
      createdAt: '2026-09-18T08:00:00.000Z',
      updatedAt: '2026-09-23T11:00:00.000Z'
    }
  ];

  await saveOrders(defaultSeedOrders);
  return defaultSeedOrders;
}

/**
 * Calculates sold and returned quantities per (orderId/orderNumber/styleName, size, color)
 */
function getSalesDeductionsAndReturns(currentInvoiceId?: string) {
  const invoices = getSalesInvoices();
  const returns = getSalesReturns();

  // Map: `${orderKey}___${size}___${color}` -> quantity
  // Also: `${styleKey}___${size}___${color}` -> quantity
  // And totals: `${orderKey}` -> quantity, `${styleKey}` -> quantity
  const soldByOrderVariant: Record<string, number> = {};
  const soldByStyleVariant: Record<string, number> = {};
  const soldByOrderTotal: Record<string, number> = {};
  const soldByStyleTotal: Record<string, number> = {};

  const returnedByOrderVariant: Record<string, number> = {};
  const returnedByStyleVariant: Record<string, number> = {};
  const returnedByOrderTotal: Record<string, number> = {};
  const returnedByStyleTotal: Record<string, number> = {};

  invoices.forEach(inv => {
    // If editing, exclude this invoice so we don't count its own items as already sold
    if (currentInvoiceId && inv.id === currentInvoiceId) return;

    inv.items?.forEach(item => {
      const orderKey = (item.orderNumber || item.orderId || inv.relatedOrderNumber || inv.relatedOrderId || '').trim();
      const styleKey = (item.styleName || '').trim().toLowerCase();

      if (item.variants && item.variants.length > 0) {
        item.variants.forEach(v => {
          const q = Number(v.quantity) || 0;
          if (q <= 0) return;

          if (orderKey) {
            const ovKey = `${orderKey}___${v.size}___${v.color}`;
            soldByOrderVariant[ovKey] = (soldByOrderVariant[ovKey] || 0) + q;
            soldByOrderTotal[orderKey] = (soldByOrderTotal[orderKey] || 0) + q;
          }
          if (styleKey) {
            const svKey = `${styleKey}___${v.size}___${v.color}`;
            soldByStyleVariant[svKey] = (soldByStyleVariant[svKey] || 0) + q;
            soldByStyleTotal[styleKey] = (soldByStyleTotal[styleKey] || 0) + q;
          }
        });
      } else {
        const q = Number(item.quantity) || 0;
        if (q <= 0) return;

        if (orderKey) {
          const ovKey = `${orderKey}___${item.size}___${item.color}`;
          soldByOrderVariant[ovKey] = (soldByOrderVariant[ovKey] || 0) + q;
          soldByOrderTotal[orderKey] = (soldByOrderTotal[orderKey] || 0) + q;
        }
        if (styleKey) {
          const svKey = `${styleKey}___${item.size}___${item.color}`;
          soldByStyleVariant[svKey] = (soldByStyleVariant[svKey] || 0) + q;
          soldByStyleTotal[styleKey] = (soldByStyleTotal[styleKey] || 0) + q;
        }
      }
    });
  });

  returns.forEach(ret => {
    if (!ret.stockReturned) return;

    ret.items?.forEach(item => {
      if (item.condition !== 'good') return;
      const q = Number(item.quantity) || 0;
      if (q <= 0) return;

      const orderKey = (item.orderNumber || item.orderId || '').trim();
      const styleKey = (item.styleName || '').trim().toLowerCase();

      if (orderKey) {
        const ovKey = `${orderKey}___${item.size}___${item.color}`;
        returnedByOrderVariant[ovKey] = (returnedByOrderVariant[ovKey] || 0) + q;
        returnedByOrderTotal[orderKey] = (returnedByOrderTotal[orderKey] || 0) + q;
      }
      if (styleKey) {
        const svKey = `${styleKey}___${item.size}___${item.color}`;
        returnedByStyleVariant[svKey] = (returnedByStyleVariant[svKey] || 0) + q;
        returnedByStyleTotal[styleKey] = (returnedByStyleTotal[styleKey] || 0) + q;
      }
    });
  });

  return {
    soldByOrderVariant,
    soldByStyleVariant,
    soldByOrderTotal,
    soldByStyleTotal,
    returnedByOrderVariant,
    returnedByStyleVariant,
    returnedByOrderTotal,
    returnedByStyleTotal
  };
}

/**
 * Returns all completed production orders with their remaining finished goods warehouse balances.
 */
export async function getCompletedOrdersStock(currentInvoiceId?: string): Promise<CompletedOrderStock[]> {
  const allOrders = await ensureDefaultOrdersIfEmpty();
  const {
    soldByOrderVariant,
    soldByOrderTotal,
    returnedByOrderVariant,
    returnedByOrderTotal
  } = getSalesDeductionsAndReturns(currentInvoiceId);

  const completedList: CompletedOrderStock[] = [];

  for (const order of allOrders) {
    const isCompleted =
      Boolean(order.packingApprovedAt) ||
      order.status === 'التغليف معتمد' ||
      order.packingStatus === 'مكتمل' ||
      (order.packingInvoices && order.packingInvoices.length > 0) ||
      order.batches?.some(b => b.ironingData?.status === 'مكتمل');

    if (!isCompleted) continue;

    const processed = processOrderItem(order);
    const orderNum = order.orderNumber || order.id;

    // Collect all variants
    const variantList: OrderVariantStock[] = [];
    let calculatedProduced = 0;

    Object.entries(processed.matrix).forEach(([color, sizeMap]) => {
      Object.entries(sizeMap).forEach(([size, qty]) => {
        const produced = Number(qty) || 0;
        calculatedProduced += produced;

        // Check sold using orderNumber or order.id
        const soldByNum = soldByOrderVariant[`${orderNum}___${size}___${color}`] || 0;
        const soldById = order.id ? (soldByOrderVariant[`${order.id}___${size}___${color}`] || 0) : 0;
        const sold = Math.max(soldByNum, soldById);

        const retByNum = returnedByOrderVariant[`${orderNum}___${size}___${color}`] || 0;
        const retById = order.id ? (returnedByOrderVariant[`${order.id}___${size}___${color}`] || 0) : 0;
        const returned = Math.max(retByNum, retById);

        const remaining = Math.max(0, produced - sold + returned);
        const barcode =
          processed.barcodeMap[`${size}_${color}`] ||
          order.barcodes?.[`${size}_${color}`] ||
          processed.primaryBarcode;

        variantList.push({
          size,
          color,
          produced,
          sold,
          returned,
          remaining,
          barcode
        });
      });
    });

    const totalSoldByNum = soldByOrderTotal[orderNum] || 0;
    const totalSoldById = order.id ? (soldByOrderTotal[order.id] || 0) : 0;
    const totalSold = Math.max(totalSoldByNum, totalSoldById);

    const totalRetByNum = returnedByOrderTotal[orderNum] || 0;
    const totalRetById = order.id ? (returnedByOrderTotal[order.id] || 0) : 0;
    const totalReturned = Math.max(totalRetByNum, totalRetById);

    const totalProduced = processed.totalPieces || calculatedProduced;
    const remainingStock = Math.max(0, totalProduced - totalSold + totalReturned);

    completedList.push({
      orderId: order.id,
      orderNumber: orderNum,
      styleName: order.styleName || 'منتج تام',
      customerName: order.customerName || 'عميل عام',
      category: order.category || 'ملابس جاهزة',
      totalProduced,
      totalSold,
      totalReturned,
      remainingStock,
      primaryBarcode: processed.primaryBarcode,
      barcodeMap: processed.barcodeMap,
      variants: variantList,
      receivedDate: processed.receivedDate,
      order
    });
  }

  // Sort by received date or order number descending
  completedList.sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
  return completedList;
}

/**
 * Returns all warehouse products aggregated across completed orders,
 * with total remaining stock and size/color distribution.
 */
export async function getWarehouseProductsStock(currentInvoiceId?: string): Promise<WarehouseProductStock[]> {
  const completedOrders = await getCompletedOrdersStock(currentInvoiceId);

  // Group by styleName (trimmed, lowercased key)
  const productMap: Record<string, WarehouseProductStock> = {};

  for (const ord of completedOrders) {
    const rawStyle = ord.styleName.trim();
    if (!rawStyle) continue;
    const key = rawStyle.toLowerCase();

    if (!productMap[key]) {
      productMap[key] = {
        styleName: rawStyle,
        category: ord.category || 'ملابس جاهزة',
        totalStock: 0,
        primaryBarcode: ord.primaryBarcode,
        availableSizes: [],
        availableColors: [],
        suggestedPrice: 280, // Default base price
        orders: [],
        variants: []
      };
    }

    const prod = productMap[key];
    prod.totalStock += ord.remainingStock;

    prod.orders.push({
      orderId: ord.orderId,
      orderNumber: ord.orderNumber,
      customerName: ord.customerName,
      remaining: ord.remainingStock
    });

    // Merge variants
    for (const v of ord.variants) {
      if (v.remaining <= 0) continue;

      const existingVar = prod.variants.find(
        pv => pv.size === v.size && pv.color === v.color
      );

      if (existingVar) {
        existingVar.remaining += v.remaining;
        if (!existingVar.barcode && v.barcode) {
          existingVar.barcode = v.barcode;
        }
      } else {
        prod.variants.push({
          size: v.size,
          color: v.color,
          remaining: v.remaining,
          barcode: v.barcode,
          orderNumber: ord.orderNumber,
          orderId: ord.orderId
        });
      }

      if (!prod.availableSizes.includes(v.size)) prod.availableSizes.push(v.size);
      if (!prod.availableColors.includes(v.color)) prod.availableColors.push(v.color);
    }

    if (!prod.primaryBarcode && ord.primaryBarcode) {
      prod.primaryBarcode = ord.primaryBarcode;
    }
  }

  // Convert to array and filter out products with 0 stock unless desired
  const products = Object.values(productMap);
  // Sort by highest stock first
  products.sort((a, b) => b.totalStock - a.totalStock);
  return products;
}
