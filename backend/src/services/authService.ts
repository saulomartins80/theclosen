import { auth } from '../config/firebaseAdmin';
import { UserRecord } from 'firebase-admin/auth';

// Função simplificada que só verifica se o email existe
export const verifyUserEmail = async (email: string): Promise<UserRecord> => {
  try {
    return await auth.getUserByEmail(email);
  } catch (error: unknown) {
    const err = error as { message?: string };
    throw new Error('Falha ao verificar usuário: ' + (err.message || 'Erro desconhecido'));
  }
};

// Exporte o auth para uso em outras partes
export { auth as firebaseAdmin };