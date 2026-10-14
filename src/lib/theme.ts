export type ThemeColor = "gfos" | "indigo" | "orange" | "blue" | "emerald" | "slate";
export type ThemeRadius = "none" | "sm" | "md" | "lg" | "full";

export const getPrimaryBg = (color: ThemeColor) => {
  switch (color) {
    case "gfos": return "bg-[#2C1151]";
    case "orange": return "bg-orange-500";
    case "indigo": return "bg-indigo-600";
    case "blue": return "bg-blue-600";
    case "emerald": return "bg-emerald-600";
    case "slate": return "bg-slate-800";
    default: return "bg-[#2C1151]";
  }
};

export const getPrimaryText = (color: ThemeColor) => {
  switch (color) {
    case "gfos": return "text-[#2C1151] dark:text-[#a87ffb]";
    case "orange": return "text-orange-500 dark:text-orange-400";
    case "indigo": return "text-indigo-600 dark:text-indigo-400";
    case "blue": return "text-blue-600 dark:text-blue-400";
    case "emerald": return "text-emerald-600 dark:text-emerald-400";
    case "slate": return "text-slate-800 dark:text-slate-300";
    default: return "text-[#2C1151] dark:text-[#a87ffb]";
  }
};

export const getRadiusClass = (radius: ThemeRadius) => {
  switch (radius) {
    case "none": return "rounded-none";
    case "sm": return "rounded-sm";
    case "md": return "rounded-md";
    case "lg": return "rounded-lg";
    case "full": return "rounded-full";
    default: return "rounded-lg";
  }
};

