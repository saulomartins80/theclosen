import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Investimento from '../models/Investimento'; // Seu modelo de Investimento

// A interface AuthenticatedRequest foi removida daqui

const TIPOS_VALIDOS = [
  'Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários',
  'Criptomoedas', 'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável'
] as const;

export const getInvestimentos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    const { tipo, dataInicio, dataFim } = req.query;
    const filter: any = { userId }; // ADICIONAR userId AO FILTRO BASE

    if (tipo && TIPOS_VALIDOS.includes(tipo as any)) {
      filter.tipo = tipo;
    }

    if (dataInicio || dataFim) {
      filter.data = filter.data || {}; // Garante que filter.data exista
      if (dataInicio) filter.data.$gte = new Date(dataInicio as string);
      if (dataFim) filter.data.$lte = new Date(dataFim as string);
    }

    const investimentos = await Investimento.find(filter).sort({ data: -1 });
    res.json(investimentos);
  } catch (error: unknown) {
    console.error("Erro ao buscar investimentos:", error);
    res.status(500).json({
      message: 'Erro ao buscar investimentos',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const addInvestimento = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    const { nome, valor, data, tipo } = req.body;

    if (!nome?.trim()) {
      res.status(400).json({ message: "Nome é obrigatório" });
      return;
    }

    const valorNumerico = Number(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      res.status(400).json({ message: "Valor deve ser um número positivo válido" });
      return;
    }

    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
      res.status(400).json({
        message: "Tipo de investimento inválido",
        tiposValidos: TIPOS_VALIDOS
      });
      return;
    }

    const dataObj = data ? new Date(data) : new Date();
    if (isNaN(dataObj.getTime())) {
      res.status(400).json({ message: "Data inválida" });
      return;
    }

    const novoInvestimento = new Investimento({
      nome: nome.trim(),
      valor: valorNumerico,
      data: dataObj,
      tipo,
      userId // ASSOCIAR O userId
    });

    await novoInvestimento.save();
    res.status(201).json(novoInvestimento);
  } catch (error: unknown) {
    console.error('Erro no servidor ao adicionar investimento:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({
        message: 'Erro de validação',
        details: errors
      });
    } else {
      res.status(500).json({ // Mudado para 500 para erros inesperados
        message: 'Erro ao criar investimento',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
};

export const updateInvestimento = async (req: Request, res: Response): Promise<void> => {
  const { id: investimentoId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Usuário não autenticado." });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(investimentoId)) {
    res.status(400).json({ message: 'ID do investimento inválido' });
    return;
  }

  try {
    const { nome, valor, data, tipo } = req.body;
    const updateData: any = {};

    if (nome !== undefined) {
        if (!nome.trim()) {
            res.status(400).json({ message: "Nome não pode ser vazio" });
            return;
        }
        updateData.nome = nome.trim();
    }
    if (valor !== undefined) {
        const valorNumerico = Number(valor);
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            res.status(400).json({ message: "Valor deve ser um número positivo válido" });
            return;
        }
        updateData.valor = valorNumerico;
    }
    if (tipo !== undefined) {
        if (!TIPOS_VALIDOS.includes(tipo)) {
            res.status(400).json({ message: "Tipo de investimento inválido", tiposValidos: TIPOS_VALIDOS });
            return;
        }
        updateData.tipo = tipo;
    }
    if (data !== undefined) {
        const dataObj = new Date(data);
        if (isNaN(dataObj.getTime())) {
            res.status(400).json({ message: "Data inválida" });
            return;
        }
        updateData.data = dataObj;
    }
    
    if (Object.keys(updateData).length === 0) {
        res.status(400).json({ message: "Nenhum dado fornecido para atualização." });
        return;
    }

    const investimentoAtualizado = await Investimento.findOneAndUpdate(
      { _id: investimentoId, userId }, // GARANTIR QUE O INVESTIMENTO PERTENCE AO USUÁRIO
      updateData,
      { new: true, runValidators: true }
    );

    if (!investimentoAtualizado) {
      res.status(404).json({ message: 'Investimento não encontrado ou não pertence ao usuário' });
      return;
    }

    res.json(investimentoAtualizado);
  } catch (error: unknown) {
    console.error('Erro ao atualizar investimento:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({
        message: 'Erro de validação',
        details: errors
      });
    } else {
      res.status(500).json({ // Mudado para 500 para erros inesperados
        message: 'Erro ao atualizar investimento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
};

export const deleteInvestimento = async (req: Request, res: Response): Promise<void> => {
  const { id: investimentoId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Usuário não autenticado." });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(investimentoId)) {
    res.status(400).json({ message: 'ID do investimento inválido' });
    return;
  }

  try {
    const investimentoDeletado = await Investimento.findOneAndDelete({ _id: investimentoId, userId }); // GARANTIR QUE O INVESTIMENTO PERTENCE AO USUÁRIO

    if (!investimentoDeletado) {
      res.status(404).json({ message: 'Investimento não encontrado ou não pertence ao usuário' });
      return;
    }

    res.status(204).end(); // Sucesso, sem conteúdo
  } catch (error: unknown) {
    console.error('Erro ao excluir investimento:', error);
    res.status(500).json({
      message: 'Erro ao excluir investimento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};