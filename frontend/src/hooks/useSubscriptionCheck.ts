// src/hooks/useAuthSubscriptionCheck.ts
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface SubscriptionCheckReturn {
  quickCheck: (userId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const useSubscriptionCheck = (): SubscriptionCheckReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const quickCheck = async (userId: string): Promise<boolean> => {
    if (!userId) return false;

    setLoading(true);
    setError(null);

    try {
      // Verifica se user é do tipo FirebaseUser
      if (!user || typeof user.getIdToken !== 'function') {
        throw new Error('User authentication required');
      }

      const token = await user.getIdToken();
      const response = await fetch(
        `/api/subscription/quick-check/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check subscription');
      }

      const { data } = await response.json();
      return data?.hasSubscription || false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { quickCheck, loading, error };
};