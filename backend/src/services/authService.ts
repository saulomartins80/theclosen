import { auth } from '../firebaseConfig';

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await auth.createUser({ email, password }); // Use createUser para criar usuários
    return userCredential.uid; // Retorna o UID do usuário criado
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Erro ao fazer login: ' + error.message);
    } else {
      throw new Error('Erro desconhecido');
    }
  }
};