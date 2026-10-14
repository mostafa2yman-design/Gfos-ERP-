import React, { forwardRef } from 'react';
import { ProductionOrder } from '../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintInstructions, PrintSignatures } from './layout';

interface Props {
  order: ProductionOrder;
  fabricSummary?: any;
}

export const CutWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order, fabricSummary }, ref) => {
  const primaryFabric = fabricSummary?.primaryFabric;
  const requiredFabricName = primaryFabric?.item || (order.materials && order.materials.length > 0 ? order.materials[0].name : '—');
  
  // Calculate planned and actual total quantities
  let totalPlanned = 0;
  let totalActual = 0;
  order.sizes.forEach((size) => {
    size.variants.forEach((v) => {
      const planned = v.quantity || 0;
      totalPlanned += planned;
      const actual = order.cutData?.sizes
        ?.find(s => s.size === size.size)
        ?.variants.find(av => av.color === v.color)?.actualQuantity;
      if (actual !== undefined && actual !== null) {
        totalActual += actual;
      }
    });
  });

  return (
    <PrintDocument ref={ref}>
      <PrintHeader
        documentTitle="أمر تشغيل صالة القص"
        orderNumber={order.orderNumber}
        modelName={order.styleName}
        clientName={order.customerName}
        category={order.category}
        status={order.status}
        additionalInfo={[
          { label: 'رقم أمر القص', value: order.cutData?.cutOrderNumber || '—' },
          { label: 'القائم بالقص', value: order.cutData?.cutterName || 'لم يحدد' },
          { label: 'خامة القماش المطلوبة', value: requiredFabricName },
          { label: 'الخامة الفعلية المستخدمة', value: order.cutData?.actualFabricName || 'لم تحدد بعد' },
          { label: 'إجمالي المخطط', value: `${totalPlanned} قطعة` }
        ]}
      />

      {/* Operational Instructions for Cutting */}
      <PrintInstructions
        title="تعليمات تشغيل صالة القص"
        instructions={order.cuttingInstructions}
        type="quality"
      />

      {/* Size and Color Planned vs Actual Table */}
      <PrintSection title="جدول تفاصيل القص (المقاسات والألوان المخططة والفعلية)" badge={`مخطط: ${totalPlanned} | فعلي: ${totalActual > 0 ? totalActual : 'يدوياً'}`}>
        <table>
          <thead>
            <tr>
              <th className="w-24 text-center">المقاس</th>
              <th>اللون</th>
              <th className="text-center w-28">المطلوب المخطط</th>
              <th className="text-center w-36">القص الفعلي المستلم</th>
              <th className="text-center w-28">الفرق / العجز</th>
              <th className="text-center">ملاحظات الفحص</th>
            </tr>
          </thead>
          <tbody>
            {order.sizes.map((size) => (
              <React.Fragment key={size.size}>
                {size.variants.map((v: any, i) => {
                  const planned = v.quantity || 0;
                  const actual = order.cutData?.sizes
                    ?.find(s => s.size === size.size)
                    ?.variants.find(av => av.color === v.color)?.actualQuantity;
                  const diff = actual !== undefined ? actual - planned : null;

                  return (
                    <tr key={`${size.size}-${v.color}`}>
                      {i === 0 && (
                        <td className="font-bold text-center align-middle bg-slate-50" rowSpan={size.variants.length}>
                          {size.size}
                        </td>
                      )}
                      <td className="font-medium">{v.color}</td>
                      <td className="text-center font-bold text-slate-800">{planned}</td>
                      <td className="text-center font-bold text-indigo-900 text-[11px] bg-slate-50/50">
                        {actual !== undefined ? actual : ''}
                      </td>
                      <td className={`text-center font-bold ${diff !== null ? (diff < 0 ? 'text-red-700' : 'text-emerald-700') : ''}`}>
                        {diff !== null ? (diff > 0 ? `+${diff}` : diff) : '—'}
                      </td>
                      <td className="text-center text-slate-400 text-[8.5px]"></td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            {/* Totals Row */}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-700 text-slate-900">
              <td colSpan={2} className="text-right">الإجمالي العام:</td>
              <td className="text-center text-indigo-950 font-black">{totalPlanned}</td>
              <td className="text-center text-indigo-950 font-black">{totalActual > 0 ? totalActual : ''}</td>
              <td className="text-center">{totalActual > 0 ? (totalActual - totalPlanned) : ''}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      {/* Fabric Weights Table */}
      {fabricSummary && fabricSummary.colors && fabricSummary.colors.length > 0 && (
        <PrintSection title="بيان أوزان واستهلاك الأقمشة حسب اللون" avoidBreak>
          <table>
            <thead>
              <tr>
                <th>اللون</th>
                <th className="text-center">الوزن المعياري ({primaryFabric?.unit || 'كجم'})</th>
                <th className="text-center w-1/3">الوزن الفعلي ({primaryFabric?.unit || 'كجم'})</th>
                <th className="text-center w-36">فرق الوزن (الهالك)</th>
              </tr>
            </thead>
            <tbody>
              {fabricSummary.colors.map((c: any) => {
                const weight = order.cutData?.actualWeightByColor?.[c.color];
                const reqFabric = c.requiredFabric || 0;
                const diffWeight = weight !== undefined ? (weight - reqFabric).toFixed(2) : null;

                return (
                  <tr key={c.color}>
                    <td className="font-semibold">{c.color}</td>
                    <td className="text-center text-slate-700">{reqFabric ? reqFabric.toFixed(3) : '—'}</td>
                    <td className="text-center font-bold text-slate-900">{weight !== undefined ? weight : ''}</td>
                    <td className="text-center text-slate-700">{diffWeight !== null ? `${diffWeight}` : '—'}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-100 font-bold text-slate-900">
                <td>الإجمالي الكلي:</td>
                <td className="text-center text-indigo-900">{fabricSummary?.totalRequiredFabric ? fabricSummary.totalRequiredFabric.toFixed(3) : '—'}</td>
                <td className="text-center text-indigo-900">{order.cutData?.actualWeight !== undefined ? order.cutData.actualWeight : ''}</td>
                <td className="text-center"></td>
              </tr>
            </tbody>
          </table>
        </PrintSection>
      )}

      {/* Signatures */}
      <PrintSignatures 
        title="توقيعات واعتمادات صالة القص"
        signatures={[
          { role: "أمين مخزن الأقمشة" },
          { role: "فني ومسئول القص", name: order.cutData?.cutterName },
          { role: "مراقب الجودة" },
          { 
            role: "مدير الصالة / الاعتماد", 
            name: order.cutApprovedBy || order.cutData?.approvedBy,
            date: order.cutApprovedAt || order.cutData?.approvedAt,
            isApproved: !!(order.cutApprovedBy || order.cutData?.approvedBy)
          }
        ]} 
      />
    </PrintDocument>
  );
});

CutWorkOrderPrint.displayName = 'CutWorkOrderPrint';
