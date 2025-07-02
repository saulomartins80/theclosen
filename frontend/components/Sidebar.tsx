import Link from "next/link";
import {
  PieChart,
  BarChart2,
  Target,
  DollarSign,
  BookOpen,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Menu,
  Gem, // Ícone para Planos/Assinaturas
  HelpCircle, // Ícone para Suporte
  Plane, // Ícone para Milhas
} from "lucide-react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
  initialCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
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
  initialCollapsed = false,
  onCollapseChange = () => {},
}: SidebarProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const isActive = (path: string) => router.pathname === path;

  useEffect(() => {
    if (!isMobile) {
      setCollapsed(initialCollapsed);
    }
  }, [initialCollapsed, isMobile]);

  useEffect(() => {
    onCollapseChange(collapsed);
  }, [collapsed, onCollapseChange]);

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

  useEffect(() => {
    if (!isMobile && typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", String(collapsed));
    }
  }, [collapsed, isMobile]);

  const menuItems: MenuItem[] = [
    {
      path: "/dashboard",
      icon: PieChart,
      label: "Visão geral",
    },
    {
      path: "/transacoes",
      icon: BarChart2,
      label: "Transações",
    },
    {
      path: "/metas",
      icon: Target,
      label: "Metas",
    },
    {
      path: "/investimentos",
      icon: DollarSign,
      label: "Investimentos",
    },
    {
      path: "/milhas",
      icon: Plane,
      label: "Milhas",
    },
    {
      path: "/assinaturas",
      icon: Gem,
      label: "Planos",
    },
    {
      path: "/ebook",
      icon: BookOpen,
      label: "E-book",
    },
    {
      path: "/suporte",
      icon: HelpCircle,
      label: "Suporte",
    },
    {
      path: "/configuracoes",
      icon: Sliders,
      label: "Configurações",
    },
  ];

  const sidebarContent = (
    <>
      <div
        className={`flex items-center mb-6 ${
          collapsed ? "px-2 justify-center" : "px-4 justify-between"
        }`}
      >
        {!collapsed ? (
          <Link
            href="/dashboard"
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 flex items-center justify-center relative">
              <Image
                src="/finnextho.png"
                alt="Logo FinNEXTHO"
                width={32}
                height={32}
                priority
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Fin<span className="text-blue-300">NEXTHO</span>
            </span>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="flex items-center justify-center"
          >
            <div className="w-8 h-8 flex items-center justify-center relative">
              <Image
                src="/finnextho.png"
                alt="Logo FinNEXTHO"
                width={32}
                height={32}
                priority
                className="object-contain"
              />
            </div>
          </Link>
        )}
        {isMobile ? (
          <button
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={onClose}
            aria-label="Fechar menu"
            aria-expanded={isOpen}
          >
            <Menu size={24} className="text-blue-500 dark:text-blue-400" />
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
            {collapsed ? (
              <ChevronRight size={20} className="text-blue-500 dark:text-blue-400" />
            ) : (
              <ChevronLeft size={20} className="text-blue-500 dark:text-blue-400" />
            )}
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
                } ${collapsed ? "justify-center" : ""}`}
                onClick={isMobile ? onClose : undefined}
                aria-current={isActive(path) ? "page" : undefined}
              >
                <div className={`relative ${collapsed ? "mr-0" : "mr-3"}`}>
                  <Icon
                    size={22}
                    className={`flex-shrink-0 ${
                      isActive(path)
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                    aria-hidden="true"
                    strokeWidth={2.5}
                  />
                  {isActive(path) && (
                    <motion.span
                      layoutId="activeIndicator"
                      className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </div>
                {!collapsed && (
                  <span className="text-sm font-medium">{label}</span>
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
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{
                  type: "tween",
                  duration: 0.2,
                  ease: "easeInOut",
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

      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 80 : 256 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.5,
          }}
          className="hidden md:flex flex-col fixed inset-y-0 left-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 overflow-x-hidden"
          aria-label="Barra lateral"
        >
          <div className="p-2 h-full overflow-y-auto">{sidebarContent}</div>
        </motion.aside>
      )}
    </>
  );
}