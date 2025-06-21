import { Router } from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { authenticate } from '../../../middlewares/authMiddleware';
import { container } from '@core/container';
import { TYPES } from '@core/types';

const router = Router();
const subscriptionController = container.get<SubscriptionController>(TYPES.SubscriptionController);

router.post('/create-checkout-session', authenticate, subscriptionController.createCheckoutSession.bind(subscriptionController));
router.post('/create-portal-session', authenticate, subscriptionController.createPortalSession.bind(subscriptionController));
router.post('/verify-session', authenticate, subscriptionController.verifySession.bind(subscriptionController));
router.post('/webhook', subscriptionController.handleWebhook.bind(subscriptionController));

export default router; 