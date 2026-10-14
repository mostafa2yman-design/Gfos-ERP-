import React, { useState, useEffect, useMemo } from 'react';
import {
  PurchaseInvoice,
  PurchaseReturn,
  PurchaseReturnItem,
  PurchaseReturnReason,
  PurchaseReturnRefundMethod
} from '../../types/purchases';
import { getPurchases, generateNextPurchaseReturnNumber } from '../../lib/purchasesStorage';
import { getCustomersSuppliers, getMaterials } from '../../lib/accountingStorage';
import { CustomerSupplier, MaterialItem } from '../../types';
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
  ShoppingCart
} from 'lucide-react';

interface PurchaseReturnFormModalProps {
  initialInvoice?: PurchaseInvoice | null;
  returnRecord?: PurchaseReturn | null;
  onClose: () => void;
  onSave: (purchaseReturn: PurchaseReturn) => void;
}

const REASON_LABELS: Record<PurchaseReturnReason, string> = {
  defective: 'عيوب غزل أو صباغة أو نسيج (تالف)',
  wrong_spec: 'مواصفات أو وزن خامة غير مطابق',
  wrong_color: 'لون أو درجة صبغة مختلفة عن العينة',
  surplus: 'فائض عن حاجة خطوط الإنتاج والتشغيل',
  delayed: 'تأخر في موعد التوريد المتفق عليه',
  damaged: 'تلفيات وكسور أثناء النقل والتفريغ',
  other: 'سبب آخر'
};

const CONDITION_LABELS: Record<string, string> = {
  defect_vendor: 'مسؤولية المورد (معيب للتسوية)',
  scrap: 'هالك وتالف للنقل والتفريغ',
  intact: 'سليم وفائض عن حاجة التشغيل'
};

interface PurchaseReturnItemRow {
  originalItemId?: string;
  materialId: string;
  materialName: string;
  materialType: string;
  unit: string;
  maxQuantity: number;
  quantity: number;
  unitPrice: number;
  total: number;
  reason: PurchaseReturnReason;
  condition: 'defect_vendor' | 'scrap' | 'intact';
  notes?: string;
  isSelected: boolean;
}

