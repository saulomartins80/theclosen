import { Request, Response } from "express";
import mongoose from "mongoose";
import { Transacoes } from "../models/Transacoes";

export const createTransacao = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Dados recebidos:', req.body);
    const { descricao, valor, data, categoria, tipo, conta } = req.body;

    if (!descricao || valor === undefined || !data || !categoria || !tipo || !conta) {
      res.status(400).json({ message: "Todos os campos são obrigatórios." });
      return;
    }

    // Aceita tanto string quanto número para o valor
    const valorNumerico = typeof valor === 'string' 
      ? parseFloat(valor.replace(',', '.'))
      : Number(valor);

    if (isNaN(valorNumerico)) {
      res.status(400).json({ message: "Valor inválido." });
      return;
    }

    // Validação específica para transferências negativas
    if (tipo === "transferencia" && valorNumerico === 0) {
      res.status(400).json({ message: "Valor de transferência não pode ser zero." });
      return;
    }

    // Aceita tanto string de data quanto objeto com $date
    const dataDate = typeof data === 'object' && data.$date 
      ? new Date(data.$date) 
      : new Date(data);

    if (isNaN(dataDate.getTime())) {
      res.status(400).json({ message: "Data inválida." });
      return;
    }

    const novaTransacao = new Transacoes({
      descricao,
      valor: valorNumerico,
      data: dataDate,
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
};

export const getTransacoes = async (req: Request, res: Response): Promise<void> => {
  try {
    const transacoes = await Transacoes.find().sort({ data: -1 });
    res.status(200).json(transacoes);
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const updateTransacao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { descricao, valor, data, categoria, tipo, conta } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "ID inválido." });
      return;
    }

    if (!descricao || valor === undefined || !data || !categoria || !tipo || !conta) {
      res.status(400).json({ message: "Todos os campos são obrigatórios." });
      return;
    }

    // Aceita tanto string quanto número para o valor
    const valorNumerico = typeof valor === 'string' 
      ? parseFloat(valor.replace(',', '.'))
      : Number(valor);

    if (isNaN(valorNumerico)) {
      res.status(400).json({ message: "Valor inválido." });
      return;
    }

    // Validação específica para transferências negativas
    if (tipo === "transferencia" && valorNumerico === 0) {
      res.status(400).json({ message: "Valor de transferência não pode ser zero." });
      return;
    }

    // Aceita tanto string de data quanto objeto com $date
    const dataDate = typeof data === 'object' && data.$date 
      ? new Date(data.$date) 
      : new Date(data);

    if (isNaN(dataDate.getTime())) {
      res.status(400).json({ message: "Data inválida." });
      return;
    }

    const transacaoAtualizada = await Transacoes.findByIdAndUpdate(
      id,
      { descricao, valor: valorNumerico, data: dataDate, categoria, tipo, conta },
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
};

export const deleteTransacao = async (req: Request, res: Response): Promise<void> => {
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
};