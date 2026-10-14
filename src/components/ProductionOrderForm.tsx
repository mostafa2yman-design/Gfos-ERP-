import React, { useState, useEffect, useRef } from "react";
import { ProductionOrder, Variant, MaterialInstance, AccessoryInstance } from "../types";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Toast } from "./ui/Toast";
import { useNotification } from "../context/NotificationContext";
import { OrderBasicInfo } from "./form/OrderBasicInfo";
import { SizeCard } from "./form/SizeCard";
import { OrderSummary } from "./form/OrderSummary";
import { BomSection } from "./form/BomSection";
import { calculateFabricAnalysis } from "../lib/fabricUtils";
import { FabricSummary } from "./FabricSummary";
import { CostAnalysisSummary } from "./CostAnalysisSummary";
import { generateOrderNumber, getOrderById, getOrders } from "../lib/storage";
import { getBomTemplateForStyle } from "../lib/bom";
import { getAvailableSizes, addCustomSize } from "../lib/sizes";
import { getAvailableColors } from "../lib/colors";
import { CopyBomModal } from "./CopyBomModal";
import {
  Save,
  Copy,
  X,
  AlertCircle,
  Plus,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
  Trash2,
  Layers,
  Palette,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  FileSpreadsheet,
  CheckSquare,
  Printer,
} from "lucide-react";
import { ProductionOrderPrint } from "./print/ProductionOrderPrint";

import * as Cmd from "../lib/productionOrderCommands";
interface ProductionOrderFormProps {
  key?: React.Key;
  onOrderSaved: (orderId: string) => void;
  onOrderApproved: (orderId: string) => void;
  onBack: () => void;
  orderId?: string | null;

  onDeleted?: () => void;
  isViewOnly?: boolean;
}

