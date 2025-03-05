import Link from "next/link";
import { Home, TrendingUp, Target, Book, PlusSquare, X } from "lucide-react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();

  // Verifica se a rota atual corresponde ao link
  const isActive = (path: string) => router.pathname === path;

  // Fecha o sidebar ao pressionar a tecla "Esc"
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Sidebar para desktop (sempre visível) */}
      <div className="hidden md:flex md:relative w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-full flex-col p-5 shadow-lg z-40">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold mb-6">Finanext</h2>
        </div>
        <ul className="space-y-4">
          {/* Link: Visão Geral */}
          <li
            className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded ${
              isActive("/") ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : ""
            }`}
          >
            <Link href="/" className="flex items-center space-x-3 w-full">
              <Home
                size={20}
                className={
                  isActive("/") ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"
                }
              />
              <span>Visão geral</span>
            </Link>
          </li>

          {/* Link: Transações */}
          <li
            className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded ${
              isActive("/transacoes")
                ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                : ""
            }`}
          >
            <Link href="/transacoes" className="flex items-center space-x-3 w-full">
              <TrendingUp
                size={20}
                className={
                  isActive("/transacoes")
                    ? "text-blue-900 dark:text-blue-100"
                    : "text-gray-900 dark:text-white"
                }
              />
              <span>Transações</span>
            </Link>
          </li>

          {/* Link: Metas */}
          <li
            className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded ${
              isActive("/metas") ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : ""
            }`}
          >
            <Link href="/metas" className="flex items-center space-x-3 w-full">
              <Target
                size={20}
                className={
                  isActive("/metas") ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"
                }
              />
              <span>Metas</span>
            </Link>
          </li>

          {/* Link: Investimentos (substitui Lançamentos) */}
          <li
            className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded ${
              isActive("/investimentos")
                ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                : ""
            }`}
          >
            <Link href="/investimentos" className="flex items-center space-x-3 w-full">
              <PlusSquare
                size={20}
                className={
                  isActive("/investimentos")
                    ? "text-blue-900 dark:text-blue-100"
                    : "text-gray-900 dark:text-white"
                }
              />
              <span>Investimentos</span>
            </Link>
          </li>

          {/* Link: E-book */}
          <li
            className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded ${
              isActive("/ebook") ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : ""
            }`}
          >
            <Link href="/ebook" className="flex items-center space-x-3 w-full">
              <Book
                size={20}
                className={
                  isActive("/ebook") ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"
                }
              />
              <span>E-book</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Sidebar para mobile (controlável) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para fechar o sidebar no mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Sidebar mobile */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="fixed md:hidden w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-full flex-col p-5 shadow-lg z-40"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sidebar-title"
            >
              <div className="flex justify-between items-center">
                <h2 id="sidebar-title" className="text-2xl font-bold mb-6">
                  Finanext
                </h2>
                {/* Botão para fechar o sidebar no mobile */}
                <button
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  onClick={onClose}
                  aria-label="Fechar menu"
                >
                  <X size={24} className="text-gray-900 dark:text-white" />
                </button>
              </div>
              <ul className="space-y-4">
                {/* Links do sidebar mobile */}
                {[
                  { path: "/", icon: Home, label: "Visão geral" },
                  { path: "/transacoes", icon: TrendingUp, label: "Transações" },
                  { path: "/metas", icon: Target, label: "Metas" },
                  { path: "/investimentos", icon: PlusSquare, label: "Investimentos" }, // Substituído Lançamentos por Investimentos
                  { path: "/ebook", icon: Book, label: "E-book" },
                ].map(({ path, icon: Icon, label }) => (
                  <li
                    key={path}
                    className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded ${
                      isActive(path) ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : ""
                    }`}
                  >
                    <Link href={path} className="flex items-center space-x-3 w-full" onClick={onClose}>
                      <Icon
                        size={20}
                        className={
                          isActive(path) ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"
                        }
                      />
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}