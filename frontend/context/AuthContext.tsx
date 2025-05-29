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
  }>( {
    user: null,
    subscription: null,
    loading: false,
    authChecked: false,
    loadingSubscription: false,
    error: null,
    subscriptionError: null,
    isAuthReady: false
  });

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, error: null, subscriptionError: null }));
  }, []);

  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    // Implementação vazia - pode ser preenchida conforme necessidade
    return false;
  }, []);

  const syncSessionWithBackend = useCallback(async (firebaseUser: FirebaseUser | null) => {
    // Sempre atualiza o estado para indicar que a verificação de autenticação está em andamento
    // e que não está mais no estado inicial de 'loading: true' (que é apenas para o primeiro render)
    setState(prev => ({ 
      ...prev, 
      // user e subscription serão definidos abaixo ou permanecerão null
      // loading: true, // O loading pode ser gerenciado pela UI que espera por isAuthReady
      authChecked: false, // Indica que a checagem está ocorrendo
      isAuthReady: false // Indica que o estado final de auth ainda não foi determinado
    }));

    if (!firebaseUser) {
      console.log("syncSessionWithBackend: No firebaseUser. Setting state to unauthenticated.");
      setState(prev => ({
        ...prev,
        user: null,
        subscription: null,
        authChecked: true, // Finalizou a checagem
        loading: false, // Não está carregando dados do backend
        isAuthReady: true, // O estado (não autenticado) foi determinado
      }));
      return null;
    }
  
    try {
      console.log("syncSessionWithBackend: Found firebaseUser.");
      // Força refresh do token para garantir que está atualizado para a chamada ao backend
      const token = await firebaseUser.getIdToken(true);
      console.log("syncSessionWithBackend: Obtained fresh token.");

      // ALTERAÇÃO: usa caminho relativo para passar pela reescrita do Vercel/Next.js
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Envia o token no header para o backend validar
        },
        body: JSON.stringify({}), // O token já está no header
      });

      const sessionData = await response.json().catch(() => ({}));
      console.log("syncSessionWithBackend: Received sessionData:", sessionData); // Adicionado este log
      console.log("syncSessionWithBackend: sessionData.user:", sessionData?.user); // Adicionado este log
  
      if (!sessionData.user) {
        const errorMessage = 'Dados do usuário não encontrados na resposta do backend.';
        setState(prev => ({
          ...prev,
          user: null, // Limpa user/subscription se os dados do backend estiverem incompletos
          subscription: null,
          authChecked: true,
          loading: false,
          isAuthReady: true,
          error: errorMessage,
        }));
        // console.error("syncSessionWithBackend error:", errorMessage);
        return null;
      }
  
      // Sucesso: normaliza e atualiza o estado do contexto
      const authUser = normalizeUser(sessionData.user as SessionUser, firebaseUser);
      console.log("syncSessionWithBackend: Result of normalizeUser:", authUser); // Adicionado este log

      console.log("syncSessionWithBackend: Session synced. User:", authUser); // Já existe, bom manter

      setState(prev => ({
        ...prev,
        user: authUser,
        subscription: authUser?.subscription || null,
        authChecked: true, // Finalizou a checagem
        loading: false, // Não está carregando dados do backend
        isAuthReady: true, // O estado (autenticado) foi determinado
        error: null, // Limpa erros anteriores
      }));
  
      return authUser;

    } catch (error) {
      console.error('syncSessionWithBackend caught error:', error);
  
      // Trata erros de rede ou outros erros que impedem a comunicação com o backend
      // Nestes casos, é prudente deslogar para evitar inconsistência de estado
      await firebaseSignOut(auth);

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
      
      // Primeiro tenta o logout do Firebase
      await firebaseSignOut(auth);
      console.log("Firebase signed out.");
      
      // Depois informa o backend para limpar a sessão do lado dele (se aplicável)
      try {
        // Usa a URL correta para o endpoint de logout do backend
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, { 
          method: 'POST',
          credentials: 'include' 
          // Não precisa enviar token aqui se o backend usa cookies de sessão httpOnly com credentials: 'include'
          // Se usar header Auth, precisaria do token aqui, mas o Firebase sign out já invalidaria ele logo.
        });
        console.log("Backend logout endpoint called.");
      } catch (apiError) {
        // Loga erro do backend logout mas não impede o frontend de prosseguir
        console.error('API logout error:', apiError);
      }
      
      // Limpa o estado do frontend imediatamente após o logout do Firebase
      setState({
        user: null,
        subscription: null,
        loading: false,
        authChecked: true,
        loadingSubscription: false,
        error: null,
        subscriptionError: null,
        isAuthReady: true, // O estado de não autenticado foi determinado
      });
      
      // Redireciona após limpar o estado
      router.push('/auth/login');
      console.log("Redirecting to login.");

    } catch (error) {
      console.error('Logout error:', error);
      // Em caso de erro no logout do Firebase, atualiza o estado mas não força o redirect
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao sair', 
        loading: false,
        // Mantém o estado de autenticação como estava ou tenta re-sincronizar?
        // Melhor manter o estado como estava antes do erro de logout, ou talvez isAuthReady: true com user: null
        isAuthReady: true,
        user: null, // Assumimos que se tentou sair, a intenção é não estar mais logado
        subscription: null,
      }));
    }
  }, [router]);

  const fetchSubscription = useCallback(async (userId: string) => {
    if (!userId) {
      console.warn("fetchSubscription called without userId");
      setState(prev => ({ ...prev, subscription: null, loadingSubscription: false }));
       return; // Sai da função se não houver userId
    }
    
    setState(prev => ({ ...prev, loadingSubscription: true, subscriptionError: null }));
    
    try {
      // Certifique-se de que subscriptionAPI.get usa o token de autenticação se necessário
      // E que a URL construída é correta (sem o 'undefined')
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
        subscriptionError: null, // Limpa erros anteriores de subscription
      }));
    } catch (error) {
      console.error('fetchSubscription error:', error);
      setState(prev => ({
        ...prev,
        subscription: null, // Limpa a subscription em caso de erro
        subscriptionError: error instanceof Error ? error.message : 'Failed to load subscription',
        loadingSubscription: false,
      }));
    }
  }, []); // Depende de subscriptionAPI (se ela mudar, mas geralmente não acontece)

  const checkSubscriptionQuick = useCallback(async (userId: string): Promise<boolean> => {
     if (!userId) {
       console.warn("checkSubscriptionQuick called without userId");
       return false;
     }
    try {
      // Certifique-se de que subscriptionAPI.quickCheck usa o token de autenticação se necessário
      // E que a URL construída é correta (sem o 'undefined')
      return await subscriptionAPI.quickCheck(userId);
    } catch (error) {
      console.error('Quick check subscription error:', error);
       // Em caso de erro na checagem rápida, assume que não há subscription ativa
      return false;
    }
  }, []); // Depende de subscriptionAPI

  const createTestSubscription = useCallback(async (plan: string): Promise<Subscription | void> => {
    if (!state.user?.uid) {
      console.warn("createTestSubscription called without authenticated user");
      setState(prev => ({ ...prev, subscriptionError: 'Usuário não autenticado', loadingSubscription: false }));
      return;
    }
    
    setState(prev => ({ ...prev, loadingSubscription: true, subscriptionError: null }));
    
    try {
      // Certifique-se de que subscriptionAPI.createTest usa o token de autenticação se necessário
      // E que a URL construída é correta
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
       console.error('createTestSubscription error:', error);
      setState(prev => ({ 
        ...prev, 
        subscription: null, // Limpa a subscription em caso de erro na criação
        subscriptionError: error instanceof Error ? error.message : 'Failed to create subscription',
        loadingSubscription: false
      }));
      throw error; // Re-throw para que o componente que chamou possa tratar
    }
  }, [state.user?.uid]); // Depende de state.user?.uid e subscriptionAPI

  const refreshSubscription = useCallback(async () => {
    if (state.user?.uid) {
      await fetchSubscription(state.user.uid);
    } else {
       console.warn("refreshSubscription called without authenticated user");
       // Se não há usuário logado, garante que o estado de subscription está limpo
       setState(prev => ({ ...prev, subscription: null }));
    }
  }, [state.user?.uid, fetchSubscription]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      // Ensure 'auth' is a valid Firebase Auth instance and email/password are strings
      const userCredential = await signInWithEmailAndPassword(auth, String(email), String(password));
      console.log("Firebase email/password login successful.", userCredential.user.uid);

      // Sincroniza com o backend após login bem-sucedido no Firebase
      await syncSessionWithBackend(userCredential.user);
       console.log("Backend session synced after login.");

      // Redireciona para a página desejada ou dashboard
      const { redirect } = router.query;
      const redirectTo = typeof redirect === 'string' ? redirect : '/dashboard';
      console.log("Redirecting to:", redirectTo);
      router.push(redirectTo);

    } catch (error) {
       console.error('Email/Password login error:', error);
      let errorMessage = 'Login failed';

      if (error instanceof Error) {
        if (error.message.includes('auth/invalid-email')) {
          errorMessage = 'Email inválido';
        } else if (error.message.includes('auth/user-not-found') || error.message.includes('auth/wrong-password')) {
          errorMessage = 'Email ou senha incorretos';
        } else {
          // Assume outros erros do Firebase auth
          errorMessage = error.message;
        }
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        // No login error, user should be null, isAuthReady should be true (state determined)
        user: null,
        subscription: null,
        authChecked: true,
        isAuthReady: true,
      }));
      throw error; // Re-throw para que a UI possa lidar com o erro
    }
  }, [router, syncSessionWithBackend]);

  const loginWithGoogle = useCallback(async () => {
  try {
    setState(prev => ({ ...prev, loading: true, error: null }));
    console.log("Starting Google login popup.");
    
    // Usando a função renomeada para login com Google popup
    const userCredential = await firebaseLoginWithGoogle();
    
    if (!userCredential?.user) {
       console.warn("Google login popup closed or no user returned.");
      // Se o popup for fechado ou não retornar usuário, apenas limpa o loading e não atualiza o estado de user/authChecked
      setState(prev => ({ ...prev, loading: false }));
      return; // Sai da função
      // throw new Error('No user returned from Google login'); // Melhor não jogar erro se for apenas popup fechado
    }
    
    console.log("Firebase Google login successful.", userCredential.user.uid);

    // Sincroniza com o backend após login bem-sucedido no Firebase
    await syncSessionWithBackend(userCredential.user);
    console.log("Backend session synced after Google login.");

    // Redireciona para a página desejada ou dashboard
    const { redirect } = router.query;
    const redirectTo = typeof redirect === 'string' ? redirect : '/dashboard';
    console.log("Redirecting to:", redirectTo);
    router.push(redirectTo);
    
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
       else {
          // Assume outros erros do Firebase auth
          errorMessage = error.message;
        }
    }
    
    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
       // No login error, user should be null, isAuthReady should be true (state determined)
      user: null,
      subscription: null,
      authChecked: true,
      isAuthReady: true,
    }));
     // Não re-throw para não quebrar o popup flow, o erro é mostrado no estado
  }
}, [router, syncSessionWithBackend]);


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
    login,
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
    login,
    loginWithGoogle,
    logout,
    clearErrors,
    verifyToken,
    updateUserContextProfile,
    syncSessionWithBackend,
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged triggered with:", firebaseUser);

      // Chamar syncSessionWithBackend para processar o usuário do Firebase e backend sync
      await syncSessionWithBackend(firebaseUser);

      // Garante que isAuthReady se torna true após a checagem inicial, mesmo que syncSessionWithBackend falhe
      setState(prev => ({ ...prev, isAuthReady: true }));
      console.log("onAuthStateChanged finished. isAuthReady set to true.");
    });

    // Limpar o listener ao desmontar
    return () => unsubscribe();
  }, [syncSessionWithBackend]);

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