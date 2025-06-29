import { useState } from 'react';
import { toast } from 'react-toastify';
import { useTheme } from "../context/ThemeContext";

const TestToast = () => {
  const { resolvedTheme } = useTheme();

  const testToasts = () => {
    console.log('Testando toasts...');
    toast.success('Toast de sucesso!');
    toast.info('Toast de informação!');
    toast.warning('Toast de aviso!');
    toast.error('Toast de erro!');
  };

  return (
    <div className={`min-h-screen p-8 ${resolvedTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Teste de Toasts</h1>
        
        <div className="space-y-4">
          <button
            onClick={testToasts}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Testar Todos os Toasts
          </button>
          
          <button
            onClick={() => toast.success('Sucesso!')}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Toast de Sucesso
          </button>
          
          <button
            onClick={() => toast.error('Erro!')}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Toast de Erro
          </button>
          
          <button
            onClick={() => toast.info('Informação!')}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Toast de Informação
          </button>
          
          <button
            onClick={() => toast.warning('Aviso!')}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Toast de Aviso
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="font-semibold mb-2">Instruções:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Clique nos botões acima para testar os toasts</li>
            <li>Verifique se aparecem no canto superior direito</li>
            <li>Abra o console do navegador para ver os logs</li>
            <li>Teste em modo claro e escuro</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestToast; 