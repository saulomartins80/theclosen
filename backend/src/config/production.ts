// Configurações específicas para produção no Render
export const productionConfig = {
  port: process.env.PORT || 10000,
  nodeEnv: 'production',
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'https://theclosen-frontend.onrender.com',
      'https://theclosen-frontend.vercel.app',
      'https://accounts.google.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    exposedHeaders: ['Authorization', 'Set-Cookie']
  },

  // Configurações de rate limiting para produção
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // limite por IP
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },

  // Configurações de segurança
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.stripe.com", "https://firebase.googleapis.com"]
        }
      }
    }
  },

  // Configurações de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined'
  },

  // Configurações de compressão
  compression: {
    level: 6,
    threshold: 1024
  }
}; 