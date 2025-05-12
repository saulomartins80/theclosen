// pages/auth/forgot-password.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase/client';
import Layout from '../../components/Layout';
import { FiMail, FiAlertCircle, FiCheckCircle, FiArrowLeft, FiLoader } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Head from 'next/head';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Validação básica de e-mail em tempo real
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Countdown para reenvio
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isEmailValid) {
      setError('Digite um e-mail válido.');
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(`Link de redefinição enviado para ${email}. Verifique sua caixa de entrada ou spam.`);
      setEmailSent(true);
      setCountdown(30); // 30 segundos para reenvio
    } catch (err: any) {
      console.error('Erro ao enviar e-mail:', err);
      setError(err.code === 'auth/user-not-found' 
        ? 'E-mail não cadastrado.' 
        : 'Erro ao enviar e-mail. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    await handleSubmit(new Event('submit') as any);
  };

  return (
    <Layout>
      <Head>
        <title>Redefinir Senha | Seu App</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
            <h1 className="text-2xl font-bold text-white">Redefinir Senha</h1>
            <p className="text-indigo-100 mt-2">
              {emailSent 
                ? "Verifique seu e-mail" 
                : "Digite seu e-mail para receber o link de redefinição"
              }
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4"
              >
                <FiAlertCircle className="mr-2 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4"
              >
                <FiCheckCircle className="mr-2 flex-shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}

            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-mail
                  </label>
                  <div className={`flex items-center border rounded-lg overflow-hidden 
                                  bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500
                                  dark:bg-gray-700 dark:focus-within:border-indigo-500
                                  ${isEmailValid ? 'border-gray-300 dark:border-gray-600' : 'border-red-500 dark:border-red-500'}`}>
                    <span className="pl-3 pr-2 text-gray-400 dark:text-gray-400">
                      <FiMail />
                    </span>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-2 px-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="seu@email.com"
                      autoFocus
                      required 
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!isEmailValid || isLoading}
                  className={`w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${!isEmailValid || isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <FiLoader className="animate-spin mr-2" />
                      Enviando...
                    </span>
                  ) : 'Enviar Link'}
                </motion.button>
              </form>
            ) : (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4"
                >
                  <FiCheckCircle className="text-green-600 dark:text-green-400 text-2xl" />
                </motion.div>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Se o e-mail não aparecer em alguns minutos, verifique sua pasta de spam.
                </p>

                <button
                  onClick={handleResendEmail}
                  disabled={countdown > 0}
                  className={`text-sm ${countdown > 0 ? 'text-gray-400' : 'text-indigo-600 dark:text-indigo-400 hover:underline'}`}
                >
                  {countdown > 0 
                    ? `Reenviar em ${countdown}s` 
                    : 'Reenviar e-mail'
                  }
                </button>
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/auth/login')}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center mx-auto"
              >
                <FiArrowLeft className="mr-1" />
                Voltar para o login
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}