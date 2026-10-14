import React, { forwardRef } from 'react';
import { ProductionOrder } from '../../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintInstructions, PrintSignatures } from '../layout';

interface Props {
  order: ProductionOrder;
}

export const FinishingWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order }, ref) => {
  // Calculate total sewing received
  let totalSewingReceived = 0;
  order.batches?.forEach(b => {
    b.sewingData?.actualQuantities?.forEach(sq => {
      totalSewingReceived += (sq.actualQuantity || sq.quantity || 0);
    });
  });

  return (
    <PrintDocument ref={ref}>
      <PrintHeader
        documentTitle="أمر تشغيل مرحلة التشطيب والفرز"
        orderNumber={order.orderNumber}
        modelName={order.styleName}
        clientName={order.customerName}
        category={order.category}
        status={order.status}
        additionalInfo={[
          { label: 'عدد الباتشات', value: `${order.batches?.length || 0} باتش` },
          { label: 'إجمالي المستلم من الخياطة', value: `${totalSewingReceived} قطعة` }
        ]}
      />

      {/* Operational Instructions for Finishing */}
      <PrintInstructions
        title="تعليمات تشغيل مرحلة التشطيب"
        instructions={order.finishingInstructions}
      />

      {/* Finishing Execution Table */}
      <PrintSection title="جدول متابعة أعداد التشطيب والفرز حسب الباتشات" badge={`المستلم: ${totalSewingReceived} قطعة`}>
        <table>
          <thead>
            <tr>
              <th className="w-20 text-center">الباتش</th>
              <th className="w-24 text-center">المقاس</th>
              <th>اللون</th>
              <th className="w-28 text-center">المستلم من الخياطة</th>
              <th className="w-24 text-center">فرز أول (مقبول)</th>
              <th className="w-20 text-center">فرز ثاني</th>
              <th className="w-20 text-center">هالك / تالف</th>
              <th className="text-center">ملاحظات الفاحص</th>
            </tr>
          </thead>
          <tbody>
            {order.batches && order.batches.length > 0 ? (
              order.batches.map(batch => {
                const quantities = batch.finishingData?.actualQuantities?.length
                  ? batch.finishingData.actualQuantities
                  : (batch.sewingData?.actualQuantities || []);
                
                if (quantities.length === 0) return null;

                return quantities.map((sq, idx) => {
                  const receivedQty = sq.actualQuantity || sq.quantity || 0;
                  return (
                    <tr key={`${batch.id}-${idx}`}>
                      {idx === 0 && (
                        <td 
                          className="font-bold text-center align-middle bg-slate-50" 
                          rowSpan={quantities.length}
                        >
                          {batch.batchNumber}
                        </td>
                      )}
                      <td className="text-center font-bold">{sq.size}</td>
                      <td>{sq.color}</td>
                      <td className="text-center font-bold text-slate-900 bg-slate-50/50">{receivedQty}</td>
                      <td className="text-center font-bold text-emerald-800">
                        {batch.finishingData?.status === 'مكتمل' ? receivedQty : ''}
                      </td>
                      <td className="text-center text-amber-800"></td>
                      <td className="text-center text-red-800"></td>
                      <td className="text-center text-slate-400 text-[8.5px]"></td>
                    </tr>
                  );
                });
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center text-slate-500 py-2">لا توجد بيانات تشطيب مسجلة</td>
              </tr>
            )}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-700 text-slate-900">
              <td colSpan={3}>الإجمالي العام:</td>
              <td className="text-center text-indigo-950 font-black">{totalSewingReceived}</td>
              <td className="text-center text-emerald-950 font-black">
                {order.batches?.every(b => b.finishingData?.status === 'مكتمل') ? totalSewingReceived : ''}
              </td>
              <td colSpan={3}></td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      {/* Signatures */}
      <PrintSignatures 
        title="توقيعات واعتمادات صالة التشطيب والفرز"
        signatures={[
          { role: "مستلم الخياطة / أمين المخزن" },
          { role: "مسئول صالة التشطيب" },
          { role: "مراقب الجودة والفرز" },
          { role: "المستلم (مسئول صالة المكواة)" }
        ]} 
      />
    </PrintDocument>
  );
});

FinishingWorkOrderPrint.displayName = 'FinishingWorkOrderPrint';
