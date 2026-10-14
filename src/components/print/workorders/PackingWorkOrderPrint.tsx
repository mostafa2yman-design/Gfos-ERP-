import React, { forwardRef } from 'react';
import { ProductionOrder, PackingInvoice } from '../../../types';
import { PrintDocument, PrintHeader, PrintSection, PrintInstructions, PrintSignatures } from '../layout';

interface Props {
  order: ProductionOrder;
  invoices: PackingInvoice[];
}

export const PackingWorkOrderPrint = forwardRef<HTMLDivElement, Props>(({ order, invoices }, ref) => {
  const uniqueSizes = order.sizes.map(s => s.size) || [];
  const uniqueColors = Array.from(new Set(order.sizes.flatMap(s => s.variants.map(v => v.color)) || []));

  // Calculate total packed across all invoices
  let grandTotalPacked = 0;
  invoices.forEach(inv => {
    inv.variants.forEach(v => {
      grandTotalPacked += (v.quantity || 0);
    });
  });

  return (
    <PrintDocument ref={ref}>
      <PrintHeader
        documentTitle="أمر تشغيل التغليف وتجهيز الشحنات"
        orderNumber={order.orderNumber}
        modelName={order.styleName}
        clientName={order.customerName}
        category={order.category}
        status={order.status}
        additionalInfo={[
          { label: 'عدد الفواتير/الإذون', value: `${invoices.length} إذن` },
          { label: 'إجمالي المجهز للتسليم', value: `${grandTotalPacked} قطعة` }
        ]}
      />

      {/* Operational Instructions for Packing */}
      <PrintInstructions
        title="تعليمات تشغيل التغليف والتخزين"
        instructions={order.packingInstructions}
      />

      {/* Details of Packing Invoices */}
      <PrintSection title="تفاصيل أذون وفواتير التجهيز والتغليف" badge={`إجمالي: ${grandTotalPacked} قطعة`}>
        {invoices.length === 0 ? (
          <p className="text-center py-4 text-slate-500 bg-slate-50 border border-slate-200 rounded">
            لا توجد فواتير تجهيز مسجلة لهذا الأمر حتى الآن.
          </p>
        ) : (
          invoices.map((inv, idx) => {
            const hasQuantities = inv.variants.some(v => v.quantity > 0);
            if (!hasQuantities) return null;

            const invoiceTotal = inv.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);

            return (
              <div key={inv.id} className="mb-4 border border-slate-300 rounded overflow-hidden break-inside-avoid">
                {/* Invoice Sub-Header */}
                <div className="bg-slate-100 p-2 border-b border-slate-300 flex justify-between items-center text-[10.5px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">فاتورة / إذن تجهيز رقم ({idx + 1}):</span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold">{inv.id}</span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-slate-600 ml-1">تاريخ الإذن:</span>
                      <span className="font-semibold text-slate-900">{inv.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 ml-1">العميل المستلم:</span>
                      <span className="font-semibold text-slate-900">{inv.customerName || order.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 ml-1">الكمية:</span>
                      <span className="font-bold text-indigo-900">{invoiceTotal} قطعة</span>
                    </div>
                  </div>
                </div>
                
                {/* Distribution Matrix Table for Invoice */}
                <table className="mb-0">
                  <thead>
                    <tr>
                      <th className="w-28 text-center bg-slate-200">اللون / المقاس</th>
                      {uniqueSizes.map(size => (
                        <th key={size} className="text-center">{size}</th>
                      ))}
                      <th className="w-24 text-center bg-slate-200">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueColors.map(color => {
                      let colorTotal = 0;
                      let hasColorQuantities = false;
                      
                      const cells = uniqueSizes.map(size => {
                        const variant = inv.variants.find(v => v.size === size && v.color === color);
                        const qty = variant?.quantity || 0;
                        colorTotal += qty;
                        if (qty > 0) hasColorQuantities = true;
                        
                        return (
                          <td key={size} className="text-center font-semibold">
                            {qty > 0 ? qty : '—'}
                          </td>
                        );
                      });

                      if (!hasColorQuantities) return null;

                      return (
                        <tr key={color}>
                          <td className="font-bold bg-slate-50">{color}</td>
                          {cells}
                          <td className="text-center font-bold bg-slate-100 text-indigo-900">{colorTotal}</td>
                        </tr>
                      );
                    })}
                    {/* Invoice Totals Row */}
                    <tr className="bg-slate-100 font-bold border-t border-slate-400">
                      <td className="bg-slate-200">إجمالي المقاس:</td>
                      {uniqueSizes.map(size => {
                        const sizeTotal = inv.variants
                          .filter(v => v.size === size)
                          .reduce((sum, v) => sum + (v.quantity || 0), 0);
                        return (
                          <td key={size} className="text-center text-indigo-900">
                            {sizeTotal > 0 ? sizeTotal : '—'}
                          </td>
                        );
                      })}
                      <td className="text-center bg-slate-300 font-black text-indigo-950">
                        {invoiceTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </PrintSection>

      {/* Signatures */}
      <PrintSignatures 
        title="توقيعات واعتمادات صالة التغليف ومخزن تام الصنع"
        signatures={[
          { role: "مسئول صالة التغليف" },
          { role: "مراقب الجودة والتعبئة" },
          { role: "أمين مخزن المنتجات التامة" },
          { 
            role: "اعتماد مدير الإنتاج والتسليم",
            name: order.packingApprovedBy,
            date: order.packingApprovedAt,
            isApproved: !!order.packingApprovedBy
          }
        ]} 
      />
    </PrintDocument>
  );
});

PackingWorkOrderPrint.displayName = 'PackingWorkOrderPrint';
