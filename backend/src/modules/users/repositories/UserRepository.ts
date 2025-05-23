// backend/src/modules/users/repositories/UserRepository.ts
import { injectable } from 'inversify';
// CORRIGIDA A IMPORTAÇÃO: Usar importação nomeada para User e importar ISubscription
import { User as UserModel, IUser, ISubscription } from '../../../models/User'; 

@injectable()
export class UserRepository {
  private model = UserModel; 

  async findByEmail(email: string): Promise<IUser | null> {
    if (!this.model) throw new Error('UserRepository: model not initialized');
    return this.model.findOne({ email }).exec();
  }

  async findByFirebaseUid(firebaseUid: string): Promise<IUser | null> {
    if (!this.model) throw new Error('UserRepository: model not initialized');
    return this.model.findOne({ firebaseUid }).exec();
  }

  async findById(id: string): Promise<IUser | null> {
    if (!this.model) throw new Error('UserRepository: model not initialized');
    return this.model.findById(id).exec();
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    if (!this.model) throw new Error('UserRepository: model not initialized');
    const newUser = new this.model(userData);
    return newUser.save();
  }

  async updateById(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    if (!this.model) throw new Error('UserRepository: model not initialized');
    return this.model.findByIdAndUpdate(id, { $set: updateData, updatedAt: new Date() }, { new: true, runValidators: true }).exec();
  }

  // CORRIGIDA A ASSINATURA DO MÉTODO: aceitar Partial<ISubscription>
  async updateUserSubscriptionByFirebaseUid(firebaseUid: string, subscriptionData: Partial<ISubscription>): Promise<IUser | null> {
    if (!this.model) throw new Error('UserRepository: model not initialized');
    if (!firebaseUid || !subscriptionData) {
      console.warn('[UserRepository] updateUserSubscriptionByFirebaseUid: firebaseUid ou subscriptionData ausente.');
      return null; 
    }
    try {
      const setUpdate: { [key: string]: any } = {};
      if (subscriptionData) {
        // Iterar sobre as chaves de subscriptionData para construir o objeto de atualização $set
        (Object.keys(subscriptionData) as Array<keyof ISubscription>).forEach(key => {
            if (subscriptionData[key] !== undefined) { 
                setUpdate[`subscription.${key}`] = subscriptionData[key];
            }
        });
      }
      setUpdate['updatedAt'] = new Date();

      if (Object.keys(setUpdate).length <= 1 && setUpdate['updatedAt']) {
        console.warn(`[UserRepository] Tentativa de atualizar assinatura para ${firebaseUid} sem dados de assinatura válidos para $set.`);
        return this.model.findOne({ firebaseUid }).exec(); 
      }

      const user = await this.model.findOneAndUpdate(
        { firebaseUid: firebaseUid },
        { $set: setUpdate },
        { new: true, runValidators: true }
      ).exec();
      
      if (!user) {
        console.warn(`[UserRepository] Usuário com firebaseUid ${firebaseUid} não encontrado para atualizar assinatura.`);
      } else {
        console.log(`[UserRepository] Assinatura atualizada para ${firebaseUid}. Novo user.subscription:`, user.subscription);
      }
      return user;
    } catch (error) {
      console.error(`[UserRepository] Erro ao atualizar assinatura para firebaseUid ${firebaseUid}:`, error);
      throw error; 
    }
  }
}