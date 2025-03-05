import { Bell, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);

  const notifications = [
    { id: 1, type: "success", message: "Pagamento recebido com sucesso." },
    { id: 2, type: "warning", message: "Sua assinatura expira em 3 dias." },
  ];

  return (
    <div className="relative">
      <button
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={24} className="text-gray-900 dark:text-white" />
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">2</span>
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notificações</h3>
            <ul className="mt-2 space-y-2">
              {notifications.map((notification) => (
                <li key={notification.id} className="flex items-center space-x-3">
                  {notification.type === "success" ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <AlertTriangle size={16} className="text-yellow-500" />
                  )}
                  <span className="text-sm text-gray-900 dark:text-white">{notification.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}