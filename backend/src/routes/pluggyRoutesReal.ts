import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import PluggyService from '../services/pluggyService';

const router = express.Router();

// Todas as rotas Pluggy requerem autenticação
router.use(authMiddleware);

// Gera token para conectar com a Pluggy
router.get('/connect-token', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    
    // ✅ IMPLEMENTAÇÃO REAL: Usar serviço Pluggy
    const pluggyService = new PluggyService();
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connect`;
    
    const tokenData = await pluggyService.createConnectToken(redirectUrl);
    
    res.json({
      success: true,
      token: tokenData.accessToken,
      expiresIn: tokenData.expiresIn,
      redirectUrl: redirectUrl
    });
  } catch (error: any) {
    console.error('❌ Erro na API Pluggy:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao gerar token de conexão Pluggy',
      details: error.message
    });
  }
}));

// Resumo de milhas acumuladas
router.get('/mileage-summary', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    
    // ✅ IMPLEMENTAÇÃO REAL: Buscar dados reais do Pluggy
    const pluggyService = new PluggyService();
    const items = await pluggyService.getItems();
    
    let totalMiles = 0;
    let totalValue = 0;
    let totalTransactions = 0;
    
    // Processar cada item (conexão bancária)
    for (const item of items) {
      if (item.status === 'UPDATED') {
        for (const account of item.accounts) {
          try {
            const transactions = await pluggyService.getTransactions(
              item.id, 
              account.id,
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Últimos 30 dias
            );
            
            const milesData = pluggyService.calculateMilesFromTransactions(transactions);
            totalMiles += milesData.totalMiles;
            totalValue += milesData.estimatedValue;
            totalTransactions += transactions.length;
          } catch (error) {
            console.error(`Erro ao processar transações da conta ${account.id}:`, error);
          }
        }
      }
    }
    
    res.json({
      success: true,
      summary: {
        totalConnections: items.length,
        activeConnections: items.filter(item => item.status === 'UPDATED').length,
        lastSync: new Date().toISOString(),
        totalPoints: Math.round(totalMiles),
        estimatedValue: totalValue,
        totalTransactions: totalTransactions
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Falha ao buscar resumo de milhas',
      details: error.message
    });
  }
}));

// ✅ IMPLEMENTAÇÃO REAL: Buscar conexões Pluggy
router.get('/connections', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    
    const pluggyService = new PluggyService();
    const items = await pluggyService.getItems();
    
    const connections = items.map(item => ({
      id: item.id,
      bankName: item.institution.name,
      accountType: item.institution.type,
      lastSync: item.updatedAt,
      status: item.status === 'UPDATED' ? 'connected' : 'error',
      accounts: item.accounts.map(account => account.name)
    }));
    
    res.json({
      success: true,
      connections: connections
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Falha ao buscar conexões Pluggy',
      details: error.message
    });
  }
}));

// ✅ NOVA ROTA: Desconectar conexão Pluggy
router.delete('/connections/:itemId', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { itemId } = req.params;
    
    const pluggyService = new PluggyService();
    await pluggyService.deleteItem(itemId);
    
    res.json({
      success: true,
      message: 'Conexão desconectada com sucesso'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Falha ao desconectar Pluggy',
      details: error.message
    });
  }
}));

// ✅ NOVA ROTA: Buscar transações de uma conexão
router.get('/connections/:itemId/transactions', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { itemId } = req.params;
    const { from, to } = req.query;
    
    const pluggyService = new PluggyService();
    const item = await pluggyService.getItem(itemId);
    
    const allTransactions = [];
    
    for (const account of item.accounts) {
      try {
        const transactions = await pluggyService.getTransactions(
          itemId,
          account.id,
          from as string,
          to as string
        );
        
        allTransactions.push(...transactions.map(t => ({
          ...t,
          accountName: account.name,
          institutionName: item.institution.name
        })));
      } catch (error) {
        console.error(`Erro ao buscar transações da conta ${account.id}:`, error);
      }
    }
    
    const milesData = pluggyService.calculateMilesFromTransactions(allTransactions);
    
    res.json({
      success: true,
      transactions: allTransactions,
      milesSummary: {
        totalSpent: milesData.totalSpent,
        totalMiles: milesData.totalMiles,
        estimatedValue: milesData.estimatedValue,
        categories: milesData.categories
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Falha ao buscar transações',
      details: error.message
    });
  }
}));

export default router; 