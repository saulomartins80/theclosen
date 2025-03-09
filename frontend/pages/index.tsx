import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { useFinance } from "../context/FinanceContext";
import Graficos from "../components/Graficos";

// Função para determinar a saudação com base na hora do dia
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "Bom dia";
  } else if (hour >= 12 && hour < 18) {
    return "Boa tarde";
  } else {
    return "Boa noite";
  }
};

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { transactions, investimentos, loading, error, fetchData } = useFinance();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const userName = "Saulo Martins"; // Substitua pelo nome do usuário dinâmico

  // Calcula totais
  const totalReceitas = transactions
    ? transactions.filter((t) => t.tipo === "receita").reduce((acc, t) => acc + t.valor, 0)
    : 0;

  const totalDespesas = transactions
    ? transactions.filter((t) => t.tipo === "despesa").reduce((acc, t) => acc + t.valor, 0)
    : 0;

  const saldoAtual = totalReceitas - totalDespesas;
  const saldoColor = saldoAtual >= 0 ? "text-green-500" : "text-red-500";

  const totalInvestimentos = investimentos
    ? investimentos.reduce((acc, inv) => acc + inv.valor, 0)
    : 0;

  // Atualização automática dos dados
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(); // Atualiza os dados a cada 60 segundos
    }, 60000); // 60 segundos

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, [fetchData]);

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (error) {
    return <p>Erro: {error}</p>;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-screen pt-16">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Mensagem de Boas-Vindas */}
        <div className="p-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-4xl font-bold"
          >
            {getGreeting()},{" "}
            <span className="text-blue-500">{userName}</span>!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base"
          >
            Aqui está o seu resumo financeiro.
          </motion.p>
        </div>

        {/* Cards de Resumo */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Saldo Atual */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Saldo Atual
            </h2>
            <p className={`text-2xl font-bold ${saldoColor} mt-2`}>
              R$ {saldoAtual.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {saldoAtual >= 0 ? "+2% em relação ao mês passado" : "-2% em relação ao mês passado"}
            </p>
          </motion.div>

          {/* Receitas */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Receitas
            </h2>
            <p className="text-2xl font-bold text-blue-500 mt-2">R$ {totalReceitas.toFixed(2)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              +15% em relação ao mês passado
            </p>
          </motion.div>

          {/* Despesas */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Despesas
            </h2>
            <p className="text-2xl font-bold text-red-500 mt-2">R$ {totalDespesas.toFixed(2)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              -10% em relação ao mês passado
            </p>
          </motion.div>

          {/* Investimentos */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Investimentos
            </h2>
            <p className="text-2xl font-bold text-purple-500 mt-2">R$ {totalInvestimentos.toFixed(2)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              +8% em relação ao mês passado
            </p>
          </motion.div>
        </div>

        {/* Gráficos */}
        <Graficos />
      </div>
    </div>
  );
}