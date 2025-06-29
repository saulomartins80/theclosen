import React from 'react';
import { useNotifications } from '../context/NotificationContext';

const NotificationTest: React.FC = () => {
  const { addNotification } = useNotifications();

  const testNotifications = () => {
    // Teste de notificação de sucesso
    addNotification({
      type: 'success',
      message: 'Operação realizada com sucesso!'
    });

    // Teste de notificação de erro
    setTimeout(() => {
      addNotification({
        type: 'error',
        message: 'Erro ao processar a operação'
      });
    }, 1000);

    // Teste de notificação de aviso
    setTimeout(() => {
      addNotification({
        type: 'warning',
        message: 'Atenção: Esta ação pode ter consequências'
      });
    }, 2000);

    // Teste de notificação de informação
    setTimeout(() => {
      addNotification({
        type: 'info',
        message: 'Nova funcionalidade disponível!'
      });
    }, 3000);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Teste de Notificações</h2>
      <button
        onClick={testNotifications}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Testar Notificações
      </button>
    </div>
  );
};

export default NotificationTest;