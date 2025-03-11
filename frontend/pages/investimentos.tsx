import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { getInvestimentos, addInvestimento, updateInvestimento, deleteInvestimento } from "../services/api";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";

// Registra os componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Investimentos = () => {
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [investimentoEditavel, setInvestimentoEditavel] = useState<Investimento | null>(null);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Define the Investimento type
  interface Investimento {
    _id: string;
    nome: string;
    tipo: string;
    valor: number;
    data: string;
  }

  // Busca os investimentos ao carregar a página
  useEffect(() => {
    const fetchInvestimentos = async () => {
      try {
        const data = await getInvestimentos();
        setInvestimentos(data);
      } catch (error) {
        console.error("Erro ao buscar investimentos:", error);
        toast.error("Erro ao carregar investimentos.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvestimentos();
  }, []);

  // Filtra os investimentos
  const investimentosFiltrados = investimentos.filter((inv) => {
    if (filtroTipo !== "todos" && inv.tipo !== filtroTipo) return false;
    if (filtroDataInicio && new Date(inv.data) < new Date(filtroDataInicio)) return false;
    if (filtroDataFim && new Date(inv.data) > new Date(filtroDataFim)) return false;
    return true;
  });

  // Função para adicionar um novo investimento
  const handleAddInvestimento = async (novoInvestimento: Investimento) => {
    try {
      const data = await addInvestimento(novoInvestimento);
      setInvestimentos((prev) => [...prev, data]);
      toast.success("Investimento adicionado com sucesso!");
      setIsFormOpen(false); // Fecha o formulário após adicionar
    } catch (error) {
      console.error("Erro ao adicionar investimento:", error);
      toast.error("Erro ao adicionar investimento.");
    }
  };

  // Função para editar um investimento
  const handleEditInvestimento = async (investimentoAtualizado: Investimento) => {
    if (!investimentoEditavel || !investimentoEditavel._id) {
      toast.error("Nenhum investimento selecionado para edição.");
      return;
    }

    try {
      const data = await updateInvestimento(investimentoEditavel._id, investimentoAtualizado);
      setInvestimentos((prev) =>
        prev.map((inv) => (inv._id === investimentoEditavel._id ? data : inv))
      );
      toast.success("Investimento atualizado com sucesso!");
      setIsEditFormOpen(false); // Fecha o formulário após editar
    } catch (error) {
      console.error("Erro ao editar investimento:", error);
      toast.error("Erro ao editar investimento.");
    }
  };

  // Função para excluir um investimento
  const handleDeleteInvestimento = async (id: string) => {
    try {
      await deleteInvestimento(id);
      setInvestimentos((prev) => prev.filter((inv) => inv._id !== id));
      toast.success("Investimento excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir investimento:", error);
      toast.error("Erro ao excluir investimento.");
    }
  };

  // Dados para o gráfico de barras (evolução dos investimentos)
  const barChartData = {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"], // Substitua pelos meses reais
    datasets: [
      {
        label: "Valor Investido",
        data: investimentos.map((inv) => inv.valor), // Use os valores reais
        backgroundColor: "rgba(54, 162, 235, 0.8)",
      },
    ],
  };

  // Dados para o gráfico de pizza (distribuição por tipo)
  const tiposInvestimentos = ["Renda Fixa", "Ações", "Fundos Imobiliários"];
  const pieChartData = {
    labels: tiposInvestimentos,
    datasets: [
      {
        label: "Valor",
        data: tiposInvestimentos.map((tipo) =>
          investimentos.filter((inv) => inv.tipo === tipo).reduce((acc, inv) => acc + inv.valor, 0)
        ), // Soma os valores por tipo
        backgroundColor: ["rgba(75, 192, 192, 0.8)", "rgba(255, 99, 132, 0.8)", "rgba(153, 102, 255, 0.8)"],
      },
    ],
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Investimentos</h1>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Filtro por Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="todos">Todos</option>
              <option value="Renda Fixa">Renda Fixa</option>
              <option value="Ações">Ações</option>
              <option value="Fundos Imobiliários">Fundos Imobiliários</option>
            </select>
          </div>

          {/* Filtro por Período */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Data Inicial</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Data Final</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Resumo dos Investimentos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold">Total Investido</h2>
          <p className="text-2xl font-bold text-green-500">
            R$ {investimentosFiltrados.reduce((acc, inv) => acc + inv.valor, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold">Rentabilidade</h2>
          <p className="text-2xl font-bold text-green-500">+12%</p> {/* Substitua pelo valor real */}
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold">Número de Investimentos</h2>
          <p className="text-2xl font-bold text-blue-500">{investimentosFiltrados.length}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Evolução dos Investimentos</h2>
          <div className="h-64">
            <Bar data={barChartData} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Distribuição por Tipo</h2>
          <div className="h-64">
            <Pie data={pieChartData} />
          </div>
        </div>
      </div>

      {/* Listagem de Investimentos */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Meus Investimentos</h2>
          {investimentosFiltrados.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Nenhum investimento cadastrado.</p>
          ) : (
            <ul className="space-y-4">
              {investimentosFiltrados.map((investimento) => (
                <li
                  key={investimento._id}
                  className="flex justify-between items-center border-b pb-4"
                >
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">{investimento.nome}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Valor: R$ {investimento.valor.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setInvestimentoEditavel(investimento);
                        setIsEditFormOpen(true);
                      }}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteInvestimento(investimento._id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Botão para adicionar novo investimento */}
      <button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition"
      >
        <Plus size={24} />
      </button>

      {/* Modal do Formulário de Adição */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Novo Investimento</h2>
              <button
                onClick={() => setIsFormOpen(false)} // Fecha o modal
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const nome = e.currentTarget.nome.value;
                const tipo = e.currentTarget.tipo.value;
                const valor = parseFloat(e.currentTarget.valor.value);
                const data = e.currentTarget.data.value || new Date().toISOString().split('T')[0]; // Data atual como padrão

                if (!nome || !tipo || isNaN(valor)) {
                  toast.error("Preencha todos os campos corretamente.");
                  return;
                }

                handleAddInvestimento({ _id: "", nome, tipo, valor, data }); // Add _id property
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Nome</label>
                <input
                  type="text"
                  name="nome"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Tipo</label>
                <select
                  name="tipo"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="Renda Fixa">Renda Fixa</option>
                  <option value="Ações">Ações</option>
                  <option value="Fundos Imobiliários">Fundos Imobiliários</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Valor</label>
                <input
                  type="number"
                  name="valor"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Data</label>
                <input
                  type="date"
                  name="data"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)} // Fecha o modal
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal do Formulário de Edição */}
      {isEditFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Editar Investimento</h2>
              <button
                onClick={() => setIsEditFormOpen(false)} // Fecha o modal
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const nome = e.currentTarget.nome.value;
                const tipo = e.currentTarget.tipo.value;
                const valor = parseFloat(e.currentTarget.valor.value);
                const data = e.currentTarget.data.value;

                if (!nome || !tipo || isNaN(valor)) {
                  toast.error("Preencha todos os campos corretamente.");
                  return;
                }

                if (investimentoEditavel) { // Add null check for investimentoEditavel
                  handleEditInvestimento({ _id: investimentoEditavel._id, nome, tipo, valor, data }); // Add _id property
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Nome</label>
                <input
                  type="text"
                  name="nome"
                  defaultValue={investimentoEditavel?.nome}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Tipo</label>
                <select
                  name="tipo"
                  defaultValue={investimentoEditavel?.tipo}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="Renda Fixa">Renda Fixa</option>
                  <option value="Ações">Ações</option>
                  <option value="Fundos Imobiliários">Fundos Imobiliários</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Valor</label>
                <input
                  type="number"
                  name="valor"
                  defaultValue={investimentoEditavel?.valor}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Data</label>
                <input
                  type="date"
                  name="data"
                  defaultValue={investimentoEditavel?.data}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditFormOpen(false)} // Fecha o modal
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default Investimentos;