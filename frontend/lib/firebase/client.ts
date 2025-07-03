// frontend/lib/firebase/client.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type UserCredential,
  type Auth,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getIdToken,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  getRedirectResult
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// ✅ CORREÇÃO: Configuração do Firebase usando variáveis de ambiente
const getFirebaseConfig = () => {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // ✅ CORREÇÃO: Verificar se todas as variáveis necessárias estão presentes
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
  const hasAllEnvVars = requiredKeys.every(key => config[key as keyof typeof config]);

  if (!hasAllEnvVars) {
    console.error('❌ Variáveis de ambiente do Firebase não encontradas:');
    requiredKeys.forEach(key => {
      const envKey = `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`;
      console.error(`${envKey}: ${process.env[envKey] ? '✅ Presente' : '❌ Ausente'}`);
    });
    throw new Error('Configuração do Firebase incompleta. Verifique as variáveis de ambiente.');
  }

  // ✅ CORREÇÃO: Verificar se as variáveis não estão vazias
  const emptyVars = requiredKeys.filter(key => !config[key as keyof typeof config] || config[key as keyof typeof config] === '');
  if (emptyVars.length > 0) {
    console.error('❌ Variáveis de ambiente do Firebase vazias:', emptyVars);
    throw new Error('Configuração do Firebase incompleta. Algumas variáveis estão vazias.');
  }

  console.log('✅ Usando configuração das variáveis de ambiente');
  console.log('✅ Configuração do Firebase válida:', {
    authDomain: config.authDomain,
    projectId: config.projectId,
    hasApiKey: !!config.apiKey,
    hasAppId: !!config.appId
  });
  return config;
};

const firebaseConfig = getFirebaseConfig();

let app: FirebaseApp;
let auth: Auth;
let db: ReturnType<typeof getFirestore>;
let storage: FirebaseStorage;

const initializeFirebase = () => {
  try {
    if (!getApps().length) {
      console.log('Initializing Firebase app...');
      app = initializeApp(firebaseConfig);
      
      console.log('Initializing Firebase auth...');
      auth = initializeAuth(app, {
        persistence: browserSessionPersistence
      });
      
      console.log('Initializing Firestore...');
      db = getFirestore(app);
      
      console.log('Initializing Firebase Storage...');
      storage = getStorage(app);
      
      console.log('Firebase initialized successfully');
    } else {
      console.log('Using existing Firebase app...');
      app = getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

// ✅ CORREÇÃO: Inicializar Firebase apenas no lado do cliente
if (typeof window !== 'undefined') {
  try {
    initializeFirebase();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
}

export const loginWithGoogle = async (): Promise<UserCredential> => {
  if (!auth) {
    console.error('Firebase Auth not initialized');
    throw new Error('Firebase Auth não foi inicializado. Verifique a configuração.');
  }

  const provider = new GoogleAuthProvider();
  
  // ✅ CORREÇÃO: Configurações para evitar problemas de popup
  provider.setCustomParameters({
    prompt: 'select_account',
    access_type: 'offline',
    include_granted_scopes: 'true'
  });

  // ✅ CORREÇÃO: Adicionar escopos necessários
  provider.addScope('email');
  provider.addScope('profile');

  try {
    console.log('Attempting Google sign-in with popup...');
    console.log('Firebase config check:', {
      authDomain: auth.config.authDomain,
      hasApiKey: !!auth.config.apiKey
    });
    
    const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    console.log('Google sign-in successful');
    return result;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // ✅ CORREÇÃO: Tratamento específico de erros
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      console.log('Popup blocked or closed, trying redirect method...');
      throw new Error('Popup bloqueado. Por favor, permita popups para este site.');
    }
    
    // ✅ CORREÇÃO: Tratar erro de argumento inválido
    if (error.code === 'auth/argument-error') {
      console.error('Firebase configuration error detected');
      console.error('Current config:', firebaseConfig);
      throw new Error('Erro de configuração do Firebase. Verifique as variáveis de ambiente.');
    }
    
    // ✅ CORREÇÃO: Tratar erro de credenciais inválidas
    if (error.code === 'auth/invalid-credential') {
      console.error('Invalid credential error - possible configuration issue');
      throw new Error('Credenciais inválidas. Verifique a configuração do Firebase.');
    }
    
    // ✅ CORREÇÃO: Tratar erro de domínio não autorizado
    if (error.code === 'auth/unauthorized-domain') {
      console.error('Unauthorized domain error');
      throw new Error('Domínio não autorizado. Verifique a configuração do Firebase.');
    }
    
    // ✅ CORREÇÃO: Tratar erro de operação não permitida
    if (error.code === 'auth/operation-not-allowed') {
      console.error('Operation not allowed error');
      throw new Error('Login com Google não está habilitado. Verifique a configuração do Firebase.');
    }
    
    throw error;
  }
};

export const loginWithEmailAndPassword = (email: string, password: string) => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  return firebaseSignInWithEmailAndPassword(auth, email, password);
};

// ✅ CORREÇÃO: Função para obter instâncias do Firebase com verificação
export const getFirebaseInstances = () => {
  if (!app || !auth) {
    console.log('Firebase instances not found, initializing...');
    initializeFirebase();
  }
  return { app, auth, db, storage };
};

export {
  app,
  auth,
  db,
  storage,
  firebaseSignOut as signOut,
  onAuthStateChanged,
  getIdToken
}; 