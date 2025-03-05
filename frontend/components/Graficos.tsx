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
} from "chart.js";
import { useFinance } from "../context/FinanceContext";

// Registra os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Graficos = () => {
  const { transactions } = useFinance();

  // Função para agrupar transações por mês
  const agruparPorMes = (transacoes: any[]) => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const dadosPorMes = meses.map((mes, index) => {
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

    return dadosPorMes;
  };

  // Dados para o gráfico de barras (Receitas vs Despesas)
  const dadosPorMes = agruparPorMes(transactions);
  const barChartData = {
    labels: dadosPorMes.map((d) => d.mes),
    datasets: [
      {
        label: "Receitas",
        data: dadosPorMes.map((d) => d.receitas),
        backgroundColor: "rgba(75, 192, 192, 0.8)",
      },
      {
        label: "Despesas",
        data: dadosPorMes.map((d) => d.despesas),
        backgroundColor: "rgba(255, 99, 132, 0.8)",
      },
    ],
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
    labels: saldoAcumulado.map((s) => new Date(s.data).toLocaleDateString()),
    datasets: [
      {
        label: "Saldo",
        data: saldoAcumulado.map((s) => s.saldo),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
    ],
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Barras */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Receitas vs Despesas
        </h2>
        <div className="h-64">
          <Bar data={barChartData} />
        </div>
      </div>

      {/* Gráfico de Linhas */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Evolução do Saldo
        </h2>
        <div className="h-64">
          <Line data={lineChartData} />
        </div>
      </div>
    </div>
  );
};

export default Graficos;