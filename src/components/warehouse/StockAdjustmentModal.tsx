import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, RefreshCw, Plus, Layers } from 'lucide-react';
import { MaterialStockItem, saveManualStockAdjustment } from '../../lib/rawMaterialsInventory';
import { useNotification } from '../../context/NotificationContext';

interface StockAdjustmentModalProps {
  material?: MaterialStockItem | null;
  materialsList: MaterialStockItem[];
  onClose: () => void;
  onSaved: () => void;
}

export function StockAdjustmentModal({
  material,
  materialsList,
  onClose,
  onSaved
}: StockAdjustmentModalProps) {
  const { notifySuccess, notifyError } = useNotification();
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    material?.id || (materialsList[0]?.id ?? '')
  );

  const activeMaterial = materialsList.find(m => m.id === selectedMaterialId) || material;

  const [adjustmentType, setAdjustmentType] = useState<'initial_stock' | 'in' | 'out' | 'adjustment'>('initial_stock');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>(
    activeMaterial ? activeMaterial.averageCost || activeMaterial.defaultCost || 0 : ''
  );
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('رصيد افتتاحي (مخزون أول المدة)');
  const [operator, setOperator] = useState<string>('أمين مخزن الخامات');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleMaterialChange = (matId: string) => {
    setSelectedMaterialId(matId);
    const found = materialsList.find(m => m.id === matId);
    if (found) {
      setUnitPrice(found.averageCost || found.defaultCost || 0);
    }
  };

  const handleTypeChange = (t: 'initial_stock' | 'in' | 'out' | 'adjustment') => {
    setAdjustmentType(t);
    if (t === 'initial_stock') setReason('رصيد افتتاحي (مخزون أول المدة)');
    else if (t === 'in') setReason('إذن إضافة وارد يدوي (بواقي تشغيل / مرتجع)');
    else if (t === 'out') setReason('إذن صرف يدوي (عينات / هالك تشغيل)');
    else if (t === 'adjustment') setReason('تسوية جرد فعلي بالمخزن');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMaterial) {
      setError('يرجى اختيار الخامة أولاً');
      return;
    }
    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      setError('يرجى إدخال كمية صحيحة أكبر من الصفر');
      return;
    }

    const numPrice = Number(unitPrice) || activeMaterial.defaultCost || 0;

    try {
      saveManualStockAdjustment({
        materialId: activeMaterial.id,
        materialName: activeMaterial.name,
        materialType: activeMaterial.type,
        date: date || new Date().toISOString().split('T')[0],
        type: adjustmentType,
        quantity: numQty,
        unitPrice: numPrice,
        reason: reason.trim() || 'تسوية مخزنية',
        notes: notes.trim(),
        operator: operator.trim()
      });

      const typeText = adjustmentType === 'initial_stock' 
        ? 'رصيد افتتاحي' 
        : adjustmentType === 'in' 
        ? 'إذن إضافة وارد' 
        : adjustmentType === 'out' 
        ? 'إذن صرف' 
        : 'تسوية جردية';

      notifySuccess(
        `تم تحديث رصيد المخزون بنجاح لخامة (${activeMaterial.name}) - ${typeText} بمقدار ${numQty} ${activeMaterial.unit}`,
        "تحديث المخزون بنجاح"
      );

      onSaved();
      onClose();
    } catch (err: any) {
      const errMsg = err?.message || 'حدث خطأ أثناء حفظ التسوية';
      notifyError(errMsg, "فشل تحديث المخزون");
      setError(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                تسجيل حركة تسوية / رصيد مخزني
              </h3>
              <p className="text-xs text-slate-400">
                إضافة رصيد افتتاحي أو تسوية جردية لخامات الأقمشة والإكسسوارات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Material Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الخامة المراد ضبط رصيدها
            </label>
            <select
              value={selectedMaterialId}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <optgroup label="🧵 مخزن الأقمشة">
                {materialsList.filter(m => m.type === 'fabric').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code}) - الرصيد الحالي: {m.currentStock} {m.unit}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🧷 مخزن الإكسسوارات والمستلزمات">
                {materialsList.filter(m => m.type === 'accessory').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code}) - الرصيد الحالي: {m.currentStock} {m.unit}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Transaction Type Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نوع الحركة المخزنية
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleTypeChange('initial_stock')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  adjustmentType === 'initial_stock'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                رصيد افتتاحي (أول المدة)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('in')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  adjustmentType === 'in'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                إذن إضافة وارد (+)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('out')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  adjustmentType === 'out'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                إذن صرف يدوي (-)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('adjustment')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  adjustmentType === 'adjustment'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                تسوية جرد فعلي (فرق)
              </button>
            </div>
          </div>

          {/* Quantity and Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الكمية ({activeMaterial?.unit || 'وحدة'})
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                placeholder="أدخل الكمية..."
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                سعر الوحدة (ج.م)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="السعر بالجنيه..."
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Date & Operator */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                التاريخ
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                المسؤول / أمين المخزن
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              البيان / سبب الحركة
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ملاحظات إضافية (اختياري)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات حول الجرد أو إذن الصرف..."
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>حفظ الحركة في المخزن</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
