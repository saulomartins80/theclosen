import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, 
  CreditCard, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Settings,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Zap,
  Brain,
  Calculator,
  Gift,
  Calendar,
  DollarSign,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  Share2,
  Bell,
  Filter,
  Search,
  PieChart,
  LineChart,
  Activity,
  Award,
  Crown,
  Gem,
  Sparkles,
  X,
  Send,
  Minus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useMileage } from '../src/hooks/useMileage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function MilhasPage() {
  const { user, isAuthReady } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  // Estados para o chatbot
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Verificar se o usuário está autenticado
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
          <a 
            href="/auth/login" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Fazer Login
          </a>
        </div>
      </div>
    );
  }

  // Hook centralizado para todas as operações de milhas
  const {
    // Estados
    mileagePrograms,
    recentTransactions,
    mileageCards,
    pluggyConnections,
    mileageAnalytics,
    isLoading,
    error,
    
    // Ações
    loadMileageData,
    connectPluggy,
    addMileageCard,
    updateMileageCard,
    deleteMileageCard,
    addMileageTransaction,
    calculateMiles,
    getCardRecommendations,
    loadPluggyConnections,
    disconnectPluggyConnection,
    updateMileageProgram,
    getMileageSummary,
    getMileageTransactions,
    
    // Valores computados
    totalPoints,
    totalValue,
    activeCards,
    activePrograms
  } = useMileage();

  // Verificar se o usuário está autenticado
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
          <a 
            href="/auth/login" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Fazer Login
          </a>
        </div>
      </div>
    );
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (user && isAuthReady) {
      console.log('[MilhasPage] Usuário autenticado, carregando dados...');
      loadMileageData();
      loadPluggyConnections();
    } else {
      console.log('[MilhasPage] Usuário não autenticado ou auth não pronto, pulando carregamento...');
    }
  }, [user, isAuthReady, loadMileageData, loadPluggyConnections]);

  // Funções para o chatbot
  const sendChatMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: message,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      // Simulação de resposta do chatbot especializado em milhas
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const botResponse = generateMileageResponse(message);
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        content: botResponse,
        timestamp: new Date(),
        metadata: {
          expertise: 'mileage',
          suggestions: getMileageSuggestions(message)
        }
      };

      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error('Erro ao processar mensagem');
    } finally {
      setIsChatLoading(false);
    }
  };

  const generateMileageResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('melhor cartão') || lowerMessage.includes('maximizar')) {
      return `Para maximizar suas milhas, recomendo focar no Itaú Personnalité (2.5 pts/R$) para supermercados e o Nubank Ultravioleta (1.8 pts/R$) para outras categorias. Com seu gasto mensal, você pode acumular cerca de 8.000 milhas por mês!`;
    }
    
    if (lowerMessage.includes('resgatar') || lowerMessage.includes('usar milhas')) {
      return `Para resgatar suas milhas, você tem algumas opções:\n\n• Voo nacional: 15.000-25.000 milhas\n• Voo internacional: 70.000-120.000 milhas\n• Upgrade de classe: 30.000-50.000 milhas\n\nQual destino você tem em mente?`;
    }
    
    if (lowerMessage.includes('valor') || lowerMessage.includes('quanto vale')) {
      return `Atualmente suas milhas valem aproximadamente:\n\n${mileagePrograms.map(p => `• ${p.name}: R$ ${p.estimatedValue.toFixed(2)}`).join('\n')}\n\nTotal: R$ ${totalValue.toFixed(2)}`;
    }
    
    return `Olá! Sou especialista em milhas e posso te ajudar com:\n\n• Análise de cartões de crédito\n• Estratégias de acumulação\n• Melhores formas de resgate\n• Promoções ativas\n\nComo posso te ajudar hoje?`;
  };

  const getMileageSuggestions = (message: string): string[] => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('cartão')) {
      return ['Ver meus cartões', 'Comparar cartões', 'Simular acumulação'];
    }
    
    if (lowerMessage.includes('resgatar')) {
      return ['Ver opções de resgate', 'Calcular valor', 'Ver promoções'];
    }
    
    return ['Conectar conta bancária', 'Ver histórico', 'Configurar alertas'];
  };

  // Componente de programa de milhas
  const MileageProgramCard = ({ program }: { program: any }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{program.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{program.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {program.partners.join(', ')}
            </p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs ${
          program.status === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {program.status === 'active' ? 'Ativo' : 'Inativo'}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total de Pontos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {program.totalPoints.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Valor Estimado</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            R$ {program.estimatedValue.toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Atualizado: {new Date(program.lastUpdated).toLocaleDateString()}
        </p>
        <button
          onClick={() => setSelectedProgram(program.id)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
        >
          Ver detalhes
        </button>
      </div>
    </motion.div>
  );

  if (isLoading && mileagePrograms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto h-8 w-8 text-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dados de milhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Plane className="mr-3 text-blue-600" />
                Sistema de Milhas
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gerencie suas milhas, cartões e maximize seus pontos
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={loadMileageData}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={() => setShowConnectModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Conectar Conta
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: PieChart },
              { id: 'programs', label: 'Programas', icon: Star },
              { id: 'cards', label: 'Cartões', icon: CreditCard },
              { id: 'transactions', label: 'Transações', icon: BarChart3 },
              { id: 'analytics', label: 'Análises', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Star className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Pontos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {totalPoints.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <DollarSign className="text-green-600 dark:text-green-400" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {totalValue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <CreditCard className="text-purple-600 dark:text-purple-400" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cartões Ativos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {activeCards.length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Plane className="text-orange-600 dark:text-orange-400" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Programas Ativos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {activePrograms.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Programas de Milhas */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Programas de Milhas</h2>
                  <button
                    onClick={() => setActiveTab('programs')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Ver todos
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mileagePrograms.slice(0, 3).map((program) => (
                    <MileageProgramCard key={program.id} program={program} />
                  ))}
                </div>
              </div>

              {/* Transações Recentes */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transações Recentes</h2>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Ver todas
                  </button>
                </div>
                
                <div className="space-y-4">
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'earned' 
                            ? 'bg-green-100 dark:bg-green-900' 
                            : 'bg-red-100 dark:bg-red-900'
                        }`}>
                          {transaction.type === 'earned' ? (
                            <Plus className="text-green-600 dark:text-green-400" size={16} />
                          ) : (
                            <Minus className="text-red-600 dark:text-red-400" size={16} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.program}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'earned' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'earned' ? '+' : '-'}{transaction.points.toLocaleString()} pts
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'programs' && (
            <motion.div
              key="programs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mileagePrograms.map((program) => (
                  <MileageProgramCard key={program.id} program={program} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'cards' && (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mileageCards.map((card) => (
                  <div key={card.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <CreditCard className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{card.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{card.bank}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        card.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {card.status === 'active' ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Programa:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{card.program}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Pontos por R$:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{card.pointsPerReal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Anuidade:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">R$ {card.annualFee.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Benefícios:</h4>
                      <div className="flex flex-wrap gap-1">
                        {card.benefits.slice(0, 3).map((benefit, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                            {benefit}
                          </span>
                        ))}
                        {card.benefits.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                            +{card.benefits.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Histórico de Transações</h2>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'earned' 
                              ? 'bg-green-100 dark:bg-green-900' 
                              : 'bg-red-100 dark:bg-red-900'
                          }`}>
                            {transaction.type === 'earned' ? (
                              <Plus className="text-green-600 dark:text-green-400" size={16} />
                            ) : (
                              <Minus className="text-red-600 dark:text-red-400" size={16} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.program} • {transaction.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.type === 'earned' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'earned' ? '+' : '-'}{transaction.points.toLocaleString()} pts
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            R$ {transaction.value.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Análise de Milhas</h3>
                  {mileageAnalytics ? (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total de pontos:</span>
                        <span className="font-bold">{totalPoints.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Valor total:</span>
                        <span className="font-bold">R$ {totalValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cartões ativos:</span>
                        <span className="font-bold">{activeCards.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Programas ativos:</span>
                        <span className="font-bold">{activePrograms.length}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Carregando análises...</p>
                  )}
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Conexões Pluggy</h3>
                  <div className="space-y-4">
                    {pluggyConnections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{connection.bankName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{connection.accountType}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            connection.status === 'connected' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {connection.status === 'connected' ? 'Conectado' : 'Desconectado'}
                          </div>
                          <button
                            onClick={() => disconnectPluggyConnection(connection.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {pluggyConnections.length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400">Nenhuma conexão encontrada</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Conexão Pluggy */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Conectar Conta Bancária</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Conecte sua conta bancária para sincronizar automaticamente suas transações e calcular milhas.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  connectPluggy();
                  setShowConnectModal(false);
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <ExternalLink size={16} className="mr-2" />
                    Conectar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ToastContainer */}
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
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  );
}
   