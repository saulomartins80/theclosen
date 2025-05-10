// BACKEND: SRC/ROUTES/AUTHROUTES.TS
import express, { Request, Response, NextFunction } from 'express';
import { container } from '@core/container';
import { TYPES } from '@core/types';
import { UserController } from '@modules/users/controllers/UserController';
import { UserService } from '@modules/users/services/UserService'; // Import UserService
import { SubscriptionService } from '../services/subscriptionService'; // Caminho ajustado
import { authenticate } from '@middlewares/authMiddleware';
import admin from 'firebase-admin';
import { AppError } from '@core/errors/AppError';
import { validate } from '@modules/users/middlewares/validate';
import { userValidators } from '@modules/users/validators/userValidators';
import jwt from 'jsonwebtoken';
import { getAuth } from 'firebase-admin/auth';
// Imports corrigidos para usar aliases do tsconfig para firebase/admin e types/Subscription
import { adminFirestore, adminAuth } from '@config/firebaseAdmin'; 
import { Subscription } from '../types/Subscription'; 

const JWT_SECRET = process.env.JWT_SECRET || 'c601';
const firebaseAdminAuth = getAuth(); // auth do firebase-admin/auth // Renomeado para evitar conflito de nome

const router = express.Router();
const userController = container.get<UserController>(TYPES.UserController);
const subscriptionService = container.get<SubscriptionService>(TYPES.SubscriptionService);
const userService = container.get<UserService>(TYPES.UserService); // Get UserService instance

