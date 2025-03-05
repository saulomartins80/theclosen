import { create } from "zustand";

interface Transaction {
  id: string;
  type: "income" | "expense";
  value: number;
  date: string;
  category: string;
  description: string;
}

interface FinanceStore {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  editTransaction: (id: string, updatedTransaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("http://localhost:5000/api/lancamentos");
      if (!response.ok) throw new Error("Falha ao carregar transações");
      const data = await response.json();
      set({ transactions: data, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      set({ error: errorMessage, loading: false });
    }
  },

  addTransaction: async (transaction) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("http://localhost:5000/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      if (!response.ok) throw new Error("Erro ao adicionar transação");
      const data = await response.json();
      set((state) => ({ transactions: [...state.transactions, data], loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      set({ error: errorMessage, loading: false });
    }
  },

  editTransaction: async (id, updatedTransaction) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:5000/api/lancamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTransaction),
      });
      if (!response.ok) throw new Error("Erro ao editar transação");
      const data = await response.json();
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? data : t)),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      set({ error: errorMessage, loading: false });
    }
  },

  deleteTransaction: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`http://localhost:5000/api/lancamentos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao excluir transação");
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      set({ error: errorMessage, loading: false });
    }
  },
}));