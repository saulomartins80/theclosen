// src/routes/investimentoRoutes.ts
import express from 'express';
import {
  getInvestimentos,
  addInvestimento,
  updateInvestimento,
  deleteInvestimento
} from '../controllers/investimentoController';

const router = express.Router();

router.get('/investimentos', getInvestimentos);
router.post('/investimentos', addInvestimento);
router.put('/investimentos/:id', updateInvestimento); // Rota de atualização
router.delete('/investimentos/:id', deleteInvestimento);

export default router;