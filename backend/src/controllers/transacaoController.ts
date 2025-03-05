import { Request, Response } from 'express';
import Transacao, { ITransacaoDocument } from '../models/Transacao';

export const createTransacao = async (req: Request, res: Response) => {
  try {
    const novaTransacao: ITransacaoDocument = new Transacao(req.body);
    await novaTransacao.save();
    res.status(201).json(novaTransacao);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar transação', error });
  }
};

export const getTransacoes = async (req: Request, res: Response) => {
  try {
    const transacoes = await Transacao.find();
    res.status(200).json(transacoes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar transações', error });
  }
};

export const updateTransacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transacaoAtualizada = await Transacao.findByIdAndUpdate(id, req.body, { new: true });
    if (!transacaoAtualizada) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    res.status(200).json(transacaoAtualizada);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar transação', error });
  }
};

export const deleteTransacao = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transacaoDeletada = await Transacao.findByIdAndDelete(id);
    if (!transacaoDeletada) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    res.status(200).json({ message: 'Transação excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir transação', error });
  }
};