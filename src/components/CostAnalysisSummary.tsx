import React, { useState } from "react";
import { ProductionOrder } from "../types";
import { calculateOrderCostAnalysis } from "../lib/costUtils";
import { SensitiveDataMask } from "./common/SensitiveDataMask";
import { useAuth } from "../context/AuthContext";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Layers,
  Zap,
  CheckCircle2,
  Clock,
  Info
} from "lucide-react";

interface CostAnalysisSummaryProps {
  order: ProductionOrder;
  defaultExpanded?: boolean;
  className?: string;
}

export function CostAnalysisSummary({
  order,
  defaultExpanded = false,
  className = "",
}: CostAnalysisSummaryProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const analysis = calculateOrderCostAnalysis(order);

  React.useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded, order?.id]);

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return "غير متاحة";
    return `${Number(val).toFixed(2)} جنيه`;
  };

  const getDeviationColor = (val: number | null) => {
    if (val === null) return "text-slate-500";
    if (val > 0) return "text-rose-600"; // Over budget
    if (val < 0) return "text-emerald-600"; // Under budget
    return "text-slate-500";
  };

  const renderDeviationIcon = (val: number | null) => {
    if (val === null) return <Minus className="w-4 h-4 text-slate-400" />;
    if (val > 0) return <TrendingUp className="w-4 h-4 text-rose-600" />;
    if (val < 0) return <TrendingDown className="w-4 h-4 text-emerald-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const renderRow = (
    label: string, 
    standard: number, 
    actual: number | null, 
    sensitiveKey: 'costs.view_bom_cost' | 'costs.view_labor_cost' | 'costs.view_overhead' | 'costs.view_unit_cost' = 'costs.view_unit_cost'
  ) => {
    const deviation = actual !== null ? actual - standard : null;
    const deviationPct =
      deviation !== null && standard > 0 ? (deviation / standard) * 100 : null;

    return (
      <tr key={label} className="hover:bg-slate-50/80 transition-colors">
        <td className="px-4 py-3 text-slate-800 font-bold">{label}</td>
        <td className="px-4 py-3 text-slate-800 font-semibold font-mono">
          <SensitiveDataMask dataKey={sensitiveKey} value={Number(standard).toFixed(2)} />
        </td>
        <td className="px-4 py-3 text-slate-800 font-semibold font-mono">
          {actual !== null ? (
            <SensitiveDataMask dataKey={sensitiveKey} value={Number(actual).toFixed(2)} />
          ) : (
            "—"
          )}
        </td>
        <td className={`px-4 py-3 font-bold font-mono ${getDeviationColor(deviation)}`}>
          {deviation !== null ? (
            <SensitiveDataMask 
              dataKey={sensitiveKey} 
              value={(deviation > 0 ? "+" : "") + Number(deviation).toFixed(2)} 
            />
          ) : (
            "—"
          )}
        </td>
        <td className={`px-4 py-3 font-bold font-mono ${getDeviationColor(deviationPct)}`}>
          {deviationPct !== null ? (
            <SensitiveDataMask 
              dataKey={sensitiveKey} 
              value={(deviationPct > 0 ? "+" : "") + Number(deviationPct).toFixed(2) + "%"} 
            />
          ) : (
            "—"
          )}
        </td>
      </tr>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-[#150d24] rounded-2xl shadow-2xs border border-slate-200 dark:border-purple-950/70 overflow-hidden transition-all duration-200 ${className}`}
      dir="rtl"
    >
      {/* Top Bar with Show/Hide Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-slate-50 via-purple-50/30 to-slate-50 dark:from-[#1a0f30] dark:via-[#22143d] dark:to-[#1a0f30] border-b border-slate-200 dark:border-purple-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2C1151] border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Calculator className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                تحليل تكلفة أمر الإنتاج المباشرة
              </h3>
              {!analysis.isActualComplete && (
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 px-2 py-0.5 rounded-md">
                  التكلفة الفعلية قيد التنفيذ
                </span>
              )}
              {analysis.isActualComplete && (
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
                  التكلفة الفعلية مكتملة
                </span>
              )}
            </div>

            {/* Quick overview metrics chips */}
            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
              <span className="font-medium">
                المعياري / قطعة:{" "}
                <strong className="text-slate-900 dark:text-white font-mono font-bold tabular-nums">
                  <SensitiveDataMask 
                    dataKey="costs.view_unit_cost" 
                    value={formatCurrency(analysis.totalStandardPerPiece)} 
                    compact 
                  />
                </strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-medium">
                الفعلي / قطعة:{" "}
                <strong className="text-slate-900 dark:text-white font-mono font-bold tabular-nums">
                  {analysis.isActualComplete ? (
                    <SensitiveDataMask 
                      dataKey="costs.view_unit_cost" 
                      value={formatCurrency(analysis.totalActualPerPiece)} 
                      compact 
                    />
                  ) : (
                    "قيد التشغيل"
                  )}
                </strong>
              </span>
              {analysis.deviationValue !== null && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span
                    className={`font-mono font-bold tabular-nums inline-flex items-center gap-0.5 ${getDeviationColor(
                      analysis.deviationValue
                    )}`}
                  >
                    الانحراف:{" "}
                    <SensitiveDataMask 
                      dataKey="costs.view_unit_cost" 
                      value={`${analysis.deviationValue > 0 ? "+" : ""}${formatCurrency(analysis.deviationValue)}`} 
                      compact 
                    />
                    {analysis.deviationPercentage !== null && (
                      <span className="text-[10px] font-semibold">
                        ({analysis.deviationPercentage > 0 ? "+" : ""}
                        {Number(analysis.deviationPercentage).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* The Show / Hide Button */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer border ${
              isExpanded
                ? "bg-slate-100 dark:bg-[#1f1338] hover:bg-slate-200 dark:hover:bg-[#2c1b4d] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-purple-900/40"
                : "bg-[#2C1151] hover:bg-[#3d1870] dark:bg-[#5a249c] dark:hover:bg-[#6c2bb8] text-white border-transparent"
            }`}
            title={isExpanded ? "إخفاء جدول تحليل التكلفة" : "إظهار جدول تحليل التكلفة بالكامل"}
          >
            {isExpanded ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>إخفاء</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>إظهار</span>
                <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full Content - Only shown when isExpanded is true */}
      {isExpanded && (
        <div className="p-6 space-y-6 animate-in fade-in-50 duration-200">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-bold text-slate-500 mb-1">
                تكلفة القطعة المعيارية
              </p>
              <p className="text-2xl font-black text-slate-900">
                <SensitiveDataMask 
                  dataKey="costs.view_unit_cost" 
                  value={formatCurrency(analysis.totalStandardPerPiece)} 
                />
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                إجمالي معتمد قائمة الخامات ومراحل التشغيل
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-bold text-slate-500 mb-1">
                تكلفة القطعة الفعلية
              </p>
              {analysis.isActualComplete ? (
                <p className="text-2xl font-black text-slate-900">
                  <SensitiveDataMask 
                    dataKey="costs.view_unit_cost" 
                    value={formatCurrency(analysis.totalActualPerPiece)} 
                  />
                </p>
              ) : (
                <p className="text-xl font-bold text-amber-700 mt-1">
                  قيد التشغيل الميداني
                </p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                محسوبة على أساس الأوزان والكميات الفعلية
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border shadow-2xs ${
                analysis.deviationValue !== null && analysis.deviationValue > 0
                  ? "bg-rose-50/90 border-rose-200"
                  : analysis.deviationValue !== null && analysis.deviationValue < 0
                  ? "bg-emerald-50/90 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <p className="text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
                <span>قيمة الانحراف / قطعة</span>
                {renderDeviationIcon(analysis.deviationValue)}
              </p>
              {analysis.deviationValue !== null ? (
                <p
                  className={`text-2xl font-black ${getDeviationColor(
                    analysis.deviationValue
                  )}`}
                >
                  <SensitiveDataMask 
                    dataKey="costs.view_unit_cost" 
                    value={`${analysis.deviationValue > 0 ? "+" : ""}${formatCurrency(analysis.deviationValue)}`} 
                  />
                </p>
              ) : (
                <p className="text-lg font-bold text-slate-500 mt-1">غير متاح</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                {analysis.deviationValue !== null && analysis.deviationValue > 0
                  ? "تكلفة زائدة عن المخطط"
                  : analysis.deviationValue !== null && analysis.deviationValue < 0
                  ? "وفر في التكلفة عن المخطط"
                  : "مطابق للتكلفة المعيارية"}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border shadow-2xs ${
                analysis.deviationPercentage !== null && analysis.deviationPercentage > 0
                  ? "bg-rose-50/90 border-rose-200"
                  : analysis.deviationPercentage !== null && analysis.deviationPercentage < 0
                  ? "bg-emerald-50/90 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <p className="text-xs font-bold text-slate-600 mb-1">
                نسبة الانحراف الإجمالية
              </p>
              {analysis.deviationPercentage !== null ? (
                <p
                  className={`text-2xl font-black ${getDeviationColor(
                    analysis.deviationPercentage
                  )}`}
                >
                  <SensitiveDataMask 
                    dataKey="costs.view_unit_cost" 
                    value={`${analysis.deviationPercentage > 0 ? "+" : ""}${Number(analysis.deviationPercentage).toFixed(2)}%`} 
                  />
                </p>
              ) : (
                <p className="text-lg font-bold text-slate-500 mt-1">غير متاح</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                نسبة التغير مقارنة بالتكلفة المعيارية
              </p>
            </div>
          </div>

          {/* Full Width Breakdown Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>جدول تفاصيل التكلفة للقطعة عبر مراحل التشغيل</span>
                {!analysis.isActualComplete && (
                  <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                    بعض المراحل لم تستكمل بياناتها الفعلية بعد
                  </span>
                )}
              </h4>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-sm text-right whitespace-nowrap">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5 border-b font-black">عنصر التكلفة</th>
                    <th className="px-4 py-3.5 border-b font-black">المعياري / قطعة (جنيه)</th>
                    <th className="px-4 py-3.5 border-b font-black">الفعلي / قطعة (جنيه)</th>
                    <th className="px-4 py-3.5 border-b font-black">الانحراف (جنيه)</th>
                    <th className="px-4 py-3.5 border-b font-black">نسبة الانحراف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {renderRow(
                    "القماش",
                    analysis.fabric.standardPerPiece,
                    analysis.fabric.actualPerPiece,
                    "costs.view_bom_cost"
                  )}
                  {renderRow(
                    "القص",
                    analysis.cutting?.standardPerPiece || 0,
                    analysis.cutting?.actualPerPiece,
                    "costs.view_labor_cost"
                  )}
                  {renderRow(
                    "الإكسسوارات",
                    analysis.accessories.standardPerPiece,
                    analysis.accessories.actualPerPiece,
                    "costs.view_bom_cost"
                  )}
                  {renderRow(
                    "الطباعة / التطريز",
                    analysis.printEmbroidery.standardPerPiece,
                    analysis.printEmbroidery.actualPerPiece,
                    "costs.view_labor_cost"
                  )}
                  {renderRow(
                    "الخياطة",
                    analysis.sewing.standardPerPiece,
                    analysis.sewing.actualPerPiece,
                    "costs.view_labor_cost"
                  )}
                  {renderRow(
                    "التشطيب",
                    analysis.finishing?.standardPerPiece || 0,
                    analysis.finishing?.actualPerPiece,
                    "costs.view_labor_cost"
                  )}
                  {renderRow(
                    "المكواة",
                    analysis.ironing?.standardPerPiece || 0,
                    analysis.ironing?.actualPerPiece,
                    "costs.view_labor_cost"
                  )}
                  {renderRow(
                    "التكاليف الصناعية غير المباشرة (كهرباء، إيجار، إهلاك، صيانة...)",
                    analysis.overhead?.standardPerPiece || 0,
                    analysis.overhead?.actualPerPiece,
                    "costs.view_overhead"
                  )}

                  {/* Total Row */}
                  <tr className="bg-indigo-50/70 border-t-2 border-indigo-200 font-black">
                    <td className="px-4 py-4 text-slate-900 font-black text-base">
                      إجمالي تكلفة القطعة
                    </td>
                    <td className="px-4 py-4 text-slate-900 font-black text-base font-mono">
                      <SensitiveDataMask 
                        dataKey="costs.view_unit_cost" 
                        value={Number(analysis.totalStandardPerPiece).toFixed(2)} 
                      />
                    </td>
                    <td className="px-4 py-4 text-slate-900 font-black text-base font-mono">
                      {analysis.isActualComplete &&
                      analysis.totalActualPerPiece !== null ? (
                        <SensitiveDataMask 
                          dataKey="costs.view_unit_cost" 
                          value={Number(analysis.totalActualPerPiece).toFixed(2)} 
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      className={`px-4 py-4 font-black text-base font-mono ${getDeviationColor(
                        analysis.deviationValue
                      )}`}
                    >
                      {analysis.deviationValue !== null ? (
                        <SensitiveDataMask 
                          dataKey="costs.view_unit_cost" 
                          value={(analysis.deviationValue > 0 ? "+" : "") + Number(analysis.deviationValue).toFixed(2)} 
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      className={`px-4 py-4 font-black text-base font-mono ${getDeviationColor(
                        analysis.deviationPercentage
                      )}`}
                    >
                      {analysis.deviationPercentage !== null ? (
                        <SensitiveDataMask 
                          dataKey="costs.view_unit_cost" 
                          value={(analysis.deviationPercentage > 0 ? "+" : "") + Number(analysis.deviationPercentage).toFixed(2) + "%"} 
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Stage MOH Overhead Allocation Detail Card */}
            {analysis.overheadAnalysis && (
              <div className="mt-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl border border-indigo-100 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>توزيع التكاليف الصناعية غير المباشرة على مراحل الإنتاج</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          MOH Allocation
                        </span>
                      </h5>
                      <p className="text-xs text-slate-500">
                        تنعكس بدقة في تكلفة الأمر عند اعتماد كل مرحلة تشغيل ميدانية
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md font-bold text-slate-700">
                      المحمل الممتص فعلياً: <strong className="text-indigo-700">{formatCurrency(analysis.overheadAnalysis.absorbedActualOrder)}</strong>
                    </span>
                    <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md font-bold text-slate-700">
                      إجمالي المخطط: <strong className="text-slate-900">{formatCurrency(analysis.overheadAnalysis.totalStandardOrder)}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  {Object.entries(analysis.overheadAnalysis.stageBreakdown).map(([key, item]) => {
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border text-xs transition-all ${
                          item.isApproved
                            ? 'bg-emerald-50/80 border-emerald-200 text-slate-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1.5">
                          <span className="text-slate-900 font-black">{item.stageName}</span>
                          {item.isApproved ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" />
                              معتمد وممتص
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              <Clock className="w-3 h-3" />
                              في انتظار الاعتماد
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between text-slate-500">
                            <span>المعياري / قطعة:</span>
                            <span className="font-bold text-slate-700">{Number(item.standardPerPiece).toFixed(2)} ج.م</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>إجمالي المرحلة:</span>
                            <span className="font-bold text-slate-700">{Number(item.standardTotal).toFixed(2)} ج.م</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200/60 font-bold">
                            <span className={item.isApproved ? "text-emerald-800" : "text-slate-400"}>
                              المحمل الفعلي:
                            </span>
                            <span className={item.isApproved ? "text-emerald-700 font-black" : "text-slate-400 font-medium"}>
                              {item.actualTotal !== null ? `${Number(item.actualTotal).toFixed(2)} ج.م` : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>
                    يتم استيعاب التكاليف غير المباشرة (الكهرباء، الإيجار، الإهلاك) تلقائياً في حسابات تشغيل المرحلة وتنعكس فورياً في كشف تكلفة الأمر وقيود اليومية عند اعتماد كل مرحلة.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
