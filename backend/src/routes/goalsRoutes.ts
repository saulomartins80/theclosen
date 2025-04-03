import express from "express";
import {
  getGoals,
  saveGoal,
  updateGoal,
  deleteGoal
} from "../controllers/goalController";

const router = express.Router();

router.get("/goals", getGoals);
router.post("/goals", saveGoal);
router.put("/goals/:id", updateGoal);
router.delete("/goals/:id", deleteGoal);

export default router;