// components/DashboardContent.tsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { useDashboard } from "../context/DashboardContext";
import { useTheme } from "../context/ThemeContext"; // Import useTheme
import Graficos from "../components/Graficos";
import LoadingSpinner from "../components/LoadingSpinner";
import FinanceMarket from '../components/FinanceMarket';
import { ArrowUp, ArrowDown, Wallet, TrendingUp, TrendingDown, DollarSign, User } from 'lucide-react'; // Added User icon for header
import { useRouter } from "next/router";

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
  const { resolvedTheme } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { transactions, investimentos, loading: financeLoading, error, fetchData } = useFinance();
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
    setCustomIndices = (indices: string[]) => {}
  } = useDashboard() as ReturnType<typeof useDashboard> & {
    setCustomIndices: (indices: string[]) => void;
  };

  // Combinar todos os useEffects em um único
  useEffect(() => {
    // Verificar autenticação
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    // Inicializar dados do mercado
    if (refreshMarketData) {
      refreshMarketData();
      const marketInterval = setInterval(() => refreshMarketData({ silent: true }), 300000);
      return () => clearInterval(marketInterval);
    }
  }, [user, loading, router, refreshMarketData]);

  // Funções auxiliares
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
  const totalInvestimentos = mappedInvestments.reduce((acc, inv) => acc + inv.valor, 0);

  const variacaoSaldo = (saldoAtual / (Math.abs(totalReceitas) + Math.abs(totalDespesas) || 1)) * 100 || 0;
  const variacaoReceitas = 15;
  const variacaoDespesas = -10;
  const variacaoInvestimentos = 8;

  // Renderização condicional
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (financeLoading || loadingMarketData) {
    return (
      <div className={`flex items-center justify-center h-screen ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || marketError) {
    return (
      <div className={`flex items-center justify-center h-screen ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-4 rounded-lg max-w-md text-center ${resolvedTheme === 'dark' ? 'bg-red-900/20 text-red-300 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <h3 className="font-bold mb-2">Erro ao carregar dados</h3>
          <p>{(error as any)?.message || marketError || "Erro desconhecido"}</p>
           {fetchData && (
             <button
               onClick={() => {fetchData(); refreshMarketData();}}
               className={`mt-4 px-4 py-2 rounded ${resolvedTheme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
             >
               Tentar novamente
             </button>
           )}
        </div>
      </div>
    );
  }

  // Componente de Card reutilizável
  const SummaryCard = ({
    title,
    value,
    variation,
    icon,
    color
  }: {
    title: string;
    value: number;
    variation: number;
    icon: React.ReactNode;
    color: string; // Tailwind color base (e.g., 'blue', 'green', 'rose')
  }) => {
    const isPositive = variation >= 0;
    // Usar resolvedTheme para as cores
    const variationColor = isPositive
      ? (resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600')
      : (resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600');

    const bgColor = resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const borderColor = resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200';
    const iconBgColor = resolvedTheme === 'dark' ? `bg-${color}-900/30` : `bg-${color}-100`;
    const iconColor = resolvedTheme === 'dark' ? `text-${color}-300` : `text-${color}-600`; // Cor do ícone

    return (
      <motion.div
        whileHover={{ y: -2, boxShadow: resolvedTheme === 'dark' ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
        className={`p-5 rounded-xl shadow-sm border ${bgColor} ${borderColor} transition-all duration-200`}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {title}
            </p>
            {/* Cor do valor principal */}
             <p className={`text-2xl font-bold mt-1 ${
               title === 'Saldo Atual'
                 ? (saldoAtual >= 0 ? (resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600') : (resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'))
                 : (title === 'Receitas' ? (resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600') : (title === 'Despesas' ? (resolvedTheme === 'dark' ? 'text-rose-400' : 'text-rose-600') : (resolvedTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'))) // Cor base do card para Investimentos
             }`}>
              {formatCurrency(value)}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${iconBgColor} ${iconColor}`}> {/* Aplicada cor do ícone */}
            {icon}
          </div>
        </div>
        <div className={`flex items-center mt-4 text-sm font-medium ${variationColor}`}>
          {isPositive ? 
            <ArrowUp className={`w-4 h-4 mr-1 ${variationColor}`} /> 
            : 
            <ArrowDown className={`w-4 h-4 mr-1 ${variationColor}`} />
          }
          <span>
            {isPositive ? '+' : ''}{Math.abs(variation).toFixed(2)}%
          </span>
           <span className={`ml-2 opacity-80 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>vs mês anterior</span>
        </div>
      </motion.div>
    );
  };

  return (
    // Contêiner principal: aplica o background do tema a toda a área
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      resolvedTheme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    } px-4 sm:px-6 py-6`}>
      <div className="mx-auto w-full max-w-[1800px]">
        {/* Cabeçalho ajustado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
             {/* Ícone do Cabeçalho - Corrigido para usar resolvedTheme */}
            <span className={`p-2 rounded-lg ${
              resolvedTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
            }`}>
              <User size={24} /> {/* Usando ícone de usuário para o cabeçalho geral */}
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {getGreeting()}, <span className={`${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}> {/* Cor ajustada para o nome */}
                  {user?.name || user?.email?.split("@")[0] || "Usuário"}
                </span>!
              </h1>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}> {/* Cor ajustada para o subtítulo */}
                Aqui está o seu resumo financeiro.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards de Resumo Super Impactantes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card de Saldo - Efeito de destaque */}
          <SummaryCard
             title="Saldo Atual"
             value={saldoAtual}
             variation={variacaoSaldo} // Usando variação simulada ou real se disponível
             icon={<Wallet size={24} />}
             color={saldoAtual >= 0 ? 'green' : 'rose'} // Cor base para o ícone e fundo dele
          />

          {/* Card de Receitas */}
          <SummaryCard
             title="Receitas"
             value={totalReceitas}
             variation={variacaoReceitas} // Usando variação simulada ou real
             icon={<TrendingUp size={24} />}
             color="blue" // Cor base para o ícone e fundo dele
          />

          {/* Card de Despesas */}
          <SummaryCard
             title="Despesas"
             value={totalDespesas}
             variation={variacaoDespesas} // Usando variação simulada ou real
             icon={<TrendingDown size={24} />}
             color="rose" // Cor base para o ícone e fundo dele
          />

          {/* Card de Investimentos */}
           <SummaryCard
             title="Investimentos"
             value={totalInvestimentos}
             variation={variacaoInvestimentos} // Usando variação simulada ou real
             icon={<DollarSign size={24} />}
             color="purple" // Cor base para o ícone e fundo dele
          />

        </div>

        {/* Seção de Mercado Financeiro */}
        <div className="mb-8">
          {/* O componente FinanceMarket deve aplicar seus próprios estilos de fundo/bordas com base no resolvedTheme */}
           {/* Certifique-se de que o FinanceMarket receba o resolvedTheme ou o theme corretamente,
               ou que use useTheme() internamente para aplicar estilos.
               Pelo código anterior, ele já usa resolvedTheme. */}
          <FinanceMarket
            marketData={marketData}
            loadingMarketData={loadingMarketData}
            marketError={marketError}
            selectedStocks={selectedStocks}
            selectedCryptos={selectedCryptos}
            selectedCommodities={selectedCommodities}
            refreshMarketData={refreshMarketData}
            setSelectedStocks={setSelectedStocks}
            setSelectedCryptos={setSelectedCryptos}
            setSelectedCommodities={setSelectedCommodities}
             // customIndices é passado para o FinanceMarket, que usa useDashboard para obtê-lo
             // Não precisa passar explicitamente aqui a menos que o FinanceMarket não use useDashboard
          />
        </div>

        {/* Seção de Gráficos */}
        {/* O componente Graficos deve aplicar seus próprios estilos de fundo/bordas com base no resolvedTheme */}
        {/* Verifique o código de Graficos.tsx para garantir que use useTheme() para estilos internos. */}
        <div className={`rounded-xl shadow mb-8 ${
          resolvedTheme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200" // Aplicando tema aqui também
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