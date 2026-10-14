import React, { useState, useEffect, useMemo } from 'react';
import {
  SalesInvoice,
  SalesReturn,
  SalesReturnItem,
  SalesReturnReason,
  ReturnRefundMethod
} from '../../types/sales';
import { getSalesInvoices, generateNextSalesReturnNumber } from '../../lib/salesStorage';
import { getCustomersSuppliers } from '../../lib/accountingStorage';
import { getOrders } from '../../lib/storage';
import { CustomerSupplier, ProductionOrder } from '../../types';
import {
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
  Boxes,
  Plus,
  Trash2,
  FileText,
  Zap,
  CheckSquare,
  Square,
  Sparkles,
  Search,
  UserCheck
} from 'lucide-react';

interface SalesReturnFormModalProps {
  initialInvoice?: SalesInvoice | null;
  returnRecord?: SalesReturn | null;
  onClose: () => void;
  onSave: (salesReturn: SalesReturn) => void;
}

const REASON_LABELS: Record<SalesReturnReason, string> = {
  defective: 'عيوب صناعة أو قماش (تالف)',
  wrong_size: 'مقاس غير مطابق للطلب',
  wrong_color: 'لون مختلف عن المتفق عليه',
  surplus: 'فائض عن حاجة العميل / لم يتم بيعه',
  delayed: 'تأخر في موعد التسليم',
  other: 'سبب آخر'
};

interface ReturnItemRow {
  originalItemId?: string;
  orderId?: string;
  orderNumber?: string;
  styleName: string;
  category?: string;
  size: string;
  color: string;
  unit: string;
  maxQuantity: number;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  total: number;
  reason: SalesReturnReason;
  condition: 'good' | 'damaged';
  notes?: string;
  isSelected: boolean;
}

