import mongoose from 'mongoose';
import { config } from '../src/config';

// Conectar ao MongoDB
async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
}

// Limpar mensagens expiradas
async function cleanupExpiredMessages() {
  try {
    const { ChatMessage } = require('../src/models/ChatMessage');
    
    const now = new Date();
    const result = await ChatMessage.deleteMany({
      expiresAt: { $lt: now }
    });
    
    console.log(`🗑️ Removidas ${result.deletedCount} mensagens expiradas`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Erro ao limpar mensagens expiradas:', error);
    return 0;
  }
}

// Corrigir conversas sem mensagens
async function fixOrphanedConversations() {
  try {
    const { ChatMessage } = require('../src/models/ChatMessage');
    
    // Buscar todos os chatIds únicos
    const chatIds = await ChatMessage.distinct('chatId');
    console.log(`📊 Encontrados ${chatIds.length} chatIds únicos`);
    
    let fixedCount = 0;
    
    for (const chatId of chatIds) {
      // Verificar se há mensagens válidas para este chatId
      const validMessages = await ChatMessage.countDocuments({
        chatId,
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: { $exists: false } }
        ]
      });
      
      if (validMessages === 0) {
        // Se não há mensagens válidas, remover todas as mensagens deste chatId
        const result = await ChatMessage.deleteMany({ chatId });
        console.log(`🗑️ Removidas ${result.deletedCount} mensagens do chatId ${chatId} (sem mensagens válidas)`);
        fixedCount += result.deletedCount;
      }
    }
    
    console.log(`🔧 Corrigidas ${fixedCount} mensagens órfãs`);
    return fixedCount;
  } catch (error) {
    console.error('❌ Erro ao corrigir conversas órfãs:', error);
    return 0;
  }
}

// Estatísticas das conversas
async function getConversationStats() {
  try {
    const { ChatMessage } = require('../src/models/ChatMessage');
    
    const totalMessages = await ChatMessage.countDocuments();
    const expiredMessages = await ChatMessage.countDocuments({
      expiresAt: { $lt: new Date() }
    });
    const validMessages = await ChatMessage.countDocuments({
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: { $exists: false } }
      ]
    });
    
    const uniqueChatIds = await ChatMessage.distinct('chatId');
    
    console.log('\n📊 Estatísticas das Conversas:');
    console.log(`   Total de mensagens: ${totalMessages}`);
    console.log(`   Mensagens válidas: ${validMessages}`);
    console.log(`   Mensagens expiradas: ${expiredMessages}`);
    console.log(`   Conversas únicas: ${uniqueChatIds.length}`);
    
    return {
      totalMessages,
      validMessages,
      expiredMessages,
      uniqueChatIds: uniqueChatIds.length
    };
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    return null;
  }
}

// Função principal
async function main() {
  console.log('🧹 Iniciando limpeza do histórico de chat...\n');
  
  await connectDB();
  
  // Obter estatísticas antes da limpeza
  console.log('📈 Estatísticas antes da limpeza:');
  await getConversationStats();
  
  console.log('\n🧹 Executando limpeza...');
  
  // Limpar mensagens expiradas
  const expiredCount = await cleanupExpiredMessages();
  
  // Corrigir conversas órfãs
  const orphanedCount = await fixOrphanedConversations();
  
  // Obter estatísticas após a limpeza
  console.log('\n📈 Estatísticas após a limpeza:');
  await getConversationStats();
  
  console.log(`\n✅ Limpeza concluída!`);
  console.log(`   Mensagens expiradas removidas: ${expiredCount}`);
  console.log(`   Mensagens órfãs corrigidas: ${orphanedCount}`);
  
  await mongoose.disconnect();
  console.log('🔌 Desconectado do MongoDB');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { cleanupExpiredMessages, fixOrphanedConversations, getConversationStats }; 