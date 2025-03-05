import { Request, Response } from 'express';
import Transaction from '../models/Transaction'; // Importação corrigida

export const getBalance = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find();
    const balance = transactions.reduce((acc: number, transaction: any) => acc + transaction.amount, 0);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar saldo' });
  }
};
