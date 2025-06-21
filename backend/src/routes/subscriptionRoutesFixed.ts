import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/authMiddleware';
import { AuthRequest } from '../types/auth';
import { stripe } from '../config/stripe';
import { User } from '../models/User';
import Stripe from 'stripe';

interface StripeSubscription extends Stripe.Subscription {
  current_period_end: number;
  cancel_at_period_end: boolean;
}

const router = Router();

// Rotas públicas
router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
  try {
    const plans = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });
    res.status(200).json(plans.data);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ error: 'Erro ao buscar planos de assinatura' });
  }
}));

// Webhook do Stripe (deve ser público e usar middleware específico)
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    console.log('Evento recebido:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Dados da sessão:', {
          metadata: session.metadata,
          customer: session.customer,
          subscription: session.subscription
        });

        if (!session.metadata?.firebaseUid) {
          console.log('Firebase UID não encontrado na sessão');
          res.status(400).json({ error: 'Metadados da sessão incompletos' });
          return;
        }

        const firebaseUid = session.metadata.firebaseUid;
        console.log('Processando webhook para firebaseUid:', firebaseUid);
        
        // Buscar usuário pelo firebaseUid
        const user = await User.findOne({ firebaseUid });
        
        if (!user) {
          console.error('Usuário não encontrado para o firebaseUid:', firebaseUid);
          res.status(404).json({ error: 'Usuário não encontrado' });
          return;
        }

        // Buscar dados reais da assinatura do Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const subscriptionData = stripeSubscription as unknown as StripeSubscription;
        
        // Verificar se current_period_end é válido
        let currentPeriodEnd: Date;
        if (subscriptionData.current_period_end && !isNaN(subscriptionData.current_period_end)) {
          currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);
        } else {
          // Se não houver data válida, usar 30 dias a partir de agora
          currentPeriodEnd = new Date();
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
        }
        
        console.log('Dados da assinatura Stripe:', {
          status: stripeSubscription.status,
          plan: stripeSubscription.items.data[0].price.nickname,
          currentPeriodEnd: currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionData.cancel_at_period_end
        });

        // Usar o nome do plano dos metadados da sessão
        const planName = session.metadata.planName || 'essencial';

        await User.findByIdAndUpdate(user._id, {
          'subscription.status': stripeSubscription.status,
          'subscription.stripeSubscriptionId': session.subscription,
          'subscription.stripeCustomerId': session.customer,
          'subscription.plan': planName,
          'subscription.currentPeriodEnd': currentPeriodEnd,
          'subscription.expiresAt': currentPeriodEnd,
          'subscription.cancelAtPeriodEnd': subscriptionData.cancel_at_period_end || false
        });

        console.log('Assinatura atualizada com sucesso para o usuário:', user.firebaseUid);
        break;
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Cobrança processada com sucesso:', charge.id);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Pagamento processado com sucesso:', paymentIntent.id);
        break;
      }

      case 'payment_intent.created': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Novo pagamento criado:', paymentIntent.id);
        break;
      }

      default:
        console.log('Evento não tratado:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(400).json({ error: 'Erro no webhook' });
  }
}));

// Rota para verificação de sessão (pública)
router.post('/verify-session', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID é obrigatório' });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      res.status(200).json({ 
        success: true, 
        session: {
          id: session.id,
          payment_status: session.payment_status,
          customer_email: session.customer_details?.email,
          amount_total: session.amount_total,
          currency: session.currency
        }
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Pagamento não foi concluído' 
      });
    }
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao verificar sessão de pagamento' 
    });
  }
}));

// Rotas protegidas
router.use(authenticate);

// Criação de sessão de checkout
router.post('/create-checkout-session', asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user?._id) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (!user.firebaseUid) {
      res.status(400).json({ error: 'Firebase UID não encontrado' });
      return;
    }

    console.log('[createCheckoutSession] Iniciando para usuário:', user.email);
    console.log('[createCheckoutSession] Customer ID atual:', user.subscription?.stripeCustomerId);
    console.log('[createCheckoutSession] Body da requisição:', JSON.stringify(req.body, null, 2));

    let customerId = user.subscription?.stripeCustomerId;
    
    // Se não tem customerId ou é um ID inválido (começa com 'trial_'), criar um novo
    if (!customerId || customerId.startsWith('trial_')) {
      console.log('[createCheckoutSession] Criando novo customer Stripe para checkout:', user.email);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString(),
          firebaseUid: user.firebaseUid
        }
      });
      customerId = customer.id;
      
      // Atualizar o usuário com o novo customerId
      await User.findByIdAndUpdate(user._id, { 
        'subscription.stripeCustomerId': customerId 
      });
      console.log('[createCheckoutSession] Novo customer Stripe criado para checkout:', customerId);
    }

    console.log('[createCheckoutSession] Usando customer ID:', customerId);
    console.log('[createCheckoutSession] Price ID:', req.body.priceId);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: req.body.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/assinaturas?canceled=true`,
      metadata: {
        userId: user._id.toString(),
        firebaseUid: user.firebaseUid,
        planName: req.body.planName || 'essencial'
      },
    };

    console.log('[createCheckoutSession] Parâmetros da sessão (ANTES de enviar para Stripe):', JSON.stringify(sessionParams, null, 2));

    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log('[createCheckoutSession] Sessão criada:', {
      id: session.id,
      metadata: session.metadata,
      customer: session.customer
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('[createCheckoutSession] Erro ao criar sessão:', error);
    res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
  }
}));

// Criação de sessão do portal de gerenciamento
router.post('/create-portal-session', asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user?._id) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    let customerId = user.subscription?.stripeCustomerId;
    
    // Se não tem customerId ou é um ID inválido (começa com 'trial_'), criar um novo
    if (!customerId || customerId.startsWith('trial_')) {
      console.log('Criando novo customer Stripe para portal:', user.email);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString(),
          firebaseUid: user.firebaseUid
        }
      });
      customerId = customer.id;
      
      // Atualizar o usuário com o novo customerId
      await User.findByIdAndUpdate(user._id, { 
        'subscription.stripeCustomerId': customerId 
      });
      console.log('Novo customer Stripe criado para portal:', customerId);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/profile`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Erro ao criar sessão do portal:', error);
    res.status(500).json({ error: 'Erro ao acessar portal de assinatura' });
  }
}));

// Status da assinatura do usuário
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user?._id) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const subscriptionId = user.subscription?.stripeSubscriptionId;
    if (!subscriptionId) {
      res.status(400).json({ error: 'ID da assinatura não encontrado' });
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionData = subscription as unknown as StripeSubscription;

    res.status(200).json({
      status: subscription.status,
      plan: subscription.items.data[0].price.nickname,
      currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Erro ao buscar status da assinatura:', error);
    res.status(500).json({ error: 'Erro ao buscar status da assinatura' });
  }
}));

export default router; 