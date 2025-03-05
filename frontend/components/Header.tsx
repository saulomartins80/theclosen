import { Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import Notifications from "./Notifications";
import ProfileMenu from "./ProfileMenu";

// Tipagem para as propriedades do Header
interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md z-20">
      {/* Botão para abrir/fechar o sidebar (apenas no mobile) */}
      <button
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition md:hidden"
        onClick={toggleSidebar}
        aria-label="Abrir/Fechar Menu"
      >
        <Menu size={24} className="text-gray-900 dark:text-white" />
      </button>

      {/* Título do Header */}
      <h1 className="text-xl font-bold text-gray-900 dark:text-white ml-2 md:ml-0">
        Finanext
      </h1>

      {/* Componente de Busca (opcional) */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Ícones de Ação */}
      <div className="flex items-center space-x-4">
        <Notifications />
        <ProfileMenu />
        <ThemeToggle />
      </div>
    </header>
  );
}