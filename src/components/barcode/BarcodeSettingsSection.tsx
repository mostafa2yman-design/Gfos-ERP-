import React, { useState, useEffect } from 'react';
import { 
  BarcodeLabelSettings, 
  BarcodePresetId, 
  BarcodePrintItem 
} from '../../types/barcode';
import { 
  BARCODE_PRESETS, 
  DEFAULT_BARCODE_SETTINGS, 
  getBarcodeSettings, 
  saveBarcodeSettings,
  formatBarcodeSequence
} from '../../lib/barcodeSettings';
import { BarcodeLabelCard } from './BarcodeLabelCard';
import { 
  Barcode, 
  Sliders, 
  Eye, 
  Check, 
  RotateCcw, 
  Save, 
  Printer, 
  Layers, 
  Info, 
  Type, 
  Square,
  Sparkles
} from 'lucide-react';

interface Props {
  onSaved?: (settings: BarcodeLabelSettings) => void;
  compact?: boolean;
}

export const BarcodeSettingsSection: React.FC<Props> = ({ onSaved, compact = false }) => {
  const [settings, setSettings] = useState<BarcodeLabelSettings>(DEFAULT_BARCODE_SETTINGS);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loaded = getBarcodeSettings();
    setSettings(loaded);
  }, []);

  const handlePresetChange = (presetId: BarcodePresetId) => {
    const preset = BARCODE_PRESETS.find(p => p.id === presetId);
    if (preset && presetId !== 'custom') {
      setSettings(prev => ({
        ...prev,
        preset: presetId,
        widthMm: preset.widthMm,
        heightMm: preset.heightMm
      }));
    } else {
      setSettings(prev => ({ ...prev, preset: presetId }));
    }
  };

  const handleToggle = (key: keyof BarcodeLabelSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    const saved = saveBarcodeSettings(settings);
    setSettings(saved);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    if (onSaved) onSaved(saved);
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_BARCODE_SETTINGS);
    saveBarcodeSettings(DEFAULT_BARCODE_SETTINGS);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    if (onSaved) onSaved(DEFAULT_BARCODE_SETTINGS);
  };

  // Mock item for live preview with dynamic sequential barcode
  const nextSeqNum = (Number(settings.lastSequenceNumber) || 0) + 1;
  const sampleBarcode = formatBarcodeSequence(
    settings.sequencePrefix || 'PM',
    nextSeqNum,
    settings.sequencePadding || 5
  );

  const sampleItem: BarcodePrintItem = {
    id: 'sample-01',
    orderNumber: 'ORD-2026-088',
    productName: 'تيشيرت بولو قطن 100%',
    productType: 'تيشيرت رجالي',
    size: 'XL',
    color: 'كحلي داكن',
    barcodeValue: sampleBarcode,
    batchNumber: '02',
    actualQuantity: 50,
    printQuantity: 1,
    price: 350,
    factoryName: 'مصنع الملابس الجاهزة',
    date: new Date().toISOString().split('T')[0]
  };

  const currentPreset = BARCODE_PRESETS.find(p => p.id === settings.preset) || BARCODE_PRESETS[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>إعدادات ملصقات الباركود والطباعة</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Thermal Labels
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تخصيص أبعاد ملصق الباركود الحراري واختيار العناصر المعروضة (المقاس، اللون، النوع، الرقم، الاسم)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="استعادة الإعدادات الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>افتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>تم الحفظ بنجاح!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ الإعدادات</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Controls & Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Dimension & Preset Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>اختيار مقاس ملصق الباركود (Thermal Label Preset):</span>
              </span>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {settings.widthMm} × {settings.heightMm} مم
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BARCODE_PRESETS.map((p) => {
                const isSelected = settings.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetChange(p.id)}
                    className={`text-right p-3 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {p.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {p.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Dimensions if selected */}
            {settings.preset === 'custom' && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>تحديد أبعاد مخصصة للملصق (بالمليمتر mm):</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">العرض (Width - مم)</label>
                    <input
                      type="number"
                      min="25"
                      max="120"
                      value={settings.widthMm}
                      onChange={(e) => setSettings({ ...settings, widthMm: Number(e.target.value) || 50 })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">الارتفاع (Height - مم)</label>
                    <input
                      type="number"
                      min="15"
                      max="120"
                      value={settings.heightMm}
                      onChange={(e) => setSettings({ ...settings, heightMm: Number(e.target.value) || 30 })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Content Elements Toggles (المقاس واللون والنوع والرقم والاسم) */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>العناصر المعروضة على ملصق الباركود:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* الاسم */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>الاسم (اسم الموديل/المنتج)</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showProductName}
                  onChange={() => handleToggle('showProductName')}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* النوع */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>النوع (تصنيف المنتج)</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showProductType}
                  onChange={() => handleToggle('showProductType')}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* المقاس */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>المقاس (Size)</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showSize}
                  onChange={() => handleToggle('showSize')}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* اللون */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  <span>اللون (Color)</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showColor}
                  onChange={() => handleToggle('showColor')}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* الرقم */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  <span>الرقم (رقم أمر التشغيل/الأوردر)</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showOrderNumber}
                  onChange={() => handleToggle('showOrderNumber')}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* كود الباركود الرقمي */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                  <span>أرقام الباركود أسفل الخطوط</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showBarcodeNumber}
                  onChange={() => handleToggle('showBarcodeNumber')}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* اسم المصنع */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  <span>اسم المصنع / البراند</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showFactoryName}
                  onChange={() => handleToggle('showFactoryName')}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* رقم الباتش */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <span>رقم الباتش (Batch #)</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showBatchNumber}
                  onChange={() => handleToggle('showBatchNumber')}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* السعر */}
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>إظهار سعر البيع</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showPrice}
                  onChange={() => handleToggle('showPrice')}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* 3. Text & Typography & Styling Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نص تذييل الملصق (Footer Text)
              </label>
              <input
                type="text"
                value={settings.customFooter || ''}
                onChange={(e) => setSettings({ ...settings, customFooter: e.target.value })}
                placeholder="مثال: صنع في مصر - قطن مصري فاخر"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                حجم خطوط النصوص على الملصق
              </label>
              <select
                value={settings.fontSizeLevel}
                onChange={(e) => setSettings({ ...settings, fontSizeLevel: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="xs">صغير جداً (Compact - للملصقات الصغيرة)</option>
                <option value="sm">متوسط قياسي (Standard - مقاس 50x30)</option>
                <option value="base">كبير وواضح (Large - كروت 70x50 وأعلى)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ارتفاع خطوط الباركود (بالبكسل)
              </label>
              <input
                type="number"
                min="20"
                max="80"
                value={settings.barcodeHeightPx}
                onChange={(e) => setSettings({ ...settings, barcodeHeightPx: Number(e.target.value) || 35 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                إطار حدود الملصق
              </label>
              <select
                value={settings.borderStyle}
                onChange={(e) => setSettings({ ...settings, borderStyle: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="none">بدون إطار (طبيعي للملصقات الحرارية الجاهزة)</option>
                <option value="solid">إطار أسود رفيع (Solid Border)</option>
                <option value="dashed">إطار متقطع لعلامات القص (Dashed)</option>
              </select>
            </div>
          </div>

          {/* 4. Automatic Barcode Sequence Configuration (إعدادات تسلسل وترقيم كود الباركود) */}
          <div className="pt-4 border-t border-slate-200 space-y-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>إعدادات التسلسل التلقائي لكود الباركود (Barcode Auto-Sequence):</span>
              </label>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-700 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs">
                <span className="text-[11px] font-sans text-slate-500 font-normal">الباركود التالي:</span>
                <span className="font-mono text-indigo-900 font-black">{sampleBarcode}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  بداية التسلسل / البادئة (Prefix)
                </label>
                <input
                  type="text"
                  value={settings.sequencePrefix || ''}
                  onChange={(e) => setSettings({ ...settings, sequencePrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  placeholder="مثال: PM"
                  className="w-full px-3 py-2 bg-white border border-indigo-200 focus:border-indigo-500 rounded-lg text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none uppercase font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  البادئة الثابتة لأكواد الباركود للمنتجات (مثال: PM لتوليد {formatBarcodeSequence(settings.sequencePrefix || 'PM', 1, settings.sequencePadding || 5)})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  آخر رقم تسلسلي تم توليده
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.lastSequenceNumber ?? 0}
                  onChange={(e) => setSettings({ ...settings, lastSequenceNumber: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  الرقم التالي الذي سيبدأ به النظام تلقائياً: {nextSeqNum} ({sampleBarcode})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live Interactive Sticker Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start bg-slate-100/70 p-6 rounded-2xl border border-slate-200/80">
          <div className="w-full flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>معاينة حية للملصق (Live Preview):</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {settings.widthMm}mm × {settings.heightMm}mm
            </span>
          </div>

          <div className="p-4 bg-white/40 border border-dashed border-slate-300 rounded-xl flex items-center justify-center min-h-[220px] w-full overflow-auto">
            {/* The rendered live label */}
            <BarcodeLabelCard
              item={sampleItem}
              settings={settings}
              isPrintPreview={true}
            />
          </div>

          <div className="mt-4 p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl w-full text-xs text-indigo-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>مطابق لمواصفات طابعات الباركود الحرارية:</span>
            </div>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              يدعم طابعات Xprinter وZebra وHPRT وغيرها. يتم ضبط هوامش الصفحة تلقائياً على 0 مم لتجنب إهدار ملصقات الرول الحراري.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
