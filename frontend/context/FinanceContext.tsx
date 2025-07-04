import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { transacaoAPI, investimentoAPI, metaAPI } from "../services/api";
import { Meta, Transacao, Investimento } from "../types";
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

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
  const router = useRouter();
  // console.log('[FinanceProvider] Component Mounted. Current router path:', router.pathname, 'Is router ready?', router.isReady);

  const [transactions, setTransactions] = useState<Transacao[]>([]);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isAuthReady } = useAuth(); // isAuthReady é o authChecked do AuthContext
  // console.log('[FinanceProvider] Auth state from useAuth: isAuthReady =', isAuthReady, 'user exists =', !!user);

  const fetchTransactions = async () => {
    console.log('[FinanceContext] Attempting to call fetchTransactions. AuthState:', { isAuthReady, user: !!user });
    if (!isAuthReady || !user) {
        console.log('[FinanceContext] fetchTransactions ABORTED - Auth not ready or no user.');
        setLoading(false); 
        return;
    }
    console.log('[fetchTransactions] Starting to fetch transactions');
    setLoading(true);
    setError(null);
    try {
      const data = await transacaoAPI.getAll();
      console.log('[fetchTransactions] Data received:', data);
      setTransactions(data.map(normalizeTransacao));
      console.log('[fetchTransactions] Transactions updated successfully');
    } catch (error) {
      console.error("[fetchTransactions] Error fetching transactions:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
      console.log('[fetchTransactions] Finished fetching transactions');
    }
  };

  const toApiTransacao = (t: Omit<Transacao, "_id">): NovaTransacao => {
  // Extrai a data no formato ISO string, independentemente do formato original
  const dataISO = typeof t.data === 'string' 
    ? new Date(t.data).toISOString() 
    : new Date(t.data.$date).toISOString();
  
  return {
    descricao: t.descricao,
    valor: Number(t.valor),
    data: { $date: dataISO }, // Garante que sempre será um objeto com $date
    categoria: t.categoria,
    tipo: t.tipo,
    conta: t.conta
  };
};

  const addTransaction = async (newTransaction: Omit<Transacao, "_id">) => {
    console.log('[addTransaction] Adding new transaction:', newTransaction);
    try {
      const apiData = toApiTransacao(newTransaction);
      console.log('[addTransaction] Formatted for API:', apiData);
      const data = await transacaoAPI.create(apiData);
      console.log('[addTransaction] Created successfully:', data);
      setTransactions((prev) => [...prev, normalizeTransacao(data)]);
      console.log('[addTransaction] State updated with new transaction');
    } catch (error) {
      console.error("[addTransaction] Error adding transaction:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };

  const editTransaction = async (id: string | MongoId, updatedTransaction: Partial<Transacao>) => {
    console.log('[editTransaction] Editing transaction ID:', id, 'with data:', updatedTransaction);
    try {
      const normalizedId = normalizeId(id);
      console.log('[editTransaction] Normalized ID:', normalizedId);
      const data = await transacaoAPI.update(normalizedId, updatedTransaction);
      console.log('[editTransaction] Update successful, received:', data);
      
      setTransactions((prev) =>
        prev.map((t) => {
          const currentId = normalizeId(t._id);
          return currentId === normalizedId ? normalizeTransacao({...t, ...data}) : t;
        })
      );
      console.log('[editTransaction] State updated successfully');
    } catch (error) {
      console.error("[editTransaction] Error editing transaction:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };

  const deleteTransaction = async (id: string | MongoId) => {
    console.log('[deleteTransaction] Deleting transaction ID:', id);
    try {
      const normalizedId = normalizeId(id);
      console.log('[deleteTransaction] Normalized ID:', normalizedId);
      
      await transacaoAPI.delete(normalizedId);
      console.log('[deleteTransaction] Deletion successful');
      
      setTransactions((prev) => 
        prev.filter((t) => {
          const currentId = normalizeId(t._id);
          return currentId !== normalizedId;
        })
      );
      console.log('[deleteTransaction] State updated successfully');
    } catch (error) {
      console.error("[deleteTransaction] Error deleting transaction:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };

  const fetchInvestimentos = async () => {
    console.log('[FinanceContext] Attempting to call fetchInvestimentos. AuthState:', { isAuthReady, user: !!user });
    if (!isAuthReady || !user) {
        console.log('[FinanceContext] fetchInvestimentos ABORTED - Auth not ready or no user.');
        setLoading(false);
        return;
    }
    console.log('[fetchInvestimentos] Starting to fetch investments');
    setLoading(true);
    setError(null);
    try {
      const data = await investimentoAPI.getAll();
      console.log('[fetchInvestimentos] Data received:', data);
      setInvestimentos(data);
      console.log('[fetchInvestimentos] Investments updated successfully');
    } catch (error) {
      console.error("[fetchInvestimentos] Error fetching investments:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
      console.log('[fetchInvestimentos] Finished fetching investments');
    }
  };
  
  const addInvestimento = async (novoInvestimento: Omit<Investimento, "_id">) => {
    console.log('[addInvestimento] Adding new investment:', novoInvestimento);
    try {
      const data = await investimentoAPI.create(novoInvestimento);
      console.log('[addInvestimento] Created successfully:', data);
      setInvestimentos((prev) => [...prev, data]);
      console.log('[addInvestimento] State updated with new investment');
    } catch (error) {
      console.error("[addInvestimento] Error adding investment:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };
  
  const editInvestimento = async (id: string, updatedInvestimento: Partial<Investimento>) => {
    console.log('[editInvestimento] Editing investment ID:', id, 'with data:', updatedInvestimento);
    try {
      const data = await investimentoAPI.update(id, updatedInvestimento);
      console.log('[editInvestimento] Update successful, received:', data);
      setInvestimentos((prev) =>
        prev.map((inv) => (inv._id === id ? { ...inv, ...data } : inv))
      );
      console.log('[editInvestimento] State updated successfully');
    } catch (error) {
      console.error("[editInvestimento] Error editing investment:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };
  
  const deleteInvestimento = async (id: string) => {
    console.log('[deleteInvestimento] Deleting investment ID:', id);
    try {
      await investimentoAPI.delete(id);
      console.log('[deleteInvestimento] Deletion successful');
      setInvestimentos((prev) => prev.filter((inv) => inv._id !== id));
      console.log('[deleteInvestimento] State updated successfully');
    } catch (error) {
      console.error("[deleteInvestimento] Error deleting investment:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };

  const fetchMetas = async () => {
    console.log('[FinanceContext] Attempting to call fetchMetas. AuthState:', { isAuthReady, user: !!user });
    if (!isAuthReady || !user) {
        console.log('[FinanceContext] fetchMetas ABORTED - Auth not ready or no user.');
        setLoading(false);
        return;
    }
    console.log('[fetchMetas] Starting to fetch goals');
    setLoading(true);
    setError(null);
    try {
      const data = await metaAPI.getAll();
      console.log('[fetchMetas] Data received:', data);
      const normalizedMetas = data.map(meta => ({
        ...meta,
        concluida: meta && meta.valor_atual !== undefined && meta.valor_total !== undefined ? meta.valor_atual >= meta.valor_total : false
      }));
      setMetas(normalizedMetas);
      console.log('[fetchMetas] Goals updated successfully');
    } catch (error) {
      console.error("[fetchMetas] Error fetching goals:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
      console.log('[fetchMetas] Finished fetching goals');
    }
  };

  const addMeta = async (novaMeta: Omit<Meta, "_id" | "createdAt">) => {
    console.log('[addMeta] Adding new goal:', novaMeta);
    try {
      const data = await metaAPI.create(novaMeta);
      console.log('[addMeta] Created successfully:', data);
      setMetas((prev) => [...prev, data]);
      console.log('[addMeta] State updated with new goal');
    } catch (error) {
      console.error("[addMeta] Error adding goal:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };

  const editMeta = async (id: string, updatedMeta: Partial<Meta>) => {
    console.log('[editMeta] Editing goal ID:', id, 'with data:', updatedMeta);
    try {
      const data = await metaAPI.update(id, updatedMeta);
      console.log('[editMeta] Update successful, received:', data);
      setMetas((prev) =>
        prev.map((m) => (m._id === id ? { ...m, ...data } : m))
      );
      console.log('[editMeta] State updated successfully');
    } catch (error) {
      console.error("[editMeta] Error editing goal:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };

  const deleteMeta = async (id: string) => {
    console.log('[deleteMeta] Deleting goal ID:', id);
    try {
      await metaAPI.delete(id);
      console.log('[deleteMeta] Deletion successful');
      setMetas((prev) => prev.filter((m) => m._id !== id));
      console.log('[deleteMeta] State updated successfully');
    } catch (error) {
      console.error("[deleteMeta] Error deleting goal:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    }
  };

  const fetchData = async () => {
    const fetchDataCallId = Date.now();
    console.log(`[fetchData CALL ${fetchDataCallId}] Starting. Path: ${router.pathname}, Auth: isAuthReady = ${isAuthReady}, user = ${!!user}, User ID if exists: ${user?.uid}`);

    if (!isAuthReady || !user) {
      console.log(`[fetchData CALL ${fetchDataCallId}] ABORTING: Auth not ready or no user.`);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log(`[fetchData CALL ${fetchDataCallId}] Proceeding with API calls. Path: ${router.pathname}`);
      
      // Adicionado guardas em cada chamada individual também, por segurança extra
      const transacoesPromise = (isAuthReady && user) ? transacaoAPI.getAll() : Promise.resolve([]);
      const investimentosPromise = (isAuthReady && user) ? investimentoAPI.getAll() : Promise.resolve([]);
      const metasPromise = (isAuthReady && user) ? metaAPI.getAll() : Promise.resolve([]);

      const [transacoes, investimentos, metasData] = await Promise.all([
        transacoesPromise,
        investimentosPromise,
        metasPromise
      ]);
      
      console.log(`[fetchData CALL ${fetchDataCallId}] Data received:`, { transacoes, investimentos, metas: metasData });
      
      setTransactions(transacoes.map(normalizeTransacao));
      setInvestimentos(investimentos);
      setMetas(metasData.map(meta => ({
        ...meta,
        concluida: meta && meta.valor_atual !== undefined && meta.valor_total !== undefined ? meta.valor_atual >= meta.valor_total : false
      })));
      
      console.log(`[fetchData CALL ${fetchDataCallId}] All data updated successfully. Path: ${router.pathname}`);
    } catch (error: any) {
      console.error(`[fetchData CALL ${fetchDataCallId}] Error fetching data:`, error, "Path:", router.pathname);
      setError(error?.response?.data?.message || error?.message || "Erro desconhecido");
    } finally {
      setLoading(false);
      console.log(`[fetchData CALL ${fetchDataCallId}] Finished fetching all data. Path: ${router.pathname}`);
    }
  };

  useEffect(() => {
    const effectId = Date.now();
    console.log(`[FinanceProvider EFFECT ${effectId}] Triggered. Path: ${router.pathname}, RouterReady: ${router.isReady}, AuthReady: ${isAuthReady}, User: ${!!user}`);
    
    // Lista de rotas que precisam de dados financeiros
    const protectedRoutes = ['/dashboard', '/investimentos', '/metas', '/transacoes', '/configuracoes', '/profile', '/assinaturas', '/milhas'];
    const isProtectedRoute = protectedRoutes.some(route => router.pathname.startsWith(route));
    
    if (router.isReady && isProtectedRoute) {
      console.log(`[FinanceProvider EFFECT ${effectId}] Path is protected route and router IS ready.`);
      if (isAuthReady && user) {
        console.log(`[FinanceProvider EFFECT ${effectId}] Conditions MET (auth ready, user exists). CALLING fetchData(). User ID: ${user.uid}`);
        fetchData();
      } else {
        console.log(`[FinanceProvider EFFECT ${effectId}] Conditions NOT MET for fetchData. isAuthReady: ${isAuthReady}, user: ${!!user}`);
        setLoading(false);
      }
    } else {
      console.log(`[FinanceProvider EFFECT ${effectId}] SKIPPING fetchData (not on protected route, or router not ready). Path: ${router.pathname}, RouterReady: ${router.isReady}, isProtectedRoute: ${isProtectedRoute}`);
      setLoading(false);
    }
  }, [isAuthReady, user, router.isReady, router.pathname]);

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
      {/* O console.log foi removido daqui para corrigir o erro de ReactNode */}
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    console.error("[useFinance] Must be used within a FinanceProvider");
    throw new Error("useFinance deve ser usado dentro de um FinanceProvider");
  }
  return context;
};