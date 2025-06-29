import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash, ChevronDown, ChevronUp, TrendingUp, Trophy, DollarSign, Flag, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LinearScale, BarElement, CategoryScale } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import CountUp from 'react-countup';
import ProgressBar from "@ramonak/react-progress-bar";
import api, { metaAPI } from '../services/api';
import { getAuth } from 'firebase/auth';
import { useTheme } from "../context/ThemeContext"; // Import useTheme
import { useRouter } from 'next/router';

ChartJS.register(ArcElement, Tooltip, Legend, LinearScale, BarElement, CategoryScale);

interface Meta {
  _id?: string;
  meta: string;
  descricao: string;
  valor_total: number;
  valor_atual: number;
  data_conclusao: string;
  userId: string; // Mantido no tipo, mas o backend que gerencia ao salvar
  createdAt?: string;
  categoria?: string;
  prioridade?: 'baixa' | 'media' | 'alta';
  concluida?: boolean;
}

interface DadosCategoria {
  categoria: string;
  percentual_conclusao: number;
  valor_total: number;
  valor_atual: number;
  count: number;
}

const MetasDashboard = () => {
  const { resolvedTheme } = useTheme(); // Use o hook useTheme
  const [metas, setMetas] = useState<Meta[]>([]);
  const [dadosCategorias, setDadosCategorias] = useState<DadosCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState({
    form: {
      open: false,
      mode: 'add' as 'add' | 'edit',
      data: {} as Partial<Meta>
    },
    filters: {
      status: 'todas' as 'todas' | 'concluidas' | 'em-andamento',
      categoria: '',
      prioridade: ''
    },
    expandedMeta: null as string | null
  });

  const router = useRouter();

  // Monitora parâmetros da URL para abrir formulário automaticamente
  useEffect(() => {
    if (router.query.action === 'new') {
      openForm();
      // Remove o parâmetro da URL para não abrir novamente ao recarregar
      router.replace('/metas', undefined, { shallow: true });
    }
  }, [router.query.action, router]);

  // Busca metas otimizada
  const fetchMetas = useCallback(async () => {
    setLoading(true);
    try {
      const metasList = await metaAPI.getAll();
      setMetas(metasList);
    } catch (error) {
      console.error("Erro ao buscar metas:", error);
      const errorMessage = (error as any).response?.data?.message || (error as any).message || "Erro ao buscar metas";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca progresso por categoria otimizada
  const fetchProgressoPorCategoria = useCallback(async () => {
    try {
      const response = await api.get("/api/goals/progress-by-category");
      setDadosCategorias(response.data);
    } catch (error) {
      console.error("Erro ao buscar progresso por categoria:", error);
      const errorMessage = (error as any).response?.data?.message || (error as any).message || "Erro ao carregar dados do gráfico";
      toast.error(errorMessage);
    }
  }, []);

  // Carrega todos os dados na montagem
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMetas(), fetchProgressoPorCategoria()]);
      setLoading(false);
    };
    loadData();
  }, [fetchMetas, fetchProgressoPorCategoria]);

  // Atualiza progresso quando metas mudam
  useEffect(() => {
    if (!loading) {
      fetchProgressoPorCategoria();
    }
  }, [metas, loading, fetchProgressoPorCategoria]);

  // Operações CRUD (AGORA USANDO metaAPI)
  const handleSaveMeta = async () => {
  // Validação do formulário
  if (!state.form.data.meta || !state.form.data.descricao ||
      !state.form.data.valor_total || !state.form.data.data_conclusao) {
    toast.error('Preencha todos os campos obrigatórios');
    return;
  }

  // Validação da data
  const rawDateValue = state.form.data.data_conclusao;
  if (!rawDateValue) {
    toast.error('Data de conclusão é obrigatória');
    return;
  }

  // Cria objeto Date com horário fixo (meio-dia UTC)
  const dataConclusaoObj = new Date(rawDateValue + 'T12:00:00Z');
  
  // Verifica se a data é válida
  if (isNaN(dataConclusaoObj.getTime())) {
    toast.error('Data de conclusão inválida');
    return;
  }

  try {
    // Obter userId do usuário autenticado
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Prepara os dados com userId e data formatada corretamente
    const metaPayload = {
      meta: state.form.data.meta,
      descricao: state.form.data.descricao,
      valor_total: state.form.data.valor_total,
      valor_atual: state.form.data.valor_atual || 0,
      data_conclusao: dataConclusaoObj.toISOString(), // Usa a ISO string com horário
      categoria: state.form.data.categoria,
      prioridade: state.form.data.prioridade || 'media',
      userId: user.uid
    };

    if (state.form.mode === 'add') {
      await metaAPI.create(metaPayload);
      console.log('🎉 Toast de sucesso será chamado para meta criada');
      toast.success(`Meta adicionada com sucesso!`);
    } else {
      if (!state.form.data._id) {
        console.log('❌ Toast de erro será chamado - ID não encontrado');
        toast.error('ID da meta não encontrado para atualização.');
        return;
      }
      await metaAPI.update(state.form.data._id, metaPayload);
      console.log('🎉 Toast de sucesso será chamado para meta atualizada');
      toast.success(`Meta atualizada com sucesso!`);
    }

    await fetchMetas();
    closeForm();
  } catch (error: any) {
    console.error("Erro ao salvar meta:", error);
    const errorMessage = error.response?.data?.message || error.message || `Erro ao ${state.form.mode === 'add' ? 'adicionar' : 'atualizar'} meta`;
    toast.error(errorMessage);
  }
};

  // Operação de Delete (AGORA USANDO metaAPI)
  const handleDeleteMeta = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return;

    try {
      // Usando metaAPI.delete()
      await metaAPI.delete(id);

      toast.success("Meta excluída com sucesso!");
      fetchMetas(); // Atualiza a lista após excluir
    } catch (error: any) {
      console.error("Erro ao excluir meta:", error);
       // Tratamento de erro mais robusto com Axios
      const errorMessage = error.response?.data?.message || error.message || "Erro ao excluir meta";
      toast.error(errorMessage);
    }
  };

  // Filtros e dados calculados (Sem mudanças, pois dependem do estado 'metas' local)
  const metasFiltradas = useMemo(() => {
    return metas.filter(meta => {
      return (
        (state.filters.status === 'todas' ||
         (state.filters.status === 'concluidas' && (meta.valor_atual >= meta.valor_total || meta.concluida)) ||
         (state.filters.status === 'em-andamento' && meta.valor_atual < meta.valor_total && !meta.concluida)) &&
        (!state.filters.categoria || meta.categoria === state.filters.categoria) &&
        (!state.filters.prioridade || meta.prioridade === state.filters.prioridade)
      );
    });
  }, [metas, state.filters]);

  const categorias = useMemo(() => {
    const categoriasUnicas = new Set<string>();
    metas.forEach(m => {
      if (m.categoria) {
        categoriasUnicas.add(m.categoria);
      }
    });
    return Array.from(categoriasUnicas);
  }, [metas]);

  const hoje = useMemo(() => new Date(), []);

  const metasProximas = useMemo(() => {
    return metas.filter(meta => {
      if (!meta.data_conclusao || isNaN(new Date(meta.data_conclusao).getTime())) {
        return false;
      }
      const diasRestantes = Math.ceil((new Date(meta.data_conclusao).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diasRestantes >= 0 && diasRestantes <= 7 && meta.valor_atual < meta.valor_total && !meta.concluida; // Adicionado check >= 0
    });
  }, [metas, hoje]);

  // Dados para gráficos (Sem mudanças, pois dependem do estado 'metas' local)
  const dadosGraficos = useMemo(() => ({
    pizza: {
      labels: ['Concluídas', 'Em andamento'],
      datasets: [{
        data: [
          metas.filter(m => m.valor_atual >= m.valor_total || m.concluida).length,
          metas.filter(m => m.valor_atual < m.valor_total && !m.concluida).length
        ],
        backgroundColor: ['#10B981', '#F59E0B']
      }]
    },
    barras: {
      labels: categorias,
      datasets: [{
        label: 'Valor Total',
        data: categorias.map(cat =>
          metas.filter(m => m.categoria === cat).reduce((sum, m) => sum + m.valor_total, 0)
        ),
        backgroundColor: '#3B82F6'
      }, {
        label: 'Valor Atual',
        data: categorias.map(cat =>
          metas.filter(m => m.categoria === cat).reduce((sum, m) => sum + m.valor_atual, 0)
        ),
        backgroundColor: '#10B981'
      }]
    }
  }), [metas, categorias]);

  // UI Helpers (Sem mudanças)
  const toggleExpandMeta = (id: string) => {
    setState(prev => ({
      ...prev,
      expandedMeta: prev.expandedMeta === id ? null : id
    }));
  };

  const openForm = (meta?: Meta) => {
    setState(prev => ({
      ...prev,
      form: {
        open: true,
        mode: meta ? 'edit' : 'add',
        data: meta ? {
          ...meta,
          data_conclusao: meta.data_conclusao ? meta.data_conclusao.split('T')[0] : ''
        } : {
          meta: '',
          descricao: '',
          valor_total: 0,
          valor_atual: 0,
          data_conclusao: new Date().toISOString().split('T')[0],          
          categoria: '',
          prioridade: 'media'
        }
      }
    }));
  };

  const closeForm = () => {
    setState(prev => ({ ...prev, form: { ...prev.form, open: false } }));
  };

  const getPrioridadeCor = (prioridade?: string) => {
    switch(prioridade) {
      case 'alta': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  return  (
    // Container principal com background responsivo e padding
    <div
      className={`min-h-screen transition-colors duration-300 ${
        resolvedTheme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="p-4 md:p-6">
        <div className="container mx-auto">
          {/* Header semelhante ao de transações */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            {/* Contêiner do Ícone e Título/Subtítulo */}
            <div className="flex items-center gap-3">
               {/* Ícone e seu contêiner com estilo semelhante */}
              <span className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                 <Trophy size={24} /> {/* Mantido o ícone de meta */}
              </span>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Minhas Metas Financeiras
                </h1>
                <p className={`text-sm mt-1 text-gray-600 dark:text-gray-400`}>
                  Acompanhe seu progresso em direção aos seus objetivos financeiros.
                </p>
              </div>
            </div>
            
            {/* Botão desktop para nova meta - Posicionado ao lado no desktop */}
            <button
              onClick={() => openForm()}
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white ${resolvedTheme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              <Plus size={18} />
              Nova Meta
            </button>
          </div>

          {/* Cards de resumo - Ajustado para 2 colunas em telas médias e maiores */}
          {/* Removido o primeiro card de título */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Card - Total em Metas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total em Metas</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    <CountUp
                      end={metas.reduce((sum, m) => sum + m.valor_total, 0)}
                      decimals={2}
                      separator="."
                      decimal=","
                      duration={1.5}
                      prefix="R$ "
                      className="text-3xl"
                    />
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <DollarSign className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                  <motion.div
                    className="h-1 bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.5, duration: 1 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Card - Total Alcançado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Alcançado</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    <CountUp
                      end={metas.reduce((sum, m) => sum + m.valor_atual, 0)}
                      decimals={2}
                      separator="."
                      decimal=","
                      duration={1.5}
                      prefix="R$ "
                      className="text-3xl"
                    />
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {metas.reduce((sum, m) => sum + m.valor_total, 0) > 0
                      ? `${((metas.reduce((sum, m) => sum + m.valor_atual, 0) /
                          metas.reduce((sum, m) => sum + m.valor_total, 0) *
                          100)).toFixed(1)}% do total`
                      : "0% do total"}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                  <motion.div
                    className="h-1 bg-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        metas.reduce((sum, m) => sum + m.valor_total, 0) > 0
                          ? ((metas.reduce((sum, m) => sum + m.valor_atual, 0) /
                              metas.reduce((sum, m) => sum + m.valor_total, 0) *
                              100)).toFixed(1) + '%'
                          : '0%'
                      }`
                    }}
                    transition={{ delay: 0.7, duration: 1.5 }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Alertas de Metas Próximas */}
          {metasProximas.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 mb-6 rounded-r-lg">
              <h3 className="font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <Flag size={18} />
                Metas com prazo próximo!
              </h3>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {metasProximas.map(meta => {
                  const diasRestantes = Math.ceil((new Date(meta.data_conclusao).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={meta._id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xs">
                      <p className="font-medium text-gray-900 dark:text-white">{meta.meta}</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300">
                        {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Status das Metas</h3>
              <div className="h-64">
                <Pie data={dadosGraficos.pizza} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Progresso por Categoria</h3>
              <div className="h-64">
                <Bar
                  data={dadosGraficos.barras}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  value={state.filters.status}
                  onChange={(e) => setState(prev => ({ ...prev, filters: { ...prev.filters, status: e.target.value as any } }))
                  }
                  className="w-full p-2 border rounded-lg bg-white text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="todas">Todas</option>
                  <option value="concluidas">Concluídas</option>
                  <option value="em-andamento">Em andamento</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                <select
                  value={state.filters.categoria}
                  onChange={(e) => setState(prev => ({ ...prev, filters: { ...prev.filters, categoria: e.target.value } }))
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">Todas</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Prioridade</label>
                <select
                  value={state.filters.prioridade}
                  onChange={(e) => setState(prev => ({ ...prev, filters: { ...prev.filters, prioridade: e.target.value } }))
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">Todas</option>
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Metas */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : metasFiltradas.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm text-center">
              <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Nenhuma meta encontrada</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {metas.length === 0
                  ? 'Comece criando sua primeira meta financeira!'
                  : 'Tente ajustar os filtros para encontrar suas metas'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {metasFiltradas.map(meta => (
                <div
                  key={meta._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all duration-200"
                >
                  <div
                    className="p-5 cursor-pointer flex justify-between items-center"
                    onClick={() => toggleExpandMeta(meta._id!)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${(meta.valor_atual >= meta.valor_total || meta.concluida) ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                        {(meta.valor_atual >= meta.valor_total || meta.concluida) ? (
                          <Trophy size={24} />
                        ) : (
                          <Flag size={24} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{meta.meta}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {meta.categoria && <span className="mr-2">{meta.categoria}</span>}
                          {meta.prioridade && (
                            <span className={`px-2 py-1 text-xs rounded-full ${getPrioridadeCor(meta.prioridade)}`}>
                              {meta.prioridade}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Progresso</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {((meta.valor_atual / meta.valor_total) * 100).toFixed(0)}%
                        </p>
                      </div>
                      {state.expandedMeta === meta._id ? (
                        <ChevronUp className="text-gray-500" />
                      ) : (
                        <ChevronDown className="text-gray-500" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {state.expandedMeta === meta._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0 border-t border-gray-200 dark:border-gray-700">
                          <div className="mb-4">
                            <ProgressBar
                              completed={Math.min(((meta.valor_atual / meta.valor_total) * 100), 100)}
                              bgColor={(meta.valor_atual >= meta.valor_total || meta.concluida) ? '#10B981' : '#3B82F6'}
                              height="12px"
                              borderRadius="6px"
                              labelAlignment="center"
                              labelColor="#ffffff"
                              animateOnRender
                              customLabel=""
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Atual</p>
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                R$ <CountUp end={meta.valor_atual} decimals={2} separator="." decimal="," />
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                R$ <CountUp end={meta.valor_total} decimals={2} separator="." decimal="," />
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Data Limite</p>
                              <p className="text-gray-900 dark:text-white flex items-center gap-1">
                                <Calendar size={16} />
                                {meta.data_conclusao && !isNaN(new Date(meta.data_conclusao).getTime())
                                  ? new Date(meta.data_conclusao).toLocaleDateString()
                                  : 'Data inválida'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Faltam</p>
                              <p className="text-gray-900 dark:text-white">
                                {(() => {
                                  if (!meta.data_conclusao || isNaN(new Date(meta.data_conclusao).getTime())) {
                                    return 'N/A';
                                  }

                                  const diffTime = new Date(meta.data_conclusao).getTime() - hoje.getTime();
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                  return diffDays >= 0
                                    ? `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
                                    : 'Prazo expirado';
                                })()}
                              </p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Descrição</p>
                            <p className="text-gray-900 dark:text-white">{meta.descricao}</p>
                          </div>

                          <div className="flex justify-end gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); openForm(meta); }}
                              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                            >
                              <Edit size={16} />
                              Editar
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteMeta(meta._id!); }}
                              className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center gap-2"
                            >
                              <Trash size={16} />
                              Excluir
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}

          {/* Modal do Formulário */}
          <AnimatePresence>
            {state.form.open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm md:max-w-md max-h-[90vh] overflow-y-auto"
                >
                  <div className="p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
                      {state.form.mode === 'add' ? 'Nova Meta' : 'Editar Meta'}
                    </h2>

                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nome da Meta *
                        </label>
                        <input
                          type="text"
                          value={state.form.data.meta || ''}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            form: {
                              ...prev.form,
                              data: { ...prev.form.data, meta: e.target.value }
                            }
                          }))}
                          className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm md:text-base"
                          placeholder="Ex: Comprar um carro"
                          required
                        />
                      </div>

                      <div>
                        <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Descrição *
                        </label>
                        <textarea
                          value={state.form.data.descricao || ''}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            form: {
                              ...prev.form,
                              data: { ...prev.form.data, descricao: e.target.value }
                            }
                          }))}
                          className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm md:text-base"
                          rows={2}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Valor Total (R$) *
                          </label>
                          <input
                            type="number"
                            value={state.form.data.valor_total || ''}
                            onChange={(e) => setState(prev => ({
                              ...prev,
                              form: {
                                ...prev.form,
                                data: { ...prev.form.data, valor_total: Number(e.target.value) }
                              }
                            }))}
                            className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm md:text-base"
                            min="0.01"
                            step="0.01"
                            required
                          />
                        </div>

                        <div>
                          <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Valor Atual (R$) *
                          </label>
                          <input
                            type="number"
                            value={state.form.data.valor_atual || ''}
                            onChange={(e) => setState(prev => ({
                              ...prev,
                              form: {
                                ...prev.form,
                                data: { ...prev.form.data, valor_atual: Number(e.target.value) }
                              }
                            }))}
                            className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm md:text-base"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Data Limite *
                          </label>
                          <input
                            type="date"
                            value={state.form.data.data_conclusao || ''}
                            onChange={(e) => setState(prev => ({
                              ...prev,
                              form: {
                                ...prev.form,
                                data: { ...prev.form.data, data_conclusao: e.target.value }
                              }
                            }))}
                            className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm md:text-base [color-scheme:light dark]"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Prioridade *
                          </label>
                          <select
                            value={state.form.data.prioridade || 'media'}
                            onChange={(e) => setState(prev => ({ 
                              ...prev, 
                              form: { 
                                ...prev.form, 
                                data: { ...prev.form.data, prioridade: e.target.value as any } 
                              } 
                            }))}
                            className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm md:text-base"
                          >
                            <option value="alta">Alta</option>
                            <option value="media">Média</option>
                            <option value="baixa">Baixa</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Categoria
                        </label>
                        <input
                          type="text"
                          value={state.form.data.categoria || ''}
                          onChange={(e) => setState(prev => ({ 
                            ...prev, 
                            form: { 
                              ...prev.form, 
                              data: { ...prev.form.data, categoria: e.target.value } 
                            } 
                          }))}
                          className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm md:text-base"
                          placeholder="Ex: Veículo, Casa, Viagem"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 mt-4 md:mt-6">
                      <button
                        type="button"
                        onClick={closeForm}
                        className="px-3 md:px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm md:text-base"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveMeta}
                        className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
                      >
                        {state.form.mode === 'add' ? 'Adicionar Meta' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Botão Flutuante para Mobile */}
          <button
            onClick={() => openForm()}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 p-4 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors md:hidden z-40"
            aria-label="Adicionar nova meta"
          >
            <Plus size={24} />
          </button>

          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            toastClassName={`text-sm rounded-xl shadow-lg ${resolvedTheme === "dark" ? "bg-gray-700 text-gray-100" : "bg-white text-gray-800"}`}
          />
        </div>
      </div>
    </div>
  );
};

export default MetasDashboard;