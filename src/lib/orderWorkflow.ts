import { OrderStatus } from '../types';

export const isCutEnabled = (status: OrderStatus) => true;
export const isBatchesEnabled = (status: OrderStatus) => true;
export const isPrepEnabled = (status: OrderStatus) => true;
export const isPrintEnabled = (status: OrderStatus) => true;
export const isSewEnabled = (status: OrderStatus) => true;
export const isFinishEnabled = (status: OrderStatus) => true;
export const isPackingEnabled = (status: OrderStatus) => true;
export const isWarehouseEnabled = (status: OrderStatus) => true;

export type TabType = 'production' | 'cut' | 'batches' | 'prep' | 'print' | 'sew' | 'finish' | 'ironing' | 'packing' | 'warehouse';

export const getDefaultTabForStatus = (status: OrderStatus): TabType => {
  switch (status) {
    case 'مسودة':
      return 'production';
    case 'أمر إنتاج معتمد':
    case 'معتمد':
    case 'أمر قص':
    case 'القص الفعلي مدخل':
      return 'cut';
    case 'القص معتمد':
    case 'تقسيم الباتشات':
      return 'batches';
    case 'الباتشات مثبتة':
    case 'التجهيز جاري':
      return 'prep';
    case 'التجهيز مكتمل':
    case 'الطباعة والتطريز جاري':
      return 'print';
    case 'الطباعة والتطريز مكتمل':
      return 'sew';
    case 'الخياطة مكتملة':
    case 'التشطيب جاري':
      return 'finish';
    case 'التشطيب مكتمل':
    case 'المكواة جاري':
      return 'ironing';
    case 'المكواة مكتملة':
      return 'packing';
    case 'التغليف معتمد':
    case 'مغلق':
      return 'warehouse';
    default:
      return 'production';
  }
};
