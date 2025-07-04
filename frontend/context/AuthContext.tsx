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
import { loginWithGoogle as firebaseLoginWithGoogle, getFirebaseInstances } from '../lib/firebase/client';
import { handleRedirectResult } from '../lib/firebase/auth';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase/client';
import api from '../services/api';
import Cookies from 'js-cookie';
import { checkAndCreateUserProfile, isUserRegistrationComplete } from '../lib/firebase/autoRegistration';


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
    quotaExceeded: boolean;
  }>({
    user: null,
    subscription: null,
    loading: true,
    authChecked: false,
    loadingSubscription: false,
    error: null,
    subscriptionError: null,
    isAuthReady: false,
    quotaExceeded: false
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
        quotaExceeded: false,
      }));
      Cookies.remove('token', { path: '/' });
      Cookies.remove('user', { path: '/' });
      return null;
    }

    // Verificar se já temos dados do usuário para evitar sincronização desnecessária
    if (state.user && state.user.uid === firebaseUser.uid) {
      console.log('[AuthContext] Usuário já sincronizado, pulando sincronização...');
      setState(prev => ({
        ...prev,
        authChecked: true,
        loading: false,
        isAuthReady: true,
      }));
      return state.user;
    }

    try {
      console.log('[AuthContext] Iniciando sincronização com backend...');
      const token = await firebaseUser.getIdToken(true);
      
      const response = await api.post('/api/auth/session', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true,
        timeout: 10000 // Timeout de 10 segundos
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
          quotaExceeded: false,
        }));

        return authUser;
      } else {
        // Usuário não encontrado no backend, criar usuário básico
        const authUser = normalizeUser(null, firebaseUser);
        setState(prev => ({
          ...prev,
          user: authUser,
          subscription: null,
          authChecked: true,
          loading: false,
          isAuthReady: true,
          quotaExceeded: false,
        }));

        return authUser;
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar sessão:', error);
      
      // Tratamento específico para erro de quota excedida
      if (error?.message?.includes('auth/quota-exceeded') || error?.code === 'auth/quota-exceeded') {
        console.error('QUOTA EXCEDIDA: Firebase Authentication atingiu o limite gratuito');
        setState(prev => ({
          ...prev,
          error: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
          authChecked: true,
          loading: false,
          isAuthReady: true,
          quotaExceeded: true,
        }));
        return null;
      }
      
      // Em caso de erro, criar usuário básico sem verificar cadastro
      const authUser = normalizeUser(null, firebaseUser);
      setState(prev => ({
        ...prev,
        user: authUser,
        subscription: null,
        authChecked: true,
        loading: false,
        isAuthReady: true,
        quotaExceeded: false,
      }));

      return authUser;
    }
  }, [router, state.user]);

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
        quotaExceeded: false,
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
      
      const result = await firebaseLoginWithGoogle();
      
      // Verificar se é um novo usuário ou se precisa completar cadastro
      const { isNewUser, profile } = await checkAndCreateUserProfile(result.user);
      
      if (isNewUser || !profile.isComplete) {
        // Redirecionar para completar cadastro
        router.push('/auth/complete-registration');
        return;
      }
      
      // Sincronizar com backend
      await syncSessionWithBackend(result.user);
      
      // Redirecionar para dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      
      // Tratamento específico para erro de quota excedida
      if (error?.message?.includes('auth/quota-exceeded') || error?.code === 'auth/quota-exceeded') {
        setState(prev => ({ 
          ...prev, 
          error: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
          loading: false 
        }));
        return;
      }
      
      setState(prev => ({ 
        ...prev, 
        error: 'Falha ao entrar com Google. Tente novamente.',
        loading: false 
      }));
      throw error;
    }
  }, [router, syncSessionWithBackend]);

  // Verificar autenticação do Firebase na inicialização
  useEffect(() => {
    console.log('[AuthContext] Verificando autenticação do Firebase...');
    
    // Garantir que o Firebase esteja inicializado
    const { auth: firebaseAuth } = getFirebaseInstances();
    
    if (!firebaseAuth) {
      console.error('[AuthContext] Firebase Auth não inicializado');
      setState(prev => ({
        ...prev,
        authChecked: true,
        loading: false,
        isAuthReady: true,
      }));
      return;
    }
    
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      console.log('[AuthContext] Firebase auth state changed:', !!firebaseUser);
      
      if (firebaseUser) {
        console.log('[AuthContext] Usuário Firebase encontrado, verificando se precisa sincronizar...');
        
        // Verificar se já temos dados do usuário para evitar sincronização desnecessária
        if (!state.user || state.user.uid !== firebaseUser.uid) {
          // Verificar se estamos na página inicial - se sim, não sincronizar ainda
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
          const isHomePage = currentPath === '/';
          
          if (isHomePage) {
            console.log('[AuthContext] Na página inicial, criando usuário básico sem sincronizar com backend');
            const authUser = normalizeUser(null, firebaseUser);
            setState(prev => ({
              ...prev,
              user: authUser,
              subscription: null,
              authChecked: true,
              loading: false,
              isAuthReady: true,
            }));
          } else {
            console.log('[AuthContext] Sincronizando com backend...');
            await syncSessionWithBackend(firebaseUser);
          }
        } else {
          console.log('[AuthContext] Usuário já sincronizado, finalizando verificação...');
          setState(prev => ({
            ...prev,
            authChecked: true,
            loading: false,
            isAuthReady: true,
          }));
        }
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
  }, []); // Removido syncSessionWithBackend e state.user?.uid das dependências

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