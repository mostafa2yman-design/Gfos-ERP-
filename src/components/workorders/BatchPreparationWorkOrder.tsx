import React from 'react';
import { ProductionOrder, BatchItem } from '../../types';
import { calculateBatchAccessories } from '../../lib/prepUtils';
import { CheckSquare, Square } from 'lucide-react';
import { PrintDocument, PrintHeader, PrintSection, PrintInstructions, PrintSignatures } from '../print/layout';

interface Props {
  order: ProductionOrder;
  batch: BatchItem;
}

export const BatchPreparationWorkOrder: React.FC<Props> = ({ order, batch }) => {
  const accessories = calculateBatchAccessories(order, batch);
  
  let totalBatchQty = 0;
  batch.sizes.forEach(s => {
    s.variants.forEach(v => {
      totalBatchQty += v.quantity;
    });
  });

  return (
    <PrintDocument>
      <PrintHeader
        documentTitle="أمر تشغيل وتجهيز باتش"
        orderNumber={order.orderNumber}
        modelName={order.styleName}
        clientName={order.customerName}
        category={order.category}
        additionalInfo={[
          { label: 'رقم الباتش', value: batch.batchNumber },
          { label: 'حالة التجهيز', value: batch.prepStatus || 'جاري' },
          { label: 'إجمالي كمية الباتش', value: `${totalBatchQty} قطعة` }
        ]}
      />

      {/* Operational Instructions for Prep */}
      {order.cuttingInstructions && (
        <PrintInstructions
          title="تعليمات التشغيل وملاحظات الأقسام"
          instructions={order.cuttingInstructions}
        />
      )}

      {/* 1. Batch Sizes and Quantities */}
      <PrintSection title="1. بيان كميات المقاسات والألوان للباتش" badge={`إجمالي الباتش: ${totalBatchQty} قطعة`}>
        <table>
          <thead>
            <tr>
              <th className="w-28 text-center">المقاس</th>
              <th>اللون</th>
              <th className="text-center w-36">الكمية المقررة للباتش</th>
              <th className="text-center w-36">الكمية المسلمة فعلياً</th>
              <th className="text-center">ملاحظات الفحص</th>
            </tr>
          </thead>
          <tbody>
            {batch.sizes.map((s) => (
              <React.Fragment key={s.size}>
                {s.variants.map((v, i) => (
                  <tr key={`${s.size}-${v.color}`}>
                    {i === 0 && (
                      <td className="font-bold text-center align-middle bg-slate-50" rowSpan={s.variants.length}>
                        {s.size}
                      </td>
                    )}
                    <td className="font-medium">{v.color}</td>
                    <td className="font-bold text-center text-slate-900">{v.quantity}</td>
                    <td className="font-bold text-center text-indigo-900">{v.quantity}</td>
                    <td className="text-center text-slate-400 text-[8.5px]"></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-700 text-slate-900">
              <td colSpan={2}>إجمالي الباتش:</td>
              <td className="text-center text-indigo-950 font-black">{totalBatchQty}</td>
              <td className="text-center text-indigo-950 font-black">{totalBatchQty}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      {/* 2. Accessories & Trims */}
      <PrintSection title="2. جدول مستلزمات وإكسسوارات الباتش المطلوبة والصرف الفعلي" avoidBreak>
        {accessories.length > 0 ? (
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
              {accessories.map(acc => {
                const roundedRequired = acc.requiredForBatch % 1 === 0 
                  ? acc.requiredForBatch 
                  : Number(Number(acc.requiredForBatch).toFixed(3));
                const perPiece = acc.standardPerPiece ? `${acc.standardPerPiece} (${acc.unit})` : '—';
                
                return (
                  <tr key={acc.accessoryId || acc.accessoryName}>
                    <td className="font-semibold">{acc.accessoryName}</td>
                    <td className="font-medium text-slate-800">{acc.actualAccessoryName || acc.accessoryName}</td>
                    <td className="text-center text-slate-700">{perPiece}</td>
                    <td className="text-center font-bold text-indigo-950 bg-slate-50/50">{roundedRequired}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 italic text-[9.5px] p-2 bg-slate-50 border border-slate-200 rounded">
            لا توجد إكسسوارات مسجلة لهذا الأمر.
          </p>
        )}
      </PrintSection>

      {/* Signatures */}
      <PrintSignatures 
        title="توقيعات واعتمادات مرحلة التجهيز"
        signatures={[
          { role: "مسئول تجهيز الإكسسوارات" },
          { role: "أمين مخزن المستلزمات" },
          { role: "استلام مسئول الخط / الخياطة" },
          { 
            role: "اعتماد إدارة التجهيز والإنتاج",
            name: batch.prepApprovedBy || order.prepApprovedBy,
            date: batch.prepApprovedAt || order.prepApprovedAt,
            isApproved: !!(batch.prepApprovedBy || order.prepApprovedBy)
          }
        ]} 
      />
    </PrintDocument>
  );
};
