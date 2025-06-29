import { stripe, STRIPE_CONFIG } from '../config/stripe';
import { adminAuth, adminFirestore } from '@config/firebaseAdmin';
import { AppError } from '../core/errors/AppError';
import { logSubscriptionEvent, logError } from './loggerService';
import type { Stripe } from 'stripe';
import { UserService } from '../modules/users/services/UserService';
import { injectable, inject } from 'inversify';
import { TYPES } from '../core/types';
import { Subscription, SubscriptionStatus } from '../modules/users/types/User';
import { UserRepository } from '../modules/users/repositories/UserRepository';

const db = adminFirestore.collection('users');

interface StripeSubscriptionWithPeriod extends Stripe.Subscription {
    current_period_end: number;
}

interface ISubscription {
    status: SubscriptionStatus;
    plan: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripePriceId?: string;
    createdAt: Date;
    updatedAt?: Date;
}

@injectable()
export class SubscriptionService {
    constructor(
        @inject(TYPES.UserRepository) private userRepository: UserRepository
    ) {}

    async updateSubscription(userId: string, subscriptionData: Partial<ISubscription>) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new AppError(404, 'Usuário não encontrado');
            }

            const updatedUser = await this.userRepository.updateUserSubscription(userId, {
                ...subscriptionData,
                status: subscriptionData.status as SubscriptionStatus,
                updatedAt: new Date(),
            });

            return updatedUser;
        } catch (error) {
            logError(error as Error);
            throw error;
        }
    }

    async cancelSubscription(userId: string) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new AppError(404, 'Usuário não encontrado');
            }

            if (!user.subscription?.stripeSubscriptionId) {
                throw new AppError(400, 'Usuário não possui assinatura ativa');
            }

            const updatedUser = await this.userRepository.updateUserSubscription(userId, {
                status: 'active',
                plan: 'premium',
                currentPeriodEnd: user.subscription.currentPeriodEnd,
                cancelAtPeriodEnd: true,
                updatedAt: new Date(),
            });

            return updatedUser;
        } catch (error) {
            logError(error as Error);
            throw error;
        }
    }

    async createCheckoutSession(userId: string, priceId: string): Promise<string> {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new AppError(404, 'Usuário não encontrado');
            }

            const session = await stripe.checkout.sessions.create({
                customer: user.subscription?.stripeCustomerId,
                payment_method_types: ['card'],
                line_items: [{
                    price: priceId,
                    quantity: 1,
                }],
                mode: 'subscription',
                success_url: STRIPE_CONFIG.urls.success,
                cancel_url: STRIPE_CONFIG.urls.cancel,
                metadata: {
                    userId
                }
            });

            return session.url!;
        } catch (error) {
            throw error;
        }
    }

    async createCustomerPortalSession(stripeCustomerId: string): Promise<Stripe.BillingPortal.Session> {
        try {
            const session = await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId,
                return_url: STRIPE_CONFIG.urls.return,
            });

            logSubscriptionEvent('customer_portal_session_created', {
                customerId: stripeCustomerId,
                sessionId: session.id
            });

            return session;
        } catch (error) {
            logError(error as Error, { stripeCustomerId });
            throw new AppError(500, 'Erro ao criar sessão do portal do cliente');
        }
    }

    async createStripeCustomer(customerData: {
        email?: string;
        name?: string;
        metadata?: Record<string, string>;
    }): Promise<Stripe.Customer> {
        try {
            const customer = await stripe.customers.create({
                email: customerData.email,
                name: customerData.name,
                metadata: customerData.metadata
            });

            logSubscriptionEvent('customer_created', {
                customerId: customer.id,
                email: customerData.email
            });

            return customer;
        } catch (error) {
            logError(error as Error, customerData);
            throw new AppError(500, 'Erro ao criar cliente no Stripe');
        }
    }

    async constructWebhookEvent(rawBody: Buffer, signature: string): Promise<Stripe.Event> {
        try {
            return stripe.webhooks.constructEvent(
                rawBody,
                signature,
                STRIPE_CONFIG.webhookSecret
            );
        } catch (error) {
            logError(error as Error, { signature });
            throw new AppError(400, 'Erro ao validar webhook do Stripe');
        }
    }

    async getSubscriptionDetails(subscriptionId: string): Promise<Stripe.Subscription> {
        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
            return subscription;
        } catch (error) {
            logError(error as Error, { subscriptionId });
            throw new AppError(500, 'Erro ao obter detalhes da assinatura');
        }
    }

    async getSubscriptionPlans(): Promise<Stripe.Price[]> {
        try {
            const prices = await stripe.prices.list({
                active: true,
                type: 'recurring',
                expand: ['data.product'],
            });
            return prices.data;
        } catch (error) {
            logError(error as Error);
            throw new AppError(500, 'Erro ao obter planos de assinatura');
        }
    }

    async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
        try {
            const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
            const userId = customer.metadata?.firebaseUid;

            if (!userId) {
                throw new AppError(400, 'ID do usuário não encontrado');
            }

            const stripeSubscription = subscription as unknown as StripeSubscriptionWithPeriod;

            const subscriptionData = {
                plan: subscription.items.data[0].price.nickname || 'premium',
                status: subscription.status as SubscriptionStatus,
                stripeCustomerId: customer.id,
                stripeSubscriptionId: subscription.id,
                expiresAt: new Date(stripeSubscription.current_period_end * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end
            };

            await db.doc(userId).update({
                subscription: subscriptionData,
                updatedAt: new Date()
            });

            logSubscriptionEvent('subscription_updated', {
                userId,
                subscriptionId: subscription.id,
                status: subscription.status
            });
        } catch (error) {
            logError(error as Error, { subscriptionId: subscription.id });
            throw new AppError(500, 'Erro ao atualizar assinatura');
        }
    }

    async handleWebhookEvent(event: Stripe.Event): Promise<void> {
        try {
            console.log('Evento recebido:', event.type);
            
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                    break;
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                    break;
                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
                    break;
                case 'charge.succeeded':
                    await this.handleChargeSucceeded(event.data.object as Stripe.Charge);
                    break;
                default:
                    console.log('Evento não tratado:', event.type);
            }
        } catch (error) {
            console.error('Erro ao processar evento do webhook:', error);
            throw error;
        }
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
        try {
            console.log('Dados da sessão:', {
                metadata: session.metadata,
                customer: session.customer,
                subscription: session.subscription
            });

            // Verificar se temos userId nos metadados
            if (!session.metadata?.userId) {
                console.log('Firebase UID não encontrado na sessão:', {
                    metadata: session.metadata,
                    customerId: session.customer
                });
                
                // Tentar buscar pelo customer ID se não tiver userId
                if (session.customer) {
                    const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
                    const firebaseUid = customer.metadata?.firebaseUid;
                    
                    if (firebaseUid) {
                        console.log('Firebase UID encontrado no customer:', firebaseUid);
                        await this.updateUserSubscription(firebaseUid, session);
                        return;
                    }
                }
                
                throw new AppError(400, 'Metadados da sessão incompletos');
            }

            const userId = session.metadata.userId;
            console.log('Processando webhook para userId:', userId);
            
            await this.updateUserSubscription(userId, session);
        } catch (error) {
            console.error('Erro ao processar checkout.session.completed:', error);
            throw error;
        }
    }

    private async updateUserSubscription(userId: string, session: Stripe.Checkout.Session): Promise<void> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new AppError(404, 'Usuário não encontrado');
        }

        if (!user.id) {
            throw new AppError(400, 'ID do usuário não encontrado');
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        console.log('Dados da assinatura:', {
            id: subscription.id,
            status: subscription.status,
            plan: subscription.items.data[0].price.nickname
        });

        let currentPeriodEnd: Date;
        try {
            const subscriptionWithPeriod = subscription as unknown as StripeSubscriptionWithPeriod;
            const timestamp = subscriptionWithPeriod.current_period_end * 1000;
            currentPeriodEnd = new Date(timestamp);
            if (isNaN(currentPeriodEnd.getTime())) {
                throw new Error('Data inválida');
            }
        } catch (error) {
            currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        await this.userRepository.updateUserSubscription(user.id, {
            status: subscription.status as SubscriptionStatus,
            plan: subscription.items.data[0].price.nickname || 'premium',
            currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            updatedAt: new Date()
        });

        console.log('Usuário atualizado com sucesso:', user.id);
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
        try {
            const userId = subscription.metadata?.userId;
            if (!userId) {
                throw new AppError(400, 'ID do usuário não encontrado');
            }

            const stripeSubscription = subscription as unknown as StripeSubscriptionWithPeriod;

            await this.userRepository.updateUserSubscription(userId, {
                status: subscription.status,
                expiresAt: new Date(stripeSubscription.current_period_end * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
            });
        } catch (error) {
            throw error;
        }
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
        try {
            const userId = subscription.metadata?.userId;
            if (!userId) {
                throw new AppError(400, 'ID do usuário não encontrado');
            }

            const stripeSubscription = subscription as unknown as StripeSubscriptionWithPeriod;

            await this.userRepository.updateUserSubscription(userId, {
                status: 'inactive',
                expiresAt: new Date(stripeSubscription.current_period_end * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
            });
        } catch (error) {
            throw error;
        }
    }

    private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
        try {
            const userId = paymentIntent.metadata?.userId;
            if (!userId) {
                console.log('ID do usuário não encontrado no payment_intent');
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
            const userId = charge.metadata?.userId;
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