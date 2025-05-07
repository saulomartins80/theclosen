// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '@config/firebaseAdmin';
import { AppError } from '@core/errors/AppError';
import jwt from 'jsonwebtoken';

declare module 'express' {
  interface Request {
    user?: {
      uid: string;
      id?: string;
      email?: string;
      name?: string;
      [key: string]: any; // Para propriedades adicionais
    };
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'c601'; // Use variável de ambiente

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError(401, 'Token de autenticação não fornecido'));
    }

    const token = authHeader.split(' ')[1];
    const isFirebaseToken = token.length > 500;

    if (isFirebaseToken) {
      try {
        const firebaseDecoded = await adminAuth.verifyIdToken(token);
        req.user = {
          uid: firebaseDecoded.uid,
          ...(firebaseDecoded.email && { email: firebaseDecoded.email }),
          ...(firebaseDecoded.name && { name: firebaseDecoded.name }),
          // Outras propriedades específicas do Firebase
        };
        return next();
      } catch (firebaseError: any) {
        console.error('Erro Firebase:', firebaseError.message);
        if (firebaseError.code === 'auth/id-token-expired') {
          return next(new AppError(401, 'Token Firebase expirado'));
        }
      }
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;
      
      // Extrai as propriedades específicas primeiro
      const { id, email, uid, ...rest } = decoded;
      
      req.user = {
        uid: uid || id, // Usa uid se existir, caso contrário id
        ...(email && { email }), // Adiciona email apenas se existir
        ...rest // Inclui todas as outras claims
      };
      
      return next();
    } catch (jwtError: any) {
      console.error('Erro JWT:', jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError(401, 'Token JWT expirado'));
      }
      return next(new AppError(401, 'Token inválido'));
    }

  } catch (error: any) {
    console.error('Erro inesperado:', error);
    next(new AppError(500, 'Erro interno no servidor'));
  }
};