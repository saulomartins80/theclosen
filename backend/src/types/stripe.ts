import type { Stripe } from 'stripe';

export interface StripeSubscriptionWithPeriod extends Omit<Stripe.Subscription, 'current_period_end'> {
    current_period_end: number;
}

export function convertToStripeSubscriptionWithPeriod(subscription: Stripe.Subscription): StripeSubscriptionWithPeriod {
    // Garantir que current_period_end é um número válido
    let current_period_end: number;
    
    if (typeof (subscription as any).current_period_end === 'number' && !isNaN((subscription as any).current_period_end)) {
        current_period_end = (subscription as any).current_period_end;
    } else {
        // Se não houver data válida, usar 30 dias a partir de agora
        current_period_end = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    }

    const subscriptionWithPeriod = {
        ...subscription,
        current_period_end
    };
    return subscriptionWithPeriod as StripeSubscriptionWithPeriod;
} 