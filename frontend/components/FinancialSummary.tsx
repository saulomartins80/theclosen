import React from "react";

interface FinancialSummaryProps {
  saldo: number;
  receitas: number;
  despesas: number;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ saldo, receitas, despesas }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Card: Saldo Atual */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold">Saldo Atual</h2>
        <p className={`text-2xl font-bold ${saldo >= 0 ? "text-green-500" : "text-red-500"}`}>
          R$ {saldo.toFixed(2)}
        </p>
      </div>

      {/* Card: Receitas */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold">Receitas</h2>
        <p className="text-2xl font-bold text-blue-500">R$ {receitas.toFixed(2)}</p>
      </div>

      {/* Card: Despesas */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold">Despesas</h2>
        <p className="text-2xl font-bold text-red-500">R$ {despesas.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default FinancialSummary;