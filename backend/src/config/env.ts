import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Log para confirmar que as variáveis de ambiente foram carregadas
console.log('[config/env.ts] Variáveis de ambiente carregadas.');
console.log(`[config/env.ts] NODE_ENV: ${process.env.NODE_ENV}`);

// Removida a lista requiredVars e o loop de validação explícito aqui.
// A validação deve ser feita nos módulos que usam as variáveis específicas.

// Exporta variáveis de ambiente relevantes para o backend
export const env = {
  mongoURI: process.env.MONGO_URI,
  port: process.env.PORT, // Adicionado
  nodeEnv: process.env.NODE_ENV,
  frontendUrl: process.env.FRONTEND_URL, // Adicionado
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS, // Adicionado
  rateLimitMax: process.env.RATE_LIMIT_MAX, // Adicionado
  appJwtSecret: process.env.APP_JWT_SECRET,
  // Variáveis do Firebase Admin - Use FIREBASE_ADMIN_CREDENTIALS no Vercel dashboard
  firebaseAdminCredentials: process.env.FIREBASE_ADMIN_CREDENTIALS,
  // Chaves individuais (usadas talvez localmente ou como fallback)
  firebaseAdminProjectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  firebaseAdminClientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  // ATENÇÃO: FIREBASE_ADMIN_PRIVATE_KEY precisa de tratamento especial para quebras de linha se lida diretamente do env
  firebaseAdminPrivateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Adicionado

  // Esta variável tem nome de frontend, mas aparece no .env do backend e código firebase.ts
  // Mantenha se for usada pelo Admin SDK para databaseURL
  firebaseDatabaseUrl: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,

  // Variável da API de Clima
  openweatherApiKey: process.env.OPENWEATHER_API_KEY,

  // Adicione outras variáveis de backend aqui conforme necessário
};
