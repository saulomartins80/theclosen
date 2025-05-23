// components/ProtectedRoute.tsx
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authChecked, subscription } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authChecked) {
      // Se a verificação de autenticação ainda não terminou, não faz nada.
      return;
    }

    const isOnAuthPage = router.pathname.startsWith('/auth/');

    if (!user) {
      // Usuário não autenticado.
      if (!isOnAuthPage) {
        // Se não estiver numa página de autenticação, redireciona para o login.
        console.log('[ProtectedRoute] User not authenticated. Redirecting to login.');
        router.replace(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
      }
      return; // Para a execução aqui se não estiver autenticado.
    }

    // Usuário está autenticado.
    const isOnSubscriptionPage = router.pathname === '/assinatura';

    // Permite acesso se estiver na página de autenticação (pouco provável de chegar aqui se user existir)
    // ou na página de assinatura, sem mais verificações de assinatura.
    if (isOnAuthPage || isOnSubscriptionPage) {
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
      console.log('[ProtectedRoute] User has active paid subscription.');
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
      console.log('[ProtectedRoute] User in active trial period.');
      return;
    }

    // Não tem assinatura paga ativa E não está em período de teste válido (ou o trial expirou).
    // Redirecionar para a página de assinatura.
    console.log('[ProtectedRoute] No active paid subscription or trial. Redirecting to /assinatura.');
    router.replace('/assinatura');

  }, [authChecked, user, subscription, router]);

  // Enquanto carrega ou a autenticação não foi checada, mostra o spinner.
  if (loading || !authChecked) {
    return <LoadingSpinner fullScreen />;
  }

  // Lógica de renderização de children
  if (!user) {
    // Se não há usuário (e authChecked é true), o redirecionamento para login está em progresso ou falhou.
    // Retornar um loader para cobrir o tempo de redirecionamento.
    return <LoadingSpinner fullScreen />;
  }

  // Se o usuário está autenticado, permitir o acesso se:
  // 1. Estiver na página de autenticação ou assinatura (já tratado no useEffect para não redirecionar).
  // 2. Tiver uma assinatura paga ativa.
  // 3. Estiver em um período de teste ativo.
  const hasPaidActiveSubscription = 
    subscription &&
    subscription.plan !== 'trial' &&
    subscription.plan !== 'free' &&
    subscription.status === 'active';
  
  let isInActiveTrial = false;
  if (subscription && subscription.plan === 'trial' && subscription.status === 'trialing' && subscription.trialEndsAt) {
    const trialEndDate = new Date(subscription.trialEndsAt);
    if (trialEndDate > new Date()) {
      isInActiveTrial = true;
    }
  }

  // Permite renderizar children se estiver numa página de auth (caso raro aqui), 
  // na página de assinatura, ou se tiver a permissão de acesso (paga ou trial)
  if (router.pathname.startsWith('/auth/') || router.pathname === '/assinatura' || hasPaidActiveSubscription || isInActiveTrial) {
    return <>{children}</>;
  }

  // Se nenhuma das condições acima for atendida, o useEffect já deve ter iniciado o redirecionamento.
  // Retornar um loader ou null aqui previne renderização indevida durante o redirecionamento.
  return <LoadingSpinner fullScreen />;
}
