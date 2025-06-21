import mongoose from 'mongoose';
import Stripe from 'stripe';
import { config } from '../src/config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

// Conectar ao MongoDB
mongoose.connect(config.mongo.uri);

// Schema do usuário
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

async function testTopAnnualPlan() {
  try {
    console.log('Iniciando teste do Plano Top Anual...');

    // Buscar o usuário específico
    const user = await User.findOne({ 
      firebaseUid: 'dD6DFnMThTVQrF1YMBvpnMrRX882' 
    });

    if (!user) {
      console.log('Usuário não encontrado');
      return;
    }

    console.log(`Usuário encontrado: ${user.email}`);
    console.log(`Customer ID atual: ${user.subscription.stripeCustomerId}`);

    // ID do preço do Plano Top Anual (você precisa substituir pelo ID correto)
    const priceId = 'price_1RZ1QKQgQT6xG1UiXXXXXXXX'; // Substitua pelo ID correto

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: user.subscription.stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'http://localhost:3000/payment/sucesso?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/assinaturas?canceled=true',
      metadata: {
        userId: user._id.toString(),
        firebaseUid: user.firebaseUid,
        planName: 'Plano Top Anual'
      }
    });

    console.log('Sessão de checkout criada:', {
      id: session.id,
      url: session.url,
      metadata: session.metadata
    });

    console.log('\nPara testar:');
    console.log('1. Acesse a URL:', session.url);
    console.log('2. Use o cartão de teste: 4242 4242 4242 4242');
    console.log('3. Qualquer data futura para expiração');
    console.log('4. Qualquer CVC');

  } catch (error) {
    console.error('Erro ao criar sessão de teste:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Executar o script
testTopAnnualPlan(); 