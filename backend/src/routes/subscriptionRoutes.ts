// src/routes/subscriptionRoutes.ts 
import { Router } from 'express';
import { 
  getSubscription, 
  updateSubscription,
  checkActiveSubscription,
  quickCheck
} from '../controllers/subscriptionController';
import { authenticate } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Rotas protegidas por autenticação
router.get('/user/:userId', authenticate, asyncHandler(getSubscription));
router.put('/user/:userId', authenticate, asyncHandler(updateSubscription));
router.get('/user/:userId/status', authenticate, asyncHandler(checkActiveSubscription));
router.get('/user/:userId/quick-check', authenticate, asyncHandler(quickCheck));

export default router;