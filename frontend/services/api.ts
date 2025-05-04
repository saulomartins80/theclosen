// services/api.ts
import axios from 'axios';
import { getAuth, getIdToken } from 'firebase/auth';
import {
  Transacao,
  NovaTransacaoPayload,
  AtualizarTransacaoPayload,
  Investimento,
  Meta
} from "../types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para autenticação
api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    try {
      const token = await getIdToken(user);
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Error getting token:', error);
    }
  }

  return config}, (error) => Promise.reject(error));

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout'));
    }
    if (error.response?.status === 401) {
      window.location.href = '/auth/login?redirect=' + 
        encodeURIComponent(window.location.pathname);
    }
    return Promise.reject(error);
  }
);

// API para Investimentos
export const investimentoAPI = {
  getAll: async (): Promise<Investimento[]> => {
    const response = await api.get("/api/investimentos");
    return Array.isArray(response.data) ? response.data : [];
  },
  create: async (investimento: Omit<Investimento, '_id'>): Promise<Investimento> => {
    const response = await api.post("/api/investimentos", investimento);
    return response.data;
  },
  update: async (id: string, investimento: Partial<Investimento>): Promise<Investimento> => {
    const response = await api.put(`/api/investimentos/${id}`, investimento);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/investimentos/${id}`);
  }
};

// API para Transações
export const transacaoAPI = {
  getAll: async (): Promise<Transacao[]> => {
    const response = await api.get("/api/transacoes");
    return Array.isArray(response.data) ? response.data : [];
  },
  create: async (transacao: NovaTransacaoPayload): Promise<Transacao> => {
    const response = await api.post("/api/transacoes", transacao);
    return response.data;
  },
  update: async (id: string, transacao: AtualizarTransacaoPayload): Promise<Transacao> => {
    const response = await api.put(`/api/transacoes/${id}`, transacao);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/transacoes/${id}`);
  },
};

// API para Metas
export const metaAPI = {
  getAll: async (): Promise<Meta[]> => {
    const response = await api.get("/api/goals");
    const metas = response.data?.metas || response.data || [];
    return metas.map((meta: any) => ({
      _id: meta._id,
      titulo: meta.meta || meta.titulo,
      valorAlvo: meta.valor_total || meta.valorAlvo,
      valorAtual: meta.valor_atual || meta.valorAtual,
      dataLimite: meta.data_conclusao || meta.dataLimite,
      concluida: (meta.valor_atual >= meta.valor_total) || meta.concluida,
      categoria: meta.categoria,
      prioridade: meta.prioridade,
      createdAt: meta.createdAt
    }));
  },
  create: async (meta: Omit<Meta, '_id'>): Promise<Meta> => {
    const response = await api.post("/api/goals", {
      meta: meta.titulo,
      valor_total: meta.valorAlvo,
      valor_atual: meta.valorAtual || 0,
      data_conclusao: meta.dataLimite,
      categoria: meta.categoria,
      prioridade: meta.prioridade
    });
    return {
      _id: response.data._id,
      ...meta,
      concluida: response.data.valor_atual >= response.data.valor_total,
      createdAt: response.data.createdAt
    };
  },
  update: async (id: string, meta: Partial<Meta>): Promise<Meta> => {
    const response = await api.put(`/api/goals/${id}`, {
      meta: meta.titulo,
      valor_total: meta.valorAlvo,
      valor_atual: meta.valorAtual,
      data_conclusao: meta.dataLimite,
      categoria: meta.categoria,
      prioridade: meta.prioridade
    });
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/goals/${id}`);
  }
};

export default api;