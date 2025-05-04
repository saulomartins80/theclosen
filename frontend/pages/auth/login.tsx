// pages/auth/login.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { useTheme } from '../../context/ThemeContext';
import { FiMail, FiLock, FiLoader, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { usePreloadCheck } from '../../src/hooks/usePreloadCheck';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading, login, loginWithGoogle } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const { redirect } = router.query;
  const isPreloading = usePreloadCheck();

  useEffect(() => {
    if (isPreloading) return;
    if (user && !loading) {
      router.push(typeof redirect === 'string' ? redirect : '/dashboard');
    }
  }, [user, loading, router, redirect, isPreloading]);

  if (isPreloading || !router.isReady) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('Credenciais inválidas. Tente novamente.');
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
      setError('Falha ao entrar com Google');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPreloading) return null;
  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`w-full max-w-md p-8 rounded-xl shadow-lg ${
        resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta</h1>
          <p className={resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Acesse sua conta para continuar
          </p>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className={`flex items-center gap-2 p-3 mb-6 rounded-lg ${
            resolvedTheme === 'dark' ? 'bg-red-900/50' : 'bg-red-100'
          }`}>
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo de Email */}
          <div>
            <label htmlFor="email" className={`block mb-2 text-sm font-medium ${
              resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email
            </label>
            <div className={`flex items-center border rounded-lg overflow-hidden ${
              resolvedTheme === 'dark' 
                ? 'bg-gray-700 border-gray-600 focus-within:border-blue-500' 
                : 'bg-white border-gray-300 focus-within:border-blue-500'
            }`}>
              <span className="px-3 text-gray-500">
                <FiMail />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full py-3 px-2 outline-none ${
                  resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
                }`}
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          {/* Campo de Senha */}
          <div>
            <label htmlFor="password" className={`block mb-2 text-sm font-medium ${
              resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Senha
            </label>
            <div className={`flex items-center border rounded-lg overflow-hidden ${
              resolvedTheme === 'dark' 
                ? 'bg-gray-700 border-gray-600 focus-within:border-blue-500' 
                : 'bg-white border-gray-300 focus-within:border-blue-500'
            }`}>
              <span className="px-3 text-gray-500">
                <FiLock />
              </span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full py-3 px-2 outline-none ${
                  resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
                }`}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
          </div>

          {/* Link para esqueci a senha */}
          <div className="flex justify-end">
            <Link 
              href="/auth/forgot-password" 
              className={`text-sm ${
                resolvedTheme === 'dark' 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-500'
              }`}
            >
              Esqueceu a senha?
            </Link>
          </div>

          {/* Botão de Login */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
              resolvedTheme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <FiLoader className="animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                Entrar
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        {/* Divisor */}
        <div className="flex items-center my-6">
          <div className={`flex-1 h-px ${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          <span className={`px-3 text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ou</span>
          <div className={`flex-1 h-px ${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
        </div>

        {/* Botão do Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 border ${
            resolvedTheme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <FcGoogle size={20} />
          Continuar com Google
        </button>

        {/* Link para cadastro */}
        <div className={`mt-6 text-center text-sm ${
          resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Não tem uma conta?{' '}
          <Link 
            href="/auth/register" 
            className={`font-medium ${
              resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
            }`}
          >
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}