// services/api/subscriptionAPI.ts
import { ApiResponse } from "../../types/ApiResponse";
import { Subscription } from "../../types/Subscription";

import api from '../api';

export const subscriptionAPI = {
  get: async (userId: string): Promise<Subscription> => {
    const response = await api.get(`/api/subscriptions/${userId}`);
    return response.data.data;
  },

  quickCheck: async (userId: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<{ hasSubscription: boolean }>>(
      `/api/subscriptions/${userId}/quick-check`
    );
    return response.data.data?.hasSubscription || false;
  },

  createTest: async (userId: string, plan: string): Promise<Subscription> => {
    const response = await api.post<ApiResponse<Subscription>>(
      `/api/subscriptions/${userId}/test`,
      { plan }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to create test subscription");
    }

    return response.data.data;
  },

  createCheckoutSession: async (priceId: string): Promise<{ sessionId: string; url: string }> => {
    const response = await api.post<ApiResponse<{ sessionId: string; url: string }>>(
      '/api/subscriptions/create-checkout-session',
      { priceId }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to create checkout session");
    }

    return response.data.data;
  },

  createCustomerPortalSession: async (): Promise<{ redirectUrl: string }> => {
    const response = await api.post<ApiResponse<{ redirectUrl: string }>>(
      '/api/subscriptions/create-portal-session'
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to create customer portal session");
    }

    return response.data.data;
  }
};