export function PurchaseReturnFormModal({
  initialInvoice,
  returnRecord,
  onClose,
  onSave
}: PurchaseReturnFormModalProps) {
  const isEditing = Boolean(returnRecord);

  // Return mode: by_invoice (مرتجع مرتبط بفاتورة) or direct (مرتجع مباشر بدون فاتورة)
  const [returnMode, setReturnMode] = useState<'by_invoice' | 'direct'>(() => {
    if (returnRecord) {
      return returnRecord.originalInvoiceId ? 'by_invoice' : 'direct';
    }
    return initialInvoice ? 'by_invoice' : 'by_invoice';
  });

  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<CustomerSupplier[]>([]);
  const [materialsList, setMaterialsList] = useState<MaterialItem[]>([]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    returnRecord?.originalInvoiceId || initialInvoice?.id || ''
  );

  // Direct return supplier info
  const [directSupplierId, setDirectSupplierId] = useState<string>(returnRecord?.supplierId || '');
  const [directSupplierName, setDirectSupplierName] = useState<string>(returnRecord?.supplierName || '');
  const [directSupplierPhone, setDirectSupplierPhone] = useState<string>(returnRecord?.supplierPhone || '');
  const [directTaxPercent, setDirectTaxPercent] = useState<number>(returnRecord?.taxPercent ?? 0);

  const [returnNumber, setReturnNumber] = useState<string>(
    returnRecord?.returnNumber || generateNextPurchaseReturnNumber()
  );
  const [date, setDate] = useState<string>(
    returnRecord?.date || new Date().toISOString().split('T')[0]
  );

  const [refundMethod, setRefundMethod] = useState<PurchaseReturnRefundMethod>(
    returnRecord?.refundMethod || 'credit_deduction'
  );
  const [stockReturned, setStockReturned] = useState<boolean>(
    returnRecord?.stockReturned !== undefined ? returnRecord.stockReturned : true
  );
  const [returnReasonGeneral, setReturnReasonGeneral] = useState<string>(
    returnRecord?.returnReasonGeneral || ''
  );
  const [issuedByWarehouseUser, setIssuedByWarehouseUser] = useState<string>(
    returnRecord?.issuedByWarehouseUser || 'أمين مخزن الخامات'
  );
  const [notes, setNotes] = useState<string>(returnRecord?.notes || '');

  // Items to return
  const [items, setItems] = useState<PurchaseReturnItemRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Load available purchase invoices, suppliers, and materials
  useEffect(() => {
    const list = getPurchases();
    setInvoices(list);

    const csList = getCustomersSuppliers();
    setSuppliers(csList.filter(s => s.type === 'supplier'));

    const mats = getMaterials();
    setMaterialsList(mats);
  }, []);

  // When selected invoice changes (in invoice mode), populate its items with checkboxes
  useEffect(() => {
    if (isEditing && returnRecord) {
      setItems(
        returnRecord.items.map(it => ({
          originalItemId: it.originalItemId,
          materialId: it.materialId,
          materialName: it.materialName,
          materialType: it.materialType,
          unit: it.unit,
          maxQuantity: it.quantity,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
          reason: it.reason,
          condition: it.condition || 'defect_vendor',
          notes: it.notes || '',
          isSelected: true
        }))
      );
      return;
    }

    if (returnMode === 'by_invoice') {
      if (!selectedInvoiceId) {
        setItems([]);
        return;
      }

      const currentInv = invoices.find(inv => inv.id === selectedInvoiceId);
      if (!currentInv) {
        setItems([]);
        return;
      }

      const initialRows: PurchaseReturnItemRow[] = (currentInv.items || []).map((it, idx) => ({
        originalItemId: it.id,
        materialId: it.materialId,
        materialName: it.materialName,
        materialType: it.materialType,
        unit: it.unit,
        maxQuantity: it.quantity,
        quantity: it.quantity, // Default to full invoice quantity
        unitPrice: it.unitPrice,
        total: Math.round(it.quantity * it.unitPrice * 100) / 100,
        reason: 'defective',
        condition: 'defect_vendor',
        notes: '',
        // Selection is controlled strictly via checkbox or 'تحديد الكل'
        isSelected: false
      }));

      setItems(initialRows);
    } else {
      // Direct return mode
      if (items.length === 0) {
        setItems([
          {
            materialId: `mat_manual_${Date.now()}`,
            materialName: '',
            materialType: 'fabric',
            unit: 'كجم',
            maxQuantity: 999999,
            quantity: 1,
            unitPrice: 0,
            total: 0,
            reason: 'defective',
            condition: 'defect_vendor',
            notes: '',
            isSelected: true
          }
        ]);
      }
    }
  }, [selectedInvoiceId, invoices, returnMode, isEditing, returnRecord]);

  const selectedInvoice = useMemo(() => {
    return invoices.find(inv => inv.id === selectedInvoiceId);
  }, [invoices, selectedInvoiceId]);

  // Handle supplier picker change in direct mode
  const handleSupplierSelectChange = (suppId: string) => {
    setDirectSupplierId(suppId);
    if (!suppId) {
      setDirectSupplierName('');
      setDirectSupplierPhone('');
      return;
    }
    const found = suppliers.find(s => s.id === suppId);
    if (found) {
      setDirectSupplierName(found.name);
      setDirectSupplierPhone(found.phone || '');
    }
  };

  // Checkbox toggle per item
  const handleItemSelectToggle = (index: number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        isSelected: !copy[index].isSelected
      };
      return copy;
    });
  };

  // Master Select All / Deselect All
  const allSelected = useMemo(() => {
    return items.length > 0 && items.every(it => it.isSelected);
  }, [items]);

  const handleToggleAll = () => {
    const targetState = !allSelected;
    setItems(prev => prev.map(it => ({ ...it, isSelected: targetState })));
  };

  // Change quantity - strictly does NOT mutate isSelected
  const handleQuantityChange = (index: number, newQty: number) => {
    setItems(prev => {
      const copy = [...prev];
      const max = copy[index].maxQuantity || 999999;
      const validQty = Math.max(0, Math.min(newQty, max));
      copy[index].quantity = validQty;
      copy[index].total = Math.round(validQty * copy[index].unitPrice * 100) / 100;
      return copy;
    });
  };

  // Change unit price
  const handleUnitPriceChange = (index: number, newPrice: number) => {
    setItems(prev => {
      const copy = [...prev];
      const p = Math.max(0, newPrice);
      copy[index].unitPrice = p;
      copy[index].total = Math.round(copy[index].quantity * p * 100) / 100;
      return copy;
    });
  };

  const handleReasonChange = (index: number, reason: PurchaseReturnReason) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].reason = reason;
      return copy;
    });
  };

  const handleConditionChange = (index: number, condition: 'defect_vendor' | 'scrap' | 'intact') => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].condition = condition;
      return copy;
    });
  };

  const handleItemNotesChange = (index: number, val: string) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].notes = val;
      return copy;
    });
  };

  // Direct Mode: pick a catalog material
  const handleCatalogMaterialPick = (index: number, matId: string) => {
    const found = materialsList.find(m => m.id === matId);
    if (!found) return;
    setItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        materialId: found.id,
        materialName: found.name,
        materialType: (found as any).type || (found as any).category || 'fabric',
        unit: (found as any).unit || 'كجم',
        unitPrice: (found as any).price || (found as any).lastPurchasePrice || copy[index].unitPrice || 0,
        total: Math.round(copy[index].quantity * ((found as any).price || copy[index].unitPrice || 0) * 100) / 100
      };
      return copy;
    });
  };

  // Add manual item in direct mode
  const handleAddManualItem = () => {
    setItems(prev => [
      ...prev,
      {
        materialId: `mat_manual_${Date.now()}_${prev.length}`,
        materialName: '',
        materialType: 'fabric',
        unit: 'كجم',
        maxQuantity: 999999,
        quantity: 1,
        unitPrice: 0,
        total: 0,
        reason: 'defective',
        condition: 'defect_vendor',
        notes: '',
        isSelected: true
      }
    ]);
  };

  // Remove manual item in direct mode
  const handleRemoveManualItem = (index: number) => {
    if (items.length <= 1) {
      setFormError('يجب أن يحتوي إذن المرتجع على صنف واحد على الأقل');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Totals - calculated strictly for items selected via checkbox
  const activeItems = items.filter(it => it.isSelected);
  const subtotal = activeItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  
  const taxPercent = returnMode === 'by_invoice' 
    ? (selectedInvoice?.taxPercent || 0) 
    : directTaxPercent;

  const taxAmount = Math.round((subtotal * taxPercent / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validation for Invoice Mode vs Direct Mode
    let supplierId = '';
    let supplierName = '';
    let supplierPhone: string | undefined = undefined;
    let originalInvId: string | undefined = undefined;
    let originalInvNumber: string | undefined = undefined;

    if (returnMode === 'by_invoice') {
      if (!selectedInvoice) {
        setFormError('يرجى تحديد فاتورة الشراء الأصلية أو التبديل إلى (استرجاع مباشر بدون فاتورة)');
        return;
      }
      originalInvId = selectedInvoice.id;
      originalInvNumber = selectedInvoice.invoiceNumber;
      supplierId = selectedInvoice.supplierId;
      supplierName = selectedInvoice.supplierName;
      supplierPhone = selectedInvoice.supplierPhone;
    } else {
      // Direct Mode
      if (!directSupplierName.trim()) {
        setFormError('يرجى اختيار المورد أو إدخال اسم المورد لإتمام الارتجاع المباشر');
        return;
      }
      supplierId = directSupplierId || `supp_direct_${Date.now()}`;
      supplierName = directSupplierName.trim();
      supplierPhone = directSupplierPhone.trim() || undefined;
    }

    if (!date) {
      setFormError('يرجى تحديد تاريخ إذن المرتجع');
      return;
    }

    // 2. Validate items - ONLY selected items are validated and adopted
    if (activeItems.length === 0) {
      setFormError('يرجى اختيار وتحديد خامة أو صنف واحد أو أكثر عبر التشيك بوكس (☑) لاعتمادها في إذن المرتجع');
      return;
    }

    const invalidItem = activeItems.find(it => !it.materialName.trim() || it.quantity <= 0);
    if (invalidItem) {
      setFormError(`الخامة المحددة (${invalidItem.materialName || 'غير مسماة'}) يجب أن تكون كميتها المرتجعة أكبر من صفر`);
      return;
    }

    if (returnMode === 'by_invoice') {
      const invalidQty = activeItems.find(it => it.maxQuantity && it.quantity > it.maxQuantity);
      if (invalidQty) {
        setFormError(`الكمية المرتجعة للخامة (${invalidQty.materialName}) أكبر من كمية فاتورة الشراء (${invalidQty.maxQuantity})`);
        return;
      }
    }

    // Build return items - ONLY the selected items are approved & registered
    const returnItems: PurchaseReturnItem[] = activeItems.map((it, idx) => ({
      id: returnRecord?.items?.find(r => r.originalItemId === it.originalItemId)?.id || `pret_item_${Date.now()}_${idx}`,
      originalItemId: it.originalItemId,
      materialId: it.materialId,
      materialName: it.materialName.trim(),
      materialType: it.materialType,
      unit: it.unit,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.total,
      reason: it.reason,
      condition: it.condition || 'defect_vendor',
      notes: it.notes?.trim()
    }));

    const newReturn: PurchaseReturn = {
      id: returnRecord?.id || `pret_${Date.now()}`,
      returnNumber: returnNumber.trim() || generateNextPurchaseReturnNumber(),
      date,
      originalInvoiceId: originalInvId,
      originalInvoiceNumber: originalInvNumber,
      supplierId,
      supplierName,
      supplierPhone,
      items: returnItems,
      subtotal,
      taxPercent,
      taxAmount,
      grandTotal,
      refundMethod,
      refundedAmount: grandTotal,
      stockReturned,
      returnReasonGeneral: returnReasonGeneral.trim() || undefined,
      issuedByWarehouseUser: issuedByWarehouseUser.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: returnRecord?.createdAt || new Date().toISOString(),
      updatedAt: isEditing ? new Date().toISOString() : undefined
    };

    onSave(newReturn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0 border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black flex items-center gap-2">
                <span>{isEditing ? `تعديل إذن مرتجع مشتريات (${returnRecord?.returnNumber})` : 'تسجيل إذن مرتجع مشتريات خامات جديد'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {returnMode === 'by_invoice' ? 'بناءً على فاتورة شراء' : 'مرتجع مباشر حر'}
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                إثبات رد أقمشة ومستلزمات إنتاج للمورد مع إمكانية الارتجاع بفاتورة سابقة أو بدون فاتورة وخصم المخزن
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
          {formError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-xs font-bold animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-2 border border-slate-200">
            <button
              type="button"
              onClick={() => setReturnMode('by_invoice')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                returnMode === 'by_invoice'
                  ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>استرجاع مرتبط بفاتورة مشتريات سابقة (اختيار من بنود الفاتورة)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReturnMode('direct');
                setSelectedInvoiceId('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                returnMode === 'direct'
                  ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-600" />
              <span>استرجاع مباشر بدون فاتورة (مرتجع حر - اختيار المورد والخامات يدوياً)</span>
            </button>
          </div>

          {/* Section 1: Main Voucher Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            {/* If Invoice Mode: Invoice Selector */}
            {returnMode === 'by_invoice' ? (
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  <span>فاتورة الشراء الأصلية محل الارتجاع <span className="text-red-500">*</span></span>
                </label>
                <select
                  value={selectedInvoiceId}
                  disabled={isEditing}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'direct_mode') {
                      setReturnMode('direct');
                      setSelectedInvoiceId('');
                    } else {
                      setSelectedInvoiceId(val);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-bold"
                  required={returnMode === 'by_invoice'}
                >
                  <option value="">-- اختر فاتورة الشراء المراد الإرجاع منها --</option>
                  <option value="direct_mode" className="font-bold text-amber-700">⚡ (الاسترجاع بدون فاتورة - مرتجع مباشر لمورد)</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - مورد: {inv.supplierName} ({Number(inv.grandTotal).toLocaleString('ar-EG')} ج.م) - {inv.date}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* If Direct Mode: Supplier Selector */
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-600" />
                  <span>المورد المرتجع إليه الخامات <span className="text-red-500">*</span></span>
                </label>
                <select
                  value={directSupplierId}
                  onChange={e => handleSupplierSelectChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                >
                  <option value="">-- اختر المورد من القائمة أو أدخل اسمه أدناه --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.phone ? `(${s.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Return Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>تاريخ إذن الارتجاع *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-bold"
                required
              />
            </div>

            {/* Return Voucher Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">رقم إذن المرتجع</label>
              <input
                type="text"
                value={returnNumber}
                onChange={e => setReturnNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900"
                required
              />
            </div>

            {/* Refund / Compensation Method */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>طريقة التسوية المالية *</span>
              </label>
              <select
                value={refundMethod}
                onChange={e => setRefundMethod(e.target.value as PurchaseReturnRefundMethod)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                <option value="credit_deduction">خصم ومقاصة من رصيد المورد الآجل</option>
                <option value="cash">رد واسترداد نقدي بخزينة المصنع</option>
                <option value="bank">تحويل بنكي مسترد لحساب المصنع</option>
              </select>
            </div>

            {/* Warehouse Issuer */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">أمين مخزن الخامات القائم بالصرف</label>
              <input
                type="text"
                value={issuedByWarehouseUser}
                onChange={e => setIssuedByWarehouseUser(e.target.value)}
                placeholder="اسم أمين المخزن"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
          </div>

          {/* Supplier Info Snippet (Invoice Mode) */}
          {returnMode === 'by_invoice' && selectedInvoice ? (
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-wrap items-center justify-between text-xs text-indigo-950 font-bold gap-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>المورد: {selectedInvoice.supplierName}</span>
                {selectedInvoice.supplierPhone && (
                  <span className="text-slate-500 font-normal">({selectedInvoice.supplierPhone})</span>
                )}
              </div>
              <div>
                <span>إجمالي الفاتورة الأصلية: {Number(selectedInvoice.grandTotal).toLocaleString('ar-EG')} ج.م</span>
                <span className="mx-2 text-indigo-300">|</span>
                <span>المتبقي الآجل عليها: {Number(selectedInvoice.remainingAmount).toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>
          ) : returnMode === 'direct' ? (
            /* Supplier Details Form for Direct Mode */
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-amber-600" />
                <span>بيانات المورد للمرتجع المباشر (بدون فاتورة):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    اسم المورد / الشركة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={directSupplierName}
                    onChange={e => setDirectSupplierName(e.target.value)}
                    placeholder="شركة النسيج والغزل..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">هاتف المورد</label>
                  <input
                    type="text"
                    value={directSupplierPhone}
                    onChange={e => setDirectSupplierPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">نسبة ضريبة القيمة المضافة (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={directTaxPercent}
                    onChange={e => setDirectTaxPercent(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Section 2: Items to Return Selection Table */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>{returnMode === 'by_invoice' ? 'الخامات والمستلزمات للاختيار عبر التشيك بوكس:' : 'الخامات والمستلزمات المرتجعة للمورد:'}</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  {returnMode === 'by_invoice'
                    ? 'حدد الخامات المراد إرجاعها باستخدام خانة الاختيار (التشيك بوكس)، وعدل الكمية وسعر الشراء المسترد'
                    : 'أضف الخامات والمستلزمات مع تحديد الوحدة، الكمية، وسعر الشراء'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                      allSelected
                        ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-950 border-indigo-300'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-xs'
                    }`}
                    title={allSelected ? 'إلغاء تحديد جميع الخامات' : 'تحديد جميع خامات الفاتورة'}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>{allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</span>
                  </button>
                )}

                {returnMode === 'direct' && (
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ إضافة خامة/صنف للمرتجع</span>
                  </button>
                )}

                <span className={`text-xs font-black px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                  activeItems.length > 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {activeItems.length > 0
                    ? `✓ محدد للاعتماد: (${activeItems.length}) من أصل (${items.length}) خامة`
                    : 'لم يتم تحديد أي خامة للاعتماد بعد'}
                </span>
              </div>
            </div>

            {/* Instruction banner for multi-item selection */}
            {items.length > 0 && (
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base text-indigo-600">☑</span>
                  <span>
                    <strong>طريقة الاختيار:</strong> اضغط على مربع الاختيار (التشيك بوكس) بجوار أي خامة لتعليمها أو إلغاء اختيارها، أو اضغط زر <strong>"تحديد الكل"</strong>. عند الاعتماد سيتم اعتماد وخصم الخامات المحددة فقط ({activeItems.length} خامة).
                  </span>
                </div>
                {items.length - activeItems.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md shrink-0 border border-indigo-200">
                    مستبعد: {items.length - activeItems.length}
                  </span>
                )}
              </div>
            )}

            {/* Invoice mode without invoice selected */}
            {returnMode === 'by_invoice' && !selectedInvoice ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold">يرجى تحديد فاتورة شراء من القائمة أعلاه لعرض خاماتها المشتراة</p>
                <p className="text-[11px] text-slate-400">
                  أو يمكنك التبديل إلى <strong>(استرجاع مباشر بدون فاتورة)</strong> لتسجيل الخامات المرتجعة يدوياً.
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
                لا توجد أصناف في هذا المرتجع. انقر على (+ إضافة خامة/صنف للمرتجع) للبدء.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5 w-32 text-center">
                          <div
                            className="flex items-center justify-center gap-1.5 cursor-pointer select-none"
                            onClick={handleToggleAll}
                            title={allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                          >
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={handleToggleAll}
                              className="w-4 h-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-[11px] font-black text-slate-800">تحديد الخامة</span>
                          </div>
                        </th>
                        <th className="p-2.5 min-w-[190px]">اسم الخامة / المستلزم</th>
                        <th className="p-2.5 w-20 text-center">النوع</th>
                        <th className="p-2.5 w-18 text-center">الوحدة</th>
                        {returnMode === 'by_invoice' && (
                          <th className="p-2.5 w-20 text-center">كمية الفاتورة</th>
                        )}
                        <th className="p-2.5 w-24 text-center">الكمية المرتجعة</th>
                        <th className="p-2.5 w-24 text-left">سعر الشراء</th>
                        <th className="p-2.5 w-28 text-left">إجمالي المرتجع</th>
                        <th className="p-2.5 min-w-[150px]">سبب الإرجاع</th>
                        <th className="p-2.5 min-w-[140px]">حالة الخامة</th>
                        {returnMode === 'direct' && (
                          <th className="p-2.5 w-12 text-center">حذف</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => {
                        const isChecked = item.isSelected;
                        return (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              isChecked
                                ? 'bg-indigo-50/50 ring-1 ring-indigo-400/30'
                                : 'opacity-40 bg-slate-50/60 hover:opacity-75'
                            }`}
                          >
                            {/* Checkbox beside item */}
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <label className="inline-flex items-center justify-center gap-1.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleItemSelectToggle(idx)}
                                  title={isChecked ? 'إلغاء اختيار هذه الخامة' : 'اختيار هذه الخامة للاسترجاع'}
                                  className="w-5 h-5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-transform active:scale-90"
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

                            {/* Material Name */}
                            <td className="p-2.5 font-bold text-slate-800">
                              {returnMode === 'by_invoice' ? (
                                <div>
                                  <div>{item.materialName}</div>
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    كود: {item.materialId}
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    required
                                    value={item.materialName}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setItems(prev => {
                                        const c = [...prev];
                                        c[idx].materialName = val;
                                        return c;
                                      });
                                    }}
                                    placeholder="اسم الخامة (مثال: قماش قطن سنجل)"
                                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                                  />
                                  {materialsList.length > 0 && (
                                    <select
                                      onChange={e => handleCatalogMaterialPick(idx, e.target.value)}
                                      className="w-full text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 cursor-pointer"
                                    >
                                      <option value="">-- أو اختر من دليل الخامات بالمصنع --</option>
                                      {materialsList.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Material Type */}
                            <td className="p-2.5 text-center">
                              {returnMode === 'by_invoice' ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                  {item.materialType === 'fabric' ? 'قماش' : item.materialType === 'accessory' ? 'مستلزمات' : item.materialType}
                                </span>
                              ) : (
                                <select
                                  value={item.materialType}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setItems(prev => {
                                      const c = [...prev];
                                      c[idx].materialType = val;
                                      return c;
                                    });
                                  }}
                                  className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                                >
                                  <option value="fabric">أقمشة</option>
                                  <option value="accessory">مستلزمات</option>
                                  <option value="packaging">تعبئة وتغليف</option>
                                  <option value="other">أخرى</option>
                                </select>
                              )}
                            </td>

                            {/* Unit */}
                            <td className="p-2.5 text-center">
                              {returnMode === 'by_invoice' ? (
                                <span className="text-slate-600 font-medium">{item.unit}</span>
                              ) : (
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setItems(prev => {
                                      const c = [...prev];
                                      c[idx].unit = val;
                                      return c;
                                    });
                                  }}
                                  placeholder="كجم/متر"
                                  className="w-16 px-1 py-1 text-xs text-center border border-slate-300 rounded bg-white"
                                />
                              )}
                            </td>

                            {/* Invoice Original Quantity */}
                            {returnMode === 'by_invoice' && (
                              <td className="p-2.5 text-center font-bold text-slate-500">
                                {item.maxQuantity}
                              </td>
                            )}

                            {/* Return Quantity */}
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                max={returnMode === 'by_invoice' ? item.maxQuantity : 999999}
                                step="any"
                                disabled={returnMode === 'by_invoice' && !isChecked}
                                value={item.quantity}
                                onChange={e => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="p-2.5 text-left font-medium">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                disabled={returnMode === 'by_invoice' && !isChecked}
                                value={item.unitPrice}
                                onChange={e => handleUnitPriceChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-left font-bold text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                              />
                            </td>

                            {/* Total */}
                            <td className="p-2.5 text-left font-black text-indigo-900">
                              {Number(item.total).toLocaleString('ar-EG')} ج.م
                            </td>

                            {/* Return Reason */}
                            <td className="p-2.5">
                              <select
                                disabled={returnMode === 'by_invoice' && !isChecked}
                                value={item.reason}
                                onChange={e => handleReasonChange(idx, e.target.value as PurchaseReturnReason)}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                              >
                                {Object.entries(REASON_LABELS).map(([k, v]) => (
                                  <option key={k} value={k}>{v}</option>
                                ))}
                              </select>
                            </td>

                            {/* Condition */}
                            <td className="p-2.5">
                              <select
                                disabled={returnMode === 'by_invoice' && !isChecked}
                                value={item.condition}
                                onChange={e => handleConditionChange(idx, e.target.value as any)}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 font-bold"
                              >
                                {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                                  <option key={k} value={k}>{v}</option>
                                ))}
                              </select>
                            </td>

                            {/* Action Delete for Direct Mode */}
                            {returnMode === 'direct' && (
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveManualItem(idx)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                  title="حذف هذا البند"
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

          {/* Section 3: Summary Totals & General Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ملاحظات الفحص الفني وأسباب الإرجاع العامة:
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="أدخل أي ملاحظات فنية أو رقم تقرير مراقبة الجودة..."
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
              />

              <div className="mt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stockReturned}
                    onChange={e => setStockReturned(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>خصم الكميات المرتجعة فوراً من رصيد مخزن الخامات</span>
                </label>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-700">
                <span>إجمالي الخامات المرتجعة ({activeItems.length} صنف):</span>
                <span className="font-bold">{subtotal.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>ضريبة القيمة المضافة ({taxPercent}%):</span>
                <span className="font-bold">{taxAmount.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-indigo-200 text-sm font-black text-indigo-950">
                <span>صافي قيمة إذن المرتجع الإجمالية:</span>
                <span className="text-base text-indigo-700 font-black">{grandTotal.toLocaleString('ar-EG')} ج.م</span>
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
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isEditing
                  ? `حفظ تعديلات المرتجع (${activeItems.length} خامة معتمدة)`
                  : `اعتماد وتسجيل الخامات المختارة فقط (${activeItems.length} خامة)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
