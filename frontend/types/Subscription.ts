// types/subscription.ts
export type SubscriptionPlan = 'free' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'expired' | 'pending';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: string;
  currentPeriodEnd?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}