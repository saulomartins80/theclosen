import express from 'express';
import { getConnectToken, handleItemCreation, getMileageSummary } from '../controllers/pluggyController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Todas as rotas Pluggy requerem autenticação
router.use(authMiddleware);

// Gera token para conectar com a Pluggy
router.get('/connect-token', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    
    // ✅ CORREÇÃO: Verificar se as credenciais do Pluggy estão configuradas
    const pluggyClientId = process.env.PLUGGY_CLIENT_ID;
    const pluggyApiKey = process.env.PLUGGY_API_KEY;
    
    if (!pluggyClientId || !pluggyApiKey) {
      console.error('❌ Credenciais do Pluggy não configuradas');
      return res.status(500).json({
        success: false,
        error: 'Configuração do Pluggy incompleta',
        details: 'PLUGGY_CLIENT_ID e PLUGGY_API_KEY não encontrados'
      });
    }
    
    // TODO: Implementar integração real com Pluggy
    // Por enquanto, retorna token mockado
    res.json({
      success: true,
      token: 'mock_pluggy_token_' + Date.now(),
      expiresIn: 3600
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

// Callback para quando o item é criado na Pluggy
router.post('/item-created', asyncHandler(handleItemCreation));

// Resumo de milhas acumuladas
router.get('/mileage-summary', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    
    // TODO: Implementar integração real com Pluggy
    // Por enquanto, retorna dados mockados
    res.json({
      success: true,
      summary: {
        totalConnections: 0,
        activeConnections: 0,
        lastSync: null,
        totalPoints: 0,
        estimatedValue: 0
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

// ✅ CORREÇÃO: Rotas básicas do Pluggy para resolver erros 404
router.get('/connections', asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    
    // TODO: Implementar integração real com Pluggy
    // Por enquanto, retorna dados mockados
    res.json({
      success: true,
      connections: []
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Falha ao buscar conexões Pluggy',
      details: error.message
    });
  }
}));

export default router; 