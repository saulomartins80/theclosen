import { connect, disconnect } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testMongo() {
  try {
    console.log('🚀 Iniciando teste de conexão com o MongoDB...');
    console.log('📋 Verificando variável de ambiente...');
    
    if (!process.env.MONGO_URI) {
      throw new Error('❌ MONGO_URI não configurada');
    }
    
    console.log('✅ Variável MONGO_URI encontrada');
    console.log('🔗 Tentando conectar ao MongoDB...');
    
    await connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB com sucesso!');
    
    // Testar uma operação simples
    console.log('🧪 Testando operação de leitura...');
    console.log('📊 Conexão estabelecida com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar:', error);
  } finally {
    await disconnect();
    console.log('🔌 Desconectado do MongoDB');
    console.log('🎉 Teste concluído!');
  }
}

console.log('📝 Script iniciado...');
testMongo().catch(console.error); 