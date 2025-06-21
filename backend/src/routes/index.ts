import { Router } from 'express';
import userRoutes from '../modules/users/routes/userRoutes';
import subscriptionRoutes from '../modules/subscriptions/routes/subscriptionRoutes';

const router = Router();

router.use('/user', userRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router; 