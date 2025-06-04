// components/ConfigurableTableSection.tsx
import React, { useState } from "react";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useDashboard } from '../context/DashboardContext';
import { useTheme } from "../context/ThemeContext";
import { ArrowUp, ArrowDown } from 'lucide-react';

type AssetCategory = 'stocks' | 'cryptos' | 'commodities' | 'fiis' | 'etfs' | 'currencies' | 'indices';

interface ConfigurableTableSectionProps {
  title: string;
  category: AssetCategory;
  displayFormatter?: (symbol: string) => string;
  showVolume?: boolean;
}

const ConfigurableTableSection: React.FC<ConfigurableTableSectionProps> = ({
  title,
  category,
  displayFormatter,
  showVolume = true
}) => {
  const [showTable, setShowTable] = useState(true);
  const { resolvedTheme } = useTheme();
  const { 
    marketData,
    selectedStocks,
    selectedCryptos,
    selectedCommodities,
    selectedFiis,
    selectedEtfs,
    selectedCurrencies,
    customIndices, // Access customIndices from context
    removeStock,
    removeCrypto,
    removeCommodity,
    removeFii,
    removeEtf,
    removeCurrency,
    removeCustomIndex,
    setSelectedStocks,
    setSelectedCryptos,
    setSelectedCommodities,
    setSelectedFiis,
    setSelectedEtfs,
    setSelectedCurrencies,
    setCustomIndices
  } = useDashboard();

  // Obter dados da categoria específica (agora marketData.indices é um array)
  const data = marketData?.[category] || [];

  // Obter itens selecionados para a categoria
  const selectedItems = (() => {
    switch (category) {
      case 'stocks': return selectedStocks;
      case 'cryptos': return selectedCryptos;
      case 'commodities': return selectedCommodities;
      case 'fiis': return selectedFiis;
      case 'etfs': return selectedEtfs;
      case 'currencies': return selectedCurrencies;
      // For indices, use the symbols from the customIndices array
      case 'indices': return customIndices.map(index => index.symbol);
      default: return [];
    }
  })();

  // Determinar a função de remoção correta
  const removeAsset = (() => {
    switch (category) {
      case 'indices':
        return (symbol: string) => {
          removeCustomIndex(symbol); // Usar a função do contexto
        };
      case 'stocks': return removeStock;
      case 'cryptos': return removeCrypto;
      case 'commodities': return removeCommodity;
      case 'fiis': return removeFii;
      case 'etfs': return removeEtf;
      case 'currencies': return removeCurrency;
      default: return () => {};
    }
  })();

  // Determinar a função de atualização de seleção
  const setSelectedItemsHandler = (() => {
    switch (category) {
      case 'stocks': return setSelectedStocks;
      case 'cryptos': return setSelectedCryptos;
      case 'commodities': return setSelectedCommodities;
      case 'fiis': return setSelectedFiis;
      case 'etfs': return setSelectedEtfs;
      case 'currencies': return setSelectedCurrencies;
      case 'indices': return (symbolsToKeep: string[]) => {
        // Update customIndices based on the symbols to keep
        const newCustomIndices = customIndices.filter(index => symbolsToKeep.includes(index.symbol));
        setCustomIndices(newCustomIndices);
      };
      default: return () => {};
    }
  })();

  // Melhorar a função defaultDisplayFormatter
  const defaultDisplayFormatter = (symbol: string) => {
    if (category === 'indices') {
      const indexInfo = customIndices.find(idx => idx.symbol === symbol);
      return indexInfo?.name || symbol.replace('^', '');
    }
    return symbol
      .replace('.SA', '')
      .replace('-USD', '')
      .replace('=X', '')
      .replace('=F', '')
      .replace('^', '');
  };

  const formatValue = (value: number | undefined, currency: string = 'BRL') => {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    return value.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPercentage = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (data.length === 0 && !showTable) return null;

  return (
    <div className={`rounded-lg p-4 mb-6 ${
      resolvedTheme === "dark" ? "bg-gray-800" : "bg-gray-50"
    }`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{title}</h3>
          {selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedItems.map(item => (
                <span 
                  key={item}
                  className={`px-2 py-1 rounded-full text-xs ${
                    resolvedTheme === "dark" 
                      ? "bg-blue-800 text-blue-200"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {/* Use item.name if available, otherwise displayFormatter */}
                   {/* Need to get the name from customIndices or data for indices category */}
                   {category === 'indices' 
                     ? (customIndices.find(idx => idx.symbol === item)?.name || defaultDisplayFormatter(item)) 
                     : (data.find(d => d.symbol === item)?.name || (displayFormatter ? displayFormatter(item) : defaultDisplayFormatter(item)))}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`Tem certeza que deseja remover todos os ${title.toLowerCase()}?`)) {
                  // Use the correct handler for setting selected items
                  setSelectedItemsHandler([]);
                }
              }}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Remover Todas
            </button>
          )}
          <button
            onClick={() => setShowTable(!showTable)}
            className={`px-3 py-1 rounded-md text-sm ${
              resolvedTheme === "dark" 
                ? "bg-gray-600 hover:bg-gray-500 text-white" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            } transition`}
          >
            {showTable ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>

      {showTable && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={`${
              resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-200"
            }`}>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Ativo</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase">Preço</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase">Variação</th>
                {showVolume && (
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase">Volume</th>
                )}
                <th className="px-4 py-2 text-right text-xs font-medium uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((item) => (
                <tr key={item.symbol}>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {category === 'indices'
                      ? (customIndices.find(idx => idx.symbol === item.symbol)?.name || defaultDisplayFormatter(item.symbol))
                      : item.name || defaultDisplayFormatter(item.symbol)}
                    <span className="ml-2 text-xs opacity-70">
                      ({defaultDisplayFormatter(item.symbol)})
                    </span>
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-right ${
                    item.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatValue(item.price, item.currency)}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-right ${
                    item.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    <span className="inline-flex items-center">
                      {item.changePercent >= 0 ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      )}
                      {formatPercentage(item.changePercent)}
                    </span>
                  </td>
                  {showVolume && (
                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">
                      {item.volume?.toLocaleString() || '-'}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => removeAsset(item.symbol)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                      title="Remover"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showTable && data.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Nenhum dado disponível para esta seção.
        </div>
      )}
    </div>
  );
};

export default ConfigurableTableSection;