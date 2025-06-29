import { User } from '../src/models/User';
import { Transacoes } from '../src/models/Transacoes';
import Investimento from '../src/models/Investimento';
import { Goal } from '../src/models/Goal';
import { connectDB } from '../src/config/db';

async function testChatbotData() {
  try {
    await connectDB();
    console.log('Conectado ao banco de dados');

    // Buscar usuário de teste
    const userId = 'E7FwMNz7jjf2f8W6JHvrRDUvo2t1'; // ID do usuário dos logs
    const user = await User.findOne({ firebaseUid: userId });
    
    if (!user) {
      console.log('Usuário não encontrado');
      return;
    }

    console.log('Usuário encontrado:', {
      name: user.name,
      email: user.email,
      subscription: user.subscription
    });

    // Buscar dados das coleções
    const [transacoes, investimentos, metas] = await Promise.all([
      Transacoes.find({ userId: user._id }),
      Investimento.find({ userId: user._id }),
      Goal.find({ userId: user._id })
    ]);

    console.log('\n=== DADOS ENCONTRADOS ===');
    console.log('Transações:', transacoes.length);
    console.log('Investimentos:', investimentos.length);
    console.log('Metas:', metas.length);

    if (transacoes.length > 0) {
      console.log('\n=== ÚLTIMAS TRANSAÇÕES ===');
      transacoes.slice(-3).forEach(t => {
        console.log(`- ${t.descricao}: R$ ${t.valor} (${t.categoria})`);
      });
    }

    if (investimentos.length > 0) {
      console.log('\n=== INVESTIMENTOS ===');
      investimentos.forEach(i => {
        console.log(`- ${i.nome}: R$ ${i.valor} (${i.tipo})`);
      });
    }

    if (metas.length > 0) {
      console.log('\n=== METAS ===');
      metas.forEach(m => {
        console.log(`- ${m.meta}: R$ ${m.valor_atual}/${m.valor_total} (${m.prioridade})`);
      });
    }

    // Simular contexto do usuário
    const userRealData = {
      name: user.name || 'Usuário',
      email: user.email || '',
      createdAt: user.createdAt,
      transacoes: transacoes,
      investimentos: investimentos,
      metas: metas,
      totalTransacoes: transacoes.length,
      totalInvestimentos: investimentos.length,
      totalMetas: metas.length,
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

    console.log('\n=== CONTEXTO DO USUÁRIO ===');
    console.log('Nome:', userRealData.name);
    console.log('Total Transações:', userRealData.totalTransacoes);
    console.log('Total Investimentos:', userRealData.totalInvestimentos);
    console.log('Total Metas:', userRealData.totalMetas);

    if (userRealData.resumoTransacoes) {
      console.log('\nResumo Transações:', JSON.stringify(userRealData.resumoTransacoes, null, 2));
    }

    if (userRealData.resumoInvestimentos) {
      console.log('\nResumo Investimentos:', JSON.stringify(userRealData.resumoInvestimentos, null, 2));
    }

    if (userRealData.resumoMetas) {
      console.log('\nResumo Metas:', JSON.stringify(userRealData.resumoMetas, null, 2));
    }

    console.log('\n✅ Teste concluído com sucesso!');
    console.log('O chatbot agora deve conseguir acessar os dados do usuário.');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    process.exit(0);
  }
}

testChatbotData(); 