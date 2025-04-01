import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const credentialPath = path.join(__dirname, 'private/firebase-admin.json');

try {
  if (!fs.existsSync(credentialPath)) {
    throw new Error(`Arquivo de credenciais não encontrado em: ${credentialPath}`);
  }

  const serviceAccount = require(credentialPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
  }
} catch (error) {
  console.error('❌ Erro na inicialização do Firebase Admin:', error);
  process.exit(1);
}

export const auth = admin.auth();
export const db = admin.firestore();