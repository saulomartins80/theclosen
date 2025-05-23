import Link from "next/link";
import { Home, TrendingUp, Target, Book, PlusSquare, X, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  isMobile?: boolean;
  initialCollapsed?: boolean;
}

interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

export default function Sidebar({ 
  isOpen = false, 
  onClose = () => {}, 
  onToggle = () => {},
  isMobile = false,
  initialCollapsed = false
}: SidebarProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  
  const isActive = (path: string) => router.pathname === path;

  // Sincroniza com o estado do layout
  useEffect(() => {
    if (!isMobile) {
      setCollapsed(initialCollapsed);
    }
  }, [initialCollapsed, isMobile]);

  // Fecha com ESC no mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, isMobile]);

  // Persiste preferência do usuário
  useEffect(() => {
    if (!isMobile && typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(collapsed));
    }
  }, [collapsed, isMobile]);

  const menuItems: MenuItem[] = [
    { path: "/", icon: Home, label: "Visão geral" },
    { path: "/transacoes", icon: TrendingUp, label: "Transações" },
    { path: "/metas", icon: Target, label: "Metas" },
    { path: "/investimentos", icon: PlusSquare, label: "Investimentos" },
    { path: "/ebook", icon: Book, label: "E-book" },
    { path: "/configuracoes", icon: Settings, label: "Configurações" },
  ];

  const sidebarContent = (
    <>
      <div className={`flex items-center mb-6 ${collapsed ? 'px-2 justify-center' : 'px-4 justify-between'}`}>
        {!collapsed && (
          <Link href="/dashboard" className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Finanext
          </Link>
        )}
        {isMobile ? (
          <button
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={onClose}
            aria-label="Fechar menu"
            aria-expanded={isOpen}
          >
            <X size={24} />
          </button>
        ) : (
          <button
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={() => {
              setCollapsed(!collapsed);
              onToggle();
            }}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>
      
      <nav aria-label="Navegação principal">
        <ul className="space-y-2">
          {menuItems.map(({ path, icon: Icon, label }) => (
            <li key={path}>
              <Link
                href={path}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive(path)
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                } ${collapsed ? 'justify-center' : ''}`}
                onClick={isMobile ? onClose : undefined}
                aria-current={isActive(path) ? "page" : undefined}
              >
                <Icon
                  size={20}
                  className={`flex-shrink-0 ${
                    isActive(path)
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  } ${collapsed ? 'mr-0' : 'mr-3'}`}
                  aria-hidden="true"
                />
                {!collapsed && (
                  <span className="text-sm font-medium">
                    {label}
                  </span>
                )}
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
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={onClose}
                aria-hidden="true"
              />
              
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ 
                  type: "tween", 
                  duration: 0.2,
                  ease: "easeInOut"
                }}
                className="fixed top-0 left-0 w-64 bg-white dark:bg-gray-800 h-full flex flex-col p-5 shadow-lg z-50 md:hidden"
                role="dialog"
                aria-modal="true"
              >
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Versão Desktop */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 80 : 256 }}
          transition={{ 
            type: "spring", 
            stiffness: 300,
            damping: 30,
            mass: 0.5
          }}
          className={`hidden md:flex flex-col fixed inset-y-0 left-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 overflow-x-hidden`}
          aria-label="Barra lateral"
        >
          <div className="p-2 h-full overflow-y-auto">
            {sidebarContent}
          </div>
        </motion.aside>
      )}
    </>
  );
}