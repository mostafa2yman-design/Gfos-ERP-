import React, { forwardRef } from 'react';
import { ProductionOrder } from '../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintInstructions, PrintSignatures } from './layout';

interface Props {
  order: ProductionOrder;
  showInPreview?: boolean;
}

export const ProductionOrderPrint = forwardRef<HTMLDivElement, Props>(({ order, showInPreview }, ref) => {
  // Extract unique sizes and colors for the matrix table
  const sizesList = order.sizes.map(s => s.size);
  const colorsSet = new Set<string>();
  order.sizes.forEach(s => s.variants.forEach(v => colorsSet.add(v.color)));
  const colorsList = Array.from(colorsSet);

  // Grand total calculation
  let grandTotalQty = 0;
  order.sizes.forEach(s => s.variants.forEach(v => {
    grandTotalQty += Number(v.quantity) || 0;
  }));

  return (
    <PrintDocument ref={ref} showInPreview={showInPreview}>
      <PrintHeader
        documentTitle="أمر إنتاج وتشغيل رئيسي"
        orderNumber={order.orderNumber}
        date={order.orderDate}
        modelName={order.styleName}
        clientName={order.customerName}
        category={order.category}
        status={order.status}
        additionalInfo={[
          { label: 'إجمالي الكمية', value: `${grandTotalQty.toLocaleString('ar-EG')} قطعة` },
          { label: 'سعر البيع المستهدف', value: order.sellingPrice ? `${order.sellingPrice.toLocaleString('ar-EG')} ج.م` : 'غير محدد' },
        ]}
      />

      {/* 1. Size & Color Distribution Matrix Table */}
      <PrintSection title="1. بيان توزيع الكميات (المقاسات والألوان)" badge={`إجمالي: ${grandTotalQty} قطعة`}>
        <table>
          <thead>
            <tr>
              <th className="w-32 bg-slate-200">اللون / المقاس</th>
              {sizesList.map(sz => (
                <th key={sz} className="text-center">{sz}</th>
              ))}
              <th className="text-center bg-slate-200 w-24">إجمالي اللون</th>
            </tr>
          </thead>
          <tbody>
            {colorsList.map(color => {
              let colorSum = 0;
              return (
                <tr key={color}>
                  <td className="font-bold bg-slate-50">{color}</td>
                  {sizesList.map(sz => {
                    const sizeObj = order.sizes.find(s => s.size === sz);
                    const vObj = sizeObj?.variants.find(v => v.color === color);
                    const qty = vObj ? Number(vObj.quantity) || 0 : 0;
                    colorSum += qty;
                    return (
                      <td key={sz} className="text-center">
                        {qty > 0 ? qty.toLocaleString('ar-EG') : '—'}
                      </td>
                    );
                  })}
                  <td className="text-center font-bold bg-slate-100 text-indigo-900">
                    {colorSum.toLocaleString('ar-EG')}
                  </td>
                </tr>
              );
            })}
            {/* Totals by Size Row */}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-700">
              <td className="bg-slate-200">إجمالي المقاس</td>
              {sizesList.map(sz => {
                const sizeObj = order.sizes.find(s => s.size === sz);
                const sizeSum = sizeObj?.variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0) || 0;
                return (
                  <td key={sz} className="text-center text-indigo-900">
                    {sizeSum.toLocaleString('ar-EG')}
                  </td>
                );
              })}
              <td className="text-center bg-slate-300 font-black text-indigo-950 text-[11px]">
                {grandTotalQty.toLocaleString('ar-EG')}
              </td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      {/* 2. Materials & Accessories (BOM) */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Fabrics & Raw Materials */}
        <PrintSection title="2. جدول الخامات واستهلاك الأقمشة (BOM)" avoidBreak>
          <table>
            <thead>
              <tr>
                <th>الخامة</th>
                <th className="text-center w-14">الوحدة</th>
                <th className="text-center w-24">طريقة الاستهلاك</th>
                <th className="text-center w-20">المعدل / المعيار</th>
              </tr>
            </thead>
            <tbody>
              {order.materials && order.materials.length > 0 ? (
                order.materials.map(m => (
                  <tr key={m.id || m.name}>
                    <td className="font-semibold">{m.name}</td>
                    <td className="text-center text-slate-600">{m.unit}</td>
                    <td className="text-center text-[8.5px]">{m.standardMethod === 'موحد' ? 'معيار موحد' : 'حسب المقاس'}</td>
                    <td className="text-center font-bold text-slate-800">
                      {m.standardMethod === 'موحد' ? m.unifiedStandard : 'متعدد'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-slate-500 py-1.5">لا توجد خامات مسجلة لهذا الأمر</td>
                </tr>
              )}
            </tbody>
          </table>
        </PrintSection>

        {/* Accessories */}
        <PrintSection title="3. مستلزمات الإنتاج والإكسسوارات" avoidBreak>
          <table>
            <thead>
              <tr>
                <th>الصنف</th>
                <th className="text-center w-14">الوحدة</th>
                <th className="text-center w-24">طريقة الاستهلاك</th>
                <th className="text-center w-20">المعدل / المعيار</th>
              </tr>
            </thead>
            <tbody>
              {order.accessories && order.accessories.length > 0 ? (
                order.accessories.map(acc => (
                  <tr key={acc.id || acc.name}>
                    <td className="font-semibold">{acc.name}</td>
                    <td className="text-center text-slate-600">{acc.unit}</td>
                    <td className="text-center text-[8.5px]">{acc.standardMethod === 'موحد' ? 'معيار موحد' : 'حسب المقاس'}</td>
                    <td className="text-center font-bold text-slate-800">
                      {acc.standardMethod === 'موحد' ? acc.unifiedStandard : 'متعدد'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-slate-500 py-1.5">لا توجد إكسسوارات مسجلة لهذا الأمر</td>
                </tr>
              )}
            </tbody>
          </table>
        </PrintSection>
      </div>

      {/* Operational Instructions for Departments */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <PrintInstructions
          title="ملاحظات قص"
          instructions={order.cuttingInstructions}
        />
        <PrintInstructions
          title="ملاحظات خياطة"
          instructions={order.sewingInstructions}
        />
        <PrintInstructions
          title="ملاحظات تشطيب"
          instructions={order.finishingInstructions}
        />
        <PrintInstructions
          title="ملاحظات تغليف وتخزين"
          instructions={order.packingInstructions}
        />
      </div>

      {/* 5. Signatures and Approvals */}
      <PrintSignatures
        title="الاعتمادات والتوقيعات الإدارية والفنية"
        signatures={[
          {
            role: "تخطيط ومتابعة الإنتاج",
            name: order.productionApprovedBy,
            date: order.productionApprovedAt,
            isApproved: !!order.productionApprovedBy
          },
          {
            role: "مسئول الخامات والمخازن",
            name: order.materialsApprovedBy,
            date: order.materialsApprovedAt,
            isApproved: !!order.materialsApprovedBy
          },
          {
            role: "مراقب الجودة الصناعية"
          },
          {
            role: "مدير عام المصنع / الاعتماد"
          }
        ]}
      />
    </PrintDocument>
  );
});

ProductionOrderPrint.displayName = 'ProductionOrderPrint';
