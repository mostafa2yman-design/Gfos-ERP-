import React from 'react';

export interface Signature {
  role: string;
  name?: string;
  date?: string;
  isApproved?: boolean;
}

interface PrintSignaturesProps {
  signatures: Signature[];
  title?: string;
}

export const PrintSignatures: React.FC<PrintSignaturesProps> = ({ 
  signatures = [], 
  title = "المسئولون والاعتمادات الرسمية" 
}) => {
  if (!signatures || signatures.length === 0) return null;

  return (
    <div className="gfos-print-signatures mt-6 pt-3 border-t-2 border-slate-800 break-inside-avoid">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[11px] font-bold text-slate-800 tracking-wide">
          {title}
        </h4>
        <span className="text-[9px] text-slate-500">
          * يعتبر هذا المستند رسمياً بعد استيفاء التوقيعات والاعتمادات المطلوبة
        </span>
      </div>

      <div 
        className="grid gap-2 text-center" 
        style={{ gridTemplateColumns: `repeat(${signatures.length}, minmax(0, 1fr))` }}
      >
        {signatures.map((sig, idx) => (
          <div 
            key={idx} 
            className="border border-slate-300 rounded p-2 bg-slate-50 flex flex-col justify-between min-h-[85px]"
          >
            {/* Role Header */}
            <div className="border-b border-slate-200 pb-1 mb-1.5">
              <p className="font-bold text-[10.5px] text-slate-900">{sig.role}</p>
            </div>

            {/* Content: System approved OR blank manual sign line */}
            <div className="my-auto">
              {sig.name || sig.isApproved ? (
                <div className="text-center">
                  <div className="inline-block text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded mb-1">
                    ✓ معتمد إلكترونياً
                  </div>
                  <p className="font-bold text-[10px] text-slate-800">{sig.name || 'تم الاعتماد'}</p>
                  {sig.date && <p className="text-[8.5px] text-slate-500 mt-0.5">{sig.date}</p>}
                </div>
              ) : (
                <div className="py-2">
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
                  <p className="text-[8.5px] text-slate-500">الاسم / التوقيع</p>
                </div>
              )}
            </div>

            {/* Bottom timestamp / date line */}
            <div className="pt-1 border-t border-slate-200 text-[8px] text-slate-500 flex justify-between px-1">
              <span>التاريخ: ___/___/202_</span>
              <span>الختم الرسمي</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
