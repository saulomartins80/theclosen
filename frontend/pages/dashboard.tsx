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

  // Efeito para redirecionamento seguro
  useEffect(() => {
    if (!authChecked || loading) return;
    
    const redirectTimer = setTimeout(() => {
      if (!user) {
        const currentPath = router.asPath;
        router.replace({
          pathname: '/auth/login',
          query: { 
            redirect: currentPath !== '/' ? currentPath : '/dashboard' 
          }
        });
      }
    }, 150);

    return () => clearTimeout(redirectTimer);
  }, [user, loading, authChecked, router]);

  // Estados de carregamento
  if (loading || !authChecked) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner fullScreen />
      </div>
    );
  }

  if (!user) {
    return <div className={styles.hiddenContainer} aria-hidden="true" />;
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