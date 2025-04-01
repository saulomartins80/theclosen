import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const initializeFirebaseAdmin = () => {
  try {
    // 1. Definir caminho do arquivo de credenciais
    const credentialPath = path.resolve(
      __dirname, 
      '../config/firebase-admin.json' // Ajuste o caminho conforme sua estrutura
    );

    // 2. Verificar se o arquivo existe
    if (!fs.existsSync(credentialPath)) {
      throw new Error(`Arquivo de credenciais não encontrado em: ${credentialPath}`);
    }

    // 3. Carregar e validar as credenciais
    const serviceAccount = JSON.parse(
      fs.readFileSync(credentialPath, 'utf8')
    );

    // Validação mínima dos campos obrigatórios
    const requiredFields = ['project_id', 'client_email', 'private_key'];
    for (const field of requiredFields) {
      if (!serviceAccount[field]) {
        throw new Error(`Campo obrigatório ausente: ${field}`);
      }
    }

    // 4. Inicializar o Firebase Admin
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key.replace(/\\n/g, '\n')
        }),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      console.log('✅ Firebase Admin inicializado com sucesso');
    }

    return admin;
  } catch (error) {
    console.error('❌ Falha ao inicializar Firebase Admin:', error);
    process.exit(1);
  }
};

export const firebaseAdmin = initializeFirebaseAdmin();
export const auth = firebaseAdmin.auth();
export const db = firebaseAdmin.firestore();