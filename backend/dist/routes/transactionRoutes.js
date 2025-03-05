"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/transactionsRoutes.ts
const express_1 = __importDefault(require("express"));
const Transaction_1 = __importDefault(require("../models/Transaction")); // Importe o modelo de transação
const router = express_1.default.Router();
// Rota para buscar todas as transações
router.get('/lancamentos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Busca todas as transações no banco de dados
        const lancamentos = yield Transaction_1.default.find(); // Use o modelo Transaction
        res.json({ lancamentos }); // Corrigido o nome da variável
    }
    catch (error) {
        console.error("Erro ao buscar transações:", error);
        res.status(500).json({ message: 'Erro ao buscar transações', error });
    }
}));
exports.default = router;
