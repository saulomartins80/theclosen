import express from "express";
import {
  createTransacao,
  getTransacoes,
  updateTransacao,
  deleteTransacao,
  suggestAndAddTransaction
} from "../controllers/transacoesController";
import { authenticate } from "../middlewares/authMiddleware"; // Importar o middleware
import { asyncHandler } from "../utils/asyncHandler"; // Importar o asyncHandler

const router = express.Router();

// Aplicar authenticate a todas as rotas que precisam de usuário logado
// Envolver cada controlador com asyncHandler

// Rota para criar transação (protegida)
router.post("/", authenticate, asyncHandler(createTransacao));

// Rota para sugestão de transação (protegida)
router.post("/sugestao", authenticate, asyncHandler(suggestAndAddTransaction));

// Rota para listar transações (protegida)
router.get("/", authenticate, asyncHandler(getTransacoes));

// Rota para buscar uma única transação por ID (se você tiver uma - esta rota não existia, mas é comum)
// router.get("/:id", authenticate, asyncHandler(getTransacaoById)); // Exemplo

// Rota para atualizar transação (protegida)
router.put("/:id", authenticate, asyncHandler(updateTransacao));

// Rota para deletar transação (protegida)
router.delete("/:id", authenticate, asyncHandler(deleteTransacao));

export default router;