export function SalesReturnFormModal({
  initialInvoice,
  returnRecord,
  onClose,
  onSave
}: SalesReturnFormModalProps) {
  const isEditing = Boolean(returnRecord);

  // Return Mode: by_invoice (بناءً على فاتورة) or direct (مرتجع حر بدون فاتورة)
  const [returnMode, setReturnMode] = useState<'by_invoice' | 'direct'>(() => {
    if (returnRecord) {
      return returnRecord.originalInvoiceId ? 'by_invoice' : 'direct';
    }
    return initialInvoice ? 'by_invoice' : 'by_invoice';
  });

  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<CustomerSupplier[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    returnRecord?.originalInvoiceId || initialInvoice?.id || ''
  );

  // Customer info for direct return
  const [directCustomerId, setDirectCustomerId] = useState<string>(returnRecord?.customerId || '');
  const [directCustomerName, setDirectCustomerName] = useState<string>(returnRecord?.customerName || '');
  const [directCustomerPhone, setDirectCustomerPhone] = useState<string>(returnRecord?.customerPhone || '');
  const [directCustomerAddress, setDirectCustomerAddress] = useState<string>(returnRecord?.customerAddress || '');
  const [directRelatedOrderNumber, setDirectRelatedOrderNumber] = useState<string>('');
  const [directTaxPercent, setDirectTaxPercent] = useState<number>(returnRecord?.taxPercent ?? 0);

  const [returnNumber, setReturnNumber] = useState<string>(
    returnRecord?.returnNumber || generateNextSalesReturnNumber()
  );
  const [date, setDate] = useState<string>(
    returnRecord?.date || new Date().toISOString().split('T')[0]
  );

  const [refundMethod, setRefundMethod] = useState<ReturnRefundMethod>(
    returnRecord?.refundMethod || 'credit_deduction'
  );
  const [stockReturned, setStockReturned] = useState<boolean>(
    returnRecord?.stockReturned !== undefined ? returnRecord.stockReturned : true
  );
  const [returnReasonGeneral, setReturnReasonGeneral] = useState<string>(
    returnRecord?.returnReasonGeneral || ''
  );
  const [receivedByWarehouseUser, setReceivedByWarehouseUser] = useState<string>(
    returnRecord?.receivedByWarehouseUser || 'أمين مخزن المنتجات التامة'
  );
  const [notes, setNotes] = useState<string>(returnRecord?.notes || '');

  // Items to return
  const [items, setItems] = useState<ReturnItemRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Load available sales invoices, customers, and orders
  useEffect(() => {
    const invList = getSalesInvoices();
    setInvoices(invList);

    const csList = getCustomersSuppliers();
    setCustomers(csList.filter(c => c.type === 'customer'));

    getOrders().then(ordList => {
      setOrders(ordList);
    }).catch(err => console.error('Failed to load orders for return:', err));
  }, []);

  // When selected invoice changes (in invoice mode), populate its items with checkboxes
  useEffect(() => {
    if (isEditing && returnRecord) {
      setItems(
        returnRecord.items.map(it => ({
          originalItemId: it.originalItemId,
          orderId: it.orderId,
          orderNumber: it.orderNumber,
          styleName: it.styleName,
          category: it.category,
          size: it.size,
          color: it.color,
          unit: it.unit,
          maxQuantity: it.quantity,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          costPrice: it.costPrice,
          total: it.total,
          reason: it.reason,
          condition: it.condition,
          notes: it.notes,
          isSelected: true
        }))
      );
      return;
    }

    if (returnMode === 'by_invoice') {
      const currentInv = invoices.find(i => i.id === selectedInvoiceId);
      if (currentInv && currentInv.items) {
        setItems(
          currentInv.items.map((it, idx) => ({
            originalItemId: it.id,
            orderId: it.orderId || currentInv.relatedOrderId,
            orderNumber: it.orderNumber || currentInv.relatedOrderNumber,
            styleName: it.styleName,
            category: it.category,
            size: it.size,
            color: it.color,
            unit: it.unit || 'قطعة',
            maxQuantity: it.quantity,
            quantity: it.quantity, // default to full invoice quantity or user edits
            unitPrice: it.unitPrice,
            costPrice: it.costPrice,
            total: it.unitPrice * it.quantity,
            reason: 'wrong_size',
            condition: 'good',
            notes: '',
            // Selection is controlled strictly via checkbox or 'تحديد الكل'
            isSelected: false
          }))
        );
      } else {
        setItems([]);
      }
    } else {
      // Direct return mode: if items empty, start with one empty row
      if (items.length === 0) {
        setItems([
          {
            styleName: '',
            category: 'ملابس كاجوال',
            size: 'L',
            color: 'أسود',
            unit: 'قطعة',
            maxQuantity: 999999,
            quantity: 1,
            unitPrice: 0,
            costPrice: 0,
            total: 0,
            reason: 'defective',
            condition: 'good',
            notes: '',
            isSelected: true
          }
        ]);
      }
    }
  }, [selectedInvoiceId, invoices, returnMode, isEditing, returnRecord]);

  const selectedInvoice = useMemo(() => {
    return invoices.find(i => i.id === selectedInvoiceId);
  }, [invoices, selectedInvoiceId]);

  // Handle customer picker change in direct mode
  const handleCustomerSelectChange = (custId: string) => {
    setDirectCustomerId(custId);
    if (!custId) {
      setDirectCustomerName('');
      setDirectCustomerPhone('');
      setDirectCustomerAddress('');
      return;
    }
    const found = customers.find(c => c.id === custId);
    if (found) {
      setDirectCustomerName(found.name);
      setDirectCustomerPhone(found.phone || '');
      setDirectCustomerAddress(found.address || '');
    }
  };

  // Toggle item checkbox
  const handleToggleSelect = (index: number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        isSelected: !copy[index].isSelected
      };
      return copy;
    });
  };

  // Master Toggle All checkboxes (تحديد الكل / إلغاء تحديد الكل)
  const allSelected = useMemo(() => {
    return items.length > 0 && items.every(it => it.isSelected);
  }, [items]);

  const handleToggleAll = () => {
    const targetState = !allSelected;
    setItems(prev => prev.map(it => ({ ...it, isSelected: targetState })));
  };

  // Handle item change - strictly does NOT mutate isSelected
  const handleItemChange = (index: number, field: keyof ReturnItemRow, val: any) => {
    setItems(prev => {
      const copy = [...prev];
      const cur = { ...copy[index], [field]: val };

      if (field === 'quantity') {
        const parsed = Number(val) || 0;
        const max = cur.maxQuantity || 999999;
        const q = Math.max(0, Math.min(parsed, max));
        cur.quantity = q;
        cur.total = Math.round(q * (cur.unitPrice || 0) * 100) / 100;
      }

      if (field === 'unitPrice') {
        const p = Math.max(0, Number(val) || 0);
        cur.unitPrice = p;
        cur.total = Math.round((cur.quantity || 0) * p * 100) / 100;
      }

      copy[index] = cur;
      return copy;
    });
  };

  // Add manual row in direct mode
  const handleAddManualItem = () => {
    setItems(prev => [
      ...prev,
      {
        styleName: '',
        category: 'ملابس كاجوال',
        size: 'L',
        color: 'أسود',
        unit: 'قطعة',
        maxQuantity: 999999,
        quantity: 1,
        unitPrice: 0,
        costPrice: 0,
        total: 0,
        reason: 'defective',
        condition: 'good',
        notes: '',
        isSelected: true
      }
    ]);
  };

  // Remove manual row
  const handleRemoveManualItem = (index: number) => {
    if (items.length <= 1) {
      setFormError('يجب أن يحتوي إذن المرتجع على صنف واحد على الأقل');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Pre-fill from order if selected in direct mode
  const handleOrderSelectChange = (orderNum: string) => {
    setDirectRelatedOrderNumber(orderNum);
    const ord = orders.find(o => o.orderNumber === orderNum);
    if (ord && items.length > 0 && !items[0].styleName) {
      handleItemChange(0, 'styleName', ord.styleName || '');
      if (ord.category) handleItemChange(0, 'category', ord.category);
    }
  };

  // Calculations - strictly based on items selected via checkbox
  const activeReturnItems = items.filter(it => it.isSelected);
  const subtotal = activeReturnItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  
  const taxPercent = returnMode === 'by_invoice' 
    ? (selectedInvoice?.taxPercent || 0) 
    : directTaxPercent;

  const taxAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validation for Invoice Mode vs Direct Mode
    let customerId = '';
    let customerName = '';
    let customerPhone = '';
    let customerAddress = '';
    let originalInvId: string | undefined = undefined;
    let originalInvNumber: string | undefined = undefined;

    if (returnMode === 'by_invoice') {
      if (!selectedInvoice) {
        setFormError('يرجى اختيار فاتورة المبيعات الأصلية أو التبديل إلى (مرتجع مباشر بدون فاتورة)');
        return;
      }
      originalInvId = selectedInvoice.id;
      originalInvNumber = selectedInvoice.invoiceNumber;
      customerId = selectedInvoice.customerId;
      customerName = selectedInvoice.customerName;
      customerPhone = selectedInvoice.customerPhone || '';
      customerAddress = selectedInvoice.customerAddress || '';
    } else {
      // Direct return without invoice
      if (!directCustomerName.trim()) {
        setFormError('يرجى اختيار العميل أو إدخال اسم العميل للمرتجع المباشر');
        return;
      }
      customerId = directCustomerId || `cust_direct_${Date.now()}`;
      customerName = directCustomerName.trim();
      customerPhone = directCustomerPhone.trim();
      customerAddress = directCustomerAddress.trim();
    }

    // 2. Validate items - ONLY selected items are validated and adopted
    if (activeReturnItems.length === 0) {
      setFormError('يرجى تحديد أو اختيار صنف واحد أو أكثر عبر التشيك بوكس (☑) لاعتمادها في إذن المرتجع');
      return;
    }

    const invalidItem = activeReturnItems.find(it => !it.styleName.trim() || it.quantity <= 0);
    if (invalidItem) {
      setFormError(`الصنف المحدد (${invalidItem.styleName || 'غير محدد'}) يجب أن تكون كميته المرتجعة أكبر من صفر`);
      return;
    }

    if (returnMode === 'by_invoice') {
      const invalidQty = activeReturnItems.find(it => it.maxQuantity && it.quantity > it.maxQuantity);
      if (invalidQty) {
        setFormError(`الكمية المرتجعة للصنف (${invalidQty.styleName}) أكبر من الكمية الموجودة بالفاتورة (${invalidQty.maxQuantity})`);
        return;
      }
    }

    // 3. Build return items - ONLY the selected items are approved & registered
    const returnItems: SalesReturnItem[] = activeReturnItems.map((it, idx) => ({
      id: `ret_item_${Date.now()}_${idx}`,
      originalItemId: it.originalItemId,
      orderId: it.orderId,
      orderNumber: it.orderNumber || (returnMode === 'direct' ? directRelatedOrderNumber : undefined),
      styleName: it.styleName.trim(),
      category: it.category?.trim(),
      size: it.size.trim(),
      color: it.color.trim(),
      unit: it.unit || 'قطعة',
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      costPrice: it.costPrice,
      total: it.total,
      reason: it.reason,
      condition: it.condition,
      notes: it.notes?.trim()
    }));

    const salesReturn: SalesReturn = {
      id: returnRecord?.id || `ret_${Date.now()}`,
      returnNumber: returnNumber.trim() || generateNextSalesReturnNumber(),
      date,
      originalInvoiceId: originalInvId,
      originalInvoiceNumber: originalInvNumber,
      customerId,
      customerName,
      customerPhone: customerPhone || undefined,
      customerAddress: customerAddress || undefined,
      items: returnItems,
      subtotal,
      taxPercent,
      taxAmount,
      grandTotal,
      refundMethod,
      refundedAmount: grandTotal,
      stockReturned,
      returnReasonGeneral: returnReasonGeneral.trim() || undefined,
      receivedByWarehouseUser: receivedByWarehouseUser.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: returnRecord?.createdAt || new Date().toISOString()
    };

    onSave(salesReturn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0 border-b border-orange-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black flex items-center gap-2">
                <span>{isEditing ? `تعديل إذن مرتجع مبيعات (${returnRecord?.returnNumber})` : 'تسجيل إذن مرتجع مبيعات جديد'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                  {returnMode === 'by_invoice' ? 'بناءً على فاتورة' : 'مرتجع مباشر حر'}
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                إثبات استرداد بضاعة من العميل مع إمكانية الارتجاع بفاتورة سابقة أو بدون فاتورة وتحديث المخزن آلياً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {formError && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Mode Switcher Tabs (فاتورة سابقة أم مرتجع مباشر حر) */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-2 border border-slate-200">
            <button
              type="button"
              onClick={() => setReturnMode('by_invoice')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                returnMode === 'by_invoice'
                  ? 'bg-white text-orange-950 shadow-sm border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-4 h-4 text-orange-600" />
              <span>استرجاع مرتبط بفاتورة مبيعات سابقة (اختيار من بنود الفاتورة)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReturnMode('direct');
                setSelectedInvoiceId('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                returnMode === 'direct'
                  ? 'bg-white text-orange-950 shadow-sm border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-600" />
              <span>استرجاع مباشر بدون فاتورة (مرتجع حر - اختيار العميل والأصناف يدوياً)</span>
            </button>
          </div>

          {/* Section 1: Main Voucher & Link Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-orange-50/40 rounded-2xl border border-orange-200/60">
            {/* If In Invoice Mode: Invoice Selector */}
            {returnMode === 'by_invoice' ? (
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اختر فاتورة المبيعات الأصلية <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={isEditing}
                  value={selectedInvoiceId}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'direct_mode') {
                      setReturnMode('direct');
                      setSelectedInvoiceId('');
                    } else {
                      setSelectedInvoiceId(val);
                    }
                  }}
                  className="w-full px-3 py-2 border border-orange-300 rounded-xl text-xs font-bold bg-white text-orange-950 focus:ring-2 focus:ring-orange-500 cursor-pointer disabled:bg-slate-100"
                  required={returnMode === 'by_invoice'}
                >
                  <option value="">-- اختر فاتورة المبيعات --</option>
                  <option value="direct_mode" className="font-bold text-amber-700">⚡ (الاسترجاع بدون فاتورة - مرتجع مباشر)</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.customerName} ({inv.date}) [{Number(inv.grandTotal).toLocaleString('ar-EG')} ج.م]
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* If Direct Mode: Customer Selector */
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  العميل صاحب المرتجع <span className="text-red-500">*</span>
                </label>
                <select
                  value={directCustomerId}
                  onChange={e => handleCustomerSelectChange(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">-- اختر العميل من القائمة أو أدخل اسمه أدناه --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Voucher Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم إذن الارتجاع</label>
              <input
                type="text"
                required
                value={returnNumber}
                onChange={e => setReturnNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-orange-900 bg-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Return Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ إذن الارتجاع</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Mode-Specific Info Panel */}
          {returnMode === 'by_invoice' && selectedInvoice ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">اسم العميل:</span>
                <span className="font-black text-slate-900 text-sm">{selectedInvoice.customerName}</span>
                {selectedInvoice.customerPhone && (
                  <span className="text-slate-500 block text-[11px]">{selectedInvoice.customerPhone}</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block font-medium">قيمة الفاتورة الأصلية:</span>
                <span className="font-black text-blue-900 text-sm">
                  {Number(selectedInvoice.grandTotal).toLocaleString('ar-EG')} ج.م
                </span>
                <span className="text-slate-500 block text-[11px]">
                  المحصل: {Number(selectedInvoice.paidAmount).toLocaleString('ar-EG')} ج.م · المتبقي: {Number(selectedInvoice.remainingAmount).toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">أمر الإنتاج / طريقة السداد:</span>
                <span className="font-bold text-indigo-800">
                  {selectedInvoice.relatedOrderNumber || 'مبيعات معرض'}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  طريقة السداد: {selectedInvoice.paymentMethod === 'cash' ? 'نقداً' : selectedInvoice.paymentMethod === 'bank' ? 'بنكي' : 'آجل'} · ضريبة: {selectedInvoice.taxPercent || 0}%
                </span>
              </div>
            </div>
          ) : returnMode === 'direct' ? (
            /* Direct Return Customer Details Form */
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-amber-600" />
                <span>بيانات العميل والأمر للمرتجع المباشر (بدون فاتورة):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    اسم العميل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={directCustomerName}
                    onChange={e => setDirectCustomerName(e.target.value)}
                    placeholder="أدخل اسم العميل أو المعرض"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">هاتف العميل</label>
                  <input
                    type="text"
                    value={directCustomerPhone}
                    onChange={e => setDirectCustomerPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">عنوان العميل / المعرض</label>
                  <input
                    type="text"
                    value={directCustomerAddress}
                    onChange={e => setDirectCustomerAddress(e.target.value)}
                    placeholder="المدينة / المنطقة"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">أمر إنتاج مرتبط (اختياري)</label>
                  <select
                    value={directRelatedOrderNumber}
                    onChange={e => handleOrderSelectChange(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">-- بدون أمر إنتاج محدد --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.orderNumber}>
                        {o.orderNumber} - {o.styleName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}

          {/* Section 2: Items to return */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-600" />
                  <span>{returnMode === 'by_invoice' ? 'أصناف الفاتورة للاختيار عبر التشيك بوكس:' : 'أصناف المرتجع المباشر:'}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {returnMode === 'by_invoice'
                    ? 'حدد الأصناف المراد إرجاعها باستخدام خانة الاختيار (التشيك بوكس)، وعدل الكمية وسعر الارتجاع'
                    : 'أضف الأصناف المرتجعة مع تحديد المقاس، اللون، الكمية، وسعر الوحدة'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                      allSelected
                        ? 'bg-orange-100 hover:bg-orange-200 text-orange-950 border-orange-300'
                        : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-xs'
                    }`}
                    title={allSelected ? 'إلغاء تحديد جميع الأصناف' : 'تحديد جميع أصناف الفاتورة'}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>{allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</span>
                  </button>
                )}

                {returnMode === 'direct' && (
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ إضافة صنف للمرتجع</span>
                  </button>
                )}

                <span className={`text-xs font-black px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                  activeReturnItems.length > 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {activeReturnItems.length > 0
                    ? `✓ محدد للاعتماد: (${activeReturnItems.length}) من أصل (${items.length}) صنف`
                    : 'لم يتم تحديد أي صنف للاعتماد بعد'}
                </span>
              </div>
            </div>

            {/* Instruction banner for multi-item selection */}
            {items.length > 0 && (
              <div className="p-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base text-orange-600">☑</span>
                  <span>
                    <strong>طريقة الاختيار:</strong> اضغط على مربع الاختيار (التشيك بوكس) بجوار أي صنف لتعليمه أو إلغاء اختياره، أو اضغط زر <strong>"تحديد الكل"</strong>. عند الاعتماد سيتم اعتماد وترحيل الأصناف المحددة فقط ({activeReturnItems.length} صنف).
                  </span>
                </div>
                {items.length - activeReturnItems.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md shrink-0 border border-amber-200">
                    مستبعد: {items.length - activeReturnItems.length}
                  </span>
                )}
              </div>
            )}

            {/* In Invoice Mode without selected invoice */}
            {returnMode === 'by_invoice' && !selectedInvoice ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold">يرجى اختيار فاتورة مبيعات من القائمة أعلاه لعرض أصنافها</p>
                <p className="text-[11px] text-slate-400">
                  أو يمكنك التبديل إلى <strong>(استرجاع مباشر بدون فاتورة)</strong> لتسجيل المرتجع يدوياً.
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
                لا توجد أصناف في هذا المرتجع. انقر على (+ إضافة صنف للمرتجع) للبدء.
              </div>
            ) : (
              /* Items Table */
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right min-w-[850px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-32 text-center">
                          <div
                            className="flex items-center justify-center gap-1.5 cursor-pointer select-none"
                            onClick={handleToggleAll}
                            title={allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                          >
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={handleToggleAll}
                              className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                            />
                            <span className="text-[11px] font-black text-slate-800">تحديد الصنف</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 min-w-[170px]">اسم الموديل / المنتج</th>
                        <th className="py-2.5 px-3 w-16">المقاس</th>
                        <th className="py-2.5 px-3 w-20">اللون</th>
                        {returnMode === 'by_invoice' && (
                          <th className="py-2.5 px-3 w-24 text-center">كمية الفاتورة</th>
                        )}
                        <th className="py-2.5 px-3 w-24 text-center">الكمية المرتجعة</th>
                        <th className="py-2.5 px-3 w-24 text-center">سعر الوحدة</th>
                        <th className="py-2.5 px-3 w-28 text-left">الإجمالي</th>
                        <th className="py-2.5 px-3 min-w-[140px]">سبب الإرجاع</th>
                        <th className="py-2.5 px-3 w-28">حالة البضاعة</th>
                        {returnMode === 'direct' && (
                          <th className="py-2.5 px-3 w-12 text-center">حذف</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {items.map((item, idx) => {
                        const isChecked = item.isSelected;
                        return (
                          <tr
                            key={item.originalItemId || idx}
                            className={`transition-colors ${
                              isChecked
                                ? 'bg-orange-50/50 ring-1 ring-orange-400/30'
                                : 'opacity-40 bg-slate-50/60 hover:opacity-75'
                            }`}
                          >
                            {/* Checkbox beside item */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <label className="inline-flex items-center justify-center gap-1.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleSelect(idx)}
                                  title={isChecked ? 'إلغاء اختيار هذا الصنف' : 'اختيار هذا الصنف للاسترجاع'}
                                  className="w-5 h-5 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer transition-transform active:scale-90"
                                />
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded transition-all ${
                                    isChecked
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                                  }`}
                                >
                                  {isChecked ? 'محدد ✓' : 'غير محدد'}
                                </span>
                              </label>
                            </td>

                            {/* Product Style Name */}
                            <td className="py-2.5 px-3">
                              {returnMode === 'by_invoice' ? (
                                <div>
                                  <span className="font-black text-slate-900 block">{item.styleName}</span>
                                  {item.orderNumber && (
                                    <span className="text-[10px] text-indigo-700 font-bold">أمر: {item.orderNumber}</span>
                                  )}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  required
                                  value={item.styleName}
                                  onChange={e => handleItemChange(idx, 'styleName', e.target.value)}
                                  placeholder="اسم الموديل/المنتج"
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-orange-500"
                                />
                              )}
                            </td>

                            {/* Size */}
                            <td className="py-2.5 px-3">
                              {returnMode === 'by_invoice' ? (
                                <span className="font-bold text-indigo-700 font-mono">{item.size}</span>
                              ) : (
                                <input
                                  type="text"
                                  value={item.size}
                                  onChange={e => handleItemChange(idx, 'size', e.target.value)}
                                  placeholder="XL"
                                  className="w-16 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-center uppercase font-mono"
                                />
                              )}
                            </td>

                            {/* Color */}
                            <td className="py-2.5 px-3">
                              {returnMode === 'by_invoice' ? (
                                <span className="font-medium text-slate-700">{item.color}</span>
                              ) : (
                                <input
                                  type="text"
                                  value={item.color}
                                  onChange={e => handleItemChange(idx, 'color', e.target.value)}
                                  placeholder="كحلي"
                                  className="w-20 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
                                />
                              )}
                            </td>

                            {/* Original Invoice Quantity if Invoice Mode */}
                            {returnMode === 'by_invoice' && (
                              <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                                {item.maxQuantity} {item.unit}
                              </td>
                            )}

                            {/* Return Quantity */}
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                disabled={returnMode === 'by_invoice' && !isChecked}
                                min="1"
                                max={returnMode === 'by_invoice' ? item.maxQuantity : 999999}
                                value={item.quantity}
                                onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                                className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-black text-center text-orange-950 disabled:bg-slate-100 focus:ring-1 focus:ring-orange-500"
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                disabled={returnMode === 'by_invoice' && !isChecked}
                                min="0"
                                step="any"
                                value={item.unitPrice}
                                onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                                className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-900 disabled:bg-slate-100 focus:ring-1 focus:ring-orange-500"
                              />
                            </td>

                            {/* Total */}
                            <td className="py-2.5 px-3 text-left font-black text-orange-900">
                              {Number(item.total).toLocaleString('ar-EG')} ج.م
                            </td>

                            {/* Reason */}
                            <td className="py-2.5 px-3">
                              <select
                                disabled={returnMode === 'by_invoice' && !isChecked}
                                value={item.reason}
                                onChange={e => handleItemChange(idx, 'reason', e.target.value as SalesReturnReason)}
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-orange-500 disabled:bg-slate-100"
                              >
                                {Object.entries(REASON_LABELS).map(([k, v]) => (
                                  <option key={k} value={k}>{v}</option>
                                ))}
                              </select>
                            </td>

                            {/* Condition */}
                            <td className="py-2.5 px-3">
                              <select
                                disabled={returnMode === 'by_invoice' && !isChecked}
                                value={item.condition}
                                onChange={e => handleItemChange(idx, 'condition', e.target.value as 'good' | 'damaged')}
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-bold bg-white focus:ring-1 focus:ring-orange-500 disabled:bg-slate-100"
                              >
                                <option value="good">صالحة (إيداع بالمخزن)</option>
                                <option value="damaged">تالفة (تحتاج إصلاح)</option>
                              </select>
                            </td>

                            {/* Action Delete for Direct Mode */}
                            {returnMode === 'direct' && (
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveManualItem(idx)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                  title="حذف هذا الصنف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Financial Settlement & Warehouse Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {/* Refund Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                طريقة رد القيمة وتسوية المرتجع
              </label>
              <select
                value={refundMethod}
                onChange={e => setRefundMethod(e.target.value as ReturnRefundMethod)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="credit_deduction">خصم ومقاصة من رصيد العميل الآجل</option>
                <option value="cash">رد واسترداد نقدي من خزينة المصنع</option>
                <option value="bank">تحويل بنكي مسترد لحساب العميل</option>
              </select>
            </div>

            {/* Warehouse Receiver */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                أمين مخزن المنتجات التامة المستلم
              </label>
              <input
                type="text"
                value={receivedByWarehouseUser}
                onChange={e => setReceivedByWarehouseUser(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Direct Tax Percent (if direct mode) */}
            {returnMode === 'direct' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نسبة ضريبة القيمة المضافة (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={directTaxPercent}
                  onChange={e => setDirectTaxPercent(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ضريبة الفاتورة الأصلية
                </label>
                <div className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 border border-slate-200">
                  {selectedInvoice?.taxPercent || 0}%
                </div>
              </div>
            )}

            {/* Stock Return Checkbox */}
            <div className="sm:col-span-3 pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stockReturned}
                  onChange={e => setStockReturned(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                />
                <span>إعادة إيداع القطع السليمة المرتجعة فوراً إلى رصيد مخزن المنتجات التامة</span>
              </label>
            </div>
          </div>

          {/* Section 4: Notes & Summary Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ملاحظات وتفاصيل إضافية عن سبب الارتجاع
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="أسباب الارتجاع، حالة التغليف، أرقام الباركود التالفة..."
                className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Totals Box */}
            <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span>إجمالي الأصناف المرتجعة ({activeReturnItems.length} صنف):</span>
                <span className="font-bold">{subtotal.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>ضريبة القيمة المضافة ({taxPercent}%):</span>
                <span className="font-bold">{taxAmount.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-orange-200 text-sm font-black text-orange-950">
                <span>صافي قيمة إذن المرتجع الإجمالية:</span>
                <span className="text-base text-orange-600 font-black">{grandTotal.toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-600/20 hover:shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isEditing
                  ? `حفظ تعديلات المرتجع (${activeReturnItems.length} صنف معتمد)`
                  : `اعتماد وتسجيل الأصناف المختارة فقط (${activeReturnItems.length} صنف)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
