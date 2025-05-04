// services/api/subscriptionAPI.ts
import { ApiResponse } from "../../types/ApiResponse";
import { Subscription } from "../../types/Subscription";

import api from '../api';

export const subscriptionAPI = {
  get: async (userId: string): Promise<Subscription> => {
    const response = await api.get(`/api/subscriptions/${userId}`);

    // Retorna os dados no formato esperado
    return {
      id: response.data.id,
      plan: response.data.plan,
      status: response.data.status,
      expiresAt: response.data.expiresAt,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
    };
  },

  quickCheck: async (userId: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<{ hasSubscription: boolean }>>(
      `/api/subscriptions/quick-check/${userId}`
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
};