// Handler assíncrono (verifique se este asyncHandler é necessário ou se você tem um global)
const asyncHandler = <T = any>(
  fn: (req: Request<T>, res: Response, next: NextFunction) => Promise<void>
) => {
  return async (req: Request<T>, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Função para processar sessão (mantida, mas a lógica principal foi movida para a rota POST /session abaixo)
const processSession = async (userId: string, res: express.Response) => {
  try {
    // Esta função parece usar o firebaseAdminAuth.getUser e subscriptionService.
    // Para consistência, deveria usar o userService para obter todos os dados do MongoDB.
    const mongoUser = await userService.getUserByFirebaseUid(userId);
    if (!mongoUser) {
      throw new AppError(404, 'Usuário não encontrado no MongoDB para processar sessão.');
    }

    res.status(200).json({
      status: 'success',
      data: {
        uid: mongoUser.firebaseUid,
        email: mongoUser.email,
        name: mongoUser.name,
        photoUrl: mongoUser.photoUrl || null,
        subscription: mongoUser.subscription
      }
    });
  } catch (error) {
    // Não jogue AppError aqui se for usada em um contexto que não espera next(error)
    console.error('Error in processSession:', error);
    throw error; // Re-lança o erro para ser pego pelo asyncHandler ou outro handler
  }
};

// Rotas públicas ajustadas (chamando controller com req, res, next)
router.post('/register', 
  validate(userValidators.register),
  asyncHandler((req, res, next) => userController.register(req, res, next)) // Passa next
);

router.post('/login',
  validate(userValidators.login),
  asyncHandler((req, res, next) => userController.login(req, res, next)) // Passa next
);

// Rota de verificação de token (chamando controller com req, res, next)
router.post('/verify-token',
  asyncHandler((req, res, next) => userController.verifyToken(req, res, next)) // verifyToken no controller agora espera req, res, next
);

router.post('/session', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  console.log('--- DEBUG: Inside POST /api/auth/session handler ---');
  console.log('POST /api/auth/session received.');
  console.log('Request Content-Type:', req.headers['content-type']);
  console.log('Type of req.body:', typeof req.body);
  console.log('Value of req.body:', req.body);

  try {
    const bodyToken = (typeof req.body === 'object' && req.body !== null && 'token' in req.body)
      ? req.body.token as string
      : undefined;

    console.log('Token from body (explicit check):', bodyToken);

    const token = req.cookies.token || 
                 req.headers.authorization?.split(' ')[1] || 
                 bodyToken;

    console.log('Final Extracted Token (before verifyIdToken):', token);

    if (!token) {
      console.log('No token found. Returning user: null.');
      res.status(200).json({ user: null });
      return; 
    }

    console.log('Verifying token with Firebase Admin...');
    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log('Token verified. Firebase UID:', decodedToken.uid);
    
    // --- MODIFICATION: Fetch user from MongoDB using UserService ---
    const mongoUser = await userService.getUserByFirebaseUid(decodedToken.uid);

    if (!mongoUser) {
      // User exists in Firebase but not in MongoDB. This is an issue.
      // Should this create a user in MongoDB? Or is it an error?
      // For now, treating as an error to prevent partial sessions.
      console.error(`User with Firebase UID ${decodedToken.uid} found in Firebase but not in MongoDB.`);
      // Clear cookies and return error like in the main catch block
      res.setHeader('Set-Cookie', [
        'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
        'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      ]);
      res.status(404).json({ 
          user: null, 
          error: 'Usuário autenticado via Firebase não encontrado em nossa base de dados.'
      }); 
      return;
    }
    console.log('MongoDB user found:', mongoUser.email, 'Name:', mongoUser.name);
    // --- END MODIFICATION ---

    // Subscription is now part of mongoUser, no need to call subscriptionService separately here.
    const subscription = mongoUser.subscription;
    if (subscription) {
      console.log('Subscription found on MongoDB user object.', subscription);
    } else {
      console.log('No subscription found on MongoDB user object.');
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 5 // 5 dias
    };

    console.log('Setting cookies.');
    // User cookie for frontend should contain data from MongoDB
    const userCookiePayload = {
        uid: mongoUser.firebaseUid, // Firebase UID
        email: mongoUser.email,     // Email from MongoDB
        name: mongoUser.name,       // Name from MongoDB
        photoUrl: mongoUser.photoUrl // Photo URL from MongoDB
    };

    res.setHeader('Set-Cookie', [
      `token=${token}; ${Object.entries(cookieOptions)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ')}`,
      `user=${encodeURIComponent(JSON.stringify(userCookiePayload))}; ${Object.entries({
        ...cookieOptions,
        httpOnly: false
      }).map(([k, v]) => `${k}=${v}`).join('; ')}`
    ]);

    console.log('Session sync successful. Returning user data from MongoDB.');
    res.status(200).json({
      user: { // Return user data from MongoDB
        uid: mongoUser.firebaseUid,
        email: mongoUser.email,
        name: mongoUser.name,
        photoUrl: mongoUser.photoUrl,
        subscription: mongoUser.subscription // Subscription from MongoDB user
      }
    }); 

  } catch (error) {
    console.error('Session sync error caught in handler:', error);
    res.setHeader('Set-Cookie', [
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
      'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);
    res.status(200).json({ 
      user: null,
      error: error instanceof Error ? error.message : 'Session sync error'
    }); 
  }
}));

// Rota GET /session existente (mantida)
router.get('/session', 
  authenticate,
   asyncHandler(async (req, res, next) => {
    if (!req.user?.id) { // Check for MongoDB ID from authenticate middleware
      return next(new AppError(401, 'Usuário não autenticado ou ID do MongoDB não encontrado na sessão.'));
    }
    // req.user.uid here is Firebase UID, req.user.id is MongoDB ID
    // processSession should ideally use the MongoDB ID if possible, or be refactored
    // For now, assuming processSession is consistent with its current Firebase UID usage
    try {
       await processSession(req.user.uid, res); // req.user.uid is Firebase UID
    } catch (error) {
       next(error);
    }
  })
);

router.get('/profile',
  authenticate,
  asyncHandler((req, res, next) => userController.getProfile(req, res, next))
);

router.put('/profile',
  authenticate,
  validate(userValidators.updateProfile),
  asyncHandler((req, res, next) => userController.updateProfile(req, res, next))
);

// New Logout Route
router.post('/logout', (req, res) => {
  res.cookie('token', '', { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax', 
    expires: new Date(0),
    path: '/'
  });
   res.cookie('user', '', {
     httpOnly: false,
     secure: process.env.NODE_ENV === 'production', 
     sameSite: 'lax', 
     expires: new Date(0),
     path: '/'
   });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export default router;