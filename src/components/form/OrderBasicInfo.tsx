import React, { useState, useEffect } from 'react';
import { getCustomersSuppliers } from '../../lib/accountingStorage';
import { CustomerSupplier, CATEGORIES } from '../../types';
import {
  Calendar,
  Tag,
  User,
  Hash,
  ChevronDown,
  DollarSign,
  Scissors,
  Printer,
  Shirt,
  Sparkles,
  Flame,
  Package,
  Layers,
  FileText,
  Calculator,
  Info
} from 'lucide-react';

interface OrderBasicInfoProps {
  orderNumber: string;
  orderDate: string;
  styleName: string;
  category: string;
  customerName: string;
  standardCutCostPerPiece?: number;
  printEmbroideryStandardCost?: number;
  standardSewingCostPerPiece?: number;
  standardFinishingCostPerPiece?: number;
  standardIroningCostPerPiece?: number;
  sellingPrice?: number;
  cuttingInstructions?: string;
  sewingInstructions?: string;
  finishingInstructions?: string;
  ironingInstructions?: string;
  packingInstructions?: string;
  onChange: (field: string, value: string) => void;
  readOnly?: boolean;
}

export function OrderBasicInfo({
  orderNumber,
  orderDate,
  styleName,
  category,
  customerName,
  standardCutCostPerPiece,
  printEmbroideryStandardCost,
  standardSewingCostPerPiece,
  standardFinishingCostPerPiece,
  standardIroningCostPerPiece,
  sellingPrice,
  cuttingInstructions,
  sewingInstructions,
  finishingInstructions,
  ironingInstructions,
  packingInstructions,
  onChange,
  readOnly = false
}: OrderBasicInfoProps) {
  const [customers, setCustomers] = useState<CustomerSupplier[]>([]);

  useEffect(() => {
    const list = getCustomersSuppliers();
    setCustomers(list.filter(c => (c.type === 'customer' || c.type === 'both') && c.isActive));
  }, []);

  const totalStageCost = 
    (Number(standardCutCostPerPiece) || 0) +
    (Number(printEmbroideryStandardCost) || 0) +
    (Number(standardSewingCostPerPiece) || 0) +
    (Number(standardFinishingCostPerPiece) || 0) +
    (Number(standardIroningCostPerPiece) || 0);

  return (
    <div className="space-y-6">
      {/* 1. بيانات الموديل والطلب */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">بيانات الموديل والطلب</h3>
              <p className="text-xs text-slate-500">المعلومات الأساسية للتعريف بأمر الإنتاج والموديل والعميل</p>
            </div>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-md border border-indigo-100">
            الخطوة الأولى
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* رقم الأمر */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                رقم الأمر (تلقائي)
              </label>
              <div className="relative">
                <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={orderNumber}
                  disabled
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold cursor-not-allowed text-sm"
                />
              </div>
            </div>

            {/* تاريخ الأمر */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                تاريخ الإنشاء
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="date"
                  value={orderDate}
                  disabled
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-not-allowed text-sm"
                />
              </div>
            </div>

            {/* اسم القصة / الموديل */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>اسم القصة / الموديل {!readOnly && <span className="text-rose-500 font-bold">*</span>}</span>
                <span className="text-[11px] font-normal text-slate-400">مثال: سويت شيرت كابيشو</span>
              </label>
              <div className="relative">
                <Tag className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={styleName}
                  disabled={readOnly}
                  onChange={(e) => onChange('styleName', e.target.value)}
                  placeholder="أدخل اسم القصة أو الموديل..."
                  className={`w-full pr-10 pl-3 py-2.5 border rounded-lg text-sm transition-all font-medium ${
                    readOnly
                      ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs'
                  }`}
                />
              </div>
            </div>

            {/* نوع القصة */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نوع القصة (الفئة) {!readOnly && <span className="text-rose-500 font-bold">*</span>}
              </label>
              <div className="relative">
                <select
                  value={category}
                  disabled={readOnly}
                  onChange={(e) => onChange('category', e.target.value)}
                  className={`w-full pr-3 pl-9 py-2.5 border rounded-lg appearance-none text-sm transition-all font-medium ${
                    readOnly
                      ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs'
                  }`}
                >
                  <option value="" disabled>اختر فئة القصة...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* اسم العميل */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                العميل / وجهة التشغيل {!readOnly && <span className="text-rose-500 font-bold">*</span>}
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={customerName}
                  disabled={readOnly}
                  onChange={(e) => onChange('customerName', e.target.value)}
                  className={`w-full pr-10 pl-9 py-2.5 border rounded-lg appearance-none text-sm transition-all font-medium ${
                    readOnly
                      ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs'
                  }`}
                >
                  <option value="">اختر العميل أو المصنع...</option>
                  <option value="المصنع">تشغيل داخلي (المصنع)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* سعر البيع المستهدف للقطعة */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>سعر البيع المستهدف للقطعة</span>
                <span className="text-[11px] font-normal text-emerald-600">اختياري لحساب الربحية</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4" />
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={sellingPrice ?? ''}
                  disabled={readOnly}
                  onChange={(e) => onChange('sellingPrice', e.target.value)}
                  placeholder="0.00"
                  className={`w-full pr-10 pl-12 py-2.5 border rounded-lg text-sm font-bold transition-all ${
                    readOnly
                      ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-not-allowed'
                      : 'bg-emerald-50/40 text-emerald-900 border-emerald-300 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs'
                  }`}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700">
                  ج.م
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. التكاليف المعيارية لمراحل التشغيل (لكل قطعة) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold shadow-2xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">التكاليف المعيارية لمراحل التشغيل</h3>
              <p className="text-xs text-slate-500">تحديد التكلفة المعيارية التقديرية لكل مرحلة من مراحل التصنيع (للقطعة الواحدة)</p>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-xs text-indigo-700 font-medium">إجمالي تكلفة التشغيل المعيارية:</span>
            <span className="text-sm font-black text-indigo-900 font-mono">
              {totalStageCost.toFixed(2)} ج.م / قطعة
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* القص */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-2 mb-2 text-slate-700">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <label className="text-xs font-bold">تكلفة القص</label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={standardCutCostPerPiece ?? ''}
                  disabled={readOnly}
                  onChange={(e) => onChange('standardCutCostPerPiece', e.target.value)}
                  placeholder="0.00"
                  className={`w-full pr-3 pl-9 py-2 border rounded-lg text-sm font-bold text-slate-800 ${
                    readOnly
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                  ج.م
                </span>
              </div>
            </div>

            {/* الطباعة / التطريز */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-2 mb-2 text-slate-700">
                <Printer className="w-4 h-4 text-purple-600" />
                <label className="text-xs font-bold">طباعة وتطريز</label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={printEmbroideryStandardCost ?? ''}
                  disabled={readOnly}
                  onChange={(e) => onChange('printEmbroideryStandardCost', e.target.value)}
                  placeholder="0.00"
                  className={`w-full pr-3 pl-9 py-2 border rounded-lg text-sm font-bold text-slate-800 ${
                    readOnly
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                  ج.م
                </span>
              </div>
            </div>

            {/* الخياطة */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-2 mb-2 text-slate-700">
                <Shirt className="w-4 h-4 text-blue-600" />
                <label className="text-xs font-bold">تكلفة الخياطة</label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={standardSewingCostPerPiece ?? ''}
                  disabled={readOnly}
                  onChange={(e) => onChange('standardSewingCostPerPiece', e.target.value)}
                  placeholder="0.00"
                  className={`w-full pr-3 pl-9 py-2 border rounded-lg text-sm font-bold text-slate-800 ${
                    readOnly
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                  ج.م
                </span>
              </div>
            </div>

            {/* التشطيب */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-2 mb-2 text-slate-700">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <label className="text-xs font-bold">تكلفة التشطيب</label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={standardFinishingCostPerPiece ?? ''}
                  disabled={readOnly}
                  onChange={(e) => onChange('standardFinishingCostPerPiece', e.target.value)}
                  placeholder="0.00"
                  className={`w-full pr-3 pl-9 py-2 border rounded-lg text-sm font-bold text-slate-800 ${
                    readOnly
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                  ج.م
                </span>
              </div>
            </div>

            {/* المكواة */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-2 mb-2 text-slate-700">
                <Flame className="w-4 h-4 text-rose-600" />
                <label className="text-xs font-bold">تكلفة المكواة</label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={standardIroningCostPerPiece ?? ''}
                  disabled={readOnly}
                  onChange={(e) => onChange('standardIroningCostPerPiece', e.target.value)}
                  placeholder="0.00"
                  className={`w-full pr-3 pl-9 py-2 border rounded-lg text-sm font-bold text-slate-800 ${
                    readOnly
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                  ج.م
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. تعليمات وملاحظات التشغيل للأقسام */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 px-6 py-4 border-b border-slate-200 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center font-bold shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">تعليمات التشغيل وملاحظات الأقسام</h3>
            <p className="text-xs text-slate-500">ملاحظات ومواصفات تسليم الأقسام (تظهر في بطاقات المراحل وأوامر التشغيل)</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ملاحظات قص */}
            <div className="space-y-1.5 bg-slate-50/60 p-3 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                ملاحظات قص
              </label>
              <textarea
                value={cuttingInstructions ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('cuttingInstructions', e.target.value)}
                placeholder="تعليمات فرش القماش، اتجاه النسيج، الهالك..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg text-xs transition-all ${
                  readOnly
                    ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs'
                }`}
              />
            </div>

            {/* ملاحظات خياطة */}
            <div className="space-y-1.5 bg-slate-50/60 p-3 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-blue-600" />
                ملاحظات خياطة
              </label>
              <textarea
                value={sewingInstructions ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('sewingInstructions', e.target.value)}
                placeholder="تعليمات التجميع، نوع الخيط، مواضع التكتات..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg text-xs transition-all ${
                  readOnly
                    ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs'
                }`}
              />
            </div>

            {/* ملاحظات تشطيب */}
            <div className="space-y-1.5 bg-slate-50/60 p-3 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                ملاحظات تشطيب
              </label>
              <textarea
                value={finishingInstructions ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('finishingInstructions', e.target.value)}
                placeholder="قص الخيوط، تركيب الأزرار، فحص الغرز..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg text-xs transition-all ${
                  readOnly
                    ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs'
                }`}
              />
            </div>

            {/* ملاحظات تغليف وتخزين */}
            <div className="space-y-1.5 bg-slate-50/60 p-3 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                ملاحظات تغليف وتخزين
              </label>
              <textarea
                value={packingInstructions ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange('packingInstructions', e.target.value)}
                placeholder="طريقة التطبيق، الأكياس، كراتين الشحن..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg text-xs transition-all ${
                  readOnly
                    ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

