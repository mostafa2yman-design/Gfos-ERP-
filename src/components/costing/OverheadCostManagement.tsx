import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Zap, 
  Wrench, 
  TrendingUp, 
  Percent, 
  Plus, 
  Edit, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Scissors, 
  Shirt, 
  Sparkles, 
  Printer, 
  Package, 
  Calculator, 
  DollarSign,
  Scale,
  Sliders,
  Check,
  X,
  Info,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  OverheadCostCategory, 
  OverheadStageKey, 
  getOverheadCategories, 
  saveOverheadCategories, 
  resetOverheadCategoriesToDefault, 
  STAGE_NAMES_AR,
  STAGE_WIP_ACCOUNTS
} from '../../lib/overheadStorage';
import { getOrders } from '../../lib/storage';
import { ProductionOrder } from '../../types';
import { calculateOrderOverheadAnalysis, OrderOverheadAnalysis } from '../../lib/overheadStorage';
import { Toast } from '../ui/Toast';
import { SensitiveDataMask } from '../common/SensitiveDataMask';

interface OverheadCostManagementProps {
  onNavigateToOrder?: (orderId: string, tab?: string) => void;
  onNavigateToLedger?: (accountCode: string) => void;
  onNavigateToJournal?: () => void;
}

export function OverheadCostManagement({
  onNavigateToOrder,
  onNavigateToLedger,
  onNavigateToJournal
}: OverheadCostManagementProps) {
  const [categories, setCategories] = useState<OverheadCostCategory[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [simulatedAnalysis, setSimulatedAnalysis] = useState<OrderOverheadAnalysis | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OverheadCostCategory | null>(null);
  const [toastConfig, setToastConfig] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [accountCode, setAccountCode] = useState('521');
  const [accountName, setAccountName] = useState('قوى محركة وكهرباء ومياه المصنع');
  const [description, setDescription] = useState('');
  const [allocationMethod, setAllocationMethod] = useState<'per_piece' | 'monthly_budget'>('per_piece');
  const [ratePerPiece, setRatePerPiece] = useState<number>(3.5);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(35000);
  const [estimatedMonthlyUnits, setEstimatedMonthlyUnits] = useState<number>(10000);
  const [stageAllocations, setStageAllocations] = useState<{
    cut: number;
    prep: number;
    print: number;
    sew: number;
    finish: number;
    ironing: number;
    packing: number;
  }>({
    cut: 15,
    prep: 5,
    print: 10,
    sew: 40,
    finish: 10,
    ironing: 15,
    packing: 5
  });

  const loadData = async () => {
    const cats = getOverheadCategories();
    setCategories(cats);
    const ords = await getOrders();
    setOrders(ords);
    if (ords.length > 0 && !selectedOrderId) {
      setSelectedOrderId(ords[0].id);
      setSimulatedAnalysis(calculateOrderOverheadAnalysis(ords[0]));
    } else if (selectedOrderId) {
      const current = ords.find(o => o.id === selectedOrderId);
      if (current) setSimulatedAnalysis(calculateOrderOverheadAnalysis(current));
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('overhead_categories_updated', handleUpdate);
    return () => window.removeEventListener('overhead_categories_updated', handleUpdate);
  }, []);

  const handleSelectOrder = (id: string) => {
    setSelectedOrderId(id);
    const ord = orders.find(o => o.id === id);
    if (ord) {
      setSimulatedAnalysis(calculateOrderOverheadAnalysis(ord));
    } else {
      setSimulatedAnalysis(null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName('');
    setCode(`MOH-0${categories.length + 1}`);
    setAccountCode('521');
    setAccountName('قوى محركة وكهرباء ومياه المصنع');
    setDescription('');
    setAllocationMethod('per_piece');
    setRatePerPiece(3.0);
    setMonthlyAmount(30000);
    setEstimatedMonthlyUnits(10000);
    setStageAllocations({
      cut: 15,
      prep: 5,
      print: 10,
      sew: 40,
      finish: 10,
      ironing: 15,
      packing: 5
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: OverheadCostCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setCode(cat.code);
    setAccountCode(cat.accountCode);
    setAccountName(cat.accountName);
    setDescription(cat.description || '');
    setAllocationMethod(cat.allocationMethod);
    setRatePerPiece(cat.ratePerPiece);
    setMonthlyAmount(cat.monthlyAmount);
    setEstimatedMonthlyUnits(cat.estimatedMonthlyUnits);
    setStageAllocations({ ...cat.stageAllocations });
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (id: string, catName: string) => {
    if (confirm(`هل أنت متأكد من حذف بند التكاليف غير المباشرة (${catName})؟`)) {
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      saveOverheadCategories(updated);
      setToastConfig({ message: `تم حذف بند (${catName}) بنجاح وتحديث نسب التحميل.`, type: 'success' });
    }
  };

  const handleResetDefaults = () => {
    if (confirm('هل أنت متأكد من إعادة ضبط بنود التكاليف الصناعية غير المباشرة ونسبها إلى القيم القياسية للمصنع؟')) {
      resetOverheadCategoriesToDefault();
      setToastConfig({ message: 'تم استرجاع البنود والنسب القياسية الموصى بها بنجاح.', type: 'info' });
      loadData();
    }
  };

  const totalAllocationPct: number = (Object.values(stageAllocations) as number[]).reduce((acc: number, val: number) => acc + (Number(val) || 0), 0);

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToastConfig({ message: 'يرجى إدخال اسم البند.', type: 'error' });
      return;
    }

    if (Math.abs(totalAllocationPct - 100) > 0.01) {
      setToastConfig({
        message: `مجموع نسب التوزيع على المراحل (${totalAllocationPct}%) يجب أن يساوي 100% تماماً.`,
        type: 'error'
      });
      return;
    }

    const calculatedRate = allocationMethod === 'monthly_budget' && estimatedMonthlyUnits > 0
      ? Math.round((monthlyAmount / estimatedMonthlyUnits) * 100) / 100
      : Number(ratePerPiece);

    const newCat: OverheadCostCategory = {
      id: editingCategory ? editingCategory.id : `oh_${Date.now()}`,
      name: name.trim(),
      code: code.trim(),
      accountCode,
      accountName,
      description: description.trim(),
      allocationMethod,
      ratePerPiece: calculatedRate,
      monthlyAmount: Number(monthlyAmount),
      estimatedMonthlyUnits: Number(estimatedMonthlyUnits),
      isActive: true,
      stageAllocations
    };

    let updatedList: OverheadCostCategory[];
    if (editingCategory) {
      updatedList = categories.map(c => c.id === editingCategory.id ? newCat : c);
    } else {
      updatedList = [...categories, newCat];
    }

    setCategories(updatedList);
    saveOverheadCategories(updatedList);
    setIsModalOpen(false);
    setToastConfig({
      message: editingCategory
        ? `تم تحديث بند (${newCat.name}) وتوزيعاته بنجاح.`
        : `تمت إضافة بند (${newCat.name}) واعتماد نسب توزيعه على المراحل بنجاح.`,
      type: 'success'
    });
    loadData();
  };

  // Metric aggregates
  const totalOverheadRatePerPiece = categories
    .filter(c => c.isActive !== false)
    .reduce((sum, c) => sum + (c.ratePerPiece || 0), 0);

  const totalMonthlyBudget = categories
    .filter(c => c.isActive !== false)
    .reduce((sum, c) => sum + (c.monthlyAmount || 0), 0);

  const stageKeys: OverheadStageKey[] = ['cut', 'prep', 'print', 'sew', 'finish', 'ironing', 'packing'];

  // Calculate allocated rate per piece for each stage
  const stageRatePerPieceMap: Record<OverheadStageKey, number> = {
    cut: 0,
    prep: 0,
    print: 0,
    sew: 0,
    finish: 0,
    ironing: 0,
    packing: 0
  };

  categories.filter(c => c.isActive !== false).forEach(c => {
    stageKeys.forEach(k => {
      const pct = (c.stageAllocations[k] || 0) / 100;
      stageRatePerPieceMap[k] += (c.ratePerPiece * pct);
    });
  });

  return (
    <div className="space-y-6">
      {toastConfig && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig(null)}
        />
      )}

      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                تعريف وتوزيع التكاليف الصناعية غير المباشرة (Manufacturing Overhead - MOH)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                توزيع مصاريف الكهرباء والإيجار وإهلاك وصيانة الآلات على مراحل الإنتاج لتنعكس بدقة في تكلفة أمر الإنتاج عند الاعتماد
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
            title="استرجاع التوزيعات المعيارية الموصى بها"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>إعادة ضبط للافتراضي</span>
          </button>

          {onNavigateToJournal && (
            <button
              type="button"
              onClick={onNavigateToJournal}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>قيود اليومية</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>تعريف بند تكاليف غير مباشرة جديد</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">معدل التحميل الإجمالي للقطعة</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700">
            <SensitiveDataMask
              dataKey="costs.view_overhead"
              value={`${totalOverheadRatePerPiece.toFixed(2)} ج.م / قطعة`}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            يُحمل آلياً على تكلفة أمر الإنتاج المعتمد مقسماً على مراحله
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي الموازنة الشهرية المقدرة</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800">
            <SensitiveDataMask
              dataKey="costs.view_overhead"
              value={`${totalMonthlyBudget.toLocaleString('ar-EG')} ج.م / شهر`}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            تغطي {categories.length} بنود تكاليف صناعية مساعدة
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">أعلى مرحلة امتصاصاً للتكاليف</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            مرحلة الخياطة
          </div>
          <p className="text-[11px] text-blue-700 font-bold mt-2">
            <SensitiveDataMask
              dataKey="costs.view_overhead"
              value={`${stageRatePerPieceMap.sew.toFixed(2)} ج.م / قطعة`}
              compact
            />
            <span> ({totalOverheadRatePerPiece > 0 ? Math.round((stageRatePerPieceMap.sew / totalOverheadRatePerPiece) * 100) : 0}%)</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">المعالجة المحاسبية التلقائية</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-black text-purple-900 mt-1">
            تحميل على الإنتاج تحت التشغيل (1242)
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            تنعكس فور اعتماد مرحلة القص، التجهيز، الخياطة، والتشطيب
          </p>
        </div>
      </div>

      {/* Stage Distribution Matrix Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>مصفوفة توزيع التكاليف الصناعية غير المباشرة على مراحل الإنتاج (ج.م / قطعة):</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              كل مرحلة يتم اعتمادها تقوم بامتصاص نصيبها المحدد أدناه وإضافته للتكلفة الفعلية للأمر
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {stageKeys.map(k => {
            const rate = stageRatePerPieceMap[k];
            const pctOfTotal = totalOverheadRatePerPiece > 0 
              ? Math.round((rate / totalOverheadRatePerPiece) * 100) 
              : 0;
            return (
              <div key={k} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-right space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block truncate">
                  {STAGE_NAMES_AR[k]}
                </span>
                <div className="text-lg font-black text-slate-900">
                  <SensitiveDataMask
                    dataKey="costs.view_overhead"
                    value={`${rate.toFixed(2)} ج.م`}
                    compact
                  />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-600">
                  <span>النسبة:</span>
                  <span className="font-bold text-indigo-700">{pctOfTotal}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Defined Overhead Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="font-extrabold text-sm text-slate-800">
              بنود التكاليف الصناعية غير المباشرة المعتمدة ونسب التوزيع
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            {categories.length} بنود معرفة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-100/60 text-slate-600 font-black border-b border-slate-200">
                <th className="p-3.5">الكود والبند</th>
                <th className="p-3.5">الحساب المحاسبي</th>
                <th className="p-3.5 text-center">الموازنة الشهرية</th>
                <th className="p-3.5 text-center">المعدل / قطعة</th>
                <th className="p-3.5 text-center">القص</th>
                <th className="p-3.5 text-center">التجهيز</th>
                <th className="p-3.5 text-center">الطباعة</th>
                <th className="p-3.5 text-center">الخياطة</th>
                <th className="p-3.5 text-center">التشطيب</th>
                <th className="p-3.5 text-center">المكواة</th>
                <th className="p-3.5 text-center">التغليف</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <span className="font-extrabold text-slate-900 block text-sm">{cat.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{cat.code} {cat.description ? `• ${cat.description}` : ''}</span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                      {cat.accountCode} - {cat.accountName}
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-700 whitespace-nowrap">
                    <SensitiveDataMask
                      dataKey="costs.view_overhead"
                      value={`${cat.monthlyAmount.toLocaleString('ar-EG')} ج.م`}
                      compact
                    />
                  </td>
                  <td className="p-3.5 text-center font-black text-indigo-700 text-sm whitespace-nowrap">
                    <SensitiveDataMask
                      dataKey="costs.view_unit_cost"
                      value={`${cat.ratePerPiece.toFixed(2)} ج.م`}
                      compact
                    />
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-700">
                    {cat.stageAllocations.cut}%
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-700">
                    {cat.stageAllocations.prep}%
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-700">
                    {cat.stageAllocations.print}%
                  </td>
                  <td className="p-3.5 text-center font-black text-indigo-700">
                    {cat.stageAllocations.sew}%
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-700">
                    {cat.stageAllocations.finish}%
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-700">
                    {cat.stageAllocations.ironing}%
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-700">
                    {cat.stageAllocations.packing}%
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(cat)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="تعديل البند ونسب التوزيع"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف البند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Order Simulation & Verification Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <span>محاكاة وفحص انعكاس التكاليف غير المباشرة على أمر إنتاج فعلي:</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              اختر أي أمر إنتاج لمعاينة كيفية تحميل التكاليف غير المباشرة مرحلياً بمجرد اعتماد كل مرحلة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 whitespace-nowrap">أمر الإنتاج:</label>
            <select
              value={selectedOrderId}
              onChange={(e) => handleSelectOrder(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} - {o.styleName} ({o.customerName}) [{o.status}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {simulatedAnalysis && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <span className="text-xs font-bold text-indigo-800">إجمالي التكلفة غير المباشرة المعيارية للأمر:</span>
                <div className="text-xl font-black text-indigo-900 mt-1">
                  <SensitiveDataMask
                    dataKey="costs.view_order_cost"
                    value={`${simulatedAnalysis.totalStandardOrder.toLocaleString('ar-EG')} ج.م`}
                  />
                  <span className="text-xs font-normal text-indigo-600 block">
                    (
                    <SensitiveDataMask
                      dataKey="costs.view_unit_cost"
                      value={`${simulatedAnalysis.totalStandardPerPiece.toFixed(2)} ج.م / قطعة`}
                      compact
                    />
                    )
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <span className="text-xs font-bold text-emerald-800">التكاليف غير المباشرة الممتصة فعلياً حتى الآن:</span>
                <div className="text-xl font-black text-emerald-900 mt-1">
                  <SensitiveDataMask
                    dataKey="costs.view_order_cost"
                    value={`${simulatedAnalysis.absorbedActualOrder.toLocaleString('ar-EG')} ج.م`}
                  />
                  <span className="text-xs font-normal text-emerald-600 block">
                    (عن المراحل التي تم اعتمادها رسمياً)
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-600">حالة اكتمال تحميل التكاليف:</span>
                <div className="mt-1">
                  {simulatedAnalysis.isFullyAbsorbed ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      مكتملة ومحملة بنسبة 100%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <AlertCircle className="w-3.5 h-3.5" />
                      قيد التحميل مع تقدم اعتماد المراحل
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stages checklist */}
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200">
              <h5 className="text-xs font-extrabold text-slate-700 mb-2">
                انعكاس التحميل حسب المراحل المعتمدة لهذا الأمر:
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                {stageKeys.map(k => {
                  const item = simulatedAnalysis.stageBreakdown[k];
                  return (
                    <div key={k} className={`p-2.5 rounded-lg border text-right ${
                      item.isApproved 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold truncate">{STAGE_NAMES_AR[k]}</span>
                        {item.isApproved ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        ) : (
                          <span className="text-[9px] text-slate-400">بالانتظار</span>
                        )}
                      </div>
                      <div className="font-extrabold text-sm">
                        {item.standardPerPiece.toFixed(2)} ج.م
                      </div>
                      <span className="text-[9px] block text-slate-400">
                        {item.isApproved ? 'معتمد ومحمل' : 'غير معتمد بعد'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add / Edit Overhead Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <h3 className="font-black text-base">
                  {editingCategory ? 'تعديل بند تكاليف غير مباشرة وتوزيعاته' : 'تعريف بند تكاليف صناعية غير مباشرة جديد'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم البند *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: كهرباء وقوى محركة، إيجار المصنع، إهلاك آلات..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">كود البند</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="MOH-01"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الحساب المالي بدليل الحسابات</label>
                  <select
                    value={accountCode}
                    onChange={(e) => {
                      setAccountCode(e.target.value);
                      const opt = e.target.options[e.target.selectedIndex];
                      setAccountName(opt.text.split(' - ')[1] || 'تكاليف صناعية غير مباشرة');
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="521">521 - قوى محركة وكهرباء ومياه المصنع</option>
                    <option value="522">522 - وقود وسولار للغلايات ومولدات التشغيل</option>
                    <option value="523">523 - صيانة وقطع غيار وزيوت ماكينات الإنتاج</option>
                    <option value="524">524 - إهلاك خطوط وآلات ومعدات المصنع</option>
                    <option value="525">525 - إيجار هناجر ومباني ورش التصنيع</option>
                    <option value="526">526 - مرتبات المشرفين ومراقبي الجودة ومديري الإنتاج</option>
                    <option value="527">527 - مهمات أمن صناعي وسلامة مهنية ومستهلكات الورش</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة احتساب التحميل</label>
                  <select
                    value={allocationMethod}
                    onChange={(e) => setAllocationMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="per_piece">معدل تكلفة محدد للقطعة الواحدة (ج.م / قطعة)</option>
                    <option value="monthly_budget">ميزانية شهرية تقسم على الطاقة الإنتاجية</option>
                  </select>
                </div>
              </div>

              {allocationMethod === 'per_piece' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    معدل تكلفة البند للقطعة (ج.م / قطعة) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    required
                    value={ratePerPiece}
                    onChange={(e) => setRatePerPiece(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-black text-indigo-700"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ الإجمالي الشهري (ج.م) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الطاقة الشهرية المتوقعة (قطعة) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={estimatedMonthlyUnits}
                      onChange={(e) => setEstimatedMonthlyUnits(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div className="col-span-2 text-xs font-bold text-indigo-800">
                    المعدل المحسوب للقطعة: {estimatedMonthlyUnits > 0 ? (monthlyAmount / estimatedMonthlyUnits).toFixed(2) : 0} ج.م / قطعة
                  </div>
                </div>
              )}

              {/* Stage Allocation Distribution */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-indigo-600" />
                    <span>نسب توزيع هذا البند على مراحل الإنتاج (المجموع = 100%):</span>
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                    Math.abs(totalAllocationPct - 100) < 0.01 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    المجموع: {totalAllocationPct}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">مرحلة القص %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={stageAllocations.cut}
                      onChange={(e) => setStageAllocations({ ...stageAllocations, cut: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">مرحلة التجهيز %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={stageAllocations.prep}
                      onChange={(e) => setStageAllocations({ ...stageAllocations, prep: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">الطباعة والتطريز %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={stageAllocations.print}
                      onChange={(e) => setStageAllocations({ ...stageAllocations, print: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">مرحلة الخياطة %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={stageAllocations.sew}
                      onChange={(e) => setStageAllocations({ ...stageAllocations, sew: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-black text-indigo-700 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">مرحلة التشطيب %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={stageAllocations.finish}
                      onChange={(e) => setStageAllocations({ ...stageAllocations, finish: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">مرحلة المكواة %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={stageAllocations.ironing}
                      onChange={(e) => setStageAllocations({ ...stageAllocations, ironing: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">التعبئة والتغليف %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={stageAllocations.packing}
                      onChange={(e) => setStageAllocations({ ...stageAllocations, packing: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات وبيان البند</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف تفصيلي للبند ومصادر تكلفته..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingCategory ? 'حفظ التعديلات' : 'حفظ البند وتوزيعاته'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OverheadCostManagement;
