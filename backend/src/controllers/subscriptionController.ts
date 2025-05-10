// backend/src/controllers/subscriptionController.ts
import { Request, Response, NextFunction } from 'express';
import { container } from '../core/container';
import { TYPES } from '../core/types';
import { UserService } from '../modules/users/services/UserService'; 
import { AppError } from '@core/errors/AppError';

const userService = container.get<UserService>(TYPES.UserService);

export const getSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ success: false, message: "ID do usuário (firebaseUid) é obrigatório nos parâmetros da rota." });
    }

    const user = await userService.getUserByFirebaseUid(userId);

    if (!user) {
      console.warn(`[SubscriptionController] Usuário com Firebase UID ${userId} não encontrado no MongoDB ao buscar assinatura.`);
      return res.status(404).json({ success: false, message: 'Usuário não encontrado em nossa base de dados.' });
    }

    const subscription = user.subscription; 

    if (!subscription) {
      console.log(`[SubscriptionController] Dados de assinatura não encontrados para o usuário ${userId} no MongoDB.`);
      return res.status(404).json({ success: false, message: 'Dados de assinatura não encontrados para este usuário.' });
    }

    return res.status(200).json({ success: true, data: subscription });
  } catch (error: any) {
    console.error('[SubscriptionController] Erro ao buscar assinatura:', error.message);
    if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
    return next(error); // Corrigido: adicionado return
  }
};

export const updateSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const subscriptionData = req.body;

    if (!userId) {
         return res.status(400).json({ success: false, message: "ID do usuário (firebaseUid) é obrigatório nos parâmetros da rota." });
    }
     if (!subscriptionData || typeof subscriptionData !== 'object') {
         return res.status(400).json({ success: false, message: "Dados da assinatura são obrigatórios e devem ser um objeto." });
    }

    const updatedUserWithSubscription = await userService.updateSubscription(userId, subscriptionData);

    if (!updatedUserWithSubscription) {
         console.error(`[SubscriptionController] userService.updateSubscription não retornou dados atualizados para o usuário ${userId}.`);
         return res.status(500).json({ success: false, message: 'Falha ao atualizar assinatura.' });
    }

    return res.status(200).json({ 
        success: true, 
        message: 'Assinatura atualizada com sucesso no MongoDB.',
        data: updatedUserWithSubscription?.subscription
    });

  } catch (error: any) {
    console.error('[SubscriptionController] Erro ao atualizar assinatura:', error.message);
    if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
    return next(error); // Corrigido: adicionado return
  }
};

export const checkActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
     if (!userId) {
         return res.status(400).json({ success: false, message: "ID do usuário (firebaseUid) é obrigatório nos parâmetros da rota." });
    }
    const user = await userService.getUserByFirebaseUid(userId);

     if (!user) {
         return res.status(404).json({ success: false, message: 'Usuário não encontrado em nossa base de dados.' });
    }

    const isActive = user.subscription?.status === 'active';

    return res.status(200).json({ success: true, data: { isActive } });
  } catch (error: any) {
    console.error('[SubscriptionController] Erro ao verificar assinatura ativa:', error.message);
    if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
    return next(error); // Corrigido: adicionado return
  }
};

export const quickCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
     if (!userId) {
         return res.status(400).json({ success: false, message: "ID do usuário (firebaseUid) é obrigatório nos parâmetros da rota." });
    }
    const user = await userService.getUserByFirebaseUid(userId);

     if (!user) {
         return res.status(200).json({ success: true, data: { hasSubscription: false } });
    }

    const hasSubscription = !!user.subscription;

    return res.status(200).json({ success: true, data: { hasSubscription } });
  } catch (error: any) {
    console.error('[SubscriptionController] Erro ao fazer quick check de assinatura:', error.message);
    if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
    return next(error); // Corrigido: adicionado return
  }
};

export const createTestSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body; 

    if (!userId) {
      return res.status(400).json({ success: false, message: "ID do usuário (firebaseUid) é obrigatório nos parâmetros da rota." });
    }
    if (!plan) {
      return res.status(400).json({ success: false, message: "O campo 'plan' é obrigatório no corpo da requisição." });
    }

    console.log(`[SubscriptionController] Recebida requisição para criar/atualizar assinatura de teste para usuário ${userId} com plano ${plan} via MongoDB.`);
    const updatedSubscriptionData = await userService.activateTestSubscription(userId, plan);

    if (!updatedSubscriptionData) {
         console.error(`[SubscriptionController] activateTestSubscription não retornou dados atualizados para o usuário ${userId}.`);
         return res.status(500).json({ success: false, message: 'Falha ao ativar assinatura de teste.' });
    }

    return res.status(201).json({ 
      success: true,
      message: 'Assinatura de teste ativada/atualizada com sucesso no MongoDB.',
      data: updatedSubscriptionData 
    });
  } catch (error: any) { 
    console.error('[SubscriptionController] Erro ao criar/atualizar assinatura de teste:', error.message);
    if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
    return next(error); // Corrigido: adicionado return
  }
};