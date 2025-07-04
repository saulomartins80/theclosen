import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Investimento from '../models/Investimento'; // Seu modelo de Investimento

// A interface AuthenticatedRequest foi removida daqui

const TIPOS_VALIDOS = [
  'Renda Fixa', 'Tesouro Direto', 'Ações', 'Fundos Imobiliários',
  'Criptomoedas', 'Previdência Privada', 'ETF', 'Internacional', 'Renda Variável',
  'LCI', 'LCA', 'CDB', 'CDI', 'Poupança', 'Fundos de Investimento', 'Debêntures',
  'CRA', 'CRI', 'Letras de Câmbio', 'COE', 'Fundos Multimercado', 'Fundos Cambiais',
  'Fundos de Ações', 'Fundos de Renda Fixa', 'Fundos de Previdência', 'Fundos de Crédito Privado'
] as const;

export const getInvestimentos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id || req.user?.uid;
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
    const userId = req.user?._id || req.user?.uid;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    const { 
      nome, 
      valor, 
      data, 
      tipo, 
      instituicao, 
      rentabilidade, 
      vencimento, 
      liquidez, 
      risco, 
      categoria 
    } = req.body;

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

    // Corrigir tratamento da data para evitar problemas de timezone
    let dataObj: Date;
    if (data) {
      // Se a data vem como string YYYY-MM-DD, adicionar horário UTC
      if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dataObj = new Date(data + 'T12:00:00Z');
      } else {
        dataObj = new Date(data);
      }
    } else {
      dataObj = new Date();
    }
    
    if (isNaN(dataObj.getTime())) {
      res.status(400).json({ message: "Data inválida" });
      return;
    }

    // Validar rentabilidade se fornecida
    let rentabilidadeNum: number | undefined;
    if (rentabilidade !== undefined) {
      rentabilidadeNum = Number(rentabilidade);
      if (isNaN(rentabilidadeNum) || rentabilidadeNum < 0 || rentabilidadeNum > 1000) {
        res.status(400).json({ message: "Rentabilidade deve ser um número entre 0 e 1000" });
        return;
      }
    }

    // Validar data de vencimento se fornecida
    let vencimentoObj: Date | undefined;
    if (vencimento) {
      vencimentoObj = new Date(vencimento);
      if (isNaN(vencimentoObj.getTime())) {
        res.status(400).json({ message: "Data de vencimento inválida" });
        return;
      }
    }

    // Validar liquidez se fornecida
    const liquidezValida = ['D+0', 'D+1', 'D+30', 'D+60', 'D+90', 'D+180', 'D+365', 'Sem liquidez'];
    if (liquidez && !liquidezValida.includes(liquidez)) {
      res.status(400).json({ message: "Liquidez inválida", valoresValidos: liquidezValida });
      return;
    }

    // Validar risco se fornecido
    const riscoValido = ['Baixo', 'Médio', 'Alto', 'Muito Alto'];
    if (risco && !riscoValido.includes(risco)) {
      res.status(400).json({ message: "Risco inválido", valoresValidos: riscoValido });
      return;
    }

    const novoInvestimento = new Investimento({
      nome: nome.trim(),
      valor: valorNumerico,
      data: dataObj,
      tipo,
      userId,
      // Novos campos opcionais
      ...(instituicao && { instituicao: instituicao.trim() }),
      ...(rentabilidadeNum !== undefined && { rentabilidade: rentabilidadeNum }),
      ...(vencimentoObj && { vencimento: vencimentoObj }),
      ...(liquidez && { liquidez }),
      ...(risco && { risco }),
      ...(categoria && { categoria: categoria.trim() })
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
  const userId = req.user?._id || req.user?.uid;

  if (!userId) {
    res.status(401).json({ message: "Usuário não autenticado." });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(investimentoId)) {
    res.status(400).json({ message: 'ID do investimento inválido' });
    return;
  }

  try {
    const { 
      nome, 
      valor, 
      data, 
      tipo, 
      instituicao, 
      rentabilidade, 
      vencimento, 
      liquidez, 
      risco, 
      categoria 
    } = req.body;
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
    
    // Novos campos opcionais
    if (instituicao !== undefined) {
        updateData.instituicao = instituicao.trim();
    }
    if (rentabilidade !== undefined) {
        const rentabilidadeNum = Number(rentabilidade);
        if (isNaN(rentabilidadeNum) || rentabilidadeNum < 0 || rentabilidadeNum > 1000) {
            res.status(400).json({ message: "Rentabilidade deve ser um número entre 0 e 1000" });
            return;
        }
        updateData.rentabilidade = rentabilidadeNum;
    }
    if (vencimento !== undefined) {
        const vencimentoObj = new Date(vencimento);
        if (isNaN(vencimentoObj.getTime())) {
            res.status(400).json({ message: "Data de vencimento inválida" });
            return;
        }
        updateData.vencimento = vencimentoObj;
    }
    if (liquidez !== undefined) {
        const liquidezValida = ['D+0', 'D+1', 'D+30', 'D+60', 'D+90', 'D+180', 'D+365', 'Sem liquidez'];
        if (!liquidezValida.includes(liquidez)) {
            res.status(400).json({ message: "Liquidez inválida", valoresValidos: liquidezValida });
            return;
        }
        updateData.liquidez = liquidez;
    }
    if (risco !== undefined) {
        const riscoValido = ['Baixo', 'Médio', 'Alto', 'Muito Alto'];
        if (!riscoValido.includes(risco)) {
            res.status(400).json({ message: "Risco inválido", valoresValidos: riscoValido });
            return;
        }
        updateData.risco = risco;
    }
    if (categoria !== undefined) {
        updateData.categoria = categoria.trim();
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
  const userId = req.user?._id || req.user?.uid;

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

export const suggestAndAddInvestment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id || req.user?.uid;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    const { nome, valor, data, tipo, confirmacao } = req.body;

    // Se não confirmado, apenas retorna a sugestão
    if (!confirmacao) {
      const sugestao = {
        nome: nome?.trim() || "Investimento sem nome",
        valor: valor || 0,
        data: data ? new Date(data) : new Date(),
        tipo: tipo || "Renda Fixa",
        userId,
        status: "pendente",
        mensagem: "Por favor, confirme os dados do investimento"
      };

      res.json({
        ...sugestao,
        acoes: [
          { acao: "confirmar", texto: "Confirmar", endpoint: `/api/investimentos/sugestao`, metodo: "POST" },
          { acao: "editar", texto: "Editar", camposEditaveis: ["nome", "valor", "data", "tipo"] }
        ]
      });
      return;
    }

    // Se confirmado, processa normalmente
    await addInvestimento(req, res);
  } catch (error: unknown) {
    console.error('Erro ao sugerir investimento:', error);
    res.status(500).json({
      message: 'Erro ao sugerir investimento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

export const getInvestimentoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: investimentoId } = req.params;
    const userId = req.user?._id || req.user?.uid;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    const investimento = await Investimento.findById(investimentoId);
    if (!investimento) {
      res.status(404).json({ message: 'Investimento não encontrado' });
      return;
    }

    res.json(investimento);
  } catch (error: unknown) {
    console.error('Erro ao buscar investimento:', error);
    res.status(500).json({
      message: 'Erro ao buscar investimento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};