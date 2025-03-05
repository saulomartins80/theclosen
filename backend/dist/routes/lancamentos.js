"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const lancamentosController_1 = require("../controllers/lancamentosController");
const router = express_1.default.Router();
// Rotas para lançamentos
router.post("/lancamentos", lancamentosController_1.criarLancamento); // Criar um novo lançamento
router.get("/lancamentos", lancamentosController_1.listarLancamentos); // Listar todos os lançamentos
router.get("/lancamentos/:id", lancamentosController_1.buscarLancamentoPorId); // Buscar um lançamento por ID
router.put("/lancamentos/:id", lancamentosController_1.atualizarLancamento); // Atualizar um lançamento
router.delete("/lancamentos/:id", lancamentosController_1.excluirLancamento); // Excluir um lançamento
exports.default = router;
