// lib/firebase/client.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdToken,
  type User as FirebaseUser,
  type UserCredential,
  type AuthError
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  type DocumentData,
  type DocumentReference
} from 'firebase/firestore';

// Configuração do Firebase para o cliente (frontend)
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Opcional
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configuração adicional para o GoogleAuthProvider
googleProvider.setCustomParameters({
  prompt: 'select_account', // Força a seleção de conta sempre
});

// Exporta funções úteis do Firestore
export { 
  collection,
  doc,
  setDoc,
  getDoc
};

// Exporta funções e tipos de autenticação
export { 
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdToken,
  type FirebaseUser,
  type UserCredential,
  type AuthError
};

// Exporta tipos do Firestore
export type { 
  DocumentData, 
  DocumentReference 
};

// Exporta a instância do app
export default app;