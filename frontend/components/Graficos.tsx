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

// Definindo o tipo Transacao localmente para evitar conflitos
type Transacao = {
  _id: string | { $oid: string };
  descricao: string;
  valor: number;
  data: string | { $date: string };
  categoria: string;
  tipo: "receita" | "despesa" | "transferencia";
  conta: string;
};

// Tipos para os dados processados
type DadosMes = {
  mes: string;
  receitas: number;
  despesas: number;
};

type SaldoAcumulado = {
  data: string;
  saldo: number;
};

/**
 * Parseia uma data que pode vir como string ou objeto { $date: string }
 */
const parseDate = (dateString: string | { $date: string }): Date => {
  try {
    const date = typeof dateString === 'string' ? dateString : dateString.$date;
    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      throw new Error("Data inválida");
    }

    return parsedDate;
  } catch (error) {
    console.error("Erro ao parsear data:", dateString, error);
    return new Date();
  }
};

/**
 * Agrupa transações por mês
 */
const agruparPorMes = (transacoes: Transacao[]): DadosMes[] => {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return meses.map((mes, index) => {
    const transacoesDoMes = transacoes.filter((t) => {
      try {
        return parseDate(t.data).getMonth() === index;
      } catch (error) {
        console.error("Erro ao filtrar por mês:", t.data, error);
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

/**
 * Calcula o saldo acumulado ao longo do tempo
 */
const calcularSaldoAcumulado = (transacoes: Transacao[]): SaldoAcumulado[] => {
  const transacoesOrdenadas = [...transacoes].sort((a, b) => {
    try {
      return parseDate(a.data).getTime() - parseDate(b.data).getTime();
    } catch (error) {
      console.error("Erro ao ordenar transações:", error);
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
  const { resolvedTheme } = useTheme(); // Alterado para resolvedTheme
  const { transactions } = useFinance();

  // Configurações de tema para os gráficos
  const textColor = resolvedTheme === 'dark' ? '#f3f4f6' : '#111827';
  const gridColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const tooltipBgColor = resolvedTheme === 'dark' ? '#1f2937' : '#ffffff';

  // Normaliza os dados das transações de forma segura
  const normalizedTransactions = React.useMemo(() => {
    return (transactions || []).map(t => {
      const id = typeof t._id === 'string'
        ? t._id
        : (t._id as { $oid: string })?.$oid || '';
      const dataValue = typeof t.data === 'string'
        ? t.data
        : (t.data as { $date: string })?.$date || new Date().toISOString();
      return {
        ...t,
        _id: id,
        data: dataValue
      };
    });
  }, [transactions]);

  // Processa os dados para os gráficos
  const dadosPorMes = agruparPorMes(normalizedTransactions);
  const saldoAcumulado = calcularSaldoAcumulado(normalizedTransactions);

  const barChartData = {
    labels: dadosPorMes.map((d) => d.mes),
    datasets: [
      {
        label: "Receitas",
        data: dadosPorMes.map((d) => d.receitas),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Despesas",
        data: dadosPorMes.map((d) => d.despesas),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const lineChartData = {
    labels: saldoAcumulado.length > 0
      ? saldoAcumulado.map((s) => {
          try {
            const date = new Date(s.data);
            return `${date.getDate().toString().padStart(2, "0")}/${date.toLocaleString("pt-BR", { month: "short" })}`;
          } catch (error) {
            return "Data inválida";
          }
        })
      : ["Nenhum dado"],
    datasets: [
      {
        label: "Saldo",
        data: saldoAcumulado.length > 0
          ? saldoAcumulado.map((s) => s.saldo)
          : [0],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Barras - Receitas vs Despesas */}
      <div className={`p-4 rounded-xl shadow-lg ${
        resolvedTheme === "dark" ? "bg-gray-800" : "bg-white"
      }`}>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Receitas vs Despesas por Mês
        </h2>
        <div className="w-full h-[400px]">
          <Bar
            data={barChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: textColor,
                    font: {
                      weight: 'bold'
                    }
                  }
                },
                tooltip: {
                  backgroundColor: tooltipBgColor,
                  titleColor: textColor,
                  bodyColor: textColor,
                  borderColor: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
                  borderWidth: 1,
                  padding: 12,
                  boxPadding: 8,
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
                  }
                },
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: textColor,
                  }
                },
              },
            }}
          />
        </div>
      </div>

      {/* Gráfico de Linha - Evolução do Saldo */}
      <div className={`p-4 rounded-xl shadow-lg ${
        resolvedTheme === "dark" ? "bg-gray-800" : "bg-white"
      }`}>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Evolução do Saldo
        </h2>
        <div className="w-full h-[400px]">
          <Line
            data={lineChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: textColor,
                    font: {
                      weight: 'bold'
                    }
                  }
                },
                tooltip: {
                  backgroundColor: tooltipBgColor,
                  titleColor: textColor,
                  bodyColor: textColor,
                  borderColor: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
                  borderWidth: 1,
                  padding: 12,
                  boxPadding: 8,
                }
              },
              scales: {
                y: {
                  grid: {
                    color: gridColor,
                  },
                  ticks: {
                    color: textColor,
                  }
                },
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: textColor,
                  }
                },
              },
              elements: {
                point: {
                  radius: 4,
                  hoverRadius: 6,
                  backgroundColor: resolvedTheme === 'dark' ? '#3b82f6' : '#2563eb',
                },
                line: {
                  borderWidth: 3,
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Graficos;