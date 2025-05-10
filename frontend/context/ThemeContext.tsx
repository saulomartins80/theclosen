'use client';

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark"; // O tema que está de fato aplicado (light ou dark)
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'app-theme'; // Chave para o localStorage

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ 
  children,
  defaultTheme = "system" 
}: { 
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  // Estado para a preferência de tema do usuário (light, dark, system)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme; // Retorna default no SSR ou build time
    }
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      return storedTheme || defaultTheme;
    } catch (e) {
      console.warn("Failed to read theme from localStorage", e);
      return defaultTheme;
    }
  });

  // Estado para o tema resolvido e aplicado (light ou dark)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Função para definir o tema e persistir no localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn("Failed to save theme to localStorage", e);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateActualTheme = () => {
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      const currentThemePreference = theme; // 'theme' state é a preferência do usuário
      
      let newResolvedTheme: "light" | "dark";
      if (currentThemePreference === "system") {
        newResolvedTheme = systemTheme;
      } else {
        newResolvedTheme = currentThemePreference; // "light" ou "dark"
      }

      root.classList.remove("light", "dark");
      root.classList.add(newResolvedTheme);
      setResolvedTheme(newResolvedTheme);
    };

    // Atualiza o tema na montagem e quando 'theme' (preferência) muda
    updateActualTheme();

    // Listener para mudanças na preferência do sistema (apenas se o tema for "system")
    const handleChange = () => {
      if (theme === "system") {
        updateActualTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]); // Re-executa quando 'theme' (a preferência do usuário) muda

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
