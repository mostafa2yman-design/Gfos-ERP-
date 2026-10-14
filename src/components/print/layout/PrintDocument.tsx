import React, { forwardRef } from 'react';
import { PrintFooter } from './PrintFooter';

interface PrintDocumentProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  showInPreview?: boolean;
}

export const PrintDocument = forwardRef<HTMLDivElement, PrintDocumentProps>(
  ({ children, title, className = '', showInPreview = false }, ref) => {
    return (
      <div 
        ref={ref} 
        className={`gfos-print-document bg-white text-slate-900 w-full ${showInPreview ? 'block shadow-lg p-6 max-w-4xl mx-auto rounded-lg border border-slate-200' : 'hidden print:block'} ${className}`} 
        dir="rtl"
      >
        <div className="print-content">
          {children}
        </div>
        <PrintFooter />
      </div>
    );
  }
);
PrintDocument.displayName = 'PrintDocument';

