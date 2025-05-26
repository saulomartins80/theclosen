// components/ConfigurableTableSection.tsx
import React, { useState } from "react";
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useDashboard } from '../context/DashboardContext';

interface ConfigurableTableSectionProps {
  title: string;
  type: 'stocks' | 'cryptos';
  data: Array<{
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume?: number;
    currency?: string;
  }>;
  selectedItems: string[];
  availableOptions: string[];
  onEdit: () => void;
  resolvedTheme: 'light' | 'dark';
}

const ConfigurableTableSection: React.FC<ConfigurableTableSectionProps> = ({
  title,
  type,
  data,
  selectedItems,
  availableOptions,
  onEdit,
  resolvedTheme
}) => {
  const [showTable, setShowTable] = useState(true);

  // Importa as funções de remoção do contexto
  const { removeStock, removeCrypto } = useDashboard();

  if (selectedItems.length === 0 && !showTable) return null;

  return (
    <div className={`rounded-lg p-4 ${
      resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-50"
    }`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-lg">{title}</h3>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map(item => (
              <span 
                key={item}
                className={`px-2 py-1 rounded-full text-xs ${
                  resolvedTheme === "dark" 
                    ? type === 'stocks' 
                      ? "bg-blue-800 text-blue-200" 
                      : "bg-purple-800 text-purple-200"
                    : type === 'stocks' 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-purple-100 text-purple-800"
                }`}
              >
                {item.replace('-USD', '').replace('.SA', '')}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className={`px-3 py-1 rounded-md text-sm ${
              resolvedTheme === "dark" 
                ? type === 'stocks' 
                  ? "bg-blue-700 hover:bg-blue-600 text-white" 
                  : "bg-purple-700 hover:bg-purple-600 text-white"
                : type === 'stocks' 
                  ? "bg-blue-100 hover:bg-blue-200 text-blue-700" 
                  : "bg-purple-100 hover:bg-purple-200 text-purple-700"
            } transition`}
          >
            Editar {type === 'stocks' ? 'Ações' : 'Criptos'}
          </button>
          
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
              resolvedTheme === "dark" ? "bg-gray-600" : "bg-gray-200"
            }`}>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Ativo</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase">Preço</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase">Variação</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase">Volume</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase"></th> {/* Coluna para o botão de remover */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((item) => (
                <tr key={item.symbol}>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {item.symbol.replace('-USD', '').replace('.SA', '')}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-right ${
                    item.change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                  }`}>
                    {formatCurrency(item.price, item.currency)}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-right ${
                    item.changePercent >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                  }`}>
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">
                    {item.volume?.toLocaleString() || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {type === 'stocks' && (
                      <button
                        onClick={() => removeStock(item.symbol)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                        title="Remover"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                    {type === 'cryptos' && (
                      <button
                        onClick={() => removeCrypto(item.symbol)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                        title="Remover"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const formatCurrency = (value: number, currency: string = 'BRL'): string => {
  return value.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { 
    style: 'currency', 
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default ConfigurableTableSection;