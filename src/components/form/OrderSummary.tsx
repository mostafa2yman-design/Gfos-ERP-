import React from 'react';
import { SizeData } from '../../types';
import { Layers, Palette, Package, CheckCircle2, TrendingUp } from 'lucide-react';

interface OrderSummaryProps {
  sizes: SizeData[];
  actualSizes?: SizeData[];
  sellingPrice?: number;
  totalStageCost?: number;
}

export function OrderSummary({ sizes, actualSizes, sellingPrice, totalStageCost }: OrderSummaryProps) {
  // Compute totals for standard sizes
  const totalSizes = sizes.length;
  const colorTotals: Record<string, number> = {};
  const sizeTotals: Record<string, number> = {};
  let grandTotal = 0;

  sizes.forEach((size) => {
    let currentSizeTotal = 0;
    size.variants.forEach((variant) => {
      if (variant.color && variant.quantity) {
        const qty = Number(variant.quantity) || 0;
        colorTotals[variant.color] = (colorTotals[variant.color] || 0) + qty;
        currentSizeTotal += qty;
        grandTotal += qty;
      }
    });
    sizeTotals[size.size] = currentSizeTotal;
  });

  const sortedColors = Object.entries(colorTotals).sort((a, b) => b[1] - a[1]);
  const totalColors = sortedColors.length;

  // Compute totals for actual sizes
  const actualColorTotals: Record<string, number> = {};
  const actualSizeTotals: Record<string, number> = {};
  let actualGrandTotal = 0;

  if (actualSizes) {
    actualSizes.forEach((size) => {
      let currentSizeTotal = 0;
      size.variants.forEach((variant: any) => {
        const actualQty = variant.actualQuantity !== undefined ? variant.actualQuantity : variant.quantity;
        if (variant.color && actualQty !== undefined) {
          const qty = Number(actualQty) || 0;
          actualColorTotals[variant.color] = (actualColorTotals[variant.color] || 0) + qty;
          currentSizeTotal += qty;
          actualGrandTotal += qty;
        }
      });
      actualSizeTotals[size.size] = currentSizeTotal;
    });
  }

  const estTotalRevenue = sellingPrice && grandTotal > 0 ? sellingPrice * grandTotal : 0;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold">ملخص الكميات والمواصفات</h3>
            <p className="text-[11px] text-slate-300">موجز الإنتاج المباشر</p>
          </div>
        </div>
        <span className="text-xs bg-indigo-500/20 text-indigo-200 font-semibold px-2 py-0.5 rounded border border-indigo-400/20">
          {grandTotal} قطعة
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* KPI Mini Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs mb-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>المقاسات</span>
            </div>
            <p className="text-lg font-black text-slate-800 font-mono">{totalSizes}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs mb-1">
              <Palette className="w-3.5 h-3.5 text-purple-600" />
              <span>الألوان</span>
            </div>
            <p className="text-lg font-black text-slate-800 font-mono">{totalColors}</p>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200/80 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-indigo-700 text-xs mb-1 font-semibold">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>إجمالي القطع</span>
            </div>
            <p className="text-lg font-black text-indigo-900 font-mono">
              {grandTotal}
            </p>
            {actualSizes && (
              <span className="block text-[11px] font-bold text-amber-700 mt-0.5">
                الفعلي: {actualGrandTotal}
              </span>
            )}
          </div>
        </div>

        {/* Financial Preview if selling price exists */}
        {estTotalRevenue > 0 && (
          <div className="bg-emerald-50 border border-emerald-200/70 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                إجمالي الإيراد المستهدف:
              </span>
              <span className="font-black font-mono text-sm text-emerald-950">
                {estTotalRevenue.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
            <p className="text-[11px] text-emerald-700">
              سعر البيع: {sellingPrice} ج.م × {grandTotal} قطعة
            </p>
          </div>
        )}

        {/* Breakdown by Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
            <span>توزيع الكميات حسب المقاس</span>
            <span className="text-slate-400 font-normal text-[11px]">
              {totalSizes} مقاس
            </span>
          </div>

          {sizes.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {sizes.map((size) => {
                const qty = sizeTotals[size.size] || 0;
                const percentage = grandTotal > 0 ? Math.round((qty / grandTotal) * 100) : 0;
                return (
                  <div
                    key={size.size}
                    className="p-2 bg-slate-50/80 hover:bg-indigo-50/50 rounded-lg border border-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800">المقاس {size.size}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded text-xs">
                          {qty} ق
                        </span>
                        {actualSizes && (
                          <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[11px]" title="الفعلي">
                            {actualSizeTotals[size.size] || 0}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-xs text-center py-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              لم يتم إضافة أي مقاسات بعد
            </p>
          )}
        </div>

        {/* Breakdown by Color */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
            <span>توزيع الكميات حسب اللون</span>
            <span className="text-slate-400 font-normal text-[11px]">
              {totalColors} لون
            </span>
          </div>

          {sortedColors.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {sortedColors.map(([color, total]) => {
                const percentage = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
                return (
                  <div
                    key={color}
                    className="p-2 bg-slate-50/80 hover:bg-purple-50/50 rounded-lg border border-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="font-bold text-slate-800">{color}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded text-xs">
                          {total} ق
                        </span>
                        {actualSizes && (
                          <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[11px]" title="الفعلي">
                            {actualColorTotals[color] || 0}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-xs text-center py-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              لم يتم تحديد ألوان أو كميات بعد
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

