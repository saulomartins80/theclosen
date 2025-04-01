import express from "express";
import mongoose from "mongoose";
import Transacoes from "../models/Transacoes";

const router = express.Router();

// Prefixo de rota para todas as rotas deste arquivo
router.route('/')
  // Criar transação
  .post(async (req, res) => {
    try {
      const { descricao, valor, data, categoria, tipo, conta } = req.body;

      if (!descricao || !valor || !data || !categoria || !tipo || !conta) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios." });
      }

      const novaTransacao = new Transacoes({
        descricao,
        valor: parseFloat(valor),
        data: new Date(data),
        categoria,
        tipo,
        conta,
      });

      await novaTransacao.save();
      res.status(201).json(novaTransacao);
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  })
  
  // Listar todas as transações
  .get(async (req, res) => {
    try {
      const transacoes = await Transacoes.find();
      res.status(200).json(transacoes);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  });

router.route('/:id')
  // Atualizar transação
  .put(async (req, res) => {
    try {
      const { id } = req.params;
      const { descricao, valor, data, categoria, tipo, conta } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID inválido." });
      }

      const transacaoAtualizada = await Transacoes.findByIdAndUpdate(
        id,
        { descricao, valor, data, categoria, tipo, conta },
        { new: true }
      );

      if (!transacaoAtualizada) {
        return res.status(404).json({ message: "Transação não encontrada." });
      }

      res.status(200).json(transacaoAtualizada);
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  })
  
  // Excluir transação
  .delete(async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID inválido." });
      }

      const transacaoDeletada = await Transacoes.findByIdAndDelete(id);

      if (!transacaoDeletada) {
        return res.status(404).json({ message: "Transação não encontrada." });
      }

      res.status(200).json({ message: "Transação excluída com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  });

export default router;