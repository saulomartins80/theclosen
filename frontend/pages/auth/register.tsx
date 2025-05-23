import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase/client';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { FiArrowLeft, FiUser, FiMail, FiLock, FiCheck, FiAlertCircle, FiLoader, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const router = useRouter();
  const { syncSessionWithBackend } = useAuth();

  useEffect(() => {
    if (email === '') {
      setEmailValid(true);
    } else {
      setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    }
  }, [email]);

  useEffect(() => {
    if (confirmPassword === '') {
      setPasswordMatch(true);
    } else {
      setPasswordMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!currentEmailValid) {
        setError('Digite um e-mail válido');
        setEmailValid(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('As senhas não coincidem');
        setPasswordMatch(false);
        return;
      }

      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres');
        return;
      }

      // 1. Registrar usuário
      const registerResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include'
      });

      if (registerResponse.ok) {
        // 2. Fazer login imediatamente após registro
        const { user } = await signInWithEmailAndPassword(auth, email, password);

        // 3. Forçar atualização do estado de autenticação
        if (syncSessionWithBackend) {
          await syncSessionWithBackend(user);
        }

        setSuccess(true);
        router.push('/dashboard');
        return;
      } else {
        // Tenta extrair mensagem de erro do backend
        let errorMessage = 'Erro ao cadastrar. Tente novamente.';
        try {
          const data = await registerResponse.json();
          if (data && data.message) {
            errorMessage = data.message;
          }
        } catch {}
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Erro no cadastro (handleSubmit):', err);
      let errorMessage = 'Erro ao cadastrar. Tente novamente.';
      if (err instanceof Error) {
        if (err.message.includes('Email já está em uso') || err.message.includes('auth/email-already-in-use')) {
          errorMessage = 'Este e-mail já está cadastrado';
        } else if (err.message.includes('auth/weak-password')) {
          errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
        } else {
          errorMessage = err.message;
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
      
      const colors = [
        'bg-red-500', 
        'bg-orange-500', 
        'bg-yellow-500', 
        'bg-blue-500', 
        'bg-green-500'
      ];
      
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
            className={`h-1.5 rounded-full ${color} transition-all duration-300`} 
            style={{ width }} 
          />
        </div>
        {passwordFocus && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Força da senha: <span className="font-medium">{text}</span>
          </p>
        )}
      </div>
    );
  };

  const PasswordCriteria = ({ password }: { password: string }) => {
    const criteria = [
      { regex: /.{8,}/, text: 'Mínimo 8 caracteres' },
      { regex: /[A-Z]/, text: 'Pelo menos 1 letra maiúscula' },
      { regex: /[0-9]/, text: 'Pelo menos 1 número' },
      { regex: /[^A-Za-z0-9]/, text: 'Pelo menos 1 caractere especial' }
    ];
    
    return (
      <div className={`mt-2 space-y-1 transition-all duration-300 ${passwordFocus ? 'opacity-100' : 'opacity-0 h-0'}`}>
        {criteria.map((item, index) => (
          <div key={index} className="flex items-center">
            {item.regex.test(password) ? (
              <FiCheck className="text-green-500 mr-2" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-gray-400 mr-2" />
            )}
            <span className={`text-xs ${item.regex.test(password) ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center border border-gray-200 dark:border-gray-700"
        >
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <FiCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Cadastro concluído!</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">Sua conta foi criada com sucesso. Você será redirecionado em breve.</p>
          
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5 }} // Ajustado para um pouco mais de tempo se o timeout for usado
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            />
          </div>
          
          <div className="mt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Aguarde o redirecionamento ou 
              <Link
                href="/dashboard"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                 clique aqui
              </Link>.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center">
            <h1 className="text-3xl font-bold text-white">Crie sua conta</h1>
            <p className="text-blue-100 mt-2">
              Comece a gerenciar suas finanças como um profissional
            </p>
          </div>
          <div className="p-8">
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${!emailValid && email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="seu@email.com"
                  />
                  {emailValid && email && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <FiCheck className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                {!emailValid && email && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">Digite um e-mail válido</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="••••••••"
                  />
                </div>
                <PasswordStrength password={password} />
                <PasswordCriteria password={password} />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirmar senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${!passwordMatch && confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="••••••••"
                  />
                  {passwordMatch && confirmPassword && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <FiCheck className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                {!passwordMatch && confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">As senhas não coincidem</p>
                )}
              </div>
              <motion.button
                type="submit"
                disabled={loading || !emailValid || !passwordMatch || !name}
                whileHover={!(loading || !emailValid || !passwordMatch || !name) ? { scale: 1.02 } : {}}
                whileTap={!(loading || !emailValid || !passwordMatch || !name) ? { scale: 0.98 } : {}}
                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium shadow-lg transition-all ${
                  loading || !emailValid || !passwordMatch || !name
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    Criar minha conta
                    <FiArrowRight />
                  </>
                )}
              </motion.button>
            </form>
            <div className="my-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Já tem uma conta?
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/auth/login"
              className="w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 shadow-sm"
            >
              <FiArrowLeft />
              Voltar para login
            </Link>
          </div>
        </div>
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
