import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dados do usuário (substitua por dados reais)
  const user = {
    name: "Saulo Martins",
    email: "saulo@example.com",
    avatar: "", // URL da imagem do avatar (vazio para simular falta de foto)
  };

  // Avatar padrão com iniciais
  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names.map((n) => n[0]).join("").toUpperCase();
  };

  // Fechar o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Função para lidar com o logout
  const handleLogout = () => {
    // Adicione a lógica de logout aqui
    console.log("Usuário deslogado");
    setIsOpen(false);
  };

  // Função para navegar para as configurações
  const handleSettings = () => {
    // Adicione a lógica de navegação aqui
    console.log("Navegar para Configurações");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu do Perfil"
      >
        {/* Avatar do Usuário */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`Avatar de ${user.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {getInitials(user.name)}
            </span>
          )}
        </div>
        <ChevronDown size={16} className="text-gray-900 dark:text-white" />
      </button>

      {/* Dropdown do Perfil */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50"
            role="menu"
          >
            {/* Informações do Usuário */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>

            {/* Opções do Menu */}
            <ul className="p-2">
              <li
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                onClick={handleSettings}
                role="menuitem"
              >
                <Settings size={16} className="text-gray-900 dark:text-white" />
                <span className="text-sm text-gray-900 dark:text-white">Configurações</span>
              </li>
              <li
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                onClick={handleLogout}
                role="menuitem"
              >
                <LogOut size={16} className="text-gray-900 dark:text-white" />
                <span className="text-sm text-gray-900 dark:text-white">Sair</span>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}