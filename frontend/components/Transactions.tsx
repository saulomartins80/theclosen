import React, { useState, useEffect } from "react";
import { Plus, Download, Search } from "lucide-react";
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
import TransactionForm from "./TransactionForm"; // Importe o componente

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

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  tipo: string;
  conta: string;
}

const Transacoes = () => {
  const [transactions, setTransactions] = useState<Transacao[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transacao[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transacaoEditavel, setTransacaoEditavel] = useState<Transacao | null>(null);

  // Busca as transações do backend
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/transaçoes");
        if (!response.ok) {
          throw new Error("Falha ao carregar transações");
        }
        const data: Transacao[] = await response.json();
        setTransactions(data);
        setFilteredTransactions(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Filtra as transações
  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter((transaction) =>
        transaction.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((transaction) => transaction.tipo === filterType);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Resetar a paginação ao aplicar filtros
  }, [searchTerm, filterType, transactions]);

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Funções para os botões "Nova Transação" e "Exportar"
  const handleNovaTransacao = () => {
    setTransacaoEditavel(null); // Limpa o estado de edição
    setIsFormOpen(true); // Abre o modal
  };

  const handleExportar = () => {
    alert("Funcionalidade de Exportar ainda não implementada.");
  };

  // Função para salvar uma transação (nova ou editada)
  const handleSaveTransacao = (transacaoAtualizada: Transacao) => {
    if (transacaoEditavel) {
      // Editar transação existente
      const updatedTransactions = transactions.map((t) =>
        t.id === transacaoAtualizada.id ? transacaoAtualizada : t
      );
      setTransactions(updatedTransactions);
      setFilteredTransactions(updatedTransactions);
    } else {
      // Adicionar nova transação
      setTransactions([...transactions, transacaoAtualizada]);
      setFilteredTransactions([...filteredTransactions, transacaoAtualizada]);
    }
    setIsFormOpen(false); // Fecha o modal
    setTransacaoEditavel(null); // Limpa a transação editável
  };

  // Dados para os gráficos
  const chartData = {
    labels: filteredTransactions.map((t) => t.descricao),
    datasets: [
      {
        label: "Valor",
        data: filteredTransactions.map((t) => t.valor),
        backgroundColor: filteredTransactions.map((t) =>
          t.tipo === "receita" ? "rgba(75, 192, 192, 0.8)" : "rgba(255, 99, 132, 0.8)"
        ),
        borderColor: "rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: filteredTransactions.map((t) => t.data),
    datasets: [
      {
        label: "Saldo",
        data: filteredTransactions.map((t) => t.valor),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
    ],
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Transações</h1>

      {/* Filtros e Ações */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Pesquisar transação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-full"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-full md:w-auto"
          >
            <option value="all">Todas</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
            <option value="transferencia">Transferências</option>
          </select>
        </div>
        <div className="flex space-x-4 w-full md:w-auto">
          <button
            onClick={handleNovaTransacao}
            className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition w-full md:w-auto"
          >
            <Plus size={18} className="mr-2" />
            Nova Transação
          </button>
          <button
            onClick={handleExportar}
            className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition w-full md:w-auto"
          >
            <Download size={18} className="mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Saldo Atual</h2>
          <p className="text-2xl font-bold text-green-500">R$ 4.000,00</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Receitas</h2>
          <p className="text-2xl font-bold text-green-500">R$ 8.000,00</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Despesas</h2>
          <p className="text-2xl font-bold text-red-500">R$ 3.000,00</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribuição por Categoria
          </h2>
          <Bar data={chartData} />
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Evolução do Saldo
          </h2>
          <Line data={lineChartData} />
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Transações Recentes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left text-gray-900 dark:text-white">Descrição</th>
                <th className="py-2 text-left text-gray-900 dark:text-white">Valor</th>
                <th className="py-2 text-left text-gray-900 dark:text-white">Data</th>
                <th className="py-2 text-left text-gray-900 dark:text-white">Categoria</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((transaction) => (
                <tr key={transaction.id} className="border-b">
                  <td className="py-3 text-gray-900 dark:text-white">{transaction.descricao}</td>
                  <td
                    className={`py-3 ${
                      transaction.valor < 0 ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {transaction.valor < 0 ? "-" : "+"}R$ {Math.abs(transaction.valor).toFixed(2)}
                  </td>
                  <td className="py-3 text-gray-900 dark:text-white">{transaction.data}</td>
                  <td className="py-3 text-gray-900 dark:text-white">{transaction.categoria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-gray-900 dark:text-white">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Modal para Nova Transação */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">
              {transacaoEditavel ? "Editar Transação" : "Nova Transação"}
            </h2>
            <TransactionForm
              onClose={() => setIsFormOpen(false)}
              onSave={handleSaveTransacao}
              transacaoEditavel={transacaoEditavel} // Passa a transação editável
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Transacoes;