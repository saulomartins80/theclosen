//components/financeMarket.tsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ExclamationTriangleIcon, XMarkIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon } from '@heroicons/react/24/outline';
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
  stocks: StockData[];
  cryptos: StockData[];
  indices: Record<string, number>;
  commodities: StockData[];
  lastUpdated: string;
}

interface FinanceMarketProps {
  marketData: MarketData | null;
  loadingMarketData: boolean;
  marketError: string | null;
  selectedStocks: string[];
  selectedCryptos: string[];
  selectedCommodities: string[];
  manualAssets: string[];
  customIndices: { symbol: string; name: string }[];
  setCustomIndices: (indices: { symbol: string; name: string }[]) => void;
  refreshMarketData: () => void;
  setManualAssets: (assets: string[]) => void;
  setSelectedStocks: (stocks: string[]) => void;
  setSelectedCryptos: (cryptos: string[]) => void;
  setSelectedCommodities: (commodities: string[]) => void;
}

const FinanceMarket: React.FC<FinanceMarketProps> = ({
  marketData,
  loadingMarketData,
  marketError,
  selectedStocks,
  selectedCryptos,
  selectedCommodities,
  manualAssets,
  customIndices,
  setCustomIndices,
  refreshMarketData,
  setManualAssets,
  setSelectedStocks,
  setSelectedCryptos,
  setSelectedCommodities,
}) => {
  const { resolvedTheme } = useTheme();
  const {
    addCustomIndex,
    removeCustomIndex,
    updateCustomIndex,
    availableStocks,
    availableCryptos,
    availableCommodities
  } = useDashboard();

  // Unified search state
  const [searchTerm, setSearchTerm] = useState('');
  const [newIndexSymbol, setNewIndexSymbol] = useState('');
  const [newIndexName, setNewIndexName] = useState('');
  const [newManualAsset, setNewManualAsset] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showCommodityModal, setShowCommodityModal] = useState(false);

  // Edição de índice customizado
  const [editingIndex, setEditingIndex] = useState<{symbol: string, name: string} | null>(null);

  // Estado para índices padrão removidos
  const [removedStandardIndices, setRemovedStandardIndices] = useState<string[]>([]);

  // Ações e criptos recomendadas
  const [defaultStocks] = useState(['PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'AAPL', 'MSFT']);
  const [defaultCryptos] = useState(['BTC-USD', 'ETH-USD', 'USDT-USD']);

  // Filtering logic
  const lowerSearchTerm = searchTerm.toLowerCase();

  const filteredCustomIndices = customIndices.filter(index =>
    index.name.toLowerCase().includes(lowerSearchTerm) ||
    index.symbol.toLowerCase().includes(lowerSearchTerm)
  );

  const filteredManualAssets = manualAssets.filter(asset =>
    asset.toLowerCase().includes(lowerSearchTerm)
  );

  const getCommodityDisplayName = (symbol: string): string => {
    if (symbol === 'GC=F') return 'Ouro';
    if (symbol === 'SI=F') return 'Prata';
    if (symbol === 'CL=F') return 'Petróleo';
    if (symbol === 'NG=F') return 'Gás Natural';
    if (symbol === 'ZC=F') return 'Milho';
    return symbol.replace('=F', '');
  };

  // Defensive: fallback para arrays vazias se marketData não estiver pronto
  const stocks = marketData?.stocks ?? [];
  const cryptos = marketData?.cryptos ?? [];
  const commodities = marketData?.commodities ?? [];
  const indices = marketData?.indices ?? {};
  const lastUpdated = marketData?.lastUpdated ?? '';

  // Defensive: fallback para arrays vazias se filtrando sem marketData
  const filteredTableStocks = stocks.filter(stock =>
    stock?.symbol?.toLowerCase?.().includes(lowerSearchTerm)
  );

  const filteredTableCryptos = cryptos.filter(crypto =>
    crypto?.symbol?.toLowerCase?.().includes(lowerSearchTerm)
  );

  const filteredTableCommodities = commodities.filter(commodity =>
    commodity?.symbol?.toLowerCase?.().includes(lowerSearchTerm) ||
    getCommodityDisplayName(commodity?.symbol ?? '').toLowerCase().includes(lowerSearchTerm)
  );

  // Defensive: fallback para empty object for indices
  const shouldShowIbovespa = !searchTerm || "ibovespa".includes(lowerSearchTerm) || "^bvsp".includes(lowerSearchTerm);
  const shouldShowDolar = !searchTerm || "dolar".includes(lowerSearchTerm) || "dólar".includes(lowerSearchTerm) || "brl=x".includes(lowerSearchTerm);
  const shouldShowSP500 = !searchTerm || "s&p 500".includes(lowerSearchTerm) || "sp500".includes(lowerSearchTerm) || "^gspc".includes(lowerSearchTerm);

  // Defensive: check for indices existence before accessing
  const hasIbovespa = indices && typeof indices['^BVSP'] !== 'undefined';
  const hasDolar = indices && typeof indices['BRL=X'] !== 'undefined';
  const hasSP500 = indices && typeof indices['^GSPC'] !== 'undefined';

  // Defensive: fallback for atLeastOneResult
  let atLeastOneResult =
    filteredCustomIndices.length > 0 ||
    filteredManualAssets.length > 0 ||
    (filteredTableStocks && filteredTableStocks.length > 0) ||
    (filteredTableCryptos && filteredTableCryptos.length > 0) ||
    (filteredTableCommodities && filteredTableCommodities.length > 0);

  if (shouldShowIbovespa && hasIbovespa) atLeastOneResult = true;
  if (shouldShowDolar && hasDolar) atLeastOneResult = true;
  if (shouldShowSP500 && hasSP500) atLeastOneResult = true;

  // Função para nomes amigáveis dos índices padrão
  const getFriendlyName = (symbol: string) => {
    const friendlyNames: Record<string, string> = {
      '^BVSP': 'IBOVESPA',
      'BRL=X': 'Dólar',
      '^GSPC': 'S&P 500',
      '^IXIC': 'NASDAQ',
      '^DJI': 'Dow Jones',
      'BTC-USD': 'Bitcoin',
      'GC=F': 'Ouro',
      'CL=F': 'Petróleo'
      // Adicione outros mapeamentos conforme necessário
    };
    return friendlyNames[symbol] || symbol;
  };

  // Handlers
  const handleAddCustomIndex = () => {
    const symbolToAdd = newIndexSymbol.trim().toUpperCase();
    const nameToAdd = newIndexName.trim() || getFriendlyName(symbolToAdd);

    if (symbolToAdd) {
      if (editingIndex) {
        // Atualizar índice customizado existente
        updateCustomIndex(editingIndex.symbol, { symbol: symbolToAdd, name: nameToAdd });
      } else {
        // Adicionar novo índice customizado
        addCustomIndex({ symbol: symbolToAdd, name: nameToAdd });
      }
      setNewIndexSymbol('');
      setNewIndexName('');
      setEditingIndex(null);
      // refreshMarketData() é chamado pelo useEffect no contexto
    }
  };

  const handleEditCustomIndex = (index: {symbol: string, name: string}) => {
    setEditingIndex(index);
    setNewIndexSymbol(index.symbol);
    setNewIndexName(index.name);
    document.getElementById('newIndexForm')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEditStandardIndex = (symbol: string) => {
    const friendlyName = getFriendlyName(symbol);
    setEditingIndex({ symbol, name: friendlyName });
    setNewIndexSymbol(symbol);
    setNewIndexName(friendlyName);
    document.getElementById('newIndexForm')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRemoveCustomIndex = (symbol: string) => {
    removeCustomIndex(symbol);
    // refreshMarketData() é chamado pelo useEffect no contexto
  };

  const handleRemoveStandardIndex = (symbol: string) => {
    if (window.confirm(`Remover ${getFriendlyName(symbol)}?`)) {
      setRemovedStandardIndices([...removedStandardIndices, symbol]);
    }
  };

  const handleAddManualAsset = () => {
    if (newManualAsset.trim()) {
      const normalizedAsset = newManualAsset.trim().toUpperCase();
      if (!manualAssets.includes(normalizedAsset)) {
        setManualAssets([...manualAssets, normalizedAsset]);
        setNewManualAsset('');
        // refreshMarketData() é chamado pelo useEffect no contexto
      }
    }
  };

  const handleRemoveManualAsset = (asset: string) => {
    setManualAssets(manualAssets.filter(a => a !== asset));
    // refreshMarketData() é chamado pelo useEffect no contexto
  };

  const formatValue = (value: number, isCurrency: boolean, currency: string = 'BRL') => {
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
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-700/50 px-2 py-1 rounded">
              Atualizado: {new Date(marketData.lastUpdated).toLocaleTimeString()}
            </span>
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
        {/* REMOVIDA A BARRA DE PESQUISA */}
        {/* REMOVIDA A BARRA QUE FICA PERTO DO ÍNDICE (apenas o botão de atualizar permanece) */}

        {/* Custom Indices */}
        {(!searchTerm || filteredCustomIndices.length > 0) && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-base sm:text-lg text-gray-800 dark:text-white">Índices Customizados</h3>
              <div className="flex gap-2">
                {customIndices.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja remover todos os índices?')) {
                        setCustomIndices([]);
                        refreshMarketData();
                      }
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Remover Todos
                  </button>
                )}
                <button
                  onClick={() => document.getElementById('newIndexForm')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Adicionar novo
                </button>
              </div>
            </div>
            
            {filteredCustomIndices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {filteredCustomIndices.map(index => (
                  <div key={index.symbol} className={`p-3 rounded-lg border ${
                    resolvedTheme === "dark" 
                      ? "bg-gray-700/50 border-gray-600" 
                      : "bg-white border-gray-200"
                  } shadow-sm relative group`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{index.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{index.symbol}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditCustomIndex(index)}
                          className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRemoveCustomIndex(index.symbol)}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                          title="Remover"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-4 rounded-lg text-center ${
                resolvedTheme === "dark" 
                  ? "bg-gray-700/30 border border-gray-600" 
                  : "bg-gray-50 border border-gray-200"
              }`}>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum índice customizado adicionado</p>
              </div>
            )}
            
            {!searchTerm && (
              <div id="newIndexForm" className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-sm mb-3 text-gray-800 dark:text-gray-200">
                  {editingIndex ? 'Editar Índice' : 'Adicionar novo índice customizado'}
                </h4>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Selecione o Índice
                  </label>
                  <select
                    value={newIndexSymbol}
                    onChange={(e) => setNewIndexSymbol(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                  >
                    <option value="">Selecione...</option>
                    <option value="IBOVESPA">IBOVESPA</option>
                    <option value="DOLAR">Dólar Americano</option>
                    <option value="SP500">S&P 500</option>
                    <option value="NASDAQ">NASDAQ</option>
                    <option value="DOWJONES">Dow Jones</option>
                    <option value="BITCOIN">Bitcoin</option>
                    <option value="OURO">Ouro</option>
                    <option value="PETROLEO">Petróleo</option>
                    {/* Adicione mais opções conforme necessário */}
                  </select>
                </div>
                <div>
                  <label htmlFor="indexName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome de Exibição (opcional)
                  </label>
                  <input
                    id="indexName"
                    name="indexName"
                    type="text"
                    placeholder="Nome amigável (ex: S&P 500)"
                    value={newIndexName}
                    onChange={(e) => setNewIndexName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleAddCustomIndex}
                    disabled={!newIndexSymbol.trim()}
                    className={`px-4 py-2 rounded-md text-sm flex items-center justify-center gap-1 flex-1 ${
                      !newIndexSymbol.trim()
                        ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                        : resolvedTheme === "dark"
                          ? "bg-blue-600 hover:bg-blue-500 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                    } transition`}
                  >
                    {editingIndex ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                    {editingIndex ? 'Salvar Edição' : 'Adicionar Índice'}
                  </button>
                  {editingIndex && (
                    <button
                      onClick={() => {
                        setEditingIndex(null);
                        setNewIndexSymbol('');
                        setNewIndexName('');
                      }}
                      className="px-4 py-2 rounded-md text-sm flex items-center justify-center gap-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Default Indices Grid */}
        {(marketData.indices['^BVSP'] || marketData.indices['BRL=X'] || marketData.indices['^GSPC']) && (shouldShowIbovespa || shouldShowDolar || shouldShowSP500 || !searchTerm) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {shouldShowIbovespa && marketData.indices['^BVSP'] && !removedStandardIndices.includes('^BVSP') && (
              <div className={`p-4 rounded-xl border ${
                resolvedTheme === "dark" 
                  ? "bg-gray-700/50 border-gray-600" 
                  : "bg-white border-gray-200"
              } shadow-sm hover:shadow-md transition-shadow relative group`}>
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
                  <h3 className="font-semibold text-gray-800 dark:text-white">{getFriendlyName('^BVSP')}</h3>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {marketData.indices['^BVSP']?.toLocaleString('pt-BR') || 'N/A'}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    marketData.indices['^BVSP'] >= 0
                      ? resolvedTheme === "dark" 
                        ? "bg-green-900/30 text-green-300" 
                        : "bg-green-100 text-green-800"
                      : resolvedTheme === "dark" 
                        ? "bg-red-900/30 text-red-300" 
                        : "bg-red-100 text-red-800"
                  }`}>
                    {marketData.indices['^BVSP'] >= 0 ? (
                      <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(marketData.indices['^BVSP'] || 0).toFixed(2)}%
                  </span>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditStandardIndex('^BVSP')}
                    className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition"
                    title="Editar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemoveStandardIndex('^BVSP')}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                    title="Remover"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            {shouldShowDolar && marketData.indices['BRL=X'] && !removedStandardIndices.includes('BRL=X') && (
              <div className={`p-4 rounded-xl border ${
                resolvedTheme === "dark" 
                  ? "bg-gray-700/50 border-gray-600" 
                  : "bg-white border-gray-200"
              } shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    resolvedTheme === "dark" 
                      ? "bg-green-900/30 text-green-300" 
                      : "bg-green-100 text-green-600"
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{getFriendlyName('BRL=X')}</h3>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatValue(marketData.indices['BRL=X'] || 0, true)}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    marketData.indices['BRL=X'] >= 0
                      ? resolvedTheme === "dark" 
                        ? "bg-green-900/30 text-green-300" 
                        : "bg-green-100 text-green-800"
                      : resolvedTheme === "dark" 
                        ? "bg-red-900/30 text-red-300" 
                        : "bg-red-100 text-red-800"
                  }`}>
                    {marketData.indices['BRL=X'] >= 0 ? (
                      <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(marketData.indices['BRL=X'] || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
            
            {shouldShowSP500 && marketData.indices['^GSPC'] && !removedStandardIndices.includes('^GSPC') && (
              <div className={`p-4 rounded-xl border ${
                resolvedTheme === "dark" 
                  ? "bg-gray-700/50 border-gray-600" 
                  : "bg-white border-gray-200"
              } shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    resolvedTheme === "dark" 
                      ? "bg-purple-900/30 text-purple-300" 
                      : "bg-purple-100 text-purple-600"
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{getFriendlyName('^GSPC')}</h3>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {marketData.indices['^GSPC']?.toLocaleString('en-US') || 'N/A'}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    marketData.indices['^GSPC'] >= 0
                      ? resolvedTheme === "dark" 
                        ? "bg-green-900/30 text-green-300" 
                        : "bg-green-100 text-green-800"
                      : resolvedTheme === "dark" 
                        ? "bg-red-900/30 text-red-300" 
                        : "bg-red-100 text-red-800"
                  }`}>
                    {marketData.indices['^GSPC'] >= 0 ? (
                      <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(marketData.indices['^GSPC'] || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stocks Table */}
        {(!searchTerm || (filteredTableStocks && filteredTableStocks.length > 0)) && marketData.stocks.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Ações</h3>
              <div className="flex gap-2">
                {selectedStocks.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja remover todas as ações?')) {
                        setSelectedStocks([]);
                        refreshMarketData();
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
                  {(searchTerm ? filteredTableStocks ?? [] : marketData.stocks ?? []).map((stock) => (
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

        {/* Cryptocurrencies Table */}
        {(!searchTerm || (filteredTableCryptos && filteredTableCryptos.length > 0)) && marketData.cryptos.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Criptomoedas</h3>
              <div className="flex gap-2">
                {selectedCryptos.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja remover todas as criptomoedas?')) {
                        setSelectedCryptos([]);
                        refreshMarketData();
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
                  {(searchTerm ? (filteredTableCryptos ?? []) : (marketData.cryptos ?? [])).map((crypto) => (
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

        {/* Commodities Table */}
        {(!searchTerm || (filteredTableCommodities && filteredTableCommodities.length > 0)) && marketData.commodities && marketData.commodities.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Commodities</h3>
              <div className="flex gap-2">
                {selectedCommodities.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja remover todas as commodities?')) {
                        setSelectedCommodities([]);
                        refreshMarketData();
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
                  {(searchTerm ? filteredTableCommodities : marketData.commodities).map((commodity) => (
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

        {/* Manual Assets */}
        {(!searchTerm || filteredManualAssets.length > 0) && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Ativos Manuais</h3>
              {!searchTerm && (
                <button
                  onClick={() => document.getElementById('manualAssetForm')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Adicionar novo
                </button>
              )}
            </div>
            
            {filteredManualAssets.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
                {filteredManualAssets.map(asset => (
                  <div key={asset} className={`p-3 rounded-lg border ${
                    resolvedTheme === "dark" 
                      ? "bg-gray-700/50 border-gray-600" 
                      : "bg-white border-gray-200"
                  } shadow-sm`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {asset.replace('-USD', '').replace('.SA', '')}
                      </span>
                      <button
                        onClick={() => handleRemoveManualAsset(asset)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-4 rounded-lg text-center ${
                resolvedTheme === "dark" 
                  ? "bg-gray-700/30 border border-gray-600" 
                  : "bg-gray-50 border border-gray-200"
              }`}>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum ativo manual adicionado</p>
              </div>
            )}
            
            {!searchTerm && (
              <div id="manualAssetForm" className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-sm mb-3 text-gray-800 dark:text-gray-200">Adicionar ativo manual</h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Ex: PETR4, BTC, AAPL"
                    value={newManualAsset}
                    onChange={(e) => setNewManualAsset(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddManualAsset()}
                    className="flex-1 px-3 py-2 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddManualAsset}
                    disabled={!newManualAsset.trim()}
                    className={`px-4 py-2 rounded-md text-sm flex items-center justify-center gap-1 ${
                      resolvedTheme === "dark" 
                        ? "bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-600" 
                        : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
                    } transition`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modais de seleção */}
      <AssetSelectionModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        onSave={(selected) => {
          setSelectedStocks(selected);
          // refreshMarketData() é chamado pelo useEffect no contexto
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
          // refreshMarketData() é chamado pelo useEffect no contexto
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
          // refreshMarketData() é chamado pelo useEffect no contexto
        }}
        currentSelected={selectedCommodities}
        type="commodities"
        allOptions={availableCommodities}
        title="Selecionar Commodities"
      />
    </div>
  );
};

export default FinanceMarket;