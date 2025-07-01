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
    const userId = req.user?._id || req.user?.uid;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error: unknown) {
    console.error("Erro ao buscar metas:", error);
    res.status(500).json({
      message: 'Erro ao buscar metas',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const getGoalsProgressByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id || req.user?.uid;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    const goalsProgress: ProgressoCategoria[] = await Goal.aggregate([
      {
        $match: {
          userId: userId, // Usar userId diretamente como string
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

export const createGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id || req.user?.uid;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    const { meta, valor_total, data_conclusao, categoria } = req.body;

    if (!meta?.trim()) {
      res.status(400).json({ message: "Nome da meta é obrigatório" });
      return;
    }

    const valorNumerico = Number(valor_total);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      res.status(400).json({ message: "Valor total deve ser um número positivo válido" });
      return;
    }

    const dataObj = data_conclusao ? new Date(data_conclusao) : new Date();
    if (isNaN(dataObj.getTime())) {
      res.status(400).json({ message: "Data de conclusão inválida" });
      return;
    }

    const novaMeta = new Goal({
      meta: meta.trim(),
      valor_total: valorNumerico,
      data_conclusao: dataObj,
      categoria: categoria || 'Outros',
      userId
    });

    await novaMeta.save();
    res.status(201).json(novaMeta);
  } catch (error: unknown) {
    console.error('Erro ao criar meta:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({
        message: 'Erro de validação',
        details: errors
      });
    } else {
      res.status(500).json({
        message: 'Erro ao criar meta',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
};

export const updateGoal = async (req: Request, res: Response): Promise<void> => {
  const { id: goalId } = req.params;
  const userId = req.user?._id || req.user?.uid;

  if (!userId) {
    res.status(401).json({ message: "Usuário não autenticado." });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    res.status(400).json({ message: 'ID da meta inválido' });
    return;
  }

  try {
    const { meta, valor_total, data_conclusao, categoria } = req.body;
    const updateData: any = {};

    if (meta !== undefined) {
      if (!meta.trim()) {
        res.status(400).json({ message: "Nome da meta não pode ser vazio" });
        return;
      }
      updateData.meta = meta.trim();
    }

    if (valor_total !== undefined) {
      const valorNumerico = Number(valor_total);
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        res.status(400).json({ message: "Valor total deve ser um número positivo válido" });
        return;
      }
      updateData.valor_total = valorNumerico;
    }

    if (data_conclusao !== undefined) {
      const dataObj = new Date(data_conclusao);
      if (isNaN(dataObj.getTime())) {
        res.status(400).json({ message: "Data de conclusão inválida" });
        return;
      }
      updateData.data_conclusao = dataObj;
    }

    if (categoria !== undefined) {
      updateData.categoria = categoria;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "Nenhum dado fornecido para atualização." });
      return;
    }

    const metaAtualizada = await Goal.findOneAndUpdate(
      { _id: goalId, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!metaAtualizada) {
      res.status(404).json({ message: 'Meta não encontrada ou não pertence ao usuário' });
      return;
    }

    res.json(metaAtualizada);
  } catch (error: unknown) {
    console.error('Erro ao atualizar meta:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({
        message: 'Erro de validação',
        details: errors
      });
    } else {
      res.status(500).json({
        message: 'Erro ao atualizar meta',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
};

export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
  const { id: goalId } = req.params;
  const userId = req.user?._id || req.user?.uid;

  if (!userId) {
    res.status(401).json({ message: "Usuário não autenticado." });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    res.status(400).json({ message: 'ID da meta inválido' });
    return;
  }

  try {
    const metaDeletada = await Goal.findOneAndDelete({ _id: goalId, userId });

    if (!metaDeletada) {
      res.status(404).json({ message: 'Meta não encontrada ou não pertence ao usuário' });
      return;
    }

    res.status(204).end();
  } catch (error: unknown) {
    console.error('Erro ao excluir meta:', error);
    res.status(500).json({
      message: 'Erro ao excluir meta',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const suggestAndAddGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    const { meta, valor_total, data_conclusao, categoria, confirmacao } = req.body;

    // Se não confirmado, apenas retorna a sugestão
    if (!confirmacao) {
      const sugestao = {
        meta: meta?.trim() || "Meta sem nome",
        valor_total: valor_total || 0,
        data_conclusao: data_conclusao ? new Date(data_conclusao) : new Date(),
        categoria: categoria || "Outros",
        userId,
        status: "pendente",
        mensagem: "Por favor, confirme os dados da meta"
      };

      res.json({
        ...sugestao,
        acoes: [
          { acao: "confirmar", texto: "Confirmar", endpoint: `/api/metas/sugestao`, metodo: "POST" },
          { acao: "editar", texto: "Editar", camposEditaveis: ["meta", "valor_total", "data_conclusao", "categoria"] }
        ]
      });
      return;
    }

    // Se confirmado, processa normalmente
    await createGoal(req, res);
  } catch (error: unknown) {
    console.error('Erro ao sugerir meta:', error);
    res.status(500).json({
      message: 'Erro ao sugerir meta',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};