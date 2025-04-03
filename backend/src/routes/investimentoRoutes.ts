import express from 'express';
import {
  getInvestimentos,
  addInvestimento,
  updateInvestimento,
  deleteInvestimento
} from '../controllers/investimentoController';

const router = express.Router();

router.get('/', getInvestimentos);
router.post('/', addInvestimento);
router.put('/:id', updateInvestimento);
router.delete('/:id', deleteInvestimento);

export default router;