import express from 'express';
import authRoutes from './authRoutes';
import transacoesRoutes from './transacoesRoutes';
import investimentoRoutes from './investimentoRoutes';
import marketDataRoutes from './marketDataRoutes';
import goalsRoutes from './goalsRoutes';
import chatbotRoutes from './chatbotRoutes';
import automatedActions from './automatedActions';
import subscriptionRoutes from './subscriptionRoutes';
import pluggyRoutes from './pluggyRoutes';
import mileageRoutes from './mileageRoutes';

const router = express.Router();

// Rotas de autenticação
router.use('/auth', authRoutes);

// Rotas protegidas
router.use('/transacoes', transacoesRoutes);
router.use('/investimentos', investimentoRoutes);
router.use('/market-data', marketDataRoutes);
router.use('/goals', goalsRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/automated-actions', automatedActions);
router.use('/subscriptions', subscriptionRoutes);
router.use('/pluggy', pluggyRoutes);
router.use('/mileage', mileageRoutes);

export default router; 