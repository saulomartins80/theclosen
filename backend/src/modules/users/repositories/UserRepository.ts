// backend/src/modules/users/repositories/UserRepository.ts
import { injectable } from 'inversify';
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
  
  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<IUser | null> {
    return this.model.findOne({ 'subscription.stripeSubscriptionId': stripeSubscriptionId }).exec();
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    if (!this.model) throw new Error('UserRepository: model not initialized');
    const newUser = new this.model(userData);
    return newUser.save();
  }

  async update(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    if (!this.model) throw new Error('UserRepository: model not initialized');
    return this.model.findByIdAndUpdate(id, userData, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    if (!this.model) throw new Error('UserRepository: model not initialized');
    await this.model.findByIdAndDelete(id).exec();
  }

  async updateUserSubscriptionByFirebaseUid(firebaseUid: string, subscriptionData: Partial<ISubscription>): Promise<IUser | null> {
    if (!this.model) throw new Error('UserRepository: model not initialized');
    if (!firebaseUid || !subscriptionData) {
      console.warn('[UserRepository] updateUserSubscriptionByFirebaseUid: firebaseUid ou subscriptionData ausente.');
      return null; 
    }
    try {
      const setUpdate: { [key: string]: any } = {};
      if (subscriptionData) {
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

  async updateUserSubscription(userId: string, subscriptionData: Partial<ISubscription>): Promise<IUser | null> {
    const updateQuery: { [key: string]: any } = {};
    for (const key in subscriptionData) {
      if (Object.prototype.hasOwnProperty.call(subscriptionData, key)) {
        updateQuery[`subscription.${key}`] = (subscriptionData as any)[key];
      }
    }
    
    return this.model.findOneAndUpdate(
      { firebaseUid: userId },
      { $set: updateQuery },
      { new: true, runValidators: true }
    ).exec();
  }

  async updateSubscription(userId: string, subscription: Partial<ISubscription>): Promise<IUser | null> {
    return this.model.findByIdAndUpdate(
      userId,
      { $set: { subscription } },
      { new: true }
    ).exec();
  }
}
