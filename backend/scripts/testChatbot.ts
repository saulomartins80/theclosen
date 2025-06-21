import { connect, disconnect } from 'mongoose';
import { User } from '../src/models/User';
import dotenv from 'dotenv';

dotenv.config();

async function testChatbot() {
  try {
    console.log('🤖 Testando reconhecimento de planos pelo chatbot...');
    
    // Conectar ao MongoDB
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI não configurada');
    }
    
    await connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    // Buscar o usuário específico
    const firebaseUid = 'Xn9dK4jXw7W5qO2g9AmSJkpLLCq1';
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log(`📋 Usuário: ${user.email}`);
    console.log(`📋 Plano: ${user.subscription?.plan}`);
    console.log(`📋 Status: ${user.subscription?.status}`);

    // Simular a lógica do chatbot
    const subscriptionStatus = user.subscription?.status || 'inactive';
    const subscriptionPlan = user.subscription?.plan?.toLowerCase() || 'essencial';

    console.log(`🔍 Status da assinatura: ${subscriptionStatus}`);
    console.log(`🔍 Plano (lowercase): ${subscriptionPlan}`);

    // Verificar se é premium
    const isPremium = subscriptionStatus === 'active' && (
      subscriptionPlan === 'top' || 
      subscriptionPlan === 'plano top' || 
      subscriptionPlan === 'top-anual' ||
      subscriptionPlan === 'plano top anual' ||
      subscriptionPlan === 'premium' || 
      subscriptionPlan === 'Premium' ||
      subscriptionPlan === 'enterprise' ||
      subscriptionPlan === 'Enterprise'
    );

    console.log(`🤖 É premium? ${isPremium ? '✅ SIM' : '❌ NÃO'}`);

    // Testar diferentes planos
    const testPlans = [
      'Plano Essencial Anual',
      'Plano Top Anual', 
      'Plano Top',
      'essencial',
      'top'
    ];

    console.log('\n🧪 Testando diferentes planos:');
    testPlans.forEach(plan => {
      const planLower = plan.toLowerCase();
      const isPremiumTest = subscriptionStatus === 'active' && (
        planLower === 'top' || 
        planLower === 'plano top' || 
        planLower === 'top-anual' ||
        planLower === 'plano top anual' ||
        planLower === 'premium' || 
        planLower === 'Premium' ||
        planLower === 'enterprise' ||
        planLower === 'Enterprise'
      );
      
      console.log(`  ${plan}: ${isPremiumTest ? '✅ Premium' : '❌ Não Premium'}`);
    });

    console.log('\n🎉 Teste concluído!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar o script
testChatbot().catch(console.error); 