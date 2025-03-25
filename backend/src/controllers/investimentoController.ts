import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Investimento from '../models/Investimento';

// Função para validar se o ID é um ObjectId válido
const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

export const getInvestimentos = async (req: Request, res: Response) => {
  try {
    const investimentos = await Investimento.find();
    res.json(investimentos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar investimentos', error });
  }
};

export const addInvestimento = async (req: Request, res: Response) => {
  const { nome, tipo, valor, data } = req.body;

  try {
    const novoInvestimento = new Investimento({ nome, tipo, valor, data });
    await novoInvestimento.save();
    res.status(201).json(novoInvestimento);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar investimento', error });
  }
};

export const updateInvestimento = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, tipo, valor, data } = req.body;

  // Valida se o ID é um ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const investimentoAtualizado = await Investimento.findByIdAndUpdate(
      id,
      { nome, tipo, valor, data },
      { new: true }
    );

    if (!investimentoAtualizado) {
      return res.status(404).json({ message: 'Investimento não encontrado' });
    }

    res.json(investimentoAtualizado);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar investimento', error });
  }
};

export const deleteInvestimento = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log("ID recebido para exclusão:", id); // Log do ID

   // Valida se o ID é um ObjectId válido
   if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }


  try {
    const investimentoExcluido = await Investimento.findByIdAndDelete(id);

    if (!investimentoExcluido) {
      return res.status(404).json({ message: 'Investimento não encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir investimento', error });
  }
};