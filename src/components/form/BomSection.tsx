import React, { useState, useEffect } from 'react';
import { getMaterials } from '../../lib/accountingStorage';
import { MaterialItem } from '../../types';
import { ProductionOrder, MaterialInstance, AccessoryInstance, SizeData } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface BomSectionProps {
  order: ProductionOrder;
  onChange: (field: 'materials' | 'accessories', value: MaterialInstance[] | AccessoryInstance[]) => void;
  readOnly?: boolean;
}

export function BomSection({ order, onChange, readOnly = false }: BomSectionProps) {
  const [availableFabrics, setAvailableFabrics] = useState<MaterialItem[]>([]);
  const [availableAccessories, setAvailableAccessories] = useState<MaterialItem[]>([]);
  
  useEffect(() => {
    const allMaterials = getMaterials();
    setAvailableFabrics(allMaterials.filter(m => m.type === 'fabric' && m.isActive));
    setAvailableAccessories(allMaterials.filter(m => m.type === 'accessory' && m.isActive));
  }, []);
  const { materials = [], accessories = [], sizes = [] } = order;

  const handleAddMaterial = () => {
    if (readOnly) return;
    const newMaterial: MaterialInstance = {
      id: crypto.randomUUID(),
      name: '',
      type: 'خامة مضافة',
      unit: 'كجم',
      standardMethod: 'موحد',
      unifiedStandard: 0,
      sizeStandards: sizes.map(s => ({ size: s.size, standard: 0 }))
    };
    onChange('materials', [...materials, newMaterial]);
  };

  const handleUpdateMaterial = (index: number, field: keyof MaterialInstance, value: string | number | { size: string; standard: number }[]) => {
    if (readOnly) return;
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    onChange('materials', updated);
  };

  const handleSelectMaterial = (index: number, name: string, unit: string, defaultCost: number) => {
    if (readOnly) return;
    const updated = [...materials];
    updated[index] = { ...updated[index], name, unit, standardPrice: defaultCost || 0 };
    onChange('materials', updated);
  };

  const handleRemoveMaterial = (index: number) => {
    if (readOnly) return;
    const updated = materials.filter((_, i) => i !== index);
    onChange('materials', updated);
  };

  const handleAddAccessory = () => {
    if (readOnly) return;
    const newAcc: AccessoryInstance = {
      id: crypto.randomUUID(),
      name: '',
      type: 'إكسسوار مضاف',
      unit: 'قطعة',
      standardMethod: 'موحد',
      unifiedStandard: 1,
      sizeStandards: sizes.map(s => ({ size: s.size, standard: 1 }))
    };
    onChange('accessories', [...accessories, newAcc]);
  };

  const handleUpdateAccessory = (index: number, field: keyof AccessoryInstance, value: string | number | { size: string; standard: number }[]) => {
    if (readOnly) return;
    const updated = [...accessories];
    updated[index] = { ...updated[index], [field]: value };
    onChange('accessories', updated);
  };

  const handleSelectAccessory = (index: number, name: string, unit: string, defaultCost: number) => {
    if (readOnly) return;
    const updated = [...accessories];
    updated[index] = { ...updated[index], name, unit, standardPrice: defaultCost || 0 };
    onChange('accessories', updated);
  };

  const handleRemoveAccessory = (index: number) => {
    if (readOnly) return;
    const updated = accessories.filter((_, i) => i !== index);
    onChange('accessories', updated);
  };

  const renderStandardInput = (
    item: MaterialInstance | AccessoryInstance,
    updateFn: (field: keyof MaterialInstance | keyof AccessoryInstance, value: number | { size: string; standard: number }[]) => void
  ) => {
    if (item.standardMethod === 'موحد') {
      return (
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unifiedStandard || ''}
          onChange={(e) => { const v = parseFloat(e.target.value); updateFn('unifiedStandard', isNaN(v) ? 0 : v); }}
          disabled={readOnly}
          className={`w-full px-2 py-1 border rounded text-sm ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
          placeholder="المعيار"
        />
      );
    }

    return (
      <div className="space-y-1">
        {sizes.map(size => {
          const std = item.sizeStandards?.find(s => s.size === size.size)?.standard || 0;
          return (
            <div key={size.size} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-semibold text-slate-600">{size.size}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={std || ''}
                onChange={(e) => {
                  const newStandards = [...(item.sizeStandards || [])];
                  const existingIdx = newStandards.findIndex(s => s.size === size.size);
                  if (existingIdx >= 0) {
                    const v = parseFloat(e.target.value); newStandards[existingIdx] = { ...newStandards[existingIdx], standard: isNaN(v) ? 0 : v };
                  } else {
                    const v = parseFloat(e.target.value); newStandards.push({ size: size.size, standard: isNaN(v) ? 0 : v });
                  }
                  updateFn('sizeStandards', newStandards);
                }}
                disabled={readOnly}
                className={`w-16 px-1.5 py-0.5 border rounded text-xs ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
              />
            </div>
          );
        })}
      </div>
    );
  };


  let totalOrderQty = 0;
  sizes.forEach(s => {
    s.variants.forEach(v => totalOrderQty += (v.quantity || 0));
  });

  const renderReadOnlyMaterials = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">جدول الخامات</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-bold border-b">نوع الخام</th>
              <th className="px-4 py-3 font-bold border-b">اسم الخام</th>
              <th className="px-4 py-3 font-bold border-b text-center">الوحدة</th>
              <th className="px-4 py-3 font-bold border-b text-center">سعر الوحدة</th>
              <th className="px-4 py-3 font-bold border-b text-center">الوزن المعياري / قطعة</th>
              <th className="px-4 py-3 font-bold border-b text-center">المطلوب</th>
              <th className="px-4 py-3 font-bold border-b text-center">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map(mat => {
              let totalReq = 0;
              let stdDisplay = "";
              if (mat.standardMethod === 'موحد') {
                totalReq = totalOrderQty * (mat.unifiedStandard || 0);
                stdDisplay = (mat.unifiedStandard || 0).toString();
              } else {
                stdDisplay = "حسب المقاس";
                sizes.forEach(s => {
                  let sizeQty = 0;
                  s.variants.forEach(v => sizeQty += (v.quantity || 0));
                  const sizeStd = mat.sizeStandards?.find(st => st.size === s.size)?.standard || 0;
                  totalReq += sizeQty * sizeStd;
                });
              }
              const totalPrice = totalReq * (mat.standardPrice || 0);
              
              return (
                <tr key={mat.id}>
                  <td className="px-4 py-3 text-slate-600">{mat.type || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{mat.name || '—'}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{mat.unit || '—'}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">{mat.standardPrice ? Number(mat.standardPrice).toFixed(2) : '—'}</td>
                  <td className="px-4 py-3 text-center text-indigo-700">{stdDisplay}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-700">{Number(totalReq).toFixed(3)}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">{totalPrice > 0 ? Number(totalPrice).toFixed(2) : '—'}</td>
                </tr>
              );
            })}
            {materials.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">لا توجد خامات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReadOnlyAccessories = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">جدول الإكسسوارات</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-bold border-b">الإكسسوار</th>
              <th className="px-4 py-3 font-bold border-b text-center">الوحدة</th>
              <th className="px-4 py-3 font-bold border-b text-center">المطلوب / قطعة</th>
              <th className="px-4 py-3 font-bold border-b text-center">المطلوب للأمر</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accessories.map(acc => {
              let totalReq = 0;
              let stdDisplay = "";
              if (acc.standardMethod === 'موحد') {
                totalReq = totalOrderQty * (acc.unifiedStandard || 0);
                stdDisplay = (acc.unifiedStandard || 0).toString();
              } else {
                stdDisplay = "حسب المقاس";
                sizes.forEach(s => {
                  let sizeQty = 0;
                  s.variants.forEach(v => sizeQty += (v.quantity || 0));
                  const sizeStd = acc.sizeStandards?.find(st => st.size === s.size)?.standard || 0;
                  totalReq += sizeQty * sizeStd;
                });
              }
              
              return (
                <tr key={acc.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{acc.name || '—'}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{acc.unit || '—'}</td>
                  <td className="px-4 py-3 text-center text-indigo-700">{stdDisplay}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-700">{Number(totalReq).toFixed(3)}</td>
                </tr>
              );
            })}
            {accessories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">لا توجد إكسسوارات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (readOnly) {
    return (
      <div className="space-y-6">
        {renderReadOnlyMaterials()}
        {renderReadOnlyAccessories()}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Materials Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              🧵
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">خامات الأقمشة (BOM)</h3>
              <p className="text-xs text-slate-400">تحديد نوع القماش، وحدة القياس، ومعيار استهلاك القطعة</p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddMaterial}
              className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              إضافة قماش / خامة
            </button>
          )}
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-semibold w-1/4">الخامة</th>
                <th className="pb-2 font-semibold">النوع</th>
                <th className="pb-2 font-semibold w-20">الوحدة</th>
                <th className="pb-2 font-semibold w-32">طريقة المعيار</th>
                <th className="pb-2 font-semibold w-32">المعيار</th>
                <th className="pb-2 font-semibold w-24">السعر</th>
                {!readOnly && <th className="pb-2 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((mat, idx) => (
                <tr key={mat.id} className="text-sm">
                  <td className="py-2 pr-1">
                    
                    <select
                      value={mat.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = availableFabrics.find(f => f.name === val);
                        if (found) {
                          handleSelectMaterial(idx, val, found.unit, found.defaultCost || 0);
                        } else {
                          handleUpdateMaterial(idx, 'name', val);
                        }
                      }}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    >
                      <option value="">أدخل اسم الخامة / بدون</option>
                      {availableFabrics.map(f => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>

                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={mat.type}
                      onChange={(e) => handleUpdateMaterial(idx, 'type', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <select
                      value={mat.unit}
                      onChange={(e) => handleUpdateMaterial(idx, 'unit', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    >
                      <option value="كجم">كجم</option>
                      <option value="متر">متر</option>
                      <option value="قطعة">قطعة</option>
                    </select>
                  </td>
                  <td className="py-2 px-1">
                    <select
                      value={mat.standardMethod}
                      onChange={(e) => handleUpdateMaterial(idx, 'standardMethod', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    >
                      <option value="موحد">موحد</option>
                      <option value="حسب المقاس">حسب المقاس</option>
                    </select>
                  </td>
                  <td className="py-2 px-1 align-top">
                    {renderStandardInput(mat, (field, value) => handleUpdateMaterial(idx, field, value))}
                  </td>
                  <td className="py-2 px-1 align-top">
                    <input
                      type="number"
                      min="0"
                      value={mat.standardPrice || ''}
                      onChange={(e) => { const v = parseFloat(e.target.value); handleUpdateMaterial(idx, 'standardPrice', isNaN(v) ? 0 : v); }}
                      disabled={readOnly}
                      placeholder="غير محدد"
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    />
                  </td>
                  {!readOnly && (
                    <td className="py-2 pl-1 text-center align-top pt-3">
                      <button
                        onClick={() => handleRemoveMaterial(idx)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? 6 : 7} className="py-6 text-center text-slate-500 text-sm">
                    لا توجد خامات مسجلة في هذا الأمر.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accessories Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
              🔘
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">مستلزمات وإكسسوارات الإنتاج (BOM)</h3>
              <p className="text-xs text-slate-400">أزرار، سست، خيوط، بطانات، وتيكت الموديل</p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddAccessory}
              className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/70 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              إضافة إكسسوار
            </button>
          )}
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-semibold w-1/4">الإكسسوار</th>
                <th className="pb-2 font-semibold">النوع</th>
                <th className="pb-2 font-semibold w-20">الوحدة</th>
                <th className="pb-2 font-semibold w-32">طريقة المعيار</th>
                <th className="pb-2 font-semibold w-32">المعيار</th>
                <th className="pb-2 font-semibold w-24">السعر</th>
                {!readOnly && <th className="pb-2 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accessories.map((acc, idx) => (
                <tr key={acc.id} className="text-sm">
                  <td className="py-2 pr-1">
                    
                    <select
                      value={acc.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = availableAccessories.find(a => a.name === val);
                        if (found) {
                          handleSelectAccessory(idx, val, found.unit, found.defaultCost || 0);
                        } else {
                          handleUpdateAccessory(idx, 'name', val);
                        }
                      }}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    >
                      <option value="">أدخل اسم الإكسسوار / بدون</option>
                      {availableAccessories.map(a => (
                        <option key={a.id} value={a.name}>{a.name}</option>
                      ))}
                    </select>

                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={acc.type}
                      onChange={(e) => handleUpdateAccessory(idx, 'type', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <select
                      value={acc.unit}
                      onChange={(e) => handleUpdateAccessory(idx, 'unit', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    >
                      <option value="قطعة">قطعة</option>
                      <option value="متر">متر</option>
                      <option value="كجم">كجم</option>
                    </select>
                  </td>
                  <td className="py-2 px-1">
                    <select
                      value={acc.standardMethod}
                      onChange={(e) => handleUpdateAccessory(idx, 'standardMethod', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    >
                      <option value="موحد">موحد</option>
                      <option value="حسب المقاس">حسب المقاس</option>
                    </select>
                  </td>
                  <td className="py-2 px-1 align-top">
                    {renderStandardInput(acc, (field, value) => handleUpdateAccessory(idx, field, value))}
                  </td>
                  <td className="py-2 px-1 align-top">
                    <input
                      type="number"
                      min="0"
                      value={acc.standardPrice || ''}
                      onChange={(e) => { const v = parseFloat(e.target.value); handleUpdateAccessory(idx, 'standardPrice', isNaN(v) ? 0 : v); }}
                      disabled={readOnly}
                      placeholder="غير محدد"
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    />
                  </td>
                  {!readOnly && (
                    <td className="py-2 pl-1 text-center align-top pt-3">
                      <button
                        onClick={() => handleRemoveAccessory(idx)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {accessories.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? 6 : 7} className="py-6 text-center text-slate-500 text-sm">
                    لا توجد إكسسوارات مسجلة في هذا الأمر.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
