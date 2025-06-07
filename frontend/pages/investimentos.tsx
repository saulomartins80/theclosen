import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash, Filter, X, DollarSign, PieChart, Loader2, Shield, TrendingUp, Home, Bitcoin, Layers, Globe, Activity, BarChart } from 'lucide-react'; // Added BarChart for consistency
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { investimentoAPI } from '../services/api';
import { motion } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from "../context/ThemeContext"; // Import useTheme

// Tipagem melhorada
type Investimento = {
  _id: string;
  nome: string;
  tipo: 'Renda Fixa' | 'Tesouro Direto' | 'Ações' | 'Fundos Imobiliários' | 'Criptomoedas' | 'Previdência Privada' | 'ETF' | 'Internacional' | 'Renda Variável';
  valor: number;
  data: string;
  meta?: number;
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Componente dinâmico para os gráficos
const Chart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-blue-500" size={24} />
    </div>
  )
});

const InvestimentosDashboard = () => {
  const { resolvedTheme } = useTheme();
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    tipo: '',
    dataInicio: '',
    dataFim: '',
    ordenacao: 'recentes',
    open: true
  });

  const [form, setForm] = useState({
    open: false,
    mode: 'add' as 'add' | 'edit',
    data: {} as Partial<Investimento>
  });

  const tipoCores = {
    'Renda Fixa': { bg: 'bg-blue-100', text: 'text-blue-800', dark: { bg: 'dark:bg-blue-900', text: 'dark:text-blue-200' } },
    'Tesouro Direto': { bg: 'bg-indigo-100', text: 'text-indigo-800', dark: { bg: 'dark:bg-indigo-900', text: 'dark:text-indigo-200' } },
    'Ações': { bg: 'bg-green-100', text: 'text-green-800', dark: { bg: 'dark:bg-green-900', text: 'dark:text-green-200' } },
    'Fundos Imobiliários': { bg: 'bg-purple-100', text: 'text-purple-800', dark: { bg: 'dark:bg-purple-900', text: 'dark:text-purple-200' } },
    'Criptomoedas': { bg: 'bg-yellow-100', text: 'text-yellow-800', dark: { bg: 'dark:bg-yellow-900', text: 'dark:text-yellow-200' } },
    'Previdência Privada': { bg: 'bg-pink-100', text: 'text-pink-800', dark: { bg: 'dark:bg-pink-900', text: 'dark:text-pink-200' } },
    'ETF': { bg: 'bg-teal-100', text: 'text-teal-800', dark: { bg: 'dark:bg-teal-900', text: 'dark:text-teal-200' } },
    'Internacional': { bg: 'bg-rose-100', text: 'text-rose-800', dark: { bg: 'dark:bg-rose-900', text: 'dark:text-rose-200' } },
    'Renda Variável': { bg: 'bg-orange-100', text: 'text-orange-800', dark: { bg: 'dark:bg-orange-900', text: 'dark:text-orange-200' } }
  };

  const fetchInvestimentos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await investimentoAPI.getAll();
      const rawData = (response as any)?.data?.data || (response as any)?.data || response;

      if (!Array.isArray(rawData)) {
        throw new Error('Formato de dados inválido recebido da API');
      }

      const tiposValidos: Investimento['tipo'][] = ['Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários', 'Criptomoedas', 'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável'];

      const formattedData = rawData.map((item: any) => ({
        _id: item._id?.$oid || item._id || Math.random().toString(36).substring(2, 9),
        nome: item.nome || 'Sem nome',
        tipo: tiposValidos.includes(item.tipo) ? item.tipo : 'Renda Fixa',
        valor: Number(item.valor) || 0,
        data: item.data ? new Date(item.data).toISOString() : new Date().toISOString(),
        meta: item.meta !== undefined ? Number(item.meta) : undefined
      }));

      setInvestimentos(formattedData);
    } catch (err) {
      console.error('Erro ao buscar investimentos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar investimentos');
      setInvestimentos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestimentos();
  }, []);

  const investimentosFiltrados = useMemo(() => {
    if (!Array.isArray(investimentos)) return [];
    return investimentos
      .filter(inv => {
        if (!inv) return false;
        try {
          const invDate = new Date(inv.data);
          const startDate = filters.dataInicio ? new Date(filters.dataInicio) : null;
          const endDate = filters.dataFim ? new Date(filters.dataFim) : null;
          return (
            (!filters.tipo || inv.tipo === filters.tipo) &&
            (!startDate || invDate >= startDate) &&
            (!endDate || invDate <= endDate)
          );
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        try {
          return filters.ordenacao === 'recentes'
            ? new Date(b.data).getTime() - new Date(a.data).getTime()
            : new Date(a.data).getTime() - new Date(b.data).getTime();
        } catch {
          return 0;
        }
      });
  }, [investimentos, filters]);

  const chartData = useMemo(() => {
    const tiposValidos: Investimento['tipo'][] = ['Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários', 'Criptomoedas', 'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável'];
    const tiposPresentes = Array.from(
      new Set<Investimento['tipo']>(
        investimentosFiltrados
          .map(inv => inv?.tipo)
          .filter((tipo): tipo is Investimento['tipo'] =>
            tiposValidos.includes(tipo as any)
          )
      )
    );
    return {
      pie: {
        series: tiposPresentes.map(tipo =>
          investimentosFiltrados
            .filter(inv => inv?.tipo === tipo)
            .reduce((total, inv) => total + (inv?.valor || 0), 0)
        ),
        labels: tiposPresentes,
        colors: tiposPresentes.map(tipo => {
          switch(tipo) {
            case 'Renda Fixa': return '#3B82F6';
            case 'Tesouro Direto': return '#6366F1';
            case 'Ações': return '#10B981';
            case 'Fundos Imobiliários': return '#8B5CF6';
            case 'Criptomoedas': return '#F59E0B';
            case 'Previdência Privada': return '#EC4899';
            case 'ETF': return '#14B8A6';
            case 'Internacional': return '#F43F5E';
            case 'Renda Variável': return '#F97316';
            default: return '#6B7280';
          }
        })
      },
      donut: {
        series: tiposPresentes.map(tipo =>
          investimentosFiltrados
            .filter(inv => inv?.tipo === tipo)
            .length
        ),
        labels: tiposPresentes,
        colors: tiposPresentes.map(tipo => {
          switch(tipo) {
            case 'Renda Fixa': return '#60A5FA';
            case 'Tesouro Direto': return '#818CF8';
            case 'Ações': return '#34D399';
            case 'Fundos Imobiliários': return '#C084FC';
            case 'Criptomoedas': return '#FACC15';
            case 'Previdência Privada': return '#F472B6';
            case 'ETF': return '#2DD4BF';
            case 'Internacional': return '#FB7185';
            case 'Renda Variável': return '#FB923C';
            default: return '#9CA3AF';
          }
        })
      }
    };
  }, [investimentosFiltrados]);

  const handleFormSubmit = async () => {
  try {
    // Validações básicas
    if (!form.data.nome?.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!form.data.tipo) {
      toast.error('Tipo é obrigatório');
      return;
    }
    if (form.data.valor === undefined || form.data.valor <= 0) {
      toast.error('Valor deve ser positivo');
      return;
    }
    if (!form.data.data) {
      toast.error('Data é obrigatória');
      return;
    }

    // Cria objeto Date com horário fixo para evitar problemas de fuso horário
    const dataSelecionada = new Date(form.data.data + 'T12:00:00');
    if (isNaN(dataSelecionada.getTime())) {
      toast.error('Data inválida');
      return;
    }

    // Prepara os dados para a API
    const payload = {
      nome: form.data.nome.trim(),
      tipo: form.data.tipo,
      valor: Number(form.data.valor),
      data: dataSelecionada.toISOString(), // Converte para ISO string apenas aqui
      ...(form.data.meta !== undefined && { meta: Number(form.data.meta) })
    };

    // Chama a API
    if (form.mode === 'edit' && form.data._id) {
      await investimentoAPI.update(form.data._id, payload);
      toast.success('Investimento atualizado com sucesso!');
    } else {
      await investimentoAPI.create(payload);
      toast.success('Investimento criado com sucesso!');
    }

    // Atualiza a lista e fecha o modal
    await fetchInvestimentos();
    setForm({ ...form, open: false });

  } catch (err) {
    console.error('Erro no formulário:', err);
    const errorMessage = (err as any)?.response?.data?.message || (err as any).message || 'Erro ao processar';
    toast.error(errorMessage);
  }
};

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este investimento?')) return;

    try {
      await investimentoAPI.delete(id);
      toast.success('Investimento excluído com sucesso!');
      await fetchInvestimentos();
    } catch (err) {
      const errorMessage = (err as any)?.response?.data?.message || (err as any).message || 'Erro ao excluir investimento';
      toast.error(errorMessage);
      console.error('Erro ao excluir:', err);
    }
  };

  const Badge = ({ tipo }: { tipo: keyof typeof tipoCores }) => {
    const color = tipoCores[tipo] || {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dark: { bg: 'dark:bg-gray-700', text: 'dark:text-gray-300' }
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1
        ${color.bg} ${color.text} ${color.dark.bg} ${color.dark.text}`}>
        {tipo === 'Renda Fixa' && <Shield size={12} />}
        {tipo === 'Ações' && <TrendingUp size={12} />}
        {tipo === 'Fundos Imobiliários' && <Home size={12} />}
        {tipo === 'Criptomoedas' && <Bitcoin size={12} />}
        {tipo === 'ETF' && <Layers size={12} />}
        {tipo === 'Internacional' && <Globe size={12} />}
        {tipo === 'Renda Variável' && <Activity size={12} />}
        {tipo}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader2 className={`animate-spin ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-screen ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-4 rounded-lg max-w-md text-center ${resolvedTheme === 'dark' ? 'bg-red-900/20 text-red-300 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <h3 className="font-bold mb-2">Erro ao carregar investimentos</h3>
          <p>{error}</p>
          <button
            onClick={fetchInvestimentos}
            className={`mt-4 px-4 py-2 rounded ${resolvedTheme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const todosTipos: Investimento['tipo'][] = ['Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários', 'Criptomoedas', 'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável'];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        resolvedTheme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      } p-4 md:p-6`}
    >
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
              <DollarSign size={24} />
            </span>
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Meus Investimentos
              </h1>
              <p className={`text-sm mt-1 text-gray-600 dark:text-gray-400`}>
                Acompanhe sua carteira de investimentos.
              </p>
            </div>
          </div>
          <div className="hidden md:flex gap-3">
            <button
              onClick={() => setFilters({ ...filters, open: !filters.open })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${resolvedTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
            >
              <Filter size={18} />
              {filters.open ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
            <button
              onClick={() => setForm({ open: true, mode: 'add', data: { data: '' } })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white ${resolvedTheme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              <Plus size={18} />
              Novo Investimento
            </button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Valor Total da Carteira */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-blue-500"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Valor Total da Carteira</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(
                    investimentosFiltrados.reduce((sum, inv) => sum + (inv?.valor || 0), 0)
                  )}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <DollarSign className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
            </div>
          </motion.div>
          {/* Tipos de Investimento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Tipos de Investimento</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {chartData.pie.labels.length} tipos
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Distribuição da sua carteira
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                <PieChart className="text-green-600 dark:text-green-400" size={20} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filtros */}
        {filters.open && (
          <div className={`rounded-xl shadow-sm p-4 md:p-6 mb-6 ${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block mb-2 text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tipo</label>
                <select
                  value={filters.tipo}
                  onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${resolvedTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="">Todos</option>
                  {todosTipos.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block mb-2 text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>De</label>
                <input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${resolvedTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block mb-2 text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Até</label>
                <input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${resolvedTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block mb-2 text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Ordenar</label>
                <select
                  value={filters.ordenacao}
                  onChange={(e) => setFilters({ ...filters, ordenacao: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${resolvedTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="antigos">Mais antigos</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Pizza - Distribuição por Valor */}
          <div className={`rounded-xl shadow-sm p-6 ${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <PieChart className={`${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição por Valor</h2>
            </div>
            {chartData.pie.series.some(value => value > 0) ? (
              <Chart
                options={{
                  chart: {
                    type: 'pie',
                    foreColor: resolvedTheme === 'dark' ? '#9CA3AF' : '#4B5563',
                  },
                  labels: chartData.pie.labels,
                  colors: chartData.pie.colors,
                  legend: {
                    position: 'bottom',
                    labels: {
                      colors: resolvedTheme === 'dark' ? '#9CA3AF' : '#4B5563',
                    }
                  },
                  responsive: [{
                    breakpoint: 480,
                    options: {
                      chart: {
                        width: '100%'
                      },
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }]
                }}
                series={chartData.pie.series}
                type="pie"
                height={300}
              />
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">Sem dados para o gráfico de valor.</div>
            )}
          </div>
          {/* Gráfico de Rosca - Distribuição por Quantidade */}
          <div className={`rounded-xl shadow-sm p-6 ${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <BarChart className={`${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição por Quantidade</h2>
            </div>
            {chartData.donut.series.some(value => value > 0) ? (
              <Chart
                options={{
                  chart: {
                    type: 'donut',
                    foreColor: resolvedTheme === 'dark' ? '#9CA3AF' : '#4B5563',
                  },
                  labels: chartData.donut.labels,
                  colors: chartData.donut.colors,
                  legend: {
                    position: 'bottom',
                    labels: {
                      colors: resolvedTheme === 'dark' ? '#9CA3AF' : '#4B5563',
                    }
                  },
                  plotOptions: {
                    pie: {
                      donut: {
                        labels: {
                          show: true,
                          total: {
                            show: true,
                            label: 'Total',
                            color: resolvedTheme === 'dark' ? '#D1D5DB' : '#374151',
                          }
                        }
                      }
                    }
                  },
                  responsive: [{
                    breakpoint: 480,
                    options: {
                      chart: {
                        width: '100%'
                      },
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }]
                }}
                series={chartData.donut.series}
                type="donut"
                height={300}
              />
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">Sem dados para o gráfico de quantidade.</div>
            )}
          </div>
        </div>

        {/* Tabela */}
        <div className={`rounded-xl shadow-sm p-4 md:p-6 ${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className={`animate-spin ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} size={32} />
              <span className={`ml-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Carregando...</span>
            </div>
          ) : investimentosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className={`mx-auto mb-3 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} size={48} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum investimento encontrado</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {investimentos.length === 0
                  ? 'Comece adicionando seu primeiro investimento'
                  : 'Tente ajustar os filtros'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {investimentosFiltrados.map((investimento) => (
                      <tr key={investimento._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {investimento.nome}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge tipo={investimento.tipo} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(investimento.valor)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(investimento.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex justify-start gap-2">
                            <button
                              onClick={() => setForm({ 
                                open: true, 
                                mode: 'edit', 
                                data: {
                                  ...investimento,
                                  data: new Date(investimento.data).toISOString().split('T')[0]
                                }
                              })}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              aria-label="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(investimento._id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {investimentosFiltrados.map((investimento) => (
                  <div key={investimento._id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{investimento.nome}</h3>
                        <div className="mt-1">
                          <Badge tipo={investimento.tipo} />
                        </div>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(investimento.valor)}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(investimento.data).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setForm({ 
                            open: true, 
                            mode: 'edit', 
                            data: {
                              ...investimento,
                              data: new Date(investimento.data).toISOString().split('T')[0]
                            }
                          })}
                          className="text-blue-600 dark:text-blue-400 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-gray-700"
                          aria-label="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(investimento._id)}
                          className="text-red-600 dark:text-red-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-gray-700"
                          aria-label="Excluir"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                    {investimento.meta && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>Progresso</span>
                          <span>{Math.round((investimento.valor / investimento.meta) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (investimento.valor / investimento.meta) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Botão Flutuante para Mobile */}
        <button
          onClick={() => setForm({ open: true, mode: 'add', data: { data: '' } })}
          className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors md:hidden z-40"
        >
          <Plus size={24} />
        </button>

        {/* Modal do Formulário */}
        {form.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  {form.mode === 'add' ? 'Novo Investimento' : 'Editar Investimento'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nome *</label>
                    <input
                      type="text"
                      value={form.data.nome || ''}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, nome: e.target.value } })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Ex: CDB Banco XYZ"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo *</label>
                    <select
                      value={form.data.tipo || 'Renda Fixa'}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, tipo: e.target.value as Investimento['tipo'] } })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {Object.keys(tipoCores).map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Valor (R$) *</label>
                    <input
                      type="number"
                      value={form.data.valor === undefined ? '' : form.data.valor}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, valor: e.target.value === '' ? undefined : Number(e.target.value) } })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      min="0.01"
                      step="0.01"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Data *</label>
                    <input
                      type="date"
                      value={form.data.data || ''}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setForm({ 
                        ...form, 
                        data: { 
                          ...form.data, 
                          data: e.target.value 
                        } 
                      })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setForm({ ...form, open: false })}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFormSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {form.mode === 'add' ? 'Adicionar' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestimentosDashboard;