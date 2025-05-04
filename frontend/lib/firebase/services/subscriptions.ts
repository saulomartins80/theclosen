// lib/firebase/services/subscriptions.ts
import { auth } from '../client';
import type { Subscription } from '../../../types/Subscription';

export const SubscriptionService = {
  async get(userId: string): Promise<Subscription> {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`/api/subscriptions/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch subscription');
    }

    const data = await response.json();
    
    return {
      id: data.id,
      plan: data.plan,
      status: data.status,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      updatedAt: data.updatedAt || undefined
    };
  },

  async checkStatus(userId: string): Promise<boolean> {
    const subscription = await this.get(userId);
    return subscription.status === 'active' && 
           new Date(subscription.expiresAt) > new Date();
  }
};
