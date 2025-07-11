"use client";

import { useThemeStore } from "@/store/theme";
import { createContext, useContext, useEffect } from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeContext = createContext<{
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
} | null>(null);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
