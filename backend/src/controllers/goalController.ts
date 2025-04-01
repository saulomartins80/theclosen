import { Request, Response } from "express";
import { Goal } from "../models/Goal";
import mongoose from "mongoose";

// Buscar todas as metas - Mantendo o formato antigo
export const getGoals = async (req: Request, res: Response) => {
  try {
    const goals = await Goal.find();
    res.json({ metas: goals }); // Alterado para manter compatibilidade
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar metas." });
  }
};

// Salvar uma nova meta - Mantendo formato antigo
export const saveGoal = async (req: Request, res: Response) => {
  const { meta, descricao, valor_total, valor_atual, data_conclusao, userId } = req.body;

  if (!meta || !descricao || !valor_total || !valor_atual || !data_conclusao || !userId) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios." });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "ID do usuário inválido." });
  }

  try {
    const newGoal = new Goal({ meta, descricao, valor_total, valor_atual, data_conclusao, userId });
    await newGoal.save();
    res.status(201).json({ 
      message: "Meta salva com sucesso!",
      meta: newGoal // Adicionado para compatibilidade
    });
  } catch (error) {
    console.error("Erro ao salvar meta:", error);
    res.status(500).json({ message: "Erro ao salvar meta." });
  }
};

// Atualizar uma meta - Mantendo formato antigo
export const updateGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedGoal = await Goal.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedGoal) {
      return res.status(404).json({ message: "Meta não encontrada." });
    }
    res.json({ 
      message: "Meta atualizada com sucesso!",
      updatedGoal, // Mantido
      meta: updatedGoal // Adicionado para compatibilidade
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar meta." });
  }
};

// Excluir uma meta - Mantendo formato antigo
export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedGoal = await Goal.findByIdAndDelete(id);
    if (!deletedGoal) {
      return res.status(404).json({ message: "Meta não encontrada." });
    }
    res.json({ 
      message: "Meta excluída com sucesso!",
      id: deletedGoal._id // Adicionado para referência
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir meta." });
  }
};