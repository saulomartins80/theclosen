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
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: ReturnType<typeof getFirestore>;

const initializeFirebase = () => {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence
      });
      db = getFirestore(app);
    } else {
      app = getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
};

initializeFirebase();

export const loginWithGoogle = async (): Promise<UserCredential> => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    return result; // Garantindo que retornamos UserCredential
  } catch (error) {
    console.error('Google sign-in error:', error);
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
  firebaseSignOut as signOut, 
  onAuthStateChanged, 
  getIdToken
};