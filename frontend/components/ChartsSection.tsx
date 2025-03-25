import React from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  TooltipItem,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface Transacao {
  tipo: string;
  valor: number;
  data: string | { $date: string }; // Adicionei o campo data
}

interface ChartsSectionProps {
  transacoes: Transacao[];
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ transacoes }) => {
  // Função para parsear a data corretamente
  const parseDate = (date: string | { $date: string }): Date => {
    try {
      const dateString = typeof date === 'string' ? date : date.$date;
      return new Date(dateString);
    } catch (error) {
      console.error("Erro ao parsear data:", date, error);
      return new Date(); // Retorna data atual como fallback
    }
  };

  // Dados para o gráfico de rosca (doughnut)
  const dataRosca = {
    labels: ["Receitas", "Despesas", "Transferências"],
    datasets: [
      {
        data: [
          transacoes.filter((t) => t.tipo === "receita").reduce((acc, t) => acc + t.valor, 0),
          transacoes.filter((t) => t.tipo === "despesa").reduce((acc, t) => acc + t.valor, 0),
          transacoes.filter((t) => t.tipo === "transferencia").reduce((acc, t) => acc + t.valor, 0),
        ],
        backgroundColor: ["#10B981", "#EF4444", "#3B82F6"],
        borderColor: ["#10B981", "#EF4444", "#3B82F6"],
        borderWidth: 2,
        hoverOffset: 20,
      },
    ],
  };

  // Opções para o gráfico de rosca
  const optionsRosca = {
    plugins: {
      legend: {
        position: "bottom" as const,
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
          label: (tooltipItem: TooltipItem<"doughnut">) => {
            const label = tooltipItem.label || "";
            const value = tooltipItem.raw as number;
            const total = tooltipItem.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : "0";
            return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
    cutout: "70%",
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  // Função para agrupar transações por mês e calcular saldo
  const calcularSaldoPorMes = () => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const resultado = meses.map(() => 0); // Inicializa com zeros
    
    // Ordena transações por data
    const transacoesOrdenadas = [...transacoes].sort((a, b) => {
      return parseDate(a.data).getTime() - parseDate(b.data).getTime();
    });

    // Calcula saldo acumulado
    transacoesOrdenadas.forEach(transacao => {
      const mes = parseDate(transacao.data).getMonth();
      const valor = transacao.tipo === "receita" ? transacao.valor : -transacao.valor;
      resultado[mes] += valor;
    });

    // Calcula saldo acumulativo
    for (let i = 1; i < resultado.length; i++) {
      resultado[i] += resultado[i - 1];
    }

    return resultado;
  };

  // Dados para o gráfico de barras horizontais
  const saldoPorMes = calcularSaldoPorMes();
  const mesesComDados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const dataBarras = {
    labels: mesesComDados,
    datasets: [
      {
        label: "Saldo",
        data: saldoPorMes,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 5,
        hoverBackgroundColor: "rgba(59, 130, 246, 1)",
      },
    ],
  };

  // Opções para o gráfico de barras
  const optionsBarras = {
    plugins: {
      legend: {
        display: false,
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
        ticks: {
          callback: (value: number | string) => {
            if (typeof value === 'number') {
              return `R$ ${value.toFixed(2)}`;
            }
            return value;
          }
        }
      },
    },
    animation: {
      duration: 1000,
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Gráfico de Rosca (Doughnut) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Distribuição por Tipo</h2>
        <div className="h-64">
          <Doughnut data={dataRosca} options={optionsRosca} />
        </div>
      </div>

      {/* Gráfico de Barras Horizontais */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Evolução do Saldo</h2>
        <div className="h-64">
          <Bar data={dataBarras} options={optionsBarras} />
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;