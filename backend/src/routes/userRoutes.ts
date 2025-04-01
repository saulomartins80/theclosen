// src/routes/userRoutes.ts
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { loginUser, firebaseAdmin } from '../services/authService';

const router = express.Router();

// Configuração de rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limite de 5 tentativas por IP
  message: 'Muitas tentativas de login, tente novamente mais tarde',
  standardHeaders: true,
  legacyHeaders: false
});

// Rota de login com validações e segurança
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('A senha deve ter pelo menos 6 caracteres')
      .trim()
      .escape()
  ],
  async (req: Request, res: Response) => {
    // Validação dos dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await loginUser(email, password);
      
      // Geração de token JWT seguro
      const token = await firebaseAdmin.auth().createCustomToken(user.uid, {
        expiresIn: '1h',
        role: 'user' // Você pode adicionar claims personalizadas
      });

      // Configuração segura do cookie (se estiver usando)
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hora
      });

      res.status(200).json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        },
        token
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro no login';
      res.status(401).json({
        success: false,
        error: message
      });
    }
  }
);

export default router;