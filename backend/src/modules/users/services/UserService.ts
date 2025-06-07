// backend/src/modules/users/services/UserService.ts
import jwt from 'jsonwebtoken';
import { injectable, inject } from 'inversify';
import bcrypt from 'bcryptjs';
import { getAuth } from 'firebase-admin/auth';
import { AppError } from '@core/errors/AppError';
import { UserRepository } from '../repositories/UserRepository';
import { IUser, ISubscription } from '@models/User';
import { IUserProfile, IUserWithTokens } from '../interfaces/user.interface';
// Importação corrigida para caminho relativo correto
import { TYPES } from '@core/types'; // <-- Caminho relativo correto
import { SubscriptionService as FirestoreSubscriptionService } from '@services/subscriptionService';

interface UpdateProfileData extends Partial<Pick<IUser, 'name' | 'email' | 'photoUrl'>> {
  currentPassword?: string;
  newPassword?: string;
}

@injectable()
export class UserService {
  private readonly auth = getAuth();

  constructor(
    @inject(TYPES.UserRepository) private readonly userRepository: UserRepository,
    @inject(TYPES.SubscriptionService) private readonly firestoreSubscriptionService: FirestoreSubscriptionService
  ) {}

  public formatUserProfile(user: IUser): IUserProfile {
    if (!user) {
        throw new AppError(500, 'Tentativa de formatar perfil de usuário nulo.');
    }
    return {
      id: user.id!,
      name: user.name,
      email: user.email,
      firebaseUid: user.firebaseUid,
      photoUrl: user.photoUrl,
      settings: user.settings || { theme: 'light', notifications: true },
      subscription: user.subscription,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private createTrialSubscription(firebaseUid: string): ISubscription {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 3); // 3 dias de trial

    return {
      plan: 'trial', // Novo plano para indicar o período de teste
      status: 'trialing', // Novo status para indicar que está em teste
      expiresAt: trialEndDate, // O trial expira e a "assinatura" expira neste ponto
      trialEndsAt: trialEndDate, // Data explícita de término do trial
      subscriptionId: `trial_${firebaseUid}_${Date.now()}`,
    };
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<IUserWithTokens> {
    try {
      if (await this.userRepository.findByEmail(userData.email)) {
        throw new AppError(400, 'Email já está em uso');
      }
      const firebaseUser = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name
      });

      const initialMongoSubscription = this.createTrialSubscription(firebaseUser.uid);

      const user = await this.userRepository.create({
        name: userData.name,
        email: userData.email,
        password: await bcrypt.hash(userData.password, 10),
        firebaseUid: firebaseUser.uid,
        settings: { theme: 'light', notifications: true },
        subscription: initialMongoSubscription
      });
      return {
        user: this.formatUserProfile(user),
        ...await this.generateTokens(user)
      };
    } catch (error) {
      const firebaseError = error as any;
       if (firebaseError.code === 'auth/email-already-in-use') {
           throw new AppError(400, 'Este email já está em uso.');
       }
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao registrar usuário', this.getErrorMessage(error));
    }
  }

