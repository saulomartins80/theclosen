// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '@config/firebaseAdmin';
import { AppError } from '@core/errors/AppError';

declare module 'express' {
  interface Request {
    user?: {
      uid: string;
      id?: string;
      email?: string;
      name?: string;
    };
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Não autorizado' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    req.user = decodedToken;
    next();
  } catch (error) {
    next(error);
  }
};