import React, { useState } from 'react';
import { X, Plus, PackageSearch, Tag, Layers, DollarSign } from 'lucide-react';
import { MaterialItem } from '../../types';
import { getMaterials, saveMaterials } from '../../lib/accountingStorage';

interface QuickAddMaterialModalProps {
  onClose: () => void;
  onSuccess: (newMaterial: MaterialItem) => void;
}

export function QuickAddMaterialModal({ onClose, onSuccess }: QuickAddMaterialModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'fabric' as 'fabric' | 'accessory',
    unit: 'كجم',
    defaultCost: 0,
  });
  const [error, setError] = useState('');

  const commonUnits = ['كجم', 'متر', 'بكرة', 'قطعة', 'دزينة', 'باكو', 'كرتونة', 'لفة (50 متر)'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('يرجى إدخال اسم الصنف / الخامة');
      return;
    }

    const current = getMaterials();
    const newMaterial: MaterialItem = {
      id: `mat_${Date.now()}`,
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      type: formData.type,
      unit: formData.unit || 'قطعة',
      defaultCost: Number(formData.defaultCost) || 0,
      isActive: true,
    };

    const updated = [...current, newMaterial];
    saveMaterials(updated);
    window.dispatchEvent(new CustomEvent('materials_updated'));
    onSuccess(newMaterial);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <PackageSearch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">إضافة صنف جديد للتكوين الهيكلي</h3>
              <p className="text-xs text-slate-500">يتم تسجيل الصنف في خامات ومستلزمات المصنع ويتاح فورا في فاتورة الشراء</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم الصنف / الخامة <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (error) setError('');
                }}
                placeholder="مثال: قماش قطن بيكيه، سوستة نايلون مقاس 50، شريط ساتان..."
                className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نوع الخامة / التصنيف</label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'fabric' | 'accessory';
                    setFormData({
                      ...formData,
                      type: newType,
                      unit: newType === 'fabric' ? 'كجم' : 'قطعة',
                    });
                  }}
                  className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="fabric">أقمشة وغزول (Fabric)</option>
                  <option value="accessory">إكسسوارات ومستلزمات خياطة (Accessory)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">كود الصنف (اختياري)</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="مثال: FAB-092 أو ACC-11"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">وحدة القياس</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="كجم، متر، قطعة..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {commonUnits.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setFormData({ ...formData, unit: u })}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      formData.unit === u
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سعر التكلفة الافتراضي (جنيه)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.defaultCost || ''}
                  onChange={(e) => setFormData({ ...formData, defaultCost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden font-bold text-slate-800"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">يمكنك التعديل عليه بحرية في كل فاتورة شراء</p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-sm transition-all hover:shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>حفظ الصنف في التكوين الهيكلي</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
