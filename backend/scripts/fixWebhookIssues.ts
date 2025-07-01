import { stripe } from '../src/config/stripe';
import { User } from '../src/models/User';
import mongoose from 'mongoose';
import Stripe from 'stripe';

/**
 * Script para corrigir problemas de webhook e assinatura
 */
async function fixWebhookIssues() {
  try {
    console.log('🔧 Iniciando correção de problemas de webhook...');
    
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ Conectado ao MongoDB');
    
    // 1. Verificar usuários com subscription IDs inválidos
    console.log('\n📋 Verificando usuários com subscription IDs inválidos...');
    const usersWithInvalidSubscriptions = await User.find({
      $or: [
        { 'subscription.stripeSubscriptionId': null },
        { 'subscription.stripeSubscriptionId': { $exists: false } },
        { 'subscription.stripeSubscriptionId': '' }
      ]
    });
    
    console.log(`Encontrados ${usersWithInvalidSubscriptions.length} usuários com subscription IDs inválidos`);
    
    // 2. Limpar subscription IDs inválidos
    for (const user of usersWithInvalidSubscriptions) {
      console.log(`🧹 Limpando subscription ID inválido para usuário: ${user.email}`);
      
      await User.findByIdAndUpdate(user._id, {
        $unset: { 'subscription.stripeSubscriptionId': 1 },
        $set: { 
          'subscription.status': 'inactive',
          'subscription.plan': 'free'
        }
      });
    }
    
    // 3. Verificar assinaturas no Stripe
    console.log('\n🔍 Verificando assinaturas no Stripe...');
    const subscriptions = await stripe.subscriptions.list({ limit: 100 });
    
    console.log(`Encontradas ${subscriptions.data.length} assinaturas no Stripe`);
    
    // 4. Sincronizar dados de assinatura
    for (const subscription of subscriptions.data) {
      try {
        const customerResponse = await stripe.customers.retrieve(subscription.customer as string);
        
        // Verificar se o customer não foi deletado
        if (customerResponse.deleted) {
          console.log(`⚠️ Customer ${customerResponse.id} foi deletado, pulando...`);
          continue;
        }
        
        // Type assertion para Customer válido
        const customer = customerResponse as Stripe.Customer;
        const firebaseUid = customer.metadata?.firebaseUid;
        
        if (firebaseUid) {
          const user = await User.findOne({ firebaseUid });
          
          if (user) {
            console.log(`🔄 Sincronizando assinatura para usuário: ${user.email}`);
            
            const subscriptionData = subscription as any;
            const currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);
            
            await User.findByIdAndUpdate(user._id, {
              'subscription.status': subscription.status,
              'subscription.stripeSubscriptionId': subscription.id,
              'subscription.stripeCustomerId': subscription.customer,
              'subscription.plan': subscription.items.data[0].price.nickname || 'premium',
              'subscription.currentPeriodEnd': currentPeriodEnd,
              'subscription.expiresAt': currentPeriodEnd,
              'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end || false
            });
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar assinatura ${subscription.id}:`, error);
      }
    }
    
    // 5. Verificar configuração do portal do cliente
    console.log('\n🏪 Verificando configuração do portal do cliente...');
    try {
      const portalConfigurations = await stripe.billingPortal.configurations.list();
      console.log(`Encontradas ${portalConfigurations.data.length} configurações de portal`);
      
      if (portalConfigurations.data.length === 0) {
        console.log('⚠️ Nenhuma configuração de portal encontrada. Configure no dashboard do Stripe.');
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar configurações do portal:', error);
    }
    
    console.log('\n✅ Correção de problemas de webhook concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
    process.exit(0);
  }
}

// Executar o script
fixWebhookIssues(); 