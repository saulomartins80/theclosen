// src/routes/subscriptionRoutes.ts 
import { Router } from 'express';
import { 
  getSubscription, 
  updateSubscription,
  checkActiveSubscription,
  quickCheck,
  createTestSubscription // <--- Adicionar esta função (assumindo que será criada)
} from '../controllers/subscriptionController';
import { authenticate } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Rotas protegidas por autenticação - Caminhos corrigidos
router.get('/:userId', authenticate, asyncHandler(getSubscription));
router.put('/:userId', authenticate, asyncHandler(updateSubscription));
router.get('/:userId/status', authenticate, asyncHandler(checkActiveSubscription));
router.get('/:userId/quick-check', authenticate, asyncHandler(quickCheck));

// Nova rota para criar assinatura de teste <--- Adicionado
router.post('/:userId/test', authenticate, asyncHandler(createTestSubscription));

export default router;