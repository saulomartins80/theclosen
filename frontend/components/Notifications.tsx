// components/Notifications.tsx
import { Bell, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../context/NotificationContext";

export interface NotificationItem { // Exportado para ser usado por quem passar as notificações
  id: string; // Use string para IDs mais robustos (ex: vindos do DB)
  type: "success" | "warning" | "error" | "info"; // Adicionado 'info'
  message: string;
  read?: boolean;
  createdAt?: string; // Para ordenação ou exibição
}

interface NotificationsProps {
  resolvedTheme: 'light' | 'dark';
}

export default function Notifications({
  resolvedTheme
}: NotificationsProps) {
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const [isOpen, setIsOpen] = useState(false);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fechar ao pressionar Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleRemoveNotification = (id: string) => {
    removeNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`p-2 rounded-full relative transition ${
          resolvedTheme === 'dark'
            ? 'hover:bg-gray-700'
            : 'hover:bg-gray-200'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificações"
      >
        <Bell size={20} className={resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 mt-2 w-72 rounded-lg shadow-lg z-50 ${
              resolvedTheme === 'dark'
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className={`font-bold ${
                  resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Notificações
                </h3>
                {notifications.length > 0 && unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className={`text-xs px-2 py-1 rounded ${
                      resolvedTheme === 'dark'
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1 rounded-full ${
                    resolvedTheme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-200 text-gray-500'
                  }`}
                  aria-label="Fechar notificações"
                >
                  <X size={16} />
                </button>
              </div>

              {notifications.length > 0 ? (
                <ul className="max-h-60 overflow-y-auto">
                  {notifications
                    .sort((a, b) => {
                      if (a.read === b.read) {
                        if (a.createdAt && b.createdAt) {
                          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        }
                        return 0;
                      }
                      return a.read ? 1 : -1;
                    })
                    .map((notification) => (
                      <motion.li
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`p-2 rounded-md flex items-start space-x-3 ${
                          !notification.read
                            ? resolvedTheme === 'dark'
                              ? 'bg-gray-700/50'
                              : 'bg-blue-50'
                            : ''
                        }`}
                      >
                        <div className="flex-shrink-0 pt-0.5">
                          {notification.type === "success" ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : notification.type === "warning" ? (
                            <AlertTriangle size={16} className="text-yellow-500" />
                          ) : notification.type === "error" ? (
                            <AlertTriangle size={16} className="text-red-500" />
                          ) : (
                            <Bell size={16} className={resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${
                            resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {notification.message}
                          </p>
                          {notification.createdAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex items-center space-x-1">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className={`p-1 rounded-full ${
                                resolvedTheme === 'dark'
                                  ? 'hover:bg-gray-700 text-gray-300'
                                  : 'hover:bg-gray-200 text-gray-500'
                              }`}
                              title="Marcar como lida"
                            >
                              <CheckCircle size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveNotification(notification.id)}
                            className={`p-1 rounded-full ${
                              resolvedTheme === 'dark'
                                ? 'hover:bg-gray-700 text-gray-300'
                                : 'hover:bg-gray-200 text-gray-500'
                            }`}
                            title="Remover notificação"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                </ul>
              ) : (
                <div className="text-center py-4">
                  <Bell size={24} className={`mx-auto mb-2 ${
                    resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-300'
                  }`} />
                  <p className={`text-sm ${
                    resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Nenhuma notificação
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
