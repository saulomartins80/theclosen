// src/modules/users/services/UserService.ts
import jwt from 'jsonwebtoken';
import { injectable, inject } from 'inversify';
import { User } from '@models/User';
import bcrypt from 'bcryptjs';
import { getAuth } from 'firebase-admin/auth';
import { AppError } from '@core/errors/AppError';
import { UserRepository } from '../repositories/UserRepository';
import { IUser, IUserProfile, IUserWithTokens } from '../interfaces/user.interface';
import { TYPES } from '@core/types';

@injectable()
export class UserService {
  private readonly auth = getAuth();

  constructor(
    @inject(TYPES.UserRepository) private readonly userRepository: UserRepository
  ) {}

  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<IUserWithTokens> {
    try {
      // Verifica se email já existe
      if (await this.userRepository.findByEmail(userData.email)) {
        throw new AppError(400, 'Email já está em uso');
      }

      // Cria usuário no Firebase
      const firebaseUser = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name
      });

      // Cria usuário no banco de dados
      const user = await this.userRepository.create({
        name: userData.name,
        email: userData.email,
        password: await bcrypt.hash(userData.password, 10),
        firebaseUid: firebaseUser.uid,
        settings: {
          theme: 'light',
          notifications: true
        }
      });

      return {
        user: this.formatUserProfile(user),
        ...await this.generateTokens(user)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao registrar usuário', this.getErrorMessage(error));
    }
  }

  async login(email: string, password: string): Promise<IUserWithTokens> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user || !await bcrypt.compare(password, user.password)) {
        throw new AppError(401, 'Credenciais inválidas');
      }

      return {
        user: this.formatUserProfile(user),
        ...await this.generateTokens(user)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao fazer login', this.getErrorMessage(error));
    }
  }

  async loginWithGoogle(idToken: string): Promise<IUserWithTokens> {
    try {
      // Verifica o token do Google
      const decodedToken = await this.auth.verifyIdToken(idToken);
      const { uid, email, name, picture } = decodedToken;

      if (!email) throw new AppError(400, 'Email não disponível no token do Google');

      // Verifica se usuário já existe
      let user = await this.userRepository.findByFirebaseUid(uid);

      if (!user) {
        // Cria novo usuário se não existir
        user = await this.userRepository.create({
          firebaseUid: uid,
          email,
          name: name || email.split('@')[0],
          photoUrl: picture,
          settings: {
            theme: 'light',
            notifications: true
          }
        });
      }

      return {
        user: this.formatUserProfile(user),
        ...await this.generateTokens(user)
      };
    } catch (error) {
      throw new AppError(500, 'Erro no login com Google', this.getErrorMessage(error));
    }
  }

  async getProfile(userId: string): Promise<IUserProfile> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) throw new AppError(404, 'Usuário não encontrado');
      return this.formatUserProfile(user);
    } catch (error) {
      throw new AppError(500, 'Erro ao obter perfil', this.getErrorMessage(error));
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<IUser | null> {
    try {
      return await this.userRepository.findByFirebaseUid(firebaseUid);
    } catch (error) {
      throw new AppError(500, 'Erro ao buscar usuário', this.getErrorMessage(error));
    }
  }

  async updateProfile(userId: string, updateData: Partial<IUser>): Promise<IUserProfile> {
    try {
      if (updateData.email) {
        const existingUser = await this.userRepository.findByEmail(updateData.email);
        if (existingUser && existingUser.id !== userId) {
          throw new AppError(400, 'Email já está em uso por outro usuário');
        }
      }

      const updatedUser = await this.userRepository.update(userId, updateData);
      if (!updatedUser) throw new AppError(404, 'Usuário não encontrado');

      // Atualiza no Firebase se necessário
      if (updateData.email && updatedUser.firebaseUid) {
        await this.auth.updateUser(updatedUser.firebaseUid, { 
          email: updateData.email,
          displayName: updateData.name || updatedUser.name
        });
      }

      return this.formatUserProfile(updatedUser);
    } catch (error) {
      throw new AppError(500, 'Erro ao atualizar perfil', this.getErrorMessage(error));
    }
  }

  async updateSettings(userId: string, settings: any): Promise<IUserProfile> {
    const updatedUser = await this.userRepository.update(userId, { settings });
    if (!updatedUser) {
      throw new AppError(404, 'Usuário não encontrado');
    }
    return this.formatUserProfile(updatedUser);
  }

  async verifyToken(token: string): Promise<IUser> {
    try {
      // Tenta verificar como token Firebase primeiro
      const decoded = await this.auth.verifyIdToken(token);
      const user = await this.userRepository.findByFirebaseUid(decoded.uid);
      if (!user) throw new AppError(404, 'Usuário não encontrado');
      return user;
    } catch (firebaseError) {
      // Se falhar, tenta como JWT
      if (!process.env.JWT_SECRET) {
        throw new AppError(500, 'Configuração JWT inválida');
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
      const user = await this.userRepository.findById(decoded.id);
      if (!user) throw new AppError(404, 'Usuário não encontrado');
      return user;
    }
  }

  async updateSubscription(userId: string, subscriptionData: {
    plan: string;
    status: string;
    expiresAt: Date;
  }): Promise<IUserProfile> {
    const updatedUser = await this.userRepository.update(userId, {
      subscription: subscriptionData
    });
    if (!updatedUser) {
      throw new AppError(404, 'Usuário não encontrado');
    }
    return this.formatUserProfile(updatedUser);
  }

  private async generateTokens(user: IUser): Promise<{ token: string; firebaseToken: string }> {
    if (!process.env.JWT_SECRET) {
      throw new AppError(500, 'Configuração JWT inválida');
    }

    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const firebaseToken = user.firebaseUid 
      ? await this.auth.createCustomToken(user.firebaseUid)
      : '';

    return { token, firebaseToken };
  }

  private formatUserProfile(user: IUser): IUserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      photoUrl: user.photoUrl,
      settings: user.settings || {},
      subscription: user.subscription,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Erro desconhecido';
  }
}