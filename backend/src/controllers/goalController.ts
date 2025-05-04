import { Request, Response } from "express";
import { Goal } from "../models/Goal";
import mongoose from "mongoose";

interface ProgressoCategoria {
  categoria: string;
  percentual_conclusao: number;
  valor_total: number;
  valor_atual: number;
  count: number;
}

export const getGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    const goals = await Goal.find();
    res.json({ metas: goals });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar metas." });
  }
};

export const getGoalsProgressByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const goals = await Goal.aggregate([
      {
        $match: {
          categoria: { $exists: true, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$categoria",
          valor_total: { $sum: "$valor_total" },
          valor_atual: { $sum: "$valor_atual" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          categoria: "$_id",
          percentual_conclusao: { 
            $round: [{ $multiply: [{ $divide: ["$valor_atual", "$valor_total"] }, 100] }, 2]
          },
          valor_total: 1,
          valor_atual: 1,
          count: 1,
          _id: 0
        }
      },
      { $sort: { percentual_conclusao: -1 } }
    ]);

    res.json(goals);
  } catch (error) {
    console.error("Erro ao buscar progresso por categoria:", error);
    res.status(500).json({ message: "Erro ao buscar progresso por categoria." });
  }
};

export const saveGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { meta, descricao, valor_total, valor_atual, data_conclusao, userId, categoria, prioridade } = req.body;

    if (!meta || !valor_total || !data_conclusao || !userId) {
      res.status(400).json({ message: "Campos obrigatórios faltando." });
      return;
    }

    const newGoal = new Goal({ 
      meta, 
      descricao, 
      valor_total, 
      valor_atual: valor_atual || 0, 
      data_conclusao, 
      userId,
      categoria,
      prioridade
    });
    
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