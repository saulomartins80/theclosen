import express from 'express';
import {
  getInvestimentos,
  addInvestimento,
  updateInvestimento,
  deleteInvestimento,
  suggestAndAddInvestment
} from '../controllers/investimentoController';
import { authenticate } from "../middlewares/authMiddleware"; // Importar o middleware
import { asyncHandler } from "../utils/asyncHandler"; // Importar o asyncHandler

const router = express.Router();

// Aplicar authenticate e asyncHandler às rotas de investimentos

// Rota para listar investimentos (protegida)
router.get('/', authenticate, asyncHandler(getInvestimentos));

// Rota para adicionar investimento (protegida)
router.post('/', authenticate, asyncHandler(addInvestimento));

// Rota para sugestão de investimento (protegida)
router.post('/sugestao', authenticate, asyncHandler(suggestAndAddInvestment));

// Rota para atualizar investimento (protegida)
router.put('/:id', authenticate, asyncHandler(updateInvestimento));
// Rota para buscar um único investimento por ID (se você tiver uma - esta rota não existia, mas é comum)
// router.get("/:id", authenticate, asyncHandler(getInvestimentoById)); // Exemplo

// Rota para deletar investimento (protegida)
router.delete('/:id', authenticate, asyncHandler(deleteInvestimento));

export default router;