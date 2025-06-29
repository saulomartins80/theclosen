import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { stripe, STRIPE_CONFIG } from '../config/stripe';
import { AppError } from '../core/errors/AppError';
import { logError } from '../services/loggerService';

export const stripeWebhookMiddleware = express.raw({ type: 'application/json' });

export const validateStripeWebhook = (req: Request, res: Response, next: NextFunction): void => {
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    res.status(400).json({ error: 'Stripe signature header missing' });
    return;
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(500).json({ error: 'Stripe webhook secret not configured' });
    return;
  }
  
  next();
  return;
};

export const stripeWebhookMiddlewareHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Webhook recebido - Headers:', {
            'stripe-signature': req.headers['stripe-signature'],
            'content-type': req.headers['content-type']
        });

        const signature = req.headers['stripe-signature'];
        if (!signature) {
            console.error('Assinatura do Stripe não encontrada');
            throw new AppError(400, 'Assinatura do Stripe não encontrada', 'STRIPE_SIGNATURE_MISSING');
        }

        // O corpo da requisição já está em formato raw devido ao express.raw()
        const rawBody = req.body;
        if (!rawBody) {
            console.error('Corpo da requisição não encontrado');
            throw new AppError(400, 'Corpo da requisição não encontrado', 'REQUEST_BODY_MISSING');
        }

        console.log('Webhook Secret:', STRIPE_CONFIG.webhookSecret);
        console.log('Processando evento do Stripe...');
        
        try {
            const event = await stripe.webhooks.constructEvent(
                rawBody,
                signature,
                STRIPE_CONFIG.webhookSecret
            );
            
            console.log('Evento construído com sucesso:', {
                type: event.type,
                id: event.id
            });
            
            // Atribui o evento ao corpo da requisição
            req.body = event;
            next();
        } catch (error) {
            console.error('Erro ao construir evento:', error);
            if (error instanceof Error) {
                console.error('Detalhes do erro:', {
                    message: error.message,
                    stack: error.stack
                });
                throw new AppError(400, `Erro ao validar evento do Stripe: ${error.message}`, 'EVENT_CONSTRUCTION_ERROR');
            } else {
                throw new AppError(400, 'Erro ao validar evento do Stripe', 'EVENT_CONSTRUCTION_ERROR');
            }
        }
    } catch (error) {
        console.error('Erro no middleware do webhook:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ 
                error: error.message,
                details: error.details
            });
        } else {
            res.status(500).json({ 
                error: 'Erro interno do servidor',
                details: 'INTERNAL_SERVER_ERROR'
            });
        }
    }
}; 