import { Router } from 'express';
import { handleAutomatedActions, executeAction } from '../controllers/automatedActionsController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Rota para detectar e processar ações automatizadas
router.post('/detect', authMiddleware, handleAutomatedActions);

// Rota para executar ações confirmadas
router.post('/execute', authMiddleware, executeAction);

export default router; 