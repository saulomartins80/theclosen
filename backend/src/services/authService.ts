// src/services/authService.ts
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Configuração segura do Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../config/firebase-admin.json');

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error('Arquivo de credenciais do Firebase não encontrado');
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n')
    })
  });
}

export const firebaseAdmin = admin;

export const loginUser = async (email: string, password: string) => {
  try {
    // Verificação adicional de email e senha
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    const userRecord = await admin.auth().getUserByEmail(email);
    
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || '',
      emailVerified: userRecord.emailVerified
    };
  } catch (error) {
    throw new Error('Credenciais inválidas ou usuário não encontrado');
  }
};