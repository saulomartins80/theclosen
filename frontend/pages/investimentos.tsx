import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash, Filter, X, DollarSign, PieChart, Loader2, Shield, TrendingUp, Home, Bitcoin, Layers, Globe, Activity, BarChart } from 'lucide-react';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { investimentoAPI } from '../services/api';
import { motion } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from "../context/ThemeContext";
import { useRouter } from 'next/router';
import { Investimento } from '../types';

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
  const router = useRouter();
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
    'Renda Variável': { bg: 'bg-orange-100', text: 'text-orange-800', dark: { bg: 'dark:bg-orange-900', text: 'dark:text-orange-200' } },
    // Novos tipos
    'LCI': { bg: 'bg-emerald-100', text: 'text-emerald-800', dark: { bg: 'dark:bg-emerald-900', text: 'dark:text-emerald-200' } },
    'LCA': { bg: 'bg-cyan-100', text: 'text-cyan-800', dark: { bg: 'dark:bg-cyan-900', text: 'dark:text-cyan-200' } },
    'CDB': { bg: 'bg-sky-100', text: 'text-sky-800', dark: { bg: 'dark:bg-sky-900', text: 'dark:text-sky-200' } },
    'CDI': { bg: 'bg-violet-100', text: 'text-violet-800', dark: { bg: 'dark:bg-violet-900', text: 'dark:text-violet-200' } },
    'Poupança': { bg: 'bg-lime-100', text: 'text-lime-800', dark: { bg: 'dark:bg-lime-900', text: 'dark:text-lime-200' } },
    'Fundos de Investimento': { bg: 'bg-amber-100', text: 'text-amber-800', dark: { bg: 'dark:bg-amber-900', text: 'dark:text-amber-200' } },
    'Debêntures': { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', dark: { bg: 'dark:bg-fuchsia-900', text: 'dark:text-fuchsia-200' } },
    'CRA': { bg: 'bg-slate-100', text: 'text-slate-800', dark: { bg: 'dark:bg-slate-900', text: 'dark:text-slate-200' } },
    'CRI': { bg: 'bg-zinc-100', text: 'text-zinc-800', dark: { bg: 'dark:bg-zinc-900', text: 'dark:text-zinc-200' } },
    'Letras de Câmbio': { bg: 'bg-stone-100', text: 'text-stone-800', dark: { bg: 'dark:bg-stone-900', text: 'dark:text-stone-200' } },
    'COE': { bg: 'bg-red-100', text: 'text-red-800', dark: { bg: 'dark:bg-red-900', text: 'dark:text-red-200' } },
    'Fundos Multimercado': { bg: 'bg-blue-100', text: 'text-blue-800', dark: { bg: 'dark:bg-blue-900', text: 'dark:text-blue-200' } },
    'Fundos Cambiais': { bg: 'bg-green-100', text: 'text-green-800', dark: { bg: 'dark:bg-green-900', text: 'dark:text-green-200' } },
    'Fundos de Ações': { bg: 'bg-emerald-100', text: 'text-emerald-800', dark: { bg: 'dark:bg-emerald-900', text: 'dark:text-emerald-200' } },
    'Fundos de Renda Fixa': { bg: 'bg-cyan-100', text: 'text-cyan-800', dark: { bg: 'dark:bg-cyan-900', text: 'dark:text-cyan-200' } },
    'Fundos de Previdência': { bg: 'bg-sky-100', text: 'text-sky-800', dark: { bg: 'dark:bg-sky-900', text: 'dark:text-sky-200' } },
    'Fundos de Crédito Privado': { bg: 'bg-violet-100', text: 'text-violet-800', dark: { bg: 'dark:bg-violet-900', text: 'dark:text-violet-200' } }
  };

  // Lista de instituições comuns
  const instituicoesComuns = [
    'Banco do Brasil',
    'Bradesco',
    'Itaú',
    'Santander',
    'Caixa Econômica Federal',
    'Nubank',
    'Inter',
    'C6 Bank',
    'BTG Pactual',
    'XP Investimentos',
    'Rico',
    'Clear',
    'Modalmais',
    'Genial',
    'Mercado Bitcoin',
    'Binance',
    'Coinbase',
    'Tesouro Direto',
    'Banco Central',
    'Outros'
  ];

  const fetchInvestimentos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await investimentoAPI.getAll();
      const rawData = (response as any)?.data?.data || (response as any)?.data || response;

      if (!Array.isArray(rawData)) {
        throw new Error('Formato de dados inválido recebido da API');
      }

      const tiposValidos: Investimento['tipo'][] = [
        'Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários', 'Criptomoedas', 
        'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável', 'LCI', 'LCA', 
        'CDB', 'CDI', 'Poupança', 'Fundos de Investimento', 'Debêntures', 'CRA', 'CRI', 
        'Letras de Câmbio', 'COE', 'Fundos Multimercado', 'Fundos Cambiais', 
        'Fundos de Ações', 'Fundos de Renda Fixa', 'Fundos de Previdência', 'Fundos de Crédito Privado'
      ];

      const formattedData = rawData.map((item: any) => {
        // Função para obter data local no formato YYYY-MM-DD
        const getLocalDate = (dateString: string) => {
          if (!dateString) {
            // Se não há data, usar hoje
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          
          // Se já é uma string YYYY-MM-DD, retornar como está
          if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString;
          }
          
          // Se é uma data ISO ou objeto Date, converter corretamente
          const date = new Date(dateString);
          
          // Verificar se a data é válida
          if (isNaN(date.getTime())) {
            console.error('Data inválida:', dateString);
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          
          // Usar UTC para evitar problemas de timezone
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        return {
          _id: item._id?.$oid || item._id || Math.random().toString(36).substring(2, 9),
          nome: item.nome || 'Sem nome',
          tipo: tiposValidos.includes(item.tipo) ? item.tipo : 'Renda Fixa',
          valor: Number(item.valor) || 0,
          data: getLocalDate(item.data),
          meta: item.meta !== undefined ? Number(item.meta) : undefined,
          instituicao: item.instituicao || 'Outros'
        };
      });

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

  // Monitora parâmetros da URL para abrir formulário automaticamente
  useEffect(() => {
    if (router.query.action === 'new') {
      setForm({ open: true, mode: 'add', data: { data: '' } });
      // Remove o parâmetro da URL para não abrir novamente ao recarregar
      router.replace('/investimentos', undefined, { shallow: true });
    }
  }, [router.query.action, router]);

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

    // Função auxiliar para formatar a data de YYYY-MM-DDTHH:mm:ss.sssZ ou YYYY-MM-DD para DD/MM/YYYY
  const formatDateForDisplay = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      // Tenta extrair a parte YYYY-MM-DD
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-');
      // Verifica se as partes da data são válidas antes de formatar
      if (year && month && day) {
         return `${day}/${month}/${year}`;
      }
    } catch (e) {
      console.error("Erro ao formatar data para exibição:", e, "String original:", dateString);
    }
    // Retorna a string original ou uma mensagem de erro se a formatação falhar
    return dateString || 'Data inválida';
  };

  const chartData = useMemo(() => {
    const tiposValidos: Investimento['tipo'][] = [
      'Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários', 'Criptomoedas', 
      'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável', 'LCI', 'LCA', 
      'CDB', 'CDI', 'Poupança', 'Fundos de Investimento', 'Debêntures', 'CRA', 'CRI', 
      'Letras de Câmbio', 'COE', 'Fundos Multimercado', 'Fundos Cambiais', 
      'Fundos de Ações', 'Fundos de Renda Fixa', 'Fundos de Previdência', 'Fundos de Crédito Privado'
    ];
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
            case 'LCI': return '#059669';
            case 'LCA': return '#0891B2';
            case 'CDB': return '#0EA5E9';
            case 'CDI': return '#7C3AED';
            case 'Poupança': return '#84CC16';
            case 'Fundos de Investimento': return '#D97706';
            case 'Debêntures': return '#C026D3';
            case 'CRA': return '#475569';
            case 'CRI': return '#52525B';
            case 'Letras de Câmbio': return '#78716C';
            case 'COE': return '#DC2626';
            case 'Fundos Multimercado': return '#3B82F6';
            case 'Fundos Cambiais': return '#10B981';
            case 'Fundos de Ações': return '#059669';
            case 'Fundos de Renda Fixa': return '#0891B2';
            case 'Fundos de Previdência': return '#0EA5E9';
            case 'Fundos de Crédito Privado': return '#7C3AED';
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
            case 'LCI': return '#34D399';
            case 'LCA': return '#22D3EE';
            case 'CDB': return '#38BDF8';
            case 'CDI': return '#A78BFA';
            case 'Poupança': return '#A3E635';
            case 'Fundos de Investimento': return '#FBBF24';
            case 'Debêntures': return '#E879F9';
            case 'CRA': return '#94A3B8';
            case 'CRI': return '#A1A1AA';
            case 'Letras de Câmbio': return '#A8A29E';
            case 'COE': return '#F87171';
            case 'Fundos Multimercado': return '#60A5FA';
            case 'Fundos Cambiais': return '#34D399';
            case 'Fundos de Ações': return '#34D399';
            case 'Fundos de Renda Fixa': return '#22D3EE';
            case 'Fundos de Previdência': return '#38BDF8';
            case 'Fundos de Crédito Privado': return '#A78BFA';
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

    // Prepara os dados para a API
    const payload = {
      nome: form.data.nome.trim(),
      tipo: form.data.tipo as any,
      valor: Number(form.data.valor),
      data: form.data.data + 'T12:00:00Z',
      ...(form.data.meta !== undefined && { meta: Number(form.data.meta) }),
      ...(form.data.instituicao && { instituicao: form.data.instituicao })
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
      console.error('Erro ao excluir:', err);
      const errorMessage = (err as any)?.response?.data?.message || (err as any).message || 'Erro ao excluir investimento';
      toast.error(errorMessage);
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

  const todosTipos: Investimento['tipo'][] = [
    'Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários', 'Criptomoedas', 
    'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável', 'LCI', 'LCA', 
    'CDB', 'CDI', 'Poupança', 'Fundos de Investimento', 'Debêntures', 'CRA', 'CRI', 
    'Letras de Câmbio', 'COE', 'Fundos Multimercado', 'Fundos Cambiais', 
    'Fundos de Ações', 'Fundos de Renda Fixa', 'Fundos de Previdência', 'Fundos de Crédito Privado'
  ];

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
          {/* Botões visíveis apenas no desktop */}
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

          {/* Botão de filtro visível apenas no mobile */}
          <div className="md:hidden flex gap-3 w-full justify-end">
             <button
               onClick={() => setFilters({ ...filters, open: !filters.open })}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${resolvedTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
             >
               {filters.open ? <X size={18} /> : <Filter size={18} />}
               Filtro
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instituição</th>
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
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {investimento.instituicao || 'Não informado'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(investimento.valor)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                           {formatDateForDisplay(investimento.data)}
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
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {investimento.instituicao || 'Instituição não informada'}
                        </p>
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
                        {formatDateForDisplay(investimento.data)}
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
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 p-4 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors md:hidden z-40"
        >
          <Plus size={24} />
        </button>

        {/* Modal do Formulário */}
        {form.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[600px] overflow-y-auto animate-fade-in">
              <div className="p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  {form.mode === 'add' ? 'Novo Investimento' : 'Editar Investimento'}
                </h2>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nome *</label>
                    <input
                      type="text"
                      value={form.data.nome || ''}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, nome: e.target.value } })}
                      className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm md:text-base"
                      placeholder="Ex: CDB Banco XYZ"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo *</label>
                    <select
                      value={form.data.tipo || 'Renda Fixa'}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, tipo: e.target.value as Investimento['tipo'] } })}
                      className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm md:text-base"
                    >
                      {Object.keys(tipoCores).map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Valor (R$) *</label>
                    <input
                      type="number"
                      value={form.data.valor === undefined ? '' : form.data.valor}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, valor: e.target.value === '' ? undefined : Number(e.target.value) } })}
                      className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm md:text-base"
                      min="0.01"
                      step="0.01"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Data *</label>
                    <input
                      type="date"
                      value={form.data.data || ''}
                      onChange={(e) => setForm({ 
                        ...form, 
                        data: { 
                          ...form.data, 
                          data: e.target.value 
                        } 
                      })}
                      className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 md:mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Instituição</label>
                    <select
                      value={form.data.instituicao || 'Outros'}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, instituicao: e.target.value } })}
                      className="w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm md:text-base"
                    >
                      <option value="Outros">Outros</option>
                      {instituicoesComuns.map(inst => (
                        <option key={inst} value={inst}>{inst}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 md:gap-3 mt-4 md:mt-6">
                  <button
                    onClick={() => setForm({ ...form, open: false })}
                    className="px-3 md:px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm md:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFormSubmit}
                    className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm md:text-base"
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