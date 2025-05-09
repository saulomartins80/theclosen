// pages/auth/change-password.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../lib/firebase/client'; // Firebase auth instance
import Layout from '../../components/Layout';
import { FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function ChangePasswordPage() {
  const { user, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState(''); // Opcional, mas bom para reautenticação
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Proteção de rota: Redirecionar se não estiver logado
  useEffect(() => {
    if (!authLoading && authChecked && !user) {
      router.push('/auth/login?redirect=/auth/change-password');
    }
  }, [user, authLoading, authChecked, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('As novas senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    if (auth.currentUser) {
      try {
        // Idealmente, reautenticar o usuário antes de mudar a senha se for uma operação sensível
        // Por simplicidade, vamos chamar updatePassword diretamente
        // Para reautenticação: 
        // const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        // await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
        setSuccess('Senha alterada com sucesso!');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword(''); // Limpar se estiver usando
      } catch (err: any) {
        console.error('Erro ao alterar senha:', err);
        if (err.code === 'auth/requires-recent-login') {
          setError('Esta operação é sensível e requer login recente. Por favor, faça login novamente e tente de novo.');
          // Opcionalmente, redirecionar para login aqui ou pedir a senha atual para reautenticar.
        } else if (err.code === 'auth/weak-password') {
          setError('A nova senha é muito fraca.');
        } else {
          setError('Ocorreu um erro ao alterar a senha. Tente novamente.');
        }
      }
    } else {
      setError('Usuário não encontrado. Por favor, faça login.');
    }
    setIsLoading(false);
  };

  if (authLoading || !authChecked) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  if (!user) {
      // Se o useEffect acima ainda não redirecionou, não renderiza o formulário.
      // Isso evita um flash de conteúdo não autenticado.
      return null; 
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
            Alterar Senha
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
              <FiAlertCircle className="mr-2" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center">
              <FiCheckCircle className="mr-2" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nova Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Confirmar Nova Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
