import React, { useState, useEffect, useMemo } from 'react';
import { TreasuryTransaction, TreasuryTransactionType, PaymentChannel } from '../../types/treasury';
import { getCustomersSuppliers } from '../../lib/accountingStorage';
import { getSalesInvoices } from '../../lib/salesStorage';
import { getPurchases } from '../../lib/purchasesStorage';
import { getOrders } from '../../lib/storage';
import { getAccounts } from '../../lib/accountingStorage';
import { generateVoucherNumber } from '../../lib/treasuryStorage';
import { getActiveSessionUser } from '../../lib/usersStorage';
import { CustomerSupplier, AccountNode } from '../../types';
import { SalesInvoice } from '../../types/sales';
import { PurchaseInvoice } from '../../types';
import {
  X,
  CheckCircle2,
  DollarSign,
  Calendar,
  Building,
  User,
  CreditCard,
  Layers,
  FileText,
  AlertCircle,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Search,
  Sparkles
} from 'lucide-react';

interface TreasuryTransactionModalProps {
  initialType?: TreasuryTransactionType;
  onClose: () => void;
  onSubmit: (transaction: Omit<TreasuryTransaction, 'id' | 'createdAt' | 'voucherNumber'> & { voucherNumber?: string }) => void;
}

export function TreasuryTransactionModal({
  initialType = 'customer_collection',
  onClose,
  onSubmit
}: TreasuryTransactionModalProps) {
  const [type, setType] = useState<TreasuryTransactionType>(initialType);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(new Date().toTimeString().slice(0, 8));
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>('cash');
  const [fundAccountCode, setFundAccountCode] = useState<string>('1211');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [beneficiary, setBeneficiary] = useState<string>('');
  const [costCenterId, setCostCenterId] = useState<string>('');

  // Counterparty & Category states
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [customTargetAccountCode, setCustomTargetAccountCode] = useState<string>('');
  const [categoryLabel, setCategoryLabel] = useState<string>('');

  // Data sources initialized directly to avoid initialization race conditions
  const [parties, setParties] = useState<CustomerSupplier[]>(() => {
    try { return getCustomersSuppliers(); } catch { return []; }
  });
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>(() => {
    try { return getSalesInvoices(); } catch { return []; }
  });
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => {
    try { return getPurchases(); } catch { return []; }
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<AccountNode[]>(() => {
    try { return getAccounts(); } catch { return []; }
  });
  const [generatedVoucherNum, setGeneratedVoucherNum] = useState<string>(() => generateVoucherNumber(initialType));

  useEffect(() => {
    try { setParties(getCustomersSuppliers()); } catch {}
    try { setSalesInvoices(getSalesInvoices()); } catch {}
    try { setPurchaseInvoices(getPurchases()); } catch {}
    try { getOrders().then(setOrders); } catch {}
    try { setAccounts(getAccounts()); } catch {}
  }, []);

  useEffect(() => {
    setGeneratedVoucherNum(generateVoucherNumber(type));
  }, [type]);

  // Selected party object safely resolved
  const selectedParty = useMemo(() => {
    return parties.find(p => p.id === selectedPartyId);
  }, [parties, selectedPartyId]);

  const selectedPartyName = selectedParty ? selectedParty.name : '';

  // Fund accounts list (الخزينة الرئيسية، عهدة التشغيل، البنك)
  const fundAccounts = useMemo(() => {
    return [
      { code: '1211', name: 'الخزينة الرئيسية للمصنع' },
      { code: '1212', name: 'عهد التشغيل النقدية بالورش' },
      { code: '1213', name: 'البنك - حساب جاري المصنع' }
    ];
  }, []);

  // Filtered counterparties
  const customers = useMemo(() => {
    return parties.filter(p => p.type === 'customer' || p.type === 'both');
  }, [parties]);

  const suppliers = useMemo(() => {
    return parties.filter(p => p.type === 'supplier' || p.type === 'both');
  }, [parties]);

  // Unpaid invoices for selected customer
  const customerUnpaidInvoices = useMemo(() => {
    if (!selectedPartyId && !selectedPartyName) return salesInvoices.filter(i => (i.remainingAmount || 0) > 0);
    return salesInvoices.filter(i => {
      const matchId = selectedPartyId && i.customerId === selectedPartyId;
      const matchName = selectedPartyName && i.customerName?.includes(selectedPartyName);
      return (matchId || matchName) && (Number(i.remainingAmount) || 0) > 0;
    });
  }, [salesInvoices, selectedPartyId, selectedPartyName]);

  // Unpaid invoices for selected supplier
  const supplierUnpaidInvoices = useMemo(() => {
    if (!selectedPartyId && !selectedPartyName) return purchaseInvoices.filter(p => (p.remainingAmount || 0) > 0);
    return purchaseInvoices.filter(p => {
      const matchId = selectedPartyId && p.supplierId === selectedPartyId;
      const matchName = selectedPartyName && p.supplierName?.includes(selectedPartyName);
      return (matchId || matchName) && (Number(p.remainingAmount) || 0) > 0;
    });
  }, [purchaseInvoices, selectedPartyId, selectedPartyName]);

  // Predefined Other Revenues
  const otherRevenueOptions = useMemo(() => {
    return [
      { code: '412', name: 'إيرادات تشغيل وتصنيع للغير (مصنعيات وأجور تشغيل)', label: 'تشغيل وتصنيع للغير' },
      { code: '413', name: 'مبيعات عوادم وبواقي قص وهالك أقمشة', label: 'بيع عوادم وهالك أقمشة' },
      { code: '431', name: 'إيرادات تشغيلية واستثنائية ورواكد أخرى', label: 'إيرادات متنوعة ورواكد' },
      { code: '1222', name: 'عملاء التشغيل والتصنيع للغير (مصنعيات)', label: 'تحصيل مصنعية تشغيل' }
    ];
  }, []);

  // Predefined Other Expenses
  const otherExpenseOptions = useMemo(() => {
    return [
      // Manufacturing Overhead (52x)
      { code: '521', name: 'قوى محركة وكهرباء ومياه المصنع', group: 'تكاليف صناعية ومرافق', label: 'كهرباء ومياه المصنع' },
      { code: '522', name: 'وقود وسولار للغلايات ومولدات التشغيل', group: 'تكاليف صناعية ومرافق', label: 'سولار ووقود غلايات' },
      { code: '523', name: 'صيانة وقطع غيار وزيوت ماكينات الإنتاج', group: 'تكاليف صناعية ومرافق', label: 'صيانة ماكينات الإنتاج' },
      { code: '525', name: 'إيجار هناجر ومباني ورش التصنيع', group: 'تكاليف صناعية ومرافق', label: 'إيجار عنابر الإنتاج' },
      { code: '527', name: 'مهمات أمن صناعي وسلامة مهنية ومستهلكات الورش', group: 'تكاليف صناعية ومرافق', label: 'مهمات أمن ومستهلكات' },
      { code: '5131', name: 'تكاليف تطريز وطباعة ملابس خارجية (مقاول باطن)', group: 'تشغيل خارجي ومصنعيات', label: 'طباعة وتطريز خارجي' },
      { code: '5132', name: 'تكاليف صباغة وغسيل ومعالجة ملابس خارجية', group: 'تشغيل خارجي ومصنعيات', label: 'صباغة وغسيل خارجي' },
      { code: '5133', name: 'تكاليف ورش خياطة وتجميع خارجية (مقاول باطن)', group: 'تشغيل خارجي ومصنعيات', label: 'ورش خياطة خارجية' },
      // Direct Labor & Supervision (512, 526)
      { code: '5121', name: 'أجور عمال ومساعدي القص والتفصيل', group: 'أجور وعمالة الإنتاج', label: 'أجور عمال القص' },
      { code: '5122', name: 'أجور عمال الخياطة والتجميع والتركيب', group: 'أجور وعمالة الإنتاج', label: 'أجور عمال الخياطة' },
      { code: '5123', name: 'أجور عمال الكي والتشطيب والفنش والتعبئة', group: 'أجور وعمالة الإنتاج', label: 'أجور الكي والتشطيب' },
      { code: '5124', name: 'حوافز وبدلات إنتاجية لعمال التشغيل', group: 'أجور وعمالة الإنتاج', label: 'حوافز إنتاجية' },
      { code: '526', name: 'مرتبات المشرفين ومراقبي الجودة ومديري الإنتاج', group: 'أجور وعمالة الإنتاج', label: 'مرتبات المشرفين والجودة' },
      // Selling & Marketing (61x)
      { code: '611', name: 'عمولات ومكافآت مندوبي ومسؤولي المبيعات والتسويق', group: 'مصروفات بيع وتسويق', label: 'عمولات مبيعات' },
      { code: '612', name: 'دعاية وإعلان وتصوير موديلات ومعارض', group: 'مصروفات بيع وتسويق', label: 'دعاية وإعلان وتصوير' },
      { code: '613', name: 'مصاريف شحن وتوصيل مبيعات للعملاء', group: 'مصروفات بيع وتسويق', label: 'شحن ونقل مبيعات' },
      // Administrative (62x)
      { code: '621', name: 'مرتبات الإدارة والمحاسبة والموارد البشرية', group: 'مصروفات عمومية وإدارية', label: 'مرتبات الإدارة والمحاسبة' },
      { code: '622', name: 'أدوات كتابية ومطبوعات مكتبية', group: 'مصروفات عمومية وإدارية', label: 'أدوات كتابية ومطبوعات' },
      { code: '623', name: 'مصاريف اتصالات وإنترنت وتكنولوجيا معلومات', group: 'مصروفات عمومية وإدارية', label: 'اتصالات وإنترنت' },
      { code: '624', name: 'مصاريف بنكية وعمولات تحويل وفوائد', group: 'مصروفات عمومية وإدارية', label: 'مصاريف بنكية وعمولات' },
      { code: '625', name: 'استشارات قانونية ومحاسبية ورسوم وتراخيص', group: 'مصروفات عمومية وإدارية', label: 'رسوم حكومية وتراخيص' },
      { code: '626', name: 'ضيافة وبوفيه ونظافة مقرات الإدارة', group: 'مصروفات عمومية وإدارية', label: 'ضيافة ونظافة وبوفيه' }
    ];
  }, []);

  // When type changes, set defaults
  useEffect(() => {
    setSelectedPartyId('');
    setSelectedInvoiceId('');
    setAmount('');
    setReferenceNumber('');
    setBeneficiary('');
    setCostCenterId('');

    if (type === 'customer_collection') {
      setCustomTargetAccountCode('1221');
      setCategoryLabel('تحصيل فاتورة مبيعات');
      setDescription('تحصيل نقدي من حساب العميل');
    } else if (type === 'other_revenue') {
      setCustomTargetAccountCode('413');
      setCategoryLabel('بيع عوادم وهالك أقمشة');
      setDescription('إيراد بيع عوادم أقمشة');
    } else if (type === 'supplier_payment') {
      setCustomTargetAccountCode('2111');
      setCategoryLabel('سداد مستحقات مورد');
      setDescription('سداد دفعة للمورد عن توريد خامات');
    } else if (type === 'other_expense') {
      setCustomTargetAccountCode('521');
      setCategoryLabel('كهرباء ومياه المصنع');
      setDescription('سداد مصروف استهلاك مرافق');
    }
  }, [type]);

  // Auto-fill when a customer invoice is selected
  const handleSelectCustomerInvoice = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = salesInvoices.find(i => i.id === invId);
    if (inv) {
      if (inv.remainingAmount) {
        setAmount(inv.remainingAmount);
      }
      if (!selectedPartyId && inv.customerId) {
        setSelectedPartyId(inv.customerId);
      }
      setDescription(`تحصيل من قيمة فاتورة مبيعات رقم ${inv.invoiceNumber} - عميل: ${inv.customerName}`);
    }
  };

  // Auto-fill when a supplier invoice is selected
  const handleSelectSupplierInvoice = (purId: string) => {
    setSelectedInvoiceId(purId);
    const pur = purchaseInvoices.find(p => p.id === purId);
    if (pur) {
      if (pur.remainingAmount) {
        setAmount(pur.remainingAmount);
      }
      if (!selectedPartyId && pur.supplierId) {
        setSelectedPartyId(pur.supplierId);
      }
      setDescription(`سداد مستحقات فاتورة شراء رقم ${pur.invoiceNumber} - مورد: ${pur.supplierName}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    const fundAcc = fundAccounts.find(a => a.code === fundAccountCode) || fundAccounts[0];

    let targetAccCode = customTargetAccountCode;
    let targetAccName = '';

    if (type === 'customer_collection') {
      targetAccCode = '1221';
      targetAccName = 'عملاء مبيعات الملابس الجاهزة';
    } else if (type === 'supplier_payment') {
      targetAccCode = '2111';
      targetAccName = 'موردو الأقمشة والغزول والمنسوجات';
    } else if (type === 'other_revenue') {
      const opt = otherRevenueOptions.find(o => o.code === customTargetAccountCode);
      targetAccName = opt ? opt.name : 'إيرادات متنوعة ورواكد';
    } else {
      const opt = otherExpenseOptions.find(o => o.code === customTargetAccountCode);
      targetAccName = opt ? opt.name : 'مصروفات تشغيلية وعمومية';
    }

    let partyName = selectedPartyName;
    if (!partyName && beneficiary) {
      partyName = beneficiary;
    }

    let relInvNumber: string | undefined = undefined;
    if (type === 'customer_collection' && selectedInvoiceId) {
      const inv = salesInvoices.find(i => i.id === selectedInvoiceId);
      relInvNumber = inv?.invoiceNumber;
    } else if (type === 'supplier_payment' && selectedInvoiceId) {
      const pur = purchaseInvoices.find(p => p.id === selectedInvoiceId);
      relInvNumber = pur?.invoiceNumber;
    }

    const activeUser = getActiveSessionUser();
    const approvedAtIso = new Date().toISOString();

    onSubmit({
      voucherNumber: generatedVoucherNum,
      type,
      date,
      time,
      amount: numericAmount,
      paymentChannel,
      fundAccountCode: fundAcc.code,
      fundAccountName: fundAcc.name,
      partyId: selectedPartyId || undefined,
      partyName: partyName || undefined,
      targetAccountCode: targetAccCode,
      targetAccountName: targetAccName,
      relatedInvoiceId: selectedInvoiceId || undefined,
      relatedInvoiceNumber: relInvNumber,
      referenceNumber: referenceNumber || undefined,
      costCenterId: costCenterId || undefined,
      categoryLabel: categoryLabel || 'معاملة مالية',
      description: description.trim() || `${generatedVoucherNum} - ${categoryLabel}`,
      notes: notes.trim() || undefined,
      beneficiary: beneficiary.trim() || undefined,
      status: 'confirmed',
      createdBy: {
        userId: activeUser.id,
        userName: activeUser.fullName || activeUser.username,
        userRole: activeUser.role
      },
      approvedBy: {
        userId: activeUser.id,
        userName: activeUser.fullName || activeUser.username,
        userRole: activeUser.role,
        userRoleLabel: activeUser.roleTitle || 'مسؤول معتمد',
        approvedAt: approvedAtIso
      },
      approvedAt: approvedAtIso,
      approvalDate: date,
      approvalTime: time
    });

    onClose();
  };

  const isReceipt = type === 'customer_collection' || type === 'other_revenue';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 my-auto flex flex-col max-h-[94vh]" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              isReceipt
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              {isReceipt ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">تسجيل حركة نقدية جديدة (إيرادات ومصروفات)</h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-300 font-bold border border-white/10">
                  {generatedVoucherNum}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                ربط آلي مع دفتر القيود اليومية وشجرة الحسابات وفواتير العملاء والموردين
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setType('customer_collection')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                type === 'customer_collection'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>إيراد تحصيل عميل</span>
            </button>

            <button
              type="button"
              onClick={() => setType('other_revenue')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                type === 'other_revenue'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>إيراد آخر</span>
            </button>

            <button
              type="button"
              onClick={() => setType('supplier_payment')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                type === 'supplier_payment'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>تسجيل سداد موردين</span>
            </button>

            <button
              type="button"
              onClick={() => setType('other_expense')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                type === 'other_expense'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>مصروف آخر</span>
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Main Info Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>تاريخ المعاملة:</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>المبلغ المالي (ج.م): <span className="text-red-500">*</span></span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="أدخل القيمة بالجنيه..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-black text-blue-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>طريقة الدفع / القناة:</span>
              </label>
              <select
                value={paymentChannel}
                onChange={e => {
                  const ch = e.target.value as PaymentChannel;
                  setPaymentChannel(ch);
                  if (ch === 'bank') setFundAccountCode('1213');
                  else if (ch === 'cash') setFundAccountCode('1211');
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="cash">نقداً بالخزينة (Cash)</option>
                <option value="bank">تحويل / إيداع بنكي (Bank Wire)</option>
                <option value="cheque">شيك مصرفي / كمبيالة (Cheque)</option>
              </select>
            </div>
          </div>

          {/* Section: Specific to Transaction Type */}
          
          {/* 1. Customer Collection (إيراد تحصيل عميل) */}
          {type === 'customer_collection' && (
            <div className="space-y-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>بيانات العميل والفواتير المرتبطة:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">اختر العميل:</label>
                  <select
                    value={selectedPartyId}
                    onChange={e => {
                      setSelectedPartyId(e.target.value);
                      setSelectedInvoiceId('');
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- اختر العميل من القائمة --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">حساب الصندوق / الإيداع:</label>
                  <select
                    value={fundAccountCode}
                    onChange={e => setFundAccountCode(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900"
                  >
                    {fundAccounts.map(fa => (
                      <option key={fa.code} value={fa.code}>{fa.code} - {fa.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Outstanding Invoices for Customer */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  ربط السداد بفاتورة مبيعات محددة (اختياري لتسوية رصيد الفاتورة):
                </label>
                {customerUnpaidInvoices.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-emerald-200 rounded-xl p-2 bg-white">
                    {customerUnpaidInvoices.map(inv => (
                      <div
                        key={inv.id}
                        onClick={() => handleSelectCustomerInvoice(inv.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          selectedInvoiceId === inv.id
                            ? 'bg-emerald-100/70 border-emerald-500 font-black shadow-2xs'
                            : 'hover:bg-slate-50 border-slate-200 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={selectedInvoiceId === inv.id}
                            onChange={() => handleSelectCustomerInvoice(inv.id)}
                            className="text-emerald-600"
                          />
                          <div>
                            <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                            <span className="text-[11px] text-slate-500 mr-2">تاريخ: {inv.date}</span>
                            <span className="text-[11px] text-indigo-700 mr-2">عميل: {inv.customerName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-left">
                          <span className="text-[11px] text-slate-500">إجمالي: {inv.grandTotal?.toLocaleString('ar-EG')} ج.م</span>
                          <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-mono">
                            المتبقي: {inv.remainingAmount?.toLocaleString('ar-EG')} ج.م
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-500 text-center text-xs">
                    لا توجد فواتير مبيعات متبقية غير مسددة بالكامل لهذا العميل، سيتم قيد التحصيل كدفعة على الحساب العام للعميل.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Other Revenue (إيراد آخر) */}
          {type === 'other_revenue' && (
            <div className="space-y-4 p-4 rounded-2xl bg-teal-50/50 border border-teal-200">
              <div className="flex items-center gap-2 text-teal-900 font-black text-sm">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>تبويب وتوجيه الإيراد الآخر:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">نوع وحساب الإيراد:</label>
                  <select
                    value={customTargetAccountCode}
                    onChange={e => {
                      setCustomTargetAccountCode(e.target.value);
                      const opt = otherRevenueOptions.find(o => o.code === e.target.value);
                      if (opt) setCategoryLabel(opt.label);
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    {otherRevenueOptions.map(opt => (
                      <option key={opt.code} value={opt.code}>
                        {opt.code} - {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">صندوق التحصيل / الإيداع:</label>
                  <select
                    value={fundAccountCode}
                    onChange={e => setFundAccountCode(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900"
                  >
                    {fundAccounts.map(fa => (
                      <option key={fa.code} value={fa.code}>{fa.code} - {fa.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1.5">الجهة / المشتري المسدد للإيراد:</label>
                  <input
                    type="text"
                    value={beneficiary}
                    onChange={e => setBeneficiary(e.target.value)}
                    placeholder="مثال: تاجر مخلفات الأقمشة، عميل مصنعية خارجية..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Supplier Payment (تسجيل سداد موردين) */}
          {type === 'supplier_payment' && (
            <div className="space-y-4 p-4 rounded-2xl bg-rose-50/50 border border-rose-200">
              <div className="flex items-center gap-2 text-rose-900 font-black text-sm">
                <Building className="w-4 h-4 text-rose-600" />
                <span>بيانات المورد وفواتير التوريد المسددة:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">اختر المورد:</label>
                  <select
                    value={selectedPartyId}
                    onChange={e => {
                      setSelectedPartyId(e.target.value);
                      setSelectedInvoiceId('');
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">-- اختر المورد من القائمة --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.contactPerson ? `(${s.contactPerson})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">الخصم من صندوق / بنك:</label>
                  <select
                    value={fundAccountCode}
                    onChange={e => setFundAccountCode(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900"
                  >
                    {fundAccounts.map(fa => (
                      <option key={fa.code} value={fa.code}>{fa.code} - {fa.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Outstanding Invoices for Supplier */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  ربط السداد بفاتورة شراء محددة (لتسوية رصيد الفاتورة):
                </label>
                {supplierUnpaidInvoices.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-rose-200 rounded-xl p-2 bg-white">
                    {supplierUnpaidInvoices.map(pur => (
                      <div
                        key={pur.id}
                        onClick={() => handleSelectSupplierInvoice(pur.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          selectedInvoiceId === pur.id
                            ? 'bg-rose-100/70 border-rose-500 font-black shadow-2xs'
                            : 'hover:bg-slate-50 border-slate-200 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={selectedInvoiceId === pur.id}
                            onChange={() => handleSelectSupplierInvoice(pur.id)}
                            className="text-rose-600"
                          />
                          <div>
                            <span className="font-bold text-slate-900">{pur.invoiceNumber}</span>
                            <span className="text-[11px] text-slate-500 mr-2">تاريخ: {pur.date}</span>
                            <span className="text-[11px] text-indigo-700 mr-2">مورد: {pur.supplierName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-left">
                          <span className="text-[11px] text-slate-500">إجمالي: {pur.grandTotal?.toLocaleString('ar-EG')} ج.م</span>
                          <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-mono">
                            المتبقي: {pur.remainingAmount?.toLocaleString('ar-EG')} ج.م
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-500 text-center text-xs">
                    لا توجد فواتير توريد مستحقة غير مسددة بالكامل لهذا المورد، سيتم قيد الدفعة كسداد على الحساب الجاري للمورد.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Other Expense (مصروف آخر) */}
          {type === 'other_expense' && (
            <div className="space-y-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>تبويب المصروف ومركز التكلفة:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">بند ونوع المصروف (شجرة الحسابات):</label>
                  <select
                    value={customTargetAccountCode}
                    onChange={e => {
                      setCustomTargetAccountCode(e.target.value);
                      const opt = otherExpenseOptions.find(o => o.code === e.target.value);
                      if (opt) setCategoryLabel(opt.label);
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    {otherExpenseOptions.map(opt => (
                      <option key={opt.code} value={opt.code}>
                        [{opt.group}] {opt.code} - {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">الخصم من صندوق / بنك:</label>
                  <select
                    value={fundAccountCode}
                    onChange={e => setFundAccountCode(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900"
                  >
                    {fundAccounts.map(fa => (
                      <option key={fa.code} value={fa.code}>{fa.code} - {fa.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">المستفيد / الجهة الصادر لها المصروف:</label>
                  <input
                    type="text"
                    value={beneficiary}
                    onChange={e => setBeneficiary(e.target.value)}
                    placeholder="مثال: شركة الكهرباء، ورشة صيانة، مندوب مشتريات..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">مركز التكلفة / أمر الإنتاج (اختياري):</label>
                  <select
                    value={costCenterId}
                    onChange={e => setCostCenterId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900"
                  >
                    <option value="">-- عام (لا يخص أمر إنتاج محدد) --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.orderNumber}>
                        أمر إنتاج: {o.orderNumber} ({o.styleName || 'موديل'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Description & Reference Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">البيان والشرح (نص السند): <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="بيان تفصيلي للسند المحاسبي..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">رقم الإيصال / الشيك / الحوالة البنكية:</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="رقم مرجعي للشيك أو الإيصال..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">ملاحظات إضافية:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="أي ملاحظات أو شروط دفع إضافية..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              إلغاء وتراجع
            </button>

            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                isReceipt
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>حفظ واعتماد السند المالي وتوليد القيد</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
