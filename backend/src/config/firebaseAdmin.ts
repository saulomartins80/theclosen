// src/config/firebaseAdmin.ts
import * as admin from 'firebase-admin';

function loadCredentials() {
  // 1. Tenta carregar das variáveis de ambiente
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    try {
      return JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
    } catch (error) {
      console.error('Erro ao analisar credenciais do ambiente:', error);
    }
  }

  // 2. Fallback para variáveis individuais
  if (process.env.FIREBASE_ADMIN_PROJECT_ID && 
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL && 
      process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    // Remove aspas duplas se existirem
    privateKey = privateKey.replace(/^"|"$/g, '');
    
    // Se a chave tem quebras de linha reais, mantém assim
    // Se tem \\n, converte para quebras de linha reais
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    return {
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      private_key: privateKey
    };
  }

  throw new Error(`
    ❌ Credenciais do Firebase Admin não encontradas. Por favor:
    1. Defina FIREBASE_ADMIN_CREDENTIALS no .env OU
    2. Configure as variáveis individuais (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY)
  `);
}

console.log('[firebaseAdmin] Initializing Firebase Admin...');

if (!admin.apps.length) {
  const serviceAccount = loadCredentials();
  
  console.log('[firebaseAdmin] Project ID:', serviceAccount.project_id);
  console.log('[firebaseAdmin] Client Email:', serviceAccount.client_email);
  console.log('[firebaseAdmin] Private Key exists:', !!serviceAccount.private_key);
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key
    }),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

console.log('[firebaseAdmin] Firebase Admin initialized successfully');

export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();
export const adminStorage = admin.storage();
export { admin };