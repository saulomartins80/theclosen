import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { Transacoes } from '../src/models/Transacoes';
import { Investimento } from '../src/models/Investimento';
import { Goal } from '../src/models/Goal';

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finnextho');

async function testChatbotData() {
  try {
    console.log('=== TESTE DE DADOS DO CHATBOT ===');
    
    // Buscar usuário específico (substitua pelo firebaseUid correto)
    const firebaseUid = 'jJOp4uvDcnMXNWeJxaQvLTRHhcC2';
    const user = await User.findOne({ firebaseUid });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:', user.name);
    console.log('📧 Email:', user.email);
    
    // Buscar dados das coleções separadas
    const [transacoes, investimentos, metas] = await Promise.all([
      Transacoes.find({ userId: user._id }),
      Investimento.find({ userId: user._id }),
      Goal.find({ userId: user._id })
    ]);
    
    console.log('\n=== DADOS REAIS ===');
    console.log('💰 Transações:', transacoes.length);
    transacoes.forEach(t => {
      console.log(`  - ${t.descricao}: R$ ${t.valor} (${t.categoria})`);
    });
    
    console.log('\n📈 Investimentos:', investimentos.length);
    investimentos.forEach(i => {
      console.log(`  - ${i.nome}: R$ ${i.valor} (${i.tipo})`);
    });
    
    console.log('\n🎯 Metas:', metas.length);
    metas.forEach(m => {
      console.log(`  - ${m.titulo}: R$ ${m.valor} (${m.status})`);
    });
    
    // Simular o que o controller faria
    const userRealData = {
      name: user.name || 'Usuário',
      email: user.email || '',
      totalTransacoes: transacoes.length,
      totalInvestimentos: investimentos.length,
      totalMetas: metas.length,
      hasTransactions: transacoes.length > 0,
      hasInvestments: investimentos.length > 0,
      hasGoals: metas.length > 0
    };
    
    console.log('\n=== DADOS PARA O CHATBOT ===');
    console.log('Nome:', userRealData.name);
    console.log('Total Transações:', userRealData.totalTransacoes);
    console.log('Total Investimentos:', userRealData.totalInvestimentos);
    console.log('Total Metas:', userRealData.totalMetas);
    console.log('Tem Transações:', userRealData.hasTransactions);
    console.log('Tem Investimentos:', userRealData.hasInvestments);
    console.log('Tem Metas:', userRealData.hasGoals);
    
    if (userRealData.hasTransactions) {
      console.log('\n=== RESUMO TRANSAÇÕES ===');
      const categorias = transacoes.reduce((acc: any, t: any) => {
        const cat = t.categoria || 'Sem categoria';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Categorias:', categorias);
      console.log('Últimas transações:', transacoes.slice(-3).map(t => ({
        descricao: t.descricao,
        valor: t.valor,
        categoria: t.categoria
      })));
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testChatbotData(); 