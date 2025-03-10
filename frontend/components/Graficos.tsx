import React from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
} from "chart.js";
import { useFinance } from "../context/FinanceContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Transacao {
  data: string;
  tipo: string;
  valor: number;
}

const Graficos = () => {
  const { transactions } = useFinance();

  // Função para agrupar transações por mês
  const agruparPorMes = (transacoes: Transacao[]) => {
    const meses = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];
    return meses.map((mes, index) => {
      const transacoesDoMes = transacoes.filter((t) => {
        const data = new Date(t.data);
        return data.getMonth() === index;
      });

      const receitas = transacoesDoMes
        .filter((t) => t.tipo === "receita")
        .reduce((acc, t) => acc + t.valor, 0);

      const despesas = transacoesDoMes
        .filter((t) => t.tipo === "despesa")
        .reduce((acc, t) => acc + t.valor, 0);

      return { mes, receitas, despesas };
    });
  };

  // Dados para o gráfico de barras (Receitas vs Despesas)
  const dadosPorMes = agruparPorMes(transactions);
  const barChartData = {
    labels: dadosPorMes.map((d) => d.mes),
    datasets: [
      {
        label: "Receitas",
        data: dadosPorMes.map((d) => d.receitas),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        borderRadius: 5,
      },
      {
        label: "Despesas",
        data: dadosPorMes.map((d) => d.despesas),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
        borderRadius: 5,
      },
    ],
  };

  // Opções para o gráfico de barras
  const barChartOptions = {
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#6B7280",
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (tooltipItem: TooltipItem<"bar">) => {
            const label = tooltipItem.dataset.label || "";
            const value = tooltipItem.raw as number;
            return `${label}: R$ ${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "rgba(229, 231, 235, 0.2)",
        },
      },
    },
    animation: {
      duration: 1000,
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Dados para o gráfico de linhas (Evolução do Saldo)
  const saldoAcumulado = transactions
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .reduce((acc, t) => {
      const saldoAnterior = acc.length > 0 ? acc[acc.length - 1].saldo : 0;
      const novoSaldo = saldoAnterior + (t.tipo === "receita" ? t.valor : -t.valor);
      acc.push({ data: t.data, saldo: novoSaldo });
      return acc;
    }, [] as { data: string; saldo: number }[]);

  const lineChartData = {
    labels: saldoAcumulado.map((s) => {
      const date = new Date(s.data);
      return `${date.getDate()}/${date.toLocaleString("default", { month: "short" })}`;
    }),
    datasets: [
      {
        label: "Saldo",
        data: saldoAcumulado.map((s) => s.saldo),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Opções para o gráfico de linhas
  const lineChartOptions = {
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#6B7280",
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (tooltipItem: TooltipItem<"line">) => {
            const label = tooltipItem.dataset.label || "";
            const value = tooltipItem.raw as number;
            return `${label}: R$ ${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "rgba(229, 231, 235, 0.2)",
        },
      },
    },
    animation: {
      duration: 1000,
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Gráfico de Barras */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Receitas vs Despesas
        </h2>
        <div className="h-64">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>

      {/* Gráfico de Linhas */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Evolução do Saldo
        </h2>
        <div className="h-64">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Graficos;