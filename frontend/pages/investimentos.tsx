import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash, Filter, X, DollarSign, PieChart, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { investimentoAPI } from '../services/api';
import 'react-toastify/dist/ReactToastify.css';

// Tipagem melhorada
type Investimento = {
  _id: string;
  nome: string;
  tipo: 'Renda Fixa' | 'Tesouro Direto' | 'Ações' | 'Fundos Imobiliários' | 'Criptomoedas' | 'Previdência Privada' | 'ETF' | 'Internacional' | 'Renda Variável'; // Adicionado 'Renda Variável'
  valor: number;
  data: string;
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
  // Estados
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    tipo: '',
    dataInicio: '',
    dataFim: '',
    ordenacao: 'recentes',
    open: false
  });

  const [form, setForm] = useState({
    open: false,
    mode: 'add' as 'add' | 'edit',
    data: {} as Partial<Investimento>
  });

  // Cores para tipos de investimento - Adicionado 'Renda Variável'
  const tipoCores = {
    'Renda Fixa': { bg: 'bg-blue-100', text: 'text-blue-800', dark: { bg: 'dark:bg-blue-900', text: 'dark:text-blue-200' } },
    'Tesouro Direto': { bg: 'bg-indigo-100', text: 'text-indigo-800', dark: { bg: 'dark:bg-indigo-900', text: 'dark:text-indigo-200' } },
    'Ações': { bg: 'bg-green-100', text: 'text-green-800', dark: { bg: 'dark:bg-green-900', text: 'dark:text-green-200' } },
    'Fundos Imobiliários': { bg: 'bg-purple-100', text: 'text-purple-800', dark: { bg: 'dark:bg-purple-900', text: 'dark:text-purple-200' } },
    'Criptomoedas': { bg: 'bg-yellow-100', text: 'text-yellow-800', dark: { bg: 'dark:bg-yellow-900', text: 'dark:text-yellow-200' } },
    'Previdência Privada': { bg: 'bg-pink-100', text: 'text-pink-800', dark: { bg: 'dark:bg-pink-900', text: 'dark:text-pink-200' } },
    'ETF': { bg: 'bg-teal-100', text: 'text-teal-800', dark: { bg: 'dark:bg-teal-900', text: 'dark:text-teal-200' } },
    'Internacional': { bg: 'bg-rose-100', text: 'text-rose-800', dark: { bg: 'dark:bg-rose-900', text: 'dark:text-rose-200' } },
    'Renda Variável': { bg: 'bg-orange-100', text: 'text-orange-800', dark: { bg: 'dark:bg-orange-900', text: 'dark:text-orange-200' } } // Nova cor
  };


  // Buscar investimentos com tratamento robusto
  const fetchInvestimentos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await investimentoAPI.getAll();

      // Verificação em múltiplos níveis
      const rawData = (response as any)?.data?.data || (response as any)?.data || response;

      if (!Array.isArray(rawData)) {
        throw new Error('Formato de dados inválido recebido da API');
      }

      // Formatação consistente dos dados - Adicionado 'Renda Variável' aos tipos válidos
      const tiposValidos: Investimento['tipo'][] = ['Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários', 'Criptomoedas', 'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável'];

      const formattedData = rawData.map((item: any) => ({
        _id: item._id?.$oid || item._id || Math.random().toString(36).substring(2, 9),
        nome: item.nome || 'Sem nome',
        tipo: tiposValidos.includes(item.tipo) ? item.tipo : 'Renda Fixa', // Default para 'Renda Fixa' se inválido
        valor: Number(item.valor) || 0,
        data: item.data ? new Date(item.data).toISOString() : new Date().toISOString()
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

  // Filtra e ordena os investimentos com segurança
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

  // Dados para gráficos com validação - Adicionado 'Renda Variável' às cores
  const chartData = useMemo(() => {
    const tiposValidos: Investimento['tipo'][] = ['Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários', 'Criptomoedas', 'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável']; // Incluir Renda Variável aqui também
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
            case 'Renda Variável': return '#F97316'; // Cor para Renda Variável
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
             case 'Renda Variável': return '#FB923C'; // Cor para Renda Variável (opcional, pode ser diferente do pie)
            default: return '#9CA3AF';
          }
        })
      }
    };
  }, [investimentosFiltrados]);

  const handleFormSubmit = async () => {
    try {
      // Validação dos campos
      const valorNumerico = Number(form.data.valor);
      const dataSelecionada = new Date(form.data.data || ''); // Use empty string for Date constructor if data is undefined/null

      if (!form.data.nome?.trim()) {
        toast.error('Nome é obrigatório');
        return;
      }
      if (!form.data.tipo) {
        toast.error('Tipo é obrigatório');
        return;
      }
      // Validar se o valor é um número válido e positivo
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
         toast.error('Valor deve ser positivo e um número válido');
         return;
      }
      if (!form.data.data) {
        toast.error('Data é obrigatória');
        return;
      }
      // Validar se a data é uma data válida
      if (isNaN(dataSelecionada.getTime())) {
         toast.error('Data inválida');
         return;
      }

      const payload = {
        nome: form.data.nome.trim(),
        tipo: form.data.tipo,
        valor: valorNumerico, // Use o valor numérico validado
        data: dataSelecionada.toISOString() // Envia a data selecionada em formato ISO
      };

      // Operação de criação/atualização
      if (form.mode === 'edit' && form.data._id) {
        await investimentoAPI.update(form.data._id, payload);
        toast.success('Investimento atualizado com sucesso!');
      } else {
        await investimentoAPI.create(payload);
        toast.success('Investimento criado com sucesso!');
      }

      await fetchInvestimentos();
      setForm({ ...form, open: false });

    } catch (err) {
      console.error('Erro no formulário:', err);
      // Mensagem genérica caso ocorra outro tipo de erro
      toast.error('Ocorreu um erro ao processar a solicitação');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este investimento?')) return;

    try {
      await investimentoAPI.delete(id);
      toast.success('Investimento excluído com sucesso!'); // Esta mensagem já está aqui
      await fetchInvestimentos();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir investimento';
      toast.error(errorMessage);
      console.error('Erro ao excluir:', err);
    }
  };

  // Componente de Badge
  const Badge = ({ tipo }: { tipo: keyof typeof tipoCores }) => {
     const color = tipoCores[tipo] || { bg: 'bg-gray-100', text: 'text-gray-800', dark: { bg: 'dark:bg-gray-700', text: 'dark:text-gray-300' } }; // Default grey for unknown types
     return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${color.bg} ${color.text} ${color.dark.bg} ${color.dark.text}`}>
           {tipo}
        </span>
     );
  };


  // Renderização condicional
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 max-w-md text-center">
          <h3 className="font-bold mb-2">Erro ao carregar investimentos</h3>
          <p>{error}</p>
          <button
            onClick={fetchInvestimentos}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const todosTipos: Investimento['tipo'][] = ['Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários', 'Criptomoedas', 'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável']; // Lista completa para selects


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
              Meus Investimentos
            </h1>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg inline-block">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Total: <span className="text-blue-600 dark:text-blue-400">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(
                    investimentosFiltrados.reduce((sum, inv) => sum + (inv?.valor || 0), 0)
                  )}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setFilters({ ...filters, open: !filters.open })}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {filters.open ? <X size={18} /> : <Filter size={18} />}\
              <span className="hidden md:inline">Filtrar</span>
            </button>
            <button
              onClick={() => setForm({
                open: true,
                mode: 'add',
                data: {
                  tipo: 'Renda Fixa',
                  data: new Date().toISOString().split('T')[0]
                }
              })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hidden md:flex items-center gap-2"
            >
              <Plus size={18} />
              Novo
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {filters.open && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
              <select
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">Todos</option>
                 {todosTipos.map(tipo => ( // Usando a lista completa aqui
                   <option key={tipo} value={tipo}>{tipo}</option>
                 ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">De</label>
              <input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Até</label>
              <input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Ordenar</label>
              <select
                value={filters.ordenacao}
                onChange={(e) => setFilters({ ...filters, ordenacao: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição por Valor</h2>
          </div>
          <Chart
            options={{
              chart: {
                type: 'pie',
                foreColor: '#6B7280',
              },
              labels: chartData.pie.labels,
              colors: chartData.pie.colors,
              legend: {
                position: 'bottom',
                labels: {
                  colors: ['#6B7280']
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
        </div>

        {/* Gráfico de Rosca - Distribuição por Quantidade */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição por Quantidade</h2>
          </div>
          <Chart
            options={{
              chart: {
                type: 'donut',
                foreColor: '#6B7280',
              },
              labels: chartData.donut.labels,
              colors: chartData.donut.colors,
              legend: {
                position: 'bottom',
                labels: {
                  colors: ['#6B7280']
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
                        color: '#6B7280'
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
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Carregando...</span>
          </div>
        ) : investimentosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="mx-auto text-gray-400 mb-3" size={48} />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum investimento encontrado</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {investimentos.length === 0
                ? 'Comece adicionando seu primeiro investimento'
                : 'Tente ajustar os filtros'}
            </p>
            <button
              onClick={() => setForm({ open: true, mode: 'add', data: {} })}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              Adicionar Investimento
            </button>
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
                            onClick={() => setForm({ open: true, mode: 'edit', data: investimento })}
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
                        onClick={() => setForm({ open: true, mode: 'edit', data: investimento })}
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
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Botão Flutuante para Mobile */}
      <button
        onClick={() => setForm({ open: true, mode: 'add', data: {} })}
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
                    value={form.data.valor === undefined ? '' : form.data.valor} // Evitar "undefined" no campo
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
                    value={form.data.data ? new Date(form.data.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        data: {
                          ...form.data,
                          data: new Date(e.target.value).toISOString()
                        } 
                      });
                    }}                        
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
  );
};

export default InvestimentosDashboard;