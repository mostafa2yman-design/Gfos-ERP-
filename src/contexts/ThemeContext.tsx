import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeColor, ThemeRadius } from "../lib/theme";

interface ThemeContextType {
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
  radius: ThemeRadius;
  setRadius: (radius: ThemeRadius) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  toggleDarkMode: () => void;
  language: "ar" | "en";
  setLanguage: (lang: "ar" | "en") => void;
  toggleLanguage: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState<ThemeColor>("gfos");
  const [radius, setRadius] = useState<ThemeRadius>("lg");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");

  useEffect(() => {
    const savedColor = localStorage.getItem("ui-theme-color") as ThemeColor;
    const savedRadius = localStorage.getItem("ui-theme-radius") as ThemeRadius;
    const savedDark = localStorage.getItem("ui-theme-dark");
    const savedLang = localStorage.getItem("ui-theme-lang") as "ar" | "en";

    if (savedColor) setColor(savedColor);
    if (savedRadius) setRadius(savedRadius);
    if (savedDark !== null) {
      const darkVal = savedDark === "true";
      setIsDark(darkVal);
      if (darkVal) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    if (savedLang) {
      setLanguage(savedLang);
      document.documentElement.setAttribute("dir", savedLang === "ar" ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", savedLang);
    }
  }, []);

  const handleSetColor = (c: ThemeColor) => {
    setColor(c);
    localStorage.setItem("ui-theme-color", c);
  };

  const handleSetRadius = (r: ThemeRadius) => {
    setRadius(r);
    localStorage.setItem("ui-theme-radius", r);
  };

  const handleSetDark = (dark: boolean) => {
    setIsDark(dark);
    localStorage.setItem("ui-theme-dark", String(dark));
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleDarkMode = () => {
    handleSetDark(!isDark);
  };

  const handleSetLanguage = (lang: "ar" | "en") => {
    setLanguage(lang);
    localStorage.setItem("ui-theme-lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  };

  const toggleLanguage = () => {
    handleSetLanguage(language === "ar" ? "en" : "ar");
  };

  return (
    <ThemeContext.Provider
      value={{
        color,
        setColor: handleSetColor,
        radius,
        setRadius: handleSetRadius,
        isDark,
        setIsDark: handleSetDark,
        toggleDarkMode,
        language,
        setLanguage: handleSetLanguage,
        toggleLanguage,
      }}
    >
      <div
        data-theme-color={color}
        data-theme-radius={radius}
        className={`w-full h-full min-h-screen ${isDark ? "dark bg-[#0a0514] text-slate-100" : "bg-slate-50 text-slate-900"}`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

