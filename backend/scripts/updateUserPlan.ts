import { connect, disconnect } from 'mongoose';
import { User } from '../src/models/User';
import dotenv from 'dotenv';

dotenv.config();

async function updateUserPlan() {
  try {
    console.log('🚀 Iniciando atualização manual do plano...');
    
    // Conectar ao MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não configurada');
    }
    
    await connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Buscar o usuário específico
    const firebaseUid = 'e0X4BbOCmPN7xAlRCTNUr8wF1Dq1';
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log(`📋 Usuário encontrado: ${user.email}`);
    console.log(`📋 Plano atual: ${user.subscription?.plan}`);
    console.log(`📋 Status: ${user.subscription?.status}`);

    // Atualizar o plano para "Plano Top Anual"
    const newPlan = 'Plano Top Anual';
    
    await User.findByIdAndUpdate(user._id, {
      'subscription.plan': newPlan,
      'subscription.updatedAt': new Date()
    });

    console.log(`✅ Plano atualizado de "${user.subscription?.plan}" para "${newPlan}"`);

    // Verificar se foi atualizado
    const updatedUser = await User.findOne({ firebaseUid });
    console.log(`📋 Novo plano: ${updatedUser?.subscription?.plan}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar o script
updateUserPlan().catch(console.error); 