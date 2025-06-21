import Stripe from 'stripe';
import { AppError } from '../utils/AppError';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError('STRIPE_SECRET_KEY não configurada', 500);
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError('STRIPE_WEBHOOK_SECRET não configurada', 500);
}

if (!process.env.FRONTEND_URL) {
    throw new AppError('FRONTEND_URL não configurada', 500);
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-05-28.basil',
});

export const STRIPE_CONFIG = {
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    frontendUrl: process.env.FRONTEND_URL,
    urls: {
        success: `${process.env.FRONTEND_URL}/assinaturas/sucesso`,
        cancel: `${process.env.FRONTEND_URL}/assinaturas/cancelar`,
        return: `${process.env.FRONTEND_URL}/assinaturas/retorno`,
    },
};

// Preços dos planos (substitua pelos seus IDs reais do Stripe)
export const STRIPE_PRICES = {
    premium: process.env.STRIPE_PREMIUM_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
};

// Função para validar a assinatura
export const validateSubscription = (subscription: any) => {
    if (!subscription) return false;
    return subscription.status === 'active' || subscription.status === 'trialing';
};

// Função para formatar a data de expiração
export const formatExpirationDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}; 