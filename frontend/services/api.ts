import axios from 'axios';
import { getAuth, getIdToken } from 'firebase/auth';
import {
  Transacao,
  NovaTransacaoPayload,
  AtualizarTransacaoPayload,
  Investimento,
  Meta
} from "../types";

export interface MarketDataRequest {
  symbols: string[];
  cryptos: string[];
  commodities: string[];
  fiis: string[];
  etfs: string[];
  currencies: string[];
  manualAssets: { symbol: string; price: number; change: number; }[];
  customIndicesList: string[];
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 60000, // Aumentando para 60 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para autenticação com logs detalhados
api.interceptors.request.use(async (config) => {
  console.log(`[api.ts] 🚀 Iniciando requisição para: ${config.method?.toUpperCase()} ${config.url}`);
  
  const auth = getAuth();
  const user = auth.currentUser;

  console.log(`[api.ts] 👤 Estado do usuário:`, {
    userExists: !!user,
    uid: user?.uid,
    email: user?.email,
    emailVerified: user?.emailVerified
  });

  if (user) {
    console.log(`[api.ts] 🔑 Usuário encontrado (UID: ${user.uid}). Obtendo ID token para: ${config.url}`);
    try {
      const token = await getIdToken(user, true);
      console.log(`[api.ts] ✅ Token obtido com sucesso para: ${config.url}`);
      console.log(`[api.ts] 🔑 Token (primeiros 20 chars): ${token.substring(0, 20)}...`);
      console.log(`[api.ts] 📏 Tamanho do token: ${token.length}`);
      
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[api.ts] ✅ Header Authorization configurado para: ${config.url}`);
    } catch (error) {
      console.error(`[api.ts] ❌ Erro ao obter ID token para: ${config.url}`, error);
      throw new Error(`Failed to get authentication token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    console.warn(`[api.ts] ⚠️ Nenhum usuário autenticado encontrado. Requisição para ${config.url} será não autenticada.`);
    console.warn(`[api.ts] 📋 Headers da requisição:`, config.headers);
  }

  return config;
}, (error) => {
  console.error('[api.ts] ❌ Erro no interceptor de requisição:', error);
  return Promise.reject(error);
});

// Interceptor para tratamento de erros com logs detalhados
api.interceptors.response.use(
  (response) => {
    console.log(`[api.ts] ✅ Resposta bem-sucedida de ${response.config.url}`, {
      status: response.status,
      method: response.config.method,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error(`[api.ts] ❌ Erro de resposta de ${error.config?.url || 'endpoint desconhecido'}:`, {
      code: error.code,
      status: error.response?.status,
      message: error.message,
      method: error.config?.method,
      responseData: error.response?.data,
      headers: error.config?.headers
    });

    if (error.code === 'ECONNABORTED') {
      console.error('[api.ts] ⏰ Timeout da requisição');
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }
    
    if (error.response?.status === 401) {
      console.warn('[api.ts] 🔒 401 Unauthorized - Redirecionando para login');
      console.warn('[api.ts] 📋 Detalhes do erro 401:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        responseData: error.response?.data
      });
      const currentPath = window.location.pathname;
      const redirectPath = currentPath === '/' ? '' : currentPath;
      window.location.href = `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;
    }
    
    if (error.response?.status === 404) {
      console.error('[api.ts] 🔍 404 Not Found - Recurso não disponível');
      return Promise.reject(new Error('The requested resource was not found.'));
    }
    
    if (error.response?.status >= 500) {
      console.error('[api.ts] 💥 Erro do servidor');
      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    const errorMessage = error.response?.data?.message || 
                       error.message || 
                       'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// --- MARKET DATA API ---
export const marketDataAPI = {
  getMarketData: async (requestBody: MarketDataRequest) => {
    try {
      console.log('[marketDataAPI] Buscando dados do mercado:', requestBody);
      const response = await api.post('/api/market-data', requestBody, {
        timeout: 30000 // Aumentando timeout para 30 segundos
      });
      console.log('[marketDataAPI] Dados do mercado obtidos com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[marketDataAPI] Erro ao buscar dados do mercado:', error);
      throw error;
    }
  }
};

// --- CHATBOT API ---
export const chatbotAPI = {
  sendQuery: async (data: { message: string; chatId: string; context?: any }) => {
    try {
      console.log('[chatbotAPI] Enviando consulta:', data);
      
      // ✅ CORREÇÃO: Usar endpoint correto que salva nas sessões
      const response = await api.post('/api/chatbot/query', {
        message: data.message,
        chatId: data.chatId
      });

      console.log('[chatbotAPI] Resposta recebida com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[chatbotAPI] Erro ao enviar consulta:', error);
      throw error;
    }
  },
  executeAction: async (actionData: { action: string; payload: any; chatId?: string }) => {
    console.log('[chatbotAPI] Executando ação:', actionData);
    try {
      const response = await api.post('/api/automated-actions/execute', actionData);
      console.log('[chatbotAPI] Ação executada com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[chatbotAPI] Erro ao executar ação:', error);
      throw error;
    }
  },
  getSessions: async () => {
    console.log('[chatbotAPI] Buscando sessões');
    try {
      const response = await api.get('/api/chatbot/sessions', {
        timeout: 90000 // 90 segundos para sessões
      });
      console.log('[chatbotAPI] Sessões obtidas com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[chatbotAPI] Erro ao buscar sessões:', error);
      throw error;
    }
  },
  startNewSession: async () => {
    console.log('[chatbotAPI] Iniciando nova sessão');
    try {
      const response = await api.post('/api/chatbot/sessions');
      console.log('[chatbotAPI] Nova sessão iniciada com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[chatbotAPI] Erro ao iniciar nova sessão:', error);
      throw error;
    }
  },
  getSession: async (chatId: string) => {
    console.log('[chatbotAPI] Buscando sessão:', chatId);
    try {
      const response = await api.get(`/api/chatbot/sessions/${chatId}`);
      console.log('[chatbotAPI] Sessão obtida com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[chatbotAPI] Erro ao buscar sessão:', error);
      throw error;
    }
  },
  saveUserFeedback: async (feedback: {
    messageId: string;
    rating: number;
    helpful: boolean;
    comment?: string;
    category: 'accuracy' | 'helpfulness' | 'clarity' | 'relevance';
    context?: string;
  }) => {
    console.log('[chatbotAPI] Enviando feedback:', feedback);
    try {
      const response = await api.post('/api/chatbot/feedback', feedback);
      console.log('[chatbotAPI] Feedback enviado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[chatbotAPI] Erro ao enviar feedback:', error);
      throw error;
    }
  }
};

// --- SUBSCRIPTION API ---
export const subscriptionAPI = {
  getPlans: async () => {
    const response = await api.get('/api/subscriptions/plans');
    return response.data;
  },
  createCheckoutSession: async (priceId: string, planName: string) => {
    try {
      console.log('[subscriptionAPI] Criando sessão de checkout:', { priceId, planName });
      const response = await api.post('/api/subscriptions/create-checkout-session', {
        priceId,
        planName
      });
      console.log('[subscriptionAPI] Sessão criada com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[subscriptionAPI] Erro ao criar sessão de checkout:', error);
      throw error;
    }
  },
  verifySession: async (sessionId: string) => {
    try {
      const response = await api.post('/api/subscriptions/verify-session', { sessionId });
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      throw error;
    }
  },
  cancelSubscription: async (subscriptionId: string) => {
    try {
      const response = await api.post('/api/subscriptions/cancel', {
        subscriptionId,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      throw error;
    }
  },
  getSubscriptionStatus: async () => {
    try {
      const response = await api.get('/api/subscriptions/status');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter status da assinatura:', error);
      throw error;
    }
  },
};

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

// API para Dashboard com logs
export const dashboardAPI = {
  getMarketData: async (payload: any): Promise<any> => {
    console.log('[dashboardAPI] Buscando dados do mercado:', payload);
    try {
      const response = await api.post('/api/market-data', payload);
      console.log('[dashboardAPI] Dados do mercado obtidos com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[dashboardAPI] Erro ao buscar dados do mercado:', error);
      throw error;
    }
  }
};

// API para Sistema de Milhas
export const mileageAPI = {
  // Pluggy Integration
  getConnectToken: async () => {
    console.log('[mileageAPI] Obtendo token de conexão Pluggy');
    try {
      const response = await api.get('/api/pluggy/connect-token');
      console.log('[mileageAPI] Token de conexão obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao obter token de conexão:', error);
      throw error;
    }
  },

  getMileageSummary: async () => {
    console.log('[mileageAPI] Obtendo resumo de milhas');
    try {
      const response = await api.get('/api/pluggy/mileage-summary');
      console.log('[mileageAPI] Resumo de milhas obtido com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao obter resumo de milhas:', error);
      throw error;
    }
  },

  // Mileage Programs
  getMileagePrograms: async () => {
    console.log('[mileageAPI] Buscando programas de milhas');
    try {
      const response = await api.get('/api/mileage/programs');
      console.log('[mileageAPI] Programas de milhas obtidos com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao buscar programas de milhas:', error);
      throw error;
    }
  },

  updateMileageProgram: async (programId: string, data: any) => {
    console.log('[mileageAPI] Atualizando programa de milhas:', programId, data);
    try {
      const response = await api.put(`/api/mileage/programs/${programId}`, data);
      console.log('[mileageAPI] Programa de milhas atualizado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao atualizar programa de milhas:', error);
      throw error;
    }
  },

  // Mileage Cards
  getMileageCards: async () => {
    console.log('[mileageAPI] Buscando cartões de milhas');
    try {
      const response = await api.get('/api/mileage/cards');
      console.log('[mileageAPI] Cartões de milhas obtidos com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao buscar cartões de milhas:', error);
      throw error;
    }
  },

  addMileageCard: async (cardData: any) => {
    console.log('[mileageAPI] Adicionando cartão de milhas:', cardData);
    try {
      const response = await api.post('/api/mileage/cards', cardData);
      console.log('[mileageAPI] Cartão de milhas adicionado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao adicionar cartão de milhas:', error);
      throw error;
    }
  },

  updateMileageCard: async (cardId: string, cardData: any) => {
    console.log('[mileageAPI] Atualizando cartão de milhas:', cardId, cardData);
    try {
      const response = await api.put(`/api/mileage/cards/${cardId}`, cardData);
      console.log('[mileageAPI] Cartão de milhas atualizado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao atualizar cartão de milhas:', error);
      throw error;
    }
  },

  deleteMileageCard: async (cardId: string) => {
    console.log('[mileageAPI] Removendo cartão de milhas:', cardId);
    try {
      await api.delete(`/api/mileage/cards/${cardId}`);
      console.log('[mileageAPI] Cartão de milhas removido com sucesso');
    } catch (error) {
      console.error('[mileageAPI] Erro ao remover cartão de milhas:', error);
      throw error;
    }
  },

  // Mileage Transactions
  getMileageTransactions: async (filters?: any) => {
    console.log('[mileageAPI] Buscando transações de milhas:', filters);
    try {
      const response = await api.get('/api/mileage/transactions', { params: filters });
      console.log('[mileageAPI] Transações de milhas obtidas com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao buscar transações de milhas:', error);
      throw error;
    }
  },

  addMileageTransaction: async (transactionData: any) => {
    console.log('[mileageAPI] Adicionando transação de milhas:', transactionData);
    try {
      const response = await api.post('/api/mileage/transactions', transactionData);
      console.log('[mileageAPI] Transação de milhas adicionada com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao adicionar transação de milhas:', error);
      throw error;
    }
  },

  // Mileage Analytics
  getMileageAnalytics: async (period: string = 'month') => {
    console.log('[mileageAPI] Buscando análises de milhas:', period);
    try {
      const response = await api.get(`/api/mileage/analytics?period=${period}`, {
        timeout: 90000 // 90 segundos para análises
      });
      console.log('[mileageAPI] Análises de milhas obtidas com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao buscar análises de milhas:', error);
      throw error;
    }
  },

  // Mileage Recommendations
  getCardRecommendations: async (monthlySpending: number, preferredPrograms?: string[]) => {
    console.log('[mileageAPI] Buscando recomendações de cartões:', { monthlySpending, preferredPrograms });
    try {
      const response = await api.post('/api/mileage/recommendations', {
        monthlySpending,
        preferredPrograms
      });
      console.log('[mileageAPI] Recomendações obtidas com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao buscar recomendações:', error);
      throw error;
    }
  },

  // Mileage Calculator
  calculateMiles: async (params: any) => {
    console.log('[mileageAPI] Calculando milhas:', params);
    try {
      const response = await api.post('/api/mileage/calculate', params);
      console.log('[mileageAPI] Cálculo de milhas realizado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao calcular milhas:', error);
      throw error;
    }
  },

  // Pluggy Connections
  getPluggyConnections: async () => {
    console.log('[mileageAPI] Buscando conexões Pluggy');
    try {
      const response = await api.get('/api/pluggy/connections', {
        timeout: 90000 // 90 segundos para conexões Pluggy
      });
      console.log('[mileageAPI] Conexões Pluggy obtidas com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('[mileageAPI] Erro ao buscar conexões Pluggy:', error);
      throw error;
    }
  },

  disconnectPluggyConnection: async (connectionId: string) => {
    console.log('[mileageAPI] Desconectando conexão Pluggy:', connectionId);
    try {
      await api.delete(`/api/pluggy/connections/${connectionId}`);
      console.log('[mileageAPI] Conexão Pluggy desconectada com sucesso');
    } catch (error) {
      console.error('[mileageAPI] Erro ao desconectar Pluggy:', error);
      throw error;
    }
  }
};

export default api;