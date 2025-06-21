import mongoose from 'mongoose';
import { User } from '../src/models/User';

async function checkUser() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finup');
    console.log('Conectado ao MongoDB');

    // Verificar usuário pelo ID
    const userId = '6854d24ea4acb12e1bbfc5cb';
    const user = await User.findById(userId);
    
    if (user) {
      console.log('Usuário encontrado:', {
        id: user._id,
        email: user.email,
        firebaseUid: user.firebaseUid,
        subscription: user.subscription
      });
    } else {
      console.log('Usuário não encontrado pelo ID:', userId);
      
      // Tentar buscar por firebaseUid
      const users = await User.find({}).limit(5);
      console.log('Primeiros 5 usuários no banco:', users.map(u => ({
        id: u._id,
        email: u.email,
        firebaseUid: u.firebaseUid
      })));
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Erro:', error);
  }
}

checkUser(); 