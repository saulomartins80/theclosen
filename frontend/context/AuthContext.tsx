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
// Ensure that 'auth' is exported as a properly initialized Firebase Auth instance from your firebase/client file.
import { subscriptionAPI } from '../services/api/subscriptionAPI';

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
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  subscription: Subscription | null;
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
  updateUserContextProfile: (updatedProfileData: Partial<SessionUser>) => void;
  isAuthReady: boolean;
  syncSessionWithBackend?: (firebaseUser: FirebaseUser | null) => Promise<AuthUser | null>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  subscription: null,
  authChecked: false,
  loadingSubscription: false,
  error: null,
  subscriptionError: null,
  refreshSubscription: async () => {},
  checkSubscriptionQuick: async () => false,
  createTestSubscription: async () => {},
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  clearErrors: () => {},
  verifyToken: async () => false,
  updateUserContextProfile: () => {},
  isAuthReady: false,
  syncSessionWithBackend: async () => null,
});

const normalizeSubscription = (subscription: any): Subscription | null => {
  if (!subscription) return null;
  
  return {
    id: subscription.id,
    plan: subscription.plan as SubscriptionPlan,
    status: subscription.status as SubscriptionStatus,
    expiresAt: subscription.expiresAt,
    trialEndsAt: subscription.trialEndsAt,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
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
    loading: false,
    authChecked: false,
    loadingSubscription: false,
    error: null,
    subscriptionError: null,
    isAuthReady: false,
  });

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, error: null, subscriptionError: null }));
  }, []);

  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    // Implementação vazia - pode ser preenchida conforme necessidade
    return false;
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
      return null;
    }
  
    try {
      let token = await firebaseUser.getIdToken(true); // Força token fresco
      let response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
  
      // Se o token estiver expirado, tenta novamente com um novo token
      if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.code === 'TOKEN_EXPIRED') {
          token = await firebaseUser.getIdToken(true);
          response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/session`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
        }
      }
  
      const sessionData = await response.json().catch(() => ({}));
  
      if (!response.ok) {
        let errorMessage = 'Erro ao sincronizar sessão';
        if (response.status === 401) {
          errorMessage = 'Sessão expirada ou inválida. Por favor, faça login novamente.';
          await firebaseSignOut(auth);
        } else if (response.status === 404) {
          errorMessage = 'Usuário não encontrado no sistema';
        } else if (response.status >= 500) {
          errorMessage = 'Erro interno do servidor';
        } else if (sessionData?.error) {
          errorMessage = sessionData.error;
        }
        throw new Error(errorMessage);
      }
  
      if (!sessionData.user) {
        throw new Error('Dados do usuário não encontrados na resposta');
      }
  
      const authUser = normalizeUser(sessionData.user as SessionUser, firebaseUser);
  
      setState(prev => ({
        ...prev,
        user: authUser,
        subscription: authUser?.subscription || null,
        authChecked: true,
        loading: false,
        isAuthReady: true,
      }));
  
      return authUser;
    } catch (error) {
      const shouldSignOut =
        error instanceof Error &&
        (error.message.includes('Sessão expirada') ||
          error.message.includes('inválida'));
  
      if (shouldSignOut) {
        await firebaseSignOut(auth);
      }
  
      setState(prev => ({
        ...prev,
        user: null,
        subscription: null,
        authChecked: true,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na sincronização',
        isAuthReady: true,
      }));
  
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
        error: 'Erro ao sair', 
        loading: false 
      }));
    }
  }, [router]);

  const fetchSubscription = useCallback(async (userId: string) => {
    if (!userId) return;
    
    setState(prev => ({ ...prev, loadingSubscription: true, subscriptionError: null }));
    
    try {
      const subscriptionData = await subscriptionAPI.get(userId);
      const normalizedSubscription = normalizeSubscription(subscriptionData);
      
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
      const subscriptionData = await subscriptionAPI.createTest(state.user.uid, plan);    
      const normalizedSubscription = normalizeSubscription(subscriptionData);
      
      setState(prev => ({ 
        ...prev, 
        subscription: normalizedSubscription,
        user: prev.user ? { 
          ...prev.user, 
          subscription: normalizedSubscription 
        } : null,
        subscriptionError: null,
        loadingSubscription: false
      }));
      
      return normalizedSubscription as Subscription;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        subscriptionError: error instanceof Error ? error.message : 'Failed to create subscription',
        loadingSubscription: false
      }));
      throw error;
    }
  }, [state.user?.uid]);

  const refreshSubscription = useCallback(async () => {
    if (state.user?.uid) {
      await fetchSubscription(state.user.uid);
    }
  }, [state.user?.uid, fetchSubscription]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Ensure 'auth' is a valid Firebase Auth instance and email/password are strings
      const userCredential = await signInWithEmailAndPassword(auth, String(email), String(password));
      await syncSessionWithBackend(userCredential.user);

      const { redirect } = router.query;
      // REMOVIDA A SEGUNDA CHAMADA DUPLICADA DE router.push
      router.push(typeof redirect === 'string' ? redirect : '/dashboard');
    } catch (error) {
      let errorMessage = 'Login failed';

      if (error instanceof Error) {
        if (error.message.includes('auth/invalid-email')) {
          errorMessage = 'Email inválido';
        } else if (error.message.includes('auth/user-not-found') || error.message.includes('auth/wrong-password')) {
          errorMessage = 'Email ou senha incorretos';
        } else {
          errorMessage = error.message;
        }
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      throw error;
    }
  }, [router, syncSessionWithBackend]);

  const loginWithGoogle = useCallback(async () => {
  try {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    // Usando a função renomeada
    const userCredential = await firebaseLoginWithGoogle();
    
    if (!userCredential?.user) {
      throw new Error('No user returned from Google login');
    }
    
    await syncSessionWithBackend(userCredential.user);
    
    const { redirect } = router.query;
    const redirectPath = typeof redirect === 'string' ? redirect : '/dashboard';
    router.push(redirectPath);
    
  } catch (error) {
    console.error('Google login error:', error);
    
    let errorMessage = 'Falha no login com Google';
    if (error instanceof Error) {
      if (error.message.includes('auth/popup-closed-by-user')) {
        errorMessage = 'Login cancelado';
      } else if (error.message.includes('auth/account-exists-with-different-credential')) {
        errorMessage = 'Este email já está cadastrado com outro método de login';
      } else if (error.message.includes('auth/argument-error')) {
        errorMessage = 'Erro de configuração no login com Google';
      }
    }
    
    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  }
}, [router, syncSessionWithBackend]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged triggered with:", firebaseUser);

      if (firebaseUser) {
        console.log("User is logged in - UID:", firebaseUser.uid);
        try {
          // Forçar refresh do token
          const freshToken = await firebaseUser.getIdToken(true);
          console.log("Fresh token obtained");
          await syncSessionWithBackend(firebaseUser);
        } catch (error) {
          console.error("Error in auth state change:", error);
          setState(prev => ({
            ...prev,
            user: null,
            subscription: null,
            authChecked: true,
            loading: false,
            isAuthReady: true,
            error: error instanceof Error ? error.message : 'Erro ao verificar autenticação'
          }));
        }
      } else {
        console.log("No user detected - checking auth state");
        // Verifique se há um usuário ativo que pode não ter sido detectado
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log("Found currentUser that wasn't detected:", currentUser.uid);
          await syncSessionWithBackend(currentUser);
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            subscription: null,
            authChecked: true,
            loading: false,
            isAuthReady: true,
          }));
        }
      }
    });

    return () => unsubscribe();
  }, [syncSessionWithBackend]);

  const value: AuthContextType = useMemo(() => ({
    ...state,
    setUser: (updater) => {
      setState(prev => {
        const newUser = typeof updater === 'function' ? updater(prev.user) : updater;
        return { 
          ...prev, 
          user: newUser,
          subscription: newUser?.subscription || null 
        };
      });
    },
    refreshSubscription,
    checkSubscriptionQuick,
    createTestSubscription,
    login, // Incluindo a função login corrigida
    loginWithGoogle,
    logout,
    clearErrors,
    verifyToken,
    updateUserContextProfile,
    syncSessionWithBackend,
  }), [
    state,
    refreshSubscription,
    checkSubscriptionQuick,
    createTestSubscription,
    login, // Incluindo login nas dependências do useMemo
    loginWithGoogle,
    logout,
    clearErrors,
    verifyToken,
    updateUserContextProfile,
    syncSessionWithBackend,
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