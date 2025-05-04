import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useIsMounted } from "../src/hooks/useIsMounted";

export default function ThemeToggle() {
  const isMounted = useIsMounted();
  const { theme, setTheme } = useTheme();

  if (!isMounted) {
    return (
      <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
        <Monitor className="h-5 w-5" />
      </button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}