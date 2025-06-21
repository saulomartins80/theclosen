import { loadStripe, Stripe } from '@stripe/stripe-js';
import { subscriptionAPI } from '../services/api';

let stripePromise: Promise<Stripe | null>;

const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUB_KEY;
    if (!publishableKey) {
      console.error("Stripe publishable key is not set.");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export default getStripe;

export const createCheckoutSession = async (priceId: string, planName: string) => {
  try {
    const response = await subscriptionAPI.createCheckoutSession(priceId, planName);
    return response;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw error;
  }
};

export const handleCheckoutSuccess = async (sessionId: string) => {
  try {
    const response = await subscriptionAPI.verifySession(sessionId);
    return response;
  } catch (error) {
    console.error('Erro ao verificar sessão de checkout:', error);
    throw error;
  }
}; 