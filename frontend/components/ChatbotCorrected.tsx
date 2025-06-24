import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, X, Send, User, Bot, 
  Sparkles, BarChart2, Lightbulb, BookOpen,
  Copy, ThumbsUp, ThumbsDown, Paperclip, Command,
  Star, TrendingUp, Target, Shield, Zap
} from 'lucide-react';
import { chatbotAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

type Message = {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
  metadata?: {
    analysisData?: any;
    chartData?: any;
    actionItems?: string[];
    riskAssessment?: string;
    educationalResources?: string[];
    isPremium?: boolean;
    expertise?: string;
    followUpQuestions?: string[];
    userLevel?: 'basic' | 'intermediate' | 'advanced';
    confidence?: number;
    responseTime?: number;
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
      bubbleBot: 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700',
      text: 'text-gray-900 dark:text-white',
      icon: '🏆',
      accent: 'text-purple-600 dark:text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-700',
      border: 'border-purple-300 dark:border-purple-600'
    };
  }
  
  if (planName.includes('top')) {
    return {
      name: 'top',
      primary: '#f59e0b',
      secondary: '#f97316',
      gradient: 'from-amber-500 to-orange-500',
      bubbleUser: 'bg-gradient-to-r from-amber-500 to-orange-500',
      bubbleBot: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-900 dark:text-white',
      icon: '👑',
      accent: 'text-amber-600 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700',
      border: 'border-amber-300 dark:border-amber-600'
    };
  }
  
  if (planName.includes('essencial')) {
    return {
      name: 'essencial',
      primary: '#10b981',
      secondary: '#059669',
      gradient: 'from-emerald-500 to-green-500',
      bubbleUser: 'bg-gradient-to-r from-emerald-500 to-green-500',
      bubbleBot: 'bg-white dark:bg-gray-700',
      text: 'text-gray-900 dark:text-white',
      icon: '⭐',
      accent: 'text-emerald-600 dark:text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      border: 'border-emerald-300 dark:border-emerald-600'
    };
  }
  
  // Plano padrão (free)
  return {
    name: 'default',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    gradient: 'from-indigo-500 to-purple-500',
    bubbleUser: 'bg-indigo-600',
    bubbleBot: 'bg-white dark:bg-gray-700',
    text: 'text-gray-900 dark:text-white',
    icon: '💬',
    accent: 'text-indigo-600 dark:text-indigo-400',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    border: 'border-indigo-300 dark:border-indigo-600'
  };
};

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
              className={`p-2 rounded-full transition-colors ${
                feedback.helpful 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <ThumbsUp size={16} />
            </button>
            <button
              onClick={() => setFeedback({...feedback, helpful: false})}
              className={`p-2 rounded-full transition-colors ${
                !feedback.helpful 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <ThumbsDown size={16} />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 dark:text-gray-300">Categoria:</label>
          <select 
            value={feedback.category}
            onChange={(e) => setFeedback({...feedback, category: e.target.value as any})}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="helpfulness">Utilidade</option>
            <option value="accuracy">Precisão</option>
            <option value="clarity">Clareza</option>
            <option value="relevance">Relevância</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 dark:text-gray-300">Comentário (opcional):</label>
          <textarea
            value={feedback.comment}
            onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            rows={3}
            placeholder="Conte-nos mais sobre sua experiência..."
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 border rounded-lg dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            disabled={feedback.rating === 0}
          >
            Enviar Feedback
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente de Mensagem Avançado
const AdvancedMessageBubble = ({ 
  message, 
  theme, 
  isPremium,
  onFeedback 
}: { 
  message: Message; 
  theme: any;
  isPremium: boolean;
  onFeedback: (messageId: string) => void;
}) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Você pode adicionar um toast aqui
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
              </div>
              {message.metadata.responseTime && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {message.metadata.responseTime}ms
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Conteúdo da mensagem */}
        <div className="p-4">
          <div className={`prose dark:prose-invert prose-sm max-w-none ${message.sender === 'user' ? 'text-white' : ''}`}>
            <div dangerouslySetInnerHTML={{ __html: message.content }} />
          </div>
          
          {/* Metadados ricos */}
          {message.sender === 'bot' && message.metadata && (
            <div className="mt-4 space-y-3">
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
              
              {/* Itens de ação */}
              {message.metadata.actionItems && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-green-600 dark:text-green-400" />
                    <h4 className="font-bold text-sm text-green-800 dark:text-green-200">Ações Recomendadas</h4>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {message.metadata.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400">•</span>
                        <span className="text-green-700 dark:text-green-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Recursos educativos */}
              {message.metadata.educationalResources && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={16} className="text-amber-600 dark:text-amber-400" />
                    <h4 className="font-bold text-sm text-amber-800 dark:text-amber-200">Para Aprender Mais</h4>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {message.metadata.educationalResources.map((resource, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-600 dark:text-amber-400">•</span>
                        <a 
                          href={resource} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-amber-700 dark:text-amber-300 hover:underline"
                        >
                          {resource}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Perguntas de acompanhamento */}
              {message.metadata.followUpQuestions && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={16} className="text-blue-600 dark:text-blue-400" />
                    <h4 className="font-bold text-sm text-blue-800 dark:text-blue-200">Perguntas Relacionadas</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {message.metadata.followUpQuestions.map((question, i) => (
                      <button
                        key={i}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                        onClick={() => {
                          // Aqui você pode implementar a lógica para enviar a pergunta automaticamente
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
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input);
      setInput('');
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Sugestões baseadas no input
  useEffect(() => {
    if (input.length > 2) {
      const commonQuestions = [
        'Como cadastrar uma transação?',
        'Quais investimentos são melhores?',
        'Como definir uma meta?',
        'Onde encontro meus relatórios?',
        'Como funciona o CDI?'
      ];
      
      const filtered = commonQuestions.filter(q => 
        q.toLowerCase().includes(input.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 3));
    } else {
      setSuggestions([]);
    }
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full pl-4 pr-12 py-3 rounded-full bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white disabled:opacity-50"
        />
        
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${theme.button} text-white p-2 rounded-full disabled:opacity-50 transition-colors`}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
      
      {/* Sugestões */}
      {isFocused && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full mb-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border dark:border-gray-700"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 dark:border-gray-700"
              onMouseDown={() => {
                setInput(suggestion);
                setSuggestions([]);
              }}
            >
              <div className="font-medium dark:text-white text-sm">{suggestion}</div>
            </div>
          ))}
        </motion.div>
      )}
      
      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between mt-2 px-2">
        <div className="flex gap-2">
          <button 
            type="button" 
            className="text-gray-500 hover:text-indigo-600 transition-colors"
            title="Anexar arquivo"
          >
            <Paperclip size={16} />
          </button>
          <button 
            type="button" 
            className="text-gray-500 hover:text-indigo-600 transition-colors"
            title="Comandos rápidos"
          >
            <Command size={16} />
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Shift+Enter para quebrar linha
        </div>
      </div>
    </form>
  );
};

export default function Chatbot({ isOpen: externalIsOpen, onToggle }: ChatbotProps) {
  const { user, subscription } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ messageId: string; isOpen: boolean }>({ messageId: '', isOpen: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Obter tema dinâmico
  const theme = getChatTheme(subscription?.plan?.toString());

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

  // Obter expertise do consultor
  const getExpertiseDisplay = () => {
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
        title: 'Nova Conversa',
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

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Se não há sessão ativa, criar uma nova
    if (!activeSession) {
      await startNewSession();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatbotAPI.sendQuery({
        message: message,
        chatId: activeSession.chatId
      });

      const botMessage: Message = {
        id: response.data?.messageId || Date.now().toString(),
        sender: 'bot',
        content: response.data?.text || 'Desculpe, não consegui processar sua mensagem.',
        timestamp: new Date(),
        metadata: {
          ...response.data,
          isPremium: isPremiumUser
        }
      };

      setMessages(prev => [...prev, botMessage]);
      
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
      const errorMessage: Message = {
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

  const handleFeedback = async (feedbackData: any) => {
    try {
      await chatbotAPI.saveUserFeedback(feedbackData);
      // Você pode adicionar um toast de sucesso aqui
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
                  <h3 className="text-lg font-bold dark:text-white">Suas Conversas</h3>
                  <button
                    onClick={() => setIsNewSessionModalOpen(true)}
                    className={`${theme.button} text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2`}
                  >
                    Nova Conversa
                  </button>
                </div>
                
                {Array.isArray(sessions) && sessions.length > 0 ? (
                  <div className="space-y-2">
                    {sessions.map(session => (
                      <div
                        key={session.chatId}
                        onClick={() => loadSession(session.chatId)}
                        className="p-3 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <h4 className="font-medium dark:text-white">{session.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(session.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium dark:text-white mb-2">Nenhuma conversa encontrada</h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
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
                <header className="bg-white dark:bg-gray-900 p-4 border-b dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold dark:text-white">{activeSession.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isPremiumUser ? (
                        <span className="flex items-center gap-1">
                          <Sparkles size={12} /> {getPlanDisplayName()}
                        </span>
                      ) : 'Modo Básico'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSession(null)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X size={18} />
                  </button>
                </header>

                <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                  <div className="space-y-6">
                    {messages.map((msg) => (
                      <AdvancedMessageBubble 
                        key={msg.id}
                        message={msg}
                        theme={theme}
                        isPremium={isPremiumUser}
                        onFeedback={openFeedbackModal}
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

                <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CommandBar 
                    onSubmit={handleSendMessage}
                    isLoading={isLoading}
                    theme={theme}
                      placeholder={isPremiumUser 
                        ? "Digite sua pergunta sobre investimentos..." 
                        : "Pergunte sobre finanças ou o app..."}
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
            <h3 className="text-lg font-bold mb-4 dark:text-white">Nova Conversa</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {isPremiumUser
                ? "Você está iniciando uma nova sessão com o consultor financeiro premium. Podemos analisar seus dados e oferecer insights personalizados."
                : "Você está iniciando uma nova conversa com o assistente básico. Posso ajudar com dúvidas sobre o app e conceitos financeiros gerais."}
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
                {isLoading ? 'Iniciando...' : 'Começar Conversa'}
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
    </>
  );
} 