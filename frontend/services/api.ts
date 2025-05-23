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

// Interceptor para autenticação com logs detalhados
api.interceptors.request.use(async (config) => {
  console.log(`[api.ts] Starting request to: ${config.url}`);
  
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    console.log(`[api.ts] User found (UID: ${user.uid}). Getting ID token for request to: ${config.url}`);
    try {
      // Força a atualização do token para garantir que está fresco
      const token = await getIdToken(user, true);
      console.log(`[api.ts] Successfully obtained token for request to: ${config.url}`);
      console.debug(`[api.ts] Token details:`, {
        length: token.length,
        first10: token.substring(0, 10) + '...'
      });
      
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[api.ts] Authorization header set for request to: ${config.url}`);
    } catch (error) {
      console.error(`[api.ts] Error getting ID token for request to: ${config.url}`, error);
      throw new Error(`Failed to get authentication token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    console.warn(`[api.ts] No authenticated user found. Request to ${config.url} will be unauthenticated.`);
  }

  console.log(`[api.ts] Final request config for ${config.url}:`, {
    method: config.method,
    headers: config.headers,
    data: config.data
  });
  
  return config;
}, (error) => {
  console.error('[api.ts] Request interceptor error:', error);
  return Promise.reject(error);
});

// Interceptor para tratamento de erros com logs detalhados
api.interceptors.response.use(
  (response) => {
    console.log(`[api.ts] Successful response from ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error(`[api.ts] Response error from ${error.config?.url || 'unknown endpoint'}:`, {
      code: error.code,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data
    });

    if (error.code === 'ECONNABORTED') {
      console.error('[api.ts] Request timeout occurred');
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }
    
    if (error.response?.status === 401) {
      console.warn('[api.ts] 401 Unauthorized - Redirecting to login');
      const currentPath = window.location.pathname;
      const redirectPath = currentPath === '/' ? '' : currentPath;
      window.location.href = `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;
    }
    
    if (error.response?.status === 404) {
      console.error('[api.ts] 404 Not Found - Resource not available');
      return Promise.reject(new Error('The requested resource was not found.'));
    }
    
    if (error.response?.status >= 500) {
      console.error('[api.ts] Server error occurred');
      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    // Para outros erros, rejeita com a mensagem original ou uma padrão
    const errorMessage = error.response?.data?.message || 
                       error.message || 
                       'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// API para Investimentos com logs
export const investimentoAPI = {
  getAll: async (): Promise<Investimento[]> => {
    console.log('[investimentoAPI] Fetching all investments');
    try {
      const response = await api.get("/api/investimentos");
      console.log('[investimentoAPI] Successfully fetched investments', {
        count: response.data?.length || 0
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('[investimentoAPI] Error fetching investments:', error);
      throw error;
    }
  },
  create: async (investimento: Omit<Investimento, '_id'>): Promise<Investimento> => {
    console.log('[investimentoAPI] Creating new investment:', investimento);
    try {
      const response = await api.post("/api/investimentos", investimento);
      console.log('[investimentoAPI] Investment created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('[investimentoAPI] Error creating investment:', error);
      throw error;
    }
  },
  update: async (id: string, investimento: Partial<Investimento>): Promise<Investimento> => {
    console.log(`[investimentoAPI] Updating investment ${id}:`, investimento);
    try {
      const response = await api.put(`/api/investimentos/${id}`, investimento);
      console.log(`[investimentoAPI] Investment ${id} updated successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[investimentoAPI] Error updating investment ${id}:`, error);
      throw error;
    }
  },
  delete: async (id: string): Promise<void> => {
    console.log(`[investimentoAPI] Deleting investment ${id}`);
    try {
      await api.delete(`/api/investimentos/${id}`);
      console.log(`[investimentoAPI] Investment ${id} deleted successfully`);
    } catch (error) {
      console.error(`[investimentoAPI] Error deleting investment ${id}:`, error);
      throw error;
    }
  }
};

// API para Transações com logs
export const transacaoAPI = {
  getAll: async (): Promise<Transacao[]> => {
    console.log('[transacaoAPI] Fetching all transactions');
    try {
      const response = await api.get("/api/transacoes");
      console.log('[transacaoAPI] Successfully fetched transactions', {
        count: response.data?.length || 0
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('[transacaoAPI] Error fetching transactions:', error);
      throw error;
    }
  },
  create: async (transacao: NovaTransacaoPayload): Promise<Transacao> => {
    console.log('[transacaoAPI] Creating new transaction:', transacao);
    try {
      const response = await api.post("/api/transacoes", transacao);
      console.log('[transacaoAPI] Transaction created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('[transacaoAPI] Error creating transaction:', error);
      throw error;
    }
  },
  update: async (id: string, transacao: AtualizarTransacaoPayload): Promise<Transacao> => {
    console.log(`[transacaoAPI] Updating transaction ${id}:`, transacao);
    try {
      const response = await api.put(`/api/transacoes/${id}`, transacao);
      console.log(`[transacaoAPI] Transaction ${id} updated successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[transacaoAPI] Error updating transaction ${id}:`, error);
      throw error;
    }
  },
  delete: async (id: string): Promise<void> => {
    console.log(`[transacaoAPI] Deleting transaction ${id}`);
    try {
      await api.delete(`/api/transacoes/${id}`);
      console.log(`[transacaoAPI] Transaction ${id} deleted successfully`);
    } catch (error) {
      console.error(`[transacaoAPI] Error deleting transaction ${id}:`, error);
      throw error;
    }
  },
};

// API para Metas com logs
export const metaAPI = {
  getAll: async (): Promise<Meta[]> => {
    console.log('[metaAPI] Fetching all goals');
    try {
      const response = await api.get("/api/goals");
      console.log('[metaAPI] Successfully fetched goals', {
        count: response.data?.length || 0
      });
      
      const metas = response.data?.metas || response.data || [];
      const normalizedMetas = metas.map((meta: any) => ({
        _id: meta._id,
        meta: meta.meta || meta.titulo,
        valor_total: meta.valor_total || meta.valorAlvo,
        valor_atual: meta.valor_atual || meta.valorAtual,
        data_conclusao: meta.data_conclusao || meta.dataLimite,
        concluida: (meta.valor_atual >= meta.valor_total) || meta.concluida,
        categoria: meta.categoria,
        prioridade: meta.prioridade,
        createdAt: meta.createdAt,
        descricao: meta.descricao
        
      }));
      
      console.log('[metaAPI] Normalized goals:', normalizedMetas);
      return normalizedMetas;
    } catch (error) {
      console.error('[metaAPI] Error fetching goals:', error);
      throw error;
    }
  },
  create: async (meta: Omit<Meta, '_id' | 'concluida' | 'createdAt'>): Promise<Meta> => {
    console.log('[metaAPI] Creating new goal:', meta);
    try {
      const response = await api.post("/api/goals", meta);
      console.log('[metaAPI] Goal created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('[metaAPI] Error creating goal:', error);
      throw error;
    }
  },
  update: async (id: string, meta: Partial<Omit<Meta, '_id' | 'concluida' | 'createdAt'>>): Promise<Meta> => {
    console.log(`[metaAPI] Updating goal ${id}:`, meta);
    try {
      const response = await api.put(`/api/goals/${id}`, meta);
      console.log(`[metaAPI] Goal ${id} updated successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[metaAPI] Error updating goal ${id}:`, error);
      throw error;
    }
  },
  delete: async (id: string): Promise<void> => {
    console.log(`[metaAPI] Deleting goal ${id}`);
    try {
      await api.delete(`/api/goals/${id}`);
      console.log(`[metaAPI] Goal ${id} deleted successfully`);
    } catch (error) {
      console.error(`[metaAPI] Error deleting goal ${id}:`, error);
      throw error;
    }
  }
};

export default api;