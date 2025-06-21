// pages/dashboard.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
// Update the import path below to the correct location of LoadingSpinner
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardContent from '../components/DashboardContent';
import styles from './Dashboard.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, authChecked } = useAuth();

  // Estados de carregamento
  if (loading || !authChecked) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner fullScreen />
      </div>
    );
  }

  // Se não há usuário, mostra uma mensagem em vez de redirecionar
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acesso Restrito
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você precisa estar logado para acessar o dashboard.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

// Componente de Layout separado com props opcionais
function DashboardLayout({ children, className = '' }: DashboardLayoutProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}