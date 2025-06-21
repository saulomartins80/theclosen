import { connect, disconnect } from 'mongoose';
import { User } from '../src/models/User';
import { stripe } from '../src/config/stripe';
import dotenv from 'dotenv';

dotenv.config();

async function testSubscription() {
  try {
    console.log('🧪 Iniciando teste de assinatura...');
    
    // Conectar ao MongoDB
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI não configurada');
    }
    
    await connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    // Criar um usuário de teste
    const testUser = {
      firebaseUid: 'test_user_' + Date.now(),
      email: 'teste@finnextho.com',
      name: 'Usuário Teste',
      subscription: {
        status: 'inactive',
        plan: 'essencial'
      }
    };

    console.log('📝 Criando usuário de teste...');
    const user = await User.create(testUser);
    console.log(`✅ Usuário criado: ${user.email} (${user.firebaseUid})`);

    // Criar customer no Stripe
    console.log('💳 Criando customer no Stripe...');
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user._id.toString(),
        firebaseUid: user.firebaseUid
      }
    });

    console.log(`✅ Customer criado: ${customer.id}`);

    // Atualizar usuário com customer ID
    await User.findByIdAndUpdate(user._id, {
      'subscription.stripeCustomerId': customer.id
    });

    // Criar sessão de checkout para plano anual
    console.log('🛒 Criando sessão de checkout...');
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1RZ1QrQgQT6xG1UiiWivLEva', // Top-anual
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/assinaturas?canceled=true`,
      metadata: {
        userId: user._id.toString(),
        firebaseUid: user.firebaseUid,
        planName: 'Top-anual'
      },
    });

    console.log('✅ Sessão de checkout criada!');
    console.log('🔗 URL da sessão:', session.url);
    console.log('📋 ID da sessão:', session.id);
    console.log('📋 Metadados:', session.metadata);

    // Simular webhook (para teste)
    console.log('\n🔄 Simulando webhook...');
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: 'price_1RZ1QrQgQT6xG1UiiWivLEva' }],
      metadata: {
        userId: user._id.toString(),
        firebaseUid: user.firebaseUid,
        planName: 'Top-anual'
      }
    });

    console.log(`✅ Assinatura criada: ${subscription.id}`);

    // Atualizar usuário com dados da assinatura
    const subscriptionData = subscription as any;
    const currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);

    await User.findByIdAndUpdate(user._id, {
      'subscription.status': subscription.status,
      'subscription.stripeSubscriptionId': subscription.id,
      'subscription.stripeCustomerId': customer.id,
      'subscription.plan': 'Top-anual',
      'subscription.currentPeriodEnd': currentPeriodEnd,
      'subscription.expiresAt': currentPeriodEnd,
      'subscription.cancelAtPeriodEnd': subscriptionData.cancel_at_period_end || false
    });

    console.log('✅ Usuário atualizado com dados da assinatura');

    // Verificar resultado
    const updatedUser = await User.findById(user._id);
    console.log('\n📊 Resultado final:');
    console.log(`  - Email: ${updatedUser?.email}`);
    console.log(`  - Plano: ${updatedUser?.subscription?.plan}`);
    console.log(`  - Status: ${updatedUser?.subscription?.status}`);
    console.log(`  - Vencimento: ${updatedUser?.subscription?.currentPeriodEnd}`);

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar o teste
testSubscription().catch(console.error); 