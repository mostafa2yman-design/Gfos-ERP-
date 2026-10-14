import React, { forwardRef } from 'react';
import { ProductionOrder, BatchItem } from '../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintInstructions, PrintSignatures } from '../print/layout';

interface Props {
  order: ProductionOrder;
  batch: BatchItem;
}

export const PrintEmbroideryWorkOrder = forwardRef<HTMLDivElement, Props>(({ order, batch }, ref) => {
  let totalQuantity = 0;
  batch.sizes.forEach(s => s.variants.forEach(v => totalQuantity += (v.quantity || 0)));
  
  return (
    <PrintDocument ref={ref}>
      <PrintHeader
        documentTitle={`أمر تشغيل — ${batch.executionType || 'الطباعة والتطريز'}`}
        orderNumber={order.orderNumber}
        modelName={order.styleName}
        clientName={order.customerName}
        category={order.category}
        additionalInfo={[
          { label: 'رقم الباتش', value: batch.batchNumber },
          { label: 'نوع التنفيذ', value: batch.executionType || 'بدون طباعة / تطريز' },
          { label: 'إجمالي الكمية', value: `${totalQuantity} قطعة` }
        ]}
      />

      {/* Technical Specifications for Print/Embroidery */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {(batch.executionType === 'طباعة' || batch.executionType === 'طباعة + تطريز') && batch.printDetails && (
          <div className="p-2.5 border-2 border-slate-700 bg-slate-50 rounded text-[10px] break-inside-avoid">
            <h4 className="font-bold border-b border-slate-300 pb-1 mb-1.5 text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-indigo-600 rounded-full inline-block"></span>
              بيانات ومواصفات الطباعة:
            </h4>
            <div className="space-y-1">
              <div><span className="font-bold text-slate-700">اسم التصميم:</span> {batch.printDetails.designName}</div>
              <div><span className="font-bold text-slate-700">المكان / الموضع:</span> {batch.printDetails.placement}</div>
              <div><span className="font-bold text-slate-700">ألوان الطباعة:</span> {batch.printDetails.colors} ({batch.printDetails.colorCount} لون)</div>
            </div>
          </div>
        )}
        
        {(batch.executionType === 'تطريز' || batch.executionType === 'طباعة + تطريز') && batch.embroideryDetails && (
          <div className="p-2.5 border-2 border-slate-700 bg-slate-50 rounded text-[10px] break-inside-avoid">
            <h4 className="font-bold border-b border-slate-300 pb-1 mb-1.5 text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-600 rounded-full inline-block"></span>
              بيانات ومواصفات التطريز:
            </h4>
            <div className="space-y-1">
              <div><span className="font-bold text-slate-700">اسم التصميم:</span> {batch.embroideryDetails.designName}</div>
              <div><span className="font-bold text-slate-700">المكان / الموضع:</span> {batch.embroideryDetails.placement}</div>
              <div><span className="font-bold text-slate-700">ألوان الخيوط:</span> {batch.embroideryDetails.threadColors} ({batch.embroideryDetails.colorCount} لون)</div>
            </div>
          </div>
        )}
      </div>

      {/* Operational Instructions */}
      <PrintInstructions
        title="تعليمات تشغيل الطباعة / التطريز"
        instructions={[
          batch.printDetails?.notes ? `ملاحظات الطباعة: ${batch.printDetails.notes}` : '',
          batch.embroideryDetails?.notes ? `ملاحظات التطريز: ${batch.embroideryDetails.notes}` : '',
        ].filter(Boolean)}
        type="quality"
      />

      {/* Batch Sizes and Quantities */}
      <PrintSection title="جدول المقاسات والألوان للتشغيل" badge={`الكمية: ${totalQuantity} قطعة`}>
        <table>
          <thead>
            <tr>
              <th className="w-28 text-center">المقاس</th>
              <th>اللون</th>
              <th className="w-36 text-center">الكمية المسلمة</th>
              <th className="w-36 text-center">الكمية المطبوعة/المطرزة</th>
              <th className="w-32 text-center">التوالف / الهالك</th>
              <th className="text-center">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {batch.sizes.map(size => (
              <React.Fragment key={size.size}>
                {size.variants.map((v, vIdx) => (
                  <tr key={`${size.size}-${v.color}`}>
                    {vIdx === 0 && (
                      <td rowSpan={size.variants.length} className="font-bold text-center align-middle bg-slate-50">
                        {size.size}
                      </td>
                    )}
                    <td className="font-medium">{v.color}</td>
                    <td className="text-center font-bold text-slate-800">{v.quantity}</td>
                    <td className="text-center font-bold text-indigo-900">{v.quantity}</td>
                    <td className="text-center text-slate-400"></td>
                    <td className="text-center text-slate-400 text-[8.5px]"></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-700 text-slate-900">
              <td colSpan={2}>إجمالي الباتش:</td>
              <td className="font-black text-center text-indigo-950">{totalQuantity}</td>
              <td className="font-black text-center text-indigo-950">{totalQuantity}</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      {/* Signatures */}
      <PrintSignatures 
        title="توقيعات واعتمادات مرحلة الطباعة والتطريز"
        signatures={[
          { role: "فني ومسئول التنفيذ" },
          { role: "فاحص الجودة الفنية" },
          { role: "المستلم (صالة الخياطة)" },
          { 
            role: "اعتماد إدارة التشغيل",
            name: batch.printApprovedBy || order.printEmbroideryApprovedBy,
            date: batch.printApprovedAt || order.printEmbroideryApprovedAt,
            isApproved: !!(batch.printApprovedBy || order.printEmbroideryApprovedBy)
          }
        ]} 
      />
    </PrintDocument>
  );
});

PrintEmbroideryWorkOrder.displayName = 'PrintEmbroideryWorkOrder';
