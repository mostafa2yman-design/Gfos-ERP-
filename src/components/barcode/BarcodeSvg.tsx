import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeSvgProps {
  value: string;
  format?: 'CODE128' | 'EAN13';
  width?: number;       // line thickness (1 - 3)
  height?: number;      // barcode height in px
  displayValue?: boolean; // display text below barcode
  fontSize?: number;
  className?: string;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  format = 'CODE128',
  width = 1.6,
  height = 40,
  displayValue = true,
  fontSize = 11,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    // Ensure value is ASCII for Code128
    let safeValue = (value || '0000').trim();
    // If empty or non-ascii, convert to safe string
    if (!safeValue) safeValue = 'ORD-001';
    
    // Replace any non-ASCII characters to keep Code128 happy
    safeValue = safeValue.replace(/[^\x20-\x7E]/g, '-');
    if (!safeValue) safeValue = 'ITEM-01';

    try {
      JsBarcode(svgRef.current, safeValue, {
        format: format === 'EAN13' ? 'EAN13' : 'CODE128',
        width: Math.max(1, width),
        height: Math.max(20, height),
        displayValue: displayValue,
        fontSize: fontSize,
        font: 'monospace',
        textMargin: 2,
        margin: 2,
        background: 'transparent',
        lineColor: '#000000'
      });
    } catch (err) {
      // Fallback try simple CODE128 with cleaned alphanumeric
      try {
        const cleanAlpha = safeValue.replace(/[^a-zA-Z0-9]/g, '') || '12345678';
        JsBarcode(svgRef.current, cleanAlpha, {
          format: 'CODE128',
          width: Math.max(1, width),
          height: Math.max(20, height),
          displayValue: displayValue,
          fontSize: fontSize,
          font: 'monospace',
          textMargin: 2,
          margin: 2,
          background: 'transparent',
          lineColor: '#000000'
        });
      } catch (e2) {
        console.warn('Barcode generation failed for:', value, e2);
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  return (
    <div className={`flex justify-center items-center overflow-hidden ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto" />
    </div>
  );
};