  async login(email: string, password: string): Promise<IUserWithTokens> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user || !(user.password && await bcrypt.compare(password, user.password))) {
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
      const decodedToken = await this.auth.verifyIdToken(idToken);
      const { uid, email, name, picture } = decodedToken;
      if (!email) throw new AppError(400, 'Email não disponível no token do Google');
      let user = await this.userRepository.findByFirebaseUid(uid);
      if (!user) {
        const initialMongoSubscription = this.createTrialSubscription(uid);
        user = await this.userRepository.create({
          firebaseUid: uid,
          email,
          name: name || email.split('@')[0],
          photoUrl: picture,
          settings: { theme: 'light', notifications: true },
          subscription: initialMongoSubscription
        });
      }
      if (!user) throw new AppError(500, 'Falha ao criar ou encontrar usuário Google.');
      return {
        user: this.formatUserProfile(user),
        ...await this.generateTokens(user)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro no login com Google', this.getErrorMessage(error));
    }
  }

  async getProfile(mongoUserId: string): Promise<IUserProfile> {
    try {
      const user = await this.userRepository.findById(mongoUserId);
      if (!user) throw new AppError(404, 'Usuário não encontrado');
      return this.formatUserProfile(user);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao obter perfil', this.getErrorMessage(error));
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<IUser | null> {
    try {
      return await this.userRepository.findByFirebaseUid(firebaseUid);
    } catch (error) {
      console.error(`Erro ao buscar usuário por Firebase UID ${firebaseUid}:`, this.getErrorMessage(error));
      return null;
    }
  }

  async updateProfile(mongoUserId: string, updateData: UpdateProfileData): Promise<IUserProfile> {
    try {
      const userToUpdate = await this.userRepository.findById(mongoUserId);
      if (!userToUpdate) throw new AppError(404, 'Usuário não encontrado para atualizar perfil.');

      const { currentPassword, newPassword, ...fieldsToUpdate } = updateData;
      const payload: Partial<IUser> = {};
      const firebaseUpdatePayload: { email?: string; displayName?: string; photoURL?: string; password?: string } = {};

      if (fieldsToUpdate.email && fieldsToUpdate.email !== userToUpdate.email) {
        const existingUserWithEmail = await this.userRepository.findByEmail(fieldsToUpdate.email);
        if (existingUserWithEmail && existingUserWithEmail.id !== mongoUserId) {
          throw new AppError(400, 'Email já está em uso por outro usuário.');
        }
        if (!currentPassword) {
           throw new AppError(400, 'Senha atual é necessária para alterar o email.');
        }
        // Corrigido: userToToUpdate para userToUpdate na linha 178
        if (!userToUpdate.password || !(await bcrypt.compare(currentPassword, userToUpdate.password))) {
            throw new AppError(401, 'Senha atual incorreta.');
        }
        payload.email = fieldsToUpdate.email;
        firebaseUpdatePayload.email = fieldsToUpdate.email;
      }

      if (newPassword) {
         if (!currentPassword) {
            throw new AppError(400, 'Senha atual é necessária para alterar a senha.');
         }
         if (!userToUpdate.password || !(await bcrypt.compare(currentPassword, userToUpdate.password))) {
             throw new AppError(401, 'Senha atual incorreta.');
         }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        payload.password = hashedNewPassword;
        firebaseUpdatePayload.password = newPassword;
      }

      if (fieldsToUpdate.name !== undefined && fieldsToUpdate.name !== userToUpdate.name) {
         payload.name = fieldsToUpdate.name;
         firebaseUpdatePayload.displayName = fieldsToUpdate.name;
      }

      if (fieldsToUpdate.photoUrl !== undefined && fieldsToUpdate.photoUrl !== userToUpdate.photoUrl) {
         payload.photoUrl = fieldsToUpdate.photoUrl;
         firebaseUpdatePayload.photoURL = fieldsToUpdate.photoUrl;
      }

      if (Object.keys(payload).length > 0) {
         const updatedUser = await this.userRepository.updateById(mongoUserId, payload);
         if (!updatedUser) throw new AppError(404, 'Falha ao atualizar o usuário no MongoDB.');
         if (updatedUser.firebaseUid && Object.keys(firebaseUpdatePayload).length > 0) {
             await this.auth.updateUser(updatedUser.firebaseUid, firebaseUpdatePayload);
         }
         return this.formatUserProfile(updatedUser);
      } else {
         return this.formatUserProfile(userToUpdate);
      }

    } catch (error: any) {
       if (error.code && error.code.startsWith('auth/')) {
           throw new AppError(400, `Erro no Firebase Auth: ${error.message}`);
       }
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao atualizar perfil', this.getErrorMessage(error));
    }
  }

  async updateSettings(mongoUserId: string, settings: Partial<IUser['settings']>): Promise<IUserProfile> {
    const updatedUser = await this.userRepository.updateById(mongoUserId, { settings });
    if (!updatedUser) throw new AppError(404, 'Usuário não encontrado para atualizar configurações.');
    return this.formatUserProfile(updatedUser);
  }

  async verifyToken(token: string): Promise<IUser> {
    try {
      const decodedToken = await this.auth.verifyIdToken(token);
      const user = await this.userRepository.findByFirebaseUid(decodedToken.uid);
      if (!user) throw new AppError(404, 'Usuário (DB local) não encontrado para o token Firebase.');
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(401, 'Token Firebase inválido/expirado.', this.getErrorMessage(error));
    }
  }

  async updateSubscription(firebaseUid: string, subscriptionData: Partial<ISubscription>): Promise<IUserProfile> {
    const subDataToUpdate: Partial<ISubscription> = { ...subscriptionData };
    // Adicionar validação para os novos campos de trial se necessário ao atualizar diretamente
    if (subscriptionData.status && !['active', 'canceled', 'expired', 'pending', 'trialing'].includes(subscriptionData.status)) {
        throw new AppError(400, `Status de assinatura inválido: ${subscriptionData.status}`);
    }
    const updatedUser = await this.userRepository.updateUserSubscriptionByFirebaseUid(firebaseUid, subDataToUpdate);
    if (!updatedUser) {
      throw new AppError(404, 'Usuário não encontrado para atualizar assinatura.');
    }
    return this.formatUserProfile(updatedUser);
  }

  async activateTestSubscription(firebaseUid: string, plan: string): Promise<ISubscription | null> {
    if (!firebaseUid || !plan) {
      throw new AppError(400, 'Firebase UID e plano são obrigatórios.');
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Mantido como 30 dias para este método específico, pode ajustar se necessário

    const subscriptionDetails: ISubscription = {
      plan: plan, // O plano que será testado
      status: 'trialing', // Pode ser 'trialing' ou 'active' dependendo da lógica de negócio
      expiresAt: expiresAt,
      trialEndsAt: expiresAt, // Se for um teste, trialEndsAt é crucial
      subscriptionId: `test_${plan}_${firebaseUid}_${Date.now()}`,
    };

    const updatedUser = await this.userRepository.updateUserSubscriptionByFirebaseUid(firebaseUid, subscriptionDetails);
    if (!updatedUser || !updatedUser.subscription) {
      throw new AppError(500, `Falha ao definir assinatura de teste no MongoDB para ${firebaseUid}.`);
    }
    return updatedUser.subscription;
  }

  private async generateTokens(user: IUser): Promise<{ token: string; firebaseToken: string }> {
    console.log(`[UserService/generateTokens] Tentando ler process.env.APP_JWT_SECRET: "${process.env.APP_JWT_SECRET}"`);
    const jwtSecret = process.env.APP_JWT_SECRET;
    if (!jwtSecret) {
        console.error('CRÍTICO: APP_JWT_SECRET não definido (dentro do if).');
        throw new AppError(500, 'Configuração interna do servidor ausente (JWT Secret).');
    }
    const tokenPayload = { id: user.id, email: user.email, uid: user.firebaseUid };
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '7d' });
    let firebaseToken = '';
    if (user.firebaseUid) {
      try { firebaseToken = await this.auth.createCustomToken(user.firebaseUid); }
      catch (fbTokenError) { console.error(`Erro ao criar custom token Firebase para ${user.firebaseUid}:`, fbTokenError); }
    }
    return { token, firebaseToken };
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof AppError) return error.message;
    if (error instanceof Error) return error.message;
    return 'Ocorreu um erro desconhecido no serviço.';
  }
}
