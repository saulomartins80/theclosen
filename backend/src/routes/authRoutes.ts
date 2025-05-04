// BACKEND: SRC/ROUTES/AUTHROUTES.TS
import express from 'express';
import { container } from '@core/container';
import { TYPES } from '@core/types';
import { UserController } from '@modules/users/controllers/UserController';
import { SubscriptionService } from '../services/subscriptionService';
import { authenticate } from '@middlewares/authMiddleware';
import admin from 'firebase-admin';
import { AppError } from '@core/errors/AppError';
import { validate } from '@modules/users/middlewares/validate';
import { userValidators } from '@modules/users/validators/userValidators';
import jwt from 'jsonwebtoken';
import { getAuth } from 'firebase-admin/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'c601';
const auth = getAuth();

const router = express.Router();
const userController = container.get<UserController>(TYPES.UserController);
const subscriptionService = container.get<SubscriptionService>(TYPES.SubscriptionService);

// Handler assíncrono corrigido
const asyncHandler = <T = any>(
  fn: (req: express.Request<T>, res: express.Response, next: express.NextFunction) => Promise<void>
) => {
  return async (req: express.Request<T>, res: express.Response, next: express.NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Função para processar sessão (ajustada)
const processSession = async (userId: string, res: express.Response) => {
  try {
    const firebaseUser = await auth.getUser(userId);
    const subscription = await subscriptionService.getSubscription(userId).catch(() => null);

    res.status(200).json({
      status: 'success',
      data: {
        uid: userId,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL || null,
        subscription
      }
    });
  } catch (error) {
    throw new AppError(404, 'Usuário não encontrado no Firebase');
  }
};

// Rotas públicas ajustadas
router.post('/register', 
  validate(userValidators.register),
  asyncHandler(async (req, res) => {
    await userController.register(req, res);
  })
);

router.post('/login',
  validate(userValidators.login),
  asyncHandler(async (req, res) => {
    await userController.login(req, res);
  })
);

// Rota de verificação de token corrigida
router.post('/verify-token',
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;
    
    if (!token) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    try {
      if (token.startsWith('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9')) {
        const decodedToken = await auth.verifyIdToken(token);
        await processSession(decodedToken.uid, res);
      } 
      else if (token.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string, email: string };
        res.status(200).json({
          status: 'success',
          data: {
            user: {
              id: decoded.id,
              email: decoded.email
            },
            valid: true,
            tokenType: 'system-jwt'
          }
        });
      }
      else {
        res.status(400).json({ error: 'Tipo de token não reconhecido' });
      }
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  })
);

// Rotas protegidas ajustadas
router.get('/session', 
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }
    await processSession(req.user.uid, res);
  })
);

router.get('/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    await userController.getProfile(req, res);
  })
);

router.put('/profile',
  authenticate,
  validate(userValidators.updateProfile),
  asyncHandler(async (req, res) => {
    await userController.updateProfile(req, res);
  })
);

export default router;