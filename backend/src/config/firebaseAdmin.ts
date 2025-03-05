import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// Caminho para o arquivo de credenciais
const serviceAccountPath = path.join(process.cwd(), "src/config/firebaseServiceAccount.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Inicializa o Firebase Admin SDK apenas se ainda não foi inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// Exporta os serviços do Firebase para reutilização em outros arquivos
export const firebaseAdmin = admin;
export const auth = admin.auth();
export const db = admin.firestore();
