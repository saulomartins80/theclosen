// backend/src/controllers/chatbotController.ts
import { Request, Response, NextFunction } from 'express';
import { container } from '../core/container';
import { TYPES } from '../core/types';
import { AppError } from '@core/errors/AppError';
import { UserService } from '../modules/users/services/UserService';
import AIService from '../services/aiService';
import { ChatHistoryService } from '../services/chatHistoryService';
import { IUser } from '../types/user';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
import { Transacoes } from '../models/Transacoes';
import Investimento from '../models/Investimento';
import { Goal } from '../models/Goal';

const userService = container.get<UserService>(TYPES.UserService);
const chatHistoryService = new ChatHistoryService();
const aiService = new AIService();

interface ChatMessageMetadata {
  analysisData?: any;
  processingTime?: number;
  error?: boolean;
  errorMessage?: string;
  expertise?: string;
  confidence?: number;
}

interface ChatMessage {
  chatId: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: ChatMessageMetadata;
}

export const handleChatQuery = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    const { message, chatId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!message || !chatId) {
      return res.status(400).json({ success: false, message: 'message and chatId are required' });
    }

    const chatHistoryService = new ChatHistoryService();
    const aiService = new AIService();

    // Buscar ou criar conversa
    let conversationHistory;
    try {
      conversationHistory = await chatHistoryService.getConversation(chatId);
    } catch (error) {
      // Se a conversa não existe, criar uma nova
      conversationHistory = await chatHistoryService.startNewConversation(userId);
    }

    console.log(`[ChatbotController] Conversa ${chatId} encontrada com ${conversationHistory.messages.length} mensagens`);

    // Adicionar mensagem do usuário ao histórico
    await chatHistoryService.addMessage({
      chatId: conversationHistory.chatId,
      userId: userId,
      sender: 'user',
      content: message,
      timestamp: new Date(),
      metadata: {
        messageType: 'basic',
        isImportant: false
      }
    });

    // Buscar dados do usuário
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // BUSCAR DADOS REAIS DAS COLEÇÕES SEPARADAS
    const [transacoes, investimentos, metas] = await Promise.all([
      Transacoes.find({ userId: user._id }),
      Investimento.find({ userId: user._id }),
      Goal.find({ userId: user._id })
    ]);

    const subscriptionStatus = user.subscription?.status;
    const subscriptionPlan = user.subscription?.plan;
    
    // Verificar se é premium - incluir diferentes variações do nome do plano
    const isPremium = subscriptionStatus === 'active' && (
      subscriptionPlan === 'top' || 
      subscriptionPlan === 'Plano Top' || 
      subscriptionPlan === 'Top-anual' ||
      subscriptionPlan === 'Plano Top Anual' ||
      subscriptionPlan === 'premium' || 
      subscriptionPlan === 'Premium' ||
      subscriptionPlan === 'enterprise' ||
      subscriptionPlan === 'Enterprise'
    );

    console.log('Chatbot - Status da assinatura:', {
      status: subscriptionStatus,
      plan: subscriptionPlan,
      isPremium: isPremium
    });

    // OBTER DADOS REAIS DO USUÁRIO
    const userRealData = {
      // Dados pessoais
      name: user.name || 'Usuário',
      email: user.email || '',
      createdAt: user.createdAt,
      
      // Dados financeiros reais das coleções
      transacoes: transacoes,
      investimentos: investimentos,
      metas: metas,
      
      // Estatísticas calculadas
      totalTransacoes: transacoes.length,
      totalInvestimentos: investimentos.length,
      totalMetas: metas.length,
      
      // Resumos dos dados
      resumoTransacoes: transacoes.length > 0 ? {
        total: transacoes.length,
        categorias: transacoes.reduce((acc: any, t: any) => {
          const cat = t.categoria || 'Sem categoria';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {}),
        ultimas: transacoes.slice(-5).map(t => ({
          descricao: t.descricao,
          valor: t.valor,
          categoria: t.categoria,
          tipo: t.tipo,
          data: t.data
        }))
      } : null,
      
      resumoInvestimentos: investimentos.length > 0 ? {
        total: investimentos.length,
        tipos: investimentos.reduce((acc: any, i: any) => {
          const tipo = i.tipo || 'Sem tipo';
          acc[tipo] = (acc[tipo] || 0) + 1;
          return acc;
        }, {}),
        ultimos: investimentos.slice(-5).map(i => ({
          nome: i.nome,
          valor: i.valor,
          tipo: i.tipo,
          data: i.data
        }))
      } : null,
      
      resumoMetas: metas.length > 0 ? {
        total: metas.length,
        status: metas.reduce((acc: any, m: any) => {
          const status = m.prioridade || 'media';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        ativas: metas.filter((m: any) => m.valor_atual < m.valor_total).slice(-5).map(m => ({
          titulo: m.meta,
          valor: m.valor_total,
          valorAtual: m.valor_atual,
          prazo: m.data_conclusao,
          prioridade: m.prioridade
        }))
      } : null
    };

    console.log('[ChatbotController] Dados reais do usuário:', {
      name: userRealData.name,
      totalTransacoes: userRealData.totalTransacoes,
      totalInvestimentos: userRealData.totalInvestimentos,
      totalMetas: userRealData.totalMetas
    });

    let response;
    const startTime = Date.now();

    try {
      if (isPremium) {
        // Consultor financeiro de alto nível para usuários premium
        const financialContext = {
          userData: {
            // Dados pessoais reais
            name: userRealData.name,
            email: userRealData.email,
            createdAt: userRealData.createdAt,
            
            // Dados financeiros reais
            hasTransactions: userRealData.totalTransacoes > 0,
            hasInvestments: userRealData.totalInvestimentos > 0,
            hasGoals: userRealData.totalMetas > 0,
            
            // Resumos detalhados
            transacoes: userRealData.resumoTransacoes,
            investimentos: userRealData.resumoInvestimentos,
            metas: userRealData.resumoMetas,
            
            // Dados completos para análise
            transacoesCompletas: userRealData.transacoes,
            investimentosCompletos: userRealData.investimentos,
            metasCompletas: userRealData.metas,
            
            riskProfile: (user as any).perfilInvestidor || 'moderado',
            subscriptionPlan: subscriptionPlan,
            subscriptionStatus: subscriptionStatus
          },
          platformKnowledge: 'Conhecimento da plataforma Finnextho',
          marketContext: {
            currentMarket: 'Dados em tempo real disponíveis',
            relevantIndicators: ['S&P 500', 'IBOVESPA', 'CDI', 'IPCA', 'Dólar', 'Euro']
          }
        };

        response = await aiService.getAdvancedFinancialAnalysis(
          JSON.stringify(financialContext),
          message,
          conversationHistory.messages.slice(-1) // Apenas última mensagem para velocidade
        );
      } else {
        // Usar resposta personalizada baseada no feedback do usuário
        const basicContext = {
          userData: {
            name: userRealData.name,
            hasTransactions: userRealData.totalTransacoes > 0,
            hasInvestments: userRealData.totalInvestimentos > 0,
            hasGoals: userRealData.totalMetas > 0,
            transacoes: userRealData.resumoTransacoes,
            investimentos: userRealData.resumoInvestimentos,
            metas: userRealData.resumoMetas
          }
        };

        response = await aiService.getPersonalizedResponse(
          userId,
          message,
          conversationHistory.messages.slice(-2)
        );
      }

      // Gerar ID único para a mensagem para feedback
      const messageId = `${conversationHistory.chatId}_${Date.now()}`;

      // Adicionar resposta ao histórico
      await chatHistoryService.addMessage({
        chatId: conversationHistory.chatId,
        userId: userId,
        sender: 'assistant',
        content: response.analysisText || response.text,
        metadata: {
          analysisData: response.analysisData,
          processingTime: Date.now() - startTime,
          expertise: isPremium ? 'CFA, CFP, CNAI, CNPI' : 'Assistente Finnextho',
          confidence: isPremium ? 0.95 : 0.85,
          messageType: isPremium ? 'premium' : 'basic',
          isImportant: false,
          messageId: messageId, // ID para feedback
          userDataAccessed: {
            name: userRealData.name,
            totalTransacoes: userRealData.totalTransacoes,
            totalInvestimentos: userRealData.totalInvestimentos,
            totalMetas: userRealData.totalMetas
          }
        },
        timestamp: new Date()
      });

      // Retornar resposta com ID para feedback
      const cleanResponse = {
        text: response.analysisText || response.text,
        chatId: conversationHistory.chatId,
        messageId: messageId,
        isPremium,
        userData: {
          name: userRealData.name,
          totalTransacoes: userRealData.totalTransacoes,
          totalInvestimentos: userRealData.totalInvestimentos,
          totalMetas: userRealData.totalMetas
        }
      };

      return res.status(200).json({ 
        success: true, 
        data: cleanResponse
      });

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Adicionar mensagem de erro ao histórico
      const message = {
        chatId: conversationHistory.chatId,
        userId: userId,
        sender: 'assistant' as const,
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date(),
        metadata: {
          analysisData: null,
          processingTime: Date.now() - startTime,
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
        } as {
          analysisData: null;
          processingTime: number;
          error: boolean;
          errorMessage: string;
        }
      };

      await chatHistoryService.addMessage(message);

      return res.status(500).json({ 
        success: false, 
        message: 'Ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.'
      });
    }

  } catch (error) {
    console.error('Erro no handleChatQuery:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.'
    });
  }
};

