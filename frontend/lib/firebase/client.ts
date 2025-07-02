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
// IMPORTAR getStorage do Firebase Storage
import { getStorage, FirebaseStorage } from 'firebase/storage'; // <-- Importar getStorage e FirebaseStorage type


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // <-- storageBucket é necessário na config
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: ReturnType<typeof getFirestore>;
let storage: FirebaseStorage; // <-- Declarar variável para Storage

const initializeFirebase = () => {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = initializeAuth(app, {
        persistence: browserSessionPersistence
      });
      db = getFirestore(app);
      storage = getStorage(app); // <-- Inicializar Storage
    } else {
      app = getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app); // <-- Inicializar Storage
    }
  } else {
    // Lógica para SSR (server-side rendering) - Inicializa apenas o app, auth e db
    // Storage geralmente não é usado no servidor diretamente para uploads do cliente.
    // Se precisar de Storage no servidor para outras tarefas, ajuste aqui.
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // Storage não é inicializado para SSR aqui, assumindo que só é usado no cliente.
    // Se precisar dele no servidor, adicione `storage = getStorage(app);`
  }
};

initializeFirebase();

export const loginWithGoogle = async (): Promise<UserCredential> => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  const provider = new GoogleAuthProvider();
  
  // Configurações para evitar problemas de popup
  provider.setCustomParameters({
    prompt: 'select_account',
    // Adicionar parâmetros para melhorar a experiência
    access_type: 'offline',
    include_granted_scopes: 'true'
  });

  // Adicionar escopos necessários
  provider.addScope('email');
  provider.addScope('profile');

  try {
    // Usar signInWithPopup com configurações específicas para produção
    const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    return result;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    
    // Se o popup falhar, tentar com redirect (fallback)
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      console.log('Popup blocked or closed, trying redirect method...');
      // Implementar fallback para redirect se necessário
      throw new Error('Popup bloqueado. Por favor, permita popups para este site.');
    }
    
    throw error;
  }
};

export const loginWithEmailAndPassword = (email: string, password: string) => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  return firebaseSignInWithEmailAndPassword(auth, email, password);
};

export {
  app,
  auth,
  db,
  storage, // <-- Exportar a instância do Storage
  firebaseSignOut as signOut,
  onAuthStateChanged,
  getIdToken
};
