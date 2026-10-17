import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeColor, ThemeRadius, ThemeFontSize, FONT_SIZE_OPTIONS } from "../lib/theme";

interface ThemeContextType {
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
  radius: ThemeRadius;
  setRadius: (radius: ThemeRadius) => void;
  fontSize: ThemeFontSize;
  setFontSize: (size: ThemeFontSize) => void;
  stepFontSize: (direction: "up" | "down") => void;
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
  const [fontSize, setFontSizeState] = useState<ThemeFontSize>("md");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");

  const applyFontSizeToDom = (size: ThemeFontSize) => {
    const opt = FONT_SIZE_OPTIONS.find((o) => o.id === size) || FONT_SIZE_OPTIONS[2];
    document.documentElement.style.fontSize = opt.cssScale;
    document.documentElement.setAttribute("data-font-size", size);
  };

  useEffect(() => {
    const savedColor = localStorage.getItem("ui-theme-color") as ThemeColor;
    const savedRadius = localStorage.getItem("ui-theme-radius") as ThemeRadius;
    const savedFontSize = localStorage.getItem("ui-theme-font-size") as ThemeFontSize;
    const savedDark = localStorage.getItem("ui-theme-dark");
    const savedLang = localStorage.getItem("ui-theme-lang") as "ar" | "en";

    if (savedColor) setColor(savedColor);
    if (savedRadius) setRadius(savedRadius);
    if (savedFontSize && FONT_SIZE_OPTIONS.some((o) => o.id === savedFontSize)) {
      setFontSizeState(savedFontSize);
      applyFontSizeToDom(savedFontSize);
    } else {
      applyFontSizeToDom("md");
    }

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

  const handleSetFontSize = (size: ThemeFontSize) => {
    setFontSizeState(size);
    localStorage.setItem("ui-theme-font-size", size);
    applyFontSizeToDom(size);
  };

  const stepFontSize = (direction: "up" | "down") => {
    const currentIndex = FONT_SIZE_OPTIONS.findIndex((o) => o.id === fontSize);
    if (currentIndex === -1) return;
    if (direction === "up" && currentIndex < FONT_SIZE_OPTIONS.length - 1) {
      handleSetFontSize(FONT_SIZE_OPTIONS[currentIndex + 1].id);
    } else if (direction === "down" && currentIndex > 0) {
      handleSetFontSize(FONT_SIZE_OPTIONS[currentIndex - 1].id);
    }
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
        fontSize,
        setFontSize: handleSetFontSize,
        stepFontSize,
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
        data-font-size={fontSize}
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
