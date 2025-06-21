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

    const response = await fetch(`/api/subscriptions/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch subscription');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Subscription fetch error:', error);
    throw error;
  }
}

export async function checkActiveSubscription(userId: string): Promise<boolean> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('User not authenticated');

    const response = await fetch(`/api/subscriptions/${userId}/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check subscription status');
    }

    const { data } = await response.json();
    return data?.isActive || false;
  } catch (error) {
    console.error('Active subscription check error:', error);
    return false;
  }
}

export async function createCheckoutSession(priceId: string): Promise<{ sessionId: string; url: string }> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('User not authenticated');

    const response = await fetch('/api/subscriptions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Checkout session creation error:', error);
    throw error;
  }
}

export async function createCustomerPortalSession(): Promise<{ redirectUrl: string }> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('User not authenticated');

    const response = await fetch('/api/subscriptions/create-portal-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create customer portal session');
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Customer portal session creation error:', error);
    throw error;
  }
}