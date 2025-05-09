// pages/dashboard.tsx
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import DashboardContent from '../components/DashboardContent';

export default function Dashboard() {
  const { 
    user, 
    loading, 
    authChecked, 
    createTestSubscription, 
    subscription, 
    loadingSubscription, 
    subscriptionError 
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authChecked && !loading) {
      if (!user) {
        const timer = setTimeout(() => {
          router.push('/auth/login?redirect=/dashboard');
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [user, loading, authChecked, router]);

  const handleCreateTestSub = async () => {
    if (user) {
      try {
        const newSubscription = await createTestSubscription('premium'); // Ou o nome de um plano de teste que seu backend reconheça
        if (newSubscription) {
          alert('Assinatura de teste criada/atualizada: ' + newSubscription.plan + ' - Status: ' + newSubscription.status);
        } else {
          alert('Função createTestSubscription executada, mas não retornou dados da assinatura. Verifique o backend e o AuthContext.');
        }
      } catch (err) {
        console.error("Erro ao criar assinatura de teste:", err);
        alert('Falha ao criar assinatura de teste. Verifique o console do navegador e do backend.');
      }
    }
  };

  if (loading || !authChecked) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    // Se ainda não foi redirecionado, não renderiza nada para evitar flash
    return null;
  }

  return (
    <div className="p-4">
      <div className="mb-4 p-4 border border-gray-300 rounded">
        <h2 className="text-xl font-semibold mb-2">Gerenciamento de Assinatura (Teste)</h2>
        {user && (
          <p className="mb-1">Usuário: {user.email}</p>
        )}
        {subscription && (
          <p className="mb-1">Plano Atual: <span className="font-semibold">{subscription.plan}</span> | Status: <span className="font-semibold">{subscription.status}</span></p>
        )}
        {!subscription && (
          <p className="mb-2">Você não possui uma assinatura ativa.</p>
        )}
        {subscriptionError && (
          <p className="text-red-500 mb-2">Erro na assinatura: {subscriptionError}</p>
        )}
        <button 
          onClick={handleCreateTestSub} 
          disabled={loadingSubscription || !user}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loadingSubscription ? 'Processando Assinatura...' : 'Ativar/Atualizar Assinatura de Teste (Premium)'}
        </button>
      </div>
      <DashboardContent />
    </div>
  );
}