// src/types/Subscription.ts
export type SubscriptionPlan = 'free' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'expired' | 'pending';

export interface Subscription {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status?: string;
  plan?: string;
  cancelAtPeriodEnd?: boolean;
  expiresAt?: Date;
  currentPeriodEnd?: Date;
  trialEndsAt?: Date;
  subscriptionId?: string;
}