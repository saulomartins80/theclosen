import { Request, Response } from "express";
import { Goal } from "../models/Goal";
import mongoose from "mongoose";

// Buscar todas as metas
export const getGoals = async (req: Request, res: Response) => {
  try {
    const goals = await Goal.find();
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar metas." });
  }
};

// Salvar uma nova meta
export const saveGoal = async (req: Request, res: Response) => {
  const { meta, descricao, valor_total, valor_atual, data_conclusao, userId } = req.body;

  if (!meta || !descricao || !valor_total || !valor_atual || !data_conclusao || !userId) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios." });
  }

  // Valida se o userId é um ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "ID do usuário inválido." });
  }

  try {
    const newGoal = new Goal({ meta, descricao, valor_total, valor_atual, data_conclusao, userId });
    await newGoal.save();
    res.status(201).json({ message: "Meta salva com sucesso!" });
  } catch (error) {
    console.error("Erro ao salvar meta:", error);
    res.status(500).json({ message: "Erro ao salvar meta." });
  }
};

// Atualizar uma meta
export const updateGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedGoal = await Goal.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedGoal) {
      return res.status(404).json({ message: "Meta não encontrada." });
    }
    res.json({ message: "Meta atualizada com sucesso!", updatedGoal });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar meta." });
  }
};

// Excluir uma meta
export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedGoal = await Goal.findByIdAndDelete(id);
    if (!deletedGoal) {
      return res.status(404).json({ message: "Meta não encontrada." });
    }
    res.json({ message: "Meta excluída com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir meta." });
  }
};