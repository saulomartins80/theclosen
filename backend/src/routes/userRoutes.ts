// src/routes/userRoutes.ts 
import { Router } from 'express';
import { container } from '@core/container';
import { TYPES } from '@core/types';
import { UserController } from '@modules/users/controllers/UserController';
import { authenticate } from '@middlewares/authMiddleware';
import { validate } from '@modules/users/middlewares/validate';
import { userValidators } from '@modules/users/validators/userValidators';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const userController = container.get<UserController>(TYPES.UserController);

// Rotas públicas
router.post('/register', validate(userValidators.register), asyncHandler(userController.register));
router.post('/login', validate(userValidators.login), asyncHandler(userController.login));
router.post('/verify-token', asyncHandler(userController.verifyToken));

// Rotas protegidas
router.get('/profile', authenticate, asyncHandler(userController.getProfile));
router.put('/profile', authenticate, validate(userValidators.updateProfile), asyncHandler(userController.updateProfile));
router.put('/settings', authenticate, validate(userValidators.updateSettings), asyncHandler(userController.updateSettings));

export default router;