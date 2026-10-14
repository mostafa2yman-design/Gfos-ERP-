import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  PackageSearch,
  ShoppingCart,
  Users,
  ExternalLink,
  ArrowRight,
  Info,
  Layers,
  FileText,
  Tag
} from 'lucide-react';
import {
  PurchaseInvoice,
  PurchaseInvoiceItem,
  PurchasePaymentMethod,
  PurchasePaymentStatus,
  CustomerSupplier,
  MaterialItem
} from '../../types';
import { getCustomersSuppliers, getMaterials } from '../../lib/accountingStorage';
import { generateNextPurchaseInvoiceNumber } from '../../lib/purchasesStorage';
import { QuickAddSupplierModal } from './QuickAddSupplierModal';
import { QuickAddMaterialModal } from './QuickAddMaterialModal';

interface PurchaseInvoiceFormModalProps {
  invoice?: PurchaseInvoice | null;
  onClose: () => void;
  onSave: (invoice: PurchaseInvoice) => void;
  onNavigateToAccounting?: (tab: 'customers' | 'materials', autoOpenAdd: boolean) => void;
}

export function PurchaseInvoiceFormModal({
  invoice,
  onClose,
  onSave,
  onNavigateToAccounting,
}: PurchaseInvoiceFormModalProps) {
  // Master lists from structural configuration
  const [suppliers, setSuppliers] = useState<CustomerSupplier[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // Quick addition modals
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [activeMaterialLineIndex, setActiveMaterialLineIndex] = useState<number | null>(null);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState(
    invoice?.invoiceNumber || generateNextPurchaseInvoiceNumber()
  );
  const [date, setDate] = useState(
    invoice?.date || new Date().toISOString().split('T')[0]
  );
  const [supplierId, setSupplierId] = useState(invoice?.supplierId || '');
  const [supplierName, setSupplierName] = useState(invoice?.supplierName || '');
  const [supplierPhone, setSupplierPhone] = useState(invoice?.supplierPhone || '');
  const [paymentMethod, setPaymentMethod] = useState<PurchasePaymentMethod>(
    invoice?.paymentMethod || 'cash'
  );
  const [referenceNumber, setReferenceNumber] = useState(invoice?.referenceNumber || '');
  const [receiptStatus, setReceiptStatus] = useState<'received' | 'pending'>(
    invoice?.receiptStatus || 'received'
  );
  const [notes, setNotes] = useState(invoice?.notes || '');

  // Line items
  const [items, setItems] = useState<PurchaseInvoiceItem[]>(
    invoice?.items || [
      {
        id: `item_${Date.now()}_0`,
        materialId: '',
        materialName: '',
        materialType: 'fabric',
        unit: 'كجم',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        total: 0,
        notes: '',
      },
    ]
  );

  // Financial calculations
  const [taxPercent, setTaxPercent] = useState<number>(invoice?.taxPercent || 0);
  const [paidAmount, setPaidAmount] = useState<number>(invoice?.paidAmount ?? 0);
  const [isManualPaid, setIsManualPaid] = useState<boolean>(invoice !== undefined && invoice !== null);
  const [validationError, setValidationError] = useState('');

  // Load suppliers and materials from structural configuration
  const refreshStorageData = () => {
    const suppList = getCustomersSuppliers().filter(
      (s) => s.type === 'supplier' || s.type === 'both'
    );
    setSuppliers(suppList);

    const matList = getMaterials().filter((m) => m.isActive !== false);
    setMaterials(matList);

    // If no supplier selected and we have suppliers, set first
    if (!supplierId && suppList.length > 0 && !invoice) {
      setSupplierId(suppList[0].id);
      setSupplierName(suppList[0].name);
      setSupplierPhone(suppList[0].phone || '');
    }
  };

  useEffect(() => {
    refreshStorageData();

    const handleCustUpdate = () => refreshStorageData();
    const handleMatUpdate = () => refreshStorageData();
    window.addEventListener('customers_updated', handleCustUpdate);
    window.addEventListener('materials_updated', handleMatUpdate);
    return () => {
      window.removeEventListener('customers_updated', handleCustUpdate);
      window.removeEventListener('materials_updated', handleMatUpdate);
    };
  }, []);

  // When supplier dropdown changes
  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const selected = suppliers.find((s) => s.id === id);
    if (selected) {
      setSupplierName(selected.name);
      setSupplierPhone(selected.phone || '');
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const discountTotal = items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
  const taxAmount = taxPercent > 0 ? Math.round(((subtotal - discountTotal) * taxPercent) / 100) : 0;
  const grandTotal = Math.max(0, subtotal - discountTotal + taxAmount);
  const remainingAmount = Math.max(0, grandTotal - paidAmount);

  // Auto set paid amount if user hasn't explicitly customized and payment method is cash/bank
  useEffect(() => {
    if (!isManualPaid && !invoice) {
      if (paymentMethod === 'cash' || paymentMethod === 'bank') {
        setPaidAmount(grandTotal);
      } else if (paymentMethod === 'credit') {
        setPaidAmount(0);
      }
    }
  }, [grandTotal, paymentMethod, isManualPaid, invoice]);

  // Determine payment status
  const getCalculatedPaymentStatus = (): PurchasePaymentStatus => {
    if (paidAmount >= grandTotal && grandTotal > 0) return 'paid';
    if (paidAmount > 0 && paidAmount < grandTotal) return 'partial';
    return 'unpaid';
  };

  // Line item change handlers
  const handleItemMaterialChange = (index: number, materialId: string) => {
    const selectedMat = materials.find((m) => m.id === materialId);
    setItems((prev) => {
      const copy = [...prev];
      if (selectedMat) {
        const qty = copy[index].quantity || 1;
        const price = selectedMat.defaultCost || 0;
        const disc = copy[index].discount || 0;
        copy[index] = {
          ...copy[index],
          materialId: selectedMat.id,
          materialName: selectedMat.name,
          materialType: selectedMat.type,
          unit: selectedMat.unit || 'قطعة',
          unitPrice: price, // Pre-filled with default, fully editable!
          total: Math.max(0, qty * price - disc),
        };
      } else {
        copy[index] = {
          ...copy[index],
          materialId: '',
          materialName: '',
          total: 0,
        };
      }
      return copy;
    });
  };

  const handleLineFieldChange = (
    index: number,
    field: keyof PurchaseInvoiceItem,
    value: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      const current = { ...copy[index], [field]: value };
      const qty = Number(current.quantity) || 0;
      const price = Number(current.unitPrice) || 0;
      const disc = Number(current.discount) || 0;
      current.total = Math.max(0, qty * price - disc);
      copy[index] = current;
      return copy;
    });
  };

  const handleAddLine = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${prev.length}`,
        materialId: '',
        materialName: '',
        materialType: 'fabric',
        unit: 'كجم',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        total: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (items.length <= 1) {
      // Clear line instead of removing
      setItems([
        {
          id: `item_${Date.now()}_0`,
          materialId: '',
          materialName: '',
          materialType: 'fabric',
          unit: 'كجم',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          total: 0,
          notes: '',
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick modal success handlers
  const handleSupplierAdded = (newSupp: CustomerSupplier) => {
    refreshStorageData();
    setSupplierId(newSupp.id);
    setSupplierName(newSupp.name);
    setSupplierPhone(newSupp.phone || '');
  };

  const handleMaterialAdded = (newMat: MaterialItem) => {
    refreshStorageData();
    if (activeMaterialLineIndex !== null && items[activeMaterialLineIndex]) {
      handleItemMaterialChange(activeMaterialLineIndex, newMat.id);
    } else {
      // Or add as a new row if all rows filled
      setItems((prev) => [
        ...prev,
        {
          id: `item_${Date.now()}_${prev.length}`,
          materialId: newMat.id,
          materialName: newMat.name,
          materialType: newMat.type,
          unit: newMat.unit,
          quantity: 1,
          unitPrice: newMat.defaultCost || 0,
          discount: 0,
          total: newMat.defaultCost || 0,
          notes: '',
        },
      ]);
    }
    setActiveMaterialLineIndex(null);
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !supplierName.trim()) {
      setValidationError('يرجى اختيار المورد للفاتورة أو إضافة مورد جديد');
      return;
    }

    const validItems = items.filter((item) => item.materialName.trim() && item.quantity > 0);
    if (validItems.length === 0) {
      setValidationError('يرجى إضافة صنف واحد على الأقل وتحديد الكمية');
      return;
    }

    const newInvoice: PurchaseInvoice = {
      id: invoice?.id || `pur_${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || generateNextPurchaseInvoiceNumber(),
      date,
      supplierId,
      supplierName,
      supplierPhone: supplierPhone || undefined,
      paymentMethod,
      paymentStatus: getCalculatedPaymentStatus(),
      referenceNumber: referenceNumber.trim() || undefined,
      receiptStatus,
      notes: notes.trim() || undefined,
      items: validItems,
      subtotal,
      discountTotal,
      taxPercent: Number(taxPercent) || 0,
      taxAmount,
      grandTotal,
      paidAmount: Number(paidAmount) || 0,
      remainingAmount,
      createdAt: invoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] text-right">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  {invoice ? 'تعديل فاتورة شراء' : 'إضافة فاتورة شراء جديدة مفصلة'}
                </h3>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded border border-indigo-200">
                  {invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                تسجيل توريدات الخامات ومستلزمات الإنتاج من الموردين وتحديث الأرصدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick shortcuts to Structural Configuration in header */}
            {onNavigateToAccounting && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToAccounting('customers', true)}
                  title="الانتقال لإدارة الموردين في التكوين الهيكلي"
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>شاشة الموردين</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToAccounting('materials', true)}
                  title="الانتقال لشاشة خامات التكوين الهيكلي"
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  <PackageSearch className="w-3.5 h-3.5 text-indigo-500" />
                  <span>أصناف التكوين الهيكلي</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-shake">
              <Info className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Top Section: Supplier, Date, Invoice No */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900 outline-hidden"
                />
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ الشراء <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-semibold"
                  />
                </div>
              </div>

              {/* Supplier Selection with Quick Add Button */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    المورد <span className="text-rose-500">*</span>
                  </label>
                  {/* Shortcut Button to Add Supplier */}
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة مورد جديد</span>
                  </button>
                </div>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-bold text-slate-800"
                  >
                    <option value="">-- اختر المورد من القائمة --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.phone ? `(${s.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Method, Ref, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طريقة السداد</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const newMethod = e.target.value as PurchasePaymentMethod;
                    setPaymentMethod(newMethod);
                    setIsManualPaid(false);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-semibold text-slate-800"
                >
                  <option value="cash">نقدي (خزينة المصنع)</option>
                  <option value="credit">آجل (سداد لاحق / ذمم دائنة)</option>
                  <option value="bank">تحويل بنكي / فوري</option>
                  <option value="cheque">شيك مصرفي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم إذن / فاتورة المورد الورقية
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="مثال: فاتورة رقم 8821"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">حالة استلام البضاعة</label>
                <select
                  value={receiptStatus}
                  onChange={(e) => setReceiptStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-semibold"
                >
                  <option value="received">تم الاستلام والفحص بالمخزن</option>
                  <option value="pending">قيد التوريد والشحن</option>
                </select>
              </div>
            </div>
          </div>

          {/* Middle Section: Items Table (الأصناف المفصلة مع إمكانية التعديل على السعر) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>أصناف فاتورة الشراء وتوريدات الخامات</span>
                </h4>
                <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                  {items.length} صنف
                </span>
              </div>

              {/* Shortcut buttons to add items */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMaterialLineIndex(null);
                    setShowAddMaterialModal(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة صنف جديد للتكوين الهيكلي</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ بند آخر للفاتورة</span>
                </button>
              </div>
            </div>

            {/* The Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full text-right text-xs min-w-[700px]">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-3 font-bold text-center w-10">#</th>
                    <th className="p-3 font-bold min-w-[220px]">
                      الصنف (من التكوين الهيكلي) <span className="text-rose-500">*</span>
                    </th>
                    <th className="p-3 font-bold text-center w-24">الوحدة</th>
                    <th className="p-3 font-bold text-center w-24">الكمية</th>
                    <th className="p-3 font-bold text-center w-28">
                      السعر (قابل للتعديل) <span className="text-rose-500">*</span>
                    </th>
                    <th className="p-3 font-bold text-center w-24">الخصم</th>
                    <th className="p-3 font-bold text-center w-28">الإجمالي</th>
                    <th className="p-3 font-bold min-w-[140px]">ملاحظات / تشغيلة</th>
                    <th className="p-3 font-bold text-center w-12">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>

                      {/* Material Select */}
                      <td className="p-2">
                        <select
                          value={item.materialId}
                          onChange={(e) => handleItemMaterialChange(idx, e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-bold text-slate-800"
                        >
                          <option value="">-- اختر الصنف --</option>
                          <optgroup label="خامات أقمشة وغزول">
                            {materials
                              .filter((m) => m.type === 'fabric')
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} {m.code ? `[${m.code}]` : ''} - ({m.unit})
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="مستلزمات خياطة وإكسسوار وتعبئة">
                            {materials
                              .filter((m) => m.type !== 'fabric')
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} {m.code ? `[${m.code}]` : ''} - ({m.unit})
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </td>

                      {/* Unit */}
                      <td className="p-2 text-center">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleLineFieldChange(idx, 'unit', e.target.value)}
                          className="w-full text-center p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          required
                          value={item.quantity || ''}
                          onChange={(e) => handleLineFieldChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="الكمية"
                          className="w-full text-center p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        />
                      </td>

                      {/* Unit Price (Editable!) */}
                      <td className="p-2 text-center">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={item.unitPrice || ''}
                            onChange={(e) => handleLineFieldChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full text-center p-2 border border-indigo-300 rounded-lg text-xs font-black text-indigo-900 bg-indigo-50/40 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                          />
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.discount || ''}
                          onChange={(e) => handleLineFieldChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full text-center p-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden text-slate-700"
                        />
                      </td>

                      {/* Line Total */}
                      <td className="p-2 text-center font-black text-slate-900 text-xs">
                        {item.total.toLocaleString('ar-EG')} ج.م
                      </td>

                      {/* Notes */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => handleLineFieldChange(idx, 'notes', e.target.value)}
                          placeholder="لون، مواصفة..."
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        />
                      </td>

                      {/* Delete */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="w-7 h-7 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors mx-auto"
                          title="حذف البند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-500">
              💡 ملحوظة: يمكنك تعديل سعر الوحدة لأي صنف بحرية وفق الاتفاق مع المورد دون المساس بالتكلفة المرجعية.
            </p>
          </div>

          {/* Bottom Section: Totals, Payments & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            {/* General Notes */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">ملاحظات الفاتورة والتوريد</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أية شروط دفع، شروط تسليم، أو تفاصيل خاصة بالشحنة..."
                className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden resize-none"
              />

              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-2 text-xs text-indigo-900">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-[11px] space-y-0.5">
                  <span className="font-bold">التأثير المالي والمخزني:</span>
                  <p>يتم تسجيل الفاتورة في سجل المشتريات، وتحديث حساب المورد والمدفوعات فور الحفظ.</p>
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>إجمالي الأصناف قبل الخصم:</span>
                <span className="font-bold text-slate-800">{subtotal.toLocaleString('ar-EG')} ج.م</span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>إجمالي الخصومات:</span>
                  <span className="font-bold">-{discountTotal.toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}

              {/* Tax / VAT */}
              <div className="flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span>ضريبة القيمة المضافة:</span>
                  <select
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                    className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-[11px]"
                  >
                    <option value="0">0% (بدون ضريبة)</option>
                    <option value="5">5%</option>
                    <option value="14">14% (قيمة مضافة)</option>
                  </select>
                </div>
                <span className="font-semibold">{taxAmount.toLocaleString('ar-EG')} ج.م</span>
              </div>

              {/* Grand Total */}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>صافي الفاتورة الكلي:</span>
                <span className="text-indigo-700 text-base">{grandTotal.toLocaleString('ar-EG')} ج.م</span>
              </div>

              {/* Paid Amount */}
              <div className="border-t border-slate-200 pt-2 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700">المبلغ المسدد الآن:</label>
                    <button
                      type="button"
                      onClick={() => {
                        setPaidAmount(grandTotal);
                        setIsManualPaid(true);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-semibold cursor-pointer"
                    >
                      (سداد كامل)
                    </button>
                  </div>
                  <div className="w-36">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={paidAmount || ''}
                      onChange={(e) => {
                        setPaidAmount(parseFloat(e.target.value) || 0);
                        setIsManualPaid(true);
                      }}
                      className="w-full text-center px-3 py-1.5 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Remaining Amount */}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">المتبقي (الآجل على الشركة):</span>
                  <span
                    className={`font-black text-sm ${
                      remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {remainingAmount.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors text-center"
            >
              إلغاء والعودة لشاشة المشتريات
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-7 py-2.5 rounded-xl shadow-md transition-all hover:shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{invoice ? 'حفظ تعديلات الفاتورة' : 'حفظ الفاتورة وتأكيد الشراء'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Quick Add Supplier Modal */}
      {showAddSupplierModal && (
        <QuickAddSupplierModal
          onClose={() => setShowAddSupplierModal(false)}
          onSuccess={handleSupplierAdded}
        />
      )}

      {/* Quick Add Material Modal */}
      {showAddMaterialModal && (
        <QuickAddMaterialModal
          onClose={() => setShowAddMaterialModal(false)}
          onSuccess={handleMaterialAdded}
        />
      )}
    </div>
  );
}
