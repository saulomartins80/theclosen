import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Investimento from '../models/Investimento';

// Interface para extender o tipo Request do Express
interface AuthenticatedRequest extends Request {
  userId?: string; // Adicionamos uma propriedade opcional
}

export const getInvestimentos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const investimentos = await Investimento.find().sort({ data: -1 });
    res.json(investimentos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar investimentos', error });
  }
};

export const addInvestimento = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Removemos a verificação de usuário já que você não está usando autenticação
    const novoInvestimento = new Investimento({
      ...req.body,
      // Remova a linha abaixo se não quiser usar o campo usuario
      usuario: req.userId || new mongoose.Types.ObjectId() // Usamos um ObjectId fictício
    });

    await novoInvestimento.save();
    res.status(201).json(novoInvestimento);
  } catch (error) {
    res.status(400).json({ 
      message: 'Erro ao criar investimento',
      error: error instanceof Error ? error.message : error
    });
  }
};

export const updateInvestimento = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const investimento = await Investimento.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!investimento) {
      return res.status(404).json({ message: 'Investimento não encontrado' });
    }

    res.json(investimento);
  } catch (error) {
    res.status(400).json({
      message: 'Erro ao atualizar investimento',
      error: error instanceof Error ? error.message : error
    });
  }
};

export const deleteInvestimento = async (req: AuthenticatedRequest, res: Response) => {
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
      error: error instanceof Error ? error.message : error
    });
  }
};