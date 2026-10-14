import React, { useState, useEffect } from 'react';
import { LaborProfile, OperationalGroup, Department } from '../../types';
import { getLabor, saveLabor, getOperationalGroups, getDepartments } from '../../lib/accountingStorage';
import { Plus, Edit, Trash2, Search, HardHat, Phone, Building2, Users, Coins } from 'lucide-react';
import { UniversalMasterEntityModal } from './UniversalMasterEntityModal';

export function LaborList() {
  const [items, setItems] = useState<LaborProfile[]>([]);
  const [groups, setGroups] = useState<OperationalGroup[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LaborProfile | null>(null);

  const loadData = () => {
    setItems(getLabor());
    setGroups(getOperationalGroups());
    setDepartments(getDepartments());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('labor_updated', handleUpdate);
    return () => window.removeEventListener('labor_updated', handleUpdate);
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف العامل (${name})؟`)) {
      const updated = items.filter(a => a.id !== id);
      setItems(updated);
      saveLabor(updated);
      window.dispatchEvent(new CustomEvent('labor_updated'));
    }
  };

  const filtered = items.filter(a => {
    return (
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.role || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.phone || '').includes(search)
    );
  });

  const activeCount = items.filter(i => i.isActive !== false).length;
  const pieceWorkersCount = items.filter(i => i.salaryType === 'بالقطعة').length;

  return (
    <div className="space-y-4">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold">إجمالي قوة العمل</span>
            <div className="text-xl font-black text-slate-800">{items.length}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <HardHat className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 font-bold">العمالة النشطة</span>
            <div className="text-xl font-black text-emerald-900">{activeCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-600 font-bold">عمال بالقطعة والإنتاجية</span>
            <div className="text-xl font-black text-amber-900">{pieceWorkersCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="بحث باسم العامل، الكود، الوظيفة، الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none bg-white text-xs sm:text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة عامل / فني جديد</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th className="p-3">الكود</th>
              <th className="p-3">الاسم والمهارة</th>
              <th className="p-3">الوظيفة / الدور</th>
              <th className="p-3">القسم والخط</th>
              <th className="p-3">الهاتف</th>
              <th className="p-3">نظام الأجر</th>
              <th className="p-3">الأجر / سعر القطعة</th>
              <th className="p-3">حساب الأجور (الشجرة)</th>
              <th className="p-3">الحالة</th>
              <th className="p-3 w-24 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(item => {
              const group = groups.find(g => g.id === item.operationalGroupId);
              const dept = departments.find(d => d.id === item.departmentId || d.name === item.role);

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-700">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.code || item.id.slice(-6)}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.skillLevel && (
                          <div className="text-[11px] text-slate-500">{item.skillLevel}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-700 font-medium">{item.role}</td>
                  <td className="p-3 text-slate-600">
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-800">{dept?.name || item.departmentId || '-'}</div>
                      {group && (
                        <div className="text-[10px] text-indigo-600 font-medium">خط: {group.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 font-mono">
                    {item.phone ? (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span dir="ltr">{item.phone}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.salaryType === 'بالقطعة' 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      {item.salaryType || 'يومية'} ({item.salaryPeriod || 'يومي'})
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    {item.salaryType === 'بالقطعة' && item.pieceRate ? (
                      <span>{Number(item.pieceRate).toLocaleString('ar-EG')} ج.م / قطعة</span>
                    ) : (
                      <span>{Number(item.baseSalary || 0).toLocaleString('ar-EG')} ج.م</span>
                    )}
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
                        title="تعديل كافة بيانات وملف العامل"
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
                <td colSpan={10} className="p-8 text-center text-slate-500 font-medium">
                  لا توجد سجلات عمالة مسجلة مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Universal Master Entity Modal */}
      {isModalOpen && (
        <UniversalMasterEntityModal
          initialType="labor"
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
