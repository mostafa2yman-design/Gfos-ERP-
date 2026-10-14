import React, { useState, useEffect } from 'react';
import { OperationalGroup } from '../../types';
import { getOperationalGroups, saveOperationalGroups, getDepartments } from '../../lib/accountingStorage';
import { Plus, Edit, Trash2, Search, Factory, Phone, Building2, Gauge } from 'lucide-react';
import { UniversalMasterEntityModal } from './UniversalMasterEntityModal';

export function OperationalGroupsList() {
  const [items, setItems] = useState<OperationalGroup[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'internal' | 'external'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OperationalGroup | null>(null);

  const loadData = () => {
    setItems(getOperationalGroups());
    setDepartments(getDepartments());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('groups_updated', handleUpdate);
    return () => window.removeEventListener('groups_updated', handleUpdate);
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف مجموعة التشغيل (${name})؟`)) {
      const updated = items.filter(a => a.id !== id);
      setItems(updated);
      saveOperationalGroups(updated);
      window.dispatchEvent(new CustomEvent('groups_updated'));
    }
  };

  const filtered = items.filter(a => {
    const matchesSearch = 
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.specialty || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.contactPerson || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || a.type === filterType;
    return matchesSearch && matchesType;
  });

  const internalCount = items.filter(i => i.type === 'internal').length;
  const externalCount = items.filter(i => i.type === 'external').length;

  return (
    <div className="space-y-4">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold">إجمالي خطوط التشغيل</span>
            <div className="text-xl font-black text-slate-800">{items.length}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Factory className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-indigo-600 font-bold">خطوط ومجموعات داخلية</span>
            <div className="text-xl font-black text-indigo-900">{internalCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-600 font-bold">ورش ومقاولين تشغيل خارجي</span>
            <div className="text-xl font-black text-amber-900">{externalCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Factory className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Action */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث باسم المجموعة، الكود، التخصص، المشرف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white text-xs sm:text-sm"
            />
          </div>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm font-medium"
          >
            <option value="all">جميع المجموعات</option>
            <option value="internal">خطوط داخلية</option>
            <option value="external">ورش خارجية (مقاولين)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة مجموعة تشغيل</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th className="p-3">الكود</th>
              <th className="p-3">اسم الخط والمجموعة</th>
              <th className="p-3">النوع</th>
              <th className="p-3">التخصص الإنتاجي</th>
              <th className="p-3">مشرف الخط / الهاتف</th>
              <th className="p-3">الماكينات والطاقة اليومية</th>
              <th className="p-3">حساب الشجرة المرتبط</th>
              <th className="p-3">الحالة</th>
              <th className="p-3 w-24 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(item => {
              const dept = departments.find(d => d.id === item.departmentId);

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-700">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.code || item.id.slice(-6)}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-purple-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {dept && (
                          <div className="text-[11px] text-slate-500">قسم: {dept.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.type === 'internal' 
                        ? 'bg-purple-50 text-purple-800 border border-purple-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {item.type === 'internal' ? 'خط داخلي' : 'ورشة خارجية'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-medium">{item.specialty}</td>
                  <td className="p-3 text-slate-600">
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-800">{item.contactPerson || '-'}</div>
                      {item.phone && (
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span dir="ltr">{item.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-slate-700">
                    <div className="space-y-0.5">
                      {item.machinesCount !== undefined && (
                        <div className="font-bold text-slate-900">
                          {item.machinesCount} ماكينات
                        </div>
                      )}
                      {item.dailyCapacity !== undefined && (
                        <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-indigo-500" />
                          <span>{item.dailyCapacity} قطعة/يوم</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {item.linkedAccountId || '5122'}
                    </span>
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
                        title="تعديل كافة بيانات خط التشغيل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)} 
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                  لا توجد مجموعات مسجلة مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Universal Master Entity Modal */}
      {isModalOpen && (
        <UniversalMasterEntityModal
          initialType="group"
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
