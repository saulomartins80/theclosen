// src/config/firebase.ts
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

function loadCredentials() {
  // 1. Tenta carregar das variáveis de ambiente
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    try {
      return JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
    } catch (error) {
      console.error('Erro ao analisar credenciais do ambiente:', error);
    }
  }

  // 2. Tenta carregar do arquivo
  const serviceAccountPath = path.join(__dirname, 'private', 'firebase-admin.json');
  if (fs.existsSync(serviceAccountPath)) {
    return JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  }

  throw new Error(`
    ❌ Credenciais do Firebase Admin não encontradas. Por favor:
    1. Defina FIREBASE_ADMIN_CREDENTIALS no .env OU
    2. Coloque o arquivo firebase-admin.json em src/config/private/
  `);
}

if (!admin.apps.length) {
  const serviceAccount = loadCredentials();
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n')
    }),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export { admin };