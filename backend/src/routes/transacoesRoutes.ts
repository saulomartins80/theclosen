import express from "express";
import Transacao from "../models/Transacao";

const router = express.Router();

// Rota para criar uma transação
router.post("/transacoes", async (req, res) => {
  try {
    const { descricao, valor, data, categoria, tipo, conta } = req.body;

    // Validação básica
    if (!descricao || !valor || !data || !categoria || !tipo || !conta) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    // Cria a transação no banco de dados
    const novaTransacao = new Transacao({
      descricao,
      valor: parseFloat(valor), // Converte para número
      data: new Date(data), // Converte para Date
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
});

// Rota para buscar todas as transações
router.get("/transacoes", async (req, res) => {
  try {
    const transacoes = await Transacao.find();
    res.status(200).json(transacoes);
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota para atualizar uma transação
router.put("/transacoes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, valor, data, categoria, tipo, conta } = req.body;

    const transacaoAtualizada = await Transacao.findByIdAndUpdate(
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
});

// Rota para excluir uma transação
router.delete("/transacoes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const transacaoDeletada = await Transacao.findByIdAndDelete(id);

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