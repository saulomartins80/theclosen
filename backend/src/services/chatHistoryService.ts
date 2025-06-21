import { ChatMessage, Conversation } from '../types/chat';

export class ChatHistoryService {
  async getConversation(chatId: string): Promise<Conversation> {
    // TODO: Implementar lógica de busca no banco de dados
    return {
      chatId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async startNewConversation(userId: string): Promise<Conversation> {
    // TODO: Implementar lógica de criação no banco de dados
    return {
      chatId: Date.now().toString(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async addMessage(message: ChatMessage): Promise<void> {
    // TODO: Implementar lógica de adição no banco de dados
  }
} 