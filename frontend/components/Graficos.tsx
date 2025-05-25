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

// Registra os componentes do ChartJS
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
  const { transactions } = useFinance();

  // Normaliza os dados das transações de forma segura
  const normalizedTransactions = React.useMemo(() => {
    return (transactions || []).map(t => {
      // Extração segura do ID
      const id = typeof t._id === 'string' 
        ? t._id 
        : (t._id as { $oid: string })?.$oid || '';

      // Extração segura da data
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

  // Configuração dos gráficos (mantido igual ao seu código original)
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
            console.error("Erro ao formatar data:", s.data, error);
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

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Receitas vs Despesas por Mês
        </h2>
        <div className="h-64 w-full overflow-hidden">
          <Bar
            data={barChartData}
            options={{
              ...commonChartOptions,
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Evolução do Saldo
        </h2>
        <div className="h-64 w-full overflow-hidden">
          <Line
            data={lineChartData}
            options={{
              ...commonChartOptions,
              scales: {
                y: {
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Graficos;