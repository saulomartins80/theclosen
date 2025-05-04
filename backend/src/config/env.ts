import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredVars = [
  'MONGO_URI',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'FIREBASE_ADMIN_CLIENT_EMAIL'
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`❌ Missing required environment variable: ${varName}`);
  }
});

export const env = {
  mongoURI: process.env.MONGO_URI!,
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    // ... outras vars
  }
};