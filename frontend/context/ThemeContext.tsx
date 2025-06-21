import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme; // Preferência do usuário: "light", "dark", ou "system"
  resolvedTheme: "light" | "dark"; // O tema que está de fato aplicado (light ou dark)
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
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
  const [mounted, setMounted] = useState(false);
  const [userPreference, setUserPreference] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    
    // Recupera o tema do localStorage apenas no cliente
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (storedTheme) {
        setUserPreference(storedTheme);
      }
    } catch (e) {
      console.warn("Failed to read theme from localStorage", e);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setUserPreference(newTheme);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (e) {
        console.warn("Failed to save theme to localStorage", e);
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(userPreference === 'dark' ? 'light' : 'dark');
  }, [userPreference, setTheme]);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      let newActualTheme: "light" | "dark";
      if (userPreference === "system") {
        newActualTheme = mediaQuery.matches ? "dark" : "light";
      } else {
        newActualTheme = userPreference;
      }

      root.classList.remove("light", "dark");
      root.classList.add(newActualTheme);
      setResolvedTheme(newActualTheme);
    };

    applyTheme();

    const handleChange = () => {
      if (userPreference === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [userPreference, mounted]);

  // Durante SSR, retorna um valor padrão
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{
        theme: defaultTheme,
        resolvedTheme: "light",
        setTheme: () => {},
        toggleTheme: () => {}
      }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme: userPreference, resolvedTheme, setTheme, toggleTheme }}>
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
