// src/controllers/investimentoController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Investimento from '../models/Investimento';

export const getInvestimentos = async (req: Request, res: Response) => {
  try {
    const investimentos = await Investimento.find().sort({ data: -1 });
    res.json(investimentos);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erro ao buscar investimentos',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const addInvestimento = async (req: Request, res: Response) => {
  try {
    const { nome, valor, data, tipo } = req.body;

    // Validação básica
    if (!nome || !valor || !data || !tipo) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }

    const novoInvestimento = new Investimento({
      nome,
      valor: Number(valor),
      data: new Date(data),
      tipo
    });

    await novoInvestimento.save();
    res.status(201).json(novoInvestimento);
  } catch (error) {
    res.status(400).json({ 
      message: 'Erro ao criar investimento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const updateInvestimento = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const investimentoAtualizado = await Investimento.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!investimentoAtualizado) {
      return res.status(404).json({ message: 'Investimento não encontrado' });
    }

    res.json(investimentoAtualizado);
  } catch (error) {
    res.status(400).json({
      message: 'Erro ao atualizar investimento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const deleteInvestimento = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const investimento = await Investimento.findByIdAndDelete(id);

    if (!investimento) {
      return res.status(404).json({ message: 'Investimento não encontrado' });
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao excluir investimento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};