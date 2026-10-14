import React, { useState, useEffect } from 'react';
import { X, Search, Copy } from 'lucide-react';
import { ProductionOrder } from '../types';
import { getOrders } from '../lib/storage';

interface CopyBomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (materials: any[], accessories: any[]) => void;
  currentOrderId?: string;
}

export function CopyBomModal({ isOpen, onClose, onSelect, currentOrderId }: CopyBomModalProps) {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      if (isOpen) {
      // exclude current order
      const result = await getOrders();
      const allOrders = result.filter(o => o.id !== currentOrderId);
      // Sort by order date descending
      allOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      setOrders(allOrders);
      setSearch('');
    }
    };
    load();
  }, [isOpen, currentOrderId]);

  if (!isOpen) return null;

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
    (o.styleName && o.styleName.toLowerCase().includes(search.toLowerCase())) ||
    (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">نسخ الخامات والإكسسوارات من أمر سابق</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث برقم الأمر، اسم القصة، أو اسم العميل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredOrders.length === 0 ? (
            <p className="text-center text-slate-500 py-8">لا يوجد أوامر إنتاج مطابقة</p>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <div key={order.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      {order.orderNumber}
                      {order.styleName && <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{order.styleName}</span>}
                    </h3>
                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                      <span>العميل: {order.customerName || '-'}</span>
                      <span>التاريخ: {new Date(order.orderDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 flex gap-3">
                      <span>الخامات: {order.materials?.length || 0}</span>
                      <span>الإكسسوارات: {order.accessories?.length || 0}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelect(order.materials || [], order.accessories || [])}
                    disabled={(!order.materials || order.materials.length === 0) && (!order.accessories || order.accessories.length === 0)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-4 h-4" />
                    نسخ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
