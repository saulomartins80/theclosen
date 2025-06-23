import { ChatHistoryService } from '../services/chatHistoryService';

export class ChatCleanupJob {
  private chatHistoryService: ChatHistoryService;

  constructor() {
    this.chatHistoryService = new ChatHistoryService();
  }

  async run(): Promise<void> {
    try {
      console.log('🔄 Iniciando limpeza automática de mensagens expiradas...');
      
      const deletedCount = await this.chatHistoryService.cleanupExpiredMessages();
      
      if (deletedCount > 0) {
        console.log(`✅ Limpeza concluída: ${deletedCount} mensagens expiradas removidas`);
      } else {
        console.log('✅ Limpeza concluída: Nenhuma mensagem expirada encontrada');
      }
    } catch (error) {
      console.error('❌ Erro na limpeza automática:', error);
    }
  }
}

// Função para executar a limpeza
export const runChatCleanup = async (): Promise<void> => {
  const cleanupJob = new ChatCleanupJob();
  await cleanupJob.run();
}; 