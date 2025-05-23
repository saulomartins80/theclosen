// components/FinanceMarket.tsx
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import AssetSelectionModal from './AssetSelectionModal';

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
  setSelectedCommodities
}) => {
  const { resolvedTheme } = useTheme();
  const [newManualAsset, setNewManualAsset] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showCommodityModal, setShowCommodityModal] = useState(false);
  
  // Exemplos de ativos disponíveis
  const [availableStocks] = useState<string[]>([
    'PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 'BBAS3.SA', // Ações BR
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', // Ações EUA
    '^GSPC', '^IXIC', '^DJI' // Índices EUA
  ]);
  
  const [availableCryptos] = useState<string[]>([
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'DOGE-USD'
  ]);
  
  const [availableCommodities] = useState<string[]>([
    'GC=F', // Ouro
    'SI=F', // Prata
    'CL=F', // Petróleo
    'NG=F', // Gás Natural
    'ZC=F'  // Milho
  ]);

  const handleAddManualAsset = () => {
    if (newManualAsset.trim()) {
      const normalizedAsset = newManualAsset.trim().toUpperCase();
      if (!manualAssets.includes(normalizedAsset)) {
        setManualAssets([...manualAssets, normalizedAsset]);
        setNewManualAsset('');
      }
    }
  };

  const handleRemoveManualAsset = (asset: string) => {
    setManualAssets(manualAssets.filter(a => a !== asset));
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
      <div className="flex justify-center items-center py-10">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (marketError) {
    return (
      <div className="p-4 mb-6 rounded-lg bg-red-100 dark:bg-red-900">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-200">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>Erro ao carregar dados do mercado: {marketError}</span>
        </div>
        <button 
          onClick={refreshMarketData}
          className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!marketData) return null;

  return (
    <div className={`rounded-xl shadow overflow-hidden mb-8 ${
      resolvedTheme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold">Mercado Financeiro</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Atualizado em: {new Date(marketData.lastUpdated).toLocaleTimeString()}
            </span>
            <button 
              onClick={refreshMarketData}
              className={`text-sm px-3 py-1 rounded-lg ${
                resolvedTheme === "dark" 
                  ? "bg-blue-600 hover:bg-blue-500 text-white" 
                  : "bg-blue-100 hover:bg-blue-200 text-blue-700"
              } transition`}
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        {/* Índices Globais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Índice Brasileiro */}
          <div className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"
          }`}>
            <h3 className="font-semibold">IBOVESPA</h3>
            <div className="flex justify-between items-end mt-2">
              <span className="text-2xl font-bold">
                {marketData.indices['^BVSP']?.toLocaleString('pt-BR') || 'N/A'}
              </span>
              <span className={`text-sm px-2 py-1 rounded ${
                marketData.indices['^BVSP'] >= 0
                  ? resolvedTheme === "dark" ? "bg-green-800 text-green-200" : "bg-green-100 text-green-800"
                  : resolvedTheme === "dark" ? "bg-red-800 text-red-200" : "bg-red-100 text-red-800"
              }`}>
                {marketData.indices['^BVSP'] >= 0 ? '↑' : '↓'} {Math.abs(marketData.indices['^BVSP'] || 0).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Dólar */}
          <div className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"
          }`}>
            <h3 className="font-semibold">Dólar (USD/BRL)</h3>
            <div className="flex justify-between items-end mt-2">
              <span className="text-2xl font-bold">
                {formatValue(marketData.indices['BRL=X'] || 0, true)}
              </span>
              <span className={`text-sm px-2 py-1 rounded ${
                marketData.indices['BRL=X'] >= 0
                  ? resolvedTheme === "dark" ? "bg-green-800 text-green-200" : "bg-green-100 text-green-800"
                  : resolvedTheme === "dark" ? "bg-red-800 text-red-200" : "bg-red-100 text-red-800"
              }`}>
                {marketData.indices['BRL=X'] >= 0 ? '↑' : '↓'} {Math.abs(marketData.indices['BRL=X'] || 0).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* S&P 500 */}
          <div className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"
          }`}>
            <h3 className="font-semibold">S&P 500</h3>
            <div className="flex justify-between items-end mt-2">
              <span className="text-2xl font-bold">
                {marketData.indices['^GSPC']?.toLocaleString('en-US') || 'N/A'}
              </span>
              <span className={`text-sm px-2 py-1 rounded ${
                marketData.indices['^GSPC'] >= 0
                  ? resolvedTheme === "dark" ? "bg-green-800 text-green-200" : "bg-green-100 text-green-800"
                  : resolvedTheme === "dark" ? "bg-red-800 text-red-200" : "bg-red-100 text-red-800"
              }`}>
                {marketData.indices['^GSPC'] >= 0 ? '↑' : '↓'} {Math.abs(marketData.indices['^GSPC'] || 0).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Ações</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStockModal(true)}
                className={`px-3 py-1 rounded-md text-sm ${
                  resolvedTheme === "dark" 
                    ? "bg-blue-600 hover:bg-blue-500 text-white" 
                    : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                } transition`}
              >
                Editar Ações
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {selectedStocks.map(stock => (
              <span 
                key={stock}
                className={`px-3 py-1 rounded-full text-sm ${
                  resolvedTheme === "dark" 
                    ? "bg-blue-800 text-blue-200" 
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {stock.replace('.SA', '')}
              </span>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className={`${
                resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"
              }`}>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">Ativo</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase">Preço</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase">Variação</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {marketData.stocks.map((stock) => (
                  <tr key={stock.symbol}>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {stock.symbol.replace('.SA', '')}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-right ${
                      stock.change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                    }`}>
                      {formatValue(stock.price, true, stock.currency)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-right ${
                      stock.changePercent >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                    }`}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">
                      {stock.volume?.toLocaleString() || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Criptomoedas */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Criptomoedas</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCryptoModal(true)}
                className={`px-3 py-1 rounded-md text-sm ${
                  resolvedTheme === "dark" 
                    ? "bg-purple-600 hover:bg-purple-500 text-white" 
                    : "bg-purple-100 hover:bg-purple-200 text-purple-700"
                } transition`}
              >
                Editar Criptos
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
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

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className={`${
                resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"
              }`}>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">Criptomoeda</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase">Preço (USD)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase">Variação (24h)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase">Volume (24h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {marketData.cryptos.map((crypto) => (
                  <tr key={crypto.symbol}>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {crypto.symbol.replace('-USD', '')}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-right ${
                      crypto.change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                    }`}>
                      {formatValue(crypto.price, true, 'USD')}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-right ${
                      crypto.changePercent >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                    }`}>
                      {crypto.changePercent >= 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">
                      {crypto.volume?.toLocaleString() || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commodities */}
        {marketData.commodities && marketData.commodities.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Commodities</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCommodityModal(true)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    resolvedTheme === "dark" 
                      ? "bg-yellow-600 hover:bg-yellow-500 text-white" 
                      : "bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                  } transition`}
                >
                  Editar Commodities
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCommodities.map(commodity => (
                <span 
                  key={commodity}
                  className={`px-3 py-1 rounded-full text-sm ${
                    resolvedTheme === "dark" 
                      ? "bg-yellow-800 text-yellow-200" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {commodity.replace('=F', '')}
                </span>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={`${
                  resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase">Commodity</th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase">Preço</th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase">Variação</th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {marketData.commodities.map((commodity) => (
                    <tr key={commodity.symbol}>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        {commodity.symbol === 'GC=F' ? 'Ouro' : 
                         commodity.symbol === 'SI=F' ? 'Prata' : 
                         commodity.symbol === 'CL=F' ? 'Petróleo' : 
                         commodity.symbol === 'NG=F' ? 'Gás Natural' : 
                         commodity.symbol === 'ZC=F' ? 'Milho' : commodity.symbol.replace('=F', '')}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-right ${
                        commodity.change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                      }`}>
                        {formatValue(commodity.price, true, 'USD')}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-right ${
                        commodity.changePercent >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                      }`}>
                        {commodity.changePercent >= 0 ? '+' : ''}{commodity.changePercent.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">
                        {commodity.volume?.toLocaleString() || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ativos Manuais */}
        <div className="mt-8">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Ativos Manuais</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {manualAssets.map(asset => (
              <span
                key={asset}
                className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                  resolvedTheme === "dark"
                    ? "bg-gray-600 text-gray-200"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {asset.replace('-USD', '').replace('.SA', '')}
                <button 
                  onClick={() => handleRemoveManualAsset(asset)}
                  className="hover:opacity-70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Adicionar ativo manual (ex: PETR4, BTC, AAPL)"
              value={newManualAsset}
              onChange={(e) => setNewManualAsset(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddManualAsset()}
              className="flex-1 px-3 py-1 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleAddManualAsset}
              className={`px-3 py-1 rounded-md text-sm ${resolvedTheme === "dark" ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-100 hover:bg-blue-200 text-blue-700"} transition`}
            >
              Adicionar
            </button>
          </div>
        </div>
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
    </div>
  );
};

export default FinanceMarket;