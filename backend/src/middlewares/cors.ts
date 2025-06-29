// src/middlewares/cors.ts 
import { Request, Response, NextFunction } from 'express';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Lista de origens permitidas
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://finnextho.com',
    'https://www.finnextho.com',
    'https://finnextho.vercel.app'
  ].filter(Boolean);

  const origin = req.headers.origin;
  
  // Verificar se a origem está na lista de permitidas
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Permitir requisições sem origin (mobile apps, etc.)
    res.header('Access-Control-Allow-Origin', '*');
  } else {
    // Bloquear origens não autorizadas
    res.status(403).json({ error: 'Origem não autorizada' });
    return;
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Headers de segurança adicionais
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
};