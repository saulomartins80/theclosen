import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Filter, X } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  getInvestimentos, 
  addInvestimento, 
  updateInvestimento, 
  deleteInvestimento 
} from '../services/api';
import dynamic from 'next/dynamic';

// Carrega os gráficos dinamicamente (para SSR)
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Investimento {
  _id: string;
  nome: string;
  tipo: string;
  valor: number;
  data: string;
}

const InvestimentosPage = () => {
  // Estados
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [currentInvestimento, setCurrentInvestimento] = useState<Investimento | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: '',
    dataInicio: '',
    dataFim: ''
  });
  
  // Estado para o formulário de adição
  const [addFormData, setAddFormData] = useState<Omit<Investimento, '_id'>>({
    nome: '',
    tipo: 'Renda Fixa',
    valor: 0,
    data: new Date().toISOString().split('T')[0]
  });

  // Estado para o formulário de edição
  const [editFormData, setEditFormData] = useState<Omit<Investimento, '_id'>>({
    nome: '',
    tipo: 'Renda Fixa',
    valor: 0,
    data: new Date().toISOString().split('T')[0]
  });

  // Busca investimentos
  useEffect(() => {
    const fetchInvestimentos = async () => {
      try {
        const data = await getInvestimentos();
        setInvestimentos(data);
      } catch (error) {
        toast.error('Erro ao carregar investimentos');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestimentos();
  }, []);

  // Aplica filtros
  const investimentosFiltrados = investimentos.filter(inv => {
    const dataInvestimento = new Date(inv.data);
    const dataInicio = filtros.dataInicio ? new Date(filtros.dataInicio) : null;
    const dataFim = filtros.dataFim ? new Date(filtros.dataFim) : null;
    
    return (
      (!filtros.tipo || inv.tipo === filtros.tipo) &&
      (!dataInicio || dataInvestimento >= dataInicio) &&
      (!dataFim || dataInvestimento <= dataFim)
    );
  });

  // Dados para gráficos
  const tiposInvestimento = Array.from(new Set(investimentosFiltrados.map(inv => inv.tipo)));
  
  const dadosGraficoPizza = {
    series: tiposInvestimento.map(tipo => 
      investimentosFiltrados
        .filter(inv => inv.tipo === tipo)
        .reduce((total, inv) => total + inv.valor, 0)
    ),
    labels: tiposInvestimento
  };

  const dadosGraficoBarras = {
    series: [{
      name: 'Valor Investido',
      data: tiposInvestimento.map(tipo => 
        investimentosFiltrados
          .filter(inv => inv.tipo === tipo)
          .reduce((total, inv) => total + inv.valor, 0)
      )
    }],
    labels: tiposInvestimento
  };

  // Manipuladores de eventos
  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddFormData({
      ...addFormData,
      [name]: name === 'valor' ? Number(value) : value
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'valor' ? Number(value) : value
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  const resetFilters = () => {
    setFiltros({
      tipo: '',
      dataInicio: '',
      dataFim: ''
    });
  };

  const handleAdd = async () => {
    try {
      if (!addFormData.nome || !addFormData.tipo || addFormData.valor <= 0 || !addFormData.data) {
        toast.error('Preencha todos os campos corretamente');
        return;
      }

      const dadosParaEnviar = {
        ...addFormData,
        valor: Number(addFormData.valor),
        data: new Date(addFormData.data).toISOString(),
      };

      const novoInvestimento = await addInvestimento(dadosParaEnviar);
      setInvestimentos([...investimentos, novoInvestimento]);
      toast.success('Investimento adicionado com sucesso!');

      setAddFormData({
        nome: '',
        tipo: 'Renda Fixa',
        valor: 0,
        data: new Date().toISOString().split('T')[0],
      });
      setIsFormOpen(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(`Falha ao adicionar: ${error.message}`);
      } else {
        toast.error('Falha ao adicionar: Erro desconhecido');
      }
    }
  };

  const handleEdit = async () => {
    if (!currentInvestimento?._id) {
      toast.error('Nenhum investimento selecionado');
      return;
    }

    try {
      const investimentoAtualizado = await updateInvestimento(
        currentInvestimento._id,
        editFormData
      );

      setInvestimentos(investimentos.map((inv) =>
        inv._id === currentInvestimento._id ? { ...investimentoAtualizado } : inv
      ));

      toast.success('Investimento atualizado com sucesso!');
      setIsEditFormOpen(false);
      setCurrentInvestimento(null);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Erro ao atualizar: ${err.message}`);
      } else {
        toast.error('Erro ao atualizar investimento');
      }
      console.error('Erro ao editar:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este investimento?')) {
      return;
    }

    try {
      await deleteInvestimento(id);
      setInvestimentos(investimentos.filter((inv) => inv._id !== id));
      toast.success('Investimento excluído com sucesso!');
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Erro ao excluir: ${err.message}`);
      } else {
        toast.error('Erro ao excluir investimento');
      }
      console.error('Erro ao excluir:', err);
    }
  };

  const openEditForm = (investimento: Investimento) => {
    setCurrentInvestimento(investimento);
    setEditFormData({
      nome: investimento.nome,
      tipo: investimento.tipo,
      valor: investimento.valor,
      data: investimento.data.split('T')[0]
    });
    setIsEditFormOpen(true);
  };

  return (
    <div className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen pb-20">
      {/* Cabeçalho e botões */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Investimentos</h1>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {isFilterOpen ? <X size={18} /> : <Filter size={18} />}
            <span className="hidden md:inline">Filtrar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      {isFilterOpen && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm">Tipo</label>
              <select
                name="tipo"
                value={filtros.tipo}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Todos</option>
                <option value="Renda Fixa">Renda Fixa</option>
                <option value="Ações">Ações</option>
                <option value="Fundos Imobiliários">Fundos Imobiliários</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm">Data Início</label>
              <input
                type="date"
                name="dataInicio"
                value={filtros.dataInicio}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm">Data Fim</label>
              <input
                type="date"
                name="dataFim"
                value={filtros.dataFim}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Gráficos */}
      {investimentosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Distribuição por Tipo</h2>
            <div className="h-64">
              {typeof window !== 'undefined' && (
                <Chart
                  options={{
                    labels: dadosGraficoPizza.labels,
                    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                    legend: {
                      position: 'bottom'
                    },
                    responsive: [{
                      breakpoint: 480,
                      options: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }]
                  }}
                  series={dadosGraficoPizza.series}
                  type="pie"
                  width="100%"
                  height="100%"
                />
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Valor por Tipo</h2>
            <div className="h-64">
              {typeof window !== 'undefined' && (
                <Chart
                  options={{
                    chart: {
                      type: 'bar',
                      toolbar: {
                        show: false
                      }
                    },
                    plotOptions: {
                      bar: {
                        borderRadius: 4,
                        horizontal: true,
                      }
                    },
                    dataLabels: {
                      enabled: false
                    },
                    xaxis: {
                      categories: dadosGraficoBarras.labels,
                    },
                    colors: ['#3B82F6'],
                    responsive: [{
                      breakpoint: 480,
                      options: {
                        plotOptions: {
                          bar: {
                            horizontal: false
                          }
                        }
                      }
                    }]
                  }}
                  series={dadosGraficoBarras.series}
                  type="bar"
                  width="100%"
                  height="100%"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lista de investimentos */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : investimentosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {investimentos.length === 0 
              ? 'Nenhum investimento cadastrado' 
              : 'Nenhum investimento encontrado com os filtros atuais'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {investimentosFiltrados.map((investimento) => (
                  <tr key={investimento._id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {investimento.nome}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {investimento.tipo}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      R$ {investimento.valor.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(investimento.data).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(investimento)}
                          className="text-blue-500 hover:text-blue-700"
                          aria-label="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(investimento._id)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Excluir"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botão flutuante para adicionar */}
      <button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center z-40"
        aria-label="Adicionar investimento"
      >
        <Plus size={24} />
      </button>

      {/* Modal de Adição */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Novo Investimento</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={addFormData.nome}
                  onChange={handleAddInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Tipo</label>
                <select
                  name="tipo"
                  value={addFormData.tipo}
                  onChange={handleAddInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="Renda Fixa">Renda Fixa</option>
                  <option value="Ações">Ações</option>
                  <option value="Fundos Imobiliários">Fundos Imobiliários</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Valor (R$)</label>
                <input
                  type="number"
                  name="valor"
                  value={addFormData.valor}
                  onChange={handleAddInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block mb-2">Data</label>
                <input
                  type="date"
                  name="data"
                  value={addFormData.data}
                  onChange={handleAddInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {isEditFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Editar Investimento</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={editFormData.nome}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Tipo</label>
                <select
                  name="tipo"
                  value={editFormData.tipo}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="Renda Fixa">Renda Fixa</option>
                  <option value="Ações">Ações</option>
                  <option value="Fundos Imobiliários">Fundos Imobiliários</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Valor (R$)</label>
                <input
                  type="number"
                  name="valor"
                  value={editFormData.valor}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block mb-2">Data</label>
                <input
                  type="date"
                  name="data"
                  value={editFormData.data}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditFormOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default InvestimentosPage;