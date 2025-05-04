// components/ProtectedRoute.tsx
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authChecked } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && authChecked) {
      if (!user) {
        const redirect = router.pathname !== '/' ? `?redirect=${encodeURIComponent(router.pathname)}` : '';
        router.push(`/auth/login${redirect}`).catch(e => console.error("Redirection error:", e));
      } else if (router.pathname === '/auth/login') {
        router.push('/dashboard').catch(e => console.error("Redirection error:", e));
      }
    }
  }, [user, loading, authChecked, router]);

  if (loading || !authChecked) {
    return <LoadingSpinner />;
  }

  if (!user && router.pathname !== '/auth/login') {
    return null;
  }

  return <>{children}</>;
}