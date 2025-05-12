// components/DashboardContent.tsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { useDashboard } from "../context/DashboardContext";
import Graficos from "../components/Graficos";
import LoadingSpinner from "../components/LoadingSpinner";
import { useTheme } from "../context/ThemeContext";

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
    refreshMarketData 
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
          Erro: {(error as ApiError)?.message || marketError || "Erro desconhecido"}
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

        {/* Seção de Mercado Financeiro */}
        {marketData && (
          <div className={`rounded-xl shadow overflow-hidden mb-8 ${
            resolvedTheme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
          }`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold">Mercado Financeiro</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Atualizado em: {new Date(marketData.lastUpdated).toLocaleTimeString()}
                  </span>
                  <button 
                    onClick={() => refreshMarketData()}
                    className={`text-sm px-4 py-2 rounded-lg ${
                      resolvedTheme === "dark" 
                        ? "bg-blue-700 hover:bg-blue-600 text-white" 
                        : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                    } transition`}
                  >
                    Atualizar
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className={`p-4 rounded-lg ${
                  resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">IBOVESPA</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      marketData.indices.ibovespa >= 0 
                        ? resolvedTheme === "dark" 
                          ? "bg-green-800 text-green-200" 
                          : "bg-green-100 text-green-800"
                        : resolvedTheme === "dark" 
                          ? "bg-red-800 text-red-200" 
                          : "bg-red-100 text-red-800"
                    }`}>
                      {marketData.indices.ibovespa >= 0 ? '↑' : '↓'} {Math.abs(marketData.indices.ibovespa).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-2xl mt-1 text-gray-900 dark:text-white">
                    {marketData.indices.ibovespa.toLocaleString('pt-BR')}
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Dólar</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      marketData.indices.dollar >= 0 
                        ? resolvedTheme === "dark" 
                          ? "bg-green-800 text-green-200" 
                          : "bg-green-100 text-green-800"
                        : resolvedTheme === "dark" 
                          ? "bg-red-800 text-red-200" 
                          : "bg-red-100 text-red-800"
                    }`}>
                      {marketData.indices.dollar >= 0 ? '↑' : '↓'} {Math.abs(marketData.indices.dollar).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-2xl mt-1 text-gray-900 dark:text-white">
                    {formatCurrency(marketData.indices.dollar)}
                  </p>
                </div>
              </div>

              {marketData.cryptos && marketData.cryptos.length > 0 && (
                <div className="mb-6">
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Criptomoedas</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCryptos.map(crypto => (
                        <span 
                          key={crypto}
                          className={`px-3 py-1 rounded-full text-sm ${
                            resolvedTheme === "dark" 
                              ? "bg-purple-800 text-purple-200" 
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {crypto.replace('-USD', '')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className={`${
                        resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}>
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Criptomoeda</th>
                          <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Preço (USD)</th>
                          <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Variação (24h)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {marketData.cryptos.map((crypto) => (
                          <tr key={crypto.symbol}>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {crypto.symbol.replace('-USD', '')}
                            </td>
                            <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right ${
                              crypto.change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                            }`}>
                              {formatCurrency(crypto.price, 'USD')}
                            </td>
                            <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right ${
                              crypto.changePercent >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                            }`}>
                              {crypto.changePercent >= 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Ações Selecionadas</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStocks.map(stock => (
                      <span 
                        key={stock}
                        className={`px-3 py-1 rounded-full text-sm ${
                          resolvedTheme === "dark" 
                            ? "bg-blue-800 text-blue-200" 
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {stock}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className={`${
                      resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"
                    }`}>
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ação</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Preço</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Variação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {marketData.stocks.map((stock) => (
                        <tr key={stock.symbol}>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {stock.symbol}
                          </td>
                          <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right ${
                            stock.change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                          }`}>
                            {formatCurrency(stock.price)}
                          </td>
                          <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right ${
                            stock.change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                          }`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
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
