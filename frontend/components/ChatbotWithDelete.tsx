import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, X, Send, User, Bot, 
  Sparkles, BarChart2, Lightbulb, BookOpen,
  Copy, ThumbsUp, ThumbsDown, Paperclip, Command,
  Star, TrendingUp, Target, Shield, Zap, Trash2,
  AlertTriangle, Clock, BarChart3, CheckCircle, XCircle,
  Plus, Edit3, Eye, Brain, Zap as ZapIcon
} from 'lucide-react';
import { chatbotAPI } from '../services/api';
import { chatbotDeleteAPI } from '../services/chatbotDeleteAPI';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import React from 'react';

// Tipos
type ChatMessage = {
  id: string;
  sender: 'user' | 'bot';
  content: string | React.ReactElement;
  timestamp: Date;
  metadata?: any;
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
  
  // Plano padrão
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

export default function ChatbotWithDelete({ isOpen: externalIsOpen, onToggle }: ChatbotProps) {
  const { user } = useAuth();
  const { theme: appTheme } = useTheme();
  const { addNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const theme = getChatTheme(user?.subscription?.plan);

  const isPremiumUser = user?.subscription?.status === 'active' && 
    (user?.subscription?.plan?.toLowerCase().includes('top') || 
     user?.subscription?.plan?.toLowerCase().includes('premium'));

  // Carregar sessões
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

  // Funções de exclusão
  const handleDeleteSession = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.')) {
      try {
        await chatbotDeleteAPI.deleteSession(chatId);
        setSessions(prev => prev.filter(s => s.chatId !== chatId));
        
        if (activeSession?.chatId === chatId) {
          setActiveSession(null);
          setMessages([]);
        }
        
        console.log('Sessão excluída com sucesso');
        addNotification({
          type: 'success',
          message: 'Conversa excluída com sucesso!'
        });
      } catch (error) {
        console.error('Erro ao excluir sessão:', error);
        addNotification({
          type: 'error',
          message: 'Erro ao excluir a conversa. Tente novamente.'
        });
      }
    }
  };

  const handleDeleteAllSessions = async () => {
    if (window.confirm('Tem certeza que deseja excluir TODAS as conversas? Esta ação não pode ser desfeita.')) {
      try {
        await chatbotDeleteAPI.deleteAllSessions();
        setSessions([]);
        setActiveSession(null);
        setMessages([]);
        console.log('Todas as sessões foram excluídas com sucesso');
        addNotification({
          type: 'success',
          message: 'Todas as conversas foram excluídas com sucesso!'
        });
      } catch (error) {
        console.error('Erro ao excluir todas as sessões:', error);
        addNotification({
          type: 'error',
          message: 'Erro ao excluir as conversas. Tente novamente.'
        });
      }
    }
  };

  // Funções básicas do chat
  const startNewSession = async () => {
    setIsLoading(true);
    try {
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
      console.error('Erro ao iniciar nova sessão:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (chatId: string) => {
    try {
      const response = await chatbotAPI.getSession(chatId);
      setActiveSession(response.session);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!activeSession || !message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatbotAPI.sendQuery({
        message,
        chatId: activeSession.chatId
      });

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        content: response.message,
        timestamp: new Date(),
        metadata: response.metadata
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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
              // Lista de sessões
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold dark:text-white">Suas Conversas</h3>
                  <div className="flex gap-2">
                    {sessions.length > 0 && (
                      <button
                        onClick={handleDeleteAllSessions}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm flex items-center gap-2 border border-red-200 dark:border-red-800"
                        title="Excluir todas as conversas"
                      >
                        <Trash2 size={14} />
                        Limpar Tudo
                      </button>
                    )}
                    <button
                      onClick={() => setIsNewSessionModalOpen(true)}
                      className={`${theme.button} text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2`}
                    >
                      Nova Conversa
                    </button>
                  </div>
                </div>
                
                {sessions.length > 0 ? (
                  <div className="space-y-2">
                    {sessions.map(session => (
                      <div
                        key={session.chatId}
                        className="p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div 
                          className="cursor-pointer"
                          onClick={() => loadSession(session.chatId)}
                        >
                          <h4 className="font-medium dark:text-white">{session.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
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
                          <Sparkles size={12} /> Plano Premium
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
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.sender === 'user'
                              ? `${theme.bubbleUser} text-white`
                              : `${theme.bubbleBot} ${theme.text}`
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
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
                  </div>
                </div>

                <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                      if (input.value.trim()) {
                        handleSendMessage(input.value);
                        input.value = '';
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      name="message"
                      placeholder={isPremiumUser 
                        ? "Digite sua pergunta ou ação financeira..." 
                        : "Pergunte sobre finanças ou o app..."}
                      className="flex-1 p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`p-3 ${theme.button} text-white rounded-lg disabled:opacity-50`}
                    >
                      <Send size={18} />
                    </button>
                  </form>
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
                ? "Você está iniciando uma nova sessão com o consultor financeiro premium."
                : "Você está iniciando uma nova conversa com o assistente básico."}
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
    </>
  );
} 