import { Request, Response } from 'express';
import PluggyService from '../services/pluggyServiceFixed';
import { MileageSummary } from '../models/Mileage';
import mongoose from 'mongoose';

const pluggyService = new PluggyService();

export async function getConnectToken(req: Request, res: Response) {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connect`;
    const tokenData = await pluggyService.createConnectToken(redirectUrl);
    
    res.json({
      success: true,
      token: tokenData.accessToken,
      expiresIn: tokenData.expiresIn,
      redirectUrl: redirectUrl
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
        const item = await pluggyService.getItem(itemId);
        for (const account of item.accounts) {
          if (account.type === 'CREDIT' || account.type === 'BANK') {
            const transactions = await pluggyService.getTransactions(itemId, account.id);
            const milesData = pluggyService.calculateMilesFromTransactions(transactions);
            
            // Salvar dados de milhas no banco
            await MileageSummary.findOneAndUpdate(
              { userId: userId.toString() },
              {
                userId: userId.toString(),
                itemId,
                accountId: account.id,
                totalMiles: milesData.totalMiles,
                totalSpent: milesData.totalSpent,
                estimatedValue: milesData.estimatedValue,
                lastUpdated: new Date()
              },
              { upsert: true, new: true }
            );
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
    
    // Buscar dados de milhas do banco
    const mileageData = await MileageSummary.find({ userId: userId.toString() });
    
    let totalMiles = 0;
    let totalValue = 0;
    let totalConnections = 0;
    
    mileageData.forEach(data => {
      totalMiles += data.totalMiles || 0;
      totalValue += data.estimatedValue || 0;
      totalConnections++;
    });
    
    const summary = {
      totalConnections,
      activeConnections: totalConnections,
      lastSync: new Date().toISOString(),
      totalPoints: Math.round(totalMiles),
      estimatedValue: totalValue,
      totalTransactions: 0
    };
    
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Falha ao obter resumo de milhas',
      details: error.message
    });
  }
} 