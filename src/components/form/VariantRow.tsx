import React, { useState, useEffect } from 'react';
import { Variant } from '../../types';
import { Trash2, X, Check, Palette } from 'lucide-react';
import { addCustomColor } from '../../lib/colors';

interface VariantRowProps {
  key?: React.Key;
  variant: Variant;
  availableColors: string[];
  onChange: (field: keyof Variant, value: string | number) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  'أسود': '#0f172a',
  'أبيض': '#ffffff',
  'كحلي': '#1e3a8a',
  'أزرق': '#2563eb',
  'سماوي': '#38bdf8',
  'أحمر': '#dc2626',
  'نبيتي': '#881337',
  'رمادي': '#64748b',
  'رصاصي': '#64748b',
  'رمادي غامق': '#334155',
  'رمادي فاتح': '#cbd5e1',
  'بيج': '#d4b996',
  'أوف وايت': '#fdfbf7',
  'بني': '#78350f',
  'هافان': '#c2410c',
  'جملي': '#b45309',
  'زيتي': '#3f6212',
  'أخضر': '#16a34a',
  'أصفر': '#eab308',
  'موف': '#7c3aed',
  'بنفسجي': '#6b21a8',
  'وردي': '#f472b6',
  'فوشيا': '#db2777',
  'برتقالي': '#ea580c',
  'خردلي': '#ca8a04',
};

export function VariantRow({ variant, availableColors, onChange, onRemove, readOnly = false }: VariantRowProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [tempColor, setTempColor] = useState('');

  // When variant.color changes externally (and it's not custom typing mode), reset tempColor
  useEffect(() => {
    if (!isCustom) {
      setTempColor(variant.color || '');
    }
  }, [variant.color, isCustom]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'CUSTOM_COLOR_ENTRY') {
      setIsCustom(true);
      setTempColor('');
    } else {
      onChange('color', e.target.value);
    }
  };

  const handleConfirmCustomColor = () => {
    const trimmed = tempColor.trim();
    if (trimmed) {
      addCustomColor(trimmed);
      onChange('color', trimmed);
    }
    setIsCustom(false);
  };

  const handleCancelCustomColor = () => {
    setIsCustom(false);
    setTempColor(variant.color || '');
  };

  const colorHex = variant.color ? COLOR_MAP[variant.color] : undefined;

  return (
    <div className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:border-indigo-300 transition-colors">
      {/* Visual Color Dot */}
      <div className="shrink-0 flex items-center justify-center">
        {colorHex ? (
          <span
            className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs inline-block"
            style={{ backgroundColor: colorHex }}
            title={variant.color}
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <Palette className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Color Select / Custom Input */}
      <div className="flex-1 min-w-0">
        {isCustom ? (
          <div className="relative flex items-center">
            <input
              type="text"
              value={tempColor}
              disabled={readOnly}
              onChange={(e) => setTempColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmCustomColor();
                } else if (e.key === 'Escape') {
                  handleCancelCustomColor();
                }
              }}
              placeholder="اكتب اسم اللون الجديد..."
              autoFocus
              className="w-full pr-3 pl-16 py-1.5 border border-indigo-300 rounded-lg text-sm font-medium bg-indigo-50/20 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            {!readOnly && (
              <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleConfirmCustomColor}
                  disabled={!tempColor.trim()}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-40 transition-colors"
                  title="تأكيد وحفظ"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelCustomColor}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  title="إلغاء"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <select
            value={variant.color}
            disabled={readOnly}
            onChange={handleSelectChange}
            className={`w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold transition-colors ${
              readOnly
                ? 'bg-slate-100 text-slate-700 cursor-not-allowed'
                : 'bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800'
            }`}
          >
            {variant.color && !availableColors.includes(variant.color) && (
              <option value={variant.color}>{variant.color}</option>
            )}
            {!readOnly && !variant.color && <option value="" disabled>اختر لون القماش...</option>}
            
            {!readOnly && (
              <option value="CUSTOM_COLOR_ENTRY" className="font-bold bg-indigo-50 text-indigo-700">
                ✏️ إدخال لون جديد يدوياً...
              </option>
            )}
            
            {availableColors.map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        )}
      </div>

      {/* Quantity Input */}
      <div className="w-28 sm:w-32 shrink-0">
        <div className="relative flex items-center">
          <input
            type="number"
            min="1"
            disabled={readOnly}
            value={variant.quantity || ''}
            onChange={(e) =>
              onChange(
                'quantity',
                (() => {
                  const v = parseInt(e.target.value, 10);
                  return isNaN(v) ? 0 : v;
                })()
              )
            }
            placeholder="الكمية"
            className={`w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold font-mono text-center transition-colors ${
              readOnly
                ? 'bg-slate-100 text-slate-700 cursor-not-allowed'
                : 'bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-800'
            }`}
          />
          <span className="absolute left-2 text-[11px] text-slate-400 font-normal pointer-events-none">
            قطعة
          </span>
        </div>
      </div>

      {/* Remove Button */}
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          title="حذف هذا اللون"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

