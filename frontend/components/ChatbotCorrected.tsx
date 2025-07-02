import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { 
  MessageSquare, X, Send, User, Bot, 
  Sparkles, BarChart2, Lightbulb, BookOpen,
  Copy, ThumbsUp, ThumbsDown, Paperclip, Command,
  Star, TrendingUp, Target, Shield, Zap, Trash2,
  AlertTriangle, Clock, BarChart3, CheckCircle, XCircle,
  Plus, Edit3, Eye, Brain, Zap as ZapIcon, Plane,
  CreditCard, DollarSign, Calculator, Gift, Calendar
} from 'lucide-react';
import { chatbotAPI } from '../services/api';
import { chatbotDeleteAPI } from '../services/chatbotDeleteAPI';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React from 'react';

// Tipos para o sistema de automação inteligente
type AutomatedAction = {
  type: 'CREATE_TRANSACTION' | 'CREATE_INVESTMENT' | 'CREATE_GOAL' | 'ANALYZE_DATA' | 'GENERATE_REPORT' | 
        'CREATE_MILEAGE' | 'REDEEM_MILEAGE' | 'ANALYZE_MILEAGE' | 'CONNECT_PLUGGY' | 'CALCULATE_VALUE';
  payload: any;
  confidence: number;
  requiresConfirmation: boolean;
  successMessage: string;
  errorMessage: string;
  followUpQuestions?: string[];
  isAutomated?: boolean;
};

type ChatMessage = {
  id: string;
  sender: 'user' | 'bot';
  content: string | React.ReactElement;
  timestamp: Date;
  metadata?: {
    action?: AutomatedAction;
    isAutomated?: boolean;
    processingTime?: number;
    confidence?: number;
    analysisData?: any;
    suggestions?: string[];
    isPremium?: boolean;
    expertise?: string;
    userLevel?: 'basic' | 'intermediate' | 'advanced';
    actionExecuted?: boolean;
    requiresConfirmation?: boolean;
    mileageProgram?: string;
    pointsEarned?: number;
    estimatedValue?: number;
  };
};

