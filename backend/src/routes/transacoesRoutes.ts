import express from "express";
import {
  createTransacao,
  getTransacoes,
  updateTransacao,
  deleteTransacao
} from "../controllers/transacoesController";

const router = express.Router();

// Rota para criar transação
router.post("/", async (req, res) => {
  await createTransacao(req, res);
});

// Rota para listar transações
router.get("/", async (req, res) => {
  await getTransacoes(req, res);
});

// Rota para atualizar transação
router.put("/:id", async (req, res) => {
  await updateTransacao(req, res);
});

// Rota para deletar transação
router.delete("/:id", async (req, res) => {
  await deleteTransacao(req, res);
});

export default router;