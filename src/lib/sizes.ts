import { PREDEFINED_SIZES } from '../types';

const getCustomSizes = (): string[] => {
  try {
    const customSizesStr = localStorage.getItem('CUSTOM_SIZES');
    return customSizesStr ? JSON.parse(customSizesStr) : [];
  } catch (e) {
    return [];
  }
};

export const getAvailableSizes = (): string[] => {
  return Array.from(new Set([...PREDEFINED_SIZES, ...getCustomSizes()]));
};

export const addCustomSize = (size: string) => {
  if (!size || !size.trim()) return;
  const s = size.trim();
  const current = getAvailableSizes();
  if (!current.includes(s)) {
    try {
      const customSizes = getCustomSizes();
      customSizes.push(s);
      localStorage.setItem('CUSTOM_SIZES', JSON.stringify(customSizes));
    } catch (e) {
      console.error('Could not save custom size', e);
    }
  }
};
