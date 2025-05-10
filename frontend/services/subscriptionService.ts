// services/subscriptionService.ts
import api from './api';

// Tipo local para o usuário, contendo apenas o necessário para este serviço
interface UserWithFirebaseUid {
  firebaseUid: string;
  // Adicione outros campos do usuário se forem necessários por outras funções neste serviço
}

export interface Subscription {
  id?: string;
  plan: string;
  status: string;
  expiresAt: string | Date;
  subscriptionId?: string; 
}

async function activateTestSubscription(userId: string, planId: string): Promise<Subscription> {
  if (!userId) {
    throw new Error('User ID is required to activate a test subscription.');
  }
  const response = await api.post<Subscription>(`/api/subscriptions/${userId}/test`, { plan: planId });
  return response.data;
}

export const subscriptionService = {
  async get(userId: string): Promise<Subscription | null> {
    try {
      const res = await api.get<{ data: Subscription }>(`/api/subscriptions/${userId}`);
      const subscriptionData = res.data.data || res.data; 
      return {
        ...subscriptionData,
        expiresAt: new Date(subscriptionData.expiresAt).toISOString(),
      };
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error("Error fetching subscription:", error);
      throw error;
    }
  },

  async checkActive(userId: string): Promise<boolean> {
    try {
      const res = await api.get<{ isActive: boolean }>(`/api/subscriptions/${userId}/active`);
      return res.data.isActive;
    } catch (error) {
      console.error("Error checking active subscription:", error);
      return false;
    }
  },

  activateTestPlan: activateTestSubscription,

  async update(userId: string, data: Partial<Subscription>): Promise<Subscription> {
    const res = await api.put<Subscription>(`/api/subscriptions/${userId}`, data);
    return res.data;
  },
  
  async getCurrentUserSubscription(user: UserWithFirebaseUid | null): Promise<Subscription | null> {
    if (!user || !user.firebaseUid) return null;
    return this.get(user.firebaseUid);
  }
};