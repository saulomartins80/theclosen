// components/FinanceMarket.tsx
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ExclamationTriangleIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import AssetSelectionModal from './AssetSelectionModal';
import { useDashboard } from '../context/DashboardContext';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  currency?: string;
}

interface MarketData {
  stocks?: StockData[];
  cryptos?: StockData[];
  indices?: StockData[]; // Agora é StockData[]
  commodities?: StockData[];
  lastUpdated?: string;
}

interface FinanceMarketProps {
  marketData: MarketData | null;
  loadingMarketData: boolean;
  marketError: string | null;
  selectedStocks: string[];
  selectedCryptos: string[];
  selectedCommodities: string[];
  refreshMarketData: () => void;
  setSelectedStocks: (stocks: string[]) => void;
  setSelectedCryptos: (cryptos: string[]) => void;
  setSelectedCommodities: (commodities: string[]) => void;
  // Remova as props relacionadas a índices aqui
}

const FinanceMarket: React.FC<FinanceMarketProps> = ({
  marketData,
  loadingMarketData,
  marketError,
  selectedStocks,
  selectedCryptos,
  selectedCommodities,
  refreshMarketData,
  setSelectedStocks,
  setSelectedCryptos,
  setSelectedCommodities,
}) => {
  const { resolvedTheme } = useTheme();
  const {
    availableStocks = [],
    availableCryptos = [],
    availableCommodities = [],
    availableIndices = [],
    customIndices,
    setCustomIndices,
  } = useDashboard();

  // Obter os símbolos dos índices selecionados
  const selectedIndices = customIndices.map(index => index.symbol);

  // Função para atualizar os índices selecionados
  const handleSetSelectedIndices = (symbols: string[]) => {
  const updatedIndices = symbols.map(symbol => {
    // Garante que o símbolo tenha o prefixo ^ quando necessário
    const normalizedSymbol = symbol.startsWith('^') ? symbol : `^${symbol}`;
    const existing = customIndices.find(i => i.symbol === normalizedSymbol);
    return existing || { 
      symbol: normalizedSymbol, 
      name: getFriendlyName(normalizedSymbol) 
    };
  });
  setCustomIndices(updatedIndices);
};

  const [searchTerm, setSearchTerm] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showCommodityModal, setShowCommodityModal] = useState(false);
  const [showIndexModal, setShowIndexModal] = useState(false);

  // Ativos recomendados
  const defaultStocks = ['PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'AAPL', 'MSFT'];
  const defaultCryptos = ['BTC-USD', 'ETH-USD', 'USDT-USD'];
  const defaultIndices = ['^BVSP', 'BRL=X', '^GSPC'];

  // Funções auxiliares
  const getCommodityDisplayName = (symbol: string): string => {
    const commodityNames: Record<string, string> = {
      'GC=F': 'Ouro',
      'SI=F': 'Prata',
      'CL=F': 'Petróleo',
      'NG=F': 'Gás Natural',
      'ZC=F': 'Milho'
    };
    return commodityNames[symbol] || symbol.replace('=F', '');
  };

  const getFriendlyName = (symbol: string): string => {
    const friendlyNames: Record<string, string> = {
      '^BVSP': 'IBOVESPA',
      'BRL=X': 'Dólar',
      '^GSPC': 'S&P 500',
      '^IXIC': 'NASDAQ',
      '^DJI': 'Dow Jones'
    };
    return friendlyNames[symbol] || symbol;
  };

  const formatValue = (value: number, isCurrency: boolean, currency: string = 'BRL'): string => {
    if (isCurrency) {
      return value.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Dados com fallback
  const stocks = marketData?.stocks || [];
  const cryptos = marketData?.cryptos || [];
  const commodities = marketData?.commodities || [];
  const indices = marketData?.indices || []; // <-- Corrigido aqui
  const lastUpdated = marketData?.lastUpdated || '';

  // Filtros
  const filteredTableStocks = stocks.filter(stock =>
    stock?.symbol?.toLowerCase?.().includes(searchTerm.toLowerCase())
  );

  const filteredTableCryptos = cryptos.filter(crypto =>
    crypto?.symbol?.toLowerCase?.().includes(searchTerm.toLowerCase())
  );

  const filteredTableCommodities = commodities.filter(commodity =>
    commodity?.symbol?.toLowerCase?.().includes(searchTerm.toLowerCase()) ||
    getCommodityDisplayName(commodity?.symbol ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingMarketData) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (marketError) {
    return (
      <div className="p-4 mb-6 rounded-lg bg-red-100/90 dark:bg-red-900/90 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-200">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span>Erro ao carregar dados do mercado: {marketError}</span>
        </div>
        <button
          onClick={refreshMarketData}
          className="mt-3 px-4 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center gap-1"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="p-4 mb-6 rounded-lg bg-yellow-100/90 dark:bg-yellow-900/90 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-200">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span>Nenhum dado do mercado encontrado. Por favor, selecione os ativos.</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setShowStockModal(true)}
            className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-1 ${
              resolvedTheme === "dark" 
                ? "bg-blue-600 hover:bg-blue-500 text-white" 
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            } transition`}
          >
            Selecionar Ações
          </button>
          <button
            onClick={() => setShowCryptoModal(true)}
            className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-1 ${
              resolvedTheme === "dark" 
                ? "bg-blue-600 hover:bg-blue-500 text-white" 
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            } transition`}
          >
            Selecionar Criptomoedas
          </button>
          <button
            onClick={() => setShowCommodityModal(true)}
            className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-1 ${
              resolvedTheme === "dark" 
                ? "bg-blue-600 hover:bg-blue-500 text-white" 
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            } transition`}
          >
            Selecionar Commodities
          </button>
          <button
            onClick={() => setShowIndexModal(true)}
            className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-1 ${
              resolvedTheme === "dark" 
                ? "bg-blue-600 hover:bg-blue-500 text-white" 
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            } transition`}
          >
            Selecionar Índices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-lg overflow-hidden border ${
      resolvedTheme === "dark" 
        ? "bg-gray-800 border-gray-700" 
        : "bg-white border-gray-200"
    }`}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Mercado Financeiro</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Acompanhamento de ativos em tempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-700/50 px-2 py-1 rounded">
                Atualizado: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refreshMarketData}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${
                resolvedTheme === "dark"
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              } transition shadow-sm`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        {/* Search Input */}
        <div className="mb-6 flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar ativo, criptomoeda ou commodity..."
            className={`w-full sm:w-96 px-4 py-2 rounded-md border focus:outline-none focus:ring-2 transition text-sm ${
              resolvedTheme === "dark"
                ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-600"
                : "bg-white border-gray-300 text-gray-900 focus:ring-blue-400"
            }`}
          />
        </div>
        {/* Índices - Cards */}
        {selectedIndices.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Índices</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja remover todos os índices?')) {
                      handleSetSelectedIndices([]);
                    }
                  }}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Remover Todos
                </button>
                <button
                  onClick={() => setShowIndexModal(true)}
                  className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${
                    resolvedTheme === "dark"
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  } transition`}
                >
                  <PlusIcon className="h-3 w-3" />
                  Adicionar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedIndices.map(indexSymbol => {
                // Garante que o símbolo tenha o prefixo ^
                const normalizedSymbol = indexSymbol.startsWith('^') ? indexSymbol : `^${indexSymbol}`;
                
                // Encontra os metadados do índice
                const indexInfo = customIndices.find(i => i.symbol === normalizedSymbol);
                
                // Encontra os dados de mercado
                const indexData = marketData?.indices?.find((i: StockData) => 
                  i.symbol === normalizedSymbol
                );

                console.log('Rendering index:', {
                  normalizedSymbol,
                  indexInfo,
                  indexData
                });

                return (
                  <div key={indexSymbol} className={`p-4 rounded-xl border ${
                    resolvedTheme === "dark"
                      ? "bg-gray-700/50 border-gray-600"
                      : "bg-white border-gray-200"
                  } shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        resolvedTheme === "dark"
                          ? "bg-blue-900/30 text-blue-300"
                          : "bg-blue-100 text-blue-600"
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {indexInfo?.name || getFriendlyName(normalizedSymbol)}
                      </h3>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {indexData?.price !== undefined
                          ? (
                            normalizedSymbol.includes('BRL=X')
                              ? formatValue(indexData.price, true)
                              : indexData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          )
                          : '--'}
                      </span>
                      {indexData?.changePercent !== undefined ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          indexData.changePercent >= 0
                            ? resolvedTheme === "dark"
                              ? "bg-green-900/30 text-green-300"
                              : "bg-green-100 text-green-800"
                            : resolvedTheme === "dark"
                              ? "bg-red-900/30 text-red-300"
                              : "bg-red-100 text-red-800"
                        }`}>
                          {indexData.changePercent >= 0 ? (
                            <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                          ) : (
                            <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                          )}
                          {Math.abs(indexData.changePercent).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          --
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ações - Tabela */}
        {stocks.length > 0 && (!searchTerm || filteredTableStocks.length > 0) && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Ações</h3>
              <div className="flex gap-2">
                {selectedStocks.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja remover todas as ações?')) {
                        setSelectedStocks([]);
                      }
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Remover Todas
                  </button>
                )}
                <button
                  onClick={() => setShowStockModal(true)}
                  className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${
                    resolvedTheme === "dark" 
                      ? "bg-blue-600 hover:bg-blue-500 text-white" 
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  } transition`}
                >
                  <PlusIcon className="h-3 w-3" />
                  Adicionar
                </button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={`${
                  resolvedTheme === "dark" 
                    ? "bg-gray-700 text-gray-300" 
                    : "bg-gray-50 text-gray-700"
                }`}>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Ativo</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Preço</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Variação</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Volume</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
                  resolvedTheme === "dark" 
                    ? "bg-gray-800/50" 
                    : "bg-white"
                }`}>
                  {(searchTerm ? filteredTableStocks : stocks).map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {stock.symbol.replace('.SA', '')}
                        {defaultStocks.includes(stock.symbol) && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Recomendada
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${
                        stock.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatValue(stock.price, true, stock.currency)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${
                        stock.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        <span className="inline-flex items-center">
                          {stock.changePercent >= 0 ? (
                            <ArrowUpIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownIcon className="h-3 w-3 mr-1" />
                          )}
                          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {stock.volume?.toLocaleString() || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Criptomoedas - Tabela */}
        {cryptos.length > 0 && (!searchTerm || filteredTableCryptos.length > 0) && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Criptomoedas</h3>
              <div className="flex gap-2">
                {selectedCryptos.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja remover todas as criptomoedas?')) {
                        setSelectedCryptos([]);
                      }
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Remover Todas
                  </button>
                )}
                <button
                  onClick={() => setShowCryptoModal(true)}
                  className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${
                    resolvedTheme === "dark" 
                      ? "bg-blue-600 hover:bg-blue-500 text-white" 
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  } transition`}
                >
                  <PlusIcon className="h-3 w-3" />
                  Adicionar
                </button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={`${
                  resolvedTheme === "dark" 
                    ? "bg-gray-700 text-gray-300" 
                    : "bg-gray-50 text-gray-700"
                }`}>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Criptomoeda</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Preço (USD)</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Variação (24h)</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Volume (24h)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
                  resolvedTheme === "dark" 
                    ? "bg-gray-800/50" 
                    : "bg-white"
                }`}>
                  {(searchTerm ? filteredTableCryptos : cryptos).map((crypto) => (
                    <tr key={crypto.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {crypto.symbol.replace('-USD', '')}
                        {defaultCryptos.includes(crypto.symbol) && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Recomendada
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${
                        crypto.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatValue(crypto.price, true, 'USD')}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${
                        crypto.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        <span className="inline-flex items-center">
                          {crypto.changePercent >= 0 ? (
                            <ArrowUpIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownIcon className="h-3 w-3 mr-1" />
                          )}
                          {crypto.changePercent >= 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {crypto.volume?.toLocaleString() || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Commodities - Tabela */}
        {commodities.length > 0 && (!searchTerm || filteredTableCommodities.length > 0) && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Commodities</h3>
              <div className="flex gap-2">
                {selectedCommodities.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja remover todas as commodities?')) {
                        setSelectedCommodities([]);
                      }
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Remover Todas
                  </button>
                )}
                <button
                  onClick={() => setShowCommodityModal(true)}
                  className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${
                    resolvedTheme === "dark" 
                      ? "bg-blue-600 hover:bg-blue-500 text-white" 
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  } transition`}
                >
                  <PlusIcon className="h-3 w-3" />
                  Adicionar
                </button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={`${
                  resolvedTheme === "dark" 
                    ? "bg-gray-700 text-gray-300" 
                    : "bg-gray-50 text-gray-700"
                }`}>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Commodity</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Preço</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Variação</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Volume</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
                  resolvedTheme === "dark" 
                    ? "bg-gray-800/50" 
                    : "bg-white"
                }`}>
                  {(searchTerm ? filteredTableCommodities : commodities).map((commodity) => (
                    <tr key={commodity.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {getCommodityDisplayName(commodity.symbol)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${
                        commodity.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatValue(commodity.price, true, 'USD')}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${
                        commodity.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        <span className="inline-flex items-center">
                          {commodity.changePercent >= 0 ? (
                            <ArrowUpIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownIcon className="h-3 w-3 mr-1" />
                          )}
                          {commodity.changePercent >= 0 ? '+' : ''}{commodity.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {commodity.volume?.toLocaleString() || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modais de seleção */}
      <AssetSelectionModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        onSave={(selected) => {
          setSelectedStocks(selected);
          refreshMarketData();
        }}
        currentSelected={selectedStocks}
        type="stocks"
        allOptions={availableStocks}
        defaultOptions={defaultStocks}
        title="Selecionar Ações"
      />
      <AssetSelectionModal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        onSave={(selected) => {
          setSelectedCryptos(selected);
          refreshMarketData();
        }}
        currentSelected={selectedCryptos}
        type="cryptos"
        allOptions={availableCryptos}
        defaultOptions={defaultCryptos}
        title="Selecionar Criptomoedas"
      />
      <AssetSelectionModal
        isOpen={showCommodityModal}
        onClose={() => setShowCommodityModal(false)}
        onSave={(selected) => {
          setSelectedCommodities(selected);
          refreshMarketData();
        }}
        currentSelected={selectedCommodities}
        type="commodities"
        allOptions={availableCommodities}
        title="Selecionar Commodities"
      />
      <AssetSelectionModal
        isOpen={showIndexModal}
        onClose={() => setShowIndexModal(false)}
        onSave={(selected) => {
          handleSetSelectedIndices(selected);
          refreshMarketData();
        }}
        currentSelected={selectedIndices}
        type="indices"
        allOptions={availableIndices}
        defaultOptions={defaultIndices}
        title="Selecionar Índices"
      />
    </div>
  );
};

export default FinanceMarket;