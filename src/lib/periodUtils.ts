/**
 * Factory Period & Weekly Utilities
 * اغلب الشغل في مصانع الملابس والمصانع الإنتاجية يعتمد على دورات العمل الأسبوعية
 * (تسليمات أسبوعية، رواتب أسبوعية، خطط قص وتشغيل أسبوعية).
 */

export interface DateRangePreset {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isWeekly?: boolean;
}

/**
 * Returns date range for a factory week.
 * In Egyptian and Arab factories, the production week starts on Saturday.
 * offsetWeeks = 0 => This Week (هذا الأسبوع)
 * offsetWeeks = -1 => Last Week (الأسبوع السابق)
 * offsetWeeks = 1 => Next Week (الأسبوع القادم)
 */
export function getFactoryWeekRange(offsetWeeks = 0): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const day = now.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  
  // Calculate distance back to Saturday (beginning of the factory week)
  const diffToSaturday = day === 6 ? 0 : day + 1;
  
  const start = new Date(now);
  start.setDate(now.getDate() - diffToSaturday + (offsetWeeks * 7));
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // End on Friday
  end.setHours(23, 59, 59, 999);
  
  const pad = (n: number) => String(n).padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  
  const startDate = format(start);
  const endDate = format(end);
  
  let label = 'هذا الأسبوع';
  if (offsetWeeks === -1) label = 'الأسبوع السابق';
  else if (offsetWeeks === 1) label = 'الأسبوع القادم';
  else if (offsetWeeks !== 0) label = `أسبوع (${startDate})`;

  return { startDate, endDate, label };
}

/**
 * Resolves standard period presets for factory views
 */
export function getPeriodDateRange(preset: string): { startDate: string; endDate: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = format(now);

  switch (preset) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr };

    case 'this_week':
    case 'week': {
      const { startDate, endDate } = getFactoryWeekRange(0);
      return { startDate, endDate };
    }

    case 'last_week': {
      const { startDate, endDate } = getFactoryWeekRange(-1);
      return { startDate, endDate };
    }

    case 'next_week': {
      const { startDate, endDate } = getFactoryWeekRange(1);
      return { startDate, endDate };
    }

    case 'this_month':
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: format(start), endDate: format(end) };
    }

    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: format(start), endDate: format(end) };
    }

    case 'this_quarter': {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const end = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      return { startDate: format(start), endDate: format(end) };
    }

    case 'this_year':
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { startDate: format(start), endDate: format(end) };
    }

    case 'all':
    default:
      return { startDate: '', endDate: '' };
  }
}
