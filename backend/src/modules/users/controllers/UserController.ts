// src/modules/users/controllers/UserController.ts
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
// Importação modificada para caminho relativo
import { TYPES } from '@core/types';
import { AppError } from '@core/errors/AppError';
import { User } from '../../../models/User';
import { stripe } from '../../../config/stripe';

interface SubscriptionInfo {
  status: string;
  planName: string;
}

@injectable()
export class UserController {
  constructor(
    @inject(TYPES.UserService) private readonly userService: UserService
  ) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const result = await this.userService.register({ name, email, password });
      res.status(201).json({
        success: true,
        data: {
          user: { // Retornando dados formatados do perfil
            id: result.user.id,
            email: result.user.email,
            name: result.user.name, // Usar name que está no IUserProfile
            photoURL: result.user.photoUrl || null
          },
          token: result.token,
          firebaseToken: result.firebaseToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, token, firebaseToken } = await this.userService.login(email, password);
      res.status(200).json({
        success: true,
        user: { // Retornando dados formatados do perfil
          id: user.id,
          email: user.email,
          name: user.name,
          photoURL: user.photoUrl || null
        }, 
        token,
        firebaseToken
      });
    } catch (error) {
      next(error);
    }
  }

  async loginWithGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        throw new AppError(400, 'Token do Google é obrigatório');
      }
      const result = await this.userService.loginWithGoogle(idToken);
      res.status(200).json({
        success: true,
        user: { // Retornando dados formatados do perfil
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          photoURL: result.user.photoUrl
        },
        token: result.token,
        firebaseToken: result.firebaseToken
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const user = await User.findOne({ firebaseUid: userId });
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      // Buscar informações da assinatura no Stripe
      let subscriptionInfo: SubscriptionInfo | null = null;
      if (user.subscription?.stripeCustomerId && !user.subscription.stripeCustomerId.startsWith('trial_')) {
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: user.subscription.stripeCustomerId,
            status: 'active',
            limit: 1
          });

          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            subscriptionInfo = {
              status: subscription.status,
              planName: subscription.metadata.planName || 'Plano Ativo'
            };
          }
        } catch (stripeError) {
          console.error('Erro ao buscar assinatura no Stripe:', stripeError);
        }
      }

      // Se não encontrou no Stripe, usar dados do banco
      if (!subscriptionInfo && user.subscription) {
        subscriptionInfo = {
          status: user.subscription.status || 'trialing',
          planName: user.subscription.plan || 'Trial'
        };
      }

      res.json({
        name: user.name,
        email: user.email,
        subscription: subscriptionInfo
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ error: 'Erro ao buscar perfil do usuário' });
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) { // Precisamos do ID do MongoDB para atualizar no DB
         throw new AppError(401, 'Usuário não autenticado ou ID do MongoDB não encontrado.');
       }
      const mongoUserId = req.user.id; // ID do MongoDB do usuário autenticado
      const { name, email, photoUrl } = req.body;

      if (!name && !email && !photoUrl) {
        throw new AppError(400, 'Nenhum dado para atualização fornecido (nome, email ou photoUrl)');
      }

      // userService.updateProfile espera o ID do MongoDB
      const updatedProfile = await this.userService.updateProfile(mongoUserId, { name, email, photoUrl });

      res.status(200).json({
        success: true,
        data: updatedProfile,
        message: 'Perfil atualizado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
     try {
       if (!req.user?.id) { // Precisamos do ID do MongoDB para atualizar no DB
          throw new AppError(401, 'Usuário não autenticado ou ID do MongoDB não encontrado.');
       }
       const mongoUserId = req.user.id; // ID do MongoDB do usuário autenticado
       const { settings } = req.body;

       if (!settings || typeof settings !== 'object') {
         throw new AppError(400, 'Objeto de configurações é obrigatório e deve ser um objeto.');
       }
       // userService.updateSettings espera o ID do MongoDB
       const updatedProfile = await this.userService.updateSettings(mongoUserId, settings);

       res.status(200).json({
         success: true,
         data: updatedProfile,
         message: 'Configurações atualizadas com sucesso.'
       });
     } catch (error) {
       next(error);
     }
  }

  async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const token = req.body.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
          throw new AppError(400, 'Token é obrigatório');
        }
        // userService.verifyToken espera o token do Firebase Auth
        const userFromDb = await this.userService.verifyToken(token);

        // Retorna um perfil formatado, não o objeto IUser completo do DB
        res.status(200).json({
          success: true,
          user: this.userService.formatUserProfile(userFromDb) // Usando formatUserProfile do serviço
        });
      } catch (error) {
         next(error);
      }
  }

   async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uid } = req.params; // uid aqui é o firebaseUid
      const userByFirebaseUid = await this.userService.getUserByFirebaseUid(uid);
       if (!userByFirebaseUid) { 
           throw new AppError(404, 'Usuário não encontrado.');
       }
      // Retorna um perfil formatado
      res.status(200).json({
        success: true,
        data: this.userService.formatUserProfile(userByFirebaseUid)
      });
    } catch (error) {
      next(error);
    }
  }

  // Rota para atualizar a assinatura de um usuário (ex: admin ou webhook)
  // O firebaseUid vem dos parâmetros da rota, e os dados da assinatura do corpo.
  async updateSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uid } = req.params; // uid aqui é o firebaseUid
      const subscriptionData = req.body;

      if (!uid) {
        throw new AppError(400, 'Firebase UID do usuário é obrigatório nos parâmetros da rota.');
      }
      // Validação básica dos dados da assinatura
      if (!subscriptionData || typeof subscriptionData !== 'object') { 
        throw new AppError(400, 'Dados da assinatura são obrigatórios e devem ser um objeto.');
      }
      // Adicione mais validações para plan, status, expiresAt se necessário aqui

      // O método updateSubscription no UserService agora espera o firebaseUid
      const updatedUserProfile = await this.userService.updateSubscription(uid, subscriptionData);

      res.status(200).json({
        success: true,
        data: updatedUserProfile,
        message: 'Assinatura do usuário atualizada com sucesso.'
      });
    } catch (error) {
      next(error);
    }
  }
}
// Adicione outros métodos conforme necessári