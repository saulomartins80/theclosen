// context/AuthContext.tsx
import { 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  User as FirebaseUser,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  IdTokenResult,
} from 'firebase/auth'; 
import { loginWithGoogle as firebaseLoginWithGoogle } from '../lib/firebase/client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase/client';
import api from '../services/api';
import Cookies from 'js-cookie';

// Tipos
export type SubscriptionPlan = 'free' | 'premium' | 'enterprise' | 'trial';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'expired' | 'pending' | 'trialing';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: string;
  trialEndsAt?: string;
  createdAt?: string;
  updatedAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  photoUrl: string | null;
  subscription?: Subscription | null;
}

export interface AuthUser extends FirebaseUser {
  name: string | null;
  photoUrl: string | null;
  subscription: Subscription | null;
}

export type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  subscription: Subscription | null;
  authChecked: boolean;
  loadingSubscription: boolean;
  error: string | null;
  subscriptionError: string | null;
  refreshSubscription: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearErrors: () => void;
  updateUserContextProfile: (updatedProfileData: Partial<SessionUser>) => void;
  setUser: (user: AuthUser | null) => void;
  isAuthReady: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  subscription: null,
  authChecked: false,
  loadingSubscription: false,
  error: null,
  subscriptionError: null,
  refreshSubscription: async () => {},
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  clearErrors: () => {},
  updateUserContextProfile: () => {},
  setUser: () => {},
  isAuthReady: false,
});

const normalizeSubscription = (subscription: any): Subscription | null => {
  if (!subscription) return null;
  
  return {
    id: subscription.id || subscription.subscriptionId || subscription.stripeSubscriptionId,
    plan: subscription.plan as SubscriptionPlan,
    status: subscription.status as SubscriptionStatus,
    expiresAt: subscription.expiresAt,
    trialEndsAt: subscription.trialEndsAt,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
    stripeCustomerId: subscription.stripeCustomerId,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  };
};

