import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
});

// Busca todas as metas
export const getMetas = async () => {
  try {
    const response = await api.get("/api/goals");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    throw error;
  }
};

// Cria uma nova meta
export const createMeta = async (meta: any) => {
  try {
    const response = await api.post("/api/goals", meta);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    throw error;
  }
};

// Atualiza uma meta existente
export const updateMeta = async (id: string, meta: any) => {
  try {
    const response = await api.put(`/api/goals/${id}`, meta);
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    throw error;
  }
};

// Exclui uma meta
export const deleteMeta = async (id: string) => {
  try {
    const response = await api.delete(`/api/goals/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir meta:", error);
    throw error;
  }
};

// Busca todas as transações
export const getTransacoes = async () => {
  try {
    const response = await api.get("/api/transacoes");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    throw error;
  }
};

// Cria uma nova transação
export const createTransacao = async (transacao: any) => {
  try {
    const response = await api.post("/api/transacoes", transacao);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    throw error;
  }
};

// Atualiza uma transação existente
export const updateTransacao = async (id: string, transacao: any) => {
  try {
    const response = await api.put(`/api/transacoes/${id}`, transacao);
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    throw error;
  }
};

// Exclui uma transação
export const deleteTransacao = async (id: string) => {
  try {
    const response = await api.delete(`/api/transacoes/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    throw error;
  }
};

// Busca todos os investimentos
export const getInvestimentos = async () => {
  try {
    const response = await api.get("/api/investimentos");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar investimentos:", error);
    throw error;
  }
};

// Adiciona um novo investimento
export const addInvestimento = async (investimento: any) => {
  try {
    const response = await api.post("/api/investimentos", investimento);
    return response.data;
  } catch (error) {
    console.error("Erro ao adicionar investimento:", error);
    throw error;
  }
};

// Atualiza um investimento existente
export const updateInvestimento = async (id: string, investimento: any) => {
  try {
    const response = await api.put(`/api/investimentos/${id}`, investimento);
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar investimento:", error);
    throw error;
  }
};

// Exclui um investimento
export const deleteInvestimento = async (id: string) => {
  try {
    await api.delete(`/api/investimentos/${id}`);
  } catch (error) {
    console.error("Erro ao excluir investimento:", error);
    throw error;
  }
};