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

// Este tipo representa os dados do usuário como vêm do backend (MongoDB)
export interface SessionUser {
  uid: string; // Firebase UID
  email: string | null;
  name: string | null; // Nome do MongoDB
  photoUrl: string | null; // Photo URL do MongoDB
  subscription?: Subscription | null;
}

// Este tipo representa o usuário no AuthContext, estendendo FirebaseUser para compatibilidade
// mas priorizando dados do MongoDB quando disponíveis.
export interface AuthUser extends FirebaseUser {
  name: string | null; // Adicionado para ter o nome do MongoDB diretamente
  photoUrl: string | null; // photoUrl do MongoDB (pode sobrescrever photoURL do FirebaseUser)
  subscription: Subscription | null;
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
  updateUserContextProfile: (updatedProfileData: Partial<SessionUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeSubscription = (subscription: any): Subscription | null => {
  if (!subscription) return null;
  return {
    id: subscription.id,
    plan: subscription.plan as SubscriptionPlan,
    status: subscription.status as SubscriptionStatus,
    expiresAt: subscription.expiresAt,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
};

// Atualizado normalizeUser para priorizar dados da SessionUser (MongoDB)
const normalizeUser = (userFromBackend: SessionUser, firebaseUserInstance?: FirebaseUser): AuthUser | null => {
  if (!userFromBackend && !firebaseUserInstance) return null;

  // Se tivermos apenas o firebaseUserInstance (ex: logo após o onAuthStateChanged inicial)
  if (!userFromBackend && firebaseUserInstance) {
    return {
      ...firebaseUserInstance,
      name: firebaseUserInstance.displayName, // Usa displayName do Firebase como fallback inicial
      photoUrl: firebaseUserInstance.photoURL, // Usa photoURL do Firebase como fallback inicial
      subscription: null, // A assinatura será carregada pela syncSessionWithBackend
    } as AuthUser;
  }

  // Se tivermos userFromBackend (dados da nossa API /session, que vêm do MongoDB)
  // E opcionalmente firebaseUserInstance para preencher os métodos de FirebaseUser
  if (userFromBackend) {
    const baseFirebaseUserProps = firebaseUserInstance || {
      uid: userFromBackend.uid,
      email: userFromBackend.email,
      displayName: userFromBackend.name, // Usar o nome do MongoDB para displayName do FirebaseUser base
      photoURL: userFromBackend.photoUrl, // Usar photoUrl do MongoDB para photoURL do FirebaseUser base
      emailVerified: false, // Default, Firebase pode ter outro valor
      isAnonymous: false, // Default
      metadata: {}, // Default
      providerData: [], // Default
      refreshToken: '', // Default
      tenantId: null, // Default
      delete: async () => {}, 
      getIdToken: async () => '', 
      getIdTokenResult: async () => ({} as IdTokenResult),
      reload: async () => {},
      toJSON: () => ({}),
      providerId: 'firebase', // Default
    } as unknown as FirebaseUser; // Cast para FirebaseUser

    return {
      ...baseFirebaseUserProps, // Propriedades e métodos do FirebaseUser
      uid: userFromBackend.uid, // Garantir UID do backend
      email: userFromBackend.email, // Garantir email do backend
      name: userFromBackend.name, // Nome do MongoDB
      photoUrl: userFromBackend.photoUrl, // Photo URL do MongoDB (sobrescreve o photoURL de baseFirebaseUserProps se diferente)
      // photoURL: userFromBackend.photoUrl, // Atualizar também photoURL para consistência se necessário para componentes que usam FirebaseUser diretamente
      subscription: normalizeSubscription(userFromBackend.subscription), // Assinatura do MongoDB
    } as AuthUser;
  }
  return null; // Caso nenhum usuário seja fornecido
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
  }>({
    user: null,
    subscription: null,
    loading: true,
    authChecked: false,
    loadingSubscription: false,
    error: null,
    subscriptionError: null,
  });

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, error: null, subscriptionError: null }));
  }, []);

  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    // Implementação omitida por brevidade, assumindo que está correta
    return false;
  }, []);

  const syncSessionWithBackend = useCallback(async (firebaseUser: FirebaseUser | null) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    if (!firebaseUser) {
      setState(prev => ({ ...prev, user: null, subscription: null, authChecked: true, loading: false }));
      return null;
    }
    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken }),
          credentials: 'include'
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || (response.status === 401 ? 'Não autorizado' : 'Falha ao sincronizar sessão'));
      }
      const sessionData = await response.json();
      if (!sessionData.user) { // Backend pode retornar user: null em caso de erro de token, etc.
        throw new Error('Sessão inválida ou usuário não encontrado no backend.');
      }

      // sessionData.user aqui é do tipo SessionUser (dados do MongoDB)
      const authUser = normalizeUser(sessionData.user as SessionUser, firebaseUser);
      
      setState(prev => ({
        ...prev,
        user: authUser,
        subscription: authUser?.subscription || null,
        authChecked: true,
        loading: false
      }));
      return authUser;
    } catch (error) {
      console.error('Erro na sincronização com backend:', error);
      // Em caso de erro na sincronização, deslogar o usuário do Firebase para evitar loop
      await firebaseSignOut(auth); 
      setState(prev => ({
        ...prev,
        user: null,
        subscription: null,
        authChecked: true,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro na sincronização'
      }));
      return null;
    }
  }, []);
  
  const updateUserContextProfile = useCallback((updatedProfileData: Partial<SessionUser>) => {
    setState(prev => {
      if (!prev.user) return prev;
      // Cria um SessionUser parcial para passar para normalizeUser
      const partialSessionUser: SessionUser = {
        uid: prev.user.uid,
        email: updatedProfileData.email !== undefined ? updatedProfileData.email : prev.user.email,
        name: updatedProfileData.name !== undefined ? updatedProfileData.name : prev.user.name,
        photoUrl: updatedProfileData.photoUrl !== undefined ? updatedProfileData.photoUrl : prev.user.photoUrl,
        subscription: updatedProfileData.subscription !== undefined ? updatedProfileData.subscription : prev.user.subscription,
      };
      // Reutiliza o firebaseUser original (que tem os métodos)
      const updatedAuthUser = normalizeUser(partialSessionUser, prev.user as FirebaseUser);

      return {
        ...prev,
        user: updatedAuthUser,
        subscription: updatedAuthUser?.subscription || null,
      };
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await firebaseSignOut(auth); // Primeiro desloga do Firebase
      // Chamada para o endpoint de logout do backend para limpar cookies HTTP-only
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, { 
        method: 'POST',
        credentials: 'include' // Envia cookies para o backend
      }); 
      // Limpa o estado local
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
        user: prev.user ? { ...prev.user, subscription: normalizedSubscription } : null,
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
      await syncSessionWithBackend(result.user);
      const { redirect } = router.query;
      const redirectPath = typeof redirect === 'string' ? redirect : '/dashboard';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncSessionWithBackend(firebaseUser);
      } else {
        // Usuário deslogado do Firebase
        setState(prev => ({
          ...prev,
          user: null,
          subscription: null,
          authChecked: true,
          loading: false,
        }));
      }
    });
    return () => unsubscribe();
  }, [syncSessionWithBackend]);

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
    updateUserContextProfile,
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
