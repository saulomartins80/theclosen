import { Request, Response } from "express"; // Usar Request padrão do Express
import mongoose from "mongoose";
import { Transacoes, ITransacaoDocument } from "../models/Transacoes";

// REMOVIDA A INTERFACE AuthenticatedRequest LOCAL.
// O tipo de req.user virá da declaração global em src/@types/express/index.d.ts

export const createTransacao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { descricao, valor, data, categoria, tipo, conta } = req.body;
    const userId = req.user?._id || req.user?.uid; // Usar _id ou uid do Firebase

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    if (!descricao || valor === undefined || !data || !categoria || !tipo || !conta) {
      res.status(400).json({ message: "Todos os campos são obrigatórios." });
      return;
    }

    const valorNumerico = typeof valor === 'string'
      ? parseFloat(valor.replace(',', '.'))
      : Number(valor);

    if (isNaN(valorNumerico)) {
      res.status(400).json({ message: "Valor inválido." });
      return;
    }

    if (tipo === "transferencia" && valorNumerico === 0) {
      res.status(400).json({ message: "Valor de transferência não pode ser zero." });
      return;
    }

    const dataDate = typeof data === 'object' && data.$date
      ? new Date(data.$date)
      : new Date(data);

    if (isNaN(dataDate.getTime())) {
      res.status(400).json({ message: "Data inválida." });
      return;
    }

    const novaTransacao = new Transacoes({
      descricao,
      valor: valorNumerico,
      data: dataDate,
      categoria,
      tipo,
      conta,
      userId, // Associando o userId à transação
    });

    await novaTransacao.save();
    res.status(201).json(novaTransacao);
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({ message: "Erro de validação.", errors: error.errors });
    } else {
        res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};

export const getTransacoes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id || req.user?.uid;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    console.log("getTransacoes: userId =", userId);

    // Filtrando transações pelo userId
    const transacoes = await Transacoes.find({ userId }).sort({ data: -1 });

    console.log("getTransacoes: query =", { userId });
    console.log("getTransacoes: results =", transacoes);

    res.status(200).json(transacoes);
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const updateTransacao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: transacaoId } = req.params;
    const userId = req.user?._id || req.user?.uid;
    
    // DESESTRUTURAR req.body AQUI TAMBÉM
    const { descricao, valor, data, categoria, tipo, conta } = req.body;


    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(transacaoId)) {
      res.status(400).json({ message: "ID da transação inválido." });
      return;
    }

    // As validações agora usarão as variáveis desestruturadas
    if (!descricao || valor === undefined || !data || !categoria || !tipo || !conta) {
      res.status(400).json({ message: "Todos os campos são obrigatórios para atualização." });
      return;
    }

    const valorNumerico = typeof valor === 'string'
      ? parseFloat(valor.replace(',', '.'))
      : Number(valor);

    if (isNaN(valorNumerico)) {
      res.status(400).json({ message: "Valor inválido para atualização." });
      return;
    }

    if (tipo === "transferencia" && valorNumerico === 0) {
      res.status(400).json({ message: "Valor de transferência não pode ser zero para atualização." });
      return;
    }

    const dataDate = typeof data === 'object' && data.$date
      ? new Date(data.$date)
      : new Date(data);

    if (isNaN(dataDate.getTime())) {
      res.status(400).json({ message: "Data inválida para atualização." });
      return;
    }

    const transacaoAtualizada = await Transacoes.findOneAndUpdate(
      { _id: transacaoId, userId }, // Condição para encontrar a transação E garantir que pertence ao usuário
      { descricao, valor: valorNumerico, data: dataDate, categoria, tipo, conta }, // Variáveis agora definidas
      { new: true, runValidators: true }
    );

    if (!transacaoAtualizada) {
      res.status(404).json({ message: "Transação não encontrada ou não pertence ao usuário." });
      return;
    }

    res.status(200).json(transacaoAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
     if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({ message: "Erro de validação ao atualizar.", errors: error.errors });
    } else {
        res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
};

export const deleteTransacao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: transacaoId } = req.params;
    const userId = req.user?._id || req.user?.uid;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(transacaoId)) {
      res.status(400).json({ message: "ID da transação inválido." });
      return;
    }

    const transacaoDeletada = await Transacoes.findOneAndDelete({ _id: transacaoId, userId }); // Condição para encontrar E garantir que pertence ao usuário

    if (!transacaoDeletada) {
      res.status(404).json({ message: "Transação não encontrada ou não pertence ao usuário." });
      return;
    }

    res.status(200).json({ message: "Transação excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const suggestAndAddTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id || req.user?.uid;
    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado." });
      return;
    }

    const { valor, tipo, categoria, descricao, conta, data, confirmacao } = req.body;

    // Se não confirmado, apenas retorna a sugestão
    if (!confirmacao) {
      const sugestao = {
        valor: valor || 0,
        tipo: tipo || "despesa",
        categoria: categoria || "outros",
        descricao: descricao || "Transação sem descrição",
        conta: conta || "Conta Corrente",
        data: data ? new Date(data) : new Date(),
        userId,
        status: "pendente",
        mensagem: "Por favor, confirme os dados da transação"
      };

      res.json({
        ...sugestao,
        acoes: [
          { acao: "confirmar", texto: "Confirmar", endpoint: `/api/transacoes/sugestao`, metodo: "POST" },
          { acao: "editar", texto: "Editar", camposEditaveis: ["valor", "tipo", "categoria", "descricao", "conta", "data"] }
        ]
      });
      return;
    }

    // Se confirmado, processa normalmente
    await createTransacao(req, res);
  } catch (error: unknown) {
    console.error('Erro ao sugerir transação:', error);
    res.status(500).json({
      message: 'Erro ao sugerir transação',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};