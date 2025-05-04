// src/modules/users/controllers/UserController.ts.
import { getAuth } from 'firebase-admin/auth';
import { injectable, inject } from 'inversify';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { TYPES } from '@core/types';
import { IUserWithTokens } from '../interfaces/user.interface';
import { AppError } from '@core/errors/AppError';

@injectable()
export class UserController {
  private readonly auth = getAuth();

  constructor(
    @inject(TYPES.UserService) private readonly userService: UserService
  ) {}

  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        throw new AppError(400, 'Nome, email e senha são obrigatórios');
      }

      const result = await this.userService.register({ name, email, password });

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
      this.handleError(res, error, 'Erro ao registrar usuário');
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        throw new AppError(400, 'Email e senha são obrigatórios');
      }

      const { user, token, firebaseToken } = await this.userService.login(email, password);
      
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
      this.handleError(res, error, 'Erro ao fazer login');
    }
  }

  async loginWithGoogle(req: Request, res: Response) {
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
      this.handleError(res, error, 'Erro no login com Google');
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (req.user?.uid !== userId) {
        throw new AppError(403, 'Não autorizado');
      }

      const user = await this.userService.getProfile(userId);
      res.json(user);
    } catch (error) {
      this.handleError(res, error, 'Erro ao obter perfil');
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user?.uid) {
        throw new AppError(401, 'Usuário não autenticado');
      }

      const { name, email } = req.body;

      if (!name && !email) {
        throw new AppError(400, 'Nenhum dado para atualização fornecido');
      }

      const updatedProfile = await this.userService.updateProfile(req.user.uid, { name, email });

      res.status(200).json({
        success: true,
        data: updatedProfile,
        message: 'Perfil atualizado com sucesso'
      });
    } catch (error) {
      this.handleError(res, error, 'Erro ao atualizar perfil');
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const { settings } = req.body;

      if (!settings) {
        throw new AppError(400, 'Configurações são obrigatórias');
      }

      const updatedProfile = await this.userService.updateSettings(uid, settings);
      
      res.status(200).json({
        success: true,
        data: updatedProfile
      });
    } catch (error) {
      this.handleError(res, error, 'Erro ao atualizar configurações');
    }
  }

  async verifyToken(req: Request, res: Response) {
    try {
      const token = req.body.token || req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new AppError(400, 'Token é obrigatório');
      }

      const user = await this.userService.verifyToken(token);
      
      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Erro ao verificar token');
    }
  }

  async getUser(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const user = await this.userService.getProfile(uid);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      this.handleError(res, error, 'Erro ao obter dados do usuário');
    }
  }

  async updateSubscription(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const subscriptionData = req.body;

      if (!subscriptionData || !subscriptionData.plan || !subscriptionData.status || !subscriptionData.expiresAt) {
        throw new AppError(400, 'Dados da assinatura são obrigatórios');
      }

      const updatedUser = await this.userService.updateSubscription(uid, subscriptionData);
      
      res.status(200).json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      this.handleError(res, error, 'Erro ao atualizar assinatura');
    }
  }

  private handleError(
    res: Response,
    error: unknown,
    defaultMessage: string,
    includeDetails: boolean = true
  ) {
    if (error instanceof Error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          ...(includeDetails && 'details' in error && { details: error.details })
        });
      }

      console.error(defaultMessage, error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && includeDetails && {
          details: error.message
        })
      });
    }

    console.error(defaultMessage, 'Erro desconhecido:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}