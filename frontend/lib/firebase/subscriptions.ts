// lib/firebase/subscription.ts
import { auth } from './client';

interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'canceled' | 'expired';
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchSubscription(userId: string): Promise<Subscription> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('User not authenticated');

    const response = await fetch(`/api/subscription/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Subscription fetch error:', error);
    throw error;
  }
}

export async function checkActiveSubscription(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/subscription/${userId}/active`);
    const { data } = await response.json();
    return data?.isActive || false;
  } catch (error) {
    console.error('Active subscription check error:', error);
    return false;
  }
}