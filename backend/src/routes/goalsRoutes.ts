import express from "express";
import {
  getGoals,
  saveGoal,
  updateGoal,
  deleteGoal
} from "../controllers/goalController";

const router = express.Router();

// Rotas atualizadas (sem /api prefix aqui pois já está no index.ts)
router.get("/goals", getGoals);
router.post("/goals", saveGoal);
router.put("/goals/:id", updateGoal);
router.delete("/goals/:id", deleteGoal);

export default router;