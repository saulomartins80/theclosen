import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { FiMail, FiLock, FiLoader, FiAlertCircle, FiArrowRight, FiCheck } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';
import { usePreloadCheck } from '../../src/hooks/usePreloadCheck';
import DebugConfig from '../../components/DebugConfig';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);

  const { user, loading, login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const { redirect, registration } = router.query;
  const isPreloading = usePreloadCheck();

  // Efeitos para validação em tempo real
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(email));
  }, [email]);

  // Efeito para verificar o parâmetro de sucesso de registro
  useEffect(() => {
    if (router.isReady) {
      const registrationParam = router.query.registration;
      if (registrationParam === 'success') {
        setShowRegistrationSuccess(true);
        // Remover o parâmetro da URL para não mostrar novamente ao recarregar
        router.replace('/auth/login', undefined, { shallow: true });
      }
    }
  }, [router.isReady, router.query, router]);

  // Redirecionamento se já estiver logado
  useEffect(() => {
    if (user && !loading && router.isReady) {
      const redirectPath = router.query.redirect as string || '/dashboard';
      // Evitar redirecionamento se já estiver na página de destino
      if (router.pathname !== redirectPath) {
        router.replace(redirectPath);
      }
    }
  }, [user, loading, router.isReady, router.query.redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowRegistrationSuccess(false);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('Credenciais inválidas. Por favor, verifique seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
    } catch (err: unknown) {
      console.error('Google login error:', err);
      setError('Falha ao entrar com Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPreloading || loading || (user && !showRegistrationSuccess)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-t-2 border-b-2 border-blue-500"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card de Login */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Cabeçalho com gradiente */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center">
            <h1 className="text-3xl font-bold text-white">Acesse sua conta</h1>
            <p className="text-blue-100 mt-2">
              Gerencie seus investimentos e finanças pessoais
            </p>
          </div>

          {/* Conteúdo do formulário */}
          <div className="p-8">
            {/* Mensagem de sucesso de registro */}
            {showRegistrationSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
              >
                <FiCheck className="flex-shrink-0 mt-0.5" />
                <span>Cadastro realizado com sucesso! Faça login para continuar.</span>
              </motion.div>
            )}

            {/* Mensagem de erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
              >
                <FiAlertCircle className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo de Email */}
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Endereço de Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${isValidEmail && email ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                    placeholder="seu@email.com"
                    required
                  />
                  {isValidEmail && email && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <FiCheck className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Campo de Senha */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Senha
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {/* Botão de Login */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                className="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg transition-all"
              >
                {isLoading ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    Acessar minha conta
                    <FiArrowRight />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divisor */}
            <div className="my-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Ou continue com
                  </span>
                </div>
              </div>
            </div>

            {/* Botão do Google */}
            <motion.button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              className="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 shadow-sm"
            >
              <FcGoogle size={20} />
              Continuar com Google
            </motion.button>
          </div>

          {/* Rodapé do card */}
          <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700/50 text-center border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Não tem uma conta?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Cadastre-se agora
              </Link>
            </p>
          </div>
        </div>

        {/* Links adicionais */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/"
            className="hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← Voltar para a página inicial
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
