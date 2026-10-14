import { PREDEFINED_COLORS } from '../types';

const getCustomColors = (): string[] => {
  try {
    const customColorsStr = localStorage.getItem('CUSTOM_COLORS');
    return customColorsStr ? JSON.parse(customColorsStr) : [];
  } catch (e) {
    return [];
  }
};

export const getAvailableColors = (): string[] => {
  return Array.from(new Set([...PREDEFINED_COLORS, ...getCustomColors()]));
};

export const addCustomColor = (color: string) => {
  if (!color || !color.trim()) return;
  const c = color.trim();
  const current = getAvailableColors();
  if (!current.includes(c)) {
    try {
      const customColors = getCustomColors();
      customColors.push(c);
      localStorage.setItem('CUSTOM_COLORS', JSON.stringify(customColors));
    } catch (e) {
      console.error('Could not save custom color', e);
    }
  }
};
