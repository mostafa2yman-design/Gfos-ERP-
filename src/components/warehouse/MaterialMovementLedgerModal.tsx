import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  Package,
  Building,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { MaterialStockItem, RawMaterialMovement } from '../../lib/rawMaterialsInventory';

interface MaterialMovementLedgerModalProps {
  material: MaterialStockItem;
  onClose: () => void;
  onOpenAdjustment: (material: MaterialStockItem) => void;
  onRefresh?: () => void;
}

export function MaterialMovementLedgerModal({
  material,
  onClose,
  onOpenAdjustment,
  onRefresh
}: MaterialMovementLedgerModalProps) {
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter movements
  const filteredMovements = useMemo(() => {
    return material.movements.filter(mov => {
      // Type filter
      if (filterType === 'in' && mov.type !== 'in') return false;
      if (filterType === 'out' && mov.type !== 'out') return false;
      if (filterType === 'adjustment' && mov.source !== 'manual_adjustment' && mov.source !== 'initial_stock') return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesDoc = mov.documentNumber?.toLowerCase().includes(term);
        const matchesPartner = mov.partnerName?.toLowerCase().includes(term);
        const matchesNotes = mov.notes?.toLowerCase().includes(term);
        const matchesDate = mov.date?.includes(term);
        return matchesDoc || matchesPartner || matchesNotes || matchesDate;
      }

      return true;
    });
  }, [material.movements, filterType, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-xl ${material.type === 'fabric' ? 'bg-indigo-600/30 border border-indigo-400/40 text-indigo-200' : 'bg-amber-600/30 border border-amber-400/40 text-amber-200'}`}>
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white/10 text-indigo-200 border border-white/10">
                  {material.code}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  material.type === 'fabric' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {material.type === 'fabric' ? 'مخزن الأقمشة' : 'مخزن الإكسسوارات'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                كشف حركة الخامة: {material.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAdjustment(material)}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="تسجيل تسوية مخزنية أو رصيد افتتاحي"
            >
              <Plus className="w-4 h-4" />
              <span>إذن تسوية / رصيد</span>
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              title="طباعة كشف الحركة"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick KPI Bar for this Material */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Current Stock */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
              <span>رصيد المخزن الحالي</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                material.status === 'in_stock' ? 'bg-emerald-100 text-emerald-800' :
                material.status === 'low_stock' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {material.status === 'in_stock' ? 'متوفر' : material.status === 'low_stock' ? 'منخفض' : 'نفد الرصيد'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {material.currentStock.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-bold text-slate-600">{material.unit}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>القيمة الإجمالية:</span>
              <span className="font-bold text-indigo-700">{material.totalStockValue.toLocaleString('ar-EG')} ج.م</span>
            </div>
          </div>

          {/* Average Cost */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-500 font-bold mb-1">متوسط سعر التكلفة</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-indigo-900">
                {material.averageCost.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-bold text-slate-600">ج.م / {material.unit}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              التكلفة المعيارية: {material.defaultCost.toLocaleString('ar-EG')} ج.م
            </div>
          </div>

          {/* Total Inbound */}
          <div className="bg-white p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mb-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>إجمالي الوارد (مشتريات)</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-800">
                +{material.totalInQuantity.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-bold text-emerald-700">{material.unit}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              بقيمة: {material.totalInValue.toLocaleString('ar-EG')} ج.م
            </div>
          </div>

          {/* Total Outbound */}
          <div className="bg-white p-3.5 rounded-xl border border-rose-100 bg-rose-50/20 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              <span>إجمالي المنصرف (تشغيل)</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-800">
                -{material.totalOutQuantity.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-bold text-rose-700">{material.unit}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              بقيمة: {material.totalOutValue.toLocaleString('ar-EG')} ج.م
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Movement Type Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              جميع الحركات ({material.movements.length})
            </button>
            <button
              onClick={() => setFilterType('in')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filterType === 'in'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3" />
              <span>الوارد فقط</span>
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filterType === 'out'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>المنصرف فقط</span>
            </button>
            <button
              onClick={() => setFilterType('adjustment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'adjustment'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              التسويات
            </button>
          </div>

          {/* Search in Transactions */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في الحركات والمراجع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredMovements.length === 0 ? (
            <div className="text-center py-14 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">لا توجد حركات مسجلة لهذه الخامة بالمعايير المحددة</p>
              <p className="text-xs text-slate-400 mt-1">
                يمكنك تسجيل فاتورة شراء لتوريد كميات أو إضافة رصيد افتتاحي/تسوية مخزنية
              </p>
              <button
                onClick={() => onOpenAdjustment(material)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة رصيد افتتاحي للخامة</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3">التاريخ</th>
                    <th className="py-3 px-3">نوع الحركة</th>
                    <th className="py-3 px-3">رقم المستند / المرجع</th>
                    <th className="py-3 px-3">الطرف المقابل / البيان</th>
                    <th className="py-3 px-3 text-center">الكمية</th>
                    <th className="py-3 px-3 text-center">سعر الوحدة</th>
                    <th className="py-3 px-3 text-center">القيمة الإجمالية</th>
                    <th className="py-3 px-3 text-center bg-indigo-50/70 text-indigo-900">
                      الرصيد بعد الحركة
                    </th>
                    <th className="py-3 px-3">ملاحظات / المسؤول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium">
                  {filteredMovements.map((mov) => {
                    const isIn = mov.type === 'in';
                    const isAdj = mov.source === 'manual_adjustment' || mov.source === 'initial_stock';

                    return (
                      <tr 
                        key={mov.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isIn ? 'bg-emerald-50/15' : 'bg-rose-50/10'
                        }`}
                      >
                        {/* Date */}
                        <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-mono">
                          {mov.date}
                        </td>

                        {/* Movement Type Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isAdj ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <RefreshCw className="w-3 h-3" />
                              <span>{mov.source === 'initial_stock' ? 'رصيد افتتاحي' : 'تسوية مخزنية'}</span>
                            </span>
                          ) : isIn ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>وارد (توريد شراء)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>منصرف (تشغيل)</span>
                            </span>
                          )}
                        </td>

                        {/* Document Number */}
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap font-mono">
                          {mov.documentNumber}
                        </td>

                        {/* Partner / Reason */}
                        <td className="py-3 px-3 text-slate-700 max-w-xs truncate" title={mov.partnerName}>
                          {mov.partnerName}
                        </td>

                        {/* Quantity */}
                        <td className={`py-3 px-3 text-center whitespace-nowrap font-bold font-mono ${
                          isIn ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {isIn ? '+' : '-'}{mov.quantity.toLocaleString('ar-EG')} {mov.unit}
                        </td>

                        {/* Unit Price */}
                        <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600 font-mono">
                          {mov.unitPrice.toLocaleString('ar-EG')} ج.م
                        </td>

                        {/* Total Price */}
                        <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-slate-900 font-mono">
                          {mov.totalPrice.toLocaleString('ar-EG')} ج.م
                        </td>

                        {/* Running Balance After */}
                        <td className="py-3 px-3 text-center whitespace-nowrap font-black font-mono bg-indigo-50/40 text-indigo-950">
                          {mov.balanceAfter !== undefined ? (
                            <span>{mov.balanceAfter.toLocaleString('ar-EG')} {mov.unit}</span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Notes & Operator */}
                        <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs">
                          <div>{mov.notes || '—'}</div>
                          {mov.operator && (
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                              بواسطة: {mov.operator}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            عدد الحركات المعروضة: <span className="font-bold text-slate-800">{filteredMovements.length}</span> من أصل <span className="font-bold text-slate-800">{material.movements.length}</span> حركة
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
