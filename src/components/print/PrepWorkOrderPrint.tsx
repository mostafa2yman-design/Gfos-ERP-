import React, { forwardRef } from 'react';
import { ProductionOrder } from '../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintInstructions, PrintSignatures } from './layout';

interface Props {
  order: ProductionOrder;
}

export const PrepWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order }, ref) => {
  return (
    <PrintDocument ref={ref}>
      <PrintHeader
        documentTitle="أمر تشغيل تجهيز شامل للأوردر"
        orderNumber={order.orderNumber}
        modelName={order.styleName}
        clientName={order.customerName}
        category={order.category}
        additionalInfo={[
          { label: 'عدد الباتشات', value: `${order.batches?.length || 0} باتش` },
          { label: 'طريقة التقسيم', value: order.batchSplitMethod || 'حسب اللون' }
        ]}
      />

      <PrintInstructions
        title="تعليمات تجهيز المستلزمات والصرف لجميع الباتشات"
        instructions={[
          'مراجعة كود ولون الإكسسوارات والمطابقة مع عينة البروفا المعتمدة من العميل.',
          'صرف مستلزمات كل باتش بصورة منفصلة مع توثيق اسم ورقم الباتش بوضوح.',
          'تسجيل الكميات المنصرفة والمتبقية في سجلات مخزن المستلزمات.'
        ]}
      />

      <PrintSection title="بيانات الباتشات ومستلزمات التجهيز">
        {order.batches?.map((batch) => {
          let batchQty = 0;
          batch.sizes.forEach(s => s.variants.forEach(v => batchQty += (v.quantity || 0)));

          return (
            <div key={batch.id} className="mb-4 break-inside-avoid">
              <div className="flex justify-between items-center mb-1.5 bg-slate-100 p-1.5 px-3 rounded border border-slate-300 text-[10.5px]">
                <span className="font-bold text-slate-900">باتش رقم: {batch.batchNumber}</span>
                <span className="text-slate-700">المقاسات: {batch.sizes.map(s => s.size).join(', ')}</span>
                <span className="font-bold text-indigo-950">الكمية: {batchQty} قطعة</span>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>اسم الاكسسوار او الصنف المطلوب</th>
                    <th>الاكسسوار الفعلى المنصرف</th>
                    <th className="text-center w-28">المطلوب للقطعه</th>
                    <th className="text-center w-32">العدد المطلوب تجهيزه</th>
                  </tr>
                </thead>
                <tbody>
                  {order.accessories && order.accessories.length > 0 ? (
                    order.accessories.map((acc, i) => {
                      const prepItem = batch.accessoriesPrep?.find(p => p.accessoryId === acc.id || p.accessoryName === acc.name);
                      const actualName = prepItem?.actualAccessoryName || acc.name;
                      const standardPerPiece = acc.standardMethod === 'موحد' ? `${acc.unifiedStandard} (${acc.unit})` : 'حسب المقاس';
                      const requiredTotal = acc.standardMethod === 'موحد' ? (acc.unifiedStandard * batchQty).toFixed(2) : '—';

                      return (
                        <tr key={i}>
                          <td className="font-semibold">{acc.name}</td>
                          <td className="font-medium text-slate-800">{actualName}</td>
                          <td className="text-center text-slate-700">{standardPerPiece}</td>
                          <td className="text-center font-bold text-indigo-950 bg-slate-50/50">{requiredTotal}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-slate-500 py-1.5">لا توجد إكسسوارات مسجلة</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
      </PrintSection>

      <PrintSignatures 
        signatures={[
          { role: "مسئول التجهيز" },
          { role: "أمين مخزن المستلزمات" },
          { role: "مراقب الجودة" },
          { 
            role: "اعتماد إدارة التجهيز",
            name: order.prepApprovedBy,
            date: order.prepApprovedAt,
            isApproved: !!order.prepApprovedBy
          }
        ]} 
      />
    </PrintDocument>
  );
});

PrepWorkOrderPrint.displayName = 'PrepWorkOrderPrint';
