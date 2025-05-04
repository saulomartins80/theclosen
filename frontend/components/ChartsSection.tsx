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
  data: string | { $date: string };
}

interface ChartsSectionProps {
  transacoes: Transacao[];
  theme: 'light' | 'dark';
  className?: string;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ transacoes, theme, className }) => {
  // Cores baseadas no tema
  const backgroundColor = theme === 'dark' ? '#1F2937' : '#FFFFFF';
  const textColor = theme === 'dark' ? '#FFFFFF' : '#111827';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Função para parsear a data corretamente
  const parseDate = (date: string | { $date: string }): Date => {
    try {
      const dateString = typeof date === 'string' ? date : date.$date;
      return new Date(dateString);
    } catch (error) {
      console.error("Erro ao parsear data:", date, error);
      return new Date();
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
          color: textColor,
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
    const resultado = meses.map(() => 0);
    
    const transacoesOrdenadas = [...transacoes].sort((a, b) => {
      return parseDate(a.data).getTime() - parseDate(b.data).getTime();
    });

    transacoesOrdenadas.forEach(transacao => {
      const mes = parseDate(transacao.data).getMonth();
      const valor = transacao.tipo === "receita" ? transacao.valor : -transacao.valor;
      resultado[mes] += valor;
    });

    for (let i = 1; i < resultado.length; i++) {
      resultado[i] += resultado[i - 1];
    }

    return resultado;
  };

  // Dados para o gráfico de barras
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
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
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
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {/* Gráfico de Rosca */}
      <div className={`p-6 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Distribuição por Tipo
        </h2>
        <div className="h-64">
          <Doughnut data={dataRosca} options={optionsRosca} />
        </div>
      </div>

      {/* Gráfico de Barras */}
      <div className={`p-6 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Evolução do Saldo
        </h2>
        <div className="h-64">
          <Bar data={dataBarras} options={optionsBarras} />
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;