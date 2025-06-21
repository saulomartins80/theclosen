// src/hooks/useAuthSubscriptionCheck.ts
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface UseSubscriptionCheckOptions {
  requireActive?: boolean;
  allowedPlans?: string[];
  redirectTo?: string;
}

export function useSubscriptionCheck(options: UseSubscriptionCheckOptions = {}) {
  const { user, subscription, loadingSubscription } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const {
    requireActive = false,
    allowedPlans = [],
    redirectTo = '/assinaturas'
  } = options;

  useEffect(() => {
    if (!user) {
      setHasAccess(false);
      setIsChecking(false);
      return;
    }

    // Se não requer assinatura ativa, permitir acesso
    if (!requireActive) {
      setHasAccess(true);
      setIsChecking(false);
      return;
    }

    // Verificar se há assinatura ativa
    const hasActiveSubscription = subscription && 
      ['active', 'trialing'].includes(subscription.status) &&
      (!subscription.expiresAt || new Date(subscription.expiresAt) > new Date());

    if (!hasActiveSubscription) {
      setHasAccess(false);
      setIsChecking(false);
      router.push(redirectTo);
      return;
    }

    // Verificar se o plano é permitido
    if (allowedPlans.length > 0 && subscription) {
      const isPlanAllowed = allowedPlans.includes(subscription.plan);
      if (!isPlanAllowed) {
        setHasAccess(false);
        setIsChecking(false);
        router.push(redirectTo);
        return;
      }
    }

    setHasAccess(true);
    setIsChecking(false);
  }, [user, subscription, loadingSubscription, requireActive, allowedPlans, redirectTo, router]);

  return {
    hasAccess,
    isChecking: isChecking || loadingSubscription,
    subscription,
    user
  };
}