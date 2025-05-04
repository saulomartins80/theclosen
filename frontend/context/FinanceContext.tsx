import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { transacaoAPI, investimentoAPI, metaAPI } from "../services/api";
import { Meta, Transacao, Investimento } from "../types";

// 1. Primeiro declare todas as interfaces
interface MongoId {
  $oid: string;
}

interface MongoDate {
  $date: string;
}

interface NovaTransacao {
  descricao: string;
  valor: number;
  data: { $date: string };
  categoria: string;
  tipo: "receita" | "despesa" | "transferencia";
  conta: string;
}

interface FinanceContextProps {
  transactions: Transacao[];
  investimentos: Investimento[];
  metas: Meta[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (novaTransacao: Omit<Transacao, "_id">) => Promise<void>;
  editTransaction: (id: string, updatedTransaction: Partial<Transacao>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchInvestimentos: () => Promise<void>;
  addInvestimento: (novoInvestimento: Omit<Investimento, "_id">) => Promise<void>;
  editInvestimento: (id: string, updatedInvestimento: Partial<Investimento>) => Promise<void>;
  deleteInvestimento: (id: string) => Promise<void>;
  fetchMetas: () => Promise<void>;
  addMeta: (novaMeta: Omit<Meta, "_id" | "createdAt">) => Promise<void>;
  editMeta: (id: string, updatedMeta: Partial<Meta>) => Promise<void>;
  deleteMeta: (id: string) => Promise<void>;
  fetchData: () => Promise<void>;
  getMetas: () => Promise<Meta[]>;
}

// 2. Depois declare os type guards
function isMongoId(id: any): id is MongoId {
  return id && typeof id === 'object' && '$oid' in id;
}

function isMongoDate(date: any): date is MongoDate {
  return date && typeof date === 'object' && '$date' in date;
}

// 3. Função de normalização
const normalizeId = (id: string | MongoId): string => {
  return typeof id === 'string' ? id : id.$oid;
};

const normalizeTransacao = (t: Transacao): Transacao => ({
  ...t,
  _id: isMongoId(t._id) ? t._id.$oid : t._id as string,
  data: isMongoDate(t.data) ? t.data.$date : t.data as string
});

// 4. Crie o contexto
const FinanceContext = createContext<FinanceContextProps>({} as FinanceContextProps);

// 5. Implemente o provider
export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transacao[]>([]);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transacaoAPI.getAll();
      setTransactions(data.map(normalizeTransacao));
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

// Função para converter para o formato da API
const toApiTransacao = (t: Omit<Transacao, "_id">): NovaTransacao => ({
  descricao: t.descricao,
  valor: Number(t.valor),
  data: { $date: t.data },
  categoria: t.categoria,
  tipo: t.tipo,
  conta: t.conta
});

// Função addTransaction corrigida
const addTransaction = async (newTransaction: Omit<Transacao, "_id">) => {
  try {
    const apiData = toApiTransacao(newTransaction);
    const data = await transacaoAPI.create(apiData);
    setTransactions((prev) => [...prev, normalizeTransacao(data)]);
  } catch (error) {
    console.error("Erro ao adicionar transação:", error);
    setError(error instanceof Error ? error.message : "Erro desconhecido");
    throw error;
  }
};

// Função para editar transação
const editTransaction = async (id: string | MongoId, updatedTransaction: Partial<Transacao>) => {
  try {
    const normalizedId = normalizeId(id);
    const data = await transacaoAPI.update(normalizedId, updatedTransaction);
    
    setTransactions((prev) =>
      prev.map((t) => {
        const currentId = normalizeId(t._id);
        return currentId === normalizedId ? normalizeTransacao({...t, ...data}) : t;
      })
    );
  } catch (error) {
    console.error("Erro ao editar transação:", error);
    setError(error instanceof Error ? error.message : "Erro desconhecido");
    throw error;
  }
};
// Função para excluir transação
const deleteTransaction = async (id: string | MongoId) => {
  try {
    // Use a função normalizeId já existente
    const normalizedId = normalizeId(id);
    
    await transacaoAPI.delete(normalizedId);
    
    setTransactions((prev) => 
      prev.filter((t) => {
        const currentId = normalizeId(t._id);
        return currentId !== normalizedId;
      })
    );
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    setError(error instanceof Error ? error.message : "Erro desconhecido");
    throw error;
  }
};

  // Função para buscar investimentos
  const fetchInvestimentos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await investimentoAPI.getAll();
      setInvestimentos(data);
    } catch (error) {
      console.error("Erro ao buscar investimentos:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };
  
  const addInvestimento = async (novoInvestimento: Omit<Investimento, "_id">) => {
    try {
      const data = await investimentoAPI.create(novoInvestimento);
      setInvestimentos((prev) => [...prev, data]);
    } catch (error) {
      console.error("Erro ao adicionar investimento:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };
  
  const editInvestimento = async (id: string, updatedInvestimento: Partial<Investimento>) => {
    try {
      const data = await investimentoAPI.update(id, updatedInvestimento);
      setInvestimentos((prev) =>
        prev.map((inv) => (inv._id === id ? { ...inv, ...data } : inv))
      );
    } catch (error) {
      console.error("Erro ao editar investimento:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };
  
  const deleteInvestimento = async (id: string) => {
    try {
      await investimentoAPI.delete(id);
      setInvestimentos((prev) => prev.filter((inv) => inv._id !== id));
    } catch (error) {
      console.error("Erro ao excluir investimento:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };

  // Função para buscar metas
  const fetchMetas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await metaAPI.getAll();
      // Garanta que os dados correspondem ao tipo Meta
      const normalizedMetas = data.map(meta => ({
        ...meta,
        concluida: meta.valorAtual >= meta.valorAlvo
      }));
      setMetas(normalizedMetas);
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
      const data = await metaAPI.create(novaMeta);
      setMetas((prev) => [...prev, data]);
    } catch (error) {
      console.error("Erro ao adicionar meta:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };

  // Função para editar meta
  const editMeta = async (id: string, updatedMeta: Partial<Meta>) => {
    try {
      const data = await metaAPI.update(id, updatedMeta);
      setMetas((prev) =>
        prev.map((m) => (m._id === id ? { ...m, ...data } : m))
      );
    } catch (error) {
      console.error("Erro ao editar meta:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };

  // Função para excluir meta
  const deleteMeta = async (id: string) => {
    try {
      await metaAPI.delete(id);
      setMetas((prev) => prev.filter((m) => m._id !== id));
    } catch (error) {
      console.error("Erro ao excluir meta:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };

  // Função para buscar todos os dados
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [transacoes, investimentos, metas] = await Promise.all([
        transacaoAPI.getAll(),
        investimentoAPI.getAll(),
        metaAPI.getAll()
      ]);
      setTransactions(transacoes);
      setInvestimentos(investimentos);
      setMetas(metas);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
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
        getMetas: metaAPI.getAll,
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