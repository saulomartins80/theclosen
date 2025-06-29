import { stripe, STRIPE_CONFIG } from '../config/stripe';
import { adminFirestore } from '@config/firebaseAdmin';
import { AppError } from '../core/errors/AppError';
import { logSubscriptionEvent, logError } from './loggerService';
import type { Stripe } from 'stripe';
import { UserService } from '../modules/users/services/UserService';
import { injectable, inject } from 'tsyringe';
import { TYPES } from '../types';
import { Subscription, SubscriptionStatus } from '../modules/users/types/User';
import { UserRepository } from '../modules/users/repositories/UserRepository';
import { StripeSubscriptionWithPeriod, convertToStripeSubscriptionWithPeriod } from '../types/stripe';
import { rateLimit } from 'express-rate-limit';

const db = adminFirestore;

// Rate limiting para webhooks
const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requisições por minuto
  message: 'Too many webhook requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

@injectable()
export class WebhookService {
    constructor(
        @inject(TYPES.UserRepository) private userRepository: UserRepository
    ) {}

    async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
        try {
            console.log('Dados da sessão:', {
                metadata: session.metadata,
                customer: session.customer,
                subscription: session.subscription
            });

            // Verificar se os metadados existem
            if (!session.metadata) {
                throw new AppError(400, 'Metadados da sessão não encontrados');
            }

            const firebaseUid = session.metadata.firebaseUid as string;
            const userId = session.metadata.userId as string;
            const planName = session.metadata.planName as string;
            
            if (!firebaseUid || !userId || !planName) {
                throw new AppError(400, 'Metadados da sessão incompletos');
            }
            
            // Buscar usuário
            const user = await this.userRepository.findById(userId);
            if (!user) {
                console.log('Usuário não encontrado');
                return;
            }

            // Cancelar assinaturas anteriores se existirem
            if (user.subscription && user.subscription.stripeSubscriptionId && 
                user.subscription.stripeSubscriptionId !== session.subscription) {
                try {
                    await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
                    console.log(`Assinatura anterior cancelada: ${user.subscription.stripeSubscriptionId}`);
                } catch (error) {
                    console.log('Erro ao cancelar assinatura anterior:', error);
                }
            }

            // Verificar se session.subscription existe
            if (!session.subscription) {
                throw new AppError(400, 'ID da assinatura não encontrado na sessão');
            }

            // Buscar dados da nova assinatura
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            
            console.log('Dados da assinatura Stripe:', {
                status: subscription.status,
                plan: subscription.items.data[0]?.price.nickname || null,
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end
            });

            // Calcular data de vencimento correta baseada no plano
            let expiresAt: Date;
            let currentPeriodEnd: Date;
            
            if (planName.toLowerCase().includes('anual')) {
                // Para planos anuais, adicionar 1 ano à data atual
                const now = new Date();
                expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                currentPeriodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            } else {
                // Para planos mensais, usar a data do Stripe
                expiresAt = new Date((subscription as any).current_period_end * 1000);
                currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
            }

            // Atualizar usuário com nova assinatura
            const updateData = {
                'subscription.stripeCustomerId': session.customer,
                'subscription.stripeSubscriptionId': session.subscription,
                'subscription.status': subscription.status,
                'subscription.plan': planName,
                'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
                'subscription.expiresAt': expiresAt,
                'subscription.currentPeriodEnd': currentPeriodEnd,
                'subscription.subscriptionId': session.subscription, // Atualizar com o novo ID
                updatedAt: new Date()
            };

            const updatedUser = await this.userRepository.updateUserSubscription(user.id, updateData);

            console.log(`Assinatura atualizada com sucesso para o usuário: ${firebaseUid}`);
            return updatedUser;
        } catch (error) {
            logError(error as Error);
            throw error;
        }
    }

    async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        try {
            if (!subscription.metadata?.userId) {
                throw new AppError(400, 'Metadados da assinatura incompletos');
            }

            const userId = subscription.metadata.userId;
            const user = await this.userRepository.findById(userId);

            if (!user) {
                throw new AppError(404, 'Usuário não encontrado');
            }

            if (!user.id) {
                throw new AppError(400, 'ID do usuário não encontrado');
            }

            const subscriptionWithPeriod = convertToStripeSubscriptionWithPeriod(subscription);

            let currentPeriodEnd: Date;
            try {
                const timestamp = subscriptionWithPeriod.current_period_end * 1000;
                currentPeriodEnd = new Date(timestamp);
                if (isNaN(currentPeriodEnd.getTime())) {
                    throw new Error('Data inválida');
                }
            } catch (error) {
                currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }

            const updatedUser = await this.userRepository.updateUserSubscription(user.id, {
                status: subscription.status as SubscriptionStatus,
                plan: subscription.items.data[0].price.nickname || 'premium',
                currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                updatedAt: new Date()
            });

            return updatedUser;
        } catch (error) {
            logError(error as Error);
            throw error;
        }
    }

    async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        try {
            if (!subscription.metadata?.userId) {
                throw new AppError(400, 'Metadados da assinatura incompletos');
            }

            const userId = subscription.metadata.userId;
            const user = await this.userRepository.findById(userId);

            if (!user) {
                throw new AppError(404, 'Usuário não encontrado');
            }

            if (!user.id) {
                throw new AppError(400, 'ID do usuário não encontrado');
            }

            const updatedUser = await this.userRepository.updateUserSubscription(user.id, {
                status: 'canceled' as SubscriptionStatus,
                plan: 'free',
                currentPeriodEnd: new Date(),
                cancelAtPeriodEnd: false,
                stripeSubscriptionId: undefined,
                stripePriceId: undefined,
                updatedAt: new Date()
            });

            return updatedUser;
        } catch (error) {
            logError(error as Error);
            throw error;
        }
    }

    private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
        try {
            const customer = await stripe.customers.retrieve(paymentIntent.customer as string) as Stripe.Customer;
            const userId = customer.metadata?.firebaseUid;

            if (!userId) {
                console.log('ID do usuário não encontrado no payment intent');
                return;
            }

            await this.userRepository.updateUserSubscription(userId, {
                status: 'active',
                updatedAt: new Date()
            });

            logSubscriptionEvent('payment_intent_succeeded', {
                userId,
                paymentIntentId: paymentIntent.id
            });
        } catch (error) {
            console.error('Erro ao processar payment_intent.succeeded:', error);
            throw error;
        }
    }

    private async handleChargeSucceeded(charge: Stripe.Charge): Promise<void> {
        try {
            const customer = await stripe.customers.retrieve(charge.customer as string) as Stripe.Customer;
            const userId = customer.metadata?.firebaseUid;

            if (!userId) {
                console.log('ID do usuário não encontrado no charge');
                return;
            }

            await this.userRepository.updateUserSubscription(userId, {
                status: 'active',
                updatedAt: new Date()
            });

            logSubscriptionEvent('charge_succeeded', {
                userId,
                chargeId: charge.id
            });
        } catch (error) {
            console.error('Erro ao processar charge.succeeded:', error);
            throw error;
        }
    }
} 