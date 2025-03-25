import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getTransacoes,
  createTransacao,
  updateTransacao,
  deleteTransacao,
  getInvestimentos,
  addInvestimento as apiAddInvestimento,
  updateInvestimento,
  deleteInvestimento as apiDeleteInvestimento,
  getMetas,
  createMeta as apiCreateMeta,
  updateMeta as apiUpdateMeta,
  deleteMeta as apiDeleteMeta,
} from "../services/api";
import { Meta, Transacao, Investimento } from "../types"; // Certifique-se de que essas interfaces estão definidas em "../types"

interface FinanceContextProps {
  transactions: Transacao[];
  investimentos: Investimento[];
  metas: Meta[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => void;
  addTransaction: (novaTransacao: Omit<Transacao, "_id">) => void;
  editTransaction: (id: string, updatedTransaction: Partial<Transacao>) => void;
  deleteTransaction: (id: string) => void;
  fetchInvestimentos: () => void;
  addInvestimento: (novoInvestimento: Omit<Investimento, "_id">) => void;
  editInvestimento: (id: string, updatedInvestimento: Partial<Investimento>) => void;
  deleteInvestimento: (id: string) => void;
  fetchMetas: () => void;
  addMeta: (novaMeta: Omit<Meta, "_id" | "createdAt">) => void;
  editMeta: (id: string, updatedMeta: Partial<Meta>) => void;
  deleteMeta: (id: string) => void;
  fetchData: () => void;
  getMetas: () => Promise<Meta[]>;
}

const FinanceContext = createContext<FinanceContextProps>({
  transactions: [],
  investimentos: [],
  metas: [],
  loading: true,
  error: null,
  fetchTransactions: () => {},
  addTransaction: () => {},
  editTransaction: () => {},
  deleteTransaction: () => {},
  fetchInvestimentos: () => {},
  addInvestimento: () => {},
  editInvestimento: () => {},
  deleteInvestimento: () => {},
  fetchMetas: () => {},
  addMeta: () => {},
  editMeta: () => {},
  deleteMeta: () => {},
  fetchData: () => {},
  getMetas: () => Promise.resolve([]),
});

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transacao[]>([]);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar transações
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransacoes();
      setTransactions(data);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar transação
  const addTransaction = async (newTransaction: Omit<Transacao, "_id">) => {
    try {
      const data = await createTransacao(newTransaction);
      setTransactions((prev) => [...prev, { ...newTransaction, _id: data._id }]); // Adiciona _id ao novo objeto
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  // Função para editar transação
  const editTransaction = async (id: string, updatedTransaction: Partial<Transacao>) => {
    try {
      const data = await updateTransacao(id, updatedTransaction);
      setTransactions((prev) =>
        prev.map((t) => (t._id.$oid === id ? { ...t, ...data } : t)) // Use t._id.$oid
      );
    } catch (error) {
      console.error("Erro ao editar transação:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  // Função para excluir transação
  const deleteTransaction = async (id: string) => {
    try {
      await deleteTransacao(id);
      setTransactions((prev) => prev.filter((t) => t._id.$oid !== id)); // Use t._id.$oid
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  // Função para buscar investimentos
  const fetchInvestimentos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInvestimentos();
      setInvestimentos(data);
    } catch (error) {
      console.error("Erro ao buscar investimentos:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };
  
  const addInvestimento = async (novoInvestimento: Omit<Investimento, "id">) => {
    try {
      const data = await apiAddInvestimento(novoInvestimento);
      setInvestimentos((prev) => [...prev, { ...novoInvestimento, id: data.id }]); // Usa id
    } catch (error) {
      console.error("Erro ao adicionar investimento:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };
  
  const editInvestimento = async (id: string, updatedInvestimento: Partial<Investimento>) => {
    try {
      const data = await updateInvestimento(id, updatedInvestimento);
      setInvestimentos((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)) // Use inv.id
      );
    } catch (error) {
      console.error("Erro ao editar investimento:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };
  
  const deleteInvestimento = async (id: string) => {
    try {
      await apiDeleteInvestimento(id);
      setInvestimentos((prev) => prev.filter((inv) => inv.id !== id)); // Use inv.id
    } catch (error) {
      console.error("Erro ao excluir investimento:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  // Função para buscar metas
  const fetchMetas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMetas();
      setMetas(data);
    } catch (error) {
      console.error("Erro ao buscar metas:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar meta
  const addMeta = async (novaMeta: Omit<Meta, "_id" | "createdAt">) => {
    try {
      const data = await apiCreateMeta(novaMeta);
      setMetas((prev) => [...prev, { ...novaMeta, _id: data._id, createdAt: data.createdAt }]); // Adiciona _id e createdAt ao novo objeto
    } catch (error) {
      console.error("Erro ao adicionar meta:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  // Função para editar meta
  const editMeta = async (id: string, updatedMeta: Partial<Meta>) => {
    try {
      const data = await apiUpdateMeta(id, updatedMeta);
      setMetas((prev) =>
        prev.map((m) => (m._id === id ? { ...m, ...data } : m)) // Use m._id
      );
    } catch (error) {
      console.error("Erro ao editar meta:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  // Função para excluir meta
  const deleteMeta = async (id: string) => {
    try {
      await apiDeleteMeta(id);
      setMetas((prev) => prev.filter((m) => m._id !== id)); // Use m._id
    } catch (error) {
      console.error("Erro ao excluir meta:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  // Função para buscar todos os dados
  const fetchData = async () => {
    try {
      setLoading(true);
      const transacoes = await getTransacoes();
      const investimentos = await getInvestimentos();
      const metas = await getMetas();
      setTransactions(transacoes);
      setInvestimentos(investimentos);
      setMetas(metas);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  // Busca os dados ao carregar o componente
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        investimentos,
        metas,
        loading,
        error,
        fetchTransactions,
        addTransaction,
        editTransaction,
        deleteTransaction,
        fetchInvestimentos,
        addInvestimento,
        editInvestimento,
        deleteInvestimento,
        fetchMetas,
        addMeta,
        editMeta,
        deleteMeta,
        fetchData,
        getMetas,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance deve ser usado dentro de um FinanceProvider");
  }
  return context;
};