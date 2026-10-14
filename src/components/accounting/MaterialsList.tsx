import React, { useState, useEffect } from 'react';
import { MaterialItem } from '../../types';
import { getMaterials, saveMaterials } from '../../lib/accountingStorage';
import { Plus, Edit, Trash2, Search, PackageSearch, Layers, Tag, MapPin } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { UniversalMasterEntityModal } from './UniversalMasterEntityModal';

interface MaterialsListProps {
  autoOpenAddModal?: boolean;
}

export function MaterialsList({ autoOpenAddModal = false }: MaterialsListProps = {}) {
  const { notifySuccess, notifyInfo } = useNotification();
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);

  const loadData = () => {
    setItems(getMaterials());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('raw_materials_updated', handleUpdate);
    return () => window.removeEventListener('raw_materials_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (autoOpenAddModal) {
      setEditingItem(null);
      setIsModalOpen(true);
    }
  }, [autoOpenAddModal]);

  const handleDelete = (id: string) => {
    const itemToDelete = items.find(a => a.id === id);
    if (confirm(`هل أنت متأكد من حذف الصنف (${itemToDelete?.name || ''})؟`)) {
      const updated = items.filter(a => a.id !== id);
      setItems(updated);
      saveMaterials(updated);
      window.dispatchEvent(new CustomEvent('raw_materials_updated'));
      notifyInfo(`تم حذف الخامة (${itemToDelete?.name || ''}) بنجاح`, "دليل الخامات");
    }
  };

  const filtered = items.filter(a => {
    const matchesSearch = 
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.subCategory || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.warehouseLocation || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const fabricsCount = items.filter(i => i.type === 'fabric').length;
  const accessoriesCount = items.filter(i => i.type === 'accessory').length;

  return (
    <div className="space-y-4">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold">إجمالي أصناف المخزن</span>
            <div className="text-xl font-black text-slate-800">{items.length}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <PackageSearch className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 font-bold">أقمشة وغزول تريكو</span>
            <div className="text-xl font-black text-emerald-900">{fabricsCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-600 font-bold">إكسسوارات ومستلزمات تشغيل</span>
            <div className="text-xl font-black text-blue-900">{accessoriesCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث باسم الصنف، الكود، التصنيف الفرعي، الموقع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white text-xs sm:text-sm"
            />
          </div>
          <select 
            value={typeFilter} 
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm font-medium"
          >
            <option value="all">جميع أنواع الأصناف</option>
            <option value="fabric">أقمشة وغزول</option>
            <option value="accessory">إكسسوارات وسوست</option>
            <option value="packaging">تعبئة وتغليف</option>
            <option value="operating_supply">مستلزمات تشغيل</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة صنف / خامة</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th className="p-3">الكود</th>
              <th className="p-3">اسم الصنف والتصنيف</th>
              <th className="p-3">النوع</th>
              <th className="p-3">الوحدة</th>
              <th className="p-3">التكلفة المعيارية</th>
              <th className="p-3">حساب المخزون (الشجرة)</th>
              <th className="p-3">موقع التخزين والحد الأدنى</th>
              <th className="p-3">الحالة</th>
              <th className="p-3 w-24 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3 font-mono font-bold text-slate-700">
                  <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {item.code || item.id.slice(-6)}
                  </span>
                </td>
                <td className="p-3 font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    <PackageSearch className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.subCategory && (
                        <div className="text-[11px] text-slate-500">{item.subCategory}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    item.type === 'fabric' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : item.type === 'accessory'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {item.type === 'fabric' ? 'قماش' : item.type === 'accessory' ? 'إكسسوار' : item.type === 'packaging' ? 'تغليف' : 'تشغيل'}
                  </span>
                </td>
                <td className="p-3 font-bold text-slate-700">{item.unit}</td>
                <td className="p-3 font-bold text-slate-900">
                  {Number(item.defaultCost || 0).toLocaleString('ar-EG')} ج.م
                </td>
                <td className="p-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.linkedAccountId || (item.type === 'fabric' ? '12411' : '12412')}
                  </span>
                </td>
                <td className="p-3 text-slate-600 text-[11px]">
                  <div className="space-y-0.5">
                    {item.warehouseLocation && (
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.warehouseLocation}</span>
                      </div>
                    )}
                    {item.minStockAlert !== undefined && (
                      <div className="text-[10px] text-slate-500">
                        حد أدنى: {item.minStockAlert} {item.unit}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {item.isActive !== false ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-center gap-1">
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }} 
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="تعديل كافة مواصفات وبيانات الخامة"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(item.id)} 
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                  لا توجد أصناف مسجلة مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Universal Master Entity Modal */}
      {isModalOpen && (
        <UniversalMasterEntityModal
          initialType="material"
          editingItem={editingItem}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingItem(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
