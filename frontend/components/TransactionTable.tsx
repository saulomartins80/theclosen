//frontnd/comeponents/TransactionTanble.tsx
import React, { useState } from "react";
import { 
  Edit, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Transacao } from "../types/Transacao";
import { useTheme } from "../context/ThemeContext";

// Tipo guards
function isMongoId(id: unknown): id is { $oid: string } {
  return typeof id === 'object' && id !== null && '$oid' in id;
}

function isMongoDate(date: unknown): date is { $date: string } {
  return typeof date === 'object' && date !== null && '$date' in date;
}

interface TransactionTableProps {
  transacoes: Transacao[];
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: string) => Promise<void>;
  theme: 'light' | 'dark'; 
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transacoes,
  onEdit,
  onDelete,
  theme,
}) => {
  const { resolvedTheme } = useTheme();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transacao;
    direction: "asc" | "desc";
  } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const getIdString = (transacao: Transacao): string => {
    return isMongoId(transacao._id) ? transacao._id.$oid : transacao._id as string;
  };

  const formatDate = (dateInput: string | { $date: string }): string => {
    const dateStr = isMongoDate(dateInput) ? dateInput.$date : dateInput as string;
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateInput: string | { $date: string }): string => {
    const dateStr = isMongoDate(dateInput) ? dateInput.$date : dateInput as string;
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pt-BR", {
      hour: '2-digit',
      minute: '2-digit'
    });
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
        ? "text-blue-600 dark:text-blue-400" 
        : "text-purple-600 dark:text-purple-400";
    }
    return tipo === "receita" 
      ? "text-green-600 dark:text-green-400" 
      : "text-red-600 dark:text-red-400";
  };

  const getTipoIcon = (tipo: string, valor?: number) => {
    switch(tipo) {
      case "receita":
        return <TrendingUp size={16} className="text-green-500 dark:text-green-400" />;
      case "despesa":
        return <TrendingDown size={16} className="text-red-500 dark:text-red-400" />;
      case "transferencia":
        return valor && valor >= 0 
          ? <ArrowDownCircle size={16} className="text-blue-500 dark:text-blue-400" />
          : <ArrowUpCircle size={16} className="text-purple-500 dark:text-purple-400" />;
      default:
        return <RefreshCw size={16} className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const sortedTransacoes = [...transacoes].sort((a, b) => {
    if (!sortConfig) return 0;
    
    // Tratamento especial para valores
    if (sortConfig.key === "valor") {
      return sortConfig.direction === "asc" 
        ? a.valor - b.valor 
        : b.valor - a.valor;
    }
    
    // Tratamento especial para datas
    if (sortConfig.key === "data") {
      const dateA = isMongoDate(a.data) ? new Date(a.data.$date) : new Date(a.data as string);
      const dateB = isMongoDate(b.data) ? new Date(b.data.$date) : new Date(b.data as string);
      return sortConfig.direction === "asc" 
        ? dateA.getTime() - dateB.getTime() 
        : dateB.getTime() - dateA.getTime();
    }
    
    // Ordenação padrão para strings
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (aValue === undefined || bValue === undefined) return 0;
    
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Desktop (md para cima) */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} text-gray-700 dark:text-gray-300`}>
            <tr>
              {["descricao", "categoria", "valor", "data", "tipo"].map((key) => (
                <th 
                  key={key}
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
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
                    {key === "valor" ? "Valor (R$)" : 
                     key === "data" ? "Data" : 
                     key.charAt(0).toUpperCase() + key.slice(1)}
                    {sortConfig?.key === key && (
                      sortConfig.direction === "asc" 
                        ? <ChevronUp size={16} /> 
                        : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          
          <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
            {sortedTransacoes.map((transacao) => {
              const id = getIdString(transacao);
              const isExpanded = expandedRows[id];
              
              return (
                <React.Fragment key={id}>
                  <tr 
                    className={`${resolvedTheme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                    onClick={() => toggleRowExpand(id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          transacao.tipo === "receita" ? "bg-green-100 dark:bg-green-900/30" :
                          transacao.tipo === "despesa" ? "bg-red-100 dark:bg-red-900/30" :
                          "bg-blue-100 dark:bg-blue-900/30"
                        }`}>
                          {getTipoIcon(transacao.tipo, transacao.valor)}
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {transacao.descricao}
                          </div>
                          <div className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {transacao.conta}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        resolvedTheme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {transacao.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${getValueColor(transacao.tipo, transacao.valor)}`}>
                        {transacao.tipo === "transferencia" 
                          ? `${transacao.valor >= 0 ? '+' : '-'}${formatCurrency(Math.abs(transacao.valor))}`
                          : formatCurrency(transacao.valor)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {formatDate(transacao.data)}
                      </div>
                      <div className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {/* Linha removida */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        transacao.tipo === "receita" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400" :
                        transacao.tipo === "despesa" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400" :
                        transacao.valor >= 0 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400" :
                        "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400"
                      }`}>
                        {transacao.tipo === "transferencia" 
                          ? transacao.valor >= 0 ? "Transferência (Entrada)" : "Transferência (Saída)"
                          : transacao.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(transacao);
                          }}
                          className={`p-1.5 rounded-full ${
                            resolvedTheme === 'dark' 
                              ? 'text-blue-400 hover:bg-gray-700' 
                              : 'text-blue-600 hover:bg-gray-100'
                          }`}
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(id);
                          }}
                          className={`p-1.5 rounded-full ${
                            resolvedTheme === 'dark' 
                              ? 'text-red-400 hover:bg-gray-700' 
                              : 'text-red-600 hover:bg-gray-100'
                          }`}
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Linha expandida com detalhes */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`${resolvedTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}
                      >
                        <td colSpan={6} className="px-6 py-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Data Completa
                              </p>
                              <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(
                                  isMongoDate(transacao.data) 
                                    ? transacao.data.$date 
                                    : transacao.data as string
                                ).toLocaleString("pt-BR", {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Conta
                              </p>
                              <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {transacao.conta}
                              </p>
                            </div>
                            {transacao.observacao && (
                              <div className="col-span-2">
                                <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Observação
                                </p>
                                <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {transacao.observacao}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
  
      {/* Mobile (md para baixo) */}
      <div className="md:hidden">
        {sortedTransacoes.map((transacao) => {
          const id = getIdString(transacao);
          const isExpanded = expandedRows[id];
          
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`p-4 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} ${
                resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              <div 
                className="flex justify-between items-start cursor-pointer"
                onClick={() => toggleRowExpand(id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    transacao.tipo === "receita" ? "bg-green-100 dark:bg-green-900/30" :
                    transacao.tipo === "despesa" ? "bg-red-100 dark:bg-red-900/30" :
                    transacao.valor >= 0 ? "bg-blue-100 dark:bg-blue-900/30" :
                    "bg-purple-100 dark:bg-purple-900/30"
                  }`}>
                    {getTipoIcon(transacao.tipo, transacao.valor)}
                  </div>
                  <div>
                    <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {transacao.descricao}
                    </p>
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {transacao.categoria}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${getValueColor(transacao.tipo, transacao.valor)}`}>
                    {transacao.tipo === "transferencia" 
                      ? `${transacao.valor >= 0 ? '+' : '-'}${formatCurrency(Math.abs(transacao.valor))}`
                      : formatCurrency(transacao.valor)}
                  </p>
                  <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatDate(transacao.data)}
                  </p>
                </div>
              </div>
              
              {/* Detalhes expandidos */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Tipo
                        </p>
                        <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {transacao.tipo === "transferencia" 
                            ? transacao.valor >= 0 ? "Transferência (Entrada)" : "Transferência (Saída)"
                            : transacao.tipo}
                        </p>
                      </div>
                      <div>
                        <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Conta
                        </p>
                        <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {transacao.conta}
                        </p>
                      </div>
                      <div>
                        <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Data/Hora
                        </p>
                        <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTime(transacao.data)}
                        </p>
                      </div>
                      {transacao.observacao && (
                        <div className="col-span-2">
                          <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Observação
                          </p>
                          <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {transacao.observacao}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(transacao);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 ${
                          resolvedTheme === 'dark' 
                            ? 'text-blue-400 bg-gray-700 hover:bg-gray-600' 
                            : 'text-blue-600 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <Edit size={14} /> Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(id);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 ${
                          resolvedTheme === 'dark' 
                            ? 'text-red-400 bg-gray-700 hover:bg-gray-600' 
                            : 'text-red-600 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
  
      {transacoes.length === 0 && (
        <div className={`p-6 text-center ${resolvedTheme === 'dark' ? 'text-gray-400 bg-gray-900' : 'text-gray-500 bg-white'}`}>
          Nenhuma transação encontrada
        </div>
      )}
    </div>
  );
};

export default TransactionTable;