export function ProductionOrderForm({
  orderId,
  onOrderSaved,
  onOrderApproved,
  onDeleted,
  onBack,
  isViewOnly = false,
}: ProductionOrderFormProps) {
  const { notifySuccess, notifyError } = useNotification();
  const [order, setOrder] = useState<ProductionOrder>({
    id: crypto.randomUUID(),
    orderNumber: "",
    orderDate: new Date().toISOString().split("T")[0],
    styleName: "",
    category: "",
    customerName: "",
    status: "مسودة",
    sizes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [tempSize, setTempSize] = useState('');
  const [isCopyBomOpen, setIsCopyBomOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<'new'|'copy'>('new');
  const [sourceOrderId, setSourceOrderId] = useState('');
  const [previousOrders, setPreviousOrders] = useState<ProductionOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'sizes' | 'bom' | 'review'>('basic');
  const [viewMode, setViewMode] = useState<'stepper' | 'continuous'>('stepper');
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [distributeColor, setDistributeColor] = useState('');
  const [distributeQty, setDistributeQty] = useState<number | ''>('');
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintOrder = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        const orders = await getOrders();
        orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setPreviousOrders(orders);
      }
    };
    load();
  }, [orderId]);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const addSizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (orderId) {
        const existing = await getOrderById(orderId);
        if (existing) {
          setOrder(existing);
        }
      } else {
        const newOrderNum = await generateOrderNumber();
        setOrder((prev) => ({ ...prev, orderNumber: newOrderNum }));
      }
    };
    load();
  }, [orderId]);

  // Click outside listener for Add Size dropdown
  useEffect(() => {
    if (!isAddSizeOpen) return;
    const handleClickOutside = async (event: MouseEvent | TouchEvent) => {
      if (
        addSizeRef.current &&
        !addSizeRef.current.contains(event.target as Node)
      ) {
        setIsAddSizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isAddSizeOpen]);

  const isReadOnly = isViewOnly || order.status !== "مسودة";

  const handleBasicInfoChange = (
    field: keyof ProductionOrder,
    value: string,
  ) => {
    if (isReadOnly) return;
    setOrder((prev) => {
      let finalValue: any = value;
      if (field === 'printEmbroideryStandardCost' || field === 'standardSewingCostPerPiece' || field === 'standardFinishingCostPerPiece' || field === 'standardCutCostPerPiece' || field === 'standardIroningCostPerPiece' || field === 'sellingPrice') {
        const parsed = parseFloat(value); finalValue = isNaN(parsed) ? undefined : parsed;
      }
      const next = { ...prev, [field]: finalValue };

      // Auto-load BOM if styleName changes and matches a template
      if (field === "styleName") {
        const bom = getBomTemplateForStyle(value);
        if (bom) {
          next.materials = bom.materials;
          next.accessories = bom.accessories;
        }
      }
      return next;
    });
    setError(null);
  };

  const executeCommand = async <Args extends unknown[]>(
    commandFn: (o: ProductionOrder, ...args: Args) => ProductionOrder,
    ...args: Args
  ) => {
    if (isReadOnly) return;
    const newOrder = commandFn(order, ...args);

    // Autosave immediately if it's already an existing persisted order
    if (orderId && ["مسودة"].includes(order.status)) {
      const result = await Cmd.saveDraft(newOrder);
      if (result.success) {
        if (result.data) setOrder(result.data);
      } else {
        setError(result.error || "حدث خطأ");
        return;
      }
    } else {
      setOrder(newOrder);
    }
    setError(null);
  };

  const handleAddSize = async (sizeName: string) => {
    executeCommand(Cmd.addSize, sizeName);
    setIsAddSizeOpen(false);
  };

  const handleRemoveSize = async (sizeName: string) => {
    if (isReadOnly) return;
    setConfirmConfig({
      isOpen: true,
      message: "هل أنت متأكد من حذف هذا المقاس بجميع ألوانه وكمياته؟",
      onConfirm: async () => {
        executeCommand(Cmd.removeSize, sizeName);
        setConfirmConfig(null);
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const handleCopySize = async (sourceSizeName: string, targetSizeName: string) => {
    executeCommand(Cmd.copySize, sourceSizeName, targetSizeName);
  };

  const handleAddVariant = async (sizeName: string) => {
    executeCommand(Cmd.addVariant, sizeName, "", 0);
  };

  const handleUpdateVariant = (
    sizeName: string,
    variantIndex: number,
    field: keyof Variant,
    value: string | number,
  ) => {
    if (field === "color") {
      executeCommand(
        Cmd.updateVariantColor,
        sizeName,
        variantIndex,
        value as string,
      );
    } else if (field === "quantity") {
      executeCommand(
        Cmd.updateVariantQuantity,
        sizeName,
        variantIndex,
        value as number,
      );
    }
  };

  const handleRemoveVariant = async (sizeName: string, variantIndex: number) => {
    executeCommand(Cmd.removeVariant, sizeName, variantIndex);
  };

  const validate = (isFinalApproval: boolean = false): boolean => {
    // For saving draft: ensure at least styleName or customerName is entered
    if (!order.styleName.trim() && !order.customerName.trim()) {
      setError("يجب إدخال اسم الموديل أو اسم العميل على الأقل لحفظ المسودة.");
      return false;
    }

    if (isFinalApproval) {
      if (!order.styleName.trim()) {
        setError("يجب إدخال اسم القصة / الموديل للاعتماد النهائي.");
        return false;
      }
      if (!order.category) {
        setError("يجب اختيار نوع القصة للاعتماد النهائي.");
        return false;
      }
      if (!order.customerName.trim()) {
        setError("يجب إدخال اسم العميل للاعتماد النهائي.");
        return false;
      }
      if (order.sizes.length === 0) {
        setError("يجب إضافة مقاس واحد على الأقل للاعتماد النهائي.");
        return false;
      }
    }

    if (order.sizes.length > 0) {
      const sizeNames = order.sizes.map((s) => s.size);
      if (new Set(sizeNames).size !== sizeNames.length) {
        setError("يوجد مقاس مكرر داخل هذا الأمر.");
        return false;
      }

      for (const size of order.sizes) {
        if (isFinalApproval && size.variants.length === 0) {
          setError(`المقاس ${size.size} لا يحتوي على أي ألوان.`);
          return false;
        }

        const colorsInSize = new Set<string>();
        for (const variant of size.variants) {
          if (isFinalApproval && !variant.color) {
            setError(`يوجد لون غير محدد في المقاس ${size.size}.`);
            return false;
          }

          if (variant.color) {
            if (colorsInSize.has(variant.color)) {
              setError(`اللون "${variant.color}" مكرر داخل المقاس ${size.size}.`);
              return false;
            }
            colorsInSize.add(variant.color);
          }

          const qty = Number(variant.quantity);
          if (isFinalApproval && (isNaN(qty) || qty <= 0 || !Number.isInteger(qty))) {
            setError(
              `يجب إدخال كمية صحيحة أكبر من صفر للون ${variant.color || ''} في المقاس ${size.size}.`,
            );
            return false;
          }
        }
      }
    }

    setError(null);
    return true;
  };

  const handleDeleteOrder = async () => {
    if (!orderId) return;
    setConfirmConfig({
      isOpen: true,
      message:
        "هل أنت متأكد من حذف أمر الإنتاج؟\n\nسيتم حذف أمر الإنتاج وجميع بياناته التابعة التي لم تدخل في التنفيذ الفعلي. لا يمكن التراجع عن هذه العملية.",
      onConfirm: async () => {
        const result = await Cmd.deleteProductionOrder(order);
        if (result.success) {
          setConfirmConfig(null);
          if (onDeleted) {
            onDeleted();
          } else {
            onBack();
          }
        } else {
          setConfirmConfig(null);
          setError(result.error || "حدث خطأ");
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const handleSaveDraft = async () => {
    if (order.status !== "مسودة") {
      setError("لا يمكن حفظ التعديلات كمسودة لأن هذا الأمر معتمد بالفعل.");
      return;
    }
    if (validate(false)) {
      const result = await Cmd.saveDraft(order);
      if (result.success && result.data) {
        const orderNum = result.data.orderNumber || order.orderNumber || '';
        notifySuccess(
          `تم حفظ أمر الإنتاج ${orderNum ? `(رقم: ${orderNum})` : ''} كمسودة بنجاح بدون أي اعتماد. يمكنك التعديل بحرية حتى الاعتماد النهائي.`,
          "حفظ كمسودة"
        );
        setSuccess("تم حفظ أمر الإنتاج كمسودة بنجاح (بدون أي اعتماد - مفتوح للتعديل في أي وقت حتى الاعتماد النهائي).");
        setError(null);
        setOrder(result.data);
        if (onOrderSaved) onOrderSaved(result.data.id);
      } else {
        notifyError(result.error || "حدث خطأ أثناء حفظ أمر الإنتاج", "خطأ في الحفظ");
        setError(result.error || "حدث خطأ");
      }
    }
  };

  const handleApproveOrder = async () => {
    if (order.status !== "مسودة") return;
    if (validate(true)) {
      setConfirmConfig({
        isOpen: true,
        message:
          "هل أنت متأكد من اعتماد أمر الإنتاج وقائمة الخامات (BOM)؟ لن تتمكن من تعديل البيانات الأساسية أو الكميات أو تفاصيل الخامات بعد الاعتماد النهائي والانتقال لمرحلة القص.",
        onConfirm: async () => {
          const result = await Cmd.approveProductionOrder(order);
          if (result.success && result.data) {
            setConfirmConfig(null);
            const orderNum = result.data.orderNumber || order.orderNumber || '';
            notifySuccess(
              `تم اعتماد أمر الإنتاج ${orderNum ? `(رقم: ${orderNum})` : ''} وقائمة المواد (BOM) بنجاح`,
              "اعتماد أمر الإنتاج"
            );
            setSuccess("تم اعتماد أمر الإنتاج والخامات بنجاح وبدء مرحلة القص.");
            setError(null);
            setOrder(result.data);
            onOrderApproved(result.data.id);
          } else {
            setConfirmConfig(null);
            notifyError(result.error || "حدث خطأ أثناء الاعتماد", "فشل الاعتماد");
            setError(result.error || "حدث خطأ أثناء الاعتماد");
          }
        },
        onCancel: () => setConfirmConfig(null),
      });
    }
  };

  const handleBomChange = (
    field: "materials" | "accessories",
    value: MaterialInstance[] | AccessoryInstance[],
  ) => {
    if (isReadOnly) return;
    setOrder((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopyBom = async (materials: MaterialInstance[], accessories: AccessoryInstance[]) => {
    setOrder(prev => {
      // Create new UUIDs for the copied items to avoid key collisions
      const newMaterials = materials.map(m => ({ ...m, id: crypto.randomUUID() }));
      const newAccessories = accessories.map(a => ({ ...a, id: crypto.randomUUID() }));
      
      // we can merge or replace. the prompt asks to copy BOM. replacing is safer.
      return {
        ...prev,
        materials: newMaterials,
        accessories: newAccessories
      };
    });
    setIsCopyBomOpen(false);
  };

  const PRESET_GROUPS = [
    { label: 'مقاسات قياسية (S - 2XL)', sizes: ['S', 'M', 'L', 'XL', '2XL'] },
    { label: 'مقاسات كبيرة (3XL - 5XL)', sizes: ['3XL', '4XL', '5XL'] },
    { label: 'مقاسات أرقام (38 - 46)', sizes: ['38', '40', '42', '44', '46'] },
    { label: 'مقاسات أطفال (4 - 14)', sizes: ['4', '6', '8', '10', '12', '14'] },
    { label: 'مقاس موحد (Free Size)', sizes: ['Free Size'] },
  ];

  const handleApplyPresetSizes = (preset: string[]) => {
    if (isReadOnly) return;
    const current = new Set(order.sizes.map((s) => s.size));
    const toAdd = preset.filter((s) => !current.has(s));
    if (toAdd.length === 0) {
      setSuccess('جميع مقاسات هذه المجموعة مضافة بالفعل.');
      return;
    }
    let updated = order;
    for (const sz of toAdd) {
      updated = Cmd.addSize(updated, sz);
    }
    setOrder(updated);
    setSuccess(`تمت إضافة ${toAdd.length} مقاسات بنجاح.`);
  };

  const handleApplyDistributeColor = () => {
    if (isReadOnly || !distributeColor.trim()) return;
    const qty = Number(distributeQty) || 0;
    if (qty <= 0) {
      setError('يرجى كتابة كمية صحيحة أكبر من صفر');
      return;
    }
    if (order.sizes.length === 0) {
      setError('يرجى إضافة مقاس واحد على الأقل أولاً لتوزيع الألوان عليه');
      return;
    }
    let updated = order;
    let addedCount = 0;
    for (const sz of updated.sizes) {
      const hasColor = sz.variants.some((v) => v.color === distributeColor.trim());
      if (!hasColor) {
        updated = Cmd.addVariant(updated, sz.size, distributeColor.trim(), qty);
        addedCount++;
      }
    }
    setOrder(updated);
    setIsDistributeModalOpen(false);
    setDistributeColor('');
    setDistributeQty('');
    setSuccess(`تم توزيع اللون "${distributeColor}" على ${addedCount} مقاس بمقدار ${qty} قطعة لكل مقاس بنجاح.`);
  };

  const usedSizes = order.sizes.map((s) => s.size);
  const allSizes = getAvailableSizes();
  const availableSizes = allSizes.filter((s) => !usedSizes.includes(s));
  const availableColorsForDistribute = getAvailableColors();

  const totalPieces = order.sizes.reduce(
    (sum, s) => sum + s.variants.reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0),
    0
  );
  const materialsCount = (order.materials?.length || 0) + (order.accessories?.length || 0);

  const tabs = [
    {
      id: 'basic' as const,
      num: '1',
      title: 'بيانات الموديل والتكاليف',
      subtitle: order.styleName ? order.styleName : 'الموديل، العميل، التكاليف المعيارية',
      isDone: Boolean(order.styleName && order.customerName),
      icon: SlidersHorizontal,
    },
    {
      id: 'sizes' as const,
      num: '2',
      title: 'المقاسات والألوان والكميات',
      subtitle: `${order.sizes.length} مقاس • ${totalPieces} قطعة إجمالية`,
      isDone: order.sizes.length > 0 && totalPieces > 0,
      icon: Layers,
    },
    {
      id: 'bom' as const,
      num: '3',
      title: 'خامات ومستلزمات الإنتاج (BOM)',
      subtitle: `${materialsCount} بند مسجل`,
      isDone: materialsCount > 0,
      icon: FileSpreadsheet,
    },
    {
      id: 'review' as const,
      num: '4',
      title: 'المراجعة الشاملة والاعتماد',
      subtitle: order.status === 'مسودة' ? 'فحص الجاهزية والاعتماد' : 'أمر معتمد',
      isDone: order.status !== 'مسودة',
      icon: CheckSquare,
    },
  ];

  const fabricSummary = calculateFabricAnalysis(order, order.cutData);
  return (
    <>
      <div className="space-y-6 print:hidden">
        <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        message={confirmConfig?.message || ""}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => confirmConfig?.onCancel()}
      />
      {success && (
        <Toast
          message={success}
          type="success"
          onClose={() => setSuccess(null)}
        />
      )}
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}

      {/* Distribute Color Modal */}
      {isDistributeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-5 py-4 border-b border-indigo-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">توزيع لون على جميع المقاسات</h3>
                  <p className="text-xs text-slate-500">إضافة نفس اللون والكمية لجميع المقاسات الحالية بضغطة واحدة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDistributeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اختر أو اكتب اسم اللون</label>
                <input
                  type="text"
                  value={distributeColor}
                  onChange={(e) => setDistributeColor(e.target.value)}
                  placeholder="مثال: أسود، كحلي، أبيض..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                />
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {availableColorsForDistribute.slice(0, 12).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDistributeColor(c)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                        distributeColor === c
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الكمية لكل مقاس (قطعة)</label>
                <input
                  type="number"
                  min="1"
                  value={distributeQty}
                  onChange={(e) => setDistributeQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="مثال: 50"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                <p className="font-semibold">سيتم تطبيق هذا اللون على المقاسات الحالية:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {order.sizes.map((s) => (
                    <span key={s.size} className="px-2 py-0.5 bg-white rounded border border-amber-200 font-mono font-bold text-[11px]">
                      {s.size}
                    </span>
                  ))}
                </div>
                {distributeQty && Number(distributeQty) > 0 && (
                  <p className="pt-1 text-slate-600">
                    إجمالي القطع المضافة: <strong className="text-indigo-700 font-bold">{order.sizes.length * Number(distributeQty)}</strong> قطعة
                  </p>
                )}
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDistributeModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApplyDistributeColor}
                disabled={!distributeColor.trim() || !distributeQty || Number(distributeQty) <= 0}
                className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                توزيع اللون الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl shadow-xs border border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                {isReadOnly
                  ? `عرض أمر الإنتاج`
                  : orderId
                    ? "تعديل أمر الإنتاج"
                    : "إنشاء أمر إنتاج أولي"}
              </h2>
              <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg">
                {order.orderNumber}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  order.status === 'مسودة'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {order.styleName ? `الموديل: ${order.styleName}` : 'لم يتم تحديد اسم الموديل بعد'} • {totalPieces} قطعة إجمالية
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode switch */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode('stepper')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'stepper'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              خطوات مريحة
            </button>
            <button
              type="button"
              onClick={() => setViewMode('continuous')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'continuous'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              عرض كامل الصفحة
            </button>
          </div>

          {orderId && Cmd.canDeleteProductionOrder(order) && (
            <button
              type="button"
              onClick={handleDeleteOrder}
              className="flex items-center gap-1.5 bg-white text-red-600 border border-red-200 px-3.5 py-2 rounded-xl hover:bg-red-50 transition-colors shadow-2xs font-medium text-xs"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </button>
          )}

          <button
            type="button"
            onClick={handlePrintOrder}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl transition-colors shadow-2xs font-bold text-xs cursor-pointer"
            title="طباعة أمر التشغيل والإنتاج بتنسيق A4"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الأمر (A4)</span>
          </button>

          {isReadOnly ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 bg-slate-700 text-white px-5 py-2 rounded-xl hover:bg-slate-800 transition-colors shadow-2xs font-bold text-xs"
            >
              إغلاق
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors shadow-2xs font-bold text-xs cursor-pointer"
                title="حفظ التعديلات كمسودة بدون أي اعتماد مع إمكانية التعديل المستمر"
              >
                <Save className="w-4 h-4" />
                حفظ كمسودة (بدون اعتماد)
              </button>
              {order.status === "مسودة" && (
                <button
                  type="button"
                  onClick={handleApproveOrder}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-2xs font-bold text-xs cursor-pointer"
                  title="الاعتماد النهائي لأمر الإنتاج والخامات وتثبيت البيانات وبدء مرحلة القص"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  الاعتماد النهائي وبدء القص
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stepper Tabs Bar (when in stepper mode) */}
      {viewMode === 'stepper' && (
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-right transition-all border ${
                    isActive
                      ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-2xs'
                      : 'bg-white border-transparent hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : tab.isDone
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.isDone ? <Check className="w-4 h-4 stroke-[3]" /> : tab.num}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <span>{tab.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                      {tab.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {order.status !== "مسودة" && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-sm">
                  تم اعتماد أمر الإنتاج وقائمة المواد والخامات (BOM) بنجاح
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                  معتمد
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                {order.productionApprovedBy ? `بواسطة: ${order.productionApprovedBy}` : ''}
                {order.productionApprovedAt ? ` • بتاريخ: ${new Date(order.productionApprovedAt).toLocaleString('ar-EG')}` : ''}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-xl">
            البيانات الأساسية وتكاليف الخامات مثبتة ومحمية من التعديل
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          
          {/* TAB 1: BASIC INFO */}
          {(viewMode === 'continuous' || activeTab === 'basic') && (
            <div className="space-y-4">
              {viewMode === 'continuous' && (
                <div className="flex items-center gap-2 border-r-4 border-indigo-600 pr-3 py-1">
                  <h3 className="text-lg font-bold text-slate-800">1. بيانات الموديل والتكاليف المعيارية</h3>
                </div>
              )}
              <OrderBasicInfo
                orderNumber={order.orderNumber}
                orderDate={order.orderDate}
                styleName={order.styleName}
                category={order.category}
                customerName={order.customerName}
                standardCutCostPerPiece={order.standardCutCostPerPiece}
                printEmbroideryStandardCost={order.printEmbroideryStandardCost}
                standardSewingCostPerPiece={order.standardSewingCostPerPiece}
                standardFinishingCostPerPiece={order.standardFinishingCostPerPiece}
                standardIroningCostPerPiece={order.standardIroningCostPerPiece}
                sellingPrice={order.sellingPrice}
                cuttingInstructions={order.cuttingInstructions}
                sewingInstructions={order.sewingInstructions}
                finishingInstructions={order.finishingInstructions}
                ironingInstructions={order.ironingInstructions}
                packingInstructions={order.packingInstructions}
                onChange={handleBasicInfoChange}
                readOnly={isReadOnly}
              />
              {viewMode === 'stepper' && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('sizes')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-colors"
                  >
                    الانتقال للمقاسات والألوان (خطوة 2)
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SIZES & VARIANTS */}
          {(viewMode === 'continuous' || activeTab === 'sizes') && (
            <div className="space-y-4">
              {viewMode === 'continuous' && (
                <div className="flex items-center gap-2 border-r-4 border-indigo-600 pr-3 py-1 mt-6">
                  <h3 className="text-lg font-bold text-slate-800">2. جدول المقاسات والألوان والكميات</h3>
                </div>
              )}

              {/* Quick Presets & Bulk Actions Bar */}
              {!isReadOnly && (
                <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      مجموعات مقاسات سريعة:
                    </span>
                    {PRESET_GROUPS.map((grp) => (
                      <button
                        key={grp.label}
                        type="button"
                        onClick={() => handleApplyPresetSizes(grp.sizes)}
                        className="text-xs bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 px-2.5 py-1.5 rounded-xl font-medium transition-all shadow-2xs"
                        title={`إضافة ${grp.sizes.join(', ')}`}
                      >
                        + {grp.label}
                      </button>
                    ))}
                  </div>

                  {order.sizes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsDistributeModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl font-bold shadow-2xs transition-colors"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      توزيع لون على المقاسات
                    </button>
                  )}
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-visible">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      جدول المقاسات وتوزيع الألوان
                    </h3>
                    <p className="text-xs text-slate-400">
                      حدد كمية كل لون داخل كل مقاس (المجموع الحالي: {totalPieces} قطعة)
                    </p>
                  </div>

                  {!isReadOnly && (
                    <div className="relative" ref={addSizeRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddSizeOpen((prev) => !prev);
                          setIsCustomSize(false);
                          setTempSize('');
                        }}
                        className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة مقاس فردي
                      </button>
                      {isAddSizeOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-1 overflow-hidden flex flex-col max-h-[400px]">
                          {!isCustomSize ? (
                            <div className="overflow-y-auto flex-1 p-1">
                              <button
                                type="button"
                                onClick={() => setIsCustomSize(true)}
                                className="w-full text-right px-3.5 py-2 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                              >
                                ✍️ كتابة مقاس مخصص يدوياً
                              </button>
                              <div className="border-b border-slate-100 my-1"></div>
                              {availableSizes.map((sz) => (
                                <button
                                  type="button"
                                  key={sz}
                                  onClick={() => {
                                    handleAddSize(sz);
                                    setIsAddSizeOpen(false);
                                  }}
                                  className="w-full text-right px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                >
                                  المقاس {sz}
                                </button>
                              ))}
                              {availableSizes.length === 0 && (
                                <div className="px-4 py-3 text-xs text-slate-400 text-center">لا توجد مقاسات قياسية متبقية</div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-50">
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المقاس الجديد</label>
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  value={tempSize}
                                  onChange={(e) => setTempSize(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const trimmed = tempSize.trim();
                                      if (trimmed) {
                                        addCustomSize(trimmed);
                                        handleAddSize(trimmed);
                                        setIsAddSizeOpen(false);
                                        setIsCustomSize(false);
                                      }
                                    } else if (e.key === 'Escape') {
                                      setIsCustomSize(false);
                                    }
                                  }}
                                  placeholder="اكتب المقاس..."
                                  autoFocus
                                  className="w-full pr-3 pl-16 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const trimmed = tempSize.trim();
                                      if (trimmed) {
                                        addCustomSize(trimmed);
                                        handleAddSize(trimmed);
                                        setIsAddSizeOpen(false);
                                        setIsCustomSize(false);
                                      }
                                    }}
                                    disabled={!tempSize.trim()}
                                    className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-lg disabled:opacity-50 transition-colors"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsCustomSize(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-5">
                  {order.sizes.length > 0 ? (
                    order.sizes.map((sizeData) => (
                      <SizeCard
                        key={sizeData.size}
                        sizeData={sizeData}
                        availableSizesToCopy={availableSizes}
                        onUpdateVariant={(variantIndex, field, value) =>
                          handleUpdateVariant(
                            sizeData.size,
                            variantIndex,
                            field,
                            value,
                          )
                        }
                        onAddVariant={() => handleAddVariant(sizeData.size)}
                        onRemoveVariant={(variantIndex) =>
                          handleRemoveVariant(sizeData.size, variantIndex)
                        }
                        onRemoveSize={() => handleRemoveSize(sizeData.size)}
                        onCopySize={(targetSize) =>
                          handleCopySize(sizeData.size, targetSize)
                        }
                        readOnly={isReadOnly}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 px-4 bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                        <Layers className="w-6 h-6" />
                      </div>
                      <p className="text-slate-700 font-bold text-sm mb-1">
                        لم يتم إضافة أي مقاسات بعد
                      </p>
                      <p className="text-slate-400 text-xs max-w-sm mx-auto mb-4">
                        اختر إحدى المجموعات الجاهزة بالأعلى (مثلاً قياسي S-2XL) أو أضف مقاسك الخاص للبدء
                      </p>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleApplyPresetSizes(PRESET_GROUPS[0].sizes)}
                          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          إضافة المقاسات القياسية (S, M, L, XL, 2XL)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {viewMode === 'stepper' && (
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('basic')}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    السابق: بيانات الموديل
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bom')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-colors"
                  >
                    الانتقال لقائمة الخامات BOM (خطوة 3)
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BOM (FABRICS & ACCESSORIES) */}
          {(viewMode === 'continuous' || activeTab === 'bom') && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2 border-r-4 border-indigo-600 pr-3 py-1">
                  <h3 className="text-lg font-bold text-slate-800">
                    {viewMode === 'continuous' ? '3. ' : ''}قائمة الخامات والإكسسوارات (BOM)
                  </h3>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsCopyBomOpen(true)}
                    className="flex items-center gap-1.5 bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-3.5 py-1.5 rounded-xl transition-colors font-bold text-xs shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    نسخ خامات من أمر إنتاج سابق
                  </button>
                )}
              </div>
              
              <BomSection
                order={order}
                onChange={handleBomChange}
                readOnly={isReadOnly}
              />
              
              <CopyBomModal 
                isOpen={isCopyBomOpen}
                onClose={() => setIsCopyBomOpen(false)}
                onSelect={handleCopyBom}
                currentOrderId={order.id}
              />

              {viewMode === 'stepper' && (
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('sizes')}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    السابق: جدول المقاسات
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('review')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-colors"
                  >
                    الانتقال للمراجعة والاعتماد (خطوة 4)
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REVIEW & APPROVAL */}
          {(viewMode === 'continuous' || activeTab === 'review') && (
            <div className="space-y-6">
              {viewMode === 'continuous' && (
                <div className="flex items-center gap-2 border-r-4 border-indigo-600 pr-3 py-1 mt-6">
                  <h3 className="text-lg font-bold text-slate-800">4. المراجعة والتحليل الشامل والاعتماد</h3>
                </div>
              )}

              {/* Readiness Checklist Card */}
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-800">فحص جاهزية أمر الإنتاج</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">تحقق من اكتمال عناصر الأمر قبل الاعتماد</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${order.styleName ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'}`}>
                    <div>
                      <p className="font-bold">اسم الموديل والتصنيف</p>
                      <p className="text-[11px] opacity-80 mt-0.5">{order.styleName || 'غير مسجل'}</p>
                    </div>
                    {order.styleName ? <Check className="w-4 h-4 text-emerald-600 font-bold" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${order.customerName ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'}`}>
                    <div>
                      <p className="font-bold">اسم العميل / الجهة</p>
                      <p className="text-[11px] opacity-80 mt-0.5">{order.customerName || 'غير مسجل'}</p>
                    </div>
                    {order.customerName ? <Check className="w-4 h-4 text-emerald-600 font-bold" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${totalPieces > 0 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'}`}>
                    <div>
                      <p className="font-bold">المقاسات والكميات</p>
                      <p className="text-[11px] opacity-80 mt-0.5">{order.sizes.length} مقاس • {totalPieces} قطعة</p>
                    </div>
                    {totalPieces > 0 ? <Check className="w-4 h-4 text-emerald-600 font-bold" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${materialsCount > 0 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <div>
                      <p className="font-bold">خامات ومستلزمات BOM</p>
                      <p className="text-[11px] opacity-80 mt-0.5">{materialsCount} بنود مسجلة</p>
                    </div>
                    {materialsCount > 0 ? <Check className="w-4 h-4 text-emerald-600 font-bold" /> : <span className="text-[11px] text-slate-400">اختياري</span>}
                  </div>
                </div>

                {!isReadOnly && order.status === 'مسودة' && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleApproveOrder}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-bold text-sm shadow-md transition-all"
                    >
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      اعتماد أمر الإنتاج وبدء التجهيز والقص الآن
                    </button>
                  </div>
                )}
              </div>

              {/* Fabric Summary */}
              {fabricSummary && (
                <div>
                  <FabricSummary summary={fabricSummary} />
                </div>
              )}

              {/* Cost Analysis Summary */}
              <div>
                <CostAnalysisSummary order={order} defaultExpanded={true} />
              </div>

              {viewMode === 'stepper' && (
                <div className="flex justify-start pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('bom')}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    السابق: خامات الإنتاج (BOM)
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* SIDEBAR: Order Summary Card */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 space-y-5">
            <OrderSummary
              sizes={order.sizes}
              actualSizes={(['القص معتمد', 'تقسيم الباتشات', 'الباتشات مثبتة', 'التجهيز جاري', 'التجهيز مكتمل', 'الطباعة والتطريز جاري', 'الطباعة والتطريز مكتمل', 'مغلق'].includes(order.status) && order.cutData?.sizes) ? order.cutData.sizes : undefined}
              sellingPrice={order.sellingPrice}
            />
            
            {order.status === "مسودة" ? (
              <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>مسودة قيد الإعداد</span>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    غير معتمد
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  هذا الأمر محفوظ كمسودة. يمكنك تعديل البيانات والمقاسات والخامات في أي وقت. لن يتم تطبيق أي اعتماد نظامي حتى الضغط على "الاعتماد النهائي وبدء القص".
                </p>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleApproveOrder}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-bold text-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    الاعتماد النهائي وبدء القص
                  </button>
                )}
              </div>
            ) : order.id ? (
              <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                    <span>تم الاعتماد بنجاح</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    معتمد
                  </span>
                </div>
                <div className="text-xs text-emerald-700 pt-1 border-t border-emerald-100 space-y-0.5">
                  <p>أمر الإنتاج وقائمة الخامات (BOM) معتمدة</p>
                  {order.productionApprovedBy && (
                    <p className="font-medium text-emerald-800">بواسطة: {order.productionApprovedBy}</p>
                  )}
                  {order.productionApprovedAt && (
                    <p className="text-slate-500 text-[11px]">{new Date(order.productionApprovedAt).toLocaleString('ar-EG')}</p>
                  )}
                </div>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </div>

    {isPrinting && (
      <div className="hidden print:block print:w-full">
        <ProductionOrderPrint order={order} />
      </div>
    )}
  </>
  );
}
