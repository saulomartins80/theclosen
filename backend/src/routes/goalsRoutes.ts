import express from "express";
import {
  getGoals,
  getGoalsProgressByCategory,
  saveGoal,
  updateGoal,
  deleteGoal
} from "../controllers/goalController";

const router = express.Router();

router.get("/goals", getGoals);
router.get("/goals/progress-by-category", getGoalsProgressByCategory);
router.post("/goals", saveGoal);
router.put("/goals/:id", updateGoal);
router.delete("/goals/:id", deleteGoal);

export default router;