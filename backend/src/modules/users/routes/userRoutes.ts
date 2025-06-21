import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { container } from '@core/container';
import { TYPES } from '@core/types';

const router = Router();
const userController = container.get<UserController>(TYPES.UserController);

router.get('/profile', authMiddleware, userController.getProfile.bind(userController));

export default router; 