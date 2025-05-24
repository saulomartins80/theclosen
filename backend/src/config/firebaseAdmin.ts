// src/config/firebaseAdmin.ts
import * as admin from 'firebase-admin';
import { env } from './env';

function loadCredentials() {
  // Adicione este log para depuração
  console.log('[firebaseAdmin.ts] Valor de process.env.FIREBASE_ADMIN_PROJECT_ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
  console.log('[firebaseAdmin.ts] Objeto serviceAccount antes de cert:', {
    projectId: env.firebase.projectId,
    clientEmail: env.firebase.clientEmail,
    // Não logar a chave privada completa por segurança
    privateKey: env.firebase.privateKey ? 'PRIVATE_KEY_LOADED' : 'PRIVATE_KEY_MISSING',
  });

  const serviceAccount = {
    projectId: env.firebase.projectId,
    clientEmail: env.firebase.clientEmail,
    privateKey: env.firebase.privateKey.replace(/\\n/g, '\n'),
  };

  return serviceAccount;
}

try {
  const serviceAccountCredentials = loadCredentials();
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountCredentials),
      databaseURL: `https://${env.firebase.projectId}.firebaseio.com`,
    });
    console.log('[firebaseAdmin.ts] Firebase Admin inicializado com sucesso.');
  }
} catch (error) {
  console.error('[firebaseAdmin.ts] Erro ao inicializar Firebase Admin:', error);
  throw error; // Relança o erro para que ele apareça nos logs do Vercel
}

export const firebaseAdmin = admin;
export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();
export const adminStorage = admin.storage();