import mongoose from 'mongoose';
import Stripe from 'stripe';
import { config } from '../src/config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

// Conectar ao MongoDB
mongoose.connect(config.mongo.uri);

// Schema do usuário (simplificado)
const userSchema = new mongoose.Schema({
  firebaseUid: String,
  email: String,
  subscription: {
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    status: String,
    plan: String,
    cancelAtPeriodEnd: Boolean,
    expiresAt: Date,
    currentPeriodEnd: Date,
    subscriptionId: String
  }
});

const User = mongoose.model('User', userSchema);

async function fixDuplicateSubscriptions() {
  try {
    console.log('Iniciando correção de assinaturas duplicadas...');

    // Buscar usuários com múltiplas assinaturas
    const users = await User.find({
      'subscription.stripeCustomerId': { $exists: true, $ne: null }
    });

    for (const user of users) {
      console.log(`\nProcessando usuário: ${user.email}`);
      console.log(`Firebase UID: ${user.firebaseUid}`);
      console.log(`Customer ID: ${user.subscription.stripeCustomerId}`);

      try {
        // Buscar todas as assinaturas do customer no Stripe
        const subscriptions = await stripe.subscriptions.list({
          customer: user.subscription.stripeCustomerId,
          status: 'active'
        });

        console.log(`Encontradas ${subscriptions.data.length} assinaturas ativas`);

        if (subscriptions.data.length > 1) {
          // Ordenar por data de criação (mais recente primeiro)
          const sortedSubscriptions = subscriptions.data.sort((a, b) => 
            b.created - a.created
          );

          const latestSubscription = sortedSubscriptions[0];
          const subscriptionsToCancel = sortedSubscriptions.slice(1);

          console.log(`Mantendo assinatura: ${latestSubscription.id}`);
          console.log(`Cancelando ${subscriptionsToCancel.length} assinaturas antigas`);

          // Cancelar assinaturas antigas
          for (const sub of subscriptionsToCancel) {
            try {
              await stripe.subscriptions.cancel(sub.id);
              console.log(`✓ Cancelada: ${sub.id}`);
            } catch (error) {
              console.log(`✗ Erro ao cancelar ${sub.id}:`, error);
            }
          }

          // Atualizar usuário com a assinatura mais recente
          const planName = latestSubscription.items.data[0]?.price.nickname || 
                          latestSubscription.items.data[0]?.price.id || 'Plano Ativo';

          await User.findOneAndUpdate(
            { firebaseUid: user.firebaseUid },
            {
              $set: {
                'subscription.stripeSubscriptionId': latestSubscription.id,
                'subscription.status': latestSubscription.status,
                'subscription.plan': planName,
                'subscription.cancelAtPeriodEnd': latestSubscription.cancel_at_period_end,
                'subscription.expiresAt': new Date(latestSubscription.current_period_end * 1000),
                'subscription.currentPeriodEnd': new Date(latestSubscription.current_period_end * 1000),
                'subscription.subscriptionId': latestSubscription.id,
                updatedAt: new Date()
              }
            }
          );

          console.log(`✓ Usuário atualizado com assinatura: ${latestSubscription.id}`);
        } else if (subscriptions.data.length === 1) {
          console.log('✓ Apenas uma assinatura ativa encontrada');
        } else {
          console.log('⚠ Nenhuma assinatura ativa encontrada');
        }

      } catch (error) {
        console.error(`Erro ao processar usuário ${user.email}:`, error);
      }
    }

    console.log('\n✅ Correção de assinaturas duplicadas concluída!');
  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Executar o script
fixDuplicateSubscriptions(); 