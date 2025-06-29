// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebase';
import { AppError } from '@core/errors/AppError';
import jwt from 'jsonwebtoken';
import { container } from '@core/container';
import { TYPES } from '@core/types';
import { UserService } from '@modules/users/services/UserService';

// JWT_SECRET mais seguro - deve ser definido em variável de ambiente
const JWT_SECRET = process.env.JWT_SECRET || process.env.APP_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret-change-in-production';

if (!process.env.JWT_SECRET && !process.env.APP_JWT_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.warn('[SECURITY] JWT_SECRET não configurado! Use uma variável de ambiente segura.');
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError(401, 'Token de autenticação não fornecido'));
    }

    const token = authHeader.split(' ')[1];
    
    // Validação adicional do token
    if (!token || token.length < 10) {
      return next(new AppError(401, 'Token inválido'));
    }

    const isFirebaseToken = token.length > 500;
    const userService = container.get<UserService>(TYPES.UserService);

    if (isFirebaseToken) {
      try {
        const firebaseDecoded = await adminAuth.verifyIdToken(token);
        const firebaseUid = firebaseDecoded.uid;

        // Validação adicional do UID
        if (!firebaseUid || firebaseUid.length < 10) {
          return next(new AppError(401, 'UID Firebase inválido'));
        }

        const mongoUser = await userService.getUserByFirebaseUid(firebaseUid) as any;

        if (!mongoUser) {
          return next(new AppError(404, 'Usuário não encontrado em nossa base de dados. Por favor, tente logar novamente ou contate o suporte.'));
        }

        if (!mongoUser._id) {
          return next(new AppError(500, 'Erro interno: ID do usuário do banco de dados não encontrado.'));
        }

        req.user = {
          _id: mongoUser._id.toString(),
          firebaseUid: firebaseUid,
          uid: firebaseUid,
          id: mongoUser._id.toString(),
          email: mongoUser.email,
          name: mongoUser.name,
          subscription: mongoUser.subscription,
          ...mongoUser
        };
        return next();
      } catch (firebaseError: any) {
        if (firebaseError.code === 'auth/id-token-expired') {
          return next(new AppError(401, 'Token Firebase expirado'));
        } else if (firebaseError.code === 'auth/user-not-found') {
          return next(new AppError(404, 'Usuário Firebase não encontrado.'));
        }
        return next(new AppError(401, firebaseError.message || 'Erro na validação do token Firebase'));
      }
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;

      if (!decoded.id) {
        return next(new AppError(401, 'Token JWT inválido: ID do usuário ausente.'));
      }

      req.user = {
        _id: decoded.id,
        firebaseUid: decoded.uid || decoded.id,
        uid: decoded.uid || decoded.id,
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        subscription: decoded.subscription,
        ...decoded
      };
      return next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError(401, 'Token JWT expirado'));
      }
      return next(new AppError(401, jwtError.message || 'Token JWT inválido'));
    }
  } catch (error: any) {
    next(new AppError(500, 'Erro interno no servidor durante autenticação'));
  }
};

// Exportar authMiddleware como alias para authenticate
export const authMiddleware = authenticate;

async function verifyToken(token: string) {
  // Implemente a verificação do token aqui
  // Por exemplo, usando o Firebase Admin SDK
  return {
    uid: 'user-id',
    email: 'user@example.com',
    name: 'User Name'
  };
}
