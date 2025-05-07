// src/routes/userRoutes.ts
import { Router } from 'express';
import { container } from '@core/container';
import { TYPES } from '@core/types';
import { UserController } from '@modules/users/controllers/UserController';
import { authenticate } from '@middlewares/authMiddleware';
import { validate } from '@modules/users/middlewares/validate';
import { userValidators } from '@modules/users/validators/userValidators';
import { asyncHandler } from '../utils/asyncHandler'; // Assumindo que asyncHandler está aqui ou em um caminho acessível

const router = Router();
const userController = container.get<UserController>(TYPES.UserController);

// Rotas públicas corrigidas
router.post('/register',
  validate(userValidators.register),
  asyncHandler((req, res, next) => userController.register(req, res, next))
);

router.post('/login',
  validate(userValidators.login),
  asyncHandler((req, res, next) => userController.login(req, res, next))
);

router.post('/verify-token',
  asyncHandler((req, res, next) => userController.verifyToken(req, res, next))
);

// Rotas protegidas corrigidas
router.get('/profile',
  authenticate,
  asyncHandler((req, res, next) => userController.getProfile(req, res, next))
);

router.put('/profile',
  authenticate,
  validate(userValidators.updateProfile),
  asyncHandler((req, res, next) => userController.updateProfile(req, res, next))
);

router.put('/settings',
  authenticate,
  validate(userValidators.updateSettings), // Validar settings
  asyncHandler((req, res, next) => userController.updateSettings(req, res, next))
);

router.get('/:uid', // Rota para obter usuário por UID (Firebase UID)
  asyncHandler((req, res, next) => userController.getUser(req, res, next))
);

router.put('/:uid/subscription', // Rota para atualizar assinatura por UID (Firebase UID)
  authenticate, // Pode precisar de autenticação dependendo da regra de negócio
  asyncHandler((req, res, next) => userController.updateSubscription(req, res, next))
);

export default router;