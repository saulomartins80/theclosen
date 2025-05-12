'use client';

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme; // Preferência do usuário: "light", "dark", ou "system"
  resolvedTheme: "light" | "dark"; // O tema que está de fato aplicado (light ou dark)
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'app-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ 
  children,
  defaultTheme = "system" 
}: { 
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [userPreference, setUserPreference] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      return storedTheme || defaultTheme;
    } catch (e) {
      console.warn("Failed to read theme from localStorage", e);
      return defaultTheme;
    }
  });

  // Inicializa resolvedTheme tentando detectar o tema do sistema se a preferência for "system"
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === 'undefined') {
      // Para SSR/build, tentamos adivinhar com base no defaultTheme, mas o useEffect no cliente corrigirá.
      // Se defaultTheme for system, é mais seguro assumir light para evitar flash de conteúdo escuro em sistema claro.
      return defaultTheme === "dark" ? "dark" : "light"; 
    }
    // No cliente, lemos a preferência real
    const preference = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null || defaultTheme;
    if (preference === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    // Se for "light" ou "dark" explicitamente
    return preference as "light" | "dark"; 
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setUserPreference(newTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn("Failed to save theme to localStorage", e);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      let newActualTheme: "light" | "dark";
      if (userPreference === "system") {
        newActualTheme = mediaQuery.matches ? "dark" : "light";
      } else {
        newActualTheme = userPreference; // "light" ou "dark"
      }

      root.classList.remove("light", "dark");
      root.classList.add(newActualTheme);
      setResolvedTheme(newActualTheme); // Atualiza o estado do resolvedTheme
    };

    applyTheme(); // Aplica o tema na montagem e quando a preferência do usuário muda

    // Listener para mudanças na preferência do sistema (apenas se a preferência for "system")
    const handleChange = () => {
      if (userPreference === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [userPreference]); // Re-executa quando a preferência do usuário (userPreference) muda

  return (
    <ThemeContext.Provider value={{ theme: userPreference, resolvedTheme, setTheme }}>
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
