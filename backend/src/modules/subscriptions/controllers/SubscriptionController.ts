import { Request, Response } from 'express';
import { injectable } from 'inversify';
import { AuthRequest } from '../../../core/types/AuthRequest';
import { stripe } from '../../../config/stripe';
import Stripe from 'stripe';
import { User } from '../../../models/User';

interface StripeSubscription extends Stripe.Subscription {
  current_period_end: number;
  cancel_at_period_end: boolean;
}

@injectable()
export class SubscriptionController {
  async createCheckoutSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
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
          planName: req.body.planName || 'premium'
        },
      };

      console.log('[createCheckoutSession] Parâmetros da sessão (ANTES de enviar para Stripe):', JSON.stringify(sessionParams, null, 2));
      console.log('[createCheckoutSession] Verificando se há customer_email nos parâmetros:', sessionParams.hasOwnProperty('customer_email'));
      
      // Verificar todos os campos do objeto sessionParams
      console.log('[createCheckoutSession] Campos do sessionParams:');
      Object.keys(sessionParams).forEach(key => {
        console.log(`  - ${key}:`, sessionParams[key]);
      });

      const session = await stripe.checkout.sessions.create(sessionParams);
      console.log('[createCheckoutSession] Sessão criada:', {
        id: session.id,
        metadata: session.metadata,
        customer: session.customer
      });

      res.json({ sessionId: session.id });
    } catch (error) {
      console.error('[createCheckoutSession] Erro ao criar sessão:', error);
      console.error('[createCheckoutSession] Detalhes do erro:', {
        message: (error as any).message,
        type: (error as any).type,
        param: (error as any).param,
        code: (error as any).code
      });
      res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
    }
  }

  async createPortalSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
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
  }

  async getSubscriptionStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
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
  }

  async getSubscriptionPlans(req: AuthRequest, res: Response): Promise<void> {
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
  }

  async handleWebhook(req: AuthRequest, res: Response): Promise<void> {
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

          if (!session.metadata?.userId) {
            console.log('User ID não encontrado na sessão:', {
              metadata: session.metadata,
              customerId: session.customer
            });
            
            if (session.customer) {
              const user = await User.findOne({ 'subscription.stripeCustomerId': session.customer });
              if (user) {
                console.log('Usuário encontrado pelo customer ID:', user.firebaseUid);
                
                // Verificar se session.subscription existe antes de tentar recuperar
                if (!session.subscription) {
                  console.log('Subscription ID não encontrado na sessão:', session);
                  res.status(400).json({ error: 'Subscription ID não encontrado na sessão' });
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
                  // Se não houver data válida, calcular baseado no tipo de plano
                  const planName = session.metadata?.planName || 'essencial';
                  currentPeriodEnd = new Date();
                  
                  if (planName.toLowerCase().includes('anual')) {
                    // Para planos anuais, adicionar 1 ano
                    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
                  } else {
                    // Para planos mensais, adicionar 30 dias
                    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
                  }
                }
                
                await User.findByIdAndUpdate(user._id, {
                  'subscription.status': stripeSubscription.status,
                  'subscription.stripeSubscriptionId': session.subscription,
                  'subscription.stripeCustomerId': session.customer,
                  'subscription.plan': session.metadata?.planName || 'essencial',
                  'subscription.currentPeriodEnd': currentPeriodEnd,
                  'subscription.expiresAt': currentPeriodEnd,
                  'subscription.cancelAtPeriodEnd': subscriptionData.cancel_at_period_end || false
                });
                break;
              }
            }
            
            res.status(400).json({ error: 'Dados da sessão incompletos' });
            return;
          }

          console.log('Buscando usuário com firebaseUid:', session.metadata?.firebaseUid);
          const user = await User.findOne({ firebaseUid: session.metadata?.firebaseUid });
          console.log('Resultado da busca:', user ? 'Usuário encontrado' : 'Usuário não encontrado');
          
          if (!user) {
            console.error('Usuário não encontrado para o firebaseUid:', session.metadata?.firebaseUid);
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
            // Se não houver data válida, calcular baseado no tipo de plano
            const planName = session.metadata?.planName || 'essencial';
            currentPeriodEnd = new Date();
            
            if (planName.toLowerCase().includes('anual')) {
              // Para planos anuais, adicionar 1 ano
              currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
            } else {
              // Para planos mensais, adicionar 30 dias
              currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
            }
          }
          
          console.log('Dados da assinatura Stripe:', {
            status: stripeSubscription.status,
            plan: stripeSubscription.items.data[0].price.nickname,
            currentPeriodEnd: currentPeriodEnd,
            cancelAtPeriodEnd: subscriptionData.cancel_at_period_end
          });

          await User.findByIdAndUpdate(user._id, {
            'subscription.status': stripeSubscription.status,
            'subscription.stripeSubscriptionId': session.subscription,
            'subscription.stripeCustomerId': session.customer,
            'subscription.plan': session.metadata?.planName || 'essencial',
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
  }

  async verifySession(req: AuthRequest, res: Response): Promise<void> {
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
  }

  async cancelSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user?._id) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const subscriptionId = user.subscription?.stripeSubscriptionId;
      if (!subscriptionId) {
        res.status(400).json({ error: 'ID da assinatura não encontrado' });
        return;
      }

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      res.status(200).json({ 
        success: true, 
        message: 'Assinatura cancelada com sucesso',
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      res.status(500).json({ error: 'Erro ao cancelar assinatura' });
    }
  }

  async updateSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user?._id) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const { priceId } = req.body;
      if (!priceId) {
        res.status(400).json({ error: 'Price ID é obrigatório' });
        return;
      }

      const subscriptionId = user.subscription?.stripeSubscriptionId;
      if (!subscriptionId) {
        res.status(400).json({ error: 'ID da assinatura não encontrado' });
        return;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const itemId = subscription.items.data[0].id;

      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: itemId,
          price: priceId,
        }],
      });

      res.status(200).json({ 
        success: true, 
        message: 'Assinatura atualizada com sucesso',
        subscription: updatedSubscription
      });
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      res.status(500).json({ error: 'Erro ao atualizar assinatura' });
    }
  }
} 