// components/DashboardContent.tsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { useDashboard } from "../context/DashboardContext";
import { useTheme } from "../context/ThemeContext";
import Graficos from "../components/Graficos";
import LoadingSpinner from "../components/LoadingSpinner";
import FinanceMarket from '../components/FinanceMarket';

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

const formatCurrency = (value: number | undefined, currency: string = 'BRL'): string => {
  if (typeof value !== 'number' || isNaN(value)) return '--';
  return value.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { 
    style: 'currency', 
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const DashboardContent: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { transactions, investimentos, loading, error, fetchData } = useFinance();
  const { 
    marketData, 
    loadingMarketData, 
    marketError, 
    selectedStocks,
    selectedCryptos,
    selectedCommodities = [],
    manualAssets = [],
    customIndices = [],
    refreshMarketData,
    setManualAssets = () => {},
    setSelectedStocks,
    setSelectedCryptos,
    setSelectedCommodities = () => {},
    setCustomIndices = () => {}
  } = useDashboard();

  const getSafeId = (idObj: string | { $oid: string }): string => {
    return typeof idObj === 'string' ? idObj : idObj.$oid;
  };

  const mappedTransactions = Array.isArray(transactions)
    ? transactions.map((t) => ({
        id: getSafeId(t._id),
        tipo: t.tipo,
        valor: t.valor,
      }))
    : [];

  const mappedInvestments = Array.isArray(investimentos)
    ? investimentos.map((inv) => ({
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
  const saldoColor = saldoAtual >= 0 ? "text-green-500" : "text-red-500";
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
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error || marketError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
          Erro: {(error as any)?.message || marketError || "Erro desconhecido"}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    } px-4 sm:px-6 py-6`}>
      {/* Container principal com largura controlada */}
      <div className="mx-auto w-full max-w-[1800px]">
        {/* Cabeçalho ajustado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9 9 9 0 0 1 9 9z"></path>
                <path d="M9 10a3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3z"></path>
                <path d="M8 21v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"></path>
              </svg>
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {getGreeting()}, <span className="text-blue-500">
                  {user?.name || user?.email?.split("@")[0] || "Usuário"}
                </span>!
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aqui está o seu resumo financeiro.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards de Resumo - Ajuste para mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { title: "Saldo Atual", value: saldoAtual, color: saldoColor, variation: variacaoSaldo },
            { title: "Receitas", value: totalReceitas, color: "text-blue-500", variation: variacaoReceitas },
            { title: "Despesas", value: totalDespesas, color: "text-red-500", variation: variacaoDespesas },
            { title: "Investimentos", value: totalInvestimentos, color: "text-purple-500", variation: variacaoInvestimentos }
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-4 rounded-xl shadow ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2 className="text-base font-semibold">{card.title}</h2>
              <p className={`text-xl font-bold ${card.color} mt-1`}>
                {formatCurrency(card.value)}
              </p>
              <p className={`text-xs ${card.variation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {card.variation >= 0 ? '+' : ''}{card.variation.toFixed(2)}% este mês
              </p>
            </motion.div>
          ))}
        </div>

        {/* Seção de Mercado Financeiro */}
        <div className="mb-8">
          {marketData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
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
        </div>

        {/* Seção de Gráficos */}
        <div className={`rounded-xl shadow mb-8 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="p-6">
            <Graficos />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;