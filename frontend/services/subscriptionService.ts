// services/subscriptionService.ts
import api from './api';

export const subscriptionService = {
  async get(userId: string) {
    const res = await api.get(`/api/subscription/${userId}`);
    return {
      id: res.data.id,
      plan: res.data.plan,
      status: res.data.status,
      expiresAt: new Date(res.data.expiresAt).toISOString(),
    };
  },

  async checkActive(userId: string) {
    const res = await api.get(`/api/subscription/${userId}/active`);
    return res.data.isActive;
  },

  async createTest(userId: string, plan: string) {
    const res = await api.post('/api/subscription/create-test', {
      userId,
      plan,
    });
    return res.data;
  },

  async update(userId: string, data: any) {
    const res = await api.put(`/api/subscription/${userId}`, data);
    return res.data;
  },
};