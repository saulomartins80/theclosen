import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Investimento from '../models/Investimento';

// Adicione no array de TIPOS_VALIDOS:
const TIPOS_VALIDOS = [
  'Renda Fixa',
  'Tesouro Direto',
  'Ações',
  'Fundos Imobiliários',
  'Criptomoedas',
  'Previdência Privada',
  'ETF',
  'Internacional',
  'Renda Variável' 
] as const;

export const getInvestimentos = async (req: Request, res: Response): Promise<void> => {
  try {
    // Adicionando filtros opcionais via query params
    const { tipo, dataInicio, dataFim } = req.query;
    
    const filter: any = {};
    
    if (tipo && TIPOS_VALIDOS.includes(tipo as any)) {
      filter.tipo = tipo;
    }
    
    if (dataInicio || dataFim) {
      filter.data = {};
      if (dataInicio) filter.data.$gte = new Date(dataInicio as string);
      if (dataFim) filter.data.$lte = new Date(dataFim as string);
    }

    const investimentos = await Investimento.find(filter).sort({ data: -1 });
    res.json(investimentos);
  } catch (error: unknown) {
    res.status(500).json({ 
      message: 'Erro ao buscar investimentos',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const addInvestimento = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Corpo recebido:', req.body);

    const { nome, valor, data, tipo } = req.body;

    if (!nome?.trim()) {
      res.status(400).json({ message: "Nome é obrigatório" });
      return;
    }

    const valorNumerico = Number(valor);
    if (isNaN(valorNumerico)) {
      res.status(400).json({ message: "Valor deve ser um número válido" });
      return;
    }

    if (valorNumerico <= 0) {
      res.status(400).json({ message: "Valor deve ser positivo" });
      return;
    }

    // Atualizado para usar os novos tipos
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
      tipo
    });

    await novoInvestimento.save();
    res.status(201).json(novoInvestimento);
  } catch (error: unknown) {
    console.error('Erro no servidor:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ 
        message: 'Erro de validação',
        details: errors 
      });
      return;
    }

    res.status(400).json({ 
      message: 'Erro ao criar investimento',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error instanceof Error ? error.stack : undefined
      })
    });
  }
};

export const updateInvestimento = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'ID inválido' });
    return;
  }

  try {
    const { nome, valor, data, tipo } = req.body;

    if (nome && !nome.trim()) {
      res.status(400).json({ message: "Nome não pode ser vazio" });
      return;
    }

    if (valor && isNaN(Number(valor))) {
      res.status(400).json({ message: "Valor deve ser um número válido" });
      return;
    }

    // Validação do tipo atualizada
    if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
      res.status(400).json({ 
        message: "Tipo de investimento inválido",
        tiposValidos: TIPOS_VALIDOS
      });
      return;
    }

    const dataObj = data ? new Date(data) : undefined;
    if (dataObj && isNaN(dataObj.getTime())) {
      res.status(400).json({ message: "Data inválida" });
      return;
    }

    const investimentoAtualizado = await Investimento.findByIdAndUpdate(
      id,
      {
        ...(nome && { nome: nome.trim() }),
        ...(valor && { valor: Number(valor) }),
        ...(dataObj && { data: dataObj }),
        ...(tipo && { tipo })
      },
      { new: true, runValidators: true }
    );

    if (!investimentoAtualizado) {
      res.status(404).json({ message: 'Investimento não encontrado' });
      return;
    }

    res.json(investimentoAtualizado);
  } catch (error: unknown) {
    console.error('Erro ao atualizar:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ 
        message: 'Erro de validação',
        details: errors 
      });
      return;
    }

    res.status(400).json({
      message: 'Erro ao atualizar investimento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const deleteInvestimento = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'ID inválido' });
    return;
  }

  try {
    const investimento = await Investimento.findByIdAndDelete(id);

    if (!investimento) {
      res.status(404).json({ message: 'Investimento não encontrado' });
      return;
    }

    res.status(204).end();
  } catch (error: unknown) {
    console.error('Erro ao excluir:', error);
    res.status(500).json({
      message: 'Erro ao excluir investimento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};