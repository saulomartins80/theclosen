// src/modules/users/repositories/UserRepository.ts
import { injectable } from 'inversify';
import { User } from '@models/User';
import { IUser } from '../interfaces/user.interface';
import { AppError } from '@core/errors/AppError';

@injectable()
export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).exec();
  }

  async findById(id: string): Promise<IUser> {
    const user = await User.findById(id).exec();
    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }
    return user;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<IUser> {
    const user = await User.findOne({ firebaseUid }).exec();
    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }
    return user;
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new AppError(400, 'Erro ao criar usuário', error);
    }
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser> {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true // Ativa validações do schema durante atualização
      }
    ).exec();

    if (!updatedUser) {
      throw new AppError(404, 'Usuário não encontrado para atualização');
    }

    return updatedUser;
  }

  // Método adicional recomendado para verificação de existência
  async exists(id: string): Promise<boolean> {
    const user = await User.findById(id).select('_id').lean();
    return !!user;
  }
}