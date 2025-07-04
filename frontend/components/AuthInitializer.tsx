'use client'

import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { authChecked, isAuthReady, loading, user } = useAuth()
  const router = useRouter()

  console.log('[AuthInitializer] authChecked:', authChecked, 'isAuthReady:', isAuthReady, 'loading:', loading, 'user:', !!user);

  // Verificar se é uma rota que precisa de autenticação
  const isProtectedRoute = ['/dashboard', '/investimentos', '/metas', '/transacoes', '/configuracoes', '/profile', '/assinaturas', '/milhas']
    .some(route => router.pathname.startsWith(route))

  // Se é uma rota protegida e não há usuário autenticado, redirecionar para login
  useEffect(() => {
    if (authChecked && isAuthReady && !loading && !user && isProtectedRoute) {
      console.log('[AuthInitializer] Usuário não autenticado em rota protegida, redirecionando para login');
      router.push('/auth/login');
    }
  }, [authChecked, isAuthReady, loading, user, isProtectedRoute, router]);

  // Mostrar loading apenas enquanto a autenticação está sendo verificada
  if (!authChecked || !isAuthReady || loading) {
    console.log('[AuthInitializer] Showing loading spinner');
    return <LoadingSpinner fullScreen />
  }

  // Se é uma rota protegida e não há usuário, mostrar loading até redirecionar
  if (isProtectedRoute && !user) {
    console.log('[AuthInitializer] Usuário não autenticado em rota protegida, mostrando loading');
    return <LoadingSpinner fullScreen />
  }

  console.log('[AuthInitializer] Rendering children');
  return <>{children}</>
} 