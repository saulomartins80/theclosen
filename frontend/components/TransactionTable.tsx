import React, { useState } from "react";
import { Edit, Trash2, ChevronUp, ChevronDown, ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
import { Transacao } from "../types/Transacao";

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
  theme: 'light' | 'dark' | 'system';
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transacoes,
  onEdit,
  onDelete,
  theme,
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transacao;
    direction: "asc" | "desc";
  } | null>(null);

  // Funções auxiliares seguras
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

  // Ordenação
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
    <div className={`border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-lg overflow-hidden`}>
      {/* Desktop (md para cima) */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}>
            <tr>
              {["descricao", "categoria", "valor", "data"].map((key) => (
                <th 
                  key={key}
                  className="px-4 py-2"
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
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          
          <tbody>
            {sortedTransacoes.map((transacao) => (
              <tr 
                key={getIdString(transacao)} 
                className={theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}
              >
                <td className="px-4 py-2">{transacao.descricao}</td>
                <td className="px-4 py-2">{transacao.categoria}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {transacao.tipo === "transferencia" && (
                      <div className={`p-1 rounded-full ${theme === 'dark' ? 'bg-yellow-900' : 'bg-yellow-100'}`}>
                        <RefreshCw size={14} className={theme === 'dark' ? 'text-yellow-300' : 'text-yellow-600'} />
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
                <td className="px-4 py-2">{formatDate(transacao.data)}</td>
                <td className="px-4 py-2 align-middle">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(transacao)}
                      className={`text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-gray-100 transition-colors ${
                        theme === 'dark' ? 'dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-gray-700' : ''
                      }`}
                      aria-label="Editar"
                    >
                      <Edit size={18} className="align-middle" />
                    </button>
                    <button
                      onClick={() => onDelete(getIdString(transacao))}
                      className={`text-red-600 hover:text-red-800 p-1 rounded hover:bg-gray-100 transition-colors ${
                        theme === 'dark' ? 'dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700' : ''
                      }`}
                      aria-label="Excluir"
                    >
                      <Trash2 size={18} className="align-middle" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  
      {/* Mobile (md para baixo) */}
      <div className={`md:hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        {sortedTransacoes.map((transacao) => (
          <div key={getIdString(transacao)} className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  {transacao.descricao}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatDate(transacao.data)}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => onEdit(transacao)}
                  className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}
                  aria-label="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => onDelete(getIdString(transacao))}
                  className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}
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
        <div className={`p-6 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Nenhuma transação encontrada
        </div>
      )}
    </div>
  );
};

export default TransactionTable;