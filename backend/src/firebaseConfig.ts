import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// Caminho para o arquivo de credenciais
const serviceAccountPath = path.resolve(__dirname, "config", "firebaseServiceAccount.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Inicializa o Firebase apenas se ainda não foi inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// Exporta a instância do Firebase para ser usada em outros arquivos
export default admin;
export const auth = admin.auth();
export const db = admin.firestore();
