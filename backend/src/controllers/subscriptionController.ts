// src/controllers/subscriptionController.ts
import { Request, Response, NextFunction } from 'express';
import { container } from '../core/container';
import { TYPES } from '../core/types';
import { SubscriptionService } from '../services/subscriptionService';

// Obter a instância do serviço
const subscriptionService = container.get<SubscriptionService>(TYPES.SubscriptionService);

export const getSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const subscription = await subscriptionService.getSubscription(userId);

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const subscriptionData = req.body;

    await subscriptionService.updateSubscription(userId, subscriptionData);

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const checkActiveSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const isActive = await subscriptionService.checkActiveSubscription(userId);

    res.status(200).json({
      success: true,
      data: { isActive }
    });
  } catch (error) {
    next(error);
  }
};

export const quickCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const hasSubscription = await subscriptionService.quickCheck(userId);

    res.status(200).json({
      success: true,
      data: { hasSubscription }
    });
  } catch (error) {
    next(error);
  }
};

// Exportando todos os métodos como um objeto (opcional)
export const SubscriptionController = {
  getSubscription,
  updateSubscription,
  checkActiveSubscription,
  quickCheck
};