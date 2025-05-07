// BACKEND: SRC/ROUTES/AUTHROUTES.TS
import express from 'express';
import { container } from '@core/container';
import { TYPES } from '@core/types';
import { UserController } from '@modules/users/controllers/UserController';
import { SubscriptionService } from '../services/subscriptionService'; // Caminho ajustado
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

// Handler assíncrono (verifique se este asyncHandler é necessário ou se você tem um global)
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

// Função para processar sessão (ajustada - VERIFICAR SE AINDA É NECESSÁRIA AQUI OU SE O CONTROLLER FAZ ISSO)
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

// Rotas públicas ajustadas (chamando controller com req, res, next)
router.post('/register', 
  validate(userValidators.register),
  asyncHandler((req, res, next) => userController.register(req, res, next)) // Passa next
);

router.post('/login',
  validate(userValidators.login),
  asyncHandler((req, res, next) => userController.login(req, res, next)) // Passa next
);

// Rota de verificação de token (chamando controller com req, res, next)
router.post('/verify-token',
  asyncHandler((req, res, next) => userController.verifyToken(req, res, next)) // verifyToken no controller agora espera req, res, next
);

// Rotas protegidas ajustadas (chamando controller com req, res, next)
router.get('/session', 
  authenticate,
   // Se o controller.getSession existir e esperar req, res, next
  // asyncHandler((req, res, next) => userController.getSession(req, res, next))
  // Se processSession for usada aqui, ajuste para usar next(error)
   asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Usuário não autenticado'));
    }
    // Assumindo que processSession ainda é usado aqui
    try {
       await processSession(req.user.uid, res);
    } catch (error) {
       next(error);
    }
  })
);

router.get('/profile',
  authenticate,
  asyncHandler((req, res, next) => userController.getProfile(req, res, next)) // Passa next
);

router.put('/profile',
  authenticate,
  validate(userValidators.updateProfile),
  asyncHandler((req, res, next) => userController.updateProfile(req, res, next)) // Passa next
);

export default router;