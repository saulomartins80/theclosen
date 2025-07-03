import express from 'express';
import { mileageController } from '../controllers/mileageController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Todas as rotas de milhas requerem autenticação
router.use(authMiddleware);

// Programas de Milhas
router.get('/programs', asyncHandler(mileageController.getMileagePrograms));
router.put('/programs/:id', asyncHandler(mileageController.updateMileageProgram));

// Cartões de Milhas
router.get('/cards', asyncHandler(mileageController.getMileageCards));
router.post('/cards', asyncHandler(mileageController.addMileageCard));
router.put('/cards/:id', asyncHandler(mileageController.updateMileageCard));
router.delete('/cards/:id', asyncHandler(mileageController.deleteMileageCard));

// Transações de Milhas
router.get('/transactions', asyncHandler(mileageController.getMileageTransactions));
router.post('/transactions', asyncHandler(mileageController.addMileageTransaction));

// Análises de Milhas
router.get('/analytics', asyncHandler(mileageController.getMileageAnalytics));

// Recomendações de Cartões
router.post('/recommendations', asyncHandler(mileageController.getCardRecommendations));

// Calculadora de Milhas
router.post('/calculate', asyncHandler(mileageController.calculateMiles));

export default router;