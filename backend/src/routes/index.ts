import { Router } from 'express';
import userRoutes from '../modules/users/routes/userRoutes';
import subscriptionRoutes from '../modules/subscriptions/routes/subscriptionRoutes';
import automatedActionsRoutes from './automatedActions';

const router = Router();

router.use('/user', userRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/automated-actions', automatedActionsRoutes);

export default router; 