const normalizeUser = (userFromBackend: SessionUser | null, firebaseUserInstance?: FirebaseUser | null): AuthUser | null => {
  if (!userFromBackend && !firebaseUserInstance) return null;

  // Caso apenas Firebase User exista
  if (!userFromBackend && firebaseUserInstance) {
    return {
      ...firebaseUserInstance,
      name: firebaseUserInstance.displayName,
      photoUrl: firebaseUserInstance.photoURL,
      subscription: null,
    } as AuthUser;
  }

  // Caso tenha userFromBackend
  const baseFirebaseUserProps = firebaseUserInstance || {
    uid: userFromBackend!.uid,
    email: userFromBackend!.email,
    displayName: userFromBackend!.name,
    photoURL: userFromBackend!.photoUrl,
    emailVerified: false,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as IdTokenResult),
    reload: async () => {},
    toJSON: () => ({}),
    providerId: 'firebase',
  } as unknown as FirebaseUser;

  return {
    ...baseFirebaseUserProps,
    uid: userFromBackend!.uid,
    email: userFromBackend!.email,
    name: userFromBackend!.name,
    photoUrl: userFromBackend!.photoUrl,
    subscription: normalizeSubscription(userFromBackend!.subscription),
  } as AuthUser;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  console.log('[AuthProvider] Inicializando AuthProvider');
  
  const [state, setState] = useState<{
    user: AuthUser | null;
    subscription: Subscription | null;
    loading: boolean;
    authChecked: boolean;
    loadingSubscription: boolean;
    error: string | null;
    subscriptionError: string | null;
    isAuthReady: boolean;
  }>({
    user: null,
    subscription: null,
    loading: true,
    authChecked: false,
    loadingSubscription: false,
    error: null,
    subscriptionError: null,
    isAuthReady: false
  });

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, error: null, subscriptionError: null }));
  }, []);

  const syncSessionWithBackend = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      setState(prev => ({
        ...prev,
        user: null,
        subscription: null,
        authChecked: true,
        loading: false,
        isAuthReady: true,
      }));
      Cookies.remove('token', { path: '/' });
      Cookies.remove('user', { path: '/' });
      return null;
    }

    try {
      const token = await firebaseUser.getIdToken(true);
      
      const response = await api.post('/api/auth/session', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });

      const sessionData = response.data;

      if (sessionData.user) {
        const authUser = normalizeUser(sessionData.user as SessionUser, firebaseUser);
        
        setState(prev => ({
          ...prev,
          user: authUser,
          subscription: authUser?.subscription || null,
          authChecked: true,
          loading: false,
          isAuthReady: true,
          error: null,
        }));

        return authUser;
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          subscription: null,
          authChecked: true,
          loading: false,
          isAuthReady: true,
          error: 'Dados do usuário não encontrados na resposta do backend.',
        }));
        Cookies.remove('token', { path: '/' });
        Cookies.remove('user', { path: '/' });
        return null;
      }
    } catch (error) {
      console.error('syncSessionWithBackend: Error syncing session with backend:', error);
      setState(prev => ({
        ...prev,
        user: null,
        subscription: null,
        authChecked: true,
        loading: false,
        isAuthReady: true,
        error: error instanceof Error ? error.message : 'Erro desconhecido na sincronização',
      }));
      Cookies.remove('token', { path: '/' });
      Cookies.remove('user', { path: '/' });
      return null;
    }
  }, []);

  const updateUserContextProfile = useCallback((updatedProfileData: Partial<SessionUser>) => {
    setState(prev => {
      if (!prev.user) return prev;
      
      const updatedUser = {
        ...prev.user,
        ...updatedProfileData,
        subscription: updatedProfileData.subscription !== undefined 
          ? normalizeSubscription(updatedProfileData.subscription) 
          : prev.user.subscription
      };
      
      return {
        ...prev,
        user: updatedUser,
        subscription: updatedUser.subscription
      };
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      await firebaseSignOut(auth);
      
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, { 
          method: 'POST',
          credentials: 'include' 
        });
      } catch (apiError) {
        console.error('API logout error:', apiError);
      }
      
      setState({
        user: null,
        subscription: null,
        loading: false,
        authChecked: true,
        loadingSubscription: false,
        error: null,
        subscriptionError: null,
        isAuthReady: true,
      });
      
      router.push('/auth/login');

    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao sair', 
        loading: false,
        isAuthReady: true,
        user: null,
        subscription: null,
      }));
    }
  }, [router]);

  const refreshSubscription = useCallback(async () => {
    if (!state.user?.uid) {
      console.warn("refreshSubscription called without authenticated user");
      setState(prev => ({ ...prev, subscription: null }));
      return;
    }
    
    setState(prev => ({ ...prev, loadingSubscription: true, subscriptionError: null }));
    
    try {
      const response = await api.get(`/api/user/profile`);
      const userData = response.data;
      
      if (userData.subscription) {
        const normalizedSubscription = normalizeSubscription(userData.subscription);
        
        setState(prev => ({
          ...prev,
          user: prev.user ? { 
            ...prev.user, 
            subscription: normalizedSubscription 
          } : null,
          subscription: normalizedSubscription,
          loadingSubscription: false,
          subscriptionError: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          subscription: null,
          loadingSubscription: false,
        }));
      }
    } catch (error) {
      console.error('refreshSubscription error:', error);
      setState(prev => ({
        ...prev,
        subscription: null,
        subscriptionError: error instanceof Error ? error.message : 'Failed to load subscription',
        loadingSubscription: false,
      }));
    }
  }, [state.user?.uid]);

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const authUser = await syncSessionWithBackend(user);
      if (authUser) {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao fazer login',
        loading: false
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [router, syncSessionWithBackend]);

  const loginWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const userCredential = await firebaseLoginWithGoogle();
      
      if (!userCredential?.user) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
      
      await syncSessionWithBackend(userCredential.user);

      const { redirect } = router.query;
      const redirectTo = typeof redirect === 'string' ? redirect : '/dashboard';
      router.push(redirectTo);
      
    } catch (error) {
      console.error('Google login error:', error);
      
      let errorMessage = 'Falha no login com Google';
      if (error instanceof Error) {
        if (error.message.includes('auth/popup-closed-by-user')) {
          errorMessage = 'Login cancelado';
        } else if (error.message.includes('auth/account-exists-with-different-credential')) {
          errorMessage = 'Este email já está cadastrado com outro método de login';
        } else {
          errorMessage = error.message;
        }
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        user: null,
        subscription: null,
        authChecked: true,
        isAuthReady: true,
      }));
    }
  }, [router, syncSessionWithBackend]);

  // Verificar autenticação do Firebase na inicialização
  useEffect(() => {
    console.log('[AuthContext] Verificando autenticação do Firebase...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthContext] Firebase auth state changed:', !!firebaseUser);
      
      if (firebaseUser) {
        console.log('[AuthContext] Usuário Firebase encontrado, sincronizando com backend...');
        await syncSessionWithBackend(firebaseUser);
      } else {
        console.log('[AuthContext] Nenhum usuário Firebase, finalizando verificação...');
        setState(prev => ({
          ...prev,
          user: null,
          subscription: null,
          authChecked: true,
          loading: false,
          isAuthReady: true,
        }));
      }
    });

    return () => unsubscribe();
  }, [syncSessionWithBackend]);

  const value: AuthContextType = useMemo(() => ({
    ...state,
    refreshSubscription,
    login,
    loginWithGoogle,
    logout,
    clearErrors,
    updateUserContextProfile,
    setUser: (user: AuthUser | null) => {
      setState(prev => ({ ...prev, user }));
    },
  }), [
    state,
    refreshSubscription,
    login,
    loginWithGoogle,
    logout,
    clearErrors,
    updateUserContextProfile,
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