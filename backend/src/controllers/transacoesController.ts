import { Request, Response } from "express";
import Transacoes, { ITransacaoDocument } from "../models/Transacoes";

// Função para criar uma transação
export const createTransacao = async (req: Request, res: Response) => {
  try {
    const { descricao, valor, data, categoria, tipo, conta } = req.body;

    // Validação básica
    if (!descricao || !valor || !data || !categoria || !tipo || !conta) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    // Converte a data para o tipo Date
    const dataDate = new Date(data);

    // Cria a transação no banco de dados
    const novaTransacao: ITransacaoDocument = new Transacoes({
      descricao,
      valor,
      data: dataDate,
      categoria,
      tipo,
      conta,
    });

    await novaTransacao.save();
    res.status(201).json(novaTransacao);
  } catch (error) {
    console.error("Erro ao criar transação:", error);

    // Verifica se o erro é uma instância de Error
    if (error instanceof Error) {
      res.status(500).json({ message: "Erro ao criar transação", error: error.message });
    } else {
      res.status(500).json({ message: "Erro ao criar transação", error: "Erro desconhecido" });
    }
  }
};

// Função para atualizar uma transação
export const updateTransacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { descricao, valor, data, categoria, tipo, conta } = req.body;

    // Validação básica
    if (!descricao || !valor || !data || !categoria || !tipo || !conta) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    // Converte a data para o tipo Date
    const dataDate = new Date(data);

    const transacaoAtualizada = await Transacoes.findByIdAndUpdate(
      id,
      { descricao, valor, data: dataDate, categoria, tipo, conta },
      { new: true }
    );

    if (!transacaoAtualizada) {
      return res.status(404).json({ message: "Transação não encontrada." });
    }

    res.status(200).json(transacaoAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);

    // Verifica se o erro é uma instância de Error
    if (error instanceof Error) {
      res.status(500).json({ message: "Erro ao atualizar transação", error: error.message });
    } else {
      res.status(500).json({ message: "Erro ao atualizar transação", error: "Erro desconhecido" });
    }
  }
};

// Função para excluir uma transação
export const deleteTransacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verifica se o ID foi fornecido
    if (!id) {
      return res.status(400).json({ message: "ID da transação é obrigatório." });
    }

    const transacaoDeletada = await Transacoes.findByIdAndDelete(id);

    if (!transacaoDeletada) {
      return res.status(404).json({ message: "Transação não encontrada." });
    }

    res.status(200).json({ message: "Transação excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir transação:", error);

    // Verifica se o erro é uma instância de Error
    if (error instanceof Error) {
      res.status(500).json({ message: "Erro ao excluir transação", error: error.message });
    } else {
      res.status(500).json({ message: "Erro ao excluir transação", error: "Erro desconhecido" });
    }
  }
};