export const startNewSession = async (req: Request, res: Response) => {
  try {
    const chatId = uuidv4();
    // Aqui você pode adicionar lógica para salvar a sessão no banco de dados
    return res.status(200).json({ chatId });
  } catch (error) {
    console.error('Erro ao iniciar sessão do chatbot:', error);
    return res.status(500).json({ error: 'Erro ao iniciar sessão do chatbot' });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const sessions = await chatHistoryService.getSessions(userId);
    return res.status(200).json({ 
      success: true, 
      data: sessions 
    });
  } catch (error) {
    console.error('Erro ao buscar sessões do chatbot:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar sessões do chatbot' 
    });
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const conversation = await chatHistoryService.getConversation(chatId);
    
    // Verificar se a conversa pertence ao usuário
    if (conversation.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    return res.status(200).json({ 
      success: true, 
      data: {
        session: {
          chatId: conversation.chatId,
          title: conversation.messages[conversation.messages.length - 1]?.content.slice(0, 30) + '...',
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          userId: conversation.userId,
          isActive: conversation.isActive,
          lastActivity: conversation.lastActivity
        },
        messages: conversation.messages
      }
    });
  } catch (error) {
    console.error('Erro ao buscar sessão do chatbot:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar sessão do chatbot' 
    });
  }
};

