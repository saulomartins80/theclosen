// src/routes/protectedRoutes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { container } from '../core/container';
import { UserService } from '../modules/users/services/UserService';
import { AppError } from '../errors/AppError';
import { TYPES } from '../core/types';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const userService = container.get<UserService>(TYPES.UserService);

router.get('/profile', authenticate, asyncHandler(async (req, res, next) => {
  if (!req.user?.uid) throw new AppError(401, 'Não autenticado');
  const profile = await userService.getProfile(req.user.uid);
  res.status(200).json(profile);
}));

router.get('/dashboard', authenticate, asyncHandler(async (req, res) => {
  if (!req.user?.uid) throw new AppError(401, 'Não autenticado');
  res.status(200).json({ message: 'Dashboard acessível', user: req.user });
}));

export default router;