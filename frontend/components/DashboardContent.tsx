// components/DashboardContent.tsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { useDashboard } from "../context/DashboardContext";
import { useTheme } from "../context/ThemeContext";
import Graficos from "../components/Graficos";
import LoadingSpinner from "../components/LoadingSpinner";
import  FinanceMarket  from '../components/FinanceMarket';

type TransacaoAdaptada = {
  _id: string | { $oid: string };
  tipo: "receita" | "despesa" | "transferencia";
  valor: number;
};

type InvestimentoAdaptado = {
  _id: string | { $oid: string };
  valor: number;
  tipo: string;
};

interface ApiError {
  message?: string;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
};

const formatCurrency = (value: number, currency: string = 'BRL'): string => {
  return value.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { 
    style: 'currency', 
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('pt-BR', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  });
};

const DashboardContent: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { transactions, investimentos, loading, error, fetchData } = useFinance();
  const { 
  marketData, 
  loadingMarketData, 
  marketError, 
  selectedStocks,
  selectedCryptos,
  selectedCommodities,
  manualAssets,
  customIndices, 
  refreshMarketData,
  setManualAssets,
  setSelectedStocks,
  setSelectedCryptos,
  setSelectedCommodities,
  setCustomIndices 
} = useDashboard();

  const getSafeId = (idObj: string | { $oid: string }): string => {
    return typeof idObj === 'string' ? idObj : idObj.$oid;
  };

  const mappedTransactions = Array.isArray(transactions)
    ? transactions.map((t: TransacaoAdaptada) => ({
        id: getSafeId(t._id),
        tipo: t.tipo,
        valor: t.valor,
      }))
    : [];

  const mappedInvestments = Array.isArray(investimentos)
    ? investimentos.map((inv: InvestimentoAdaptado) => ({
        id: getSafeId(inv._id),
        valor: inv.valor,
        tipo: inv.tipo as 'Renda Fixa' | 'Ações' | 'Fundos Imobiliários' | 'Criptomoedas'
      }))
    : [];

  const totalReceitas = mappedTransactions
    .filter((t) => t.tipo === "receita")
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = mappedTransactions
    .filter((t) => t.tipo === "despesa")
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoAtual = totalReceitas - totalDespesas;
  const saldoColor = saldoAtual >= 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400";
  const totalInvestimentos = mappedInvestments.reduce((acc, inv) => acc + inv.valor, 0);

  const variacaoSaldo = saldoAtual / (totalReceitas + totalDespesas) * 100 || 0;
  const variacaoReceitas = 15;
  const variacaoDespesas = -10;
  const variacaoInvestimentos = 8;

  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading || loadingMarketData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error || marketError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-red-500 p-4 rounded-lg bg-red-50 dark:bg-red-800 dark:text-red-300">
          Erro: {(error as ApiError)?.message || (marketError as ApiError)?.message || "Erro desconhecido"}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      resolvedTheme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="container mx-auto px-0 sm:px-4 py-6">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 px-4 sm:px-0"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, <span className="text-blue-500 dark:text-blue-400">
              {user?.name || user?.email?.split("@")[0] || "Usuário"}
            </span>!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Aqui está o seu resumo financeiro.
          </p>
        </motion.div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-4 sm:px-0">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-xl shadow ${
              resolvedTheme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <h2 className="text-lg font-semibold">Saldo Atual</h2>
            <p className={`text-2xl font-bold ${saldoColor} mt-2`}>
              {formatCurrency(saldoAtual)}
            </p>
            <p className={`text-sm ${variacaoSaldo >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'} mt-1`}>
              {variacaoSaldo >= 0 ? '+' : ''}{variacaoSaldo.toFixed(2)}% este mês
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`p-6 rounded-xl shadow ${
              resolvedTheme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <h2 className="text-lg font-semibold">Receitas</h2>
            <p className="text-2xl font-bold text-blue-500 dark:text-blue-400 mt-2">
              {formatCurrency(totalReceitas)}
            </p>
            <p className="text-sm text-green-500 dark:text-green-400 mt-1">
              +{variacaoReceitas}% este mês
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`p-6 rounded-xl shadow ${
              resolvedTheme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <h2 className="text-lg font-semibold">Despesas</h2>
            <p className="text-2xl font-bold text-red-500 dark:text-red-400 mt-2">
              {formatCurrency(totalDespesas)}
            </p>
            <p className="text-sm text-red-500 dark:text-red-400 mt-1">
              {variacaoDespesas}% este mês
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className={`p-6 rounded-xl shadow ${
              resolvedTheme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <h2 className="text-lg font-semibold">Investimentos</h2>
            <p className="text-2xl font-bold text-purple-500 dark:text-purple-400 mt-2">
              {formatCurrency(totalInvestimentos)}
            </p>
            <p className="text-sm text-green-500 dark:text-green-400 mt-1">
              +{variacaoInvestimentos}% este mês
            </p>
          </motion.div>
        </div>

        {/* Componente de Mercado Financeiro */}
        {marketData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <FinanceMarket
              marketData={marketData}
              loadingMarketData={loadingMarketData}
              marketError={marketError}
              selectedStocks={selectedStocks}
              selectedCryptos={selectedCryptos}
              selectedCommodities={selectedCommodities}
              manualAssets={manualAssets}
              customIndices={customIndices}
              refreshMarketData={refreshMarketData}
              setManualAssets={setManualAssets}
              setSelectedStocks={setSelectedStocks}
              setSelectedCryptos={setSelectedCryptos}
              setSelectedCommodities={setSelectedCommodities}
              setCustomIndices={setCustomIndices}
            />
          </motion.div>
        )}

        {/* Seção de Gráficos - Full Width */}
        <div className={`rounded-none sm:rounded-xl shadow mb-8 ${
          resolvedTheme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="p-0 sm:p-2">
            <Graficos />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;