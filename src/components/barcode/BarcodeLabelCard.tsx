import React from 'react';
import { BarcodePrintItem, BarcodeLabelSettings } from '../../types/barcode';
import { BarcodeSvg } from './BarcodeSvg';

interface BarcodeLabelCardProps {
  item: BarcodePrintItem;
  settings: BarcodeLabelSettings;
  className?: string;
  isPrintPreview?: boolean;
}

export const BarcodeLabelCard: React.FC<BarcodeLabelCardProps> = ({
  item,
  settings,
  className = '',
  isPrintPreview = false
}) => {
  // Convert mm to pixels/dimensions
  const widthMm = settings.widthMm || 50;
  const heightMm = settings.heightMm || 30;

  // Font sizing classes based on level
  const titleClass = settings.fontSizeLevel === 'xs' 
    ? 'text-[10px] leading-tight' 
    : settings.fontSizeLevel === 'base' 
      ? 'text-[13px] leading-tight' 
      : 'text-[11px] leading-tight';

  const metaClass = settings.fontSizeLevel === 'xs' 
    ? 'text-[8px] leading-tight' 
    : settings.fontSizeLevel === 'base' 
      ? 'text-[11px] leading-tight' 
      : 'text-[9.5px] leading-tight';

  const badgeClass = settings.fontSizeLevel === 'xs' 
    ? 'text-[9px] px-1 py-0.2' 
    : settings.fontSizeLevel === 'base' 
      ? 'text-[12px] px-1.5 py-0.5 font-black' 
      : 'text-[10px] px-1.5 py-0.5 font-bold';

  return (
    <div
      className={`bg-white text-black box-border flex flex-col justify-between overflow-hidden relative font-sans ${
        isPrintPreview ? 'shadow-md border border-slate-300 rounded-md m-2' : ''
      } ${
        settings.borderStyle === 'solid' 
          ? 'border border-black' 
          : settings.borderStyle === 'dashed' 
            ? 'border border-dashed border-slate-400' 
            : ''
      } ${className}`}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        padding: '2mm',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        pageBreakAfter: 'always',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
      dir="rtl"
    >
      {/* 1. Header: Factory name / Custom header (تم إلغاء التاريخ بناءً على طلب المستخدم) */}
      {settings.showFactoryName && (
        <div className="flex justify-center items-center border-b border-black/20 pb-0.5 shrink-0 text-center">
          <span className={`${metaClass} font-bold text-slate-800 truncate w-full text-center`}>
            {item.factoryName || settings.customHeader || 'مصنع الملابس الجاهزة'}
          </span>
        </div>
      )}

      {/* 2. Main Title: الاسم (Product/Style Name) + النوع (Category/Type) */}
      <div className="my-0.5 shrink-0">
        <div className="flex justify-between items-start gap-1">
          {settings.showProductName && (
            <h4 className={`${titleClass} font-black text-black leading-tight truncate flex-1`}>
              {item.productName || 'اسم الموديل'}
            </h4>
          )}
          {settings.showProductType && (
            <span className={`${metaClass} px-1 rounded bg-slate-100 border border-slate-300 text-slate-800 font-semibold shrink-0`}>
              {item.productType || 'ملابس'}
            </span>
          )}
        </div>
      </div>

      {/* 3. Barcode Graphic: الرقم (Barcode & Order Number) */}
      <div className="my-0.5 flex flex-col items-center justify-center shrink-0 overflow-hidden">
        <BarcodeSvg
          value={item.barcodeValue || item.orderNumber || 'ORD-001'}
          width={settings.barcodeThickness || 1.4}
          height={Math.min(settings.barcodeHeightPx || 32, Math.max(20, heightMm * 2.2))}
          displayValue={settings.showBarcodeNumber}
          fontSize={settings.fontSizeLevel === 'xs' ? 8 : 10}
        />
      </div>

      {/* 4. Specifications Grid: المقاس + اللون + الرقم + الباتش */}
      <div className="pt-0.5 border-t border-black/30 grid grid-cols-2 gap-1 items-center shrink-0">
        {/* المقاس (Size) */}
        {settings.showSize && (
          <div className="flex items-center gap-1">
            <span className={`${metaClass} text-slate-600 font-bold`}>المقاس:</span>
            <span className={`${badgeClass} bg-black text-white rounded font-mono font-black tracking-wider`}>
              {item.size || '—'}
            </span>
          </div>
        )}

        {/* اللون (Color) */}
        {settings.showColor && (
          <div className="flex items-center gap-1 justify-end">
            <span className={`${metaClass} text-slate-600 font-bold`}>اللون:</span>
            <span className={`${metaClass} font-black text-slate-900 truncate max-w-[70px]`}>
              {item.color || '—'}
            </span>
          </div>
        )}

        {/* الرقم / أمر التشغيل (Order Number) */}
        {settings.showOrderNumber && (
          <div className="flex items-center gap-1">
            <span className={`${metaClass} text-slate-600 font-bold`}>الأمر:</span>
            <span className={`${metaClass} font-mono font-bold text-slate-800 truncate`} dir="ltr">
              {item.orderNumber}
            </span>
          </div>
        )}

        {/* رقم الباتش أو السعر */}
        {settings.showPrice && item.price ? (
          <div className="flex items-center gap-1 justify-end font-bold text-emerald-800">
            <span className={`${metaClass}`}>السعر:</span>
            <span className={`${titleClass} font-black`}>
              {item.price} {settings.currencySymbol || 'ج.م'}
            </span>
          </div>
        ) : settings.showBatchNumber && item.batchNumber ? (
          <div className="flex items-center gap-1 justify-end">
            <span className={`${metaClass} text-slate-600 font-bold`}>باتش:</span>
            <span className={`${metaClass} font-mono font-bold text-slate-800`} dir="ltr">
              #{item.batchNumber}
            </span>
          </div>
        ) : null}
      </div>

      {/* 5. Custom Footer if enabled or provided */}
      {Boolean(item.customFooter !== undefined ? item.customFooter : settings.customFooter) && (
        <div className="text-center pt-0.5 border-t border-black/15 text-[7.5px] text-slate-700 font-bold leading-tight truncate px-1">
          {item.customFooter !== undefined ? item.customFooter : settings.customFooter}
        </div>
      )}
    </div>
  );
};
