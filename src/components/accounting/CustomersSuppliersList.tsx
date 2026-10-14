import React, { useState, useEffect } from 'react';
import { CustomerSupplier } from '../../types';
import { getCustomersSuppliers, saveCustomersSuppliers } from '../../lib/accountingStorage';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Users, 
  Phone, 
  Building, 
  CreditCard, 
  MapPin, 
  FileText,
  CheckCircle2,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { UniversalMasterEntityModal, MasterEntityType } from './UniversalMasterEntityModal';

interface CustomersSuppliersListProps {
  autoOpenAddModal?: boolean;
}

export function CustomersSuppliersList({ autoOpenAddModal = false }: CustomersSuppliersListProps = {}) {
  const [items, setItems] = useState<CustomerSupplier[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier' | 'both'>('all');
  
  // Universal Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: MasterEntityType;
    item?: CustomerSupplier | null;
  }>({
    isOpen: false,
    type: 'customer',
    item: null
  });

  const loadData = () => {
    setItems(getCustomersSuppliers());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('customers_updated', handleUpdate);
    return () => window.removeEventListener('customers_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (autoOpenAddModal) {
      setModalState({
        isOpen: true,
        type: 'customer',
        item: null
      });
    }
  }, [autoOpenAddModal]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف (${name})؟`)) {
      const updated = items.filter(a => a.id !== id);
      setItems(updated);
      saveCustomersSuppliers(updated);
      window.dispatchEvent(new CustomEvent('customers_updated'));
    }
  };

  const filtered = items.filter(a => {
    const matchesSearch = 
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.phone || '').includes(search) ||
      (a.taxId || '').includes(search);
    const matchesType = filterType === 'all' || a.type === filterType;
    return matchesSearch && matchesType;
  });

  const customersCount = items.filter(i => i.type === 'customer' || i.type === 'both').length;
  const suppliersCount = items.filter(i => i.type === 'supplier' || i.type === 'both').length;

  return (
    <div className="space-y-4">
      {/* Top Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold">إجمالي الأطراف المسجلة</span>
            <div className="text-xl font-black text-slate-800">{items.length}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-600 font-bold">عملاء المبيعات</span>
            <div className="text-xl font-black text-blue-900">{customersCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-600 font-bold">موردي الخامات والتوريدات</span>
            <div className="text-xl font-black text-amber-900">{suppliersCount}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث بالاسم، الكود، الهاتف، البطاقة الضريبية..."
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
            <option value="all">جميع الأنواع</option>
            <option value="customer">عملاء فقط</option>
            <option value="supplier">موردين فقط</option>
            <option value="both">عميل ومورد معاً</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalState({ isOpen: true, type: 'customer', item: null })}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold text-xs shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة عميل</span>
          </button>

          <button
            type="button"
            onClick={() => setModalState({ isOpen: true, type: 'supplier', item: null })}
            className="flex items-center gap-1.5 bg-amber-600 text-white px-3.5 py-2 rounded-lg hover:bg-amber-700 transition-colors font-bold text-xs shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة مورد</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th className="p-3">الكود</th>
              <th className="p-3">الاسم والتصنيف</th>
              <th className="p-3">النوع</th>
              <th className="p-3">الاتصال والتواصل</th>
              <th className="p-3">العنوان / المدينة</th>
              <th className="p-3">حساب الشجرة المرتبط</th>
              <th className="p-3">الحد الائتماني وشروط السداد</th>
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
                    {item.type === 'supplier' ? (
                      <Building className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <Users className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.category && (
                        <div className="text-[11px] text-slate-500">{item.category}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    item.type === 'customer' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : item.type === 'supplier'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {item.type === 'customer' ? 'عميل' : item.type === 'supplier' ? 'مورد' : 'عميل ومورد'}
                  </span>
                </td>
                <td className="p-3 text-slate-600">
                  <div className="space-y-0.5">
                    {item.phone && (
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span dir="ltr">{item.phone}</span>
                      </div>
                    )}
                    {item.contactPerson && (
                      <div className="text-[11px] text-slate-500 font-medium">
                        المسؤول: {item.contactPerson}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3 text-slate-600 text-[11px]">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.city || ''} {item.address ? `- ${item.address}` : ''}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.linkedAccountCode || (item.type === 'supplier' ? '2111' : '1221')}
                  </span>
                </td>
                <td className="p-3 text-slate-700">
                  <div className="space-y-0.5">
                    {item.creditLimit !== undefined && (
                      <div className="font-bold text-slate-900">
                        {Number(item.creditLimit).toLocaleString('ar-EG')} ج.م
                      </div>
                    )}
                    {item.paymentTerms && (
                      <div className="text-[10px] text-slate-500">
                        {item.paymentTerms}
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
                      onClick={() => setModalState({ 
                        isOpen: true, 
                        type: item.type === 'supplier' ? 'supplier' : 'customer', 
                        item 
                      })} 
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="تعديل كافة بيانات الطرف"
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
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                  لا توجد سجلات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Universal Master Entity Modal */}
      {modalState.isOpen && (
        <UniversalMasterEntityModal
          initialType={modalState.type}
          editingItem={modalState.item}
          onClose={() => setModalState(prev => ({ ...prev, isOpen: false, item: null }))}
          onSuccess={() => {
            setModalState(prev => ({ ...prev, isOpen: false, item: null }));
            loadData();
          }}
        />
      )}
    </div>
  );
}
