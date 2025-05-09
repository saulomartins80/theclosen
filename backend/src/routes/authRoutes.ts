// BACKEND: SRC/ROUTES/AUTHROUTES.TS
import express, { Request, Response, NextFunction } from 'express';
import { container } from '@core/container';
import { TYPES } from '@core/types';
import { UserController } from '@modules/users/controllers/UserController';
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
const auth = getAuth(); // auth do firebase-admin/auth

const router = express.Router();
const userController = container.get<UserController>(TYPES.UserController);
const subscriptionService = container.get<SubscriptionService>(TYPES.SubscriptionService);

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
    const firebaseUser = await auth.getUser(userId);
    const subscription = await subscriptionService.getSubscription(userId).catch(() => null);

    res.status(200).json({
      status: 'success',
      data: {
        uid: userId,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL || null,
        subscription
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

// Adicionando a nova rota POST /session baseada na lógica do arquivo Next.js API route
// Envolvido com asyncHandler para compatibilidade com o tratador de erros
router.post('/session', asyncHandler(async (req: Request, res: Response) => {
  console.log('--- DEBUG: Inside POST /api/auth/session handler ---'); // LOG PARA VERIFICAR SE ESTA VERSAO ESTA RODANDO
  console.log('POST /api/auth/session received.');
  console.log('Request Content-Type:', req.headers['content-type']);
  console.log('Type of req.body:', typeof req.body); // Log adicionado para debug
  console.log('Value of req.body:', req.body); // Log adicionado para debug

  try {
    // Verificação mais robusta para bodyToken
    const bodyToken = (typeof req.body === 'object' && req.body !== null && 'token' in req.body)
      ? req.body.token as string // Acessa token se req.body for um objeto não nulo com a propriedade 'token', com type assertion
      : undefined; // Caso contrário, bodyToken é undefined

    console.log('Token from body (explicit check):', bodyToken);

    // Obter token de múltiplas fontes (adaptado para Express)
    const token = req.cookies.token || 
                 req.headers.authorization?.split(' ')[1] || 
                 bodyToken; // Usa o bodyToken obtido de forma segura

    console.log('Final Extracted Token (before verifyIdToken):', token);

    if (!token) {
      // Retorna 200 com user: null se não houver token, conforme a lógica original do Next.js API
      console.log('No token found. Returning user: null.');
      res.status(200).json({ user: null });
      return; 
    }

    // Verificar token usando adminAuth
    console.log('Verifying token with Firebase Admin...');
    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log('Token verified. Getting user:', decodedToken.uid);
    const firebaseUser = await adminAuth.getUser(decodedToken.uid);
    console.log('Firebase user found:', firebaseUser.uid);

    // Buscar assinatura usando subscriptionService (MongoDB)
    console.log('Searching for subscription for user in MongoDB:', firebaseUser.uid);
    const subscription = await subscriptionService.getSubscription(firebaseUser.uid).catch(() => null);

    if (subscription) {
      console.log('Subscription found in MongoDB.', subscription);
    } else {
      console.log('No subscription found in MongoDB.');
    }

    // Configurar cookies (adaptado para Express - usando setHeader)
    const cookieOptions = {
      httpOnly: true,
      // Considere usar `process.env.NODE_ENV === 'production'`
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax' as const, // 'lax' as const é para TypeScript
      path: '/',
      maxAge: 60 * 60 * 24 * 5 // 5 dias
    };

    console.log('Setting cookies.');
    res.setHeader('Set-Cookie', [
      `token=${token}; ${Object.entries(cookieOptions)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ')}`,
      `user=${encodeURIComponent(JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL
      }))}; ${Object.entries({
        ...cookieOptions,
        httpOnly: false // User cookie pode ser acessado pelo cliente (frontend)
      }).map(([k, v]) => `${k}=${v}`).join('; ')}`
    ]);

    // Retorna 200 com os dados do usuário e assinatura
    console.log('Session sync successful. Returning user data.');
    res.status(200).json({
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL,
        // Inclui subscription apenas se existir
        ...(subscription && { subscription })
      }
    }); 

  } catch (error) {
    console.error('Session sync error caught in handler:', error);
    
    // Limpar cookies inválidos em caso de erro
    res.setHeader('Set-Cookie', [
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
      'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);
    
    // Retorna 200 com user: null e mensagem de erro, conforme lógica original do Next.js API
    // Isso evita que o frontend lance um erro de status HTTP não-2xx e permite que ele gerencie o estado de não autenticado.
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
    if (!req.user) {
      return next(new AppError(401, 'Usuário não autenticado'));
    }
    // Chama processSession com o UID do usuário autenticado
    try {
       await processSession(req.user.uid, res);
    } catch (error) {
       next(error);
    }
  })
);

router.get('/profile',
  authenticate,
  asyncHandler((req, res, next) => userController.getProfile(req, res, next)) // Passa next
);

router.put('/profile',
  authenticate,
  validate(userValidators.updateProfile),
  asyncHandler((req, res, next) => userController.updateProfile(req, res, next)) // Passa next
);

export default router;