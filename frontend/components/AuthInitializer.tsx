'use client'

import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { authChecked, isAuthReady, loading } = useAuth()

  console.log('[AuthInitializer] authChecked:', authChecked, 'isAuthReady:', isAuthReady, 'loading:', loading);

  // Mostrar loading enquanto a autenticação está sendo verificada
  if (!authChecked || !isAuthReady || loading) {
    console.log('[AuthInitializer] Showing loading spinner');
    return <LoadingSpinner fullScreen />
  }

  console.log('[AuthInitializer] Rendering children');
  return <>{children}</>
} 