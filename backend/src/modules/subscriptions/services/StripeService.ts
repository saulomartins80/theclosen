import { stripe } from '../../../config/stripe';
import { injectable } from 'inversify';
import type { Stripe } from 'stripe';

@injectable()
export class StripeService {
  async createCustomer(data: { email: string; name: string; metadata: Record<string, string> }) {
    return await stripe.customers.create(data);
  }

  async createCheckoutSession(data: {
    customer: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialPeriodDays?: number;
    paymentMethodTypes?: Stripe.Checkout.SessionCreateParams.PaymentMethodType[];
    mode?: 'subscription' | 'payment';
  }) {
    return await stripe.checkout.sessions.create({
      customer: data.customer,
      payment_method_types: data.paymentMethodTypes,
      line_items: [{
        price: data.priceId,
        quantity: 1,
      }],
      mode: data.mode || 'subscription',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      subscription_data: {
        trial_period_days: data.trialPeriodDays,
      },
    });
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
} 