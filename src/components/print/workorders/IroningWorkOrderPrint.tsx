import React, { forwardRef } from 'react';
import { ProductionOrder } from '../../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintInstructions, PrintSignatures } from '../layout';

interface Props {
  order: ProductionOrder;
}

export const IroningWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order }, ref) => {
  // Calculate total finishing received
  let totalFinishingReceived = 0;
  order.batches?.forEach(b => {
    const quantities = b.finishingData?.actualQuantities || b.sewingData?.actualQuantities || [];
    quantities.forEach(q => {
      totalFinishingReceived += (q.actualQuantity || q.quantity || 0);
    });
  });

  return (
    <PrintDocument ref={ref}>
      <PrintHeader
        documentTitle="أمر تشغيل مرحلة المكواة والبخار"
        orderNumber={order.orderNumber}
        modelName={order.styleName}
        clientName={order.customerName}
        category={order.category}
        status={order.status}
        additionalInfo={[
          { label: 'عدد الباتشات', value: `${order.batches?.length || 0} باتش` },
          { label: 'إجمالي المستلم من التشطيب', value: `${totalFinishingReceived} قطعة` }
        ]}
      />

      {/* Operational Instructions for Ironing */}
      <PrintInstructions
        title="تعليمات تشغيل مرحلة المكواة"
        instructions={order.ironingInstructions || order.finishingInstructions}
      />

      {/* Ironing Execution Table */}
      <PrintSection title="جدول متابعة أعداد المكواة حسب الباتشات" badge={`المستلم: ${totalFinishingReceived} قطعة`}>
        <table>
          <thead>
            <tr>
              <th className="w-20 text-center">الباتش</th>
              <th className="w-24 text-center">المقاس</th>
              <th>اللون</th>
              <th className="w-28 text-center">المستلم من التشطيب</th>
              <th className="w-24 text-center">المكوي التام (سليم)</th>
              <th className="w-20 text-center">إعادة كي</th>
              <th className="w-20 text-center">هالك / تالف</th>
              <th className="text-center">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {order.batches && order.batches.length > 0 ? (
              order.batches.map(batch => {
                const quantities = batch.ironingData?.actualQuantities?.length
                  ? batch.ironingData.actualQuantities
                  : (batch.finishingData?.actualQuantities || batch.sewingData?.actualQuantities || []);
                
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
                        {batch.ironingData?.status === 'مكتمل' ? receivedQty : ''}
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
                <td colSpan={8} className="text-center text-slate-500 py-2">لا توجد بيانات مكواة مسجلة</td>
              </tr>
            )}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-700 text-slate-900">
              <td colSpan={3}>الإجمالي العام:</td>
              <td className="text-center text-indigo-950 font-black">{totalFinishingReceived}</td>
              <td className="text-center text-emerald-950 font-black">
                {order.batches?.every(b => b.ironingData?.status === 'مكتمل') ? totalFinishingReceived : ''}
              </td>
              <td colSpan={3}></td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      {/* Signatures */}
      <PrintSignatures 
        title="توقيعات واعتمادات صالة المكواة والبخار"
        signatures={[
          { role: "مستلم التشطيب" },
          { role: "مسئول صالة المكواة" },
          { role: "مراقب الجودة" },
          { role: "المستلم (صالة التغليف والتجهيز)" }
        ]} 
      />
    </PrintDocument>
  );
});

IroningWorkOrderPrint.displayName = 'IroningWorkOrderPrint';
