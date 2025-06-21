import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface PremiumRouteProps {
  children: React.ReactNode;
  requiredPlan?: 'premium' | 'enterprise';
  fallback?: React.ReactNode;
}

export function PremiumRoute({ 
  children, 
  requiredPlan = 'premium',
  fallback 
}: PremiumRouteProps) {
  const { user, subscription, loadingSubscription } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    // Verificar se há assinatura ativa
    const hasActiveSubscription = subscription && 
      ['active', 'trialing'].includes(subscription.status) &&
      (!subscription.expiresAt || new Date(subscription.expiresAt) > new Date());

    if (!hasActiveSubscription) {
      setHasAccess(false);
      setIsChecking(false);
      return;
    }

    // Verificar se o plano é suficiente
    const planHierarchy = {
      'free': 0,
      'premium': 1,
      'enterprise': 2
    };

    const userPlanLevel = planHierarchy[subscription.plan as keyof typeof planHierarchy] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan];

    if (userPlanLevel < requiredPlanLevel) {
      setHasAccess(false);
      setIsChecking(false);
      return;
    }

    setHasAccess(true);
    setIsChecking(false);
  }, [user, subscription, loadingSubscription, requiredPlan, router]);

  if (isChecking || loadingSubscription) {
    return <LoadingSpinner fullScreen />;
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Recurso Premium
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Este recurso está disponível apenas para assinantes do plano {requiredPlan === 'enterprise' ? 'Enterprise' : 'Premium'}.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/assinaturas')}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ver Planos
            </button>
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 