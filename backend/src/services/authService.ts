// src/services/authService.ts
import { adminAuth as auth } from '../config/firebaseAdmin'; 
import type { UserRecord } from 'firebase-admin/auth'; 

export const verifyUserEmail = async (email: string): Promise<UserRecord> => {
  try {
    return await auth.getUserByEmail(email);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    
    if (err.code === 'auth/user-not-found') {
      throw new Error('Usuário não encontrado');
    }
    
    throw new Error(`Falha ao verificar usuário: ${err.message || 'Erro desconhecido'}`);
  }
};

export const firebaseAdmin = auth;