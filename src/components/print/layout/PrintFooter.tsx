import React from 'react';

export const PrintFooter: React.FC = () => {
  return (
    <div className="print-footer fixed bottom-0 left-0 right-0 pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-500 bg-white">
      <span>GFOS ERP System</span>
      <span>طبع بواسطة النظام</span>
    </div>
  );
};
