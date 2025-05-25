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
    // createTestSubscription, // Removido - será tratado pela página de configurações
    // subscription, 
    // loadingSubscription, 
    // subscriptionError 
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

  // A função handleCreateTestSub foi removida daqui.
  // A lógica de ativação do plano de teste agora está na página de Configurações.

  if (loading || !authChecked) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    // Se ainda não foi redirecionado, não renderiza nada para evitar flash
    return null;
  }

  return (
    <div className="overflow-x-hidden">
      {/* A seção de Gerenciamento de Assinatura (Teste) foi removida daqui */}
      <DashboardContent />
    </div>
  );
}