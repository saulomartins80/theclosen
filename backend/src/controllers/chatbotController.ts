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

const userService = container.get<UserService>(TYPES.UserService);
const chatHistoryService = new ChatHistoryService();
const aiService = new AIService();

interface ChatMessageMetadata {
  analysisData?: any;
  processingTime?: number;
  error?: boolean;
  errorMessage?: string;
}

interface ChatMessage {
  chatId: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: ChatMessageMetadata;
}

export const handleChatQuery = async (req: Request, res: Response) => {
  const { message, chatId } = req.body;
  const userId = req.user?.uid;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    const user = await userService.getUserByFirebaseUid(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Obter histórico de conversa se existir
    const conversationHistory = chatId 
      ? await chatHistoryService.getConversation(chatId)
      : await chatHistoryService.startNewConversation(userId);

    // Adicionar mensagem do usuário ao histórico
    await chatHistoryService.addMessage({
      chatId: conversationHistory.chatId,
      sender: 'user',
      content: message,
      timestamp: new Date()
    });

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

    let response;
    const startTime = Date.now();

    try {
      if (isPremium) {
        // Construir contexto para usuários premium
        const financialContext = {
          userData: {
            transactions: user.transacoes,
            investments: user.investimentos,
            goals: user.metas,
            riskProfile: (user as any).perfilInvestidor
          },
          marketContext: {
            currentMarket: await aiService.getMarketOverview(),
            relevantIndicators: ['S&P 500', 'IBOVESPA', 'CDI', 'IPCA']
          },
          conversationHistory: conversationHistory.messages.slice(-6) // Últimas 6 mensagens
        };

        response = await aiService.getAdvancedFinancialAnalysis(
          JSON.stringify(financialContext),
          message,
          conversationHistory.messages
        );
      } else {
        // Fluxo básico com memória de conversa
        const basicSystemPrompt = `
          Você é o Finn, assistente do Finnextho. Seu perfil:
          - Personalidade: Amigável, encorajador e didático
          - Tom: Casual mas profissional, como um mentor financeiro
          - Objetivo: Educar sobre finanças sem dar conselhos diretos
          - Limitações: Não pode recomendar investimentos específicos
          
          Contexto:
          - Usuário: ${user.name || 'Cliente Finnextho'}
          - Plano: ${subscriptionPlan || 'Básico'}
          - Últimas interações: ${conversationHistory.messages.slice(-3).map(m => m.content).join(' | ') || 'Nenhuma'}
        `;

        response = await aiService.generateContextualResponse(
          basicSystemPrompt,
          message,
          conversationHistory.messages
        );
      }

      // Adicionar resposta ao histórico
      await chatHistoryService.addMessage({
        chatId: conversationHistory.chatId,
        sender: 'assistant',
        content: response.analysisText || response.text,
        metadata: {
          analysisData: response.analysisData,
          processingTime: Date.now() - startTime
        },
        timestamp: new Date()
      });

      // Enriquecer resposta com metadados
      const enrichedResponse = {
        ...response,
        chatId: conversationHistory.chatId,
        messageId: Date.now().toString(),
        isPremium,
        suggestedFollowUps: isPremium 
          ? await aiService.generateFollowUpQuestions(message, response.analysisText)
          : null
      };

      return res.status(200).json({ 
        success: true, 
        data: enrichedResponse
      });

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Adicionar mensagem de erro ao histórico
      const message = {
        chatId: conversationHistory.chatId,
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
    res.status(200).json({ chatId });
  } catch (error) {
    console.error('Erro ao iniciar sessão do chatbot:', error);
    res.status(500).json({ error: 'Erro ao iniciar sessão do chatbot' });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    // Aqui você pode adicionar lógica para buscar as sessões do banco de dados
    res.status(200).json({ sessions: [] });
  } catch (error) {
    console.error('Erro ao buscar sessões do chatbot:', error);
    res.status(500).json({ error: 'Erro ao buscar sessões do chatbot' });
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    // Aqui você pode adicionar lógica para buscar uma sessão específica
    res.status(200).json({ chatId });
  } catch (error) {
    console.error('Erro ao buscar sessão do chatbot:', error);
    res.status(500).json({ error: 'Erro ao buscar sessão do chatbot' });
  }
};