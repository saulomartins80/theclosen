import { useEffect, useState } from "react";
import { Plus, Download, Search, X } from "lucide-react";
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

// Componente do Modal para Nova Transação
const AddTransactionModal = ({ onClose, onAddTransaction }) => {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState("receita");

  const handleSubmit = (e) => {
    e.preventDefault();
    const novaTransacao = {
      descricao,
      valor: parseFloat(valor),
      data,
      categoria,
      tipo,
    };
    onAddTransaction(novaTransacao);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nova Transação</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Valor</label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Selecione uma categoria</option>
              <option value="alimentacao">Alimentação</option>
              <option value="casa">Casa</option>
              <option value="servico">Serviço</option>
              <option value="educacao">Educação</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
};

const Transacoes = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Busca as transações do backend
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/lancamentos");
        if (!response.ok) {
          throw new Error("Falha ao carregar transações");
        }
        const data = await response.json();
        setTransactions(data);
        setFilteredTransactions(data);
      } catch (error: any) {
        setError(error.message);
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
    setIsModalOpen(true);
  };

  const handleExportar = () => {
    alert("Funcionalidade de Exportar ainda não implementada.");
  };

  const handleAddTransaction = (novaTransacao) => {
    setTransactions([...transactions, novaTransacao]);
    setFilteredTransactions([...filteredTransactions, novaTransacao]);
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
      {isModalOpen && (
        <AddTransactionModal
          onClose={() => setIsModalOpen(false)}
          onAddTransaction={handleAddTransaction}
        />
      )}
    </div>
  );
};

export default Transacoes;