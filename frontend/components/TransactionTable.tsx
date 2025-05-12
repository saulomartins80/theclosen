import React, { useState } from "react";
import { Edit, Trash2, ChevronUp, ChevronDown, ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
import { Transacao } from "../types/Transacao";
import { useTheme } from "../context/ThemeContext"; // Importar para usar resolvedTheme diretamente

// Tipo guards
function isMongoId(id: any): id is { $oid: string } {
  return id && typeof id === 'object' && '$oid' in id;
}

function isMongoDate(date: any): date is { $date: string } {
  return date && typeof date === 'object' && '$date' in date;
}

interface TransactionTableProps {
  transacoes: Transacao[];
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: string) => Promise<void>;
  // A prop theme pode ser removida se usarmos useTheme internamente para tudo
  // Por enquanto, vamos assumir que ela é o resolvedTheme ('light' | 'dark')
  theme: 'light' | 'dark'; 
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transacoes,
  onEdit,
  onDelete,
  // theme, // Poderia ser removido e usar resolvedTheme de useTheme() abaixo
}) => {
  const { resolvedTheme } = useTheme(); // Usar resolvedTheme diretamente
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transacao;
    direction: "asc" | "desc";
  } | null>(null);

  const getIdString = (transacao: Transacao): string => {
    return isMongoId(transacao._id) ? transacao._id.$oid : transacao._id as string;
  };

  const formatDate = (dateInput: string | { $date: string }): string => {
    const dateStr = isMongoDate(dateInput) ? dateInput.$date : dateInput as string;
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    }).format(value);

  // Esta função já usa classes dark: corretamente
  const getValueColor = (tipo: string, valor?: number) => {
    if (tipo === "transferencia") {
      return valor && valor >= 0 
        ? "text-blue-600 dark:text-blue-400" // Entrada
        : "text-purple-600 dark:text-purple-400"; // Saída
    }
    return tipo === "receita" 
      ? "text-green-600 dark:text-green-400" 
      : "text-red-600 dark:text-red-400";
  };

  const sortedTransacoes = [...transacoes].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (aValue === undefined || bValue === undefined) return 0;
    return sortConfig.direction === "asc"
      ? aValue > bValue ? 1 : -1
      : aValue > bValue ? -1 : 1;
  });

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Desktop (md para cima) */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <tr>
              {["descricao", "categoria", "valor", "data"].map((key) => (
                <th 
                  key={key}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  onClick={() => {
                    const direction = sortConfig?.key === key && sortConfig.direction === "asc" 
                      ? "desc" 
                      : "asc";
                    setSortConfig({ 
                      key: key as keyof Transacao, 
                      direction 
                    });
                  }}
                >
                  <div className="flex items-center gap-1">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    {sortConfig?.key === key && (
                      sortConfig.direction === "asc" 
                        ? <ChevronUp size={16} /> 
                        : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedTransacoes.map((transacao) => (
              <tr 
                key={getIdString(transacao)} 
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{transacao.descricao}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{transacao.categoria}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    {transacao.tipo === "transferencia" && (
                      <div className="p-1 rounded-full bg-yellow-100 dark:bg-yellow-900">
                        <RefreshCw size={14} className="text-yellow-600 dark:text-yellow-300" />
                      </div>
                    )}
                    <span className={getValueColor(transacao.tipo, transacao.valor)}>
                      {transacao.tipo === "transferencia" ? (
                        <span className="flex items-center gap-1">
                          {transacao.valor >= 0 ? (
                            <>
                              <ArrowDownCircle size={14} className="text-blue-600 dark:text-blue-400" />
                              {formatCurrency(transacao.valor)} (Entrada)
                            </>
                          ) : (
                            <>
                              <ArrowUpCircle size={14} className="text-purple-600 dark:text-purple-400" />
                              {formatCurrency(Math.abs(transacao.valor))} (Saída)
                            </>
                          )}
                        </span>
                      ) : (
                        formatCurrency(transacao.valor)
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{formatDate(transacao.data)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(transacao)}
                      className="p-1 rounded text-blue-600 hover:text-blue-800 hover:bg-gray-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(getIdString(transacao))}
                      className="p-1 rounded text-red-600 hover:text-red-800 hover:bg-gray-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  
      {/* Mobile (md para baixo) */}
      <div className="md:hidden bg-white dark:bg-gray-900">
        {sortedTransacoes.map((transacao) => (
          <div key={getIdString(transacao)} className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {transacao.descricao}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {transacao.categoria}
                </p>
              </div>
              <p className={`font-medium ${getValueColor(transacao.tipo, transacao.valor)}`}>
                {transacao.tipo === "transferencia" 
                  ? `${transacao.valor >= 0 ? '+' : '-'}${formatCurrency(Math.abs(transacao.valor))}`
                  : formatCurrency(transacao.valor)}
              </p>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(transacao.data)}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => onEdit(transacao)}
                  className="text-blue-600 dark:text-blue-400 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-gray-700"
                  aria-label="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => onDelete(getIdString(transacao))}
                  className="text-red-600 dark:text-red-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-gray-700"
                  aria-label="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
  
      {transacoes.length === 0 && (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          Nenhuma transação encontrada
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
