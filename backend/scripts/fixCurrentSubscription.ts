import mongoose from 'mongoose';
import { User } from '../src/models/User';

async function fixCurrentSubscription() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finup');
    console.log('Conectado ao MongoDB');

    // Buscar usuário pelo firebaseUid
    const firebaseUid = 'e0X4BbOCmPN7xAlRCTNUr8wF1Dq1';
    const user = await User.findOne({ firebaseUid });
    
    if (user) {
      console.log('Usuário encontrado:', {
        id: user._id,
        email: user.email,
        firebaseUid: user.firebaseUid,
        subscription: user.subscription
      });

      // Atualizar a assinatura para o plano correto
      const updatedUser = await User.findByIdAndUpdate(user._id, {
        'subscription.status': 'active',
        'subscription.plan': 'essencial',
        'subscription.currentPeriodEnd': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        'subscription.expiresAt': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        'subscription.stripeSubscriptionId': 'sub_1Rc5YeQgQT6xG1UilSuDgcSG',
        'subscription.stripeCustomerId': 'cus_SWzR9P43N5t4hK',
        'subscription.stripePriceId': 'price_1RZ1JOQgQT6xG1Ui6BArqfvI',
        'subscription.cancelAtPeriodEnd': false,
        'subscription.updatedAt': new Date()
      }, { new: true });

      console.log('Usuário atualizado com sucesso:', {
        id: updatedUser?._id,
        subscription: updatedUser?.subscription
      });
    } else {
      console.log('Usuário não encontrado');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Erro:', error);
  }
}

fixCurrentSubscription(); 