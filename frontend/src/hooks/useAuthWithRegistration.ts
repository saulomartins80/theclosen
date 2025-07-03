import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loginWithGoogle } from '../../lib/firebase/client';
import { checkAndCreateUserProfile, isUserRegistrationComplete } from '../../lib/firebase/autoRegistration';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase/client';

export const useAuthWithRegistration = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Verificar se o cadastro está completo
        const isComplete = await isUserRegistrationComplete(user.uid);
        setRegistrationComplete(isComplete);
        
        // Se não estiver completo, redirecionar para cadastro
        if (!isComplete) {
          router.push('/auth/complete-registration');
        }
      } else {
        setRegistrationComplete(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await loginWithGoogle();
      
      // Verificar se é um novo usuário
      const { isNewUser, profile } = await checkAndCreateUserProfile(result.user);
      
      if (isNewUser || !profile.isComplete) {
        // Redirecionar para completar cadastro
        router.push('/auth/complete-registration');
      } else {
        // Usuário já cadastrado, redirecionar para dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Erro no login com Google:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return {
    user,
    loading,
    registrationComplete,
    handleGoogleLogin,
    logout
  };
}; 