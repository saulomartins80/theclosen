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
import { Transacao } from "../src/types/Transacao";

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

const Graficos = () => {
  const { transactions } = useFinance();

  // Função para verificar e parsear datas corretamente
  const parseDate = (dateString: string | { $date: string }): Date => {
    try {
      const date = typeof dateString === 'string' ? dateString : dateString.$date;
      return new Date(date);
    } catch (error) {
      console.error("Erro ao parsear data:", dateString, error);
      return new Date(); // Retorna data atual como fallback
    }
  };

  // Função para agrupar transações por mês
  const agruparPorMes = (transacoes: Transacao[]) => {
    const meses = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ];
    
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

  // Dados para o gráfico de linha (Evolução do Saldo)
  const saldoAcumulado = transactions
    .slice() // Cria cópia para não modificar o array original
    .sort((a, b) => {
      try {
        return parseDate(a.data).getTime() - parseDate(b.data).getTime();
      } catch (error) {
        console.error("Erro ao ordenar transações:", error);
        return 0;
      }
    })
    .reduce((acc, t) => {
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
    }, [] as { data: string; saldo: number }[]);

  // Adiciona ponto inicial (saldo zero) se não houver transações
  if (saldoAcumulado.length === 0) {
    saldoAcumulado.push({ 
      data: new Date().toISOString(), 
      saldo: 0 
    });
  }

  const lineChartData = {
    labels: saldoAcumulado.map((s) => {
      try {
        const date = new Date(s.data);
        const dia = date.getDate().toString().padStart(2, "0");
        const mes = date.toLocaleString("pt-BR", { month: "short" });
        return `${dia}/${mes}`;
      } catch (error) {
        console.error("Erro ao formatar data:", s.data, error);
        return "Data inválida";
      }
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

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Gráfico de Barras (Receitas vs Despesas) */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Receitas vs Despesas
        </h2>
        <div className="h-64">
          <Bar
            data={barChartData}
            options={{ 
              responsive: true, 
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
      </div>

      {/* Gráfico de Linha (Evolução do Saldo) */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Evolução do Saldo
        </h2>
        <div className="h-64">
          <Line
            data={lineChartData}
            options={{ 
              responsive: true, 
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: false
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