import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getTransacoes,
  createTransacao,
  updateTransacao,
  deleteTransacao,
  getInvestimentos,
  addInvestimento as apiAddInvestimento,
  updateInvestimento,
  deleteInvestimento,
} from "../services/api";

interface Transacao {
  id: string;
  tipo: "receita" | "despesa";
  valor: number;
  descricao: string;
  data: string;
}

interface Investimento {
  id: string;
  nome: string;
  tipo: string;
  valor: number;
  data: string;
}

interface FinanceContextProps {
  transactions: Transacao[];
  investimentos: Investimento[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => void;
  addTransaction: (novaTransacao: Omit<Transacao, "id">) => void;
  editTransaction: (id: string, updatedTransaction: Partial<Transacao>) => void;
  deleteTransaction: (id: string) => void;
  fetchInvestimentos: () => void;
  addInvestimento: (novoInvestimento: Omit<Investimento, "id">) => void;
  editInvestimento: (id: string, updatedInvestimento: Partial<Investimento>) => void;
  deleteInvestimento: (id: string) => void;
  fetchData: () => void; // Adicionando fetchData
}

const FinanceContext = createContext<FinanceContextProps>({
  transactions: [],
  investimentos: [],
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
  fetchData: () => {}, // Inicializando fetchData
});

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transacao[]>([]);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const addTransaction = async (newTransaction: Omit<Transacao, "id">) => {
    try {
      const data = await createTransacao(newTransaction);
      setTransactions((prev) => [...prev, data]);
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  const editTransaction = async (id: string, updatedTransaction: Partial<Transacao>) => {
    try {
      const data = await updateTransacao(id, updatedTransaction);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
    } catch (error) {
      console.error("Erro ao editar transação:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteTransacao(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

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
      setInvestimentos((prev) => [...prev, data]);
    } catch (error) {
      console.error("Erro ao adicionar investimento:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  const editInvestimento = async (id: string, updatedInvestimento: Partial<Investimento>) => {
    try {
      const data = await updateInvestimento(id, updatedInvestimento);
      setInvestimentos((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv))
      );
    } catch (error) {
      console.error("Erro ao editar investimento:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  const deleteInvestimento = async (id: string) => {
    try {
      await deleteInvestimento(id);
      setInvestimentos((prev) => prev.filter((inv) => inv.id !== id));
    } catch (error) {
      console.error("Erro ao excluir investimento:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  // Função fetchData para atualização automática
  const fetchData = async () => {
    try {
      setLoading(true);
      const transacoes = await getTransacoes();
      const investimentos = await getInvestimentos();
      setTransactions(transacoes);
      setInvestimentos(investimentos);
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
        fetchData, // Disponibilizando fetchData no contexto
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