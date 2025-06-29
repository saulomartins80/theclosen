import express from "express";
import {
  getGoals,
  getGoalsProgressByCategory,
  createGoal,
  updateGoal,
  deleteGoal,
  suggestAndAddGoal
} from "../controllers/goalController";
import { authenticate } from "../middlewares/authMiddleware"; // Importar o middleware
import { asyncHandler } from "../utils/asyncHandler"; // Importar o asyncHandler

const router = express.Router();

// Rota para listar metas
router.get("/", authenticate, asyncHandler(getGoals));

// Rota para obter progresso das metas por categoria
router.get("/progress-by-category", authenticate, asyncHandler(getGoalsProgressByCategory));

// Rota para criar meta
router.post("/", authenticate, asyncHandler(createGoal));

// Rota para sugestão de meta
router.post("/sugestao", authenticate, asyncHandler(suggestAndAddGoal));

// Rota para atualizar meta
router.put("/:id", authenticate, asyncHandler(updateGoal));

// Rota para deletar meta
router.delete("/:id", authenticate, asyncHandler(deleteGoal));

export default router;