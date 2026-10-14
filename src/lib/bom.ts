import { MaterialInstance, AccessoryInstance } from '../types';

export const getBomTemplateForStyle = (styleName: string): { materials: MaterialInstance[], accessories: AccessoryInstance[] } | null => {
  if (styleName.includes('تجريبي')) {
    return {
      materials: [
        {
          id: crypto.randomUUID(),
          name: 'ميلتون 3 خيط',
          type: 'قماش أساسي',
          unit: 'كجم',
          standardMethod: 'حسب المقاس',
          unifiedStandard: 0,
          sizeStandards: [
            { size: 'M', standard: 0.500 },
            { size: 'L', standard: 0.550 },
            { size: 'XL', standard: 0.600 },
            { size: 'XXL', standard: 0.650 }
          ],
          standardPrice: 150,
        },
        {
          id: crypto.randomUUID(),
          name: 'قماش جيب',
          type: 'قماش مساعد',
          unit: 'متر',
          standardMethod: 'موحد',
          unifiedStandard: 0.25,
          sizeStandards: [],
        }
      ],
      accessories: [
        {
          id: crypto.randomUUID(),
          name: 'ليبل',
          type: 'تيكت',
          unit: 'قطعة',
          standardMethod: 'موحد',
          unifiedStandard: 1,
          sizeStandards: [],
        },
        {
          id: crypto.randomUUID(),
          name: 'استك',
          type: 'خردوات',
          unit: 'متر',
          standardMethod: 'حسب المقاس',
          unifiedStandard: 0,
          sizeStandards: [
            { size: 'M', standard: 1.00 },
            { size: 'L', standard: 1.10 },
            { size: 'XL', standard: 1.20 },
            { size: 'XXL', standard: 1.30 }
          ],
          standardPrice: 5,
        }
      ]
    };
  }
  return null;
};
