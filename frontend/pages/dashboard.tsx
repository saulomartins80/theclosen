// pages/dashboard.tsx
// pages/dashboard.tsx
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import DashboardContent from '../components/DashboardContent';

export default function Dashboard() {
  const { user, loading, authChecked } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Só verifica após o authChecked e se não estiver carregando
    if (authChecked && !loading) {
      if (!user) {
        // Adiciona timeout para evitar conflito com outras renderizações
        const timer = setTimeout(() => {
          router.push('/auth/login?redirect=/dashboard');
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [user, loading, authChecked, router]);

  // Mostra spinner apenas durante o carregamento inicial
  if (loading || !authChecked) {
    return <LoadingSpinner fullScreen />;
  }

  // Renderiza conteúdo apenas se autenticado
  return user ? <DashboardContent /> : null;
}