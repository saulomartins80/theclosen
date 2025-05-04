// src/hooks/useSubscription.ts
import { useEffect, useState } from 'react';
import { Subscription } from '../../types/Subscription';
import { fetchSubscription } from '../../lib/firebase/subscriptions';

export const useSubscription = (userId: string | undefined) => {
  const [state, setState] = useState<{
    subscription: Subscription | null;
    loading: boolean;
    error: string | null;
  }>({
    subscription: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!userId) return;

    const loadSubscription = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const subscription = await fetchSubscription(userId);

        // Narrow the type of `plan` to the expected union type
        if (subscription && typeof subscription.plan === 'string' && ["free", "premium", "enterprise"].includes(subscription.plan)) {
          const narrowedSubscription = {
            ...subscription,
            plan: subscription.plan as "free" | "premium" | "enterprise",
            createdAt: subscription.createdAt ?? '', // Ensure createdAt is always a string
          };

          setState({
            subscription: narrowedSubscription,
            loading: false,
            error: null,
          });
        } else {
          throw new Error(`Invalid subscription plan: ${subscription?.plan}`);
        }
      } catch (error) {
        setState({
          subscription: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load subscription',
        });
      }
    };

    loadSubscription();
  }, [userId]);

  return state;
};