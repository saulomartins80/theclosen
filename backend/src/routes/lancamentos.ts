import express from "express";
import {
  criarLancamento,
  listarLancamentos,
  buscarLancamentoPorId,
  atualizarLancamento,
  excluirLancamento,
} from "../controllers/lancamentosController";

const router = express.Router();

// Rotas para lançamentos
router.post("/lancamentos", criarLancamento); // Criar um novo lançamento
router.get("/lancamentos", listarLancamentos); // Listar todos os lançamentos
router.get("/lancamentos/:id", buscarLancamentoPorId); // Buscar um lançamento por ID
router.put("/lancamentos/:id", atualizarLancamento); // Atualizar um lançamento
router.delete("/lancamentos/:id", excluirLancamento); // Excluir um lançamento

export default router;
