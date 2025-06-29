// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebaseAdmin';
import { AppError } from '@core/errors/AppError';
import jwt from 'jsonwebtoken';
import { container } from '@core/container';
import { TYPES } from '@core/types';
import { UserService } from '@modules/users/services/UserService';
import { financialAudit } from '../security/zero-trust';

// JWT_SECRET mais seguro - deve ser definido em variável de ambiente
const JWT_SECRET = process.env.JWT_SECRET || process.env.APP_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret-change-in-production';

if (!process.env.JWT_SECRET && !process.env.APP_JWT_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.warn('[SECURITY] JWT_SECRET não configurado! Use uma variável de ambiente segura.');
}

// Sistema Anti-Revogação
async function checkRevokedTokens(uid: string) {
  // Implemente conexão com Redis para lista negra
  const revokedTokens: string[] = [];
  if (revokedTokens.includes(uid)) {
    throw new Error("Token revogado");
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log(`[AUTH] 🔍 Iniciando autenticação para: ${req.method} ${req.path}`);
    console.log(`[AUTH] 📋 Headers recebidos:`, {
      authorization: req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : 'NONE',
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip']
    });
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log(`[AUTH] ❌ Token não fornecido ou formato inválido: ${authHeader}`);
      return next(new AppError(401, 'Token de autenticação não fornecido'));
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      console.log(`[AUTH] ❌ Token vazio após split`);
      return next(new AppError(401, "Credenciais ausentes"));
    }

    console.log(`[AUTH] 🔑 Token recebido (primeiros 20 chars): ${token.substring(0, 20)}...`);
    console.log(`[AUTH] 📏 Tamanho do token: ${token.length}`);

    // Camada 1: Tamanho mínimo
    if (token.length < 30) {
      console.log(`[AUTH] ❌ Token muito pequeno: ${token.length} chars`);
      return next(new AppError(401, "Token inválido"));
    }

    // Camada 2: Firebase + JWT
    let decoded: any = null;
    try {
      console.log(`[AUTH] 🔥 Tentando verificar token Firebase...`);
      decoded = await adminAuth.verifyIdToken(token);
      console.log(`[AUTH] ✅ Token Firebase válido para UID: ${decoded.uid}`);
    } catch (firebaseError: any) {
      console.log(`[AUTH] ❌ Erro Firebase: ${firebaseError.code} - ${firebaseError.message}`);
      decoded = null;
    }
    
    if (!decoded) {
      console.log(`[AUTH] 🔄 Tentando JWT local...`);
      // Fallback para JWT local
      try {
        const localDecoded = jwt.verify(token, JWT_SECRET);
        if (typeof localDecoded === 'string' || !localDecoded) {
          console.log(`[AUTH] ❌ JWT local inválido`);
          return next(new AppError(401, 'Token JWT inválido.'));
        }
        console.log(`[AUTH] ✅ JWT local válido`);
        req.user = {
          _id: localDecoded.id,
          firebaseUid: localDecoded.uid || localDecoded.id,
          uid: localDecoded.uid || localDecoded.id,
          subscription: localDecoded.subscription,
          ...localDecoded
        };
      } catch (jwtError: any) {
        console.log(`[AUTH] ❌ Erro JWT local: ${jwtError.message}`);
        return next(new AppError(401, 'Token inválido'));
      }
    } else {
      console.log(`[AUTH] ✅ Configurando req.user com dados Firebase`);
      req.user = {
        _id: decoded.uid,
        firebaseUid: decoded.uid,
        uid: decoded.uid,
        subscription: decoded.subscription,
        ...decoded
      };
    }

    console.log(`[AUTH] 👤 req.user configurado:`, {
      uid: req.user?.uid,
      firebaseUid: req.user?.firebaseUid,
      _id: req.user?._id
    });

    // Removido temporariamente o sistema de auditoria que pode estar causando problemas
    // console.log(`[AUTH] 🔍 Verificando revogação para UID: ${req.user.uid}`);
    // await checkRevokedTokens(req.user.uid);
    
    // console.log(`[AUTH] 📊 Logging auditoria para UID: ${req.user.uid}`);
    // financialAudit.log('AUTHENTICATION', {
    //   userId: req.user.uid,
    //   ip: req.ip,
    //   userAgent: req.headers['user-agent'],
    //   sessionId: req.headers['x-session-id'],
    //   attemptCount: 1
    // });

    console.log(`[AUTH] ✅ Autenticação bem-sucedida para: ${req.method} ${req.path}`);
    next();
  } catch (error: any) {
    console.error(`[AUTH] 💥 ERRO NUCLEAR: ${error && error.message ? error.message : String(error)}`);
    
    // Removido temporariamente o sistema de auditoria
    // financialAudit.log('AUTHENTICATION_FAILED', {
    //   userId: 'unknown',
    //   ip: req.ip,
    //   userAgent: req.headers['user-agent'],
    //   error: error && error.message ? error.message : String(error),
    //   attemptCount: 1
    // });
    
    return next(new AppError(401, "Acesso negado", "AUTH_LOCKDOWN"));
  }
};

