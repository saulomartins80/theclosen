import { connect, disconnect } from 'mongoose';
import { User } from '../src/models/User';

async function testAnnualPlanCreation() {
  try {
    // Conectar ao MongoDB
    await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/financeapp');
    console.log('Conectado ao MongoDB');

    // Simular dados de um novo usuário com plano anual
    const testUserData = {
      firebaseUid: 'test_user_annual_plan',
      email: 'test@example.com',
      name: 'Usuário Teste',
      subscription: {
        plan: 'Plano Top Anual',
        status: 'active',
        stripeCustomerId: 'cus_test123',
        stripeSubscriptionId: 'sub_test123'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Calcular a data de expiração correta (1 ano a partir de agora)
    const now = new Date();
    const correctExpiryDate = new Date(now);
    correctExpiryDate.setFullYear(correctExpiryDate.getFullYear() + 1);

    console.log('=== TESTE DE CRIAÇÃO DE PLANO ANUAL ===');
    console.log('Data atual:', now.toISOString());
    console.log('Data de expiração correta (1 ano):', correctExpiryDate.toISOString());
    console.log('Diferença em dias:', Math.round((correctExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Verificar se já existe um usuário de teste
    const existingUser = await User.findOne({ firebaseUid: testUserData.firebaseUid });
    if (existingUser) {
      console.log('Removendo usuário de teste existente...');
      await User.findByIdAndDelete(existingUser._id);
    }

    // Criar usuário de teste com data correta
    const testUser = new User({
      ...testUserData,
      subscription: {
        ...testUserData.subscription,
        expiresAt: correctExpiryDate,
        currentPeriodEnd: correctExpiryDate
      }
    });

    await testUser.save();
    console.log('✅ Usuário de teste criado com data correta');

    // Verificar se foi salvo corretamente
    const savedUser = await User.findOne({ firebaseUid: testUserData.firebaseUid });
    if (savedUser) {
      console.log('\n=== DADOS SALVOS ===');
      console.log('Email:', savedUser.email);
      console.log('Plano:', savedUser.subscription?.plan);
      console.log('Created At:', savedUser.createdAt);
      console.log('Expires At:', savedUser.subscription?.expiresAt);
      console.log('Current Period End:', savedUser.subscription?.currentPeriodEnd);
      
      const daysDiff = Math.round((new Date(savedUser.subscription!.expiresAt!).getTime() - new Date(savedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      console.log('Diferença em dias:', daysDiff);
      
      if (daysDiff >= 365) {
        console.log('✅ Data de expiração está correta (1 ano)');
      } else {
        console.log('❌ Data de expiração está incorreta');
      }
    }

    // Limpar usuário de teste
    await User.findByIdAndDelete(savedUser!._id);
    console.log('🧹 Usuário de teste removido');

  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    await disconnect();
    console.log('Desconectado do MongoDB');
  }
}

// Executar o teste
testAnnualPlanCreation(); 