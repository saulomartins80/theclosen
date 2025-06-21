// backend/src/routes/chatbotRoutes.ts
import { Router } from 'express';
import { startNewSession, getSessions, getSession, handleChatQuery } from '../controllers/chatbotController';
import { authenticate } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// Rota para o chatbot, protegida por autenticação.
router.post('/sessions', authenticate, asyncHandler(startNewSession));
router.get('/sessions', authenticate, asyncHandler(getSessions));
router.get('/sessions/:chatId', authenticate, asyncHandler(getSession));
router.post('/query', authenticate, asyncHandler(handleChatQuery));

export default router;