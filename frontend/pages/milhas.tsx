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
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Tipos para o sistema de milhas
interface MileageProgram {
  id: string;
  name: string;
  icon: string;
  totalPoints: number;
  estimatedValue: number;
  lastUpdated: Date;
  status: 'active' | 'inactive' | 'pending';
  color: string;
  partners: string[];
}

interface MileageTransaction {
  id: string;
  program: string;
  points: number;
  type: 'earned' | 'redeemed' | 'expired';
  date: Date;
  description: string;
  card?: string;
  value: number;
  category?: string;
}

interface MileageCard {
  id: string;
  name: string;
  bank: string;
  program: string;
  pointsPerReal: number;
  annualFee: number;
  benefits: string[];
  status: 'active' | 'inactive';
}

interface PluggyConnection {
  id: string;
  bankName: string;
  accountType: string;
  lastSync: Date;
  status: 'connected' | 'disconnected' | 'error';
  accounts: string[];
}

export default function MilhasPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  // Estados para dados de milhas
  const [mileagePrograms, setMileagePrograms] = useState<MileageProgram[]>([
    {
      id: 'smiles',
      name: 'Smiles',
      icon: '✈️',
      totalPoints: 15420,
      estimatedValue: 385.50,
      lastUpdated: new Date(),
      status: 'active',
      color: '#00A1E0',
      partners: ['GOL', 'Itaú', 'Santander']
    },
    {
      id: 'tudoazul',
      name: 'TudoAzul',
      icon: '🛩️',
      totalPoints: 8920,
      estimatedValue: 200.70,
      lastUpdated: new Date(),
      status: 'active',
      color: '#0066CC',
      partners: ['Azul', 'Bradesco', 'Nubank']
    },
    {
      id: 'latam',
      name: 'Latam Pass',
      icon: '✈️',
      totalPoints: 5670,
      estimatedValue: 141.75,
      lastUpdated: new Date(),
      status: 'active',
      color: '#D70040',
      partners: ['Latam', 'Itaú', 'Citi']
    }
  ]);

  const [recentTransactions, setRecentTransactions] = useState<MileageTransaction[]>([
    {
      id: '1',
      program: 'Smiles',
      points: 1250,
      type: 'earned',
      date: new Date(),
      description: 'Compra no Supermercado Extra',
      card: 'Itaú Personnalité',
      value: 31.25,
      category: 'Supermercado'
    },
    {
      id: '2',
      program: 'TudoAzul',
      points: 800,
      type: 'earned',
      date: new Date(Date.now() - 86400000),
      description: 'Combustível Shell',
      card: 'Nubank Ultravioleta',
      value: 18.00,
      category: 'Transporte'
    }
  ]);

  const [mileageCards, setMileageCards] = useState<MileageCard[]>([
    {
      id: '1',
      name: 'Itaú Personnalité Visa Infinite',
      bank: 'Itaú',
      program: 'Latam Pass',
      pointsPerReal: 2.5,
      annualFee: 1295,
      benefits: ['Sala VIP', 'Seguro viagem', 'Bônus de boas-vindas'],
      status: 'active'
    },
    {
      id: '2',
      name: 'Nubank Ultravioleta',
      bank: 'Nubank',
      program: 'TudoAzul',
      pointsPerReal: 1.8,
      annualFee: 0,
      benefits: ['Sem anuidade', 'Cashback', 'Cartão virtual'],
      status: 'active'
    }
  ]);

  const [pluggyConnections, setPluggyConnections] = useState<PluggyConnection[]>([]);

  // Estados para o chatbot
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Funções para integração com Pluggy
  const connectPluggy = async () => {
    setIsLoading(true);
    try {
      // Simulação da integração com Pluggy
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newConnection: PluggyConnection = {
        id: Date.now().toString(),
        bankName: 'Itaú',
        accountType: 'Conta Corrente',
        lastSync: new Date(),
        status: 'connected',
        accounts: ['Conta Principal', 'Cartão de Crédito']
      };
      
      setPluggyConnections([...pluggyConnections, newConnection]);
      toast.success('Conta conectada com sucesso!');
      setShowConnectModal(false);
    } catch (error) {
      toast.error('Erro ao conectar conta');
    } finally {
      setIsLoading(false);
    }
  };

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
      return `Atualmente suas milhas valem aproximadamente:\n\n• Smiles: R$ 385,50 (R$ 25/1000 milhas)\n• TudoAzul: R$ 200,70 (R$ 22,50/1000 milhas)\n• Latam Pass: R$ 141,75 (R$ 25/1000 milhas)\n\nTotal: R$ 727,95`;
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
  const MileageProgramCard = ({ program }: { program: MileageProgram }) => (
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
          Atualizado: {program.lastUpdated.toLocaleDateString()}
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
                        {mileagePrograms.reduce((sum, p) => sum + p.totalPoints, 0).toLocaleString()}
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
                        R$ {mileagePrograms.reduce((sum, p) => sum + p.estimatedValue, 0).toFixed(2)}
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
                        {mileageCards.filter(c => c.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Activity className="text-orange-600 dark:text-orange-400" size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Programas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {mileagePrograms.filter(p => p.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Programas de Milhas */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Seus Programas de Milhas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mileagePrograms.map((program) => (
                    <MileageProgramCard key={program.id} program={program} />
                  ))}
                </div>
              </div>

              {/* Transações Recentes */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Transações Recentes
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.type === 'earned' 
                              ? 'bg-green-100 dark:bg-green-900' 
                              : 'bg-red-100 dark:bg-red-900'
                          }`}>
                            {transaction.type === 'earned' ? (
                              <Plus size={16} className="text-green-600 dark:text-green-400" />
                            ) : (
                              <Minus size={16} className="text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.program} • {transaction.card}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'earned' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'earned' ? '+' : '-'}{transaction.points.toLocaleString()} pts
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            R$ {transaction.value.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mileageCards.map((card) => (
                  <div key={card.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{card.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{card.bank}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        card.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {card.status === 'active' ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pontos por Real</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {card.pointsPerReal} pts
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Anuidade</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          R$ {card.annualFee.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Benefícios:</p>
                      <ul className="space-y-1">
                        {card.benefits.map((benefit, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                            <CheckCircle size={14} className="text-green-500 mr-2" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Ver detalhes
                    </button>
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
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Histórico de Transações
                    </h3>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Filter size={14} className="mr-1" />
                        Filtrar
                      </button>
                      <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Download size={14} className="mr-1" />
                        Exportar
                      </button>
                    </div>
                  </div>
                  
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'earned' 
                            ? 'bg-green-100 dark:bg-green-900' 
                            : 'bg-red-100 dark:bg-red-900'
                        }`}>
                          {transaction.type === 'earned' ? (
                            <Plus size={16} className="text-green-600 dark:text-green-400" />
                          ) : (
                            <Minus size={16} className="text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.program} • {transaction.card} • {transaction.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'earned' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'earned' ? '+' : '-'}{transaction.points.toLocaleString()} pts
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          R$ {transaction.value.toFixed(2)}
                        </p>
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
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Acumulação por Programa
                  </h3>
                  <div className="space-y-4">
                    {mileagePrograms.map((program) => (
                      <div key={program.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{program.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{program.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {program.totalPoints.toLocaleString()} pts
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            R$ {program.estimatedValue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Performance dos Cartões
                  </h3>
                  <div className="space-y-4">
                    {mileageCards.map((card) => (
                      <div key={card.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{card.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{card.program}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            {card.pointsPerReal} pts/R$
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            R$ {card.annualFee.toLocaleString()}/ano
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Conexão */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowConnectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Conectar Conta Bancária
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Conecte sua conta para rastreamento automático de milhas através da Pluggy.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={connectPluggy}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Conectando...' : 'Conectar com Pluggy'}
                </button>
                
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Container */}
      <ToastContainer position="bottom-right" />
    </div>
  );
} 