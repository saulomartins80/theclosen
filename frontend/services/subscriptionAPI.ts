import api from './api';

export const subscriptionAPI = {
  createCheckoutSession: async (priceId: string, options?: { successUrl?: string; cancelUrl?: string }) => {
    const response = await api.post('/subscriptions/create-checkout-session', {
      priceId,
      successUrl: options?.successUrl,
      cancelUrl: options?.cancelUrl
    });
    return response.data;
  },
  // ... existing code ...
}; 