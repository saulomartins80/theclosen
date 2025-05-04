//pages/auth/register.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { FiArrowLeft, FiUser, FiMail, FiLock } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();
  const { resolvedTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('As senhas não coincidem');
    }

    try {
      setLoading(true);

      // 1. Registrar o usuário
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.message || 'Erro ao cadastrar');
      }

      // 2. Login automático
      await login(email, password);

      // 3. Redirecionar
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${
        resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      } flex flex-col justify-center py-12 sm:px-6 lg:px-8`}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2
          className={`mt-6 text-center text-3xl font-extrabold ${
            resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          Criar nova conta
        </h2>
        <p
          className={`mt-2 text-center text-sm ${
            resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          Já tem uma conta?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Faça login
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className={`${
            resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } py-8 px-4 shadow sm:rounded-lg sm:px-10`}
        >
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Nome */}
            <div>
              <label
                htmlFor="name"
                className={`block text-sm font-medium ${
                  resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Nome completo
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`py-2 pl-10 block w-full ${
                    resolvedTheme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'border-gray-300'
                  } rounded-md focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium ${
                  resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`py-2 pl-10 block w-full ${
                    resolvedTheme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'border-gray-300'
                  } rounded-md focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${
                  resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`py-2 pl-10 block w-full ${
                    resolvedTheme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'border-gray-300'
                  } rounded-md focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label
                htmlFor="confirm-password"
                className={`block text-sm font-medium ${
                  resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Confirmar senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`py-2 pl-10 block w-full ${
                    resolvedTheme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'border-gray-300'
                  } rounded-md focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>

            {/* Botão de Cadastro */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </form>

          {/* Link para voltar */}
          <div className="mt-6">
            <Link
              href="/auth/login"
              className={`w-full flex items-center justify-center px-4 py-2 border ${
                resolvedTheme === 'dark'
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } rounded-md shadow-sm text-sm font-medium`}
            >
              <FiArrowLeft className="mr-2" />
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}