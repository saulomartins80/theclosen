import { useState, useEffect } from "react";
import { Plus, Edit, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Meta {
  _id: string;
  meta: string;
  descricao: string;
  valor_total: number;
  valor_atual: number;
  data_conclusao: string;
  createdAt: string;
  observacoes?: string;
  transacoesVinculadas?: string[];
}

export default function Metas() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [metaEditavel, setMetaEditavel] = useState<Meta | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | "concluidas" | "em-andamento">("todas");

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Função para buscar metas
  const fetchMetas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/goals");
      if (!response.ok) {
        throw new Error("Erro ao buscar metas.");
      }
      const data = await response.json();
      setMetas(data.goals);
    } catch (error) {
      toast.error("Erro ao buscar metas.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Busca as metas ao carregar o componente
  useEffect(() => {
    fetchMetas();
  }, []);

  const handleSaveMeta = async (meta: Omit<Meta, "_id" | "createdAt">) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meta: meta.meta,
          descricao: meta.descricao,
          valor_total: meta.valor_total,
          valor_atual: meta.valor_atual,
          data_conclusao: meta.data_conclusao,
          observacoes: meta.observacoes,
          transacoesVinculadas: meta.transacoesVinculadas,
        }),
      });

      if (response.ok) {
        toast.success("Meta salva com sucesso!");
        fetchMetas(); // Atualiza a lista de metas
        setIsFormOpen(false);
      } else {
        toast.error("Erro ao salvar meta.");
      }
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
      toast.error("Erro ao salvar meta.");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar uma meta
  const handleUpdateMeta = async (id: string, meta: Omit<Meta, "_id" | "createdAt">) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/goals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meta),
      });

      if (response.ok) {
        toast.success("Meta atualizada com sucesso!");
        fetchMetas(); // Busca as metas atualizadas
        setIsFormOpen(false);
      } else {
        toast.error("Erro ao atualizar meta.");
      }
    } catch (error) {
      console.error("Erro ao atualizar meta:", error);
      toast.error("Erro ao atualizar meta.");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para excluir uma meta
  const handleDeleteMeta = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/goals/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Meta excluída com sucesso!");
        fetchMetas(); // Busca as metas atualizadas
      } else {
        toast.error("Erro ao excluir meta.");
      }
    } catch (error) {
      console.error("Erro ao excluir meta:", error);
      toast.error("Erro ao excluir meta.");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para abrir o formulário de edição
  const handleEditMeta = (meta: Meta) => {
    setMetaEditavel(meta);
    setIsFormOpen(true);
  };

  // Filtra as metas
  const metasFiltradas = metas.filter((meta) => {
    if (filtro === "concluidas") return meta.valor_atual >= meta.valor_total;
    if (filtro === "em-andamento") return meta.valor_atual < meta.valor_total;
    return true;
  });

  // Dados para o gráfico de progresso
  const data = {
    labels: ["Concluídas", "Em andamento"],
    datasets: [
      {
        data: [
          metas.filter((meta) => meta.valor_atual >= meta.valor_total).length,
          metas.filter((meta) => meta.valor_atual < meta.valor_total).length,
        ],
        backgroundColor: ["#10B981", "#FBBF24"],
      },
    ],
  };

  // Metas próximas do prazo
  const hoje = new Date();
  const metasProximas = metas.filter((meta) => {
    const diasRestantes = Math.ceil(
      (new Date(meta.data_conclusao).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diasRestantes <= 7 && meta.valor_atual < meta.valor_total;
  });

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Conteúdo da página */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Metas
          </h1>

          {/* Gráfico de Progresso Geral */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Progresso Geral</h2>
            <div className="w-full max-w-md mx-auto h-64">
              <Pie data={data} />
            </div>
          </div>

          {/* Notificações de Metas Próximas */}
          {metasProximas.length > 0 && (
            <div className="bg-yellow-100 dark:bg-yellow-800 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Metas Próximas do Prazo</h2>
              <ul>
                {metasProximas.map((meta) => (
                  <li key={meta._id} className="text-sm text-gray-900 dark:text-white">
                    {meta.meta} - {Math.ceil(
                      (new Date(meta.data_conclusao).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
                    )} dias restantes
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Filtros */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setFiltro("todas")}
              className={`px-4 py-2 rounded-lg ${filtro === "todas" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-white"}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltro("concluidas")}
              className={`px-4 py-2 rounded-lg ${filtro === "concluidas" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-white"}`}
            >
              Concluídas
            </button>
            <button
              onClick={() => setFiltro("em-andamento")}
              className={`px-4 py-2 rounded-lg ${filtro === "em-andamento" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-white"}`}
            >
              Em andamento
            </button>
          </div>

          {/* Lista de Metas */}
          {isLoading ? (
            <LoadingSpinner />
          ) : metasFiltradas.length === 0 ? (
            <p className="text-gray-900 dark:text-white">Nenhuma meta encontrada.</p>
          ) : (
            <ul className="space-y-4">
              {metasFiltradas.map((meta) => (
                <li
                  key={meta._id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {meta.meta}
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {meta.descricao}
                  </p>
                  <div className="mt-4">
                    <p className="text-gray-700 dark:text-gray-200">
                      <span className="font-semibold">Progresso:</span> R${" "}
                      {(meta.valor_atual || 0).toLocaleString()} / R${" "}
                      {(meta.valor_total || 0).toLocaleString()}
                    </p>
                    <p className="text-gray-700 dark:text-gray-200">
                      <span className="font-semibold">Data de Conclusão:</span>{" "}
                      {new Date(meta.data_conclusao).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      <span className="font-semibold">Criado em:</span>{" "}
                      {new Date(meta.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${(meta.valor_atual / meta.valor_total) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {((meta.valor_atual / meta.valor_total) * 100).toFixed(2)}% concluído
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    {meta.valor_atual >= meta.valor_total ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        Concluída
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                        Em andamento
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={() => handleEditMeta(meta)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <Edit size={16} className="mr-2" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteMeta(meta._id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      <Trash size={16} className="mr-2" />
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Botão para Adicionar Meta */}
          <button
            onClick={() => {
              setMetaEditavel(null);
              setIsFormOpen(true);
            }}
            className="fixed bottom-6 right-6 p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition"
            disabled={isLoading}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Modal de Adicionar/Editar Meta */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {metaEditavel ? "Editar Meta" : "Adicionar Meta"}
              </h2>
              <FormularioMeta
                onClose={() => {
                  setIsFormOpen(false);
                  setMetaEditavel(null);
                }}
                onSaveMeta={metaEditavel ? (meta) => handleUpdateMeta(metaEditavel._id, meta) : handleSaveMeta}
                metaEditavel={metaEditavel}
                isLoading={isLoading}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente do Formulário de Meta
interface FormularioMetaProps {
  onClose: () => void;
  onSaveMeta: (meta: Omit<Meta, "_id" | "createdAt">) => void;
  metaEditavel: Meta | null;
  isLoading: boolean;
}

const FormularioMeta: React.FC<FormularioMetaProps> = ({
  onClose,
  onSaveMeta,
  metaEditavel,
  isLoading,
}) => {
  const [meta, setMeta] = useState(
    metaEditavel || {
      meta: "",
      descricao: "",
      valor_total: 0,
      valor_atual: 0,
      data_conclusao: "",
      observacoes: "",
      transacoesVinculadas: [],
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Converte valor_total e valor_atual para números
    const parsedValue = name === "valor_total" || name === "valor_atual" ? (value === "" ? 0 : parseFloat(value)) : value;

    setMeta({
      ...meta,
      [name]: parsedValue,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verifica se os valores numéricos são válidos
    if (isNaN(meta.valor_total) || isNaN(meta.valor_atual)) {
      toast.error("Valores numéricos inválidos.");
      return;
    }

    // Verifica se os valores são maiores ou iguais a zero
    if (meta.valor_total < 0 || meta.valor_atual < 0) {
      toast.error("Os valores devem ser maiores ou iguais a zero.");
      return;
    }

    onSaveMeta(meta);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Meta
        </label>
        <input
          type="text"
          name="meta"
          value={meta.meta}
          onChange={handleChange}
          placeholder="Ex: Comprar um carro"
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Descrição
        </label>
        <textarea
          name="descricao"
          value={meta.descricao}
          onChange={handleChange}
          placeholder="Ex: Economizar para comprar um carro novo"
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Valor Total
        </label>
        <input
          type="number"
          name="valor_total"
          value={meta.valor_total}
          onChange={handleChange}
          placeholder="Ex: 50000"
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Valor Atual
        </label>
        <input
          type="number"
          name="valor_atual"
          value={meta.valor_atual}
          onChange={handleChange}
          placeholder="Ex: 1200"
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Data de Conclusão
        </label>
        <input
          type="date"
          name="data_conclusao"
          value={meta.data_conclusao}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          Observações
        </label>
        <textarea
          name="observacoes"
          value={meta.observacoes || ""}
          onChange={handleChange}
          placeholder="Adicione observações ou detalhes"
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          disabled={isLoading}
        >
          {isLoading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
};