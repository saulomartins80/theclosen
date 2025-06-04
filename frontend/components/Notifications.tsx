// components/Notifications.tsx
import { Bell, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface NotificationItem { // Exportado para ser usado por quem passar as notificações
  id: string; // Use string para IDs mais robustos (ex: vindos do DB)
  type: "success" | "warning" | "error" | "info"; // Adicionado 'info'
  message: string;
  read?: boolean;
  createdAt?: string; // Para ordenação ou exibição
}

interface NotificationsProps {
  resolvedTheme: 'light' | 'dark';
  // Prop para receber notificações de uma fonte externa
  // Se usar um Context API, pode não precisar desta prop aqui diretamente
  initialNotifications?: NotificationItem[];
  // Callbacks para ações (opcional, se o gerenciamento for externo)
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export default function Notifications({
  resolvedTheme,
  initialNotifications = [], // Receber notificações iniciais via prop
  onMarkAsRead,
  onMarkAllAsRead
}: NotificationsProps) {
  // Use initialNotifications como estado inicial
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Atualiza o estado local se initialNotifications mudar (se a fonte externa fornecer novas)
  useEffect(() => {
      setNotifications(initialNotifications);
  }, [initialNotifications]);


  const [isOpen, setIsOpen] = useState(false); // Mova a declaração do estado para cá

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

  // Handler local ou chamar callback prop
  const handleMarkAsRead = (id: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(id); // Chama o callback externo se existir
    } else {
      // Lógica local se não houver callback
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    }
  };

  // Handler local ou chamar callback prop
  const handleMarkAllAsRead = () => {
     if (onMarkAllAsRead) {
        onMarkAllAsRead(); // Chama o callback externo se existir
     } else {
       // Lógica local se não houver callback
       setNotifications(notifications.map(n => ({ ...n, read: true })));
     }
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
          // Decida se marca como lido ao abrir. Melhor marcar individualmente ou com botão "Marcar todas".
          // if (!isOpen) handleMarkAllAsRead(); // Remover marcação automática ao abrir
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
                {notifications.length > 0 && unreadCount > 0 && ( // Mostrar botão "Marcar todas" apenas se houver não lidas
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
                <button // Botão de fechar movido para a direita
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
                  {/* Ordenar notificações, talvez pelas mais recentes primeiro */}
                   {notifications
                     .sort((a, b) => {
                        // Ordenar não lidas antes, depois por data (se existir) ou ID
                         if (a.read === b.read) {
                            if (a.createdAt && b.createdAt) {
                               return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            }
                            // Fallback to ID or arbitrary order if no date
                            return 0;
                         }
                         return a.read ? 1 : -1; // Não lidas primeiro
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
                        ) : notification.type === "error" ? ( // Verificado para "error"
                          <AlertTriangle size={16} className="text-red-500" />
                        ) : ( // Default icon for 'info' or other types
                          <Bell size={16} className={resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${
                          resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {notification.message}
                          {notification.createdAt && (
                              <span className={`block mt-0.5 text-xs ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {new Date(notification.createdAt).toLocaleString()} {/* Formato de data/hora */}
                              </span>
                           )}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
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
