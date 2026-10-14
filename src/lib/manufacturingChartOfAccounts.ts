import { AccountNode } from '../types';

export const MANUFACTURING_CHART_OF_ACCOUNTS: AccountNode[] = [
  // ==========================================
  // 1 - الأصول (Assets)
  // ==========================================
  { id: '1', code: '1', name: 'الأصول', type: 'asset', level: 1, nature: 'debit', isActive: true },

  // 11 - الأصول غير المتداولة (الثابتة)
  { id: '11', code: '11', name: 'الأصول غير المتداولة (الثابتة)', type: 'asset', parentId: '1', level: 2, nature: 'debit', isActive: true },
  
  // 111 - المباني والإنشاءات الصناعية
  { id: '111', code: '111', name: 'المباني والمنشآت الصناعية', type: 'asset', parentId: '11', level: 3, nature: 'debit', isActive: true },
  { id: '1111', code: '1111', name: 'مباني المصنع وعنابر الإنتاج', type: 'asset', parentId: '111', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '1112', code: '1112', name: 'مباني الإدارة والمعارض', type: 'asset', parentId: '111', level: 4, nature: 'debit', isActive: true },

  // 112 - الآلات والمعدات وخطوط الإنتاج الصناعية
  { id: '112', code: '112', name: 'الآلات والمعدات وخطوط الإنتاج', type: 'asset', parentId: '11', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '1121', code: '1121', name: 'ماكينات الخياطة والأوفر والتطريز الصناعية', type: 'asset', parentId: '112', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '1122', code: '1122', name: 'مقصات آلية وماكينات فرد وقص القماش', type: 'asset', parentId: '112', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '1123', code: '1123', name: 'مكابس البخار وماكينات الكي والتشطيب (الفنش)', type: 'asset', parentId: '112', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '1124', code: '1124', name: 'ماكينات الطباعة والسرفلة وتركيب الإكسسوارات', type: 'asset', parentId: '112', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },

  // 113 - مجمع إهلاك الآلات والمعدات (حساب مقابل - دائن)
  { id: '113', code: '113', name: 'مجمع إهلاك الآلات والمعدات', type: 'asset', parentId: '11', level: 3, nature: 'credit', isWipOrManufacturing: true, isActive: true },
  { id: '1131', code: '1131', name: 'مجمع إهلاك ماكينات وخطوط الإنتاج', type: 'asset', parentId: '113', level: 4, nature: 'credit', isWipOrManufacturing: true, isActive: true },

  // 114 - وسائل النقل والانتقال
  { id: '114', code: '114', name: 'وسائل النقل والانتقال', type: 'asset', parentId: '11', level: 3, nature: 'debit', isActive: true },
  { id: '1141', code: '1141', name: 'سيارات نقل وتوزيع الخامات والمنتجات', type: 'asset', parentId: '114', level: 4, nature: 'debit', isActive: true },
  { id: '1142', code: '1142', name: 'مجمع إهلاك وسائل النقل', type: 'asset', parentId: '114', level: 4, nature: 'credit', isActive: true },

  // 115 - أجهزة وأنظمة وتجهيزات
  { id: '115', code: '115', name: 'أجهزة وأنظمة حاسوبية وبرامج المصنع', type: 'asset', parentId: '11', level: 3, nature: 'debit', isActive: true },
  { id: '1151', code: '1151', name: 'خوادم وحواسب وبرمجيات تخطيط موارد المصنع (ERP)', type: 'asset', parentId: '115', level: 4, nature: 'debit', isActive: true },

  // 12 - الأصول المتداولة
  { id: '12', code: '12', name: 'الأصول المتداولة', type: 'asset', parentId: '1', level: 2, nature: 'debit', isActive: true },

  // 121 - النقدية وما في حكمها
  { id: '121', code: '121', name: 'النقدية وما في حكمها', type: 'asset', parentId: '12', level: 3, nature: 'debit', isActive: true },
  { id: '1211', code: '1211', name: 'الخزينة الرئيسية للمصنع', type: 'asset', parentId: '121', level: 4, nature: 'debit', isActive: true },
  { id: '1212', code: '1212', name: 'عهد التشغيل النقدية بالورش والإنتاج', type: 'asset', parentId: '121', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '1213', code: '1213', name: 'البنك - حساب جاري المصنع', type: 'asset', parentId: '121', level: 4, nature: 'debit', isActive: true },

  // 122 - العملاء والمدينون
  { id: '122', code: '122', name: 'العملاء والمدينون التجاريون', type: 'asset', parentId: '12', level: 3, nature: 'debit', isActive: true },
  { id: '1221', code: '1221', name: 'عملاء مبيعات الملابس الجاهزة', type: 'asset', parentId: '122', level: 4, nature: 'debit', isActive: true },
  { id: '1222', code: '1222', name: 'عملاء التشغيل والتصنيع للغير (مصنعيات)', type: 'asset', parentId: '122', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '1223', code: '1223', name: 'أوراق قبض (شيكات وكمبيالات برسم التحصيل)', type: 'asset', parentId: '122', level: 4, nature: 'debit', isActive: true },

  // 123 - أرصدة مدينة أخرى ومقدمات
  { id: '123', code: '123', name: 'أرصدة مدينة أخرى ومصروفات مدفوعة مقدماً', type: 'asset', parentId: '12', level: 3, nature: 'debit', isActive: true },
  { id: '1231', code: '1231', name: 'دفعات مقدمة لموردي الأقمشة ومستلزمات الإنتاج', type: 'asset', parentId: '123', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '1232', code: '1232', name: 'مصلحة الضرائب (ضريبة مخصومة وأرصدة مدينة)', type: 'asset', parentId: '123', level: 4, nature: 'debit', isActive: true },
  { id: '1233', code: '1233', name: 'سلف وعهد مؤقتة لموظفي وعمال المصنع', type: 'asset', parentId: '123', level: 4, nature: 'debit', isActive: true },

  // 124 - المخزون السلعي والصناعي (المخازن ومراحل الإنتاج)
  { id: '124', code: '124', name: 'المخزون السلعي والصناعي', type: 'asset', parentId: '12', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },

  // 1241 - مخزون الخامات ومستلزمات الإنتاج
  { id: '1241', code: '1241', name: 'مخزون المواد الخام ومستلزمات الإنتاج', type: 'asset', parentId: '124', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '12411', code: '12411', name: 'مخزن الأقمشة والغزول (خامات رئيسية)', type: 'asset', parentId: '1241', level: 5, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '12412', code: '12412', name: 'مخزن الإكسسوارات ومستلزمات الخياطة (سوست، خيوط، أزرار)', type: 'asset', parentId: '1241', level: 5, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '12413', code: '12413', name: 'مخزن مواد التعبئة والتغليف (أكياس، كراتين، استيكرات)', type: 'asset', parentId: '1241', level: 5, nature: 'debit', isWipOrManufacturing: true, isActive: true },

  // 1242 - مخزون الإنتاج تحت التشغيل (Work In Process - WIP) [مطلوب بالتفصيل]
  { id: '1242', code: '1242', name: 'مخزون الإنتاج تحت التشغيل (WIP)', type: 'asset', parentId: '124', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '12421', code: '12421', name: 'إنتاج تحت التشغيل - مرحلة القص والتجهيز', type: 'asset', parentId: '1242', level: 5, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '12422', code: '12422', name: 'إنتاج تحت التشغيل - مرحلة الخياطة والتجميع', type: 'asset', parentId: '1242', level: 5, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '12423', code: '12423', name: 'إنتاج تحت التشغيل - مرحلة الطباعة والتطريز الخارجي', type: 'asset', parentId: '1242', level: 5, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '12424', code: '12424', name: 'إنتاج تحت التشغيل - مرحلة الكي والتشطيب والفنش', type: 'asset', parentId: '1242', level: 5, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '12425', code: '12425', name: 'إنتاج تحت التشغيل - مرحلة التعبئة والتغليف النهائي', type: 'asset', parentId: '1242', level: 5, nature: 'debit', isWipOrManufacturing: true, isActive: true },

  // 1243 - مخزون الإنتاج التام
  { id: '1243', code: '1243', name: 'مخزون الإنتاج التام (بضاعة جاهزة للبيع والتسليم)', type: 'asset', parentId: '124', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '12431', code: '12431', name: 'مخزن الملابس الجاهزة والمنتجات التامة (فرز أول)', type: 'asset', parentId: '1243', level: 5, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '12432', code: '12432', name: 'مخزن منتجات معيبة وعوادم تصنيع (فرز ثانٍ)', type: 'asset', parentId: '1243', level: 5, nature: 'debit', isWipOrManufacturing: true, isActive: true },


  // ==========================================
  // 2 - الخصوم والالتزامات (Liabilities)
  // ==========================================
  { id: '2', code: '2', name: 'الخصوم والالتزامات', type: 'liability', level: 1, nature: 'credit', isActive: true },

  // 21 - الالتزامات المتداولة (قصيرة الأجل)
  { id: '21', code: '21', name: 'الالتزامات المتداولة (قصيرة الأجل)', type: 'liability', parentId: '2', level: 2, nature: 'credit', isActive: true },

  // 211 - الموردون وحسابات الدائنين التجاريين
  { id: '211', code: '211', name: 'الموردون والتجاريون الدائنون', type: 'liability', parentId: '21', level: 3, nature: 'credit', isActive: true },
  { id: '2111', code: '2111', name: 'موردو الأقمشة والغزول والمنسوجات', type: 'liability', parentId: '211', level: 4, nature: 'credit', isWipOrManufacturing: true, isActive: true },
  { id: '2112', code: '2112', name: 'موردو الإكسسوارات ومستلزمات الإنتاج', type: 'liability', parentId: '211', level: 4, nature: 'credit', isWipOrManufacturing: true, isActive: true },
  { id: '2113', code: '2113', name: 'موردو مواد التعبئة والتغليف والكرتون', type: 'liability', parentId: '211', level: 4, nature: 'credit', isWipOrManufacturing: true, isActive: true },
  { id: '2114', code: '2114', name: 'مقاولو باطن وورش خياطة وتطريز خارجية', type: 'liability', parentId: '211', level: 4, nature: 'credit', isWipOrManufacturing: true, isActive: true },

  // 212 - أوراق دفع
  { id: '212', code: '212', name: 'أوراق دفع (شيكات صادرة للموردين)', type: 'liability', parentId: '21', level: 3, nature: 'credit', isActive: true },
  { id: '2121', code: '2121', name: 'أوراق دفع مستحقة السداد', type: 'liability', parentId: '212', level: 4, nature: 'credit', isActive: true },

  // 213 - أرصدة دائنة ومستحقات تشغيلية
  { id: '213', code: '213', name: 'أرصدة دائنة ومستحقات تشغيلية', type: 'liability', parentId: '21', level: 3, nature: 'credit', isActive: true },
  { id: '2131', code: '2131', name: 'أجور ومرتبات عمال الإنتاج والمصنع المستحقة', type: 'liability', parentId: '213', level: 4, nature: 'credit', isWipOrManufacturing: true, isActive: true },
  { id: '2132', code: '2132', name: 'تأمينات اجتماعية وصحية مستحقة', type: 'liability', parentId: '213', level: 4, nature: 'credit', isActive: true },
  { id: '2133', code: '2133', name: 'مصلحة الضرائب (ضريبة القيمة المضافة وكسب العمل)', type: 'liability', parentId: '213', level: 4, nature: 'credit', isActive: true },
  { id: '2134', code: '2134', name: 'دفعات مقدمة وعربونات أوامر تشغيل من العملاء', type: 'liability', parentId: '213', level: 4, nature: 'credit', isWipOrManufacturing: true, isActive: true },

  // 22 - الالتزامات غير المتداولة (طويلة الأجل)
  { id: '22', code: '22', name: 'الالتزامات غير المتداولة (طويلة الأجل)', type: 'liability', parentId: '2', level: 2, nature: 'credit', isActive: true },
  { id: '221', code: '221', name: 'قروض وتسهيلات بنكية لتمويل خطوط الإنتاج والآلات', type: 'liability', parentId: '22', level: 3, nature: 'credit', isWipOrManufacturing: true, isActive: true },


  // ==========================================
  // 3 - حقوق الملكية (Equity)
  // ==========================================
  { id: '3', code: '3', name: 'حقوق الملكية', type: 'equity', level: 1, nature: 'credit', isActive: true },
  { id: '31', code: '31', name: 'رأس مال المصنع المدفوع', type: 'equity', parentId: '3', level: 2, nature: 'credit', isActive: true },
  { id: '32', code: '32', name: 'احتياطيات وأرباح مرحلة (محتجزة)', type: 'equity', parentId: '3', level: 2, nature: 'credit', isActive: true },
  { id: '33', code: '33', name: 'جاري الشركاء / أصحاب المصنع', type: 'equity', parentId: '3', level: 2, nature: 'credit', isActive: true },
  { id: '34', code: '34', name: 'صافي أرباح / خسائر النشاط الصناعي للعام الحالي', type: 'equity', parentId: '3', level: 2, nature: 'credit', isActive: true },


  // ==========================================
  // 4 - الإيرادات والمبيعات (Revenues)
  // ==========================================
  { id: '4', code: '4', name: 'الإيرادات والمبيعات', type: 'revenue', level: 1, nature: 'credit', isActive: true },

  // 41 - إيرادات النشاط الإنتاجي والصناعي
  { id: '41', code: '41', name: 'إيرادات النشاط الإنتاجي والصناعي', type: 'revenue', parentId: '4', level: 2, nature: 'credit', isWipOrManufacturing: true, isActive: true },
  { id: '411', code: '411', name: 'مبيعات الملابس الجاهزة والمنتجات التامة', type: 'revenue', parentId: '41', level: 3, nature: 'credit', isActive: true },
  { id: '412', code: '412', name: 'إيرادات تشغيل وتصنيع للغير (مصنعيات وأجور تشغيل)', type: 'revenue', parentId: '41', level: 3, nature: 'credit', isWipOrManufacturing: true, isActive: true },
  { id: '413', code: '413', name: 'مبيعات عوادم وبواقي قص وهالك أقمشة', type: 'revenue', parentId: '41', level: 3, nature: 'credit', isWipOrManufacturing: true, isActive: true },

  // 42 - مردودات ومسموحات المبيعات (حساب مدين مقابل للإيراد)
  { id: '42', code: '42', name: 'مردودات ومسموحات المبيعات', type: 'revenue', parentId: '4', level: 2, nature: 'debit', isActive: true },
  { id: '421', code: '421', name: 'مردودات مبيعات ملابس جاهزة', type: 'revenue', parentId: '42', level: 3, nature: 'debit', isActive: true },
  { id: '422', code: '422', name: 'خصم مسموح به ومسموحات مبيعات', type: 'revenue', parentId: '42', level: 3, nature: 'debit', isActive: true },

  // 43 - إيرادات أخرى
  { id: '43', code: '43', name: 'إيرادات تشغيلية واستثنائية أخرى', type: 'revenue', parentId: '4', level: 2, nature: 'credit', isActive: true },
  { id: '431', code: '431', name: 'إيرادات متنوعة ورواكد', type: 'revenue', parentId: '43', level: 3, nature: 'credit', isActive: true },


  // ==========================================
  // 5 - تكاليف الإنتاج والتصنيع (Cost of Goods Manufactured)
  // ==========================================
  { id: '5', code: '5', name: 'تكاليف الإنتاج والتصنيع', type: 'expense', level: 1, nature: 'debit', isWipOrManufacturing: true, isActive: true },

  // 51 - تكاليف الإنتاج الصناعي المباشرة
  { id: '51', code: '51', name: 'تكاليف الإنتاج الصناعي المباشرة', type: 'expense', parentId: '5', level: 2, nature: 'debit', isWipOrManufacturing: true, isActive: true },

  // 511 - تكلفة الخامات المباشرة المنصرفة للتشغيل
  { id: '511', code: '511', name: 'تكلفة الخامات المباشرة المنصرفة للتشغيل', type: 'expense', parentId: '51', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '5111', code: '5111', name: 'أقمشة منصرفة لأوامر القص والتشغيل', type: 'expense', parentId: '511', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '5112', code: '5112', name: 'إكسسوارات ومستلزمات خياطة منصرفة للباتشات', type: 'expense', parentId: '511', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '5113', code: '5113', name: 'مواد تعبئة وتغليف مستهلكة للمنتجات', type: 'expense', parentId: '511', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },

  // 512 - الأجور والعمالة الإنتاجية المباشرة
  { id: '512', code: '512', name: 'الأجور والعمالة الإنتاجية المباشرة (Direct Labor)', type: 'expense', parentId: '51', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '5121', code: '5121', name: 'أجور عمال ومساعدي القص والتفصيل', type: 'expense', parentId: '512', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '5122', code: '5122', name: 'أجور عمال الخياطة والتجميع والتركيب', type: 'expense', parentId: '512', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '5123', code: '5123', name: 'أجور عمال الكي والتشطيب والفنش والتعبئة', type: 'expense', parentId: '512', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '5124', code: '5124', name: 'حوافز وبدلات إنتاجية لعمال التشغيل', type: 'expense', parentId: '512', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },

  // 513 - خدمات صناعية وتشغيل للغير (مقاولو باطن)
  { id: '513', code: '513', name: 'خدمات تصنيع وتشغيل خارجية (مقاولو باطن)', type: 'expense', parentId: '51', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '5131', code: '5131', name: 'تكاليف تطريز وطباعة ملابس خارجية', type: 'expense', parentId: '513', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '5132', code: '5132', name: 'تكاليف صباغة وغسيل ومعالجة ملابس خارجية', type: 'expense', parentId: '513', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '5133', code: '5133', name: 'تكاليف ورش خياطة وتجميع خارجية (مقاول باطن)', type: 'expense', parentId: '513', level: 4, nature: 'debit', isWipOrManufacturing: true, isActive: true },

  // 52 - التكاليف الصناعية غير المباشرة (Manufacturing Overhead - MOH)
  { id: '52', code: '52', name: 'التكاليف الصناعية غير المباشرة (MOH)', type: 'expense', parentId: '5', level: 2, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '521', code: '521', name: 'قوى محركة وكهرباء ومياه المصنع', type: 'expense', parentId: '52', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '522', code: '522', name: 'وقود وسولار للغلايات ومولدات التشغيل', type: 'expense', parentId: '52', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '523', code: '523', name: 'صيانة وقطع غيار وزيوت ماكينات الإنتاج', type: 'expense', parentId: '52', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '524', code: '524', name: 'إهلاك خطوط وآلات ومعدات المصنع', type: 'expense', parentId: '52', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '525', code: '525', name: 'إيجار هناجر ومباني ورش التصنيع', type: 'expense', parentId: '52', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '526', code: '526', name: 'مرتبات المشرفين ومراقبي الجودة ومديري الإنتاج', type: 'expense', parentId: '52', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '527', code: '527', name: 'مهمات أمن صناعي وسلامة مهنية ومستهلكات الورش', type: 'expense', parentId: '52', level: 3, nature: 'debit', isWipOrManufacturing: true, isActive: true },
  { id: '529', code: '529', name: 'تكاليف صناعية غير مباشرة محملة ومستوعبة', type: 'expense', parentId: '52', level: 3, nature: 'credit', isWipOrManufacturing: true, isActive: true },


  // ==========================================
  // 6 - المصروفات البيعية والتسويقية والعمومية (Operating & G&A Expenses)
  // ==========================================
  { id: '6', code: '6', name: 'المصروفات البيعية والتسويقية والعمومية', type: 'expense', level: 1, nature: 'debit', isActive: true },

  // 61 - المصروفات البيعية والتسويقية
  { id: '61', code: '61', name: 'المصروفات البيعية والتسويقية', type: 'expense', parentId: '6', level: 2, nature: 'debit', isActive: true },
  { id: '611', code: '611', name: 'عمولات ومكافآت مندوبي ومسؤولي المبيعات والتسويق', type: 'expense', parentId: '61', level: 3, nature: 'debit', isActive: true },
  { id: '612', code: '612', name: 'دعاية وإعلان وتصوير موديلات ومعارض', type: 'expense', parentId: '61', level: 3, nature: 'debit', isActive: true },
  { id: '613', code: '613', name: 'مصاريف شحن وتوصيل مبيعات للعملاء', type: 'expense', parentId: '61', level: 3, nature: 'debit', isActive: true },

  // 62 - المصروفات الإدارية والعمومية
  { id: '62', code: '62', name: 'المصروفات الإدارية والعمومية', type: 'expense', parentId: '6', level: 2, nature: 'debit', isActive: true },
  { id: '621', code: '621', name: 'مرتبات الإدارة والمحاسبة والموارد البشرية', type: 'expense', parentId: '62', level: 3, nature: 'debit', isActive: true },
  { id: '622', code: '622', name: 'أدوات كتابية ومطبوعات مكتبية', type: 'expense', parentId: '62', level: 3, nature: 'debit', isActive: true },
  { id: '623', code: '623', name: 'مصاريف اتصالات وإنترنت وتكنولوجيا معلومات', type: 'expense', parentId: '62', level: 3, nature: 'debit', isActive: true },
  { id: '624', code: '624', name: 'مصاريف بنكية وعمولات تحويل وفوائد', type: 'expense', parentId: '62', level: 3, nature: 'debit', isActive: true },
  { id: '625', code: '625', name: 'استشارات قانونية ومحاسبية ورسوم وتراخيص', type: 'expense', parentId: '62', level: 3, nature: 'debit', isActive: true },
  { id: '626', code: '626', name: 'ضيافة وبوفيه ونظافة مقرات الإدارة', type: 'expense', parentId: '62', level: 3, nature: 'debit', isActive: true },
];

/**
 * Checks if current accounts in storage have the WIP accounts or are the legacy 10-item list.
 */
export function isLegacyOrIncompleteChartOfAccounts(accounts: AccountNode[]): boolean {
  if (accounts.length < 25) return true;
  const hasWip = accounts.some(a => a.code.startsWith('1242') || a.name.includes('تحت التشغيل'));
  const hasManufacturingCost = accounts.some(a => a.code.startsWith('5') || a.name.includes('تكاليف الإنتاج') || a.name.includes('تكاليف التصنيع'));
  return !hasWip || !hasManufacturingCost;
}
