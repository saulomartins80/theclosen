import { Bell, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationItem {
  id: number;
  type: "success" | "warning" | "error";
  message: string;
  read?: boolean;
}

interface NotificationsProps {
  resolvedTheme: 'light' | 'dark';
}

export default function Notifications({ resolvedTheme }: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, type: "success", message: "Pagamento recebido com sucesso.", read: false },
    { id: 2, type: "warning", message: "Sua assinatura expira em 3 dias.", read: false },
  ]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

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

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`p-2 rounded-full relative transition ${
          resolvedTheme === 'dark' 
            ? 'hover:bg-gray-700' 
            : 'hover:bg-gray-200'
        }`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllAsRead();
        }}
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
                  {notifications.map((notification) => (
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
                        ) : (
                          <AlertTriangle size={16} className="text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${
                          resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className={`text-xs px-2 py-1 rounded ${
                            resolvedTheme === 'dark'
                              ? 'text-blue-400 hover:text-blue-300'
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          Marcar como lida
                        </button>
                      )}
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className={`py-4 text-center ${
                  resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Nenhuma notificação
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}