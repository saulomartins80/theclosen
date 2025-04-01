// src/routes/investimentoRoutes.ts
import express from 'express';
import {
  getInvestimentos,
  addInvestimento,
  updateInvestimento,
  deleteInvestimento
} from '../controllers/investimentoController';

const router = express.Router();

// Rotas corrigidas (removendo o '/investimentos' duplicado)
router.get('/', getInvestimentos); // Agora será /api/investimentos
router.post('/', addInvestimento); // Agora será /api/investimentos
router.put('/:id', updateInvestimento); // Agora será /api/investimentos/:id
router.delete('/:id', deleteInvestimento); // Agora será /api/investimentos/:id

export default router;