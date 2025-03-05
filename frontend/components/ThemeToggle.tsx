import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme(); // Use toggleTheme, não setTheme

  return (
    <button
      onClick={toggleTheme} // Chame toggleTheme diretamente
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
    >
      {theme === "dark" ? (
        <Sun size={24} className="text-gray-900 dark:text-white" />
      ) : (
        <Moon size={24} className="text-gray-900 dark:text-white" />
      )}
    </button>
  );
}