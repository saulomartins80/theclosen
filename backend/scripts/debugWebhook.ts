import mongoose from 'mongoose';
import { User } from '../src/models/User';

async function debugWebhook() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finup');
    console.log('Conectado ao MongoDB');

    const userId = '6854d24ea4acb12e1bbfc5cb';
    
    // Verificar se o ID é válido
    console.log('ID fornecido:', userId);
    console.log('É um ObjectId válido?', mongoose.Types.ObjectId.isValid(userId));
    
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);
      console.log('Usuário encontrado por ID:', user ? 'SIM' : 'NÃO');
      
      if (user) {
        console.log('Dados do usuário:', {
          _id: user._id,
          email: user.email,
          firebaseUid: user.firebaseUid,
          subscription: user.subscription
        });
      }
    }
    
    // Listar todos os usuários
    const allUsers = await User.find({});
    console.log('Total de usuários no banco:', allUsers.length);
    
    allUsers.forEach((user, index) => {
      console.log(`Usuário ${index + 1}:`, {
        _id: user._id.toString(),
        email: user.email,
        firebaseUid: user.firebaseUid
      });
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Erro:', error);
  }
}

debugWebhook(); 