//ChatHistoryService.ts
import { ChatMessage, Conversation, ChatAnalytics, ChatSession } from '../types/chat';
import { ChatMessage as ChatMessageModel, IChatMessage } from '../models/ChatMessage';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../errors/AppError';

export class ChatHistoryService {
  
  // Calcular data de expiração baseada no tipo de mensagem
  private calculateExpirationDate(messageType: string, isImportant: boolean = false): Date {
    const now = new Date();
    
    // Ajustar tempos de expiração para serem mais longos
    if (isImportant) {
      // Mensagens importantes duram 30 dias
      return new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    }
    
    switch (messageType) {
      case 'premium':
        // Análises premium duram 7 dias
        return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      case 'analysis':
        // Análises financeiras duram 7 dias
        return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      case 'guidance':
        // Orientações da plataforma duram 3 dias
        return new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      case 'basic':
      default:
        // Mensagens básicas duram 24 horas
        return new Date(now.getTime() + (24 * 60 * 60 * 1000));
    }
  }

  async getConversation(chatId: string): Promise<Conversation> {
    try {
      console.log(`[ChatHistoryService] Buscando conversa: ${chatId}`);
      
      // Buscar mensagens da conversa que não expiraram
      const messages = await ChatMessageModel.find({ 
        chatId,
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: { $exists: false } }
        ]
      })
      .sort({ timestamp: 1 })
      .lean();

      // Se não há mensagens, verificar se a conversa existe mas expirou
      if (messages.length === 0) {
        const expiredMessages = await ChatMessageModel.find({ chatId }).limit(1).lean();
        if (expiredMessages.length > 0) {
          console.log(`[ChatHistoryService] Conversa ${chatId} expirou`);
          throw new Error('Conversa expirada');
        } else {
          console.log(`[ChatHistoryService] Conversa ${chatId} não encontrada`);
          throw new Error('Conversa não encontrada');
        }
      }

      console.log(`[ChatHistoryService] Conversa ${chatId} encontrada com ${messages.length} mensagens`);

