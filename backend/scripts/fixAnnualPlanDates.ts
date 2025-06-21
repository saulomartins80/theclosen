import { connect, disconnect } from 'mongoose';
import { User } from '../src/models/User';

async function fixAnnualPlanDates() {
  try {
    // Conectar ao MongoDB
    await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/financeapp');
    console.log('Conectado ao MongoDB');

    // Buscar usuários com planos anuais
    const usersWithAnnualPlans = await User.find({
      'subscription.plan': { $regex: /anual/i }
    });

    console.log(`Encontrados ${usersWithAnnualPlans.length} usuários com planos anuais`);

    for (const user of usersWithAnnualPlans) {
      if (!user.subscription) continue;

      const currentExpiresAt = new Date(user.subscription.expiresAt);
      const currentPeriodEnd = new Date(user.subscription.currentPeriodEnd);
      
      // Verificar se a data está correta (deve ser aproximadamente 1 ano a partir da data de criação)
      const createdAt = new Date(user.createdAt);
      const expectedExpiryDate = new Date(createdAt);
      expectedExpiryDate.setFullYear(expectedExpiryDate.getFullYear() + 1);

      // Se a data de vencimento está muito próxima da data de criação (menos de 2 meses), corrigir
      const daysDiff = Math.abs((currentExpiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 60) {
        console.log(`Corrigindo data para usuário ${user.email}:`);
        console.log(`  - Data atual: ${currentExpiresAt.toISOString()}`);
        console.log(`  - Nova data: ${expectedExpiryDate.toISOString()}`);
        
        await User.findByIdAndUpdate(user._id, {
          'subscription.expiresAt': expectedExpiryDate,
          'subscription.currentPeriodEnd': expectedExpiryDate
        });
        
        console.log(`  ✅ Data corrigida para ${user.email}`);
      } else {
        console.log(`  ✅ Data já está correta para ${user.email} (${daysDiff.toFixed(0)} dias)`);
      }
    }

    console.log('Processo concluído!');
  } catch (error) {
    console.error('Erro ao corrigir datas:', error);
  } finally {
    await disconnect();
    console.log('Desconectado do MongoDB');
  }
}

// Executar o script
fixAnnualPlanDates(); 