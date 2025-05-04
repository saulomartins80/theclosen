import Link from "next/link";
import { Home, TrendingUp, Target, Book, PlusSquare, X, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ 
  isOpen = false, 
  onClose = () => {}, 
  onToggle = () => {},
  isMobile = false 
}: SidebarProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const isActive = (path: string) => router.pathname === path;

  // Fechar sidebar ao pressionar Escape (apenas mobile)
  useEffect(() => {
    if (!isMobile) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, isMobile]);

  const menuItems = [
    { path: "/", icon: Home, label: "Visão geral" },
    { path: "/transacoes", icon: TrendingUp, label: "Transações" },
    { path: "/metas", icon: Target, label: "Metas" },
    { path: "/investimentos", icon: PlusSquare, label: "Investimentos" },
    { path: "/ebook", icon: Book, label: "E-book" },
    { path: "/configuracoes", icon: Settings, label: "Configurações" },
  ];

  // Conteúdo compartilhado entre mobile e desktop
  const sidebarContent = (
    <>
      <div className={`flex justify-between items-center mb-6 ${collapsed ? 'px-2' : 'px-4'}`}>
        {!collapsed && <h2 className="text-2xl font-bold">Finanext</h2>}
        {isMobile ? (
          <button
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={24} />
          </button>
        ) : (
          <button
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={() => {
              setCollapsed(!collapsed);
              onToggle();
            }}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>
      <nav>
        <ul className="space-y-2">
          {menuItems.map(({ path, icon: Icon, label }) => (
            <li key={path}>
              <Link
                href={path}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive(path)
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-100"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                } ${collapsed ? 'justify-center' : ''}`}
                onClick={isMobile ? onClose : undefined}
              >
                <Icon
                  size={20}
                  className={`${
                    isActive(path)
                      ? "text-blue-600 dark:text-blue-300"
                      : "text-gray-500 dark:text-gray-400"
                  } ${collapsed ? 'mr-0' : 'mr-3'}`}
                />
                {!collapsed && <span>{label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {/* Versão Mobile */}
      {isMobile && (
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={onClose}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed w-64 bg-white dark:bg-gray-800 h-full flex-col p-5 shadow-lg z-50 lg:hidden"
              >
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Versão Desktop */}
      {!isMobile && (
        <motion.div
          initial={{ width: collapsed ? 80 : 256 }}
          animate={{ width: collapsed ? 80 : 256 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`hidden lg:flex flex-col fixed inset-y-0 left-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 overflow-hidden`}
        >
          <div className="p-2 h-full overflow-y-auto">
            {sidebarContent}
          </div>
        </motion.div>
      )}
    </>
  );
}