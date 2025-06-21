import { stripe } from '../config/stripe';
import { injectable } from 'inversify';
import type { Stripe } from 'stripe';

interface CreateCheckoutSessionParams {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
  paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[];
}

@injectable()
export class StripeService {
  async createCustomer(data: { email: string; name: string; metadata: Record<string, string> }) {
    return await stripe.customers.create(data);
  }

  async createCheckoutSession({
    priceId,
    userId,
    userEmail,
    successUrl,
    cancelUrl,
    paymentMethodTypes,
  }: CreateCheckoutSessionParams) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethodTypes,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: userEmail,
        metadata: {
          userId,
        },
      });

      return session;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      throw error;
    }
  }

  async createBillingPortalSession(customerId: string, returnUrl: string) {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getSubscription(subscriptionId: string) {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  async constructEvent(payload: any, signature: string, secret: string) {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    // Implementar lógica de atualização do usuário após pagamento bem-sucedido
    console.log('Checkout session completed:', session);
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Implementar lógica de atualização da assinatura
    console.log('Subscription updated:', subscription);
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    // Implementar lógica de cancelamento da assinatura
    console.log('Subscription deleted:', subscription);
  }
} 