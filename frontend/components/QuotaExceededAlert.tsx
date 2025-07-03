import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface QuotaExceededAlertProps {
  onRetry?: () => void;
}

const QuotaExceededAlert: React.FC<QuotaExceededAlertProps> = ({ onRetry }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
          <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
          Serviço Temporariamente Indisponível
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          O limite gratuito do Firebase Authentication foi atingido. 
          Tente novamente mais tarde ou entre em contato com o suporte.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotaExceededAlert; 