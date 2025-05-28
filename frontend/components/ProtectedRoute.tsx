// components/ProtectedRoute.tsx
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Usar isAuthReady em vez de authChecked para um estado mais preciso
  const { user, loading, isAuthReady, subscription } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Espera até que o estado de autenticação esteja completamente pronto (Firebase + Backend Sync)
    if (!isAuthReady) {
      return; // Não faz nada até que isAuthReady seja true
    }

    const isOnAuthPage = router.pathname.startsWith('/auth/');

    // Se isAuthReady é true e não há usuário, redireciona para login (se não já estiver lá)
    if (!user) {
      if (!isOnAuthPage) {
        console.log('[ProtectedRoute] Auth state ready, user not authenticated. Redirecting to login.');
        router.replace(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
      }
      // Se está em isOnAuthPage e !user, fica na página de auth.
      return;
    }

    // Se isAuthReady é true e há um usuário, verifica a assinatura e redireciona se necessário
    // ... (restante da sua lógica de verificação de assinatura permanece a mesma) ...
     const isOnSubscriptionPage = router.pathname === '/assinatura';

    // Permite acesso se estiver na página de autenticação
    if (isOnAuthPage) {
       // Se o usuário está autenticado e tenta ir para /auth/*, redireciona para o dashboard
       console.log('[ProtectedRoute] User authenticated, redirecting from auth page to dashboard.');
       router.replace('/dashboard');
       return;
    }

    // Permite acesso se estiver na página de assinatura
    if (isOnSubscriptionPage) {
        console.log('[ProtectedRoute] User authenticated, allowing access to subscription page.');
        return;
    }


    // Verificar se tem assinatura paga ativa (ex: 'premium', 'enterprise')
    const hasPaidActiveSubscription = 
      subscription &&
      subscription.plan !== 'trial' && // Exclui o plano de trial
      subscription.plan !== 'free' &&  // Exclui o plano free (se houver um pós-trial)
      subscription.status === 'active';

    if (hasPaidActiveSubscription) {
      // Tem assinatura paga ativa, permite acesso.
      console.log('[ProtectedRoute] User has active paid subscription. Allowing access.');
      return;
    }

    // Não tem assinatura paga ativa, verificar período de teste.
    let isInActiveTrial = false;
    if (subscription && subscription.plan === 'trial' && subscription.status === 'trialing' && subscription.trialEndsAt) {
      const trialEndDate = new Date(subscription.trialEndsAt);
      if (trialEndDate > new Date()) {
        isInActiveTrial = true;
      }
    }

    if (isInActiveTrial) {
      // Está em período de teste válido, permite acesso.
      console.log('[ProtectedRoute] User in active trial period. Allowing access.');
      return;
    }

    // Não tem assinatura paga ativa E não está em período de teste válido (ou o trial expirou).
    // Redirecionar para a página de assinatura.
    console.log('[ProtectedRoute] Auth state ready, no active paid subscription or trial. Redirecting to /assinatura.');
    router.replace('/assinatura');


  }, [isAuthReady, user, subscription, router]); // Adiciona isAuthReady às dependências

  // Mostra o spinner enquanto o estado de autenticação não estiver completamente pronto
  if (!isAuthReady) { // Usa isAuthReady aqui também
    console.log('[ProtectedRoute] Authentication state not ready. Showing spinner.');
    return <LoadingSpinner fullScreen />;
  }

  // Após isAuthReady ser true, a lógica do useEffect já tratou os redirecionamentos.
  // Se chegou aqui, o usuário tem permissão para ver a página atual.
  console.log('[ProtectedRoute] Authentication state ready. Rendering children.');
  return <>{children}</>;
}