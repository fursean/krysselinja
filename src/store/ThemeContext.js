import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { getTheme } from "../theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");

  const toggleTheme = useCallback(() => {
    setMode((m) => (m === "dark" ? "light" : "dark"));
  }, []);

  const theme = useMemo(() => getTheme(mode), [mode]);

  const value = useMemo(() => ({ theme, mode, isDark: mode === "dark", toggleTheme }), [
    theme,
    mode,
    toggleTheme,
  ]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme må brukes inni <ThemeProvider>");
  return ctx;
}
