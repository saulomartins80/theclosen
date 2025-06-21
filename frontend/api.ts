import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const chatbotAPI = {
  sendQuery: async (query: string) => {
    const response = await api.post('/chatbot/query', { query });
    return response.data;
  },
};

export const subscriptionAPI = {
  getPlans: async () => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },
  createCheckoutSession: async (priceId: string) => {
    const response = await api.post('/subscriptions/create-checkout-session', { priceId });
    return response.data;
  },
  getStatus: async () => {
    const response = await api.get('/subscriptions/status');
    return response.data;
  },
};

export const financeAPI = {
  getTransactions: async () => {
    const response = await api.get('/api/transacoes');
    return response.data;
  },
  getInvestments: async () => {
    const response = await api.get('/api/investimentos');
    return response.data;
  },
  getGoals: async () => {
    const response = await api.get('/api/goals');
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/api/transacoes/all');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/api/transacoes', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/api/transacoes/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/transacoes/${id}`);
    return response.data;
  },
};

export const dashboardAPI = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/dashboard/analytics');
    return response.data;
  },
  getMarketData: async (requestBody: any) => {
    const response = await api.post('/dashboard/market-data', requestBody);
    return response.data;
  },
};

export default api; 