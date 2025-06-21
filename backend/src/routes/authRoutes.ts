// BACKEND: SRC/ROUTES/AUTHROUTES.TS
import express, { Request, Response, NextFunction } from 'express';
import { container } from '@core/container';
import { TYPES } from '@core/types';
import { UserController } from '@modules/users/controllers/UserController';
import { UserService } from '@modules/users/services/UserService'; // Import UserService
import { authenticate } from '@middlewares/authMiddleware';
import { AppError } from '@core/errors/AppError';
import { validate } from '@modules/users/middlewares/validate';
import { userValidators } from '@modules/users/validators/userValidators';
import { getAuth } from 'firebase-admin/auth';
// Imports corrigidos para usar aliases do tsconfig para firebase/admin e types/Subscription
import { adminAuth } from '@config/firebaseAdmin'; 

const router = express.Router();
const userController = container.get<UserController>(TYPES.UserController);
// A instância do subscriptionService não é mais necessária aqui, pois a lógica de usuário está no userService.
const userService = container.get<UserService>(TYPES.UserService); // Get UserService instance

// Handler assíncrono (verifique se este asyncHandler é necessário ou se você tem um global)
const asyncHandler = <T = any>(
  fn: (req: Request<T>, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request<T>, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
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

router.post('/session', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Obter o token do header Authorization (formato "Bearer TOKEN")
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) throw new AppError(401, 'Token de autenticação ausente no cabeçalho.');

    // Adiciona tolerância para expiração do token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token, true);
    } catch (error: any) {
      if (error.code === 'auth/id-token-expired') {
        res.status(401).json({
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }
      throw error;
    }

    // Busca usuário no MongoDB pelo Firebase UID
    const mongoUser = await userService.getUserByFirebaseUid(decodedToken.uid);

    if (!mongoUser) {
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

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 5 // 5 dias
    };

    const userCookiePayload = {
      uid: mongoUser.firebaseUid,
      email: mongoUser.email,
      name: mongoUser.name,
      photoUrl: mongoUser.photoUrl
    };

    res.setHeader('Set-Cookie', [
      `token=${token}; ${Object.entries(cookieOptions).map(([k, v]) => `${k}=${v}`).join('; ')}`,
      `user=${encodeURIComponent(JSON.stringify(userCookiePayload))}; ${Object.entries({
        ...cookieOptions,
        httpOnly: false
      }).map(([k, v]) => `${k}=${v}`).join('; ')}`
    ]);

    res.status(200).json({
      user: {
        uid: mongoUser.firebaseUid,
        email: mongoUser.email,
        name: mongoUser.name,
        photoUrl: mongoUser.photoUrl,
        subscription: mongoUser.subscription
      }
    });
    return;
  } catch (error: any) {
    // Limpa cookies em caso de erro
    res.setHeader('Set-Cookie', [
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
      'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);

    let statusCode = 500;
    let errorMessage = 'Erro interno ao sincronizar sessão.';

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      errorMessage = error.message;
    } else if (error.code === 'auth/id-token-expired') {
      statusCode = 401;
      errorMessage = 'Token expirado';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      user: null,
      error: errorMessage,
      code: error.code || undefined
    });
    return;
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
  asyncHandler((req, res, next) => userController.getProfile(req, res))
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