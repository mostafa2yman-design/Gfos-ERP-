import React, { useState, useEffect, useRef } from "react";
import { ProductionOrder, PackingInvoice, PackingInvoiceVariant, CustomerSupplier } from "../types";
import { getOrderById } from "../lib/storage";
import { getCustomersSuppliers } from "../lib/accountingStorage";
import * as Cmd from "../lib/productionOrderCommands";
import { Toast } from "./ui/Toast";
import { Save, Plus, Printer, Trash2, ChevronDown, UserPlus, Users, CheckCircle2, PackageCheck, AlertCircle, RotateCcw, Sparkles } from "lucide-react";
import { eventBus } from "../lib/events/eventBus";
import { PackingWorkOrderPrint } from "./print/workorders/PackingWorkOrderPrint";

interface Props {
  orderId: string;
  onSaved: () => void;
  onNavigateToAccounting?: (
    tab?: any,
    returnInfo?: { orderId: string; tab: string; orderNumber?: string },
    autoOpenAdd?: boolean
  ) => void;
}

export const PackingForm: React.FC<Props> = ({ orderId, onSaved, onNavigateToAccounting }) => {
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [invoices, setInvoices] = useState<PackingInvoice[]>([]);
  const [customers, setCustomers] = useState<CustomerSupplier[]>([]);
  const [toastConfig, setToastConfig] = useState<{ message: string; type: "success" | "error"; } | null>(null);
  
  const [printing, setPrinting] = useState(false);
  
  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadCustomers = () => {
    const list = getCustomersSuppliers();
    const customerList = list.filter(c => (c.type === 'customer' || c.type === 'both') && c.isActive !== false);
    setCustomers(customerList);
  };

  useEffect(() => {
    loadCustomers();
    const handleStorageOrUpdate = () => loadCustomers();
    window.addEventListener('storage', handleStorageOrUpdate);
    window.addEventListener('customers_updated', handleStorageOrUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageOrUpdate);
      window.removeEventListener('customers_updated', handleStorageOrUpdate);
    };
  }, []);

  const handleNavigateToAddCustomer = async () => {
    // Auto-save draft before navigating so user doesn't lose anything they started filling in
    if (order) {
      try {
        const updatedOrder = { ...order, packingInvoices: invoices };
        await Cmd.saveDraft(updatedOrder);
      } catch (err) {
        console.error("Auto save draft before navigation failed", err);
      }
    }
    if (onNavigateToAccounting) {
      onNavigateToAccounting(
        'customers',
        {
          orderId,
          tab: 'packing',
          orderNumber: order?.orderNumber
        },
        true
      );
    }
  };

  const loadOrder = async () => {
    const o = await getOrderById(orderId);
    if (o) {
      setOrder(o);
      setInvoices(o.packingInvoices || []);
    }
  };

  const handlePrintAll = async () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  const calculateAvailableInventory = () => {
    if (!order) return {};
    
    // Sum from ironing data if available, else fallback to initial order sizes
    const inventory: Record<string, number> = {};
    
    let hasActualData = false;
    order.batches?.forEach(b => {
      if (b.ironingData?.status === 'مكتمل' && b.ironingData.actualQuantities) {
        hasActualData = true;
        b.ironingData.actualQuantities.forEach(q => {
          const key = `${q.size}_${q.color}`;
          inventory[key] = (inventory[key] || 0) + (Number((q as any).actualQuantity ?? (q as any).quantity) || 0);
        });
      }
    });

    if (!hasActualData) {
      order.sizes.forEach(size => {
        size.variants.forEach(v => {
          const key = `${size.size}_${v.color}`;
          inventory[key] = (inventory[key] || 0) + (Number(v.quantity) || 0);
        });
      });
    }
    
    return inventory;
  };

  const calculateRemainingInventory = () => {
    const available = calculateAvailableInventory();
    const remaining = { ...available };
    
    invoices.forEach(inv => {
      inv.variants.forEach(v => {
        const key = `${v.size}_${v.color}`;
        if (remaining[key] !== undefined) {
          remaining[key] -= (Number(v.quantity) || 0);
        }
      });
    });
    
    return remaining;
  };

  const availableInventory = calculateAvailableInventory();
  const remainingInventory = calculateRemainingInventory();

  // Get unique colors and sizes based on order sizes
  const uniqueSizes: string[] = order?.sizes.map(s => s.size) || [];
  const uniqueColors: string[] = Array.from(new Set<string>(order?.sizes.flatMap(s => s.variants.map(v => v.color)) || []));

  const handleAddInvoice = () => {
    const newInvoice: PackingInvoice = {
      id: `inv-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      customerName: order?.customerName || "",
      variants: []
    };
    setInvoices([...invoices, newInvoice]);
  };

  const handleRemoveInvoice = (id: string) => {
    setInvoices(invoices.filter(inv => inv.id !== id));
  };

  const handleInvoiceChange = (invId: string, field: string, value: string) => {
    setInvoices(invoices.map(inv => inv.id === invId ? { ...inv, [field]: value } : inv));
  };

  const handleVariantChange = (invId: string, size: string, color: string, quantity: number) => {
    setInvoices(invoices.map(inv => {
      if (inv.id !== invId) return inv;
      
      const newVariants = [...inv.variants];
      const idx = newVariants.findIndex(v => v.size === size && v.color === color);
      if (idx >= 0) {
        newVariants[idx].quantity = quantity;
      } else {
        newVariants.push({ size, color, quantity });
      }
      return { ...inv, variants: newVariants };
    }));
  };

  const isApproved = !!order?.packingApprovedAt || order?.status === 'التغليف معتمد' || order?.packingStatus === 'مكتمل';

  const handleApprove = async () => {
    if (!order) return;

    // Check if any variant quantity is entered in invoices
    const hasAnyQuantity = invoices.some(inv => inv.variants?.some(v => (Number(v.quantity) || 0) > 0));
    let currentInvoices = [...invoices];

    if (!hasAnyQuantity) {
      // Auto-fill all available inventory into an invoice for convenience
      const autoVariants: PackingInvoiceVariant[] = [];
      uniqueColors.forEach(color => {
        uniqueSizes.forEach(size => {
          const key = `${size}_${color}`;
          const qty = availableInventory[key] || 0;
          if (qty > 0) {
            autoVariants.push({ size, color, quantity: qty });
          }
        });
      });

      const newInv: PackingInvoice = {
        id: `inv-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        customerName: order.customerName || "المصنع",
        variants: autoVariants
      };
      currentInvoices = [newInv];
      setInvoices(currentInvoices);
    }

    try {
      const result = await Cmd.approvePacking(order, currentInvoices, 'المستخدم الحالي');
      if (result.success && result.data) {
        setOrder(result.data);
        eventBus.publish({
          id: crypto.randomUUID(),
          type: 'ORDER_UPDATED' as any,
          aggregateType: 'ProductionOrder',
          aggregateId: result.data.id,
          occurredAt: new Date().toISOString(),
          payload: { order: result.data }
        });
        setToastConfig({
          message: "تم اعتماد التغليف بنجاح والمنتج متوفر الآن في مخزن المنتجات التامة",
          type: "success"
        });
        onSaved();
      } else {
        setToastConfig({
          message: result.error || "حدث خطأ أثناء اعتماد التغليف",
          type: "error"
        });
      }
    } catch (err) {
      setToastConfig({ message: "حدث خطأ أثناء الاعتماد", type: "error" });
    }
  };

  const handleUnapprove = async () => {
    if (!order) return;
    try {
      const result = await Cmd.unapprovePacking(order);
      if (result.success && result.data) {
        setOrder(result.data);
        eventBus.publish({
          id: crypto.randomUUID(),
          type: 'ORDER_UPDATED' as any,
          aggregateType: 'ProductionOrder',
          aggregateId: result.data.id,
          occurredAt: new Date().toISOString(),
          payload: { order: result.data }
        });
        setToastConfig({
          message: "تم إلغاء اعتماد التغليف وإعادة فتح التعديل",
          type: "success"
        });
        onSaved();
      } else {
        setToastConfig({
          message: result.error || "تعذر إلغاء الاعتماد",
          type: "error"
        });
      }
    } catch (err) {
      setToastConfig({ message: "حدث خطأ أثناء إلغاء الاعتماد", type: "error" });
    }
  };

  const handleAutoFillRemaining = () => {
    const autoVariants: PackingInvoiceVariant[] = [];
    uniqueColors.forEach(color => {
      uniqueSizes.forEach(size => {
        const key = `${size}_${color}`;
        const rem = remainingInventory[key] || 0;
        if (rem > 0) {
          autoVariants.push({ size, color, quantity: rem });
        }
      });
    });

    if (autoVariants.length === 0) {
      setToastConfig({ message: "لا توجد كميات متبقية للتعبئة في الفاتورة", type: "error" });
      return;
    }

    const newInv: PackingInvoice = {
      id: `inv-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      customerName: order?.customerName || "المصنع",
      variants: autoVariants
    };
    setInvoices([...invoices, newInv]);
    setToastConfig({ message: "تم إنشاء فاتورة تغليف بكافة الكميات المتبقية بنجاح", type: "success" });
  };

  const handleSave = async () => {
    if (!order) return;
    try {
      const updatedOrder = { ...order, packingInvoices: invoices };
      await Cmd.saveDraft(updatedOrder);
      eventBus.publish({
        id: crypto.randomUUID(),
        type: 'ORDER_UPDATED' as any,
        aggregateType: 'ProductionOrder',
        aggregateId: updatedOrder.id,
        occurredAt: new Date().toISOString(),
        payload: { order: updatedOrder }
      });
      setToastConfig({ message: "تم حفظ بيانات التغليف بنجاح", type: "success" });
      onSaved();
    } catch (error) {
      setToastConfig({ message: "حدث خطأ أثناء الحفظ", type: "error" });
    }
  };

  if (!order) return <div>جاري التحميل...</div>;

  return (
    <>
      <div className="space-y-6 print:hidden">
        {/* Approval Status Banner */}
      {isApproved ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-emerald-950 text-base flex items-center gap-2">
                <span>تم اعتماد التغليف بنجاح</span>
                <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  المنتج مدرج بمخزن المنتجات التامة
                </span>
              </div>
              <div className="text-xs text-emerald-700 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>معتمد بواسطة: <strong>{order.packingApprovedBy || 'المستخدم'}</strong></span>
                <span>•</span>
                <span>تاريخ الاعتماد: <span dir="ltr">{new Date(order.packingApprovedAt || '').toLocaleString('ar-EG')}</span></span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUnapprove}
            className="flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 font-bold bg-white border border-emerald-200 hover:border-emerald-300 px-3 py-2 rounded-lg transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إلغاء الاعتماد للتعديل</span>
          </button>
        </div>
      ) : (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900 font-medium">
              عند الانتهاء من التغليف، اضغط على <strong>"اعتماد التغليف وإرسال لمخزن المنتجات التامة"</strong> ليصبح المنتج متاحاً في مخزن المنتجات التامة وجاهزاً للتسليم.
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#150d24] p-4 rounded-xl shadow-2xs border border-slate-200 dark:border-purple-950/70">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">تجهيز التغليف والفواتير</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">أمر رقم: {order.orderNumber}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {!isApproved && (
            <button
              onClick={handleAutoFillRemaining}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-slate-200"
              title="تعبئة كل الكميات المتبقية تلقائياً في فاتورة"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>تعبئة المتبقي آلياً</span>
            </button>
          )}

          <button
            onClick={handlePrintAll}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة أمر التغليف</span>
          </button>

          {!isApproved && (
            <button
              onClick={handleSave}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              <span>حفظ كمسودة</span>
            </button>
          )}

          {!isApproved && (
            <button
              onClick={handleApprove}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg transition-colors font-bold text-sm shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>اعتماد التغليف وإرسال للمخزن</span>
            </button>
          )}
        </div>
      </div>

      {order.packingInstructions && (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <h4 className="font-bold text-amber-900 text-sm mb-1">تعليمات وملاحظات التغليف والتخزين</h4>
          <p className="text-amber-800 text-sm whitespace-pre-wrap">{order.packingInstructions}</p>
        </div>
      )}

      {/* Remaining Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">بيانات القصة الأساسية والمتبقي للتغليف</h3>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 border-b">اللون / المقاس</th>
                {uniqueSizes.map((size) => (
                  <th key={size} className="px-4 py-3 font-semibold text-slate-700 border-b text-center">
                    {size}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-slate-700 border-b text-center">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {uniqueColors.map((color) => {
                let colorTotal = 0;
                return (
                  <tr key={color} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{color}</td>
                    {uniqueSizes.map((size) => {
                      const key = `${size}_${color}`;
                      const remain = remainingInventory[key] || 0;
                      const initial = availableInventory[key] || 0;
                      colorTotal += remain;
                      
                      return (
                        <td key={size} className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-bold ${remain > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                              {remain}
                            </span>
                            <span className="text-[10px] text-slate-400 border-t border-slate-200 mt-1 pt-1 w-8 text-center">
                              {initial}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-bold text-slate-800 bg-slate-50">
                      {colorTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-slate-500 flex gap-4">
             <div><span className="font-bold text-indigo-600">الرقم العلوي:</span> المتبقي للتغليف</div>
             <div><span className="text-slate-400">الرقم السفلي:</span> إجمالي القص/الإنتاج</div>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">فواتير التجهيز</h3>
          <button
            onClick={handleAddInvoice}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تجهيز فاتورة</span>
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 border-dashed text-center">
            <p className="text-slate-500">لا توجد فواتير تجهيز. اضغط على إضافة تجهيز فاتورة للبدء.</p>
          </div>
        ) : (
          invoices.map((inv, idx) => (
            <div key={inv.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-indigo-50/50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h4 className="font-bold text-indigo-900">فاتورة #{idx + 1}</h4>
                <button
                  onClick={() => handleRemoveInvoice(inv.id)}
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                  title="حذف الفاتورة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الفاتورة</label>
                    <input
                      type="date"
                      value={inv.date}
                      onChange={(e) => handleInvoiceChange(inv.id, 'date', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-bold text-slate-700">
                        العميل <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleNavigateToAddCustomer}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs hover:shadow-xs"
                        title="الانتقال لشاشة العملاء والموردين في التكوين الهيكلي والمالي"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                        <span>إضافة عميل</span>
                      </button>
                    </div>

                    <div className="relative">
                      <select
                        value={inv.customerName}
                        onChange={(e) => handleInvoiceChange(inv.id, 'customerName', e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none font-medium text-slate-800 transition-shadow"
                      >
                        <option value="">-- اختر العميل من القائمة --</option>
                        {order?.customerName && !customers.some(c => c.name === order.customerName) && (
                          <option value={order.customerName}>
                            {order.customerName} (عميل أمر الإنتاج)
                          </option>
                        )}
                        <option value="المصنع">المصنع (تشغيل داخلي)</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} {c.phone ? `(${c.phone})` : ''}
                          </option>
                        ))}
                        {/* Preserve existing custom customerName if not found in list */}
                        {inv.customerName &&
                          inv.customerName !== "المصنع" &&
                          inv.customerName !== order?.customerName &&
                          !customers.some((c) => c.name === inv.customerName) && (
                            <option value={inv.customerName}>
                              {inv.customerName} (مسجل سابقاً)
                            </option>
                          )}
                      </select>
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Customer info chip if available */}
                    {(() => {
                      const matched = customers.find(c => c.name === inv.customerName);
                      if (matched && (matched.phone || matched.address)) {
                        return (
                          <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 px-1">
                            {matched.phone && (
                              <span>الهاتف: <span dir="ltr" className="font-semibold text-slate-700">{matched.phone}</span></span>
                            )}
                            {matched.address && (
                              <span className="truncate">العنوان: <span className="font-semibold text-slate-700">{matched.address}</span></span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-slate-700 border-b">اللون / المقاس</th>
                        {uniqueSizes.map((size) => (
                          <th key={size} className="px-4 py-2 font-semibold text-slate-700 border-b text-center">
                            {size}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueColors.map((color) => (
                        <tr key={color} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-4 py-2 font-medium text-slate-800">{color}</td>
                          {uniqueSizes.map((size) => {
                            const variant = inv.variants.find(v => v.size === size && v.color === color);
                            const val = variant?.quantity || '';
                            const key = `${size}_${color}`;
                            
                            // To show validation: warn if input is greater than available + what was in this input before
                            const currentRemain = remainingInventory[key] || 0;
                            const maxAllowed = currentRemain + (Number(val) || 0);

                            return (
                              <td key={size} className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={maxAllowed}
                                  value={val}
                                  onChange={(e: any) => handleVariantChange(inv.id, size as string, color as string, parseInt(e.target.value as string) || 0)}
                                  className={`w-16 px-2 py-1 text-center border rounded-md focus:ring-2 focus:ring-indigo-500 ${
                                    (Number(val) || 0) > maxAllowed ? 'border-red-500 text-red-600 bg-red-50' : 'border-slate-300'
                                  }`}
                                  title={`المتاح: ${maxAllowed}`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      {toastConfig && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig(null)}
        />
      )}

      {printing && order && (
        <div className="hidden print:block print:w-full">
          <PackingWorkOrderPrint order={order} invoices={invoices} />
        </div>
      )}
    </>
  );
};
