// src/controllers/investimentoController.ts
import { Request, Response } from 'express';
import Investimento from '../models/Investimento';

export const getInvestimentos = async (req: Request, res: Response) => {
  try {
    const investimentos = await Investimento.find();
    res.json(investimentos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar investimentos', error });
  }
};

export const addInvestimento = async (req: Request, res: Response) => {
  const { nome, tipo, valor } = req.body;

  try {
    const novoInvestimento = new Investimento({ nome, tipo, valor });
    await novoInvestimento.save();
    res.status(201).json(novoInvestimento);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar investimento', error });
  }
};

export const updateInvestimento = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, tipo, valor } = req.body;

  try {
    const investimentoAtualizado = await Investimento.findByIdAndUpdate(
      id,
      { nome, tipo, valor },
      { new: true }
    );
    res.json(investimentoAtualizado);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar investimento', error });
  }
};

export const deleteInvestimento = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await Investimento.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir investimento', error });
  }
};