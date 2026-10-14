import React from 'react';
import { getFactorySettings } from '../../../lib/storage';
import { BarcodeSvg } from '../../barcode/BarcodeSvg';

interface PrintHeaderProps {
  documentTitle?: string;
  title?: string;
  orderNumber?: string;
  date?: string;
  modelName?: string;
  clientName?: string;
  category?: string;
  status?: string;
  companyName?: string;
  additionalInfo?: Array<{ label: string; value: string | number }>;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({ 
  documentTitle, 
  title,
  orderNumber, 
  date,
  modelName,
  clientName,
  category,
  status,
  companyName = "نظام نسيج لإدارة المصانع GFOS",
  additionalInfo = []
}) => {
  const finalTitle = documentTitle || title || "وثيقة تشغيل رسمية";
  const defaultDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const defaultTime = new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const factory = getFactorySettings();
  
  // Combine core information with additional info
  const infoItems: Array<{ label: string; value: string | number }> = [];
  if (modelName) infoItems.push({ label: 'الموديل / الصنف', value: modelName });
  if (clientName) infoItems.push({ label: 'العميل', value: clientName });
  if (category) infoItems.push({ label: 'التصنيف', value: category });
  if (status) infoItems.push({ label: 'الحالة', value: status });
  infoItems.push(...additionalInfo);

  return (
    <div className="gfos-print-header border-b-2 border-slate-900 pb-2 mb-3">
      {/* Top Banner */}
      <div className="flex justify-between items-center mb-2.5">
        {/* Factory / Company Brand */}
        <div className="flex items-center gap-3">
          {factory?.logoUrl ? (
            <img src={factory.logoUrl} alt="Logo" className="w-12 h-12 object-contain grayscale" />
          ) : (
            <div className="w-10 h-10 rounded border-2 border-slate-800 flex items-center justify-center font-black text-slate-800 text-sm">
              GFOS
            </div>
          )}
          <div>
            <h1 className="text-[15px] font-bold text-slate-900 leading-tight">
              {factory?.name || companyName}
            </h1>
            <p className="text-[9.5px] text-slate-600">
              {factory?.address || "إدارة تخطيط ورقابة الإنتاج والمتابعة الصناعية"}
            </p>
          </div>
        </div>

        {/* Center: Document Badge */}
        <div className="text-center">
          <div className="inline-block border-2 border-slate-900 px-4 py-1 rounded bg-slate-100">
            <h2 className="text-[14px] font-black text-slate-900 tracking-wide">
              {finalTitle}
            </h2>
          </div>
        </div>

        {/* Left: Metadata (Order #, Barcode, Date, Time) */}
        <div className="text-left text-[10px] text-slate-800 flex flex-col items-end leading-tight">
          {orderNumber && (
            <div className="flex flex-col items-end mb-1">
              <div className="bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                رقم الأمر: {orderNumber}
              </div>
              <div className="mt-0.5 w-[110px] flex justify-end">
                <BarcodeSvg 
                  value={orderNumber} 
                  height={20} 
                  width={1.2} 
                  displayValue={false} 
                />
              </div>
            </div>
          )}
          <p><span className="font-semibold text-slate-600">تاريخ الإصدار:</span> {date || defaultDate}</p>
          <p className="text-[9px] text-slate-500">{defaultTime}</p>
        </div>
      </div>
      
      {/* Dynamic Data Ribbon / Grid */}
      {infoItems.length > 0 && (
        <div className="grid grid-cols-4 gap-2 text-[10px] bg-slate-50 p-2 border border-slate-300 rounded">
          {infoItems.map((info, idx) => (
            <div key={idx} className="flex items-center gap-1 overflow-hidden">
              <span className="font-bold text-slate-700 whitespace-nowrap">{info.label}:</span>
              <span className="text-slate-900 font-semibold truncate">{info.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
