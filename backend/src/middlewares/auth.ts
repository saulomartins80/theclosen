import { Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { AuthRequest } from '../types/auth';
import { User } from '../models/User';

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    req.user = {
      _id: user._id.toString(),
      uid: user.firebaseUid,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      subscription: user.subscription
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
}; 