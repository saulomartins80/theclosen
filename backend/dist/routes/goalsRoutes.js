"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const goalController_1 = require("../controllers/goalController");
const router = express_1.default.Router();
// Rotas para metas
router.get('/goals', goalController_1.getGoals);
router.post('/goals', goalController_1.saveGoal);
router.delete('/goals/:id', goalController_1.deleteGoal);
router.put('/goals/:id', goalController_1.updateGoal);
exports.default = router;
