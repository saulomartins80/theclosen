import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Log para ver o valor de APP_JWT_SECRET logo após carregar o .env
console.log(`[config/env.ts] Valor inicial de process.env.APP_JWT_SECRET: "${process.env.APP_JWT_SECRET}"`);

const requiredVars = [
  'MONGO_URI',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'APP_JWT_SECRET'
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    throw new Error(`❌ Missing required environment variable: ${varName}`);
  }
});

// Log para ver o valor após a verificação de requiredVars
console.log(`[config/env.ts] Valor de process.env.APP_JWT_SECRET após verificação: "${process.env.APP_JWT_SECRET}"`);

export const env = {
  mongoURI: process.env.MONGO_URI!,
  appJwtSecret: process.env.APP_JWT_SECRET!, 
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  }
};