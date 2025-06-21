// components/ProtectedRoute.tsx
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  allowedPlans?: string[];
}

export function ProtectedRoute({ 
  children, 
  requireSubscription = false, 
  allowedPlans = [] 
}: ProtectedRouteProps) {
  const { user, loading, isAuthReady, subscription } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthReady) {
      console.log('[ProtectedRoute] Auth not ready yet, waiting...');
      return;
    }

    const isOnAuthPage = router.pathname.startsWith('/auth/');
    console.log('[ProtectedRoute] Current path:', router.pathname, 'isOnAuthPage:', isOnAuthPage, 'user:', !!user);

    // Se não há usuário e não está em página de auth, redirecionar para login
    if (!user && !isOnAuthPage) {
      console.log('[ProtectedRoute] User not authenticated. Redirecting to login.');
      router.replace(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    // Se há usuário e está em página de auth, redirecionar para dashboard
    if (user && isOnAuthPage) {
      console.log('[ProtectedRoute] User authenticated, redirecting from auth page to dashboard.');
      router.replace('/dashboard');
      return;
    }

    // Verificar se a rota requer assinatura ativa
    if (requireSubscription && user) {
      const hasActiveSubscription = subscription && 
        ['active', 'trialing'].includes(subscription.status) &&
        (!subscription.expiresAt || new Date(subscription.expiresAt) > new Date());

      if (!hasActiveSubscription) {
        console.log('[ProtectedRoute] Subscription required but not active. Redirecting to subscription page.');
        router.replace('/assinaturas');
        return;
      }

      // Verificar se o plano é permitido
      if (allowedPlans.length > 0 && subscription) {
        const isPlanAllowed = allowedPlans.includes(subscription.plan);
        if (!isPlanAllowed) {
          console.log('[ProtectedRoute] Plan not allowed. Redirecting to upgrade page.');
          router.replace('/assinaturas');
          return;
        }
      }
    }
  }, [isAuthReady, user, subscription, router, requireSubscription, allowedPlans]);

  if (!isAuthReady || loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return <LoadingSpinner fullScreen />;
  }

  // Se requer assinatura mas não há assinatura ativa, mostrar loading
  if (requireSubscription && (!subscription || !['active', 'trialing'].includes(subscription.status))) {
    return <LoadingSpinner fullScreen />;
  }

  return <>{children}</>;
}