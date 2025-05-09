// backend/src/controllers/subscriptionController.ts
import { Request, Response, NextFunction } from 'express';
import { container } from '../core/container';
import { TYPES } from '../core/types';
import { UserService } from '../modules/users/services/UserService'; 
import { SubscriptionService as FirestoreSubscriptionService } from '../services/subscriptionService';
import { AppError } from '@core/errors/AppError';

const userService = container.get<UserService>(TYPES.UserService);
const firestoreSubscriptionService = container.get<FirestoreSubscriptionService>(TYPES.SubscriptionService);

export const getSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const subscription = await firestoreSubscriptionService.getSubscription(userId);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found (Firestore)' });
    }
    return res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
    return; // Adicionado
  }
};

export const updateSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const subscriptionData = req.body;
    await firestoreSubscriptionService.updateSubscription(userId, subscriptionData);
    return res.status(200).json({ success: true, message: 'Subscription updated successfully (Firestore)' });
  } catch (error) {
    next(error);
    return; // Adicionado
  }
};

export const checkActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const isActive = await firestoreSubscriptionService.checkActiveSubscription(userId);
    return res.status(200).json({ success: true, data: { isActive } });
  } catch (error) {
    next(error);
    return; // Adicionado
  }
};

export const quickCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const hasSubscription = await firestoreSubscriptionService.quickCheck(userId);
    return res.status(200).json({ success: true, data: { hasSubscription } });
  } catch (error) {
    next(error);
    return; // Adicionado
  }
};

export const createTestSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body; 

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID (firebaseUid) é obrigatório nos parâmetros da rota." });
    }
    if (!plan) {
      return res.status(400).json({ success: false, message: "O campo 'plan' é obrigatório no corpo da requisição." });
    }

    console.log(`[SubscriptionController] Recebida requisição para criar/atualizar assinatura de teste para usuário ${userId} com plano ${plan} via MongoDB.`);
    const updatedSubscriptionData = await userService.activateTestSubscription(userId, plan);
    return res.status(201).json({ 
      success: true,
      message: 'Assinatura de teste ativada/atualizada com sucesso no MongoDB.',
      data: updatedSubscriptionData 
    });
  } catch (error: any) { 
    console.error('[SubscriptionController] Erro ao criar/atualizar assinatura de teste:', error.message);
    if (error instanceof AppError) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
        return; // Adicionado
    }
    next(error); 
    return; // Adicionado
  }
};

export const SubscriptionController = {
  getSubscription,
  updateSubscription,
  checkActiveSubscription,
  quickCheck,
  createTestSubscription
};