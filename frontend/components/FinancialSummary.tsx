import React, { useState } from "react";
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      {/* Card: Saldo Atual */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
            <Wallet className="text-green-600 dark:text-green-300" size={20} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Saldo Atual</h2>
        </div>
        <p className={`text-2xl font-bold ${
          saldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}>
          R$ {saldo.toFixed(2)}
        </p>
      </div>

      {/* Card: Receitas */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
            <ArrowDownCircle className="text-blue-600 dark:text-blue-300" size={20} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Receitas</h2>
        </div>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          R$ {receitas.toFixed(2)}
        </p>
      </div>

      {/* Card: Despesas */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
            <ArrowUpCircle className="text-red-600 dark:text-red-300" size={20} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Despesas</h2>
        </div>
        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
          R$ {despesas.toFixed(2)}
        </p>
      </div>

      {/* Card: Transferências (atualizado) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <RefreshCw className="text-yellow-600 dark:text-yellow-300" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Transferências</h2>
          </div>
          <button 
            onClick={() => setShowTransferDetails(!showTransferDetails)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showTransferDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Valor principal sempre visível */}
        <p className={`text-2xl font-bold text-yellow-600 dark:text-yellow-400`}>
          R$ {saldoTransferencias.toFixed(2)}
        </p>

        {/* Detalhes (aparece apenas quando expandido) */}
        {showTransferDetails && (
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-blue-600 dark:text-blue-400">
              <span className="font-medium">Entradas:</span> R$ {transferenciasEntrada.toFixed(2)}
            </p>
            <p className="text-purple-600 dark:text-purple-400">
              <span className="font-medium">Saídas:</span> R$ {transferenciasSaida.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialSummary;