import React, { useState, useRef, useEffect } from 'react';
import { SizeData, Variant } from '../../types';
import { getAvailableColors } from '../../lib/colors';
import { VariantRow } from './VariantRow';
import { Plus, Trash2, Copy } from 'lucide-react';

interface SizeCardProps {
  key?: React.Key;
  sizeData: SizeData;
  availableSizesToCopy: string[];
  onUpdateVariant: (variantIndex: number, field: keyof Variant, value: string | number) => void;
  onAddVariant: () => void;
  onRemoveVariant: (variantIndex: number) => void;
  onRemoveSize: () => void;
  onCopySize: (targetSize: string) => void;
  readOnly?: boolean;
}

export function SizeCard({
  sizeData,
  availableSizesToCopy,
  onUpdateVariant,
  onAddVariant,
  onRemoveVariant,
  onRemoveSize,
  onCopySize,
  readOnly = false
}: SizeCardProps) {
  const [showCopyModal, setShowCopyModal] = useState(false);
  const copyModalRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showCopyModal) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (copyModalRef.current && !copyModalRef.current.contains(event.target as Node)) {
        setShowCopyModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showCopyModal]);

  // Calculate size total directly from the variants
  const sizeTotal = (sizeData.variants || []).reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

  // Colors that are not yet selected in this size
  const selectedColors = sizeData.variants.map(v => v.color).filter(Boolean);
  const allAvailable = getAvailableColors();
  const availableColors = allAvailable.filter(c => !selectedColors.includes(c));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:border-slate-300 transition-all">
      {/* Card Header */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-base shadow-xs font-mono">
            {sizeData.size}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-sm">المقاس {sizeData.size}</h4>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-mono">
                {sizeTotal} قطعة
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {sizeData.variants.length} {sizeData.variants.length === 1 ? 'لون محدد' : 'ألوان محددة'}
            </p>
          </div>
        </div>
        
        {!readOnly && (
          <div className="flex items-center gap-1.5">
            {sizeData.variants.length > 0 && availableSizesToCopy.length > 0 && (
              <div className="relative" ref={copyModalRef}>
                <button
                  type="button"
                  onClick={() => setShowCopyModal(prev => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white border border-slate-300/80 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors font-medium shadow-2xs"
                  title="نسخ ألوان وكميات هذا المقاس إلى مقاس آخر"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  نسخ المقاس
                </button>
                
                {showCopyModal && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                    <div className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                      نسخ الألوان والكميات إلى:
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {availableSizesToCopy.map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            onCopySize(sz);
                            setShowCopyModal(false);
                          }}
                          className="w-full text-right px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          المقاس {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button
              type="button"
              onClick={onRemoveSize}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="حذف هذا المقاس"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Variants List */}
      <div className="p-4 space-y-2.5 bg-slate-50/30">
        {sizeData.variants.length > 0 ? (
          sizeData.variants.map((variant, idx) => (
            <VariantRow
              key={idx}
              variant={variant}
              availableColors={availableColors}
              onChange={(field, value) => onUpdateVariant(idx, field, value)}
              onRemove={() => onRemoveVariant(idx)}
              readOnly={readOnly}
            />
          ))
        ) : (
          <div className="py-6 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400 mb-2">لم يتم تحديد ألوان أو كميات لهذا المقاس</p>
            {!readOnly && (
              <button
                type="button"
                onClick={onAddVariant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة أول لون
              </button>
            )}
          </div>
        )}

        {!readOnly && sizeData.variants.length > 0 && (
          <button
            type="button"
            onClick={onAddVariant}
            className="flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-slate-300/80 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50/40 rounded-xl transition-all font-semibold text-xs shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة لون آخر لهذا المقاس
          </button>
        )}
      </div>
    </div>
  );
}
