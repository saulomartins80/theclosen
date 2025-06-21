import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Extender o tipo Request para incluir rateLimit
interface RateLimitRequest extends Request {
  rateLimit?: {
    resetTime: number;
  };
}

// Rate limiting específico para webhooks do Stripe
export const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // aumentado de 20 para 100 requisições por minuto
  message: {
    error: 'Too many webhook requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // mudado para true para não contar requisições bem-sucedidas
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Usar IP + Stripe signature como chave para rate limiting
    const stripeSignature = req.headers['stripe-signature'] as string;
    return `${req.ip}-${stripeSignature || 'no-signature'}`;
  },
  handler: (req: RateLimitRequest, res) => {
    console.log(`Rate limit exceeded for webhook from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many webhook requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit ? Math.ceil(req.rateLimit.resetTime / 1000) : 60
    });
  }
});

// Rate limiting mais permissivo para webhooks de teste
export const testWebhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 200, // aumentado de 50 para 200 requisições por minuto
  message: {
    error: 'Too many test webhook requests',
    code: 'TEST_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // mudado para true
  skipFailedRequests: false,
  keyGenerator: (req) => {
    const stripeSignature = req.headers['stripe-signature'] as string;
    return `${req.ip}-test-${stripeSignature || 'no-signature'}`;
  }
}); 