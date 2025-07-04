import { useState, useEffect, useCallback } from 'react';
import { mileageAPI } from '@services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

interface MileageProgram {
  id: string;
  name: string;
  icon: string;
  totalPoints: number;
  estimatedValue: number;
  lastUpdated: Date;
  status: 'active' | 'inactive' | 'pending';
  color: string;
  partners: string[];
}

interface MileageTransaction {
  id: string;
  program: string;
  points: number;
  type: 'earned' | 'redeemed' | 'expired';
  date: Date;
  description: string;
  card?: string;
  value: number;
  category?: string;
}

interface MileageCard {
  id: string;
  name: string;
  bank: string;
  program: string;
  pointsPerReal: number;
  annualFee: number;
  benefits: string[];
  status: 'active' | 'inactive';
}

interface PluggyConnection {
  id: string;
  bankName: string;
  accountType: string;
  lastSync: Date;
  status: 'connected' | 'disconnected' | 'error';
  accounts: string[];
}

export const useMileage = () => {
  const { user, isAuthReady } = useAuth();
  const [mileagePrograms, setMileagePrograms] = useState<MileageProgram[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<MileageTransaction[]>([]);
  const [mileageCards, setMileageCards] = useState<MileageCard[]>([]);
  const [pluggyConnections, setPluggyConnections] = useState<PluggyConnection[]>([]);
  const [mileageAnalytics, setMileageAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar todos os dados de milhas
  const loadMileageData = useCallback(async () => {
    // Verificar se o usuário está autenticado antes de fazer chamadas
    if (!user || !isAuthReady) {
      console.log('[useMileage] Usuário não autenticado, pulando carregamento de dados');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const [programsRes, cardsRes, transactionsRes, analyticsRes] = await Promise.allSettled([
        mileageAPI.getMileagePrograms(),
        mileageAPI.getMileageCards(),
        mileageAPI.getMileageTransactions(),
        mileageAPI.getMileageAnalytics()
      ]);

      if (programsRes.status === 'fulfilled') {
        setMileagePrograms(programsRes.value.programs || []);
      } else {
        console.error('Erro ao carregar programas:', programsRes.reason);
        // Dados mock para programas
        setMileagePrograms([
          {
            id: 'smiles',
            name: 'Smiles',
            icon: '✈️',
            totalPoints: 25000,
            estimatedValue: 625.00,
            lastUpdated: new Date(),
            status: 'active' as const,
            color: '#00A1E0',
            partners: ['Gol', 'Azul', 'Latam']
          },
          {
            id: 'tudoazul',
            name: 'TudoAzul',
            icon: '🛩️',
            totalPoints: 18000,
            estimatedValue: 450.00,
            lastUpdated: new Date(),
            status: 'active' as const,
            color: '#0066CC',
            partners: ['Azul', 'Gol', 'Latam']
          }
        ]);
      }

      if (cardsRes.status === 'fulfilled') {
        setMileageCards(cardsRes.value.cards || []);
      } else {
        console.error('Erro ao carregar cartões:', cardsRes.reason);
        // Dados mock para cartões
        setMileageCards([
          {
            id: 'card-1',
            name: 'Itaú Personnalité Smiles',
            bank: 'Itaú',
            program: 'Smiles',
            pointsPerReal: 2.5,
            annualFee: 0,
            benefits: ['2.5 pts/R$ em todas as compras', 'Anuidade gratuita', 'Seguro viagem'],
            status: 'active' as const
          },
          {
            id: 'card-2',
            name: 'Nubank Ultravioleta',
            bank: 'Nubank',
            program: 'TudoAzul',
            pointsPerReal: 1.8,
            annualFee: 0,
            benefits: ['1.8 pts/R$ em todas as compras', 'Anuidade gratuita', 'Cashback'],
            status: 'active' as const
          }
        ]);
      }

      if (transactionsRes.status === 'fulfilled') {
        setRecentTransactions(transactionsRes.value.transactions || []);
      } else {
        console.error('Erro ao carregar transações:', transactionsRes.reason);
        // Dados mock para transações
        setRecentTransactions([
          {
            id: 'trans-1',
            program: 'Smiles',
            points: 375,
            type: 'earned' as const,
            date: new Date(),
            description: 'Compra no supermercado',
            card: '****4539',
            value: 150.00,
            category: 'Supermercado'
          },
          {
            id: 'trans-2',
            program: 'TudoAzul',
            points: 180,
            type: 'earned' as const,
            date: new Date(Date.now() - 86400000),
            description: 'Combustível',
            card: '****1234',
            value: 100.00,
            category: 'Transporte'
          }
        ]);
      }

      if (analyticsRes.status === 'fulfilled') {
        setMileageAnalytics(analyticsRes.value.analytics);
      } else {
        console.error('Erro ao carregar análises:', analyticsRes.reason);
        // Dados mock para analytics
        setMileageAnalytics({
          totalPoints: 43000,
          totalValue: 1075.00,
          monthlyGrowth: 12.5,
          topCategory: 'Supermercado',
          averagePointsPerMonth: 3500
        });
      }

    } catch (error) {
      console.error('Erro ao carregar dados de milhas:', error);
      setError('Erro ao carregar dados de milhas');
      toast.error('Erro ao carregar dados de milhas');
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthReady]);

  // Conectar com Pluggy
  const connectPluggy = useCallback(async () => {
    setIsLoading(true);
    try {
      const tokenData = await mileageAPI.getConnectToken();
      
      if (tokenData.token) {
        // ✅ CORREÇÃO: Usar URL de callback local em vez da URL do Pluggy
        const callbackUrl = `${window.location.origin}/connect?token=${tokenData.token}`;
        window.open(callbackUrl, '_blank');
        toast.success('Redirecionando para conexão...');
        return tokenData;
      }
    } catch (error) {
      console.error('Erro ao conectar Pluggy:', error);
      toast.error('Erro ao conectar com Pluggy');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Adicionar cartão de milhas
  const addMileageCard = useCallback(async (cardData: Omit<MileageCard, 'id'>) => {
    try {
      const newCard = await mileageAPI.addMileageCard(cardData);
      setMileageCards(prev => [...prev, newCard.card]);
      toast.success('Cartão adicionado com sucesso!');
      return newCard.card;
    } catch (error) {
      console.error('Erro ao adicionar cartão:', error);
      toast.error('Erro ao adicionar cartão');
      throw error;
    }
  }, []);

  // Atualizar cartão de milhas
  const updateMileageCard = useCallback(async (cardId: string, cardData: Partial<MileageCard>) => {
    try {
      const updatedCard = await mileageAPI.updateMileageCard(cardId, cardData);
      setMileageCards(prev => prev.map(card => 
        card.id === cardId ? updatedCard.card : card
      ));
      toast.success('Cartão atualizado com sucesso!');
      return updatedCard.card;
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error);
      toast.error('Erro ao atualizar cartão');
      throw error;
    }
  }, []);

  // Remover cartão de milhas
  const deleteMileageCard = useCallback(async (cardId: string) => {
    try {
      await mileageAPI.deleteMileageCard(cardId);
      setMileageCards(prev => prev.filter(card => card.id !== cardId));
      toast.success('Cartão removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover cartão:', error);
      toast.error('Erro ao remover cartão');
      throw error;
    }
  }, []);

  // Adicionar transação de milhas
  const addMileageTransaction = useCallback(async (transactionData: Omit<MileageTransaction, 'id' | 'date'>) => {
    try {
      const newTransaction = await mileageAPI.addMileageTransaction(transactionData);
      setRecentTransactions(prev => [newTransaction.transaction, ...prev]);
      toast.success('Transação adicionada com sucesso!');
      return newTransaction.transaction;
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      toast.error('Erro ao adicionar transação');
      throw error;
    }
  }, []);

  // Calcular milhas
  const calculateMiles = useCallback(async (params: any) => {
    try {
      const result = await mileageAPI.calculateMiles(params);
      return result.result;
    } catch (error) {
      console.error('Erro ao calcular milhas:', error);
      toast.error('Erro ao calcular milhas');
      throw error;
    }
  }, []);

  // Obter recomendações de cartões
  const getCardRecommendations = useCallback(async (monthlySpending: number, preferredPrograms?: string[]) => {
    try {
      const recommendations = await mileageAPI.getCardRecommendations(monthlySpending, preferredPrograms);
      return recommendations.recommendations;
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
      toast.error('Erro ao buscar recomendações');
      throw error;
    }
  }, []);

  // Carregar conexões Pluggy
  const loadPluggyConnections = useCallback(async () => {
    try {
      const connections = await mileageAPI.getPluggyConnections();
      setPluggyConnections(connections.connections || []);
      return connections.connections;
    } catch (error) {
      console.error('Erro ao carregar conexões Pluggy:', error);
      // Dados mock temporários quando backend não está disponível
      const mockConnections = [
        {
          id: 'mock-1',
          bankName: 'Nubank',
          accountType: 'Conta Corrente',
          lastSync: new Date(),
          status: 'connected' as const,
          accounts: ['1234-5']
        }
      ];
      setPluggyConnections(mockConnections);
      return mockConnections;
    }
  }, []);

  // Desconectar Pluggy
  const disconnectPluggyConnection = useCallback(async (connectionId: string) => {
    try {
      await mileageAPI.disconnectPluggyConnection(connectionId);
      setPluggyConnections(prev => prev.filter(conn => conn.id !== connectionId));
      toast.success('Conexão desconectada com sucesso!');
    } catch (error) {
      console.error('Erro ao desconectar Pluggy:', error);
      toast.error('Erro ao desconectar Pluggy');
      throw error;
    }
  }, []);

  // Atualizar programa de milhas
  const updateMileageProgram = useCallback(async (programId: string, data: any) => {
    try {
      const updatedProgram = await mileageAPI.updateMileageProgram(programId, data);
      setMileagePrograms(prev => prev.map(program => 
        program.id === programId ? updatedProgram.program : program
      ));
      toast.success('Programa atualizado com sucesso!');
      return updatedProgram.program;
    } catch (error) {
      console.error('Erro ao atualizar programa:', error);
      toast.error('Erro ao atualizar programa');
      throw error;
    }
  }, []);

  // Obter resumo de milhas
  const getMileageSummary = useCallback(async () => {
    try {
      const summary = await mileageAPI.getMileageSummary();
      return summary;
    } catch (error) {
      console.error('Erro ao obter resumo:', error);
      toast.error('Erro ao obter resumo de milhas');
      throw error;
    }
  }, []);

  // Buscar transações com filtros
  const getMileageTransactions = useCallback(async (filters?: any) => {
    try {
      const transactions = await mileageAPI.getMileageTransactions(filters);
      setRecentTransactions(transactions.transactions || []);
      return transactions.transactions;
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      toast.error('Erro ao buscar transações');
      throw error;
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    loadMileageData();
    loadPluggyConnections();
  }, [loadMileageData, loadPluggyConnections]);

  return {
    // Estado
    mileagePrograms,
    recentTransactions,
    mileageCards,
    pluggyConnections,
    mileageAnalytics,
    isLoading,
    error,
    
    // Ações
    loadMileageData,
    connectPluggy,
    addMileageCard,
    updateMileageCard,
    deleteMileageCard,
    addMileageTransaction,
    calculateMiles,
    getCardRecommendations,
    loadPluggyConnections,
    disconnectPluggyConnection,
    updateMileageProgram,
    getMileageSummary,
    getMileageTransactions,
    
    // Computed values
    totalPoints: mileagePrograms.reduce((sum, p) => sum + p.totalPoints, 0),
    totalValue: mileagePrograms.reduce((sum, p) => sum + p.estimatedValue, 0),
    activeCards: mileageCards.filter(c => c.status === 'active'),
    activePrograms: mileagePrograms.filter(p => p.status === 'active')
  };
}; 