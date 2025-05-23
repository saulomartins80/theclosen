import express from "express";
import {
  getGoals,
  getGoalsProgressByCategory,
  saveGoal,
  updateGoal,
  deleteGoal
} from "../controllers/goalController";
import { authenticate } from "../middlewares/authMiddleware"; // Importar o middleware
import { asyncHandler } from "../utils/asyncHandler"; // Importar o asyncHandler

const router = express.Router();


router.get("/goals", authenticate, asyncHandler(getGoals));

// Rota para obter progresso das metas por categoria (protegida)
router.get("/goals/progress-by-category", authenticate, asyncHandler(getGoalsProgressByCategory));

// Rota para criar meta (protegida)
router.post("/goals", authenticate, asyncHandler(saveGoal));

// Rota para atualizar meta (protegida)
router.put("/goals/:id", authenticate, asyncHandler(updateGoal));

// Rota para deletar meta (protegida)
router.delete("/goals/:id", authenticate, asyncHandler(deleteGoal));

export default router;