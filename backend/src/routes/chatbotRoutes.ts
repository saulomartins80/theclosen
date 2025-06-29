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
  deleteAllConversations,
  streamChatResponse,
  getSuggestions,
  analyzeSentiment,
  getCacheStats,
  clearCache,
  adaptResponseToSentiment
} from '../controllers/chatbotController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';
import { 
  sanitizeInput, 
  validateMessageSize, 
  simpleRateLimit, 
  auditMiddleware,
  attackProtection 
} from '../middlewares/securityMiddleware';

const router = express.Router();

// Todas as rotas do chatbot requerem autenticação
router.use(authMiddleware);

// Middlewares de segurança aplicados a todas as rotas
router.use(auditMiddleware);
router.use(attackProtection);
router.use(sanitizeInput); // Reativado após correção

// Rate limiting específico para chatbot
router.use(simpleRateLimit(60000, 10)); // 10 requests por minuto

// Enviar mensagem para o chatbot
router.post('/query', validateMessageSize, asyncHandler(handleChatQuery));

// NOVA ROTA: Streaming de respostas do chatbot
router.post('/stream', validateMessageSize, simpleRateLimit(300000, 5), asyncHandler(streamChatResponse));

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

// NOVAS ROTAS PARA FUNCIONALIDADES AVANÇADAS

// Sugestões inteligentes
router.post('/suggestions', validateMessageSize, asyncHandler(getSuggestions));

// Análise de sentimentos
router.post('/sentiment', validateMessageSize, asyncHandler(analyzeSentiment));

// Estatísticas do cache
router.get('/cache/stats', asyncHandler(getCacheStats));

// Limpar cache
router.post('/cache/clear', asyncHandler(clearCache));

// Adaptar resposta ao sentimento
router.post('/adapt-response', validateMessageSize, asyncHandler(adaptResponseToSentiment));

export default router;