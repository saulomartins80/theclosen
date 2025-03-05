import { Request, Response } from 'express';
import Transaction from '../models/Transaction';

// Middleware para tratamento de erros
export const errorHandler = (fn: Function) => async (req: Request, res: Response, next: Function) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ message: 'Erro interno no servidor', error });
  }
};

// Busca todas as transações com paginação
export const getTransactions = errorHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 10);

  const transactions = await Transaction.find()
    .limit(limit)
    .skip((page - 1) * limit)
    .exec();

  const total = await Transaction.countDocuments();

  res.json({
    transactions,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  });
});

// Busca o saldo (receitas - despesas)
export const getSaldo = errorHandler(async (req: Request, res: Response) => {
  const [receitas, despesas] = await Promise.all([
    Transaction.aggregate([
      { $match: { tipo: 'receita' } },
      { $group: { _id: null, total: { $sum: '$valor' } } },
    ]),
    Transaction.aggregate([
      { $match: { tipo: 'despesa' } },
      { $group: { _id: null, total: { $sum: '$valor' } } },
    ]),
  ]);

  const saldo = (receitas[0]?.total || 0) - (despesas[0]?.total || 0);
  res.json({ saldo });
});

// Busca o total de receitas
export const getReceitas = errorHandler(async (req: Request, res: Response) => {
  const receitas = await Transaction.aggregate([
    { $match: { tipo: 'receita' } },
    { $group: { _id: null, total: { $sum: '$valor' } } },
  ]);

  res.json({ receitas: receitas[0]?.total || 0 });
});

// Busca o total de despesas
export const getDespesas = errorHandler(async (req: Request, res: Response) => {
  const despesas = await Transaction.aggregate([
    { $match: { tipo: 'despesa' } },
    { $group: { _id: null, total: { $sum: '$valor' } } },
  ]);

  res.json({ despesas: despesas[0]?.total || 0 });
});