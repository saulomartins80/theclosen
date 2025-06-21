// frontend/components/AdvancedChatbot.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, X, Send, User, Bot, 
  Sparkles, BarChart2, Lightbulb, BookOpen 
} from 'lucide-react';
import { chatbotAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

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
  };
};

type ChatSession = {
  chatId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

// Função para definir cor do chat conforme o plano
function getChatColor(plan?: string) {
  const planName = (plan || '').toLowerCase();
  
  if (planName.includes('top anual')) {
    return {
      bg: 'bg-gradient-to-br from-purple-100 to-indigo-200 dark:from-purple-900/40 dark:to-indigo-900/50',
      border: 'border-purple-300 dark:border-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700',
      accent: 'text-purple-600',
      icon: '👑'
    };
  }
  
  if (planName.includes('top')) {
    return {
      bg: 'bg-gradient-to-br from-yellow-100 to-orange-200 dark:from-yellow-900/40 dark:to-orange-900/50',
      border: 'border-yellow-300 dark:border-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      accent: 'text-yellow-600',
      icon: '👑'
    };
  }
  
  if (planName.includes('essencial anual')) {
    return {
      bg: 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/50',
      border: 'border-green-300 dark:border-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      accent: 'text-green-600',
      icon: '⭐'
    };
  }
  
  if (planName.includes('essencial')) {
    return {
      bg: 'bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/40 dark:to-cyan-900/50',
      border: 'border-blue-300 dark:border-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      accent: 'text-blue-600',
      icon: '⭐'
    };
  }
  
  if (planName.includes('premium')) {
    return {
      bg: 'bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-900/50',
      border: 'border-blue-300 dark:border-blue-600',
      button: 'bg-blue-800 hover:bg-blue-900',
      accent: 'text-blue-800',
      icon: '🏆'
    };
  }
  
  // Plano padrão (free/trial)
  return {
    bg: 'bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-800/60 dark:to-blue-900/40',
    border: 'border-gray-300 dark:border-gray-600',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    accent: 'text-indigo-600',
    icon: '💬'
  };
}

export default function AdvancedChatbot() {
  const { user, subscription } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detectar se é usuário premium baseado no plano
  const isPremiumUser = subscription?.status === 'active' && (
    subscription?.plan === 'premium' || 
    (subscription?.plan && typeof subscription.plan === 'string' && 
     (subscription.plan.toLowerCase().includes('top') || 
      subscription.plan.toLowerCase().includes('premium')))
  );

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

  const chatColors = getChatColor(subscription?.plan?.toString());

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
      const newSession = {
        chatId: response.chatId,
        title: 'Nova Conversa',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setActiveSession(newSession);
      setSessions(prev => [newSession, ...prev]);
      setMessages([{
        id: Date.now().toString(),
        sender: 'bot',
        content: isPremiumUser 
          ? `👋 Olá ${user?.name || ''}! Sou seu consultor financeiro AI. Como posso ajudar com seus investimentos hoje?` 
          : '👋 Olá! Sou o Finn, seu assistente financeiro. Posso te ajudar com dúvidas sobre o app e conceitos básicos!',
        timestamp: new Date(),
        metadata: {
          isPremium: isPremiumUser
        }
      }]);
      
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !activeSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatbotAPI.sendQuery({
        message: inputValue,
        chatId: activeSession.chatId
      });

      const botMessage: Message = {
        id: response.data.messageId,
        sender: 'bot',
        content: response.data.analysisText || response.data.text,
        timestamp: new Date(),
        metadata: {
          ...response.data,
          isPremium: isPremiumUser
        }
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Atualizar título da sessão se for a primeira mensagem
      if (messages.filter(m => m.sender === 'user').length === 1) {
        const newTitle = inputValue.slice(0, 30) + (inputValue.length > 30 ? '...' : '');
        setActiveSession(prev => prev ? { ...prev, title: newTitle } : null);
        setSessions(prev => prev.map(s => 
          s.chatId === activeSession.chatId ? { ...s, title: newTitle } : s
        ));
      }
    } catch (error) {
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

  if (!user) return null;

  return (
    <>
      {/* Botão de toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-4 rounded-full shadow-lg transition-all duration-300 ${isOpen ? 'bg-red-500 hover:bg-red-600' : chatColors.button} text-white`}
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
            className={`fixed bottom-24 right-6 w-[90vw] max-w-md h-[70vh] ${chatColors.bg} rounded-2xl shadow-2xl flex flex-col z-50 border-2 ${chatColors.border} overflow-hidden`}
          >
            {!activeSession ? (
              // Visualização de seleção de sessão
              <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold dark:text-white">Suas Conversas</h3>
                  <button
                    onClick={() => setIsNewSessionModalOpen(true)}
                    className={`${chatColors.button} text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2`}
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
                      className={`${chatColors.button} text-white px-6 py-2 rounded-lg flex items-center gap-2`}
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

                <div className={`flex-1 p-4 overflow-y-auto ${chatColors.bg}`}>
                  <div className="space-y-6">
                    {messages.map((msg) => (
                      <MessageBubble 
                        key={msg.id}
                        message={msg}
                        isPremium={isPremiumUser}
                      />
                    ))}
                    {isLoading && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                          <Bot className="w-5 h-5 text-indigo-500 dark:text-indigo-300" />
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                          <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse-fast"></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse-medium"></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse-slow"></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={isPremiumUser 
                        ? "Digite sua pergunta sobre investimentos..." 
                        : "Pergunte sobre finanças ou o app..."}
                      disabled={isLoading}
                      className="w-full pl-4 pr-12 py-3 rounded-full bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !inputValue.trim()}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${chatColors.button} text-white p-2 rounded-full disabled:opacity-50`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
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
                className={`px-4 py-2 ${chatColors.button} text-white rounded-lg disabled:opacity-50 flex items-center gap-2`}
              >
                {isLoading ? 'Iniciando...' : 'Começar Conversa'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

// Componente de bolha de mensagem com suporte a markdown
function MessageBubble({ message, isPremium }: { message: Message, isPremium: boolean }) {
  return (
    <div className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
      {message.sender === 'bot' && (
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
          <Bot className="w-5 h-5 text-indigo-500 dark:text-indigo-300" />
        </div>
      )}
      
      <div className={`max-w-[85%] rounded-2xl ${message.sender === 'user' 
        ? 'bg-indigo-600 text-white rounded-tr-none' 
        : 'bg-white dark:bg-gray-700 rounded-tl-none shadow-sm'}`}
      >
        <div className="p-4">
          <div className={`prose dark:prose-invert prose-sm max-w-none ${message.sender === 'user' ? 'text-white' : ''}`}>
            <Markdown rehypePlugins={[rehypeHighlight]}>
              {message.content}
            </Markdown>
          </div>
          
          {/* Metadados premium */}
          {message.sender === 'bot' && message.metadata && (
            <div className="mt-3 space-y-3">
              {message.metadata.analysisData && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 size={16} />
                    <h4 className="font-bold text-sm">Análise Detalhada</h4>
                  </div>
                  <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    {JSON.stringify(message.metadata.analysisData, null, 2)}
                  </pre>
                </div>
              )}
              
              {message.metadata.actionItems && isPremium && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={16} />
                    <h4 className="font-bold text-sm">Ações Recomendadas</h4>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {message.metadata.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {message.metadata.educationalResources && isPremium && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={16} />
                    <h4 className="font-bold text-sm">Para Aprender Mais</h4>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {message.metadata.educationalResources.map((resource, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span>•</span>
                        <a href={resource} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                          {resource}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={`px-4 pb-2 pt-1 text-xs ${message.sender === 'user' 
          ? 'text-indigo-100 text-right' 
          : 'text-gray-500 dark:text-gray-400'}`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {message.sender === 'user' && (
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
          <User className="w-5 h-5 text-gray-500 dark:text-gray-300" />
        </div>
      )}
    </div>
  );
}