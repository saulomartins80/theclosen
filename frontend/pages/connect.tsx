import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function ConnectCallback() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando conexão...');

  useEffect(() => {
    if (!isAuthReady) return;

    if (!user) {
      setStatus('error');
      setMessage('Usuário não autenticado');
      return;
    }

    const { token, error } = router.query;

    if (error) {
      setStatus('error');
      setMessage('Erro na conexão: ' + error);
      return;
    }

    if (token) {
      // Simular processamento da conexão
      setTimeout(() => {
        setStatus('success');
        setMessage('Conexão estabelecida com sucesso!');
        
        // Redirecionar para a página de milhas após 2 segundos
        setTimeout(() => {
          router.push('/milhas');
        }, 2000);
      }, 1500);
    } else {
      setStatus('error');
      setMessage('Token de conexão não encontrado');
    }
  }, [router.query, user, isAuthReady, router]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center"
        >
          {status === 'loading' && (
            <>
              <RefreshCw className="mx-auto h-16 w-16 text-blue-500 animate-spin mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Conectando...
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Sucesso!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Redirecionando para a página de milhas...
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Erro na Conexão
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => router.push('/milhas')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Milhas
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
} 