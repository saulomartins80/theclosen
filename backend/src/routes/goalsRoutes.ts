import express from 'express';
import { getGoals, saveGoal, deleteGoal, updateGoal } from '../controllers/goalController';

const router = express.Router();

// Rotas para metas
router.get('/goals', getGoals);
router.post('/goals', saveGoal);
router.delete('/goals/:id', deleteGoal);
router.put('/goals/:id', updateGoal);

export default router;