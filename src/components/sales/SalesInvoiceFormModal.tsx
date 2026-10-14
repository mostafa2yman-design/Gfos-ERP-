import React, { useState, useEffect } from 'react';
import {
  SalesInvoice,
  SalesInvoiceItem,
  SalesPaymentMethod,
  SalesPaymentStatus,
  SalesDeliveryStatus
} from '../../types/sales';
import { CustomerSupplier, ProductionOrder } from '../../types';
import { getCustomersSuppliers } from '../../lib/accountingStorage';
import { getOrders } from '../../lib/storage';
import { generateNextSalesInvoiceNumber } from '../../lib/salesStorage';
import { QuickAddCustomerModal } from './QuickAddCustomerModal';
import { WarehouseItemSelector } from './WarehouseItemSelector';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Building,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  UserPlus,
  Percent,
  Download,
  AlertCircle,
  Barcode,
  Eye,
  EyeOff,
  Boxes,
  PackageCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SalesInvoiceFormModalProps {
  invoice?: SalesInvoice | null;
  onClose: () => void;
  onSave: (invoice: SalesInvoice) => void;
}

export function SalesInvoiceFormModal({ invoice, onClose, onSave }: SalesInvoiceFormModalProps) {
  const isEditing = Boolean(invoice);

  // Lists
  const [customers, setCustomers] = useState<CustomerSupplier[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);

  // Form Fields
  const [invoiceNumber, setInvoiceNumber] = useState(
    invoice?.invoiceNumber || generateNextSalesInvoiceNumber()
  );
  const [date, setDate] = useState(invoice?.date || new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(invoice?.customerId || '');
  const [customerName, setCustomerName] = useState(invoice?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(invoice?.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(invoice?.customerAddress || '');
  const [customerTaxId, setCustomerTaxId] = useState(invoice?.customerTaxId || '');
  const [relatedOrderId, setRelatedOrderId] = useState(invoice?.relatedOrderId || '');
  const [relatedOrderNumber, setRelatedOrderNumber] = useState(invoice?.relatedOrderNumber || '');

  // Payment & Delivery
  const [paymentMethod, setPaymentMethod] = useState<SalesPaymentMethod>(
    invoice?.paymentMethod || 'cash'
  );
  const [deliveryStatus, setDeliveryStatus] = useState<SalesDeliveryStatus>(
    invoice?.deliveryStatus || 'delivered'
  );
  const [dueDate, setDueDate] = useState(invoice?.dueDate || '');
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [salesperson, setSalesperson] = useState(invoice?.salesperson || 'مدير المبيعات');
  const [barcodeScanInput, setBarcodeScanInput] = useState('');
  const [barcodeScanFeedback, setBarcodeScanFeedback] = useState<string | null>(null);

  // Items
  const [items, setItems] = useState<SalesInvoiceItem[]>(
    invoice?.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            id: `item_${Date.now()}_1`,
            styleName: '',
            category: 'ملابس كاجوال',
            size: 'L',
            color: 'أبيض',
            unit: 'قطعة',
            quantity: 100,
            unitPrice: 250,
            discount: 0,
            total: 25000
          }
        ]
  );

  // Financials
  const [discountTotal, setDiscountTotal] = useState<number>(invoice?.discountTotal || 0);
  const [taxPercent, setTaxPercent] = useState<number>(invoice?.taxPercent || 0);
  const [shippingCost, setShippingCost] = useState<number>(invoice?.shippingCost || 0);
  const [paidAmount, setPaidAmount] = useState<number>(
    invoice?.paidAmount !== undefined ? invoice.paidAmount : 25000
  );

  // Invoice Details Visibility Toggle (إظهار تفاصيل الفاتورة أو إخفاء التفاصيل)
  const [showDetails, setShowDetails] = useState<boolean>(invoice?.showDetails !== false);
  const [showWarehouseSelector, setShowWarehouseSelector] = useState<boolean>(true);
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  const handleAddFromWarehouseProduct = (item: SalesInvoiceItem) => {
    // If the only item is an empty initial placeholder, replace it
    if (items.length === 1 && !items[0].styleName.trim()) {
      setItems([item]);
    } else {
      setItems(prev => [item, ...prev]);
    }
    setPaidAmount(prev => (prev > 0 ? prev + item.total : item.total));
  };

  const handleAddFromOrderStock = (
    orderStock: any,
    _itemsToAdd: SalesInvoiceItem[],
    consolidatedItem?: SalesInvoiceItem
  ) => {
    setRelatedOrderId(orderStock.orderId);
    setRelatedOrderNumber(orderStock.orderNumber);

    if (!selectedCustomerId && orderStock.customerName) {
      const matchCust = customers.find(c => c.name === orderStock.customerName);
      if (matchCust) {
        handleCustomerChange(matchCust.id);
      } else {
        setCustomerName(orderStock.customerName);
      }
    }

    if (consolidatedItem) {
      if (items.length === 1 && !items[0].styleName.trim()) {
        setItems([consolidatedItem]);
      } else {
        setItems(prev => [consolidatedItem, ...prev]);
      }
      setPaidAmount(prev => (prev > 0 ? prev + consolidatedItem.total : consolidatedItem.total));
    }
  };

  // Load customers and orders
  useEffect(() => {
    const custs = getCustomersSuppliers().filter(c => c.type === 'customer' || c.type === 'both');
    setCustomers(custs);

    getOrders().then(ords => {
      setOrders(ords.filter(o => o.status !== 'مسودة'));
    });
  }, []);

  // Sync customer details when selecting from dropdown
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const found = customers.find(c => c.id === customerId);
    if (found) {
      setCustomerName(found.name);
      if (found.phone) setCustomerPhone(found.phone);
      if (found.address) setCustomerAddress(found.address);
      if (found.taxId) setCustomerTaxId(found.taxId);
    }
  };

  // Import items from an approved production order
  const handleImportFromOrder = (orderId: string) => {
    const ord = orders.find(o => o.id === orderId);
    if (!ord) return;

    setRelatedOrderId(ord.id);
    setRelatedOrderNumber(ord.orderNumber);

    // If customer matches order customer, auto-fill
    if (!selectedCustomerId && ord.customerName) {
      const matchCust = customers.find(c => c.name === ord.customerName);
      if (matchCust) {
        handleCustomerChange(matchCust.id);
      } else {
        setCustomerName(ord.customerName);
      }
    }

    const importedItems: SalesInvoiceItem[] = [];

    // Extract variants from packing invoices or sizes
    if (ord.packingInvoices && ord.packingInvoices.length > 0) {
      ord.packingInvoices.forEach(inv => {
        inv.variants?.forEach(v => {
          const q = Number(v.quantity) || 0;
          if (q > 0) {
            const variantBarcode = 
              ord.barcodes?.[`${v.size}_${v.color}`] ||
              ord.batches?.find(b => b.finishingData?.actualQuantities?.some(fq => fq.size === v.size && fq.color === v.color))
                ?.finishingData?.actualQuantities?.find(fq => fq.size === v.size && fq.color === v.color)?.barcode ||
              ord.barcode ||
              '';

            importedItems.push({
              id: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              orderId: ord.id,
              orderNumber: ord.orderNumber,
              barcode: variantBarcode,
              styleName: ord.styleName || 'منتج تام',
              category: ord.category || 'ملابس جاهزة',
              size: v.size,
              color: v.color,
              unit: 'قطعة',
              quantity: q,
              unitPrice: 280,
              discount: 0,
              total: q * 280
            });
          }
        });
      });
    } else if (ord.sizes && ord.sizes.length > 0) {
      ord.sizes.forEach(s => {
        s.variants?.forEach(v => {
          const q = Number(v.quantity) || 0;
          if (q > 0) {
            const variantBarcode = 
              ord.barcodes?.[`${s.size}_${v.color}`] ||
              ord.batches?.find(b => b.finishingData?.actualQuantities?.some(fq => fq.size === s.size && fq.color === v.color))
                ?.finishingData?.actualQuantities?.find(fq => fq.size === s.size && fq.color === v.color)?.barcode ||
              ord.barcode ||
              '';

            importedItems.push({
              id: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              orderId: ord.id,
              orderNumber: ord.orderNumber,
              barcode: variantBarcode,
              styleName: ord.styleName || 'منتج تام',
              category: ord.category || 'ملابس جاهزة',
              size: s.size,
              color: v.color,
              unit: 'قطعة',
              quantity: q,
              unitPrice: 280,
              discount: 0,
              total: q * 280
            });
          }
        });
      });
    }

    if (importedItems.length > 0) {
      setItems(importedItems);
      const newSubtotal = importedItems.reduce((sum, it) => sum + it.total, 0);
      setPaidAmount(newSubtotal);
    }
  };

  // Scan or manual barcode lookup handler
  const handleBarcodeScan = (scannedCode: string) => {
    const raw = scannedCode.trim().toUpperCase();
    if (!raw) return;

    // Search across orders for product matching barcode
    let matchedOrder: ProductionOrder | undefined;
    let matchedSize = 'L';
    let matchedColor = 'أبيض';
    let matchedPrice = 280;

    for (const ord of orders) {
      // 1. Check order.barcodes
      if (ord.barcodes) {
        for (const [key, code] of Object.entries(ord.barcodes)) {
          if (code && typeof code === 'string' && code.toUpperCase() === raw) {
            matchedOrder = ord;
            const parts = key.split('_');
            if (parts.length >= 2) {
              matchedSize = parts[parts.length - 2];
              matchedColor = parts[parts.length - 1];
            }
            break;
          }
        }
      }
      if (matchedOrder) break;

      // 2. Check batches finishing data
      if (ord.batches) {
        for (const b of ord.batches) {
          const q = b.finishingData?.actualQuantities?.find(fq => fq.barcode && fq.barcode.toUpperCase() === raw);
          if (q) {
            matchedOrder = ord;
            matchedSize = q.size;
            matchedColor = q.color;
            break;
          }
        }
      }
      if (matchedOrder) break;

      // 3. Check order.barcode
      if (ord.barcode && ord.barcode.toUpperCase() === raw) {
        matchedOrder = ord;
        if (ord.sizes && ord.sizes[0]) {
          matchedSize = ord.sizes[0].size;
          matchedColor = ord.sizes[0].variants?.[0]?.color || 'أبيض';
        }
        break;
      }
    }

    if (matchedOrder) {
      // Check if item already exists in current invoice items with this barcode
      const existingIdx = items.findIndex(it => it.barcode && it.barcode.toUpperCase() === raw);
      if (existingIdx >= 0) {
        setItems(prev => prev.map((it, idx) => {
          if (idx !== existingIdx) return it;
          const newQty = it.quantity + 1;
          const newTotal = (newQty * it.unitPrice) - it.discount;
          return { ...it, quantity: newQty, total: Math.max(0, newTotal) };
        }));
        setBarcodeScanFeedback(`✓ تم زيادة كمية الصنف (${matchedOrder.styleName} - ${raw}) بمقدار 1`);
      } else {
        const newItem: SalesInvoiceItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          orderId: matchedOrder.id,
          orderNumber: matchedOrder.orderNumber,
          barcode: raw,
          styleName: matchedOrder.styleName || 'منتج تام',
          category: matchedOrder.category || 'ملابس جاهزة',
          size: matchedSize,
          color: matchedColor,
          unit: 'قطعة',
          quantity: 1,
          unitPrice: matchedPrice,
          discount: 0,
          total: matchedPrice
        };
        setItems(prev => [...prev, newItem]);
        setBarcodeScanFeedback(`✓ تم إضافة المنتج (${matchedOrder.styleName} - باركود ${raw}) بنجاح`);
      }
      setBarcodeScanInput('');
      setTimeout(() => setBarcodeScanFeedback(null), 3500);
    } else {
      // Add custom line with this barcode
      const newItem: SalesInvoiceItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        barcode: raw,
        styleName: `صنف باركود (${raw})`,
        category: 'ملابس جاهزة',
        size: 'L',
        color: 'أبيض',
        unit: 'قطعة',
        quantity: 1,
        unitPrice: 280,
        discount: 0,
        total: 280
      };
      setItems(prev => [...prev, newItem]);
      setBarcodeScanFeedback(`✓ تم إضافة بند بكود الباركود (${raw})`);
      setBarcodeScanInput('');
      setTimeout(() => setBarcodeScanFeedback(null), 3500);
    }
  };

  // Add Item Line
  const handleAddItem = () => {
    const newItem: SalesInvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      styleName: '',
      category: 'ملابس كاجوال',
      size: 'L',
      color: 'أبيض',
      unit: 'قطعة',
      quantity: 50,
      unitPrice: 250,
      discount: 0,
      total: 12500
    };
    setItems(prev => [...prev, newItem]);
  };

  // Remove Item Line
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setFormError('يجب أن تحتوي الفاتورة على بند واحد على الأقل');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const handleItemChange = (index: number, field: keyof SalesInvoiceItem, val: any) => {
    setItems(prev => {
      const copy = [...prev];
      const cur = { ...copy[index], [field]: val };

      // Recalculate total if quantity, unitPrice or discount changes
      if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
        const q = Number(cur.quantity) || 0;
        const p = Number(cur.unitPrice) || 0;
        const d = Number(cur.discount) || 0;
        cur.total = Math.max(0, q * p - d);
      }

      copy[index] = cur;
      return copy;
    });
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  const taxAmount = Math.round((subtotal - discountTotal) * (taxPercent / 100));
  const grandTotal = Math.max(0, subtotal - discountTotal + taxAmount + shippingCost);
  const remainingAmount = Math.max(0, grandTotal - paidAmount);

  // Determine Payment Status
  const paymentStatus: SalesPaymentStatus =
    paidAmount >= grandTotal && grandTotal > 0
      ? 'paid'
      : paidAmount > 0
      ? 'partial'
      : 'unpaid';

  // Quick set full paid or unpaid
  const handleSetFullPaid = () => {
    setPaidAmount(grandTotal);
    setPaymentMethod('cash');
  };

  const handleSetUnpaidCredit = () => {
    setPaidAmount(0);
    setPaymentMethod('credit');
    if (!dueDate) {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      setDueDate(nextMonth.toISOString().split('T')[0]);
    }
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('يرجى تحديد أو إدخال اسم العميل');
      return;
    }

    if (items.length === 0) {
      setFormError('يرجى إضافة بند واحد على الأقل في الفاتورة');
      return;
    }

    const invalidItem = items.find(it => !it.styleName.trim() || Number(it.quantity) <= 0);
    if (invalidItem) {
      setFormError('يرجى التأكد من كتابة اسم الموديل والكمية لجميع البنود');
      return;
    }

    const newInvoice: SalesInvoice = {
      id: invoice?.id || `sal_${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || generateNextSalesInvoiceNumber(),
      date,
      customerId: selectedCustomerId || `cust_walkin_${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      customerTaxId: customerTaxId.trim() || undefined,
      relatedOrderId: relatedOrderId || undefined,
      relatedOrderNumber: relatedOrderNumber || undefined,
      showDetails,
      items,
      subtotal,
      discountTotal,
      taxPercent,
      taxAmount,
      shippingCost,
      grandTotal,
      paidAmount,
      remainingAmount,
      paymentMethod,
      paymentStatus,
      deliveryStatus,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      salesperson: salesperson.trim() || undefined,
      createdAt: invoice?.createdAt || new Date().toISOString()
    };

    onSave(newInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black">
                {isEditing ? `تعديل فاتورة المبيعات (${invoice?.invoiceNumber})` : 'إصدار فاتورة مبيعات جديدة'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تسجيل بيع ملابس جاهزة وتوريد منتجات تامة وإثبات القيود المحاسبية تلقائياً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {formError && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Top Row: Meta info & Import from Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-blue-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الفاتورة</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">استيراد من أمر إنتاج</label>
              <select
                value={relatedOrderId}
                onChange={e => handleImportFromOrder(e.target.value)}
                className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-xs font-bold bg-indigo-50/50 text-indigo-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">-- اختياري: اختر أمر شغل --</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} - {o.styleName} ({o.customerName || 'عميل'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">مسؤول المبيعات</label>
              <input
                type="text"
                value={salesperson}
                onChange={e => setSalesperson(e.target.value)}
                placeholder="اسم البائع"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Customer Selection Box */}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-600" />
                بيانات العميل والمشتري
              </span>
              <button
                type="button"
                onClick={() => setShowQuickAddCustomer(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>إضافة عميل جديد سريع</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  اختر من دليل العملاء
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- عميل عام / غير مسجل --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  اسم العميل بالفاتورة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="اسم العميل أو المعرض"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">العنوان / الفرع</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="المدينة / المنطقة"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Warehouse & Completed Production Orders Selector Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowWarehouseSelector(!showWarehouseSelector)}
                className="text-xs font-black text-slate-800 flex items-center gap-2 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <div className="p-1 rounded-lg bg-indigo-100 text-indigo-700">
                  {showWarehouseSelector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
                <span>الاختيار من أمر إنتاج مكتمل أو من أصناف المخزن التام</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  مع عرض الرصيد المتبقي
                </span>
              </button>
            </div>

            {showWarehouseSelector && (
              <WarehouseItemSelector
                currentInvoiceId={invoice?.id}
                onAddFromWarehouseProduct={handleAddFromWarehouseProduct}
                onAddFromOrder={handleAddFromOrderStock}
              />
            )}
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h4 className="text-sm font-black text-slate-900">بنود الفاتورة والمنتجات التامة</h4>
                <p className="text-xs text-slate-500">
                  {showDetails
                    ? 'وضع إظهار التفاصيل: تظهر أعداد وألوان الموديل تفصيلياً في الفاتورة'
                    : 'وضع إخفاء التفاصيل: يظهر الإجمالي فقط للصنف في الفاتورة'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Toggle Show/Hide Details */}
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    showDetails
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                  title="التبديل بين إظهار تفاصيل أعداد وألوان الموديل أو إخفاء التفاصيل لإظهار الإجمالي فقط"
                >
                  {showDetails ? <Eye className="w-4 h-4 text-blue-100" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                  <span>{showDetails ? 'إظهار تفاصيل الفاتورة (أعداد وألوان الموديل)' : 'إخفاء التفاصيل (الإجمالي فقط للصنف)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة بند يدوي</span>
                </button>
              </div>
            </div>

            {/* Barcode Quick Scanner Bar */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-2xs">
                  <Barcode className="w-4 h-4" />
                </div>
                <div className="flex-1 max-w-md relative">
                  <input
                    type="text"
                    value={barcodeScanInput}
                    onChange={e => setBarcodeScanInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBarcodeScan(barcodeScanInput);
                      }
                    }}
                    placeholder="مسح قارئ الباركود أو كتابة الكود (مثال: PM-00001) ثم Enter..."
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                    dir="ltr"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleBarcodeScan(barcodeScanInput)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  إضافة بالباركود
                </button>
              </div>

              {barcodeScanFeedback && (
                <div className="text-xs font-bold text-indigo-900 bg-white border border-indigo-200 px-3 py-1 rounded-lg animate-in fade-in">
                  {barcodeScanFeedback}
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right min-w-[820px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3 w-28 text-center">كود الباركود</th>
                      <th className="py-2.5 px-3">اسم الموديل / الصنف</th>
                      {showDetails && <th className="py-2.5 px-3 w-24">المقاس</th>}
                      {showDetails && <th className="py-2.5 px-3 w-24">اللون</th>}
                      <th className="py-2.5 px-3 w-24 text-center">
                        {showDetails ? 'الكمية' : 'إجمالي الكمية للصنف'}
                      </th>
                      <th className="py-2.5 px-3 w-20 text-center">الوحدة</th>
                      <th className="py-2.5 px-3 w-28 text-center">سعر الوحدة</th>
                      <th className="py-2.5 px-3 w-24 text-center">الخصم</th>
                      <th className="py-2.5 px-3 w-28 text-left">الإجمالي</th>
                      <th className="py-2.5 px-3 w-10 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((item, index) => {
                      const hasVariants = Boolean(item.variants && item.variants.length > 0);
                      const isExpanded = expandedRowIndex === index;

                      return (
                        <React.Fragment key={item.id}>
                          <tr className={`hover:bg-slate-50/70 ${hasVariants ? 'bg-indigo-50/15' : ''}`}>
                            <td className="py-2.5 px-3 text-slate-400 font-bold">{index + 1}</td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                placeholder="PM-00001"
                                value={item.barcode || ''}
                                onChange={e => handleItemChange(index, 'barcode', e.target.value.toUpperCase())}
                                className="w-full px-2 py-1.5 border border-indigo-200 bg-indigo-50/40 rounded-lg text-xs font-mono font-bold text-indigo-900 focus:bg-white text-center uppercase"
                                dir="ltr"
                                title="كود الباركود التسلسلي المعتمد"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                required
                                placeholder="مثال: تيشرت بولو صيفي فاخر"
                                value={item.styleName}
                                onChange={e => handleItemChange(index, 'styleName', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                              />

                              {/* Show detailed variant breakdown chips when showDetails is true */}
                              {showDetails && hasVariants && (
                                <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                                    <span className="flex items-center gap-1">
                                      <Layers className="w-3 h-3 text-indigo-600" />
                                      <span>تفاصيل أعداد وألوان الموديل:</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedRowIndex(isExpanded ? null : index)}
                                      className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                                    >
                                      {isExpanded ? 'إخفاء التعديل' : 'تعديل الأعداد'}
                                    </button>
                                  </div>

                                  <div className="flex flex-wrap gap-1">
                                    {item.variants!.map((v, vIdx) => (
                                      <span
                                        key={vIdx}
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 flex items-center gap-1 shadow-2xs"
                                      >
                                        <span className="text-indigo-800">{v.size}</span>
                                        <span className="text-slate-400">/</span>
                                        <span className="text-slate-700">{v.color}:</span>
                                        <span className="text-blue-800 font-black">{v.quantity} ق</span>
                                        {v.barcode && (
                                          <span className="text-[9px] font-mono text-slate-400">({v.barcode})</span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Size column (visible when showDetails is true) */}
                            {showDetails && (
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  placeholder="L / XL"
                                  value={item.size}
                                  onChange={e => handleItemChange(index, 'size', e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                            )}

                            {/* Color column (visible when showDetails is true) */}
                            {showDetails && (
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  placeholder="أبيض"
                                  value={item.color}
                                  onChange={e => handleItemChange(index, 'color', e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-center focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                            )}

                            {/* Quantity column */}
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.quantity}
                                onChange={e => {
                                  const val = Number(e.target.value) || 0;
                                  handleItemChange(index, 'quantity', val);
                                }}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-black text-center text-blue-900 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            <td className="py-2.5 px-3">
                              <select
                                value={item.unit}
                                onChange={e => handleItemChange(index, 'unit', e.target.value)}
                                className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs text-center cursor-pointer"
                              >
                                <option value="قطعة">قطعة</option>
                                <option value="دستة">دستة</option>
                                <option value="طرد">طرد</option>
                                <option value="كرتونة">كرتونة</option>
                              </select>
                            </td>

                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                required
                                value={item.unitPrice}
                                onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center text-emerald-800 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.discount}
                                onChange={e => handleItemChange(index, 'discount', Number(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-center text-rose-600 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            <td className="py-2.5 px-3 text-left font-black text-slate-900">
                              {Number(item.total).toLocaleString('ar-EG')} ج.م
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="حذف البند"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>

                          {/* Expandable Variant Quantities Editor row */}
                          {showDetails && hasVariants && isExpanded && (
                            <tr className="bg-indigo-50/40">
                              <td colSpan={11} className="p-3 border-t border-indigo-100">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-black text-indigo-900">
                                    <span>محرر أعداد المقاسات والألوان للصنف ({item.styleName}):</span>
                                    <span className="text-slate-600 font-bold">
                                      الإجمالي: {item.quantity} قطعة
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {item.variants!.map((v, vIdx) => (
                                      <div key={vIdx} className="p-2 bg-white rounded-xl border border-indigo-200 text-center shadow-2xs">
                                        <div className="text-xs font-black text-indigo-900">{v.size} - {v.color}</div>
                                        <input
                                          type="number"
                                          min="0"
                                          value={v.quantity}
                                          onChange={e => {
                                            const val = Math.max(0, Number(e.target.value) || 0);
                                            const updatedVariants = [...item.variants!];
                                            updatedVariants[vIdx] = { ...v, quantity: val };
                                            const newTotal = updatedVariants.reduce((sum, it) => sum + it.quantity, 0);
                                            handleItemChange(index, 'variants', updatedVariants);
                                            handleItemChange(index, 'quantity', newTotal);
                                          }}
                                          className="w-full mt-1 px-1 py-1 text-center font-black border border-slate-300 rounded-lg text-xs"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment Terms & Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Payment & Logistics Settings */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
              <h4 className="text-xs font-black text-slate-800">شروط السداد وتفاصيل الشحن:</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">طريقة الدفع</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as SalesPaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="cash">نقداً (خزينة المصنع)</option>
                    <option value="bank">تحويل بنكي / شيك إيداع</option>
                    <option value="credit">آجل (على الحساب)</option>
                    <option value="cheque">شيك بنكي مؤجل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">حالة التسليم والشحن</label>
                  <select
                    value={deliveryStatus}
                    onChange={e => setDeliveryStatus(e.target.value as SalesDeliveryStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="delivered">تم التسليم وخروج من المخزن التام</option>
                    <option value="ready">جاهز للتسليم بالمخزن</option>
                    <option value="pending">قيد التجهيز والتعبئة</option>
                  </select>
                </div>
              </div>

              {/* Quick Payment Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSetFullPaid}
                  className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  سداد كامل القيمة نقداً
                </button>
                <button
                  type="button"
                  onClick={handleSetUnpaidCredit}
                  className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  آجل بالكامل (30 يوم)
                </button>
              </div>

              {paymentMethod === 'credit' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">تاريخ استحقاق الآجل</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ملاحظات الفاتورة</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات التسليم، شروط الضمان، أو تعليمات النقل..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Financial Calculations Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-800">الحسابات والضرائب والخصومات:</h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>إجمالي البنود:</span>
                  <span className="font-bold text-slate-900">{subtotal.toLocaleString('ar-EG')} ج.م</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">خصم تجاري عام:</span>
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      value={discountTotal}
                      onChange={e => setDiscountTotal(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-left text-rose-600 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600">ضريبة القيمة المضافة:</span>
                    <button
                      type="button"
                      onClick={() => setTaxPercent(14)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        taxPercent === 14 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      14%
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxPercent(0)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        taxPercent === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      0%
                    </button>
                  </div>
                  <span className="font-bold text-slate-900">+{taxAmount.toLocaleString('ar-EG')} ج.م</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">مصاريف الشحن والتسليم:</span>
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      value={shippingCost}
                      onChange={e => setShippingCost(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-left bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>الصافي الإجمالي للفاتورة:</span>
                  <span className="text-blue-700 text-base">{grandTotal.toLocaleString('ar-EG')} ج.م</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-emerald-800">المبلغ المدفوع / المحصل:</span>
                  <div className="w-36">
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={paidAmount}
                      onChange={e => setPaidAmount(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 border border-emerald-400 rounded-xl text-xs font-black text-left text-emerald-800 bg-emerald-50/50"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center font-bold text-rose-700">
                  <span>المتبقي الآجل على العميل:</span>
                  <span>{remainingAmount.toLocaleString('ar-EG')} ج.م</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'حفظ تعديلات الفاتورة' : 'إصدار وترحيل الفاتورة'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Add Customer Modal */}
      {showQuickAddCustomer && (
        <QuickAddCustomerModal
          onClose={() => setShowQuickAddCustomer(false)}
          onCustomerAdded={newCust => {
            setCustomers(prev => [...prev, newCust]);
            handleCustomerChange(newCust.id);
          }}
        />
      )}
    </div>
  );
}

export default SalesInvoiceFormModal;
