import { Router, Request, Response } from 'express';
import { SubscriptionController } from '../modules/subscriptions/controllers/SubscriptionController';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/authMiddleware';
import { stripeWebhookMiddleware, stripeWebhookMiddlewareHandler } from '../middlewares/stripeWebhookMiddleware';
import { AuthRequest } from '../types/auth';
import Stripe from 'stripe';
import { User } from '../models/User';

const router = Router();
const subscriptionController = new SubscriptionController();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
});

// Rotas públicas
router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
  await subscriptionController.getSubscriptionPlans(req as any, res);
}));

// Webhook do Stripe (deve ser público e usar middleware específico)
router.post('/webhook', 
  stripeWebhookMiddleware,
  stripeWebhookMiddlewareHandler,
  asyncHandler(async (req: Request, res: Response) => {
    const event = req.body as Stripe.Event;
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
        const subscriptionData = stripeSubscription as any;
        
        console.log('Dados completos da assinatura Stripe:', {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          current_period_start: subscriptionData.current_period_start,
          current_period_end: subscriptionData.current_period_end,
          cancel_at_period_end: subscriptionData.cancel_at_period_end,
          items: stripeSubscription.items.data.map(item => ({
            price: item.price.nickname,
            interval: item.price.recurring?.interval,
            interval_count: item.price.recurring?.interval_count
          }))
        });
        
        // Verificar se current_period_end é válido
        let currentPeriodEnd: Date;
        if (subscriptionData.current_period_end && !isNaN(subscriptionData.current_period_end)) {
          currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);
          console.log('Data de vencimento calculada do Stripe:', currentPeriodEnd.toISOString());
        } else {
          // Se não houver data válida, usar 30 dias a partir de agora
          currentPeriodEnd = new Date();
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
          console.log('Data de vencimento fallback (30 dias):', currentPeriodEnd.toISOString());
        }
        
        console.log('Dados da assinatura Stripe:', {
          status: stripeSubscription.status,
          plan: stripeSubscription.items.data[0].price.nickname,
          currentPeriodEnd: currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionData.cancel_at_period_end
        });

        // Usar o nome do plano dos metadados da sessão
        const planName = session.metadata.planName || 'essencial';

        console.log('📋 Salvando plano:', planName);

        await User.findByIdAndUpdate(user._id, {
          'subscription.status': stripeSubscription.status,
          'subscription.stripeSubscriptionId': session.subscription,
          'subscription.stripeCustomerId': session.customer,
          'subscription.plan': planName,
          'subscription.currentPeriodEnd': currentPeriodEnd,
          'subscription.expiresAt': currentPeriodEnd,
          'subscription.cancelAtPeriodEnd': subscriptionData.cancel_at_period_end || false
        });

        console.log('✅ Assinatura atualizada com sucesso para o usuário:', user.firebaseUid);
        console.log('📋 Plano salvo:', planName);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Assinatura atualizada:', subscription.id);
        
        // Buscar usuário pela assinatura
        const user = await User.findOne({ 'subscription.stripeSubscriptionId': subscription.id });
        
        if (user) {
          const subscriptionData = subscription as any;
          let currentPeriodEnd: Date;
          
          if (subscriptionData.current_period_end && !isNaN(subscriptionData.current_period_end)) {
            currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);
          } else {
            currentPeriodEnd = new Date();
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
          }

          // Manter o plano atual se já existir, não sobrescrever
          const updateData: any = {
            'subscription.status': subscription.status,
            'subscription.currentPeriodEnd': currentPeriodEnd,
            'subscription.expiresAt': currentPeriodEnd,
            'subscription.cancelAtPeriodEnd': subscriptionData.cancel_at_period_end || false,
            'subscription.updatedAt': new Date()
          };

          // Só atualizar o plano se não existir ou se for diferente
          if (!user.subscription?.plan || user.subscription.plan === 'essencial') {
            const stripePlanName = subscription.items.data[0]?.price?.nickname;
            if (stripePlanName) {
              updateData['subscription.plan'] = stripePlanName;
              console.log(`🔄 Atualizando plano para: ${stripePlanName}`);
            }
          }

          await User.findByIdAndUpdate(user._id, updateData);

          console.log('✅ Assinatura atualizada no banco para usuário:', user.firebaseUid);
        }
        break;
      }

      case 'billing_portal.session.created': {
        const session = event.data.object as Stripe.BillingPortal.Session;
        console.log('Sessão do portal de cobrança criada:', session.id);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Nova assinatura criada:', subscription.id);
        break;
      }

      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log('Método de pagamento anexado:', paymentMethod.id);
        break;
      }

      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Fatura finalizada:', invoice.id);
        break;
      }

      case 'invoice.created': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Fatura criada:', invoice.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Pagamento da fatura realizado com sucesso:', invoice.id);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Fatura paga:', invoice.id);
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
  }));

// Rota para verificação de sessão (pública)
router.post('/verify-session', asyncHandler(async (req: Request, res: Response) => {
  await subscriptionController.verifySession(req as AuthRequest, res);
}));

// Rotas protegidas
router.use(authenticate);

// Criação de sessão de checkout
router.post('/create-checkout-session', asyncHandler(async (req: Request, res: Response) => {
  await subscriptionController.createCheckoutSession(req as AuthRequest, res);
}));

// Criação de sessão do portal de gerenciamento
router.post('/create-portal-session', asyncHandler(async (req: Request, res: Response) => {
  await subscriptionController.createPortalSession(req as AuthRequest, res);
}));

// Status da assinatura do usuário
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  await subscriptionController.getSubscriptionStatus(req as AuthRequest, res);
}));

// Cancelar assinatura
// router.post('/cancel', asyncHandler(async (req: Request, res: Response) => {
//   await subscriptionController.cancelSubscription(req as AuthRequest, res);
// }));

// Atualizar assinatura
// router.put('/update', asyncHandler(async (req: Request, res: Response) => {
//   await subscriptionController.updateSubscription(req as AuthRequest, res);
// }));

export default router;