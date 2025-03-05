import React from "react";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";

// Registre os componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface ChartsSectionProps {
  transacoes: any[];
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ transacoes }) => {
  // Dados para o gráfico de pizza
  const dataPizza = {
    labels: ["Receitas", "Despesas", "Transferências"],
    datasets: [
      {
        data: [
          transacoes.filter((t) => t.tipo === "receita").length,
          transacoes.filter((t) => t.tipo === "despesa").length,
          transacoes.filter((t) => t.tipo === "transferencia").length,
        ],
        backgroundColor: ["#10B981", "#EF4444", "#3B82F6"],
      },
    ],
  };

  // Dados para o gráfico de barras
  const dataBarras = {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"], // Substitua pelos meses reais
    datasets: [
      {
        label: "Saldo",
        data: [2000, 3000, 2500, 3500, 4000, 5000], // Substitua pelos dados reais
        backgroundColor: "rgba(54, 162, 235, 0.8)",
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Gráfico de Pizza */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Distribuição por Tipo</h2>
        <div className="h-64">
          <Pie data={dataPizza} />
        </div>
      </div>

      {/* Gráfico de Barras */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Evolução do Saldo</h2>
        <div className="h-64">
          <Bar data={dataBarras} />
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;