// Middleware de autenticação com múltiplas camadas de segurança
export const authenticateWithLayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError(401, 'Token de autenticação não fornecido'));
    }

    const token = authHeader.split('Bearer ')[1];
    
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
          subscription: mongoUser.subscription,
          ...mongoUser
        };

        // Auditoria de autenticação bem-sucedida
        financialAudit.log('AUTHENTICATION_SUCCESS', {
          userId: firebaseUid,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          sessionId: req.headers['x-session-id'],
          method: 'firebase'
        });

        return next();
      } catch (firebaseError: any) {
        if (firebaseError.code === 'auth/id-token-expired') {
          return next(new AppError(401, 'Token Firebase expirado'));
        } else if (firebaseError.code === 'auth/user-not-found') {
          return next(new AppError(404, 'Usuário Firebase não encontrado.'));
        }

        // Auditoria de falha Firebase
        financialAudit.log('AUTHENTICATION_FAILED', {
          userId: 'unknown',
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          error: firebaseError.message,
          method: 'firebase'
        });

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
        subscription: decoded.subscription,
        ...decoded
      };

      // Auditoria de autenticação JWT bem-sucedida
      financialAudit.log('AUTHENTICATION_SUCCESS', {
        userId: decoded.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.headers['x-session-id'],
        method: 'jwt'
      });

      return next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError(401, 'Token JWT expirado'));
      }

      // Auditoria de falha JWT
      financialAudit.log('AUTHENTICATION_FAILED', {
        userId: 'unknown',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        error: jwtError.message,
        method: 'jwt'
      });

      return next(new AppError(401, jwtError.message || 'Token JWT inválido'));
    }
  } catch (error: any) {
    console.error('[AUTH] Erro interno no servidor durante autenticação:', error);
    
    // Auditoria de erro interno
    financialAudit.log('AUTHENTICATION_ERROR', {
      userId: 'unknown',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      error: error.message,
      severity: 'HIGH'
    });

    next(new AppError(500, 'Erro interno no servidor durante autenticação'));
  }
};

// Exportar authMiddleware como alias para authenticate
export const authMiddleware = authenticate;

// Middleware para verificação de permissões específicas
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Usuário não autenticado'));
    }

    // Verificar permissões do usuário
    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(permission)) {
      financialAudit.log('PERMISSION_DENIED', {
        userId: req.user.uid,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requiredPermission: permission,
        userPermissions
      });

      return next(new AppError(403, 'Permissão insuficiente'));
    }

    next();
  };
};

// Middleware para verificação de assinatura ativa
export const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError(401, 'Usuário não autenticado'));
  }

  try {
    const userService = container.get<UserService>(TYPES.UserService);
    const user = await userService.getUserById(req.user._id);

    if (!user || !user.subscription || user.subscription.status !== 'active') {
      financialAudit.log('SUBSCRIPTION_REQUIRED', {
        userId: req.user.uid,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        subscriptionStatus: user && user.subscription ? user.subscription.status : 'none'
      });

      return next(new AppError(403, 'Assinatura ativa necessária'));
    }

    next();
  } catch (error) {
    console.error('[AUTH] Erro ao verificar assinatura:', error);
    return next(new AppError(500, 'Erro interno ao verificar assinatura'));
  }
};

async function verifyToken(token: string) {
  // Implemente a verificação do token aqui
  // Por exemplo, usando o Firebase Admin SDK
  return {
    uid: 'user-id',
    email: 'user@example.com',
    name: 'User Name'
  };
} 