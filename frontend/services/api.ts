import axios from "axios";
import { Transacao, Meta, Investimento } from "../types"; // Importe os tipos corretos

// Define a URL base da API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Cria uma instância do Axios com a URL base
export const api = axios.create({
  baseURL: API_URL,
});

// Configuração global para incluir token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Função para buscar todas as metas
export const getMetas = async (): Promise<Meta[]> => {
  try {
    const response = await api.get("/api/goals");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    throw error;
  }
};

// Função para criar uma nova meta
export const createMeta = async (meta: Omit<Meta, "_id">): Promise<Meta> => {
  try {
    const response = await api.post("/api/goals", meta);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    throw error;
  }
};

// Função para atualizar uma meta existente
export const updateMeta = async (id: string, meta: Partial<Meta>): Promise<Meta> => {
  try {
    const response = await api.put(`/api/goals/${id}`, meta);
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    throw error;
  }
};

// Função para excluir uma meta
export const deleteMeta = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/goals/${id}`);
  } catch (error) {
    console.error("Erro ao excluir meta:", error);
    throw error;
  }
};

// Função para buscar todas as transações
export const getTransacoes = async (): Promise<Transacao[]> => {
  try {
    const response = await api.get("/api/transacoes");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    throw error;
  }
};

// Função para criar uma nova transação
export const createTransacao = async (transacao: Omit<Transacao, "_id">): Promise<Transacao> => {
  try {
    // Formata a transação para o formato esperado pela API
    const transacaoFormatada = {
      ...transacao,
      data: new Date(transacao.data.$date).toISOString(), // Converte a data para ISO
    };
    const response = await api.post("/api/transacoes", transacaoFormatada);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    throw error;
  }
};

// Função para atualizar uma transação existente
export const updateTransacao = async (id: string, transacao: Partial<Transacao>): Promise<Transacao> => {
  try {
    // Formata a transação para o formato esperado pela API
    const transacaoFormatada = {
      ...transacao,
      data: transacao.data ? new Date(transacao.data.$date).toISOString() : undefined, // Converte a data para ISO
    };
    const response = await api.put(`/api/transacoes/${id}`, transacaoFormatada);
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    throw error;
  }
};

// Função para excluir uma transação - Versão corrigida
// Função para excluir transação
export const deleteTransacao = async (id: string): Promise<void> => {
  try {
    if (!id) {
      throw new Error("ID inválido fornecido para exclusão");
    }
    
    await api.delete(`/api/transacoes/${id}`);
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    throw error;
  }
};

// Função para buscar todos os investimentos
export const getInvestimentos = async (): Promise<Investimento[]> => {
  try {
    const response = await api.get("/api/investimentos");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar investimentos:", error);
    throw new Error("Não foi possível buscar os investimentos.");
  }
};

// Função para adicionar um novo investimento
export const addInvestimento = async (investimento: Omit<Investimento, '_id'>): Promise<Investimento> => {
  try {
    console.log('Enviando dados para o backend:', investimento); // Log para debug

    const response = await api.post('/api/investimentos', investimento, {
      headers: {
        'Content-Type': 'application/json', // Garante que o conteúdo seja enviado como JSON
      },
    });

    console.log('Resposta do backend:', response.data); // Log para debug
    return response.data;
  } catch (error: any) {
    console.error('Erro detalhado na requisição:', {
      mensagem: error.response?.data?.message || error.message,
      status: error.response?.status,
      dados: error.response?.data,
      config: error.config,
    });

    throw new Error('Não foi possível adicionar o investimento. Verifique os dados e tente novamente.');
  }
};

// Função para atualizar um investimento existente
export const updateInvestimento = async (id: string, investimento: Partial<Investimento>): Promise<Investimento> => {
  try {
    const response = await api.put(`/api/investimentos/${id}`, {
      ...investimento,
      data: investimento.data ? new Date(investimento.data).toISOString() : undefined, // Formata a data para ISO
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar investimento:", error);
    throw new Error("Não foi possível atualizar o investimento.");
  }
};

// Função para excluir um investimento
export const deleteInvestimento = async (id: string): Promise<void> => {
  try {
    if (!id) {
      throw new Error("ID inválido fornecido para exclusão.");
    }
    await api.delete(`/api/investimentos/${id}`);
  } catch (error) {
    console.error("Erro ao excluir investimento:", error);
    throw new Error("Não foi possível excluir o investimento.");
  }
};