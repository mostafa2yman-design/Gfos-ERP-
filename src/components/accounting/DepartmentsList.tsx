import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, MapPin, UserCheck } from 'lucide-react';
import { Department } from '../../types';
import { getDepartments, saveDepartments } from '../../lib/accountingStorage';
import { UniversalMasterEntityModal } from './UniversalMasterEntityModal';

export function DepartmentsList() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | null>(null);

  const loadData = () => {
    setDepartments(getDepartments());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('departments_updated', handleUpdate);
    return () => window.removeEventListener('departments_updated', handleUpdate);
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف قسم (${name})؟`)) {
      const updated = departments.filter(d => d.id !== id);
      saveDepartments(updated);
      setDepartments(updated);
      window.dispatchEvent(new CustomEvent('departments_updated'));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-800">أقسام المصنع ومراكز التكلفة</h3>
            <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-200">
              {departments.length} أقسام
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            تأسيس مراكز التكلفة الصناعية وربطها بحسابات شجرة التكاليف العامة والمباشرة
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة قسم / مركز تكلفة</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <th className="p-3">الكود</th>
              <th className="p-3">اسم القسم</th>
              <th className="p-3">النوع</th>
              <th className="p-3">كود مركز التكلفة</th>
              <th className="p-3">مدير القسم / المسؤول</th>
              <th className="p-3">الموقع / العنبر</th>
              <th className="p-3">حساب الشجرة المرتبط</th>
              <th className="p-3 text-center w-24">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map(dept => (
              <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3 font-mono font-bold text-slate-700">
                  <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {dept.code || dept.id.slice(-6)}
                  </span>
                </td>
                <td className="p-3 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">{dept.name}</div>
                      {dept.description && (
                        <div className="text-[11px] text-slate-500">{dept.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    dept.type === 'production' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : dept.type === 'service'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                  }`}>
                    {dept.type === 'production' ? 'إنتاجي مباشر' : dept.type === 'service' ? 'خدمي مساعد' : 'إداري'}
                  </span>
                </td>
                <td className="p-3 font-mono font-bold text-teal-700">
                  {dept.costCenterCode || 'CC-101'}
                </td>
                <td className="p-3 text-slate-600">
                  {dept.managerName ? (
                    <div className="flex items-center gap-1 font-medium text-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dept.managerName}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="p-3 text-slate-600 text-[11px]">
                  {dept.location ? (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{dept.location}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="p-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {dept.linkedAccountId || '521'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(dept);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="تعديل بيانات القسم"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                  لا توجد أقسام مسجلة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Universal Master Entity Modal */}
      {isModalOpen && (
        <UniversalMasterEntityModal
          initialType="department"
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
