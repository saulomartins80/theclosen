import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
});

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