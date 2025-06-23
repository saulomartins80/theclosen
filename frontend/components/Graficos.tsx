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
  ChartData,
  ChartOptions,
} from "chart.js";
import { useFinance } from "../context/FinanceContext";
import { useTheme } from "../context/ThemeContext";

// Registro dos componentes
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

type Transacao = {
  _id: string | { $oid: string };
  descricao: string;
  valor: number;
  data: string | { $date: string };
  categoria: string;
  tipo: "receita" | "despesa" | "transferencia";
  conta: string;
};

type DadosMes = {
  mes: string;
  receitas: number;
  despesas: number;
};

type SaldoAcumulado = {
  data: string;
  saldo: number;
};

const parseDate = (dateString: string | { $date: string }): Date => {
  try {
    const date = typeof dateString === 'string' ? dateString : dateString.$date;
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  } catch (error) {
    console.error("Erro ao parsear data:", dateString, error);
    return new Date();
  }
};

const agruparPorMes = (transacoes: Transacao[]): DadosMes[] => {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return meses.map((mes, index) => {
    const transacoesDoMes = transacoes.filter((t) => {
      try {
        return parseDate(t.data).getMonth() === index;
      } catch (error) {
        return false;
      }
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

const calcularSaldoAcumulado = (transacoes: Transacao[]): SaldoAcumulado[] => {
  const transacoesOrdenadas = [...transacoes].sort((a, b) => {
    try {
      return parseDate(a.data).getTime() - parseDate(b.data).getTime();
    } catch (error) {
      return 0;
    }
  });

  return transacoesOrdenadas.reduce((acc, t) => {
    const saldoAnterior = acc.length > 0 ? acc[acc.length - 1].saldo : 0;
    const novoSaldo = saldoAnterior + (t.tipo === "receita" ? t.valor : -t.valor);

    try {
      const dataFormatada = parseDate(t.data);
      acc.push({
        data: dataFormatada.toISOString(),
        saldo: novoSaldo
      });
    } catch (error) {
      console.error("Erro ao processar transação:", t, error);
    }

    return acc;
  }, [] as SaldoAcumulado[]);
};

const Graficos = () => {
  const { resolvedTheme } = useTheme();
  const { transactions } = useFinance();

  // Cores vibrantes estilo cinema
  const cinemaPalette = {
    neonBlue: '#00f0ff',
    electricPurple: '#b300ff',
    hotPink: '#ff00b3',
    limeGreen: '#00ff7b',
    goldenYellow: '#ffd700',
    darkBg: '#0a0a1a',
    lightBg: '#f8f9fa',
    gridDark: 'rgba(0, 240, 255, 0.1)',
    gridLight: 'rgba(0, 0, 0, 0.05)'
  };

  const textColor = resolvedTheme === 'dark' ? '#ffffff' : '#111827';
  const gridColor = resolvedTheme === 'dark' ? cinemaPalette.gridDark : cinemaPalette.gridLight;
  const tooltipBgColor = resolvedTheme === 'dark' ? '#1a1a2e' : '#ffffff';

  const normalizedTransactions = React.useMemo(() => {
    return (transactions || []).map(t => {
      const id = typeof t._id === 'string' ? t._id : (t._id as { $oid: string })?.$oid || '';
      const dataValue = typeof t.data === 'string' ? t.data : (t.data as { $date: string })?.$date || new Date().toISOString();
      return { ...t, _id: id, data: dataValue };
    });
  }, [transactions]);

  const dadosPorMes = agruparPorMes(normalizedTransactions);
  const saldoAcumulado = calcularSaldoAcumulado(normalizedTransactions);

  // Configuração do gráfico de barras
  const barChartData: ChartData<'bar'> = {
    labels: dadosPorMes.map((d) => d.mes),
    datasets: [
      {
        label: "Receitas",
        data: dadosPorMes.map((d) => d.receitas),
        backgroundColor: cinemaPalette.neonBlue,
        borderColor: cinemaPalette.neonBlue,
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: cinemaPalette.limeGreen,
        hoverBorderColor: '#ffffff',
        barPercentage: 0.8,
        categoryPercentage: 0.7
      },
      {
        label: "Despesas",
        data: dadosPorMes.map((d) => d.despesas),
        backgroundColor: cinemaPalette.hotPink,
        borderColor: cinemaPalette.hotPink,
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: cinemaPalette.goldenYellow,
        hoverBorderColor: '#ffffff',
        barPercentage: 0.8,
        categoryPercentage: 0.7
      },
    ],
  };

  // Configuração do gráfico de linha
  const lineChartData: ChartData<'line'> = {
    labels: saldoAcumulado.length > 0
      ? saldoAcumulado.map((s) => {
          try {
            const date = new Date(s.data);
            return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
          } catch {
            return "Data inválida";
          }
        })
      : ["Nenhum dado"],
    datasets: [
      {
        label: "Saldo",
        data: saldoAcumulado.length > 0 ? saldoAcumulado.map((s) => s.saldo) : [0],
        borderColor: cinemaPalette.limeGreen,
        backgroundColor: `${cinemaPalette.electricPurple}60`,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: cinemaPalette.neonBlue,
        pointBorderColor: '#ffffff',
        pointHoverRadius: 8,
        pointHoverBackgroundColor: cinemaPalette.goldenYellow,
        pointHoverBorderColor: '#ffffff',
        pointHitRadius: 10,
        pointBorderWidth: 2
      },
    ],
  };

  // Opções do gráfico de barras
  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          font: {
            size: 14,
            weight: 'bold',
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: tooltipBgColor,
        titleColor: resolvedTheme === 'dark' ? cinemaPalette.neonBlue : '#111827',
        bodyColor: textColor,
        borderColor: resolvedTheme === 'dark' ? cinemaPalette.electricPurple : '#e5e7eb',
        borderWidth: 2,
        padding: 12,
        boxPadding: 8,
        cornerRadius: 12,
        titleFont: {
          weight: 'bold',
          size: 14
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: (context) => {
            const value = typeof context.raw === 'number' ? context.raw : 0;
            return ` ${context.dataset.label}: R$ ${value.toFixed(2).replace('.', ',')}`;
          }
        }
      },
      title: {
        display: true,
        text: 'Fluxo Financeiro Mensal',
        color: textColor,
        font: {
          size: 18,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          padding: 10,
          callback: (value) => `R$ ${Number(value).toFixed(2)}`,
          font: {
            size: 12,
            weight: 'bold'
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 12,
            weight: 'bold'
          }
        },
      },
    },
    animation: {
      duration: 1500,
    },
  };

  // Opções do gráfico de linha
  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          font: {
            size: 14,
            weight: 'bold',
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: tooltipBgColor,
        titleColor: resolvedTheme === 'dark' ? cinemaPalette.limeGreen : '#111827',
        bodyColor: textColor,
        borderColor: resolvedTheme === 'dark' ? cinemaPalette.neonBlue : '#e5e7eb',
        borderWidth: 2,
        padding: 12,
        boxPadding: 8,
        cornerRadius: 12,
        titleFont: {
          weight: 'bold',
          size: 14
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: (context) => {
            const value = typeof context.raw === 'number' ? context.raw : 0;
            return ` Saldo: R$ ${value.toFixed(2).replace('.', ',')}`;
          }
        }
      },
      title: {
        display: true,
        text: 'Histórico de Saldo',
        color: textColor,
        font: {
          size: 18,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          padding: 10,
          callback: (value) => `R$ ${Number(value).toFixed(2)}`,
          font: {
            size: 12,
            weight: 'bold'
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 12,
            weight: 'bold'
          }
        },
      },
    },
    elements: {
      point: {
        radius: 5,
        hoverRadius: 8,
        borderWidth: 2
      },
      line: {
        borderWidth: 3,
        tension: 0.4
      }
    },
    animation: {
      duration: 1500,
    },
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Barras - Sem borda colorida */}
      <div className={`p-3 rounded-lg shadow-sm ${
        resolvedTheme === "dark" 
          ? "bg-gray-800" 
          : "bg-white"
      }`}>
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          Receitas vs Despesas
        </h2>
        <div className="w-full h-[380px]">
          <Bar
            data={barChartData}
            options={barChartOptions}
          />
        </div>
      </div>

      {/* Gráfico de Linha - Sem borda colorida */}
      <div className={`p-3 rounded-lg shadow-sm ${
        resolvedTheme === "dark" 
          ? "bg-gray-800" 
          : "bg-white"
      }`}>
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          Evolução do Saldo
        </h2>
        <div className="w-full h-[380px]">
          <Line
            data={lineChartData}
            options={lineChartOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default Graficos;