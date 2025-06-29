import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { stripe } from '../src/config/stripe';

async function fixSubscriptionIssues() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ Conectado ao MongoDB');

    // 1. Corrigir usuários com subscriptionId null
    console.log('\n🔧 Corrigindo usuários com subscriptionId null...');
    const usersWithNullSubscription = await User.find({
      'subscription.stripeSubscriptionId': null
    });

    console.log(`Encontrados ${usersWithNullSubscription.length} usuários com subscriptionId null`);

    for (const user of usersWithNullSubscription) {
      console.log(`Processando usuário: ${user.email}`);
      
      // Remover subscriptionId null
      await User.findByIdAndUpdate(user._id, {
        $unset: { 'subscription.stripeSubscriptionId': 1 }
      });
      
      console.log(`✅ Removido subscriptionId null para ${user.email}`);
    }

    // 2. Corrigir usuários com customerId inválido
    console.log('\n🔧 Corrigindo usuários com customerId inválido...');
    const usersWithInvalidCustomer = await User.find({
      'subscription.stripeCustomerId': { $regex: /^trial_/ }
    });

    console.log(`Encontrados ${usersWithInvalidCustomer.length} usuários com customerId inválido`);

    for (const user of usersWithInvalidCustomer) {
      console.log(`Processando usuário: ${user.email}`);
      
      // Remover customerId inválido
      await User.findByIdAndUpdate(user._id, {
        $unset: { 'subscription.stripeCustomerId': 1 }
      });
      
      console.log(`✅ Removido customerId inválido para ${user.email}`);
    }

    // 3. Verificar assinaturas duplicadas
    console.log('\n🔧 Verificando assinaturas duplicadas...');
    const duplicateSubscriptions = await User.aggregate([
      {
        $group: {
          _id: '$subscription.stripeSubscriptionId',
          count: { $sum: 1 },
          users: { $push: { _id: '$_id', email: '$email' } }
        }
      },
      {
        $match: {
          count: { $gt: 1 },
          _id: { $ne: null }
        }
      }
    ]);

    console.log(`Encontradas ${duplicateSubscriptions.length} assinaturas duplicadas`);

    for (const duplicate of duplicateSubscriptions) {
      console.log(`Assinatura ${duplicate._id} tem ${duplicate.count} usuários`);
      
      // Manter apenas o primeiro usuário, remover dos outros
      const usersToFix = duplicate.users.slice(1);
      
      for (const user of usersToFix) {
        await User.findByIdAndUpdate(user._id, {
          $unset: { 
            'subscription.stripeSubscriptionId': 1,
            'subscription.stripeCustomerId': 1,
            'subscription.status': 1,
            'subscription.plan': 1,
            'subscription.currentPeriodEnd': 1,
            'subscription.expiresAt': 1,
            'subscription.cancelAtPeriodEnd': 1
          }
        });
        
        console.log(`✅ Removida assinatura duplicada de ${user.email}`);
      }
    }

    // 4. Verificar assinaturas no Stripe que não existem no banco
    console.log('\n🔧 Verificando assinaturas no Stripe...');
    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'active'
    });

    for (const stripeSub of stripeSubscriptions.data) {
      const user = await User.findOne({
        'subscription.stripeSubscriptionId': stripeSub.id
      });

      if (!user) {
        console.log(`⚠️ Assinatura ${stripeSub.id} no Stripe não encontrada no banco`);
        
        // Tentar encontrar pelo customer ID
        const userByCustomer = await User.findOne({
          'subscription.stripeCustomerId': stripeSub.customer
        });

        if (userByCustomer) {
          console.log(`✅ Encontrado usuário pelo customer ID: ${userByCustomer.email}`);
          
          // Atualizar com os dados corretos
          await User.findByIdAndUpdate(userByCustomer._id, {
            'subscription.stripeSubscriptionId': stripeSub.id,
            'subscription.status': stripeSub.status,
            'subscription.currentPeriodEnd': new Date(stripeSub.current_period_end * 1000),
            'subscription.expiresAt': new Date(stripeSub.current_period_end * 1000),
            'subscription.cancelAtPeriodEnd': stripeSub.cancel_at_period_end || false
          });
          
          console.log(`✅ Assinatura sincronizada para ${userByCustomer.email}`);
        }
      }
    }

    console.log('\n✅ Correções concluídas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante as correções:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar o script
fixSubscriptionIssues(); 