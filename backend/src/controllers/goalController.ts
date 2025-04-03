import { Request, Response } from "express";
import { Goal } from "../models/Goal";
import mongoose from "mongoose";

export const getGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    const goals = await Goal.find();
    res.json({ metas: goals });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar metas." });
  }
};

export const saveGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { meta, descricao, valor_total, valor_atual, data_conclusao, userId } = req.body;

    if (!meta || !descricao || !valor_total || !valor_atual || !data_conclusao || !userId) {
      res.status(400).json({ message: "Todos os campos são obrigatórios." });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "ID do usuário inválido." });
      return;
    }

    const newGoal = new Goal({ meta, descricao, valor_total, valor_atual, data_conclusao, userId });
    await newGoal.save();
    res.status(201).json({ 
      message: "Meta salva com sucesso!",
      meta: newGoal
    });
  } catch (error) {
    console.error("Erro ao salvar meta:", error);
    res.status(500).json({ message: "Erro ao salvar meta." });
  }
};

export const updateGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedGoal = await Goal.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!updatedGoal) {
      res.status(404).json({ message: "Meta não encontrada." });
      return;
    }
    
    res.json({ 
      message: "Meta atualizada com sucesso!",
      updatedGoal,
      meta: updatedGoal
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar meta." });
  }
};

export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedGoal = await Goal.findByIdAndDelete(id);
    
    if (!deletedGoal) {
      res.status(404).json({ message: "Meta não encontrada." });
      return;
    }
    
    res.json({ 
      message: "Meta excluída com sucesso!",
      id: deletedGoal._id
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir meta." });
  }
};