      return {
        chatId,
        messages: messages.map(msg => ({
          chatId: msg.chatId,
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata,
          expiresAt: msg.expiresAt,
          isImportant: msg.isImportant,
          userId: msg.userId
        })),
        createdAt: messages[0]?.createdAt || new Date(),
        updatedAt: messages[messages.length - 1]?.updatedAt || new Date(),
        userId: messages[0]?.userId,
        isActive: true,
        lastActivity: messages[messages.length - 1]?.timestamp
      };
    } catch (error) {
      console.error('Erro ao buscar conversa:', error);
      throw error;
    }
  }

  async startNewConversation(userId: string): Promise<Conversation> {
    try {
      const chatId = uuidv4();
      
      // Criar mensagem inicial do sistema
      const welcomeMessage = new ChatMessageModel({
        chatId,
        userId,
        sender: 'assistant',
        content: 'Conversa iniciada',
        timestamp: new Date(),
        metadata: {
          messageType: 'basic',
          isImportant: false
        },
        expiresAt: this.calculateExpirationDate('basic'),
        isImportant: false
      });

      await welcomeMessage.save();

    return {
        chatId,
        messages: [{
          chatId,
          sender: 'assistant',
          content: 'Conversa iniciada',
          timestamp: new Date(),
          metadata: {
            messageType: 'basic',
            isImportant: false
          },
          expiresAt: this.calculateExpirationDate('basic'),
          isImportant: false,
          userId
        }],
      createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        isActive: true,
        lastActivity: new Date()
    };
    } catch (error) {
      console.error('Erro ao criar nova conversa:', error);
      throw error;
    }
  }

  async addMessage(message: ChatMessage): Promise<void> {
    try {
      const messageType = message.metadata?.messageType || 'basic';
      const isImportant = message.metadata?.isImportant || false;
      
      const chatMessage = new ChatMessageModel({
        chatId: message.chatId,
        userId: message.userId,
        sender: message.sender,
        content: message.content,
        timestamp: message.timestamp,
        metadata: {
          ...message.metadata,
          messageType,
          isImportant
        },
        expiresAt: this.calculateExpirationDate(messageType, isImportant),
        isImportant
      });

      await chatMessage.save();
      
      // Atualizar analytics do usuário
      await this.updateUserAnalytics(message.userId!, messageType);
      
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error);
      throw error;
    }
  }

  async getSessions(userId: string): Promise<ChatSession[]> {
    try {
      // Buscar todas as mensagens do usuário
      const messages = await ChatMessageModel.find({ 
        userId,
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: { $exists: false } }
        ]
      }).sort({ timestamp: -1 }).lean();

      // Agrupar por chatId manualmente
      const sessionsMap = new Map();
      
      messages.forEach(msg => {
        if (!sessionsMap.has(msg.chatId)) {
          // Criar nova sessão
          const title = msg.content.length > 30 
            ? msg.content.substring(0, 30) + '...' 
            : msg.content;
            
          sessionsMap.set(msg.chatId, {
            chatId: msg.chatId,
            title: title,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
            messageCount: 1
          });
        } else {
          // Atualizar sessão existente
          const session = sessionsMap.get(msg.chatId);
          session.messageCount++;
          
          // Atualizar título e data se for mais recente
          if (msg.updatedAt > session.updatedAt) {
            session.updatedAt = msg.updatedAt;
            session.title = msg.content.length > 30 
              ? msg.content.substring(0, 30) + '...' 
              : msg.content;
          }
        }
      });

      // Converter para array e ordenar por data mais recente
      const sessions = Array.from(sessionsMap.values());
      sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      return sessions.map(session => ({
        chatId: session.chatId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        userId,
        isActive: true,
        lastActivity: session.updatedAt,
        messageCount: session.messageCount
      }));
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      return [];
    }
  }

  async markMessageAsImportant(chatId: string, messageId: string, userId: string): Promise<void> {
    try {
      await ChatMessageModel.updateOne(
        { 
          chatId, 
          _id: messageId, 
          userId,
          $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: { $exists: false } }
          ]
        },
        { 
          isImportant: true,
          expiresAt: this.calculateExpirationDate('basic', true)
        }
      );
    } catch (error) {
      console.error('Erro ao marcar mensagem como importante:', error);
      throw error;
    }
  }

  async updateUserAnalytics(userId: string, messageType: string): Promise<void> {
    try {
      // Aqui você pode implementar lógica para atualizar analytics do usuário
      // Por exemplo, contar mensagens, calcular tempo médio de resposta, etc.
      console.log(`Analytics atualizado para usuário ${userId}, tipo: ${messageType}`);
    } catch (error) {
      console.error('Erro ao atualizar analytics:', error);
    }
  }

  async cleanupExpiredMessages(): Promise<number> {
    try {
      const result = await ChatMessageModel.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      console.log(`Limpeza automática: ${result.deletedCount} mensagens expiradas removidas`);
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Erro na limpeza automática:', error);
      return 0;
    }
  }

  async deleteConversation(chatId: string): Promise<void> {
    try {
      console.log(`[ChatHistoryService] Excluindo conversa: ${chatId}`);
      
      // Excluir a conversa do MongoDB - CORRIGIDO: usar deleteMany em vez de deleteOne
      const result = await ChatMessageModel.deleteMany({ chatId });
      
      console.log(`[ChatHistoryService] Conversa ${chatId} excluída com sucesso - ${result.deletedCount} mensagens removidas`);
    } catch (error) {
      console.error(`[ChatHistoryService] Erro ao excluir conversa ${chatId}:`, error);
      throw new AppError(500, 'Erro ao excluir conversa');
    }
  }

  async deleteAllUserConversations(userId: string): Promise<void> {
    try {
      console.log(`[ChatHistoryService] Excluindo todas as conversas do usuário: ${userId}`);
      
      // Buscar todas as conversas do usuário
      const conversations = await ChatMessageModel.find({ userId });
      const chatIds = conversations.map(conv => conv.chatId);
      
      if (chatIds.length === 0) {
        console.log(`[ChatHistoryService] Nenhuma conversa encontrada para o usuário ${userId}`);
        return;
      }
      
      // Excluir todas as conversas
      await ChatMessageModel.deleteMany({ userId });
      
      console.log(`[ChatHistoryService] ${chatIds.length} conversas excluídas para o usuário ${userId}`);
    } catch (error) {
      console.error(`[ChatHistoryService] Erro ao excluir conversas do usuário ${userId}:`, error);
      throw new AppError(500, 'Erro ao excluir conversas');
    }
  }
} 