import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppError } from '../errors/AppError';

// Rate Limiting para diferentes endpoints
export const createRateLimiters = () => {
  // Rate limit geral para API
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: {
      error: 'Muitas requisições. Tente novamente em 15 minutos.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/api/health')
  });

  // Rate limit específico para chatbot
  const chatbotLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 10, // máximo 10 requests por minuto
    message: {
      error: 'Limite de mensagens excedido. Tente novamente em 1 minuto.',
      retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Usar user ID se disponível, senão IP
      return (req as any).user?.uid || req.ip;
    }
  });

  // Rate limit para streaming
  const streamingLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 5, // máximo 5 streams simultâneos
    message: {
      error: 'Limite de streams excedido. Tente novamente em 5 minutos.',
      retryAfter: 5 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req as any).user?.uid || req.ip
  });

  return { generalLimiter, chatbotLimiter, streamingLimiter };
};

// Headers de segurança
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.deepseek.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

// Validação de input sanitizada
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return '';
    
    return str
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  try {
    // Sanitizar apenas o body, que pode ser modificado
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // req.query e req.params são somente leitura no Express
    // A sanitização desses valores deve ser feita individualmente quando necessário
  } catch (error) {
    console.error('Erro na sanitização de input:', error);
    // Não falhar a requisição por erro de sanitização
  }

  next();
};

// Validação de tamanho de mensagem
export const validateMessageSize = (req: Request, res: Response, next: NextFunction) => {
  const maxMessageLength = 2000; // 2KB máximo
  
  if (req.body?.message && req.body.message.length > maxMessageLength) {
    return next(new AppError(400, `Mensagem muito longa. Máximo ${maxMessageLength} caracteres.`));
  }
  
  next();
};

// Verificação de origem segura
export const validateOrigin = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://finnextho.com',
    'https://www.finnextho.com'
  ].filter(Boolean);

  const origin = req.headers.origin;
  
  if (origin && !allowedOrigins.includes(origin)) {
    return next(new AppError(403, 'Origem não autorizada'));
  }
  
  next();
};

// Middleware de auditoria
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = (req as any).user?.uid || 'anonymous';
    
    console.log(`[AUDIT] ${req.method} ${req.path} - User: ${userId} - Status: ${res.statusCode} - Duration: ${duration}ms - IP: ${req.ip}`);
    
    // Log de atividades suspeitas
    if (res.statusCode >= 400) {
      console.warn(`[SECURITY] Failed request - User: ${userId} - IP: ${req.ip} - Path: ${req.path} - Status: ${res.statusCode}`);
    }
  });
  
  next();
};

// Middleware de proteção contra ataques comuns
export const attackProtection = (req: Request, res: Response, next: NextFunction) => {
  // Verificar User-Agent
  const userAgent = req.headers['user-agent'];
  if (!userAgent || userAgent.length < 10) {
    return next(new AppError(403, 'User-Agent inválido'));
  }

  // Verificar se é um bot malicioso
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  if (isSuspicious && !req.path.startsWith('/api/health')) {
    console.warn(`[SECURITY] Suspicious User-Agent: ${userAgent} - IP: ${req.ip}`);
    return next(new AppError(403, 'Acesso negado'));
  }

  // Verificar tamanho do payload
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxPayloadSize = 1024 * 1024; // 1MB
  
  if (contentLength > maxPayloadSize) {
    return next(new AppError(413, 'Payload muito grande'));
  }

  next();
};

// Rate limiting simples
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const simpleRateLimit = (windowMs: number = 60000, maxRequests: number = 10) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req as any).user?.uid || req.ip;
    const now = Date.now();
    
    const userRequests = requestCounts.get(key);
    
    if (!userRequests || now > userRequests.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      return next(new AppError(429, 'Muitas requisições. Tente novamente em breve.'));
    }
    
    userRequests.count++;
    next();
  };
}; 