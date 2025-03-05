// components/Overview.tsx
export default function Overview() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Resumo Financeiro</h2>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-700 dark:text-gray-200">Saldo:</span>
          <span className="text-gray-900 dark:text-white font-semibold">R$ 5.000</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700 dark:text-gray-200">Receitas:</span>
          <span className="text-green-600 dark:text-green-400 font-semibold">R$ 8.000</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700 dark:text-gray-200">Despesas:</span>
          <span className="text-red-600 dark:text-red-400 font-semibold">R$ 3.000</span>
        </div>
      </div>
    </div>
  );
}