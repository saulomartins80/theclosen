import { Request, Response } from "express"; // Usar Request padrão do Express
import { Goal } from "../models/Goal";
import mongoose from "mongoose";

// REMOVIDA A INTERFACE AuthenticatedRequest LOCAL.
// O tipo de req.user virá da declaração global em src/@types/express/index.d.ts

// Interface para os dados de progresso (mantida como estava)
interface ProgressoCategoria {
  categoria: string;
  percentual_conclusao: number;
  valor_total: number;
  valor_atual: number;
  count: number;
}

export const getGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }
    const goals = await Goal.find({ userId }); // FILTRAR POR USERID
    res.json({ metas: goals });
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    res.status(500).json({ message: "Erro ao buscar metas." });
  }
};

export const getGoalsProgressByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    const goalsProgress: ProgressoCategoria[] = await Goal.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId), // FILTRAR POR USERID
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
            $cond: { // Evitar divisão por zero
              if: { $eq: ["$valor_total", 0] },
              then: 0,
              else: { $round: [{ $multiply: [{ $divide: ["$valor_atual", "$valor_total"] }, 100] }, 2] }
            }
          },
          valor_total: 1,
          valor_atual: 1,
          count: 1,
          _id: 0
        }
      },
      { $sort: { percentual_conclusao: -1 } }
    ]);

    res.json(goalsProgress);
  } catch (error) {
    console.error("Erro ao buscar progresso por categoria:", error);
    res.status(500).json({ message: "Erro ao buscar progresso por categoria." });
  }
};

export const saveGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id; // PEGAR userId DO USUÁRIO AUTENTICADO
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    // Remover userId de req.body se ele estiver vindo de lá para evitar confusão
    const { meta, descricao, valor_total, valor_atual, data_conclusao, categoria, prioridade } = req.body;

    if (!meta || valor_total === undefined || !data_conclusao) { // userId não é mais validado aqui
      res.status(400).json({ message: "Campos 'meta', 'valor_total' e 'data_conclusao' são obrigatórios." });
      return;
    }

    // Validação de data_conclusao
    const dataConclusaoDate = new Date(data_conclusao);
    if (isNaN(dataConclusaoDate.getTime())) {
        res.status(400).json({ message: "Data de conclusão inválida." });
        return;
    }

    const newGoal = new Goal({
      meta,
      descricao,
      valor_total,
      valor_atual: valor_atual || 0,
      data_conclusao: dataConclusaoDate,
      userId, // USAR O userId DO USUÁRIO AUTENTICADO
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
    if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({ message: "Erro de validação.", errors: error.errors });
    } else {
        res.status(500).json({ message: "Erro ao salvar meta." });
    }
  }
};

export const updateGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: goalId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
        res.status(400).json({ message: "ID da meta inválido." });
        return;
    }

    // Remover userId de req.body se ele estiver vindo de lá, para não sobrescrever
    const updateData = { ...req.body };
    delete updateData.userId;

    // Validar data_conclusao se presente
    if (updateData.data_conclusao) {
        const dataConclusaoDate = new Date(updateData.data_conclusao);
        if (isNaN(dataConclusaoDate.getTime())) {
            res.status(400).json({ message: "Data de conclusão inválida." });
            return;
        }
        updateData.data_conclusao = dataConclusaoDate;
    }

    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: goalId, userId }, // GARANTIR QUE A META PERTENCE AO USUÁRIO
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedGoal) {
      res.status(404).json({ message: "Meta não encontrada ou não pertence ao usuário." });
      return;
    }

    res.json({
      message: "Meta atualizada com sucesso!",
      meta: updatedGoal
    });
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({ message: "Erro de validação.", errors: error.errors });
    } else {
        res.status(500).json({ message: "Erro ao atualizar meta." });
    }
  }
};

export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: goalId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
        res.status(400).json({ message: "ID da meta inválido." });
        return;
    }

    const deletedGoal = await Goal.findOneAndDelete({ _id: goalId, userId }); // GARANTIR QUE A META PERTENCE AO USUÁRIO

    if (!deletedGoal) {
      res.status(404).json({ message: "Meta não encontrada ou não pertence ao usuário." });
      return;
    }

    res.json({
      message: "Meta excluída com sucesso!",
      id: deletedGoal._id // Mantido como estava, mas poderia ser deletedGoal.id
    });
  } catch (error) {
    console.error("Erro ao excluir meta:", error);
    res.status(500).json({ message: "Erro ao excluir meta." });
  }
};