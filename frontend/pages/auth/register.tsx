'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { FiArrowLeft, FiUser, FiMail, FiLock, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  const router = useRouter();
  const { login } = useAuth();
  const { resolvedTheme } = useTheme();

  // Validações em tempo real
  useEffect(() => {
    setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }, [email]);

  useEffect(() => {
    setPasswordMatch(password === confirmPassword || confirmPassword === '');
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!emailValid) {
      setError('Digite um e-mail válido');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
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

      // 3. Feedback visual
      setSuccess(true);
      
      // 4. Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Erro no cadastro:', err);
      
      let errorMessage = 'Erro ao cadastrar. Tente novamente.';
      
      if (err instanceof Error) {
        if (err.message.includes('email-already-in-use')) {
          errorMessage = 'Este e-mail já está cadastrado';
        } else if (err.message.includes('auth/weak-password')) {
          errorMessage = 'A senha é muito fraca';
        } else {
          errorMessage = err.message || errorMessage;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const PasswordStrength = ({ password }: { password: string }) => {
    const strength = {
      0: 'Muito fraca',
      1: 'Fraca',
      2: 'Moderada',
      3: 'Forte',
      4: 'Muito forte'
    };

    const getStrength = () => {
      let score = 0;
      if (!password) return { width: '0%', text: strength[0], color: 'bg-red-500' };

      if (password.length >= 8) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
      return {
        width: `${(score / 4) * 100}%`,
        text: strength[score as keyof typeof strength],
        color: colors[score]
      };
    };

    const { width, text, color } = getStrength();

    return (
      <div className="mt-1">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${color}`} 
            style={{ width }} 
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Força da senha: <span className="font-medium">{text}</span>
        </p>
      </div>
    );
  };

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 max-w-md"
        >
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <FiCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Cadastro concluído!
          </h2>
          <p className={`mb-6 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Você será redirecionado automaticamente.
          </p>
          <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2 }}
              className="h-full bg-blue-500"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col justify-center py-12 sm:px-6 lg:px-8`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <h2 className={`mt-6 text-center text-3xl font-extrabold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Criar nova conta
        </h2>
        <p className={`mt-2 text-center text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Já tem uma conta?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Faça login
          </Link>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`mt-8 sm:mx-auto sm:w-full sm:max-w-md ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} py-8 px-4 shadow sm:rounded-lg sm:px-10`}
      >
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-start p-4 mb-6 rounded-lg ${resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}
          >
            <FiAlertCircle className="flex-shrink-0 mt-0.5 mr-2" />
            <span>{error}</span>
          </motion.div>
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
                  !emailValid && email ? 'border-red-500' : 
                  resolvedTheme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300'
                } rounded-md focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>
            {!emailValid && email && (
              <p className="mt-1 text-xs text-red-500">Digite um e-mail válido</p>
            )}
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
            <PasswordStrength password={password} />
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
                  !passwordMatch && confirmPassword ? 'border-red-500' : 
                  resolvedTheme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300'
                } rounded-md focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>
            {!passwordMatch && confirmPassword && (
              <p className="mt-1 text-xs text-red-500">As senhas não coincidem</p>
            )}
          </div>

          {/* Botão de Cadastro */}
          <div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !emailValid || !passwordMatch}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading || !emailValid || !passwordMatch ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar'
              )}
            </motion.button>
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
      </motion.div>
    </div>
  );
}