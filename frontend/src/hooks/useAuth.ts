// hooks/useAuth.ts
import { useEffect } from 'react';
import { auth } from '../../lib/firebase/client';

export const useAuth = () => {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
      }
    });

    return () => unsubscribe();
  }, []);
};