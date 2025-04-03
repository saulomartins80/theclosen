import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { verifyUserEmail, firebaseAdmin } from '../services/authService';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login, tente novamente mais tarde',
  standardHeaders: true,
  legacyHeaders: false
});

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email } = req.body;

    try {
      const user = await verifyUserEmail(email);
      const token = await firebaseAdmin.createCustomToken(user.uid);
      
      res.status(200).json({
        success: true,
        token,
        user: {
          uid: user.uid,
          email: user.email
        }
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      res.status(401).json({
        success: false,
        error: err.message || 'Erro no login'
      });
    }
  }
);

export default router;