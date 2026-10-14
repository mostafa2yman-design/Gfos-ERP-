import React, { forwardRef } from 'react';
import { ProductionOrder, BatchItem } from '../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintInstructions, PrintSignatures } from '../print/layout';

interface Props {
  order: ProductionOrder;
  batch: BatchItem;
}

export const SewingWorkOrder = forwardRef<HTMLDivElement, Props>(({ order, batch }, ref) => {
  let requiredTotal = 0;
  let actualTotal = 0;
  batch.sizes.forEach(bs => {
    bs.variants.forEach(v => {
      requiredTotal += (v.quantity || 0);
      const actual = batch.sewingData?.actualQuantities?.find(
        aq => aq.size === bs.size && aq.color === v.color
      )?.actualQuantity;
      if (actual !== undefined && actual !== null) {
        actualTotal += actual;
      }
    });
  });

  const sData = batch.sewingData;
  const sewingGroupName = sData?.manufacturingType === 'تصنيع داخلي' 
    ? (sData.sewingGroup ? `خط داخلي: ${sData.sewingGroup}` : 'تصنيع داخلي')
    : (sData?.externalManufacturer ? `ورشة خارجية: ${sData.externalManufacturer}` : 'تصنيع خارجي');

  return (
    <PrintDocument ref={ref}>
      <PrintHeader
        documentTitle="إيصال تسليم وتشغيل خط الخياطة"
        orderNumber={order.orderNumber}
        modelName={order.styleName}
        clientName={order.customerName}
        category={order.category}
        additionalInfo={[
          { label: 'رقم الباتش', value: batch.batchNumber },
          { label: 'جهة التنفيذ', value: sewingGroupName },
          { label: 'المطلوب المسلم', value: `${requiredTotal} قطعة` }
        ]}
      />

      {/* Operational Instructions for Sewing */}
      <PrintInstructions
        title="تعليمات تشغيل صالة الخياطة"
        instructions={order.sewingInstructions}
        type="quality"
      />

      {/* Sizes & Colors Table */}
      <PrintSection title="جدول تفاصيل كميات الخياطة المسلمة والمستلمة" badge={`المطلوب: ${requiredTotal} | المستلم الفعلي: ${actualTotal > 0 ? actualTotal : 'يدوياً'}`}>
        <table>
          <thead>
            <tr>
              <th className="w-28 text-center">المقاس</th>
              <th>اللون</th>
              <th className="text-center w-36">الكمية المسلمة للخط</th>
              <th className="text-center w-36">الفعلي المستلم التام</th>
              <th className="text-center w-28">عجز / زيادة</th>
              <th className="text-center">ملاحظات الفحص والجودة</th>
            </tr>
          </thead>
          <tbody>
            {batch.sizes.map(size => (
              <React.Fragment key={size.size}>
                {size.variants.map((v, i) => {
                  const actual = sData?.actualQuantities?.find(
                    aq => aq.size === size.size && aq.color === v.color
                  )?.actualQuantity;
                  const diff = actual !== undefined ? actual - v.quantity : null;

                  return (
                    <tr key={`${size.size}-${v.color}`}>
                      {i === 0 && (
                        <td className="font-bold text-center align-middle bg-slate-50" rowSpan={size.variants.length}>
                          {size.size}
                        </td>
                      )}
                      <td className="font-medium">{v.color}</td>
                      <td className="text-center font-bold text-slate-800">{v.quantity}</td>
                      <td className="text-center font-bold text-indigo-900 bg-slate-50/50">
                        {actual !== undefined && actual > 0 ? actual : ''}
                      </td>
                      <td className={`text-center font-bold ${diff !== null ? (diff < 0 ? 'text-red-700' : 'text-emerald-700') : ''}`}>
                        {diff !== null ? (diff > 0 ? `+${diff}` : diff) : ''}
                      </td>
                      <td className="text-center text-slate-400 text-[8.5px]"></td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-700 text-slate-900">
              <td colSpan={2}>الإجمالي:</td>
              <td className="text-center text-indigo-950 font-black">{requiredTotal}</td>
              <td className="text-center text-indigo-950 font-black">{actualTotal > 0 ? actualTotal : ''}</td>
              <td className="text-center">{actualTotal > 0 ? (actualTotal - requiredTotal) : ''}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      {/* Signatures */}
      <PrintSignatures 
        title="توقيعات واعتمادات تسليم وتشغيل الخياطة"
        signatures={[
          { role: "المُسلِّم (إدارة الإنتاج / التجهيز)" },
          { role: "المُستلِم (مسئول خط / ورشة الخياطة)" },
          { role: "مراقب جودة الخياطة" },
          { 
            role: "اعتماد إدارة الصالة",
            name: sData?.approvedBy,
            date: sData?.approvedAt,
            isApproved: !!sData?.approvedBy
          }
        ]} 
      />
    </PrintDocument>
  );
});

SewingWorkOrder.displayName = 'SewingWorkOrder';
