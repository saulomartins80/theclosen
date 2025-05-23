// components/AuthInitializer.tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { authChecked, isAuthReady } = useAuth()

  if (!authChecked || !isAuthReady) {
    return <LoadingSpinner fullScreen />
  }

  return <>{children}</>
}