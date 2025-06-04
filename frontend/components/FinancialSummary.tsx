import React, { useState } from "react";
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Minus
} from "lucide-react";
import { motion } from "framer-motion";

interface FinancialSummaryProps {
  saldo?: number;
  receitas?: number;
  despesas?: number;
  transferenciasEntrada?: number;
  transferenciasSaida?: number;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ 
  saldo = 0, 
  receitas = 0, 
  despesas = 0,
  transferenciasEntrada = 0,
  transferenciasSaida = 0
}) => {
  const [showTransferDetails, setShowTransferDetails] = useState(false);
  const saldoTransferencias = transferenciasEntrada - transferenciasSaida;

  // Formatação de valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card: Saldo Atual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-emerald-500"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Saldo Atual</p>
            <p className={`text-2xl font-bold ${
              saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}>
              {formatCurrency(saldo)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Wallet className="text-emerald-600 dark:text-emerald-400" size={20} />
          </div>
        </div>
        <div className="mt-3 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              saldo >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.min(100, Math.abs(saldo) / (Math.max(receitas, despesas) || 1) * 100)}%` 
            }}
            transition={{ duration: 1.5 }}
          />
        </div>
      </motion.div>

      {/* Card: Receitas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-blue-500"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Receitas</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(receitas)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <ArrowDownCircle className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {transferenciasEntrada > 0 && `+ ${formatCurrency(transferenciasEntrada)} em transferências`}
          </span>
        </div>
      </motion.div>

      {/* Card: Despesas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-rose-500"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Despesas</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(despesas)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
            <ArrowUpCircle className="text-rose-600 dark:text-rose-400" size={20} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {transferenciasSaida > 0 && `- ${formatCurrency(transferenciasSaida)} em transferências`}
          </span>
        </div>
      </motion.div>

      {/* Card: Transferências */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-yellow-500"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Transferências</p>
            <p className={`text-2xl font-bold ${
              saldoTransferencias >= 0 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-purple-600 dark:text-purple-400"
            }`}>
              {saldoTransferencias >= 0 ? '+' : '-'}{formatCurrency(Math.abs(saldoTransferencias))}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
            <RefreshCw className="text-yellow-600 dark:text-yellow-400" size={20} />
          </div>
        </div>
        
        <button 
          onClick={() => setShowTransferDetails(!showTransferDetails)}
          className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showTransferDetails ? (
            <>
              <ChevronUp size={14} /> Ocultar detalhes
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Ver detalhes
            </>
          )}
        </button>

        {showTransferDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 text-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus size={14} className="text-blue-500 dark:text-blue-400" />
                <span className="text-gray-600 dark:text-gray-300">Entradas</span>
              </div>
              <span className="text-blue-600 dark:text-blue-400">
                {formatCurrency(transferenciasEntrada)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus size={14} className="text-purple-500 dark:text-purple-400" />
                <span className="text-gray-600 dark:text-gray-300">Saídas</span>
              </div>
              <span className="text-purple-600 dark:text-purple-400">
                {formatCurrency(transferenciasSaida)}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default FinancialSummary;