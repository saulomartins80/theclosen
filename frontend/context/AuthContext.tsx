// context/AuthContext.tsx
import { 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  User as FirebaseUser,
  getAuth,
  IdTokenResult,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase/client';
import { subscriptionAPI } from '../services/api/subscriptionAPI';
import api from '../services/api';

// Tipos
export type SubscriptionPlan = 'free' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'expired' | 'pending';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SessionData {
  user: {
    uid: string;
    email: string | null;
    name: string | null;
    photoUrl: string | null;
    subscription?: Subscription;
  };
  token?: string;
}

export interface AuthUser extends FirebaseUser {
  subscription: Subscription | null;
  photoUrl: string | null;
}

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  photoUrl: string | null;
  subscription?: Subscription | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  subscription: Subscription | null;
  loading: boolean;
  authChecked: boolean;
  loadingSubscription: boolean;
  error: string | null;
  subscriptionError: string | null;
  refreshSubscription: () => Promise<void>;
  checkSubscriptionQuick: (userId: string) => Promise<boolean>;
  createTestSubscription: (plan: string) => Promise<Subscription | void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearErrors: () => void;
  verifyToken: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função para normalizar a assinatura
const normalizeSubscription = (subscription: any): Subscription | null => {
  if (!subscription) return null;

  return {
    id: subscription.id,
    plan: subscription.plan,
    status: subscription.status,
    expiresAt: subscription.expiresAt,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
};

// Função para normalizar o usuário
const normalizeUser = (user: FirebaseUser | SessionUser | null): AuthUser | null => {
  if (!user) return null;

  if ('providerData' in user) {
    const firebaseUser = user as FirebaseUser;
    return {
      ...firebaseUser,
      subscription: null,
      photoUrl: firebaseUser.photoURL || null,
      providerId: firebaseUser.providerId || 'firebase',
    } as AuthUser;
  }

  const sessionUser = user as SessionUser;
  const idTokenResult: IdTokenResult = {
    token: '',
    expirationTime: '',
    authTime: '',
    issuedAtTime: '',
    signInProvider: null,
    signInSecondFactor: null,
    claims: {}
  };

  return {
    uid: sessionUser.uid,
    email: sessionUser.email || null,
    displayName: sessionUser.name || null,
    photoURL: sessionUser.photoUrl || null,
    photoUrl: sessionUser.photoUrl || null,
    phoneNumber: null,
    providerData: [],
    providerId: 'firebase',
    emailVerified: false,
    isAnonymous: false,
    metadata: {} as any,
    refreshToken: '',
    tenantId: null,
    subscription: sessionUser.subscription || null,
    getIdToken: async () => '',
    getIdTokenResult: async () => idTokenResult,
    delete: async () => {},
    reload: async () => {},
    toJSON: () => ({}),
  } as AuthUser;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [state, setState] = useState({
    user: null as AuthUser | null,
    subscription: null as Subscription | null,
    loading: true,
    authChecked: false,
    loadingSubscription: false,
    error: null as string | null,
    subscriptionError: null as string | null,
  });

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, error: null, subscriptionError: null }));
  }, []);

  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }, []);

  const verifyFirebaseToken = useCallback(async (firebaseToken: string) => {
    try {
      const response = await api.post('/api/auth/verify-token', { 
        token: firebaseToken,
        skipMongoCheck: true
      });
      return response.data.user;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }, []);

  // Modifique a função syncSessionWithBackend
  const syncSessionWithBackend = useCallback(async (firebaseUser: FirebaseUser | null) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      if (!firebaseUser) {
        setState(prev => ({
          ...prev,
          user: null,
          authChecked: true,
          loading: false
        }));
        return null;
      }
  
      // Gera o ID token correto
      const idToken = await firebaseUser.getIdToken();
      
      // Chamada para o endpoint de sessão
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/session`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: idToken }),
          credentials: 'include'
        }
      );
  
      if (!response.ok) {
        throw new Error(response.status === 401 ? 'Não autorizado' : 'Falha ao sincronizar sessão');
      }
  
      const sessionData = await response.json();
  
      // Normaliza os dados do usuário
      const authUser = normalizeUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL,
        subscription: sessionData.user?.subscription || null
      });
  
      setState(prev => ({
        ...prev,
        user: authUser,
        subscription: sessionData.user?.subscription || null,
        authChecked: true,
        loading: false
      }));
  
      return authUser;
  
    } catch (error) {
      console.error('Erro na sincronização:', error);
      
      setState(prev => ({
        ...prev,
        user: null,
        authChecked: true,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro na sincronização'
      }));
      
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      await firebaseSignOut(auth);
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setState({
        user: null,
        subscription: null,
        loading: false,
        authChecked: true,
        loadingSubscription: false,
        error: null,
        subscriptionError: null,
      });
      
      router.push('/auth/login');
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao sair', 
        loading: false 
      }));
      console.error('Logout error:', error);
    }
  }, [router]);

  const fetchSubscription = useCallback(async (userId: string) => {
    if (!userId) return;

    setState(prev => ({ ...prev, loadingSubscription: true, subscriptionError: null }));

    try {
      const subscription = await subscriptionAPI.get(userId);
      const normalizedSubscription = normalizeSubscription(subscription);

      setState(prev => ({
        ...prev,
        user: prev.user ? { 
          ...prev.user, 
          subscription: normalizedSubscription 
        } : null,
        subscription: normalizedSubscription,
        loadingSubscription: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        subscriptionError: error instanceof Error ? error.message : 'Failed to load subscription',
        loadingSubscription: false,
      }));
    }
  }, []);

  const checkSubscriptionQuick = useCallback(async (userId: string): Promise<boolean> => {
    try {
      return await subscriptionAPI.quickCheck(userId);
    } catch (error) {
      console.error('Quick check subscription error:', error);
      return false;
    }
  }, []);

  const createTestSubscription = useCallback(async (plan: string): Promise<Subscription | void> => {
    if (!state.user?.uid) return;
    
    setState(prev => ({ ...prev, loadingSubscription: true }));
    
    try {
      const subscription = await subscriptionAPI.createTest(state.user.uid, plan);    
      const normalizedSubscription = normalizeSubscription(subscription);
      
      setState(prev => ({ 
        ...prev, 
        subscription: normalizedSubscription,
        user: prev.user ? { ...prev.user, subscription: normalizedSubscription } : null,
        subscriptionError: null 
      }));
      
      return normalizedSubscription as Subscription;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        subscriptionError: error instanceof Error ? error.message : 'Failed to create subscription'
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loadingSubscription: false }));
    }
  }, [state.user?.uid]);

  const refreshSubscription = useCallback(async () => {
    if (state.user?.uid) {
      await fetchSubscription(state.user.uid);
    }
  }, [state.user?.uid, fetchSubscription]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncSessionWithBackend(userCredential.user);
      
      const { redirect } = router.query;
      router.push(typeof redirect === 'string' ? redirect : '/dashboard');
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Login failed',
        loading: false,
      }));
      throw error;
    }
  }, [router, syncSessionWithBackend]);

  const loginWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // 1. Sincronizar com backend
      await syncSessionWithBackend(result.user);
      
      // 2. Redirecionar após verificação
      const { redirect } = router.query;
      const redirectPath = typeof redirect === 'string' ? redirect : '/dashboard';
      
      // Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      router.push(redirectPath);
  
    } catch (error) {
      console.error('Google login error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? 
          (error.message.includes('auth/popup-closed-by-user') ? 
            'Login cancelado' : 
            'Falha no login com Google') : 
          'Erro desconhecido',
        loading: false,
      }));
    }
  }, [router, syncSessionWithBackend]);

  // Efeito principal para sincronizar estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncSessionWithBackend(firebaseUser);
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          authChecked: true,
          loading: false
        }));
      }
    });

    return () => unsubscribe();
  }, [syncSessionWithBackend]);

  // Efeito para verificar assinatura quando o usuário muda
  useEffect(() => {
    if (state.user?.uid && !state.loading) {
      fetchSubscription(state.user.uid);
    }
  }, [state.user?.uid, state.loading, fetchSubscription]);

  // Efeito para redirecionamento após autenticação
  useEffect(() => {
    if (state.authChecked && !state.loading) {
      const isAuthPage = router.pathname.startsWith('/auth');
      const isPublicPage = ['/', '/pricing'].includes(router.pathname);

      if (state.user && (isAuthPage || isPublicPage)) {
        const { redirect } = router.query;
        router.push(typeof redirect === 'string' ? redirect : '/dashboard');
      } else if (!state.user && !isAuthPage && !isPublicPage) {
        router.push(`/auth/login?redirect=${router.pathname}`);
      }
    }
  }, [state.user, state.authChecked, state.loading, router]);

  const value: AuthContextType = useMemo(() => ({
    ...state,
    refreshSubscription,
    checkSubscriptionQuick,
    createTestSubscription,
    login,
    loginWithGoogle,
    logout,
    clearErrors,
    verifyToken,
  }), [
    state,
    refreshSubscription,
    checkSubscriptionQuick,
    createTestSubscription,
    login,
    loginWithGoogle,
    logout,
    clearErrors,
    verifyToken,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};