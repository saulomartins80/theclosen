'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { FiArrowLeft, FiUser, FiMail, FiLock, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailValid, setEmailValid] = useState(true); // Default to true to avoid red border initially
  const [passwordMatch, setPasswordMatch] = useState(true);

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (email === '') {
      setEmailValid(true); // No validation needed for empty email
    } else {
      setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    }
  }, [email]);

  useEffect(() => {
    if (confirmPassword === '') {
        setPasswordMatch(true); // No validation needed for empty confirm password
    } else {
        setPasswordMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Re-validate on submit, in case of direct submission or for empty fields
    const currentEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!currentEmailValid) {
      setError('Digite um e-mail válido');
      setEmailValid(false); // Ensure visual feedback if error persists
      return;
    }
    setEmailValid(true); // Clear validation error if it passes now

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setPasswordMatch(false); // Ensure visual feedback
      return;
    }
    setPasswordMatch(true); // Clear validation error

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.message || 'Erro ao cadastrar');
      }
      await login(email, password);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
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
    const strength = { 0: 'Muito fraca', 1: 'Fraca', 2: 'Moderada', 3: 'Forte', 4: 'Muito forte' };
    const getStrength = () => {
      let score = 0;
      if (!password) return { width: '0%', text: strength[0], color: 'bg-red-500' };
      if (password.length >= 8) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
      const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
      return { width: `${(score / 4) * 100}%`, text: strength[score as keyof typeof strength], color: colors[score] };
    };
    const { width, text, color } = getStrength();
    return (
      <div className="mt-1">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full ${color}`} style={{ width }} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Força da senha: <span className="font-medium">{text}</span></p>
      </div>
    );
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-8 max-w-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <FiCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Cadastro concluído!</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">Você será redirecionado automaticamente.</p>
          <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2 }} className="h-full bg-blue-500" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Criar nova conta</h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          Já tem uma conta?{' '}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Faça login
          </Link>
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 sm:mx-auto sm:w-full sm:max-w-md bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start p-4 mb-6 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <FiAlertCircle className="flex-shrink-0 mt-0.5 mr-2 text-red-700 dark:text-red-300" />
            <span>{error}</span>
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome completo
            </label>
            <div className="flex items-center border rounded-lg overflow-hidden bg-white border-gray-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus-within:border-blue-500">
              <span className="pl-3 pr-2 text-gray-400 dark:text-gray-400"><FiUser /></span>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-2 px-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Seu nome completo"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className={`flex items-center border rounded-lg overflow-hidden bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:bg-gray-700 dark:focus-within:border-blue-500 ${!emailValid && email ? 'border-red-500 dark:border-red-500' : 'border-gray-400 dark:border-gray-600'}`}>
              <span className="pl-3 pr-2 text-gray-400 dark:text-gray-400"><FiMail /></span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-2 px-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="seu@email.com"
              />
            </div>
            {!emailValid && email && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">Digite um e-mail válido</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Senha
            </label>
            <div className="flex items-center border rounded-lg overflow-hidden bg-white border-gray-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus-within:border-blue-500">
              <span className="pl-3 pr-2 text-gray-400 dark:text-gray-400"><FiLock /></span>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-2 px-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirmar Senha */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar senha
            </label>
            <div className={`flex items-center border rounded-lg overflow-hidden bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:bg-gray-700 dark:focus-within:border-blue-500 ${!passwordMatch && confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-400 dark:border-gray-600'}`}>
              <span className="pl-3 pr-2 text-gray-400 dark:text-gray-400"><FiLock /></span>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full py-2 px-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>
            {!passwordMatch && confirmPassword && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">As senhas não coincidem</p>
            )}
          </div>

          {/* Botão de Cadastro */}
          <div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !emailValid || !passwordMatch || !name}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading || !emailValid || !passwordMatch || !name ? 'bg-blue-400 cursor-not-allowed dark:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md shadow-sm text-sm font-medium"
          >
            <FiArrowLeft className="mr-2" />
            Voltar para login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