type ChatSession = {
  chatId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

interface ChatbotProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

// Sistema de Temas Dinâmicos
const getChatTheme = (plan?: string) => {
  const planName = (plan || '').toLowerCase();
  
  if (planName.includes('premium')) {
    return {
      name: 'premium',
      primary: '#8b5cf6',
      secondary: '#6366f1',
      gradient: 'from-purple-600 to-indigo-600',
      bubbleUser: 'bg-gradient-to-r from-purple-600 to-indigo-600',
      bubbleBot: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      text: 'text-gray-900 dark:text-white',
      icon: '🏆',
      accent: 'text-purple-600 dark:text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-700',
      border: 'border-purple-300 dark:border-purple-600',
      chatBg: 'bg-gray-50 dark:bg-gray-800',
      headerBg: 'bg-white dark:bg-gray-900',
      inputBg: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
    };
  }
  
  if (planName.includes('top')) {
    return {
      name: 'top',
      primary: '#f59e0b',
      secondary: '#f97316',
      gradient: 'from-amber-500 to-orange-500',
      bubbleUser: 'bg-gradient-to-r from-amber-500 to-orange-500',
      bubbleBot: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      text: 'text-gray-900 dark:text-white',
      icon: '👑',
      accent: 'text-amber-600 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700',
      border: 'border-amber-300 dark:border-amber-600',
      chatBg: 'bg-gray-50 dark:bg-gray-800',
      headerBg: 'bg-white dark:bg-gray-900',
      inputBg: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
    };
  }
  
  if (planName.includes('essencial')) {
    return {
      name: 'essencial',
      primary: '#10b981',
      secondary: '#059669',
      gradient: 'from-emerald-500 to-green-500',
      bubbleUser: 'bg-gradient-to-r from-emerald-500 to-green-500',
      bubbleBot: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      text: 'text-gray-900 dark:text-white',
      icon: '⭐',
      accent: 'text-emerald-600 dark:text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      border: 'border-emerald-300 dark:border-emerald-600',
      chatBg: 'bg-gray-50 dark:bg-gray-800',
      headerBg: 'bg-white dark:bg-gray-900',
      inputBg: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
    };
  }
  
  // Plano padrão (free)
  return {
    name: 'default',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    gradient: 'from-indigo-500 to-purple-500',
    bubbleUser: 'bg-indigo-600',
    bubbleBot: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    text: 'text-gray-900 dark:text-white',
    icon: '💬',
    accent: 'text-indigo-600 dark:text-indigo-400',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    border: 'border-indigo-300 dark:border-indigo-600',
    chatBg: 'bg-gray-50 dark:bg-gray-800',
    headerBg: 'bg-white dark:bg-gray-900',
    inputBg: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
  };
};

// Componente de Ação Automatizada
const AutomatedActionCard = ({ 
  action, 
  onConfirm, 
  onEdit, 
  onCancel,
  theme 
}: {
  action: AutomatedAction;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  theme: any;
}) => {
  const getActionIcon = () => {
    switch (action.type) {
      case 'CREATE_TRANSACTION': return '💰';
      case 'CREATE_INVESTMENT': return '📈';
      case 'CREATE_GOAL': return '🎯';
      case 'ANALYZE_DATA': return '📊';
      case 'GENERATE_REPORT': return '📋';
      case 'CREATE_MILEAGE': return '✈️';
      case 'REDEEM_MILEAGE': return '🎫';
      case 'ANALYZE_MILEAGE': return '📊';
      case 'CONNECT_PLUGGY': return '🔗';
      case 'CALCULATE_VALUE': return '💰';
      default: return '🤖';
    }
  };

  const getActionTitle = () => {
    switch (action.type) {
      case 'CREATE_TRANSACTION': return 'Transação Detectada';
      case 'CREATE_INVESTMENT': return 'Investimento Detectado';
      case 'CREATE_GOAL': return 'Meta Detectada';
      case 'ANALYZE_DATA': return 'Análise Automática';
      case 'GENERATE_REPORT': return 'Relatório Gerado';
      case 'CREATE_MILEAGE': return 'Milhas Detectadas';
      case 'REDEEM_MILEAGE': return 'Resgate de Milhas';
      case 'ANALYZE_MILEAGE': return 'Análise de Milhas';
      case 'CONNECT_PLUGGY': return 'Conectar Conta';
      case 'CALCULATE_VALUE': return 'Cálculo de Valor';
      default: return 'Ação Automatizada';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border ${theme.border} p-4 mb-4 shadow-sm`}>
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">{getActionIcon()}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{getActionTitle()}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Brain size={14} className="text-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Confiança: {Math.round(action.confidence * 100)}%
              </span>
            </div>
            {action.isAutomated && (
              <div className="flex items-center gap-1">
                <ZapIcon size={14} className="text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400">Automático</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
          {action.successMessage}
        </p>
        
        {action.payload && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(action.payload).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {typeof value === 'number' && key.includes('valor') 
                      ? `R$ ${value.toFixed(2)}` 
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-2">
        <button
          onClick={onConfirm}
          className={`w-full ${theme.button} text-white px-4 py-3 rounded-lg flex items-center justify-center font-medium transition-all duration-200 hover:scale-105`}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirmar
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center justify-center text-sm transition-colors"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Editar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center justify-center text-sm transition-colors"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Cancelar
          </button>
        </div>
      </div>
      
      {action.followUpQuestions && action.followUpQuestions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Perguntas relacionadas:</p>
          <div className="flex flex-wrap gap-2">
            {action.followUpQuestions.map((question, index) => (
              <button
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                onClick={() => {
                  // Implementar envio automático da pergunta
                  console.log('Pergunta sugerida:', question);
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Mensagem Avançado com Automação
const AdvancedMessageBubble = ({ 
  message, 
  theme, 
  isPremium,
  onFeedback,
  onActionConfirm,
  onActionEdit,
  onActionCancel
}: { 
  message: ChatMessage; 
  theme: any;
  isPremium: boolean;
  onFeedback: (messageId: string) => void;
  onActionConfirm: (action: AutomatedAction) => void;
  onActionEdit: (action: AutomatedAction) => void;
  onActionCancel: (action: AutomatedAction) => void;
}) => {
  const copyToClipboard = async (text: string | React.ReactElement) => {
    try {
      if (typeof text === 'string') {
        await navigator.clipboard.writeText(text);
      } else {
        await navigator.clipboard.writeText('Conteúdo copiado');
      }
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const getLevelBadge = (level?: string) => {
    if (!level) return null;
    
    const badges = {
      basic: { color: 'bg-blue-100 text-blue-800', icon: '🌱', text: 'Iniciante' },
      intermediate: { color: 'bg-yellow-100 text-yellow-800', icon: '📈', text: 'Intermediário' },
      advanced: { color: 'bg-purple-100 text-purple-800', icon: '🚀', text: 'Avançado' }
    };
    
    const badge = badges[level as keyof typeof badges];
    if (!badge) return null;
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <span>{badge.icon}</span>
        <span>{badge.text}</span>
      </div>
    );
  };

  return (
    <div className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.sender === 'bot' && (
        <div className="flex-shrink-0">
          <div className={`p-2 rounded-full ${theme.bubbleBot} text-${theme.primary}`}>
            <Bot className="w-5 h-5" />
          </div>
        </div>
      )}
      
      <div className={`relative max-w-[85%] rounded-2xl ${
        message.sender === 'user' 
          ? `${theme.bubbleUser} text-white rounded-tr-none`
          : `${theme.bubbleBot} shadow-sm rounded-tl-none dark:text-gray-100`
      }`}>
        {/* Cabeçalho da mensagem (apenas para bot) */}
        {message.sender === 'bot' && message.metadata && (
          <div className="px-4 pt-3 pb-1 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {message.metadata.isPremium && (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Sparkles size={14} />
                    <span className="text-xs font-medium">Premium</span>
                  </div>
                )}
                {getLevelBadge(message.metadata.userLevel)}
                {message.metadata.confidence && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Confiança: {Math.round(message.metadata.confidence * 100)}%
                  </div>
                )}
                {message.metadata.isAutomated && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <ZapIcon size={14} />
                    <span className="text-xs font-medium">Automático</span>
                  </div>
                )}
              </div>
              {message.metadata.processingTime && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {message.metadata.processingTime}ms
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Conteúdo da mensagem */}
        <div className="p-4">
          {message.metadata?.action && !message.metadata.requiresConfirmation ? (
            <AutomatedActionCard
              action={message.metadata.action}
              onConfirm={() => onActionConfirm(message.metadata!.action!)}
              onEdit={() => onActionEdit(message.metadata!.action!)}
              onCancel={() => onActionCancel(message.metadata!.action!)}
              theme={theme}
            />
          ) : (
            <div className={`prose dark:prose-invert prose-sm max-w-none chat-message-content ${message.sender === 'user' ? 'text-white' : ''}`}>
              {typeof message.content === 'string' ? (
                <div dangerouslySetInnerHTML={{ __html: message.content }} />
              ) : (
                message.content
              )}
            </div>
          )}
          
          {/* Metadados ricos */}
          {message.sender === 'bot' && message.metadata && !message.metadata.action && (
            <div className="mt-4 space-y-3">
              {/* Informações específicas de milhas */}
              {message.metadata.pointsEarned && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane size={16} className="text-green-600 dark:text-green-400" />
                    <h4 className="font-bold text-sm text-green-800 dark:text-green-200">Milhas Acumuladas</h4>
                  </div>
                  <div className="text-sm">
                    <p className="text-green-700 dark:text-green-300">
                      <strong>{message.metadata.pointsEarned.toLocaleString()}</strong> pontos no {message.metadata.mileageProgram}
                    </p>
                    {message.metadata.estimatedValue && (
                      <p className="text-green-600 dark:text-green-400 text-xs">
                        Valor estimado: R$ {message.metadata.estimatedValue.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Análise de dados */}
              {message.metadata.analysisData && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-sm text-indigo-800 dark:text-indigo-200">Análise Detalhada</h4>
                  </div>
                  <div className="text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    <pre className="text-gray-700 dark:text-gray-300">
                      {JSON.stringify(message.metadata.analysisData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Sugestões */}
              {message.metadata.suggestions && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={16} className="text-blue-600 dark:text-blue-400" />
                    <h4 className="font-bold text-sm text-blue-800 dark:text-blue-200">Sugestões</h4>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {message.metadata.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400">•</span>
                        <span className="text-blue-700 dark:text-blue-300">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Rodapé com tempo e ações */}
        <div className={`px-4 pb-2 pt-1 text-xs flex justify-between items-center ${
          message.sender === 'user' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
        }`}>
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          <div className="flex gap-2">
            <button 
              onClick={() => copyToClipboard(message.content)}
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title="Copiar mensagem"
            >
              <Copy size={14} />
            </button>
            
            {message.sender === 'bot' && (
              <button 
                onClick={() => onFeedback(message.id)}
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Dar feedback"
              >
                <ThumbsUp size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {message.sender === 'user' && (
        <div className="flex-shrink-0">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            <User className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </div>
        </div>
      )}
    </div>
  );
};

// Barra de Comando Avançada
const CommandBar = ({ 
  onSubmit, 
  isLoading, 
  theme,
  placeholder 
}: { 
  onSubmit: (message: string) => void; 
  isLoading: boolean;
  theme: any;
  placeholder: string;
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={`w-full px-4 py-3 rounded-lg ${theme.inputBg} text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
        />
        {message && (
          <button
            type="button"
            onClick={() => setMessage('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className={`px-4 py-3 rounded-lg ${theme.button} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send size={16} />
        )}
      </button>
    </form>
  );
};

export default function Chatbot({ isOpen: externalIsOpen, onToggle }: ChatbotProps) {
  const { user, subscription } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ messageId: string; isOpen: boolean }>({ messageId: '', isOpen: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMileagePage, setIsMileagePage] = useState(false);

  // Usar estado externo se fornecido, senão usar interno
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalIsOpen !== undefined ? onToggle || (() => {}) : setInternalIsOpen;

  // Detectar se é usuário premium
  const isPremiumUser = subscription?.status === 'active' && (
    subscription?.plan === 'premium' || 
    (subscription?.plan && typeof subscription.plan === 'string' && 
     (subscription.plan.toLowerCase().includes('top') || 
      subscription.plan.toLowerCase().includes('premium')))
  );

  // Detectar se está na página de milhas
  useEffect(() => {
    setIsMileagePage(router.pathname === '/milhas');
  }, [router.pathname]);

  // Obter tema dinâmico baseado no contexto
  const getContextualTheme = () => {
    if (isMileagePage) {
      // Tema específico para milhas
      return {
        name: 'mileage',
        primary: '#00A1E0', // Azul Smiles
        secondary: '#0066CC', // Azul TudoAzul
        gradient: 'from-blue-500 to-cyan-500',
        bubbleUser: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        bubbleBot: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        text: 'text-gray-900 dark:text-white',
        icon: '✈️',
        accent: 'text-blue-600 dark:text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700',
        border: 'border-blue-300 dark:border-blue-600',
        chatBg: 'bg-gray-50 dark:bg-gray-800',
        headerBg: 'bg-white dark:bg-gray-900',
        inputBg: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
      };
    }
    return getChatTheme(subscription?.plan?.toString());
  };

  const theme = getContextualTheme();

  // Obter o nome do plano para exibição
  const getPlanDisplayName = () => {
    if (!subscription?.plan) return 'Gratuito';
    
    const plan = subscription.plan.toString().toLowerCase();
    if (plan.includes('top anual')) return 'Top Anual';
    if (plan.includes('top')) return 'Top';
    if (plan.includes('essencial anual')) return 'Essencial Anual';
    if (plan.includes('essencial')) return 'Essencial';
    if (plan.includes('premium')) return 'Premium';
    return subscription.plan;
  };

  // Obter expertise do consultor baseado no contexto
  const getExpertiseDisplay = () => {
    if (isMileagePage) {
      if (isPremiumUser) {
        return {
          title: 'Finn Milhas Premium',
          subtitle: 'Especialista em Programas de Fidelidade',
          description: 'Consultor certificado em milhas aéreas e cartões de crédito',
          icon: '✈️'
        };
      }
      return {
        title: 'Finn Milhas',
        subtitle: 'Assistente de Milhas',
        description: 'Especialista em programas de fidelidade e cartões',
        icon: '✈️'
      };
    }
    
    if (isPremiumUser) {
      return {
        title: 'Dr. Finn',
        subtitle: 'Consultor Financeiro CFA, CFP, CNAI, CNPI',
        description: 'Especialista em análise fundamentalista, planejamento financeiro e gestão de risco',
        icon: '👨‍💼'
      };
    }
    return {
      title: 'Finn',
      subtitle: 'Assistente Finnextho',
      description: 'Especialista em educação financeira e uso da plataforma',
      icon: '🤖'
    };
  };

  const expertise = getExpertiseDisplay();

  const loadChatSessions = useCallback(async () => {
    try {
      const response = await chatbotAPI.getSessions();
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to load sessions', error);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !activeSession) {
      loadChatSessions();
    }
  }, [isOpen, activeSession, loadChatSessions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startNewSession = async () => {
    try {
      setIsLoading(true);
      const response = await chatbotAPI.startNewSession();
      const newSession: ChatSession = {
        chatId: response.chatId,
        title: isMileagePage ? 'Nova Consulta de Milhas' : 'Nova Conversa',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setActiveSession(newSession);
      setMessages([]);
      setSessions(prev => [newSession, ...prev]);
      setIsNewSessionModalOpen(false);
    } catch (error) {
      console.error('Failed to start new session', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (chatId: string) => {
    try {
      setIsLoading(true);
      const response = await chatbotAPI.getSession(chatId);
      setActiveSession(response.data.session);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to load session', error);
      await startNewSession();
    } finally {
      setIsLoading(false);
    }
  };

  // Função principal de envio de mensagem com automação inteligente
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Se não há sessão ativa, criar uma nova
    if (!activeSession) {
      await startNewSession();
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // ✅ CORREÇÃO: Usar endpoint correto que salva nas sessões
      const response = await chatbotAPI.sendQuery({
        message: message,
        chatId: activeSession.chatId,
        // O backend já busca os dados reais do usuário
      });

      console.log('[FRONTEND] Full response:', response);
      console.log('[FRONTEND] Response type:', response.type);
      console.log('[FRONTEND] Response text:', response.text);

      if (response.type === 'ACTION_DETECTED') {
        console.log('[FRONTEND] Processing automated action');
        // Ação automatizada detectada
        const action = response.automatedAction;
        
        // ✅ NOVA LÓGICA: Verificar se já foi executada automaticamente
        if (action.executed) {
          // Ação já foi executada automaticamente pelo backend
          const successMessage: ChatMessage = {
            id: `success-${Date.now()}`,
            sender: 'bot',
            content: `✅ ${response.message || response.text}`,
            timestamp: new Date(),
            metadata: {
              isAutomated: true,
              isPremium: isPremiumUser,
              actionExecuted: true
            }
          };
          
          setMessages(prev => [...prev, successMessage]);
          
          // Adicionar sugestões de acompanhamento de forma natural
          if (action.followUpQuestions && action.followUpQuestions.length > 0) {
            const followUpMessage: ChatMessage = {
              id: `followup-${Date.now()}`,
              sender: 'bot',
              content: 'Posso ajudar com mais alguma coisa?',
              timestamp: new Date(),
              metadata: {
                suggestions: action.followUpQuestions,
                isPremium: isPremiumUser
              }
            };
            
            setMessages(prev => [...prev, followUpMessage]);
          }
        } else if (action.error) {
          // Houve erro na execução automática
          const errorMessage: ChatMessage = {
            id: `error-${Date.now()}`,
            sender: 'bot',
            content: `❌ ${response.message || response.text}`,
            timestamp: new Date(),
            metadata: {
              action: action,
              isAutomated: true,
              confidence: action.confidence,
              isPremium: isPremiumUser,
              requiresConfirmation: true
            }
          };
          
          setMessages(prev => [...prev, errorMessage]);
        } else {
          // Ação precisa de confirmação
          const botMessage: ChatMessage = {
            id: `action-${Date.now()}`,
            sender: 'bot',
            content: response.message || response.text || 'Detectei uma ação que posso executar automaticamente!',
            timestamp: new Date(),
            metadata: {
              action: action,
              isAutomated: true,
              confidence: action.confidence,
              isPremium: isPremiumUser,
              requiresConfirmation: true
            }
          };

          setMessages(prev => [...prev, botMessage]);
        }
      } else if (response.type === 'TEXT_RESPONSE') {
        console.log('[FRONTEND] Processing text response');
        // ✅ CORREÇÃO: Acessar o texto da resposta corretamente
        const responseText = response.message || response.data?.text || response.text || 'Olá! Como posso te ajudar hoje?';
        console.log('[FRONTEND] Text content:', responseText);
        
        // Resposta normal do chatbot
        const botMessage: ChatMessage = {
          id: response.metadata?.messageId || response.data?.messageId || response.messageId || Date.now().toString(),
          sender: 'bot',
          content: responseText,
          timestamp: new Date(),
          metadata: {
            ...response.metadata,
            ...response.data,
            isPremium: isPremiumUser,
            processingTime: response.metadata?.processingTime || response.data?.processingTime
          }
        };

        console.log('[FRONTEND] Created bot message:', botMessage);
        setMessages(prev => [...prev, botMessage]);
      } else {
        console.log('[FRONTEND] Processing fallback response');
        // ✅ CORREÇÃO: Acessar o texto da resposta corretamente
        const responseText = response.message || response.data?.text || response.text || 'Olá! Como posso te ajudar hoje?';
        console.log('[FRONTEND] Fallback text:', responseText);
        
        // Fallback para resposta simples
        const botMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'bot',
          content: responseText,
          timestamp: new Date(),
          metadata: {
            isPremium: isPremiumUser
          }
        };

        console.log('[FRONTEND] Created fallback message:', botMessage);
        setMessages(prev => [...prev, botMessage]);
      }
      
      // Atualizar título da sessão se for a primeira mensagem
      if (messages.filter(m => m.sender === 'user').length === 1) {
        const newTitle = message.slice(0, 30) + (message.length > 30 ? '...' : '');
        setActiveSession(prev => prev ? { ...prev, title: newTitle } : null);
        setSessions(prev => prev.map(s => 
          s.chatId === activeSession.chatId ? { ...s, title: newTitle } : s
        ));
      }
    } catch (error) {
      console.error('Erro no chat:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'bot',
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Executar ação automatizada
  const executeAutomatedAction = async (action: AutomatedAction) => {
    try {
      const response = await chatbotAPI.executeAction({
        action: action.type,
        payload: action.payload,
        chatId: activeSession?.chatId
      });

      if (response.success) {
        // ✅ MELHORADO: Mensagem mais natural
        const successMessage: ChatMessage = {
          id: `success-${Date.now()}`,
          sender: 'bot',
          content: `✅ ${action.successMessage}`,
          timestamp: new Date(),
          metadata: {
            isAutomated: true,
            isPremium: isPremiumUser,
            actionExecuted: true
          }
        };
        
        setMessages(prev => [...prev, successMessage]);
        
        // ✅ ADICIONADO: Toast de sucesso
        toast.success(action.successMessage);
        
        // ✅ MELHORADO: Sugestões mais naturais
        if (action.followUpQuestions && action.followUpQuestions.length > 0) {
          const followUpMessage: ChatMessage = {
            id: `followup-${Date.now()}`,
            sender: 'bot',
            content: 'Posso ajudar com mais alguma coisa?',
            timestamp: new Date(),
            metadata: {
              suggestions: action.followUpQuestions,
              isPremium: isPremiumUser
            }
          };
          
          setMessages(prev => [...prev, followUpMessage]);
        }
      } else {
        throw new Error('Failed to execute action');
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'bot',
        content: `❌ ${action.errorMessage}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // ✅ ADICIONADO: Toast de erro
      toast.error(action.errorMessage);
    }
  };

  // Handlers para ações automatizadas
  const handleActionConfirm = async (action: AutomatedAction) => {
    await executeAutomatedAction(action);
  };

  const handleActionEdit = (action: AutomatedAction) => {
    // Implementar edição da ação
    console.log('Editar ação:', action);
    toast.info('Funcionalidade de edição em desenvolvimento');
  };

  const handleActionCancel = (action: AutomatedAction) => {
    const cancelMessage: ChatMessage = {
      id: `cancel-${Date.now()}`,
      sender: 'bot',
      content: 'Ação cancelada. Como posso ajudar?',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, cancelMessage]);
    
    // ✅ ADICIONADO: Toast de cancelamento
    toast.info('Ação cancelada');
  };

  const handleFeedback = async (feedbackData: any) => {
    try {
      await chatbotAPI.saveUserFeedback(feedbackData);
      console.log('Feedback enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    }
  };

  const openFeedbackModal = (messageId: string) => {
    setFeedbackModal({ messageId, isOpen: true });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({ messageId: '', isOpen: false });
  };

  // Funções para exclusão de sessões
  const handleDeleteSession = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique propague para o loadSession
    
    if (window.confirm('Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.')) {
      try {
        await chatbotDeleteAPI.deleteSession(chatId);
        
        // Remove a sessão da lista
        setSessions(prev => prev.filter(s => s.chatId !== chatId));
        
        // Se a sessão ativa for a mesma que foi excluída, limpa a sessão ativa
        if (activeSession?.chatId === chatId) {
          setActiveSession(null);
          setMessages([]);
        }
        
        console.log('Sessão excluída com sucesso');
      } catch (error) {
        console.error('Erro ao excluir sessão:', error);
        alert('Erro ao excluir a conversa. Tente novamente.');
      }
    }
  };

  const handleDeleteAllSessions = async () => {
    if (window.confirm('Tem certeza que deseja excluir TODAS as conversas? Esta ação não pode ser desfeita.')) {
      try {
        await chatbotDeleteAPI.deleteAllSessions();
        
        // Limpa todas as sessões
        setSessions([]);
        setActiveSession(null);
        setMessages([]);
        
        console.log('Todas as sessões foram excluídas com sucesso');
      } catch (error) {
        console.error('Erro ao excluir todas as sessões:', error);
        alert('Erro ao excluir as conversas. Tente novamente.');
      }
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Botão de toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-4 rounded-full shadow-lg transition-all duration-300 ${
            isOpen ? 'bg-red-500 hover:bg-red-600' : theme.button
          } text-white relative`}
          aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
          {isPremiumUser && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-xs rounded-full px-2 py-1">
              <Sparkles size={12} />
            </span>
          )}
        </button>
      </div>

      {/* Chat principal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-24 right-6 w-[90vw] max-w-md h-[70vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col z-50 border-2 ${theme.border} overflow-hidden`}
          >
            {!activeSession ? (
              // Visualização de seleção de sessão
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {isMileagePage ? 'Consultas de Milhas' : 'Conversas'}
                  </h3>
                  <button
                    onClick={() => setIsNewSessionModalOpen(true)}
                    className={`${theme.button} text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2`}
                  >
                    {isMileagePage ? 'Nova Consulta' : 'Nova Conversa'}
                  </button>
                </div>
                
                {Array.isArray(sessions) && sessions.length > 0 ? (
                  <div className="space-y-2">
                    {sessions.map(session => (
                      <div
                        key={session.chatId}
                        className="p-3 chat-border-bottom rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div 
                          className="cursor-pointer"
                          onClick={() => loadSession(session.chatId)}
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white">{session.title}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(session.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={(e) => handleDeleteSession(session.chatId, e)}
                            className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Excluir conversa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma conversa encontrada</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Comece uma nova conversa para interagir com o assistente
                    </p>
                    <button
                      onClick={startNewSession}
                      className={`${theme.button} text-white px-6 py-2 rounded-lg flex items-center gap-2`}
                    >
                      Iniciar Chat
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Chat ativo
              <>
                <header className={`${theme.headerBg} p-4 chat-border-bottom flex justify-between items-center`}>
                  <div>
                    <h3 className="font-bold chat-title">{activeSession.title}</h3>
                    <p className="text-xs chat-subtitle">
                      {isPremiumUser ? (
                        <span className="flex items-center gap-1">
                          <Sparkles size={12} /> {getPlanDisplayName()}
                        </span>
                      ) : 'Modo Básico'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSession(null)}
                    className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X size={18} />
                  </button>
                </header>

                <div className={`flex-1 p-4 overflow-y-auto ${theme.chatBg}`}>
                  <div className="space-y-6">
                    {messages.map((msg) => (
                      <AdvancedMessageBubble 
                        key={msg.id}
                        message={msg}
                        theme={theme}
                        isPremium={isPremiumUser}
                        onFeedback={openFeedbackModal}
                        onActionConfirm={handleActionConfirm}
                        onActionEdit={handleActionEdit}
                        onActionCancel={handleActionCancel}
                      />
                    ))}
                    {isLoading && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                          <Bot className="w-5 h-5 text-indigo-500 dark:text-indigo-300" />
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                          <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${theme.headerBg}`}>
                  <CommandBar 
                    onSubmit={handleSendMessage}
                    isLoading={isLoading}
                    theme={theme}
                    placeholder={isMileagePage 
                      ? "Pergunte sobre suas milhas, cartões ou resgates..."
                      : "Como posso te ajudar hoje?"
                    }
                  />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de nova sessão */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-bold mb-4 dark:text-white">
              {isMileagePage ? 'Nova Consulta de Milhas' : 'Nova Conversa'}
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {isMileagePage
                ? (isPremiumUser
                    ? "Você está iniciando uma nova consulta com o especialista premium em milhas. Posso analisar seus cartões, calcular pontos e otimizar seus resgates."
                    : "Você está iniciando uma nova consulta sobre milhas. Posso ajudar com dúvidas sobre programas de fidelidade e cartões de crédito.")
                : (isPremiumUser
                    ? "Você está iniciando uma nova sessão com o consultor financeiro premium. Posso executar ações automaticamente e analisar seus dados em tempo real."
                    : "Você está iniciando uma nova conversa com o assistente básico. Posso ajudar com dúvidas sobre o app e conceitos financeiros gerais.")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsNewSessionModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={startNewSession}
                disabled={isLoading}
                className={`px-4 py-2 ${theme.button} text-white rounded-lg disabled:opacity-50 flex items-center gap-2`}
              >
                {isLoading ? 'Iniciando...' : (isMileagePage ? 'Começar Consulta' : 'Começar Conversa')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de feedback */}
      <AnimatePresence>
        {feedbackModal.isOpen && (
          <FeedbackModal
            messageId={feedbackModal.messageId}
            onClose={closeFeedbackModal}
            onSubmit={handleFeedback}
          />
        )}
      </AnimatePresence>

      {/* ToastContainer para notificações */}
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
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        toastClassName={`text-sm rounded-xl shadow-lg ${resolvedTheme === "dark" ? "bg-gray-700 text-gray-100" : "bg-white text-gray-800"}`}
      />
    </>
  );
}

// Componente de Feedback Modal
const FeedbackModal = ({ messageId, onClose, onSubmit }: {
  messageId: string;
  onClose: () => void;
  onSubmit: (feedback: any) => void;
}) => {
  const [feedback, setFeedback] = useState({
    rating: 0,
    helpful: true,
    comment: '',
    category: 'helpfulness' as 'accuracy' | 'helpfulness' | 'clarity' | 'relevance'
  });

  const handleSubmit = () => {
    onSubmit({
      messageId,
      rating: feedback.rating,
      helpful: feedback.helpful,
      comment: feedback.comment,
      category: feedback.category,
      context: ''
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-bold mb-4 dark:text-white">Avalie esta resposta</h3>
        
        <div className="mb-4">
          <label className="block mb-2 dark:text-gray-300">Qualidade:</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star}
                onClick={() => setFeedback({...feedback, rating: star})}
                className={`p-2 rounded-full transition-colors ${
                  feedback.rating >= star 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                <Star size={16} fill={feedback.rating >= star ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 dark:text-gray-300">Foi útil?</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFeedback({...feedback, helpful: true})}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                feedback.helpful 
                  ? 'bg-green-500 text-white border-green-500' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              <ThumbsUp size={16} className="mr-2" />
              Sim
            </button>
            <button
              onClick={() => setFeedback({...feedback, helpful: false})}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                !feedback.helpful 
                  ? 'bg-red-500 text-white border-red-500' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              <ThumbsDown size={16} className="mr-2" />
              Não
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 dark:text-gray-300">Categoria:</label>
          <select
            value={feedback.category}
            onChange={(e) => setFeedback({...feedback, category: e.target.value as any})}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="helpfulness">Utilidade</option>
            <option value="accuracy">Precisão</option>
            <option value="clarity">Clareza</option>
            <option value="relevance">Relevância</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 dark:text-gray-300">Comentário (opcional):</label>
          <textarea
            value={feedback.comment}
            onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
            placeholder="Conte-nos mais sobre sua experiência..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={feedback.rating === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            Enviar Feedback
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};