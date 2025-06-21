// src/config/firebaseAdmin.ts
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

console.log('[firebaseAdmin] Initializing Firebase Admin...');
console.log('[firebaseAdmin] Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
console.log('[firebaseAdmin] Client Email:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
console.log('[firebaseAdmin] Private Key exists:', !!process.env.FIREBASE_ADMIN_PRIVATE_KEY);

const adminApp = getApps().length > 0 
  ? getApps()[0] 
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, 
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') 
      }),
      databaseURL: `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`
    });

console.log('[firebaseAdmin] Firebase Admin initialized successfully');

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);