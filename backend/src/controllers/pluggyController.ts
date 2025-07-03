import { Request, Response } from 'express';
import { PluggyService } from '../services/pluggyService';
import { Mileage } from '../models/Mileage';
import mongoose from 'mongoose';

const pluggyService = new PluggyService();

export async function getConnectToken(req: Request, res: Response) {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const tokenData = await pluggyService.createConnectToken(userId.toString());
    res.json({
      success: true,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Falha ao criar connect token',
      details: error.message
    });
  }
}

export async function handleItemCreation(req: Request, res: Response) {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'itemId é obrigatório' });
    }
    // Processamento assíncrono das contas e transações
    setImmediate(async () => {
      try {
        const accounts = await pluggyService.getAccounts(itemId);
        for (const account of accounts) {
          if (account.type === 'CREDIT' || account.type === 'BANK') {
            await pluggyService.processTransactionsForMiles(userId.toString(), account.id);
          }
        }
      } catch (err) {
        console.error('Erro no processamento Pluggy:', err);
      }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Falha ao processar item criado',
      details: error.message
    });
  }
}

export async function getMileageSummary(req: Request, res: Response) {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const summary = await pluggyService.getMileageSummary(userId.toString());
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Falha ao obter resumo de milhas',
      details: error.message
    });
  }
} 