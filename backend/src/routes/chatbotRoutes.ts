// backend/src/routes/chatbotRoutes.ts
import express from 'express';
import { 
  handleChatQuery, 
  startNewSession, 
  getSessions, 
  getSession,
  submitFeedback,
  getFeedbackAnalytics,
  deleteConversation,
  deleteAllConversations
} from '../controllers/chatbotController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = express.Router();

// Todas as rotas do chatbot requerem autenticação
router.use(authMiddleware);

// Enviar mensagem para o chatbot
router.post('/query', asyncHandler(handleChatQuery));

// Iniciar nova sessão
router.post('/sessions', asyncHandler(startNewSession));

// Buscar todas as sessões do usuário
router.get('/sessions', asyncHandler(getSessions));

// Buscar sessão específica
router.get('/sessions/:chatId', asyncHandler(getSession));

// NOVAS ROTAS PARA FEEDBACK E GESTÃO DE CONVERSAS

// Enviar feedback sobre uma resposta do chatbot
router.post('/feedback', asyncHandler(submitFeedback));

// Buscar analytics de feedback do usuário
router.get('/feedback/analytics', asyncHandler(getFeedbackAnalytics));

// Excluir conversa específica
router.delete('/sessions/:chatId', asyncHandler(deleteConversation));

// Excluir todas as conversas do usuário
router.delete('/sessions', asyncHandler(deleteAllConversations));

export default router;