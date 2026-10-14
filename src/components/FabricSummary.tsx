import React from 'react';
import { FabricAnalysisSummary } from '../lib/fabricUtils';

interface Props {
  summary: FabricAnalysisSummary;
}

export const FabricSummary: React.FC<Props> = ({ summary }) => {
  const formatNum = (num: number | null | undefined, decimals = 3) => {
    if (num === null || num === undefined) return '—';
    return Number(num).toFixed(decimals);
  };

  const formatCost = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '—';
    return `${Number(num).toFixed(2)} ج.م`;
  };

  const formatPercent = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '—';
    return `${num > 0 ? '+' : ''}${Number(num).toFixed(2)}%`;
  };

  const formatDiff = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '—';
    return `${num > 0 ? '+' : ''}${Number(num).toFixed(3)}`;
  };
  
  const formatDiffCost = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '—';
    return `${num > 0 ? '+' : ''}${Number(num).toFixed(2)} ج.م`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-800">تحليل استهلاك القماش والتكلفة</h3>
      
      {summary.fabricPrice <= 0 && (
        <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm mb-4 border border-amber-200">
          تنبيه: لم يتم تحديد سعر معياري للقماش الأساسي في التوصيف. تكلفة القماش ستظهر كـ صفر.
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-right whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-sm">
              <th className="px-4 py-3 font-semibold">اللون</th>
              <th className="px-4 py-3 font-semibold text-center">الكمية</th>
              <th className="px-4 py-3 font-semibold text-center">المطلوب كجم</th>
              <th className="px-4 py-3 font-semibold text-center">الفعلي كجم</th>
              <th className="px-4 py-3 font-semibold text-center">تكلفة القطعة (معياري)</th>
              <th className="px-4 py-3 font-semibold text-center">تكلفة القطعة (فعلي)</th>
              <th className="px-4 py-3 font-semibold text-center">الانحراف المالي</th>
              <th className="px-4 py-3 font-semibold text-center">% الانحراف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summary.colors.map(c => (
              <tr key={c.color} className="text-sm hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{c.color}</td>
                <td className="px-4 py-3 text-center text-slate-600">{c.actualPieces > 0 ? c.actualPieces : c.plannedPieces}</td>
                <td className="px-4 py-3 text-center text-slate-600">{formatNum(c.requiredFabric)}</td>
                <td className="px-4 py-3 text-center font-medium text-slate-800">
                  {summary.hasColorLevelActuals ? (c.actualFabric > 0 ? formatNum(c.actualFabric) : 'لم يتم الإدخال') : (summary.totalActualFabric > 0 ? 'غير متاح حسب اللون' : 'لم يتم الإدخال')}
                </td>
                <td className="px-4 py-3 text-center text-slate-600">{formatCost(c.standardCostPerPiece)}</td>
                <td className="px-4 py-3 text-center font-medium text-slate-800">
                  {summary.hasColorLevelActuals ? (c.actualCostPerPiece !== null ? formatCost(c.actualCostPerPiece) : 'لم يتم الإدخال') : (summary.totalActualFabric > 0 ? 'غير متاح حسب اللون' : 'لم يتم الإدخال')}
                </td>
                <td className={`px-4 py-3 text-center font-bold ${c.costVariance && c.costVariance > 0 ? 'text-red-600' : c.costVariance && c.costVariance < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {formatDiffCost(c.costVariance)}
                </td>
                <td className={`px-4 py-3 text-center font-bold ${c.costVariancePercentage && c.costVariancePercentage > 0 ? 'text-red-600' : c.costVariancePercentage && c.costVariancePercentage < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {formatPercent(c.costVariancePercentage)}
                </td>
              </tr>
            ))}
            
            {/* Totals Row */}
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
              <td className="px-4 py-3 text-slate-800">الإجمالي / المتوسط</td>
              <td className="px-4 py-3 text-center text-slate-800">{summary.totalActualPieces > 0 ? summary.totalActualPieces : summary.totalPlannedPieces}</td>
              <td className="px-4 py-3 text-center text-indigo-700">{formatNum(summary.totalRequiredFabric)}</td>
              <td className="px-4 py-3 text-center text-indigo-700">
                {summary.totalActualFabric > 0 ? formatNum(summary.totalActualFabric) : 'لم يتم الإدخال'}
              </td>
              <td className="px-4 py-3 text-center text-slate-800">{formatCost(summary.averageStandardCostPerPiece)}</td>
              <td className="px-4 py-3 text-center text-slate-800">
                {summary.totalActualFabric > 0 ? formatCost(summary.averageActualCostPerPiece) : 'لم يتم الإدخال'}
              </td>
              <td className={`px-4 py-3 text-center ${summary.totalCostVariance && summary.totalCostVariance > 0 ? 'text-red-600' : summary.totalCostVariance && summary.totalCostVariance < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                {formatDiffCost(summary.totalCostVariance)}
              </td>
              <td className={`px-4 py-3 text-center ${summary.totalCostVariancePercentage && summary.totalCostVariancePercentage > 0 ? 'text-red-600' : summary.totalCostVariancePercentage && summary.totalCostVariancePercentage < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                {formatPercent(summary.totalCostVariancePercentage)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">الوزن المعياري للقطعة</p>
          <p className="text-xl font-bold text-slate-800">{formatNum(summary.averageStandardWeightPerPiece)} <span className="text-sm font-normal text-slate-500">كجم</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">الوزن الفعلي للقطعة</p>
          <p className="text-xl font-bold text-indigo-600">
            {summary.averageActualWeightPerPiece ? `${formatNum(summary.averageActualWeightPerPiece)} ` : '— '}
            <span className="text-sm font-normal text-slate-500">كجم</span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">انحراف التكلفة المالي</p>
          <p className={`text-xl font-bold ${summary.totalCostVariance && summary.totalCostVariance > 0 ? 'text-red-600' : summary.totalCostVariance && summary.totalCostVariance < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
            {summary.totalCostVariance ? `${formatDiffCost(summary.totalCostVariance)} ` : '— '}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">نسبة الانحراف المالي</p>
          <p className={`text-xl font-bold ${summary.totalCostVariancePercentage && summary.totalCostVariancePercentage > 0 ? 'text-red-600' : summary.totalCostVariancePercentage && summary.totalCostVariancePercentage < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
            {formatPercent(summary.totalCostVariancePercentage)}
          </p>
        </div>
      </div>
    </div>
  );
};
