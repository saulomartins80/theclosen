import express from "express";
import mongoose from "mongoose";
import Transacoes from "../models/Transacoes";

const router = express.Router();

router.route('/')
  .post(async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { descricao, valor, data, categoria, tipo, conta } = req.body;

      if (!descricao || !valor || !data || !categoria || !tipo || !conta) {
        res.status(400).json({ message: "Todos os campos são obrigatórios." });
        return;
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
  
  .get(async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const transacoes = await Transacoes.find();
      res.status(200).json(transacoes);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  });

router.route('/:id')
  .put(async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { descricao, valor, data, categoria, tipo, conta } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "ID inválido." });
        return;
      }

      const transacaoAtualizada = await Transacoes.findByIdAndUpdate(
        id,
        { descricao, valor, data, categoria, tipo, conta },
        { new: true }
      );

      if (!transacaoAtualizada) {
        res.status(404).json({ message: "Transação não encontrada." });
        return;
      }

      res.status(200).json(transacaoAtualizada);
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  })
  
  .delete(async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "ID inválido." });
        return;
      }

      const transacaoDeletada = await Transacoes.findByIdAndDelete(id);

      if (!transacaoDeletada) {
        res.status(404).json({ message: "Transação não encontrada." });
        return;
      }

      res.status(200).json({ message: "Transação excluída com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      res.status(500).json({ message: "Erro interno do servidor." });
    }
  });

export default router;