// NOVO ENDPOINT PARA FEEDBACK
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    const { messageId, rating, helpful, comment, category } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!messageId || !rating || typeof helpful !== 'boolean' || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'messageId, rating, helpful e category são obrigatórios' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating deve ser entre 1 e 5' 
      });
    }

    const validCategories = ['accuracy', 'helpfulness', 'clarity', 'relevance'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category deve ser: accuracy, helpfulness, clarity ou relevance' 
      });
    }

    const feedback = await aiService.saveUserFeedback(userId, messageId, {
      rating,
      helpful,
      comment,
      category,
      context: req.body.context || ''
    });

    return res.status(200).json({ 
      success: true, 
      data: feedback 
    });

  } catch (error) {
    console.error('Erro ao salvar feedback:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao salvar feedback' 
    });
  }
};

// NOVO ENDPOINT PARA ANALYTICS DE FEEDBACK
export const getFeedbackAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const analytics = await aiService.getUserFeedbackAnalytics(userId);

    return res.status(200).json({ 
      success: true, 
      data: analytics 
    });

  } catch (error) {
    console.error('Erro ao buscar analytics de feedback:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar analytics' 
    });
  }
};

// NOVO ENDPOINT PARA EXCLUIR CONVERSA
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user?.uid;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!chatId) {
      return res.status(400).json({ success: false, message: 'chatId é obrigatório' });
    }

    // Verificar se a conversa pertence ao usuário
    const conversation = await chatHistoryService.getConversation(chatId);
    if (conversation.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    // Excluir a conversa
    await chatHistoryService.deleteConversation(chatId);

    return res.status(200).json({ 
      success: true, 
      message: 'Conversa excluída com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao excluir conversa:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir conversa' 
    });
  }
};

// NOVO ENDPOINT PARA EXCLUIR TODAS AS CONVERSAS
export const deleteAllConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Excluir todas as conversas do usuário
    await chatHistoryService.deleteAllUserConversations(userId);

    return res.status(200).json({ 
      success: true, 
      message: 'Todas as conversas foram excluídas com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao excluir todas as conversas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir conversas' 
    });
  }
};