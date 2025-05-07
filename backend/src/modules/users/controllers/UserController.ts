// src/modules/users/controllers/UserController.ts
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express'; // Import Request, Response, NextFunction
import { UserService } from '../services/UserService'; // Importação ajustada
import { TYPES } from '@core/types';
import { AppError } from '@core/errors/AppError';

@injectable()
export class UserController {
  constructor(
    @inject(TYPES.UserService) private readonly userService: UserService // Injeta o UserService
  ) {}

  // Métodos do controlador que recebem req, res, next e delegam ao UserService

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      // Chama o método register do UserService
      const result = await this.userService.register({ name, email, password });

      // Envia a resposta
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            displayName: result.user.name,
            photoURL: result.user.photoUrl || null
          },
          token: result.token,
          firebaseToken: result.firebaseToken
        }
      });
    } catch (error) {
      next(error); // Passa o erro para o próximo middleware/manipulador de erros
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Chama o método login do UserService
      const { user, token, firebaseToken } = await this.userService.login(email, password);

      // Envia a resposta
      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          displayName: user.name,
          photoURL: user.photoUrl || null
        }, 
        token,
        firebaseToken
      });
    } catch (error) {
      next(error); // Passa o erro
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
        user: {
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


  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Após o middleware authenticate, req.user deve estar populado
      // Usar req.user.id (ID do MongoDB) para buscar o perfil no UserService
      if (!req.user?.id) { 
         throw new AppError(401, 'ID de usuário não disponível na requisição autenticada');
      }
      // Chama o método getProfile do UserService com o ID do MongoDB
      const user = await this.userService.getProfile(req.user.id); 

      // Envia a resposta
      res.json(user);
    } catch (error) {
      next(error); // Passa o erro
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Após o middleware authenticate, req.user deve estar populado
       if (!req.user?.uid) { // Usar uid para atualizar no Firebase se o service precisar
         throw new AppError(401, 'Usuário não autenticado');
       }

      const { name, email } = req.body;

      if (!name && !email) {
        throw new AppError(400, 'Nenhum dado para atualização fornecido');
      }

      // Chama o método updateProfile do UserService
      const updatedProfile = await this.userService.updateProfile(req.user.uid, { name, email }); // Assumindo que updateProfile no service usa UID

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
       // Após o middleware authenticate, req.user deve estar populado
       if (!req.user?.uid) {
          throw new AppError(401, 'Usuário não autenticado');
       }
       const userIdToUpdate = req.user.uid; // Usar o UID do usuário autenticado

       const { settings } = req.body;

       if (!settings) {
         throw new AppError(400, 'Configurações são obrigatórias');
       }
       // Chama o método updateSettings do UserService
       const updatedProfile = await this.userService.updateSettings(userIdToUpdate, settings);

       res.status(200).json({
         success: true,
         data: updatedProfile
       });
     } catch (error) {
       next(error);
     }
  }

  async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        // Este método é chamado por uma rota pública, então req.user não está populado pelo authenticate
        const token = req.body.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
          throw new AppError(400, 'Token é obrigatório');
        }
        // Chama o método verifyToken do UserService
        const user = await this.userService.verifyToken(token); // UserService verifyToken lida com ambos os tipos de token

        res.status(200).json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        });
      } catch (error) {
         next(error);
      }
  }

   async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uid } = req.params;
      // Chama o método do UserService para buscar usuário por Firebase UID
      const userByUid = await this.userService.getUserByFirebaseUid(uid);
       if (!userByUid) { 
           throw new AppError(404, 'Usuário não encontrado');
       }

      res.status(200).json({
        success: true,
        data: userByUid
      });
    } catch (error) {
      next(error);
    }
  }

    async updateSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { uid } = req.params;
        const userIdToUpdate = uid;
        const subscriptionData = req.body;

        if (!subscriptionData || !subscriptionData.plan || !subscriptionData.status || !subscriptionData.expiresAt) { 
          throw new AppError(400, 'Dados da assinatura são obrigatórios');
        }

        // Primeiro, obtenha o ID do MongoDB a partir do Firebase UID
        const user = await this.userService.getUserByFirebaseUid(userIdToUpdate);
         if (!user) { 
             throw new AppError(404, 'Usuário não encontrado');
         }
        const mongoId = user.id;

        // Chama o método updateSubscription do UserService com o ID do MongoDB
        const updatedUser = await this.userService.updateSubscription(mongoId, subscriptionData);

        res.status(200).json({
          success: true,
          data: updatedUser
        });
      } catch (error) {
        next(error);
      }
   }

  // Remove o método handleError local, assumindo um manipulador de erros global
  // private handleError... 
}
