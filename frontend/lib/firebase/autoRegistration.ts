import { auth, db } from './client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Campos adicionais que podem ser necessários
  phoneNumber?: string;
  dateOfBirth?: string;
  cpf?: string;
}

export const checkAndCreateUserProfile = async (user: User): Promise<{ isNewUser: boolean; profile: UserProfile }> => {
  try {
    // Verificar se o usuário já existe no Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Usuário já existe, retornar perfil existente
      const profile = userDoc.data() as UserProfile;
      return { isNewUser: false, profile };
    } else {
      // Usuário não existe, criar perfil básico
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        isComplete: false, // Marcar como incompleto para forçar cadastro
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Salvar no Firestore
      await setDoc(userDocRef, newProfile);
      
      return { isNewUser: true, profile: newProfile };
    }
  } catch (error) {
    console.error('Erro ao verificar/criar perfil do usuário:', error);
    throw error;
  }
};

export const completeUserRegistration = async (uid: string, additionalData: Partial<UserProfile>): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    
    await setDoc(userDocRef, {
      ...additionalData,
      isComplete: true,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Erro ao completar cadastro do usuário:', error);
    throw error;
  }
};

export const isUserRegistrationComplete = async (uid: string): Promise<boolean> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const profile = userDoc.data() as UserProfile;
    return profile.isComplete;
  } catch (error) {
    console.error('Erro ao verificar se cadastro está completo:', error);
    return